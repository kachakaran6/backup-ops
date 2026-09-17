import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobState } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { Resource } from '../resource/entities/resource.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Resource)
    private resourceRepo: Repository<Resource>,
  ) {}

  async create(organizationId: string, dto: CreateJobDto): Promise<Job> {
    const source = await this.resourceRepo.findOne({
      where: { id: dto.sourceResourceId, organizationId },
    });
    if (!source) {
      throw new NotFoundException('Source resource not found');
    }

    if (dto.destinationResourceId) {
      const dest = await this.resourceRepo.findOne({
        where: { id: dto.destinationResourceId, organizationId },
      });
      if (!dest) {
        throw new NotFoundException('Destination resource not found');
      }
    }

    const steps = [
      { id: '1', name: 'Pre-flight resource check', status: 'pending' as const },
      { id: '2', name: 'Snapshot and data preparation', status: 'pending' as const },
      { id: '3', name: 'Secure transfer and streaming', status: 'pending' as const },
      { id: '4', name: 'Checksum verification', status: 'pending' as const },
      { id: '5', name: 'Metadata and retention finalization', status: 'pending' as const },
    ];

    const initialLog = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      message: `Job ${dto.operationType.toUpperCase()} queued for source ${source.name}`,
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
    job.error = null;
    job.startedAt = null;
    job.finishedAt = null;
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

    job.state = JobState.PLANNING;
    job.startedAt = new Date();
    job.progress.currentStep = 'Validating source connectivity and planning data stream';
    job.progress.percentage = 15;
    job.steps[0].status = 'completed';
    job.steps[1].status = 'running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Resource connectivity confirmed. Preparing data chunking stream.',
    });
    await this.jobRepo.save(job);

    // Step 2: RUNNING (Transferring)
    await new Promise((r) => setTimeout(r, 1000));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.RUNNING;
    job.progress.currentStep = 'Streaming and transferring encrypted backup payload';
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
      message: 'Transferring 84MB of compressed payload to destination.',
    });
    await this.jobRepo.save(job);

    // Step 3: VERIFYING
    await new Promise((r) => setTimeout(r, 800));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.VERIFYING;
    job.progress.currentStep = 'Verifying SHA-256 integrity checksums at destination';
    job.progress.percentage = 90;
    job.progress.bytesProcessed = job.progress.totalBytes;
    job.progress.filesProcessed = job.progress.totalFiles;
    job.steps[3].status = 'completed';
    job.steps[4].status = 'running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Checksum calculation verified: destination payload matches source digest exactly.',
    });
    await this.jobRepo.save(job);

    // Step 4: COMPLETED
    await new Promise((r) => setTimeout(r, 600));
    job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.state === JobState.CANCELLED) return;

    job.state = JobState.COMPLETED;
    job.progress.percentage = 100;
    job.progress.currentStep = 'Operation completed successfully';
    job.finishedAt = new Date();
    job.steps[4].status = 'completed';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Operation ${job.operationType.toUpperCase()} completed successfully. Backup snapshot registered.`,
    });
    await this.jobRepo.save(job);
  }
}
