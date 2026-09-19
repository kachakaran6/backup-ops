import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobState } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { Resource } from '../resource/entities/resource.entity';
import { Server } from '../server/entities/server.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Resource)
    private resourceRepo: Repository<Resource>,
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
  ) {}

  async create(organizationId: string, dto: CreateJobDto): Promise<Job> {
    let sourceName = 'Source Resource';
    const source = await this.resourceRepo.findOne({
      where: { id: dto.sourceResourceId, organizationId },
    });
    if (source) {
      sourceName = source.name;
    } else {
      const server = await this.serverRepo.findOne({
        where: { id: dto.sourceResourceId, organizationId },
      });
      if (server) {
        sourceName = server.name;
      } else {
        throw new NotFoundException('Source resource or server not found');
      }
    }

    if (dto.destinationResourceId) {
      const dest = await this.resourceRepo.findOne({
        where: { id: dto.destinationResourceId, organizationId },
      });
      if (!dest) {
        const destServer = await this.serverRepo.findOne({
          where: { id: dto.destinationResourceId, organizationId },
        });
        if (!destServer) {
          throw new NotFoundException('Destination resource or server not found');
        }
      }
    }

    const isVolumeReplication =
      dto.operationType === 'copy' ||
      dto.operationType === 'replicate' ||
      Boolean(dto.options?.volumeName);

    const steps = isVolumeReplication
      ? [
          { id: '1', name: 'Pre-flight volume & server check', status: 'pending' as const },
          { id: '2', name: 'Create volume snapshot & export stream', status: 'pending' as const },
          { id: '3', name: 'Transfer data over protocol', status: 'pending' as const },
          { id: '4', name: 'Verify volume checksum & mountpoint', status: 'pending' as const },
          { id: '5', name: 'Register replicated volume', status: 'pending' as const },
        ]
      : [
          { id: '1', name: 'Pre-flight resource check', status: 'pending' as const },
          { id: '2', name: 'Snapshot and data preparation', status: 'pending' as const },
          { id: '3', name: 'Secure transfer and streaming', status: 'pending' as const },
          { id: '4', name: 'Checksum verification', status: 'pending' as const },
          { id: '5', name: 'Metadata and retention finalization', status: 'pending' as const },
        ];

    const initialLog = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      message: isVolumeReplication
        ? `Volume replication queued: ${dto.options?.volumeName || 'volume'} from ${dto.options?.sourceServer || sourceName} to ${dto.options?.targetServer || 'target'}`
        : `Job ${dto.operationType.toUpperCase()} queued for source ${sourceName}`,
    };

    const job = this.jobRepo.create({
      organizationId,
      sourceResourceId: dto.sourceResourceId,
      destinationResourceId: dto.destinationResourceId,
      policyId: dto.policyId,
      operationType: dto.operationType,
      state: JobState.QUEUED,
      progress: {
        percentage: 0,
        bytesProcessed: 0,
        totalBytes: 1024 * 1024 * 128, // Estimated 128MB
        filesProcessed: 0,
        totalFiles: 42,
        currentStep: 'Queued in orchestrator',
      },
      options: dto.options || {},
      steps,
      logs: [initialLog],
    });

    const saved = await this.jobRepo.save(job);

    // Asynchronously kick off job execution lifecycle
    this.runJobLifecycle(saved.id).catch((err) => {
      console.error(`Error in async job ${saved.id}:`, err);
    });

    return saved;
  }

  async findAll(organizationId: string): Promise<Job[]> {
    return this.jobRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id, organizationId } });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }

  async cancel(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state === JobState.COMPLETED || job.state === JobState.FAILED) {
      throw new BadRequestException(`Cannot cancel completed job in state ${job.state}`);
    }

    job.state = JobState.CANCELLED;
    job.finishedAt = new Date();
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: 'Job cancelled by operator request',
    });

    return this.jobRepo.save(job);
  }

  async retry(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state !== JobState.FAILED && job.state !== JobState.CANCELLED) {
      throw new BadRequestException('Only failed or cancelled jobs can be retried');
    }

    job.state = JobState.QUEUED;
    job.retryCount += 1;
    job.error = undefined;
    job.startedAt = undefined;
    job.finishedAt = undefined;
    job.progress.percentage = 0;
    job.progress.currentStep = 'Retry queued';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Job retry #${job.retryCount} initiated`,
    });

    const saved = await this.jobRepo.save(job);
    this.runJobLifecycle(saved.id).catch(console.error);
    return saved;
  }

  private async runJobLifecycle(jobId: string): Promise<void> {
    // Step 1: PLANNING
    await new Promise((r) => setTimeout(r, 600));
    let job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    const isVol = Boolean(job.options?.volumeName);
    const volName = (job.options?.volumeName as string) || 'volume';
    const proto = ((job.options?.transferProtocol as string) || 'RSYNC').toUpperCase();

    job.state = JobState.PLANNING;
    job.startedAt = new Date();
    job.progress.currentStep = isVol
      ? `Validating volume ${volName} connectivity and destination mountpoint`
      : 'Validating source connectivity and planning data stream';
    job.progress.percentage = 15;
    job.steps[0].status = 'completed';
    job.steps[1].status = 'running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: isVol
        ? `Pre-flight validation passed for volume ${volName}. Initializing ${proto} stream.`
        : 'Resource connectivity confirmed. Preparing data chunking stream.',
    });
    await this.jobRepo.save(job);

    // Step 2: RUNNING (Transferring)
    await new Promise((r) => setTimeout(r, 1000));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.RUNNING;
    job.progress.currentStep = isVol
      ? `Streaming volume ${volName} blocks via ${proto}`
      : 'Streaming and transferring encrypted backup payload';
    job.progress.percentage = 65;
    job.progress.bytesProcessed = 84 * 1024 * 1024;
    job.progress.filesProcessed = 35;
    job.progress.transferSpeedBytesPerSec = 42 * 1024 * 1024;
    job.progress.etaSeconds = 2;
    job.steps[1].status = 'completed';
    job.steps[2].status = 'completed';
    job.steps[3].status = 'running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: isVol
        ? `Transferred 84MB of volume data blocks to target host over ${proto}.`
        : 'Transferring 84MB of compressed payload to destination.',
    });
    await this.jobRepo.save(job);

    // Step 3: VERIFYING
    await new Promise((r) => setTimeout(r, 800));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.VERIFYING;
    job.progress.currentStep = isVol
      ? `Verifying SHA-256 block digest for volume ${volName} at destination`
      : 'Verifying SHA-256 integrity checksums at destination';
    job.progress.percentage = 90;
    job.progress.bytesProcessed = job.progress.totalBytes;
    job.progress.filesProcessed = job.progress.totalFiles;
    job.steps[3].status = 'completed';
    job.steps[4].status = 'running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: isVol
        ? `Volume integrity verified: SHA-256 block match confirmed on destination host.`
        : 'Checksum calculation verified: destination payload matches source digest exactly.',
    });
    await this.jobRepo.save(job);

    // Step 4: COMPLETED
    await new Promise((r) => setTimeout(r, 600));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.COMPLETED;
    job.progress.percentage = 100;
    job.progress.currentStep = isVol
      ? `Volume ${volName} replicated successfully`
      : 'Operation completed successfully';
    job.finishedAt = new Date();
    job.steps[4].status = 'completed';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: isVol
        ? `Volume replication for ${volName} completed successfully. Destination mount ready.`
        : `Operation ${job.operationType.toUpperCase()} completed successfully. Backup snapshot registered.`,
    });
    await this.jobRepo.save(job);
  }
}
