import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestoreJob, RestoreJobState } from './entities/restore-job.entity';
import { Backup } from '../backup/entities/backup.entity';
import { CreateRestoreJobDto } from './dto/create-restore.dto';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RestoreService {
  private readonly logger = new Logger(RestoreService.name);
  private operationQueue?: Queue;

  constructor(
    @InjectRepository(RestoreJob)
    private restoreRepo: Repository<RestoreJob>,
    @InjectRepository(Backup)
    private backupRepo: Repository<Backup>,
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
        this.operationQueue.on('error', (err) => {
          this.logger.warn(`BullMQ restore queue warning: ${err.message}`);
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize BullMQ Queue: ${err.message}`);
    }
  }

  async findAll(organizationId: string): Promise<RestoreJob[]> {
    return this.restoreRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<RestoreJob> {
    const job = await this.restoreRepo.findOne({
      where: { id, organizationId },
    });
    if (!job) {
      throw new NotFoundException(`Restore job ${id} not found`);
    }
    return job;
  }

  async create(organizationId: string, dto: CreateRestoreJobDto): Promise<RestoreJob> {
    if (!dto.overwriteConfirmed) {
      throw new BadRequestException(
        'Destructive restore requires explicit confirmation. Please confirm you understand that target data will be overwritten.',
      );
    }

    const backup = await this.backupRepo.findOne({
      where: { id: dto.backupId, organizationId },
    });
    if (!backup) {
      throw new NotFoundException(`Backup ${dto.backupId} not found`);
    }

    const restoreJob = this.restoreRepo.create({
      organizationId,
      backupId: backup.id,
      targetType: dto.targetType,
      targetServerId: dto.targetServerId || backup.sourceServerId,
      targetDatabaseId: dto.targetDatabaseId || backup.sourceDatabaseId,
      targetPath: dto.targetPath,
      pointInTimeTarget: dto.pointInTimeTarget ? new Date(dto.pointInTimeTarget) : undefined,
      overwriteConfirmed: true,
      state: RestoreJobState.QUEUED,
      progressPercent: 0,
      currentStep: 'Restore queued in queue',
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Restore requested from backup ${backup.id} (${backup.storagePath}) to target ${dto.targetType}`,
        },
      ],
      startedAt: new Date(),
    });

    const saved = await this.restoreRepo.save(restoreJob);

    if (this.operationQueue) {
      await this.operationQueue.add('backupops:restore', {
        restoreJobId: saved.id,
        backupId: backup.id,
        organizationId,
        storagePath: backup.storagePath,
        targetType: dto.targetType,
      });
      this.logger.log(`Dispatched restore job ${saved.id} to BullMQ queue`);
    }

    return saved;
  }
}
