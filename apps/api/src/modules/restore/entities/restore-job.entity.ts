import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RestoreTargetType {
  ORIGINAL = 'original',
  NEW_DATABASE = 'new_database',
  DIFFERENT_SERVER = 'different_server',
}

export enum RestoreJobState {
  QUEUED = 'queued',
  PLANNING = 'planning',
  RUNNING = 'running',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('restore_jobs')
export class RestoreJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  backupId: string;

  @Column({
    type: 'varchar',
    default: RestoreTargetType.ORIGINAL,
  })
  targetType: RestoreTargetType;

  @Column({ nullable: true })
  targetServerId?: string;

  @Column({ nullable: true })
  targetDatabaseId?: string;

  @Column({ nullable: true })
  targetPath?: string;

  @Column({ nullable: true })
  pointInTimeTarget?: Date;

  @Column({ default: false })
  overwriteConfirmed: boolean;

  @Column({
    type: 'varchar',
    default: RestoreJobState.QUEUED,
  })
  state: RestoreJobState;

  @Column({ type: 'int', default: 0 })
  progressPercent: number;

  @Column({ default: 'Initializing restore job' })
  currentStep: string;

  @Column({ type: 'simple-json', default: '[]' })
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }>;

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
