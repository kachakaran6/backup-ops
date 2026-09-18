import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BackupChainStatus {
  HEALTHY = 'healthy',
  BROKEN = 'broken',
  PRUNED = 'pruned',
}

@Entity('backup_chains')
export class BackupChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  policyId?: string;

  @Column({ nullable: true })
  sourceDatabaseId?: string;

  @Column({ nullable: true })
  sourceServerId?: string;

  @Column({ type: 'int', default: 1 })
  chainNumber: number;

  @Column({
    type: 'varchar',
    default: BackupChainStatus.HEALTHY,
  })
  status: BackupChainStatus;

  @Column({ nullable: true })
  baseBackupId?: string;

  @Column({ nullable: true })
  latestBackupId?: string;

  @Column({ type: 'bigint', default: 0 })
  totalSizeBytes: number;

  @Column({ type: 'int', default: 0 })
  backupCount: number;

  @Column({ nullable: true })
  lastValidPoint?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
