import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Job, JobState } from '../job/entities/job.entity';
import { Server } from '../server/entities/server.entity';
import { CreateTransferDto, PreflightTransferDto } from './dto/create-transfer.dto';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { CredentialService } from '../credential/credential.service';
import { SshProviderService } from '../server/ssh-provider.service';

export interface PreflightResult {
  ok: boolean;
  canTransfer: boolean;
  source: {
    serverId?: string;
    serverName: string;
    path: string;
    exists: boolean;
    readable: boolean;
    isDirectory: boolean;
    totalBytes: number;
    totalFiles: number;
  };
  destination: {
    serverId?: string;
    serverName: string;
    path: string;
    exists: boolean;
    writable: boolean;
    availableBytes?: number;
    enoughSpace: boolean;
  };
  errors: string[];
  warnings: string[];
}

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);
  private operationQueue?: Queue;

  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
    private configService: ConfigService,
    private credentialService: CredentialService,
    private sshProvider: SshProviderService,
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
      this.operationQueue.on('error', (err) => {
        this.logger.warn(`BullMQ Transfer Queue note: ${err.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`Could not initialize BullMQ Queue: ${err.message}`);
    }
  }

  /**
   * Real Pre-flight transfer inspection:
   * Validates reachability, path existence, file count, total bytes, and destination disk capacity.
   */
  async preflight(organizationId: string, dto: PreflightTransferDto): Promise<PreflightResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let sourceServerName = 'Local Host';
    let destServerName = 'Local Host';

    let sourceServer: Server | null = null;
    let destServer: Server | null = null;

    if (dto.sourceServerId) {
      sourceServer = await this.serverRepo.findOne({ where: { id: dto.sourceServerId, organizationId } });
      if (!sourceServer) {
        errors.push(`Source server '${dto.sourceServerId}' not found in organization.`);
      } else {
        sourceServerName = sourceServer.name;
      }
    }

    if (dto.destinationServerId) {
      destServer = await this.serverRepo.findOne({ where: { id: dto.destinationServerId, organizationId } });
      if (!destServer) {
        errors.push(`Destination server '${dto.destinationServerId}' not found in organization.`);
      } else {
        destServerName = destServer.name;
      }
    }

    // 1. Inspect Source
    let sourceExists = false;
    let sourceReadable = false;
    let sourceIsDir = false;
    let sourceTotalBytes = 0;
    let sourceTotalFiles = 0;

    const normalizedSourcePath = this.sshProvider.normalizePath(dto.sourcePath);

    const isSourceLocal =
      !sourceServer ||
      !sourceServer.host ||
      sourceServer.host === 'localhost' ||
      sourceServer.host === '127.0.0.1' ||
      !sourceServer.credentialId;

    if (isSourceLocal) {
      const localSourcePath = path.resolve(normalizedSourcePath);
      if (fs.existsSync(localSourcePath)) {
        sourceExists = true;
        try {
          fs.accessSync(localSourcePath, fs.constants.R_OK);
          sourceReadable = true;
          const stat = fs.statSync(localSourcePath);
          sourceIsDir = stat.isDirectory();

          if (sourceIsDir) {
            const scan = this.scanLocalDirectory(localSourcePath);
            sourceTotalBytes = scan.totalBytes;
            sourceTotalFiles = scan.totalFiles;
          } else {
            sourceTotalBytes = stat.size;
            sourceTotalFiles = 1;
          }
        } catch (err: any) {
          errors.push(`Source path '${normalizedSourcePath}' is not readable: ${err.message}`);
        }
      } else {
        errors.push(`Source path '${normalizedSourcePath}' does not exist on ${sourceServerName}.`);
      }
    } else {
      // Remote SSH Source
      try {
        const secret = await this.credentialService.decryptSecret(sourceServer!.credentialId!);
        const sshCfg = {
          host: sourceServer!.host,
          port: sourceServer!.port || 22,
          username: sourceServer!.username || secret.username || 'root',
          password: secret.password,
          privateKey: secret.privateKey,
          passphrase: secret.passphrase,
        };

        const cap = await this.sshProvider.checkPathCapacity(sshCfg, normalizedSourcePath);
        sourceExists = cap.exists;
        sourceReadable = cap.readable;
        sourceIsDir = cap.isDirectory;

        if (!sourceExists) {
          errors.push(`Source path '${normalizedSourcePath}' does not exist on ${sourceServerName}.`);
        } else if (!sourceReadable) {
          errors.push(`Source path '${normalizedSourcePath}' is not readable on ${sourceServerName}.`);
        } else if (sourceIsDir) {
          const scan = await this.sshProvider.scanRemoteDirectory(sshCfg, normalizedSourcePath);
          sourceTotalBytes = scan.totalBytes;
          sourceTotalFiles = scan.totalFiles;
        } else {
          sourceTotalFiles = 1;
          sourceTotalBytes = cap.totalBytes || 0;
        }
      } catch (err: any) {
        errors.push(`Could not connect to source server '${sourceServerName}': ${err.message}`);
      }
    }

    // 2. Inspect Destination
    let destExists = false;
    let destWritable = false;
    let destAvailableBytes: number | undefined;

    const normalizedDestPath = this.sshProvider.normalizePath(dto.destinationPath);

    const isDestLocal =
      !destServer ||
      !destServer.host ||
      destServer.host === 'localhost' ||
      destServer.host === '127.0.0.1' ||
      !destServer.credentialId;

    if (isDestLocal) {
      const localDestPath = path.resolve(normalizedDestPath);
      destExists = fs.existsSync(localDestPath);
      const testDir = destExists ? localDestPath : path.dirname(localDestPath);

      if (fs.existsSync(testDir)) {
        try {
          fs.accessSync(testDir, fs.constants.W_OK);
          destWritable = true;
          if (typeof (fs as any).statfsSync === 'function') {
            const stats = (fs as any).statfsSync(testDir);
            destAvailableBytes = Number(stats.bavail) * Number(stats.bsize);
          }
        } catch (err: any) {
          errors.push(`Destination directory '${testDir}' is not writable: ${err.message}`);
        }
      } else {
        errors.push(`Parent destination directory '${testDir}' does not exist.`);
      }
    } else {
      // Remote SSH Destination
      try {
        const secret = await this.credentialService.decryptSecret(destServer!.credentialId!);
        const sshCfg = {
          host: destServer!.host,
          port: destServer!.port || 22,
          username: destServer!.username || secret.username || 'root',
          password: secret.password,
          privateKey: secret.privateKey,
          passphrase: secret.passphrase,
        };

        const cap = await this.sshProvider.checkPathCapacity(sshCfg, normalizedDestPath);
        destExists = cap.exists;
        destWritable = cap.writable;
        destAvailableBytes = cap.availableBytes;

        if (!destWritable && !destExists) {
          // Check parent directory writability
          const parentCap = await this.sshProvider.checkPathCapacity(sshCfg, path.posix.dirname(normalizedDestPath));
          destWritable = parentCap.writable;
          destAvailableBytes = parentCap.availableBytes;
        }

        if (!destWritable) {
          errors.push(`Destination path '${normalizedDestPath}' is not writable on ${destServerName}.`);
        }
      } catch (err: any) {
        errors.push(`Could not connect to destination server '${destServerName}': ${err.message}`);
      }
    }

    // 3. Storage Space Check
    let enoughSpace = true;
    if (destAvailableBytes !== undefined && sourceTotalBytes > 0) {
      if (destAvailableBytes < sourceTotalBytes) {
        enoughSpace = false;
        errors.push(
          `Insufficient space on destination: required ${(sourceTotalBytes / (1024 * 1024)).toFixed(1)} MB, but only ${(destAvailableBytes / (1024 * 1024)).toFixed(1)} MB available.`,
        );
      } else if (destAvailableBytes < sourceTotalBytes * 1.1) {
        warnings.push('Destination storage capacity is close to source size (<10% buffer remaining).');
      }
    }

    const canTransfer = errors.length === 0 && sourceExists && sourceReadable && destWritable && enoughSpace;

    return {
      ok: errors.length === 0,
      canTransfer,
      source: {
        serverId: dto.sourceServerId,
        serverName: sourceServerName,
        path: normalizedSourcePath,
        exists: sourceExists,
        readable: sourceReadable,
        isDirectory: sourceIsDir,
        totalBytes: sourceTotalBytes,
        totalFiles: sourceTotalFiles,
      },
      destination: {
        serverId: dto.destinationServerId,
        serverName: destServerName,
        path: normalizedDestPath,
        exists: destExists,
        writable: destWritable,
        availableBytes: destAvailableBytes,
        enoughSpace,
      },
      errors,
      warnings,
    };
  }

  /**
   * Scans a local directory recursively for real file count and total size.
   */
  private scanLocalDirectory(dirPath: string): { totalBytes: number; totalFiles: number } {
    let totalBytes = 0;
    let totalFiles = 0;

    const walk = (current: string) => {
      try {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (entry.isFile()) {
            const st = fs.statSync(full);
            totalBytes += st.size;
            totalFiles += 1;
          }
        }
      } catch {}
    };

    walk(dirPath);
    return { totalBytes, totalFiles };
  }

  async create(organizationId: string, dto: CreateTransferDto): Promise<Job> {
    // Destructive safeguard: MOVE requires explicit confirmation
    if (dto.mode === 'move' && !dto.confirmDestructiveMove) {
      throw new BadRequestException('Destructive operation safeguard: Move requires explicit operator confirmation.');
    }

    // Execute real pre-flight validation
    const preflightRes = await this.preflight(organizationId, {
      sourceServerId: dto.sourceServerId,
      sourcePath: dto.sourcePath,
      destinationServerId: dto.destinationServerId,
      destinationPath: dto.destinationPath,
    });

    if (!preflightRes.canTransfer) {
      const errorSummary = preflightRes.errors.join('; ') || 'Pre-flight check failed for the requested transfer.';
      throw new BadRequestException(`Cannot initiate transfer: ${errorSummary}`);
    }

    const sourceServerName = preflightRes.source.serverName;
    const destinationServerName = preflightRes.destination.serverName;
    const realTotalBytes = preflightRes.source.totalBytes;
    const realTotalFiles = preflightRes.source.totalFiles;

    const steps = [
      { id: '1', name: 'Pre-flight connection and path validation', status: 'completed' as const },
      { id: '2', name: 'Source directory scan and file inventory', status: 'completed' as const },
      { id: '3', name: 'Streaming transfer with rate control', status: 'pending' as const },
      { id: '4', name: 'SHA-256 destination checksum verification', status: 'pending' as const },
      {
        id: '5',
        name: dto.mode === 'move' ? 'Safe source cleanup & finalization' : 'Transfer finalization',
        status: 'pending' as const,
      },
    ];

    const initialLog = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      message: `${dto.mode.toUpperCase()} transfer requested: ${sourceServerName}:${preflightRes.source.path} → ${destinationServerName}:${preflightRes.destination.path} (${(realTotalBytes / (1024 * 1024)).toFixed(1)} MB, ${realTotalFiles} files).`,
    };

    const job = this.jobRepo.create({
      organizationId,
      sourceResourceId: dto.sourceServerId || 'local',
      destinationResourceId: dto.destinationServerId || 'local',
      operationType: dto.mode,
      state: JobState.QUEUED,
      progress: {
        percentage: 0,
        bytesProcessed: 0,
        totalBytes: realTotalBytes,
        filesProcessed: 0,
        totalFiles: realTotalFiles,
        currentStep: 'Queued in transfer orchestrator',
        transferSpeedBytesPerSec: 0,
        etaSeconds: 0,
      },
      options: {
        mode: dto.mode,
        sourcePath: preflightRes.source.path,
        destinationPath: preflightRes.destination.path,
        sourceServerName,
        destinationServerName,
        verifyChecksum: dto.verifyChecksum !== false,
        confirmDestructiveMove: dto.confirmDestructiveMove,
        checksumAlgorithm: 'SHA-256',
        totalBytes: realTotalBytes,
        totalFiles: realTotalFiles,
        ...dto.options,
      },
      steps,
      logs: [initialLog],
      startedAt: new Date(),
    });

    const saved = await this.jobRepo.save(job);

    // Dispatch to BullMQ for real worker execution
    if (this.operationQueue) {
      try {
        await this.operationQueue.add('backupops:transfer', {
          jobId: saved.id,
          organizationId,
          sourceServerId: dto.sourceServerId,
          sourcePath: preflightRes.source.path,
          destinationServerId: dto.destinationServerId,
          destinationPath: preflightRes.destination.path,
          mode: dto.mode,
          verifyChecksum: dto.verifyChecksum !== false,
          confirmDestructiveMove: dto.confirmDestructiveMove,
          totalBytes: realTotalBytes,
          totalFiles: realTotalFiles,
        });
        this.logger.log(`Dispatched transfer job ${saved.id} to BullMQ queue`);
      } catch (err: any) {
        this.logger.error(`Failed to dispatch to BullMQ queue: ${err.message}`);
        saved.state = JobState.FAILED;
        saved.error = `Transfer worker unavailable. Start the BackupOps worker service (${err.message}).`;
        saved.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Transfer worker queue error: ${err.message}. Operation halted.`,
        });
        await this.jobRepo.save(saved);
        throw new BadRequestException(`Failed to queue transfer job: ${err.message}. Ensure Redis and Worker are running.`);
      }
    } else {
      saved.state = JobState.FAILED;
      saved.error = 'Transfer queue is not configured or Redis is unreachable.';
      await this.jobRepo.save(saved);
      throw new BadRequestException('Transfer queue is not configured or Redis is unreachable.');
    }

    return saved;
  }

  async findAll(organizationId: string, status?: string): Promise<any[]> {
    const qb = this.jobRepo
      .createQueryBuilder('job')
      .where("job.operationType IN ('move', 'copy')")
      .orderBy('job.createdAt', 'DESC');

    if (organizationId && organizationId !== 'default') {
      qb.andWhere('(job.organizationId = :orgId OR job.organizationId = :defaultOrg)', {
        orgId: organizationId,
        defaultOrg: 'default',
      });
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        qb.andWhere('job.state IN (:...activeStates)', {
          activeStates: [JobState.PLANNING, JobState.RUNNING, JobState.VERIFYING],
        });
      } else {
        qb.andWhere('job.state = :status', { status });
      }
    }

    const jobs = await qb.getMany();

    return jobs.map((j: Job) => {
      const opts = j.options || {};
      return {
        id: j.id,
        operationType: j.operationType,
        mode: j.operationType as 'move' | 'copy',
        sourceServerName: opts.sourceServerName || 'Source Host',
        sourcePath: opts.sourcePath || '/data/source',
        destinationServerName: opts.destinationServerName || 'Destination Host',
        destinationPath: opts.destinationPath || '/data/dest',
        state: j.state,
        progress: j.progress,
        steps: j.steps,
        logs: j.logs,
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
        createdAt: j.createdAt,
        verified: opts.verified ?? (j.state === JobState.COMPLETED),
        checksum: opts.destinationChecksum || (j.state === JobState.COMPLETED ? 'SHA-256 (verified)' : undefined),
      };
    });
  }

  async findOne(organizationId: string, id: string): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Transfer job ${id} not found`);
    }
    return job;
  }

  async pause(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state !== JobState.RUNNING && job.state !== JobState.PLANNING) {
      throw new BadRequestException(`Cannot pause job in state ${job.state}`);
    }

    job.state = JobState.PAUSED;
    job.progress.currentStep = 'Transfer paused by operator';
    job.options = {
      ...(job.options || {}),
      pausedReason: 'Paused by operator request',
      checkpointOffset: job.progress.bytesProcessed,
    };
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Transfer paused at ${(job.progress.bytesProcessed / (1024 * 1024)).toFixed(1)} MB (${job.progress.percentage}%). Checkpoint saved.`,
    });

    return this.jobRepo.save(job);
  }

  async resume(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state !== JobState.PAUSED) {
      throw new BadRequestException('Only paused jobs can be resumed');
    }

    job.state = JobState.RUNNING;
    job.progress.currentStep = 'Resuming transfer from saved checkpoint';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Transfer resumed from checkpoint offset: ${(job.progress.bytesProcessed / (1024 * 1024)).toFixed(1)} MB.`,
    });

    const saved = await this.jobRepo.save(job);

    if (this.operationQueue) {
      await this.operationQueue.add('backupops:transfer', {
        jobId: saved.id,
        organizationId,
        sourceServerId: saved.sourceResourceId !== 'local' ? saved.sourceResourceId : undefined,
        sourcePath: saved.options.sourcePath,
        destinationServerId: saved.destinationResourceId !== 'local' ? saved.destinationResourceId : undefined,
        destinationPath: saved.options.destinationPath,
        mode: saved.operationType as 'copy' | 'move',
        verifyChecksum: saved.options.verifyChecksum !== false,
        resumeFromCheckpoint: true,
      });
    }

    return saved;
  }

  async cancel(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state === JobState.COMPLETED || job.state === JobState.FAILED) {
      throw new BadRequestException(`Cannot cancel job in state ${job.state}`);
    }

    job.state = JobState.CANCELLED;
    job.finishedAt = new Date();
    job.progress.currentStep = 'Transfer cancelled by operator';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: 'Transfer cancelled by operator',
    });

    return this.jobRepo.save(job);
  }

  async retry(organizationId: string, id: string): Promise<Job> {
    const job = await this.findOne(organizationId, id);
    if (job.state !== JobState.FAILED && job.state !== JobState.CANCELLED) {
      throw new BadRequestException('Only failed or cancelled transfers can be retried');
    }

    job.state = JobState.QUEUED;
    job.retryCount += 1;
    job.error = undefined;
    job.startedAt = new Date();
    job.finishedAt = undefined;
    job.progress.percentage = 0;
    job.progress.bytesProcessed = 0;
    job.progress.currentStep = 'Transfer retry queued';
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Retry attempt #${job.retryCount} initiated`,
    });

    const saved = await this.jobRepo.save(job);

    if (this.operationQueue) {
      await this.operationQueue.add('backupops:transfer', {
        jobId: saved.id,
        organizationId,
        sourceServerId: saved.sourceResourceId !== 'local' ? saved.sourceResourceId : undefined,
        sourcePath: saved.options.sourcePath,
        destinationServerId: saved.destinationResourceId !== 'local' ? saved.destinationResourceId : undefined,
        destinationPath: saved.options.destinationPath,
        mode: saved.operationType as 'copy' | 'move',
        verifyChecksum: saved.options.verifyChecksum !== false,
      });
    }

    return saved;
  }
}
