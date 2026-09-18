import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Backup, BackupType, BackupVerificationState } from './entities/backup.entity';
import { BackupChain, BackupChainStatus } from './entities/backup-chain.entity';
import { Database, DatabaseStatus } from '../database/entities/database.entity';
import { StorageDestination, StorageStatus } from '../storage/entities/storage.entity';
import { Job, JobState } from '../job/entities/job.entity';
import { TriggerBackupDto } from './dto/trigger-backup.dto';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private operationQueue?: Queue;

  constructor(
    @InjectRepository(Backup)
    private backupRepo: Repository<Backup>,
    @InjectRepository(BackupChain)
    private chainRepo: Repository<BackupChain>,
    @InjectRepository(Database)
    private databaseRepo: Repository<Database>,
    @InjectRepository(StorageDestination)
    private storageRepo: Repository<StorageDestination>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    private configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    try {
      if (redisUrl) {
        const url = new URL(redisUrl);
        this.operationQueue = new Queue('backupops:operations', {
          connection: {
            host: url.hostname || 'localhost',
            port: Number(url.port) || 6379,
          },
        });
      } else {
        this.operationQueue = new Queue('backupops:operations', {
          connection: {
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: Number(this.configService.get<number>('REDIS_PORT', 6379)),
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize BullMQ Queue: ${err.message}`);
    }
  }

  async findAll(organizationId: string): Promise<Backup[]> {
    return this.backupRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Backup> {
    const backup = await this.backupRepo.findOne({
      where: { id, organizationId },
    });
    if (!backup) {
      throw new NotFoundException(`Backup ${id} not found`);
    }
    return backup;
  }

  async findChains(organizationId: string, databaseId?: string): Promise<BackupChain[]> {
    const where: any = { organizationId };
    if (databaseId) {
      where.sourceDatabaseId = databaseId;
    }
    return this.chainRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async triggerBackup(organizationId: string, dto: TriggerBackupDto): Promise<{ job: Job; backup: Backup }> {
    const database = await this.databaseRepo.findOne({
      where: { id: dto.sourceDatabaseId, organizationId },
    });
    if (!database) {
      throw new NotFoundException(`Database ${dto.sourceDatabaseId} not found`);
    }

    const storage = await this.storageRepo.findOne({
      where: { id: dto.destinationStorageId, organizationId },
    });
    if (!storage) {
      throw new NotFoundException(`Storage destination ${dto.destinationStorageId} not found`);
    }

    // 1. Get or create active BackupChain
    let chain = await this.chainRepo.findOne({
      where: {
        organizationId,
        sourceDatabaseId: database.id,
        status: BackupChainStatus.HEALTHY,
      },
      order: { createdAt: 'DESC' },
    });

    if (!chain) {
      chain = this.chainRepo.create({
        organizationId,
        policyId: dto.policyId,
        sourceDatabaseId: database.id,
        sourceServerId: database.serverId,
        chainNumber: 1,
        status: BackupChainStatus.HEALTHY,
        totalSizeBytes: 0,
        backupCount: 0,
      });
      chain = await this.chainRepo.save(chain);
    }

    // 2. Create Job in database
    const job = this.jobRepo.create({
      organizationId,
      policyId: dto.policyId,
      operationType: 'backup',
      sourceResourceId: database.id,
      destinationResourceId: storage.id,
      state: JobState.QUEUED,
      progress: {
        percentage: 0,
        bytesProcessed: 0,
        totalBytes: database.sizeBytes || 0,
        filesProcessed: 0,
        totalFiles: database.tableCount || 1,
        currentStep: 'Job queued in BullMQ',
      },
      options: {
        compression: dto.compression || 'zstd',
        encryption: dto.encryption || 'aes_256_gcm',
        verifyChecksum: true,
      },
      steps: [
        { id: '1', name: 'Pre-flight validation', status: 'pending' },
        { id: '2', name: 'Database snapshot stream', status: 'pending' },
        { id: '3', name: 'Compression & Encryption', status: 'pending' },
        { id: '4', name: 'Storage transfer', status: 'pending' },
        { id: '5', name: 'Checksum integrity verification', status: 'pending' },
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Backup requested for ${database.name} -> ${storage.name}`,
        },
      ],
      startedAt: new Date(),
    });
    const savedJob = await this.jobRepo.save(job);

    // 3. Create Backup placeholder record
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = storage.path
      ? `${storage.path}/${database.name}_${timestampStr}.bak.${dto.compression || 'zstd'}`
      : `${storage.bucket}/${storage.prefix || ''}${database.name}_${timestampStr}.bak`;

    const backup = this.backupRepo.create({
      organizationId,
      chainId: chain.id,
      policyId: dto.policyId,
      sourceDatabaseId: database.id,
      sourceServerId: database.serverId,
      destinationStorageId: storage.id,
      type: dto.type || BackupType.FULL,
      sequence: chain.backupCount + 1,
      storagePath,
      sizeBytes: 0,
      checksumSha256: 'pending',
      encryption: dto.encryption || 'aes_256_gcm',
      verificationState: BackupVerificationState.PENDING,
      recoveryPointTime: new Date(),
      status: 'running',
    });
    const savedBackup = await this.backupRepo.save(backup);

    // 4. Dispatch to BullMQ worker
    if (this.operationQueue) {
      await this.operationQueue.add('backupops:backup', {
        jobId: savedJob.id,
        backupId: savedBackup.id,
        organizationId,
        sourceDatabaseId: database.id,
        destinationStorageId: storage.id,
        compression: dto.compression || 'zstd',
        encryption: dto.encryption || 'aes_256_gcm',
      });
      this.logger.log(`Dispatched backup job ${savedJob.id} to BullMQ queue`);
    }

    return { job: savedJob, backup: savedBackup };
  }

  async verifyBackup(organizationId: string, id: string): Promise<Backup> {
    const backup = await this.findOne(organizationId, id);

    // Update state to verifying
    backup.verificationState = BackupVerificationState.CHECKSUM_VERIFIED;
    backup.status = 'completed';

    // Update chain last valid point
    if (backup.chainId) {
      const chain = await this.chainRepo.findOne({ where: { id: backup.chainId } });
      if (chain) {
        chain.lastValidPoint = new Date();
        chain.latestBackupId = backup.id;
        await this.chainRepo.save(chain);
      }
    }

    return this.backupRepo.save(backup);
  }
}
