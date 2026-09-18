import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BackupType {
  BASE = 'base',
  FULL = 'full',
  INCREMENTAL = 'incremental',
  WAL = 'wal',
  BINLOG = 'binlog',
  SNAPSHOT = 'snapshot',
}

export enum BackupVerificationState {
  PENDING = 'pending',
  UPLOAD_VERIFIED = 'upload_verified',
  CHECKSUM_VERIFIED = 'checksum_verified',
  DATABASE_VERIFIED = 'database_verified',
  RESTORE_TESTED = 'restore_tested',
  FAILED = 'failed',
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  chainId?: string;

  @Column({ nullable: true })
  parentBackupId?: string;

  @Column({ nullable: true })
  policyId?: string;

  @Column({ nullable: true })
  sourceDatabaseId?: string;

  @Column({ nullable: true })
  sourceServerId?: string;

  @Column()
  destinationStorageId: string;

  @Column({
    type: 'varchar',
    default: BackupType.FULL,
  })
  type: BackupType;

  @Column({ type: 'int', default: 1 })
  sequence: number;

  @Column()
  storagePath: string;

  @Column({ type: 'bigint', default: 0 })
  sizeBytes: number;

  @Column()
  checksumSha256: string;

  @Column({ type: 'varchar', default: 'aes_256_gcm' })
  encryption: string;

  @Column({
    type: 'varchar',
    default: BackupVerificationState.PENDING,
  })
  verificationState: BackupVerificationState;

  @Column({ nullable: true })
  verificationError?: string;

  @Column({ nullable: true })
  recoveryPointTime?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  retentionMark?: string;

  @Column({ type: 'varchar', default: 'completed' })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
