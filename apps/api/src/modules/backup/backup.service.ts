import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
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
import { NotificationService } from '../notification/notification.service';

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
    @Optional()
    private readonly notificationService?: NotificationService,
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

    // 1. Determine Chain and Parentage
    const requestedType = dto.type || BackupType.FULL;
    let chain = await this.chainRepo.findOne({
      where: {
        organizationId,
        sourceDatabaseId: database.id,
        status: BackupChainStatus.HEALTHY,
      },
      order: { createdAt: 'DESC' },
    });

    let effectiveType = requestedType;
    let parentBackupId: string | undefined = undefined;
    let sequence = 1;

    if (requestedType === BackupType.INCREMENTAL || requestedType === BackupType.WAL) {
      if (!chain || !chain.baseBackupId) {
        // Incremental requires a base backup. Start new chain and treat as Full/Base
        this.logger.warn(`Incremental requested for database ${database.name} without prior Base. Elevating to FULL.`);
        effectiveType = BackupType.FULL;
        chain = this.chainRepo.create({
          organizationId,
          policyId: dto.policyId,
          sourceDatabaseId: database.id,
          sourceServerId: database.serverId,
          chainNumber: (chain?.chainNumber || 0) + 1,
          status: BackupChainStatus.HEALTHY,
          totalSizeBytes: 0,
          backupCount: 0,
        });
        chain = await this.chainRepo.save(chain);
      } else {
        parentBackupId = chain.latestBackupId || chain.baseBackupId;
        sequence = (chain.backupCount || 0) + 1;
      }
    } else {
      // Full/Base starts a fresh chain
      chain = this.chainRepo.create({
        organizationId,
        policyId: dto.policyId,
        sourceDatabaseId: database.id,
        sourceServerId: database.serverId,
        chainNumber: (chain?.chainNumber || 0) + 1,
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
          message: `Backup requested (${effectiveType}) for ${database.name} -> ${storage.name}`,
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
      parentBackupId,
      policyId: dto.policyId,
      sourceDatabaseId: database.id,
      sourceServerId: database.serverId,
      destinationStorageId: storage.id,
      type: effectiveType,
      sequence,
      storagePath,
      sizeBytes: 0,
      checksumSha256: 'pending',
      encryption: dto.encryption || 'aes_256_gcm',
      verificationState: BackupVerificationState.PENDING,
      recoveryPointTime: new Date(),
      status: 'running',
    });
    const savedBackup = await this.backupRepo.save(backup);

    // Update chain references
    if (effectiveType === BackupType.FULL || effectiveType === BackupType.BASE) {
      chain.baseBackupId = savedBackup.id;
    }
    chain.latestBackupId = savedBackup.id;
    chain.backupCount = sequence;
    await this.chainRepo.save(chain);

    // Dispatch domain event: backup.started
    this.notificationService?.dispatchEvent(organizationId, 'backup.started', {
      backupId: savedBackup.id,
      database: database.name,
      type: effectiveType,
      storage: storage.name,
    });

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

    const saved = await this.backupRepo.save(backup);

    // Dispatch domain event: backup.completed
    this.notificationService?.dispatchEvent(organizationId, 'backup.completed', {
      backupId: saved.id,
      databaseId: saved.sourceDatabaseId,
      type: saved.type,
      sizeBytes: saved.sizeBytes,
    });

    return saved;
  }

  async getRestorePlan(organizationId: string, id: string) {
    const backup = await this.findOne(organizationId, id);

    let chain: BackupChain | null = null;
    if (backup.chainId) {
      chain = await this.chainRepo.findOne({ where: { id: backup.chainId } });
    }

    // Determine required recovery chain
    let requiredBackups: Backup[] = [];
    let chainStatus = 'HEALTHY';
    let canRestore = true;
    let brokenReason: string | undefined = undefined;

    if (backup.type === BackupType.FULL || backup.type === BackupType.BASE) {
      requiredBackups = [backup];
    } else {
      // Trace chain from base up to this backup's sequence
      const chainBackups = await this.backupRepo.find({
        where: {
          organizationId,
          chainId: backup.chainId,
        },
        order: { sequence: 'ASC' },
      });

      // Filter only up to the target backup sequence
      const relevant = chainBackups.filter((b) => b.sequence <= backup.sequence);

      // Check continuity
      if (relevant.length === 0 || relevant[0].type !== BackupType.FULL && relevant[0].type !== BackupType.BASE) {
        chainStatus = 'BROKEN';
        canRestore = false;
        brokenReason = 'Missing base backup in recovery chain.';
      } else {
        // Verify sequence integrity
        for (let i = 0; i < relevant.length; i++) {
          if (relevant[i].sequence !== i + 1) {
            chainStatus = 'BROKEN';
            canRestore = false;
            brokenReason = `Sequence gap detected: expected #${i + 1} but found #${relevant[i].sequence}`;
            break;
          }
          if (relevant[i].status === 'failed' || relevant[i].verificationState === BackupVerificationState.FAILED) {
            chainStatus = 'BROKEN';
            canRestore = false;
            brokenReason = `Backup #${relevant[i].sequence} (${relevant[i].id}) failed verification.`;
            break;
          }
        }
      }

      requiredBackups = relevant;
    }

    // Calculate cumulative size and storage locations
    let totalRestoreSizeBytes = 0;
    const storageLocations: Array<{
      sequence: number;
      type: string;
      storagePath: string;
      sizeBytes: number;
      verificationState: string;
    }> = [];

    for (const b of requiredBackups) {
      totalRestoreSizeBytes += Number(b.sizeBytes || 0);
      storageLocations.push({
        sequence: b.sequence,
        type: b.type,
        storagePath: b.storagePath,
        sizeBytes: Number(b.sizeBytes || 0),
        verificationState: b.verificationState,
      });
    }

    // Minimum 10s or estimate ~40MB/s
    const estimatedRestoreTimeSeconds = Math.max(10, Math.ceil(totalRestoreSizeBytes / (40 * 1024 * 1024)));

    return {
      targetBackup: backup,
      chain,
      requiredBackups,
      totalRestoreSizeBytes,
      storageLocations,
      chainStatus,
      canRestore,
      brokenReason,
      estimatedRestoreTimeSeconds,
      verificationState: backup.verificationState,
    };
  }
}

