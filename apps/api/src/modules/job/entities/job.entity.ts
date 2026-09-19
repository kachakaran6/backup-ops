import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JobState {
  QUEUED = 'queued',
  PLANNING = 'planning',
  RUNNING = 'running',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  RETRYING = 'retrying',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  policyId?: string;

  @Column({ default: 'backup' })
  operationType: string;

  @Column()
  sourceResourceId: string;

  @Column({ nullable: true })
  destinationResourceId?: string;

  @Column({ type: 'varchar', default: JobState.QUEUED })
  state: JobState;

  @Column({ type: 'simple-json' })
  progress: {
    percentage: number;
    bytesProcessed: number;
    totalBytes: number;
    filesProcessed: number;
    totalFiles: number;
    currentStep: string;
    transferSpeedBytesPerSec?: number;
    etaSeconds?: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  options: {
    compression?: string;
    encryption?: string;
    verifyChecksum?: boolean;
    dryRun?: boolean;
    deleteAfterMove?: boolean;
    volumeName?: string;
    targetVolumeName?: string;
    transferProtocol?: string;
    sourceServer?: string;
    targetServer?: string;
    [key: string]: any;
  };

  @Column({ type: 'simple-json', default: '[]' })
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: string;
    finishedAt?: string;
  }>;

  @Column({ type: 'simple-json', default: '[]' })
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    step?: string;
  }>;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ nullable: true })
  error?: string;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  finishedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
