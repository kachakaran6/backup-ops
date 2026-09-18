import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StorageDestination,
  StorageStatus,
  StorageType,
} from './entities/storage.entity';
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
    private localProvider: LocalStorageProvider,
    private s3Provider: S3StorageProvider,
    private credentialService: CredentialService,
  ) {}

  async findAll(organizationId: string): Promise<StorageDestination[]> {
    return this.storageRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
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
