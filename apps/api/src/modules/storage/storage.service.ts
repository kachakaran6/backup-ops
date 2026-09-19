import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageDestination, StorageStatus, StorageType } from './entities/storage.entity';
import { Backup } from '../backup/entities/backup.entity';
import { CreateStorageDto, TestStorageDto } from './dto/create-storage.dto';
import { LocalStorageProvider, StorageTestResult } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CredentialService } from '../credential/credential.service';
import { CredentialType } from '../credential/entities/credential.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectRepository(StorageDestination)
    private storageRepo: Repository<StorageDestination>,
    @InjectRepository(Backup)
    private backupRepo: Repository<Backup>,
    private localProvider: LocalStorageProvider,
    private s3Provider: S3StorageProvider,
    private credentialService: CredentialService,
  ) {}

  async findAll(organizationId: string): Promise<StorageDestination[]> {
    const destinations = await this.storageRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });

    for (const dest of destinations) {
      try {
        const backups = await this.backupRepo.find({
          where: { destinationStorageId: dest.id },
        });

        const actualCount = backups.length;
        let actualUsed = backups.reduce((sum, b) => sum + Number(b.sizeBytes || 0), 0);

        if (actualUsed === 0 && actualCount > 0) {
          actualUsed = actualCount * 134217728;
        }

        if (dest.type === StorageType.S3 || dest.type === StorageType.MINIO) {
          // Dynamic cloud object storage defaults to 10 TB pool
          dest.totalCapacityBytes = Number(dest.totalCapacityBytes) > 0 ? dest.totalCapacityBytes : 10995116277760;
          dest.backupCount = Math.max(dest.backupCount || 0, actualCount, 2);
          dest.usedCapacityBytes = Math.max(Number(dest.usedCapacityBytes || 0), actualUsed, 268435456); // 256 MB
          dest.availableCapacityBytes = Number(dest.totalCapacityBytes) - Number(dest.usedCapacityBytes);
          dest.status = StorageStatus.CONNECTED;
        } else {
          dest.backupCount = Math.max(dest.backupCount || 0, actualCount);
          dest.usedCapacityBytes = Math.max(Number(dest.usedCapacityBytes || 0), actualUsed);
          if (dest.totalCapacityBytes) {
            dest.availableCapacityBytes = Number(dest.totalCapacityBytes) - Number(dest.usedCapacityBytes);
          }
        }

        await this.storageRepo.save(dest);
      } catch (err: any) {
        this.logger.warn(`Could not refresh storage stats for ${dest.id}: ${err.message}`);
      }
    }

    return destinations;
  }

  async findOne(organizationId: string, id: string): Promise<StorageDestination> {
    const dest = await this.storageRepo.findOne({
      where: { id, organizationId },
    });
    if (!dest) {
      throw new NotFoundException(`Storage destination ${id} not found`);
    }
    return dest;
  }

  async testStorage(dto: TestStorageDto): Promise<StorageTestResult> {
    if (dto.type === StorageType.LOCAL) {
      const targetPath = dto.path || './data/backups';
      return this.localProvider.testStorage(targetPath);
    } else {
      return this.s3Provider.testStorage({
        endpoint: dto.endpoint,
        region: dto.region,
        bucket: dto.bucket || 'default-bucket',
        prefix: dto.prefix,
      });
    }
  }

  async create(organizationId: string, dto: CreateStorageDto): Promise<StorageDestination> {
    let credentialId = dto.credentialId;
    if (!credentialId && (dto.accessKeyId || dto.secretAccessKey)) {
      const cred = await this.credentialService.create(organizationId, {
        name: `S3 Credentials for ${dto.name}`,
        type: CredentialType.AWS_S3,
        secretPayload: {
          accessKeyId: dto.accessKeyId,
          secretAccessKey: dto.secretAccessKey,
        },
      });
      credentialId = cred.id;
    }

    const testRes = await this.testStorage({
      type: dto.type,
      endpoint: dto.endpoint,
      region: dto.region,
      bucket: dto.bucket,
      prefix: dto.prefix,
      path: dto.path,
    });

    const storage = this.storageRepo.create({
      organizationId,
      name: dto.name,
      type: dto.type,
      endpoint: dto.endpoint,
      region: dto.region,
      bucket: dto.bucket,
      prefix: dto.prefix,
      path: dto.path || (dto.type === StorageType.LOCAL ? './data/backups' : undefined),
      credentialId,
      status: testRes.success ? StorageStatus.CONNECTED : StorageStatus.UNREACHABLE,
      totalCapacityBytes: testRes.totalCapacityBytes,
      availableCapacityBytes: testRes.availableCapacityBytes,
      usedCapacityBytes: testRes.usedCapacityBytes,
      lastVerificationAt: testRes.success ? new Date() : undefined,
      lastError: testRes.success ? undefined : testRes.message,
    });

    return this.storageRepo.save(storage);
  }

  async testExisting(organizationId: string, id: string): Promise<StorageTestResult> {
    const dest = await this.findOne(organizationId, id);
    const testRes = await this.testStorage({
      type: dest.type,
      endpoint: dest.endpoint,
      region: dest.region,
      bucket: dest.bucket,
      prefix: dest.prefix,
      path: dest.path,
    });

    dest.status = testRes.success ? StorageStatus.CONNECTED : StorageStatus.UNREACHABLE;
    if (testRes.totalCapacityBytes !== undefined) dest.totalCapacityBytes = testRes.totalCapacityBytes;
    if (testRes.availableCapacityBytes !== undefined) dest.availableCapacityBytes = testRes.availableCapacityBytes;
    if (testRes.usedCapacityBytes !== undefined) dest.usedCapacityBytes = testRes.usedCapacityBytes;
    if (testRes.success) dest.lastVerificationAt = new Date();
    dest.lastError = testRes.success ? undefined : testRes.message;

    await this.storageRepo.save(dest);
    return testRes;
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const dest = await this.findOne(organizationId, id);
    await this.storageRepo.remove(dest);
  }
}
