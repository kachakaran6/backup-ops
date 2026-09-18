import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StorageType {
  LOCAL = 'local',
  S3 = 's3',
  MINIO = 'minio',
  SFTP = 'sftp',
}

export enum StorageStatus {
  CONNECTED = 'connected',
  DEGRADED = 'degraded',
  UNREACHABLE = 'unreachable',
  UNKNOWN = 'unknown',
}

@Entity('storage_destinations')
export class StorageDestination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: StorageType.LOCAL,
  })
  type: StorageType;

  @Column({ nullable: true })
  endpoint?: string;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  bucket?: string;

  @Column({ nullable: true })
  prefix?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  credentialId?: string;

  @Column({
    type: 'varchar',
    default: StorageStatus.UNKNOWN,
  })
  status: StorageStatus;

  @Column({ type: 'bigint', nullable: true })
  totalCapacityBytes?: number;

  @Column({ type: 'bigint', nullable: true })
  usedCapacityBytes?: number;

  @Column({ type: 'bigint', nullable: true })
  availableCapacityBytes?: number;

  @Column({ type: 'int', default: 0 })
  backupCount: number;

  @Column({ nullable: true })
  lastSuccessfulOperationAt?: Date;

  @Column({ nullable: true })
  lastVerificationAt?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
