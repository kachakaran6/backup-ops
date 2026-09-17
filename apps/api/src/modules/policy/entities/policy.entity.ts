import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  enabled: boolean;

  @Column()
  sourceResourceId: string;

  @Column()
  destinationResourceId: string;

  @Column({ default: 'backup' })
  operationType: string;

  @Column({ type: 'simple-json' })
  schedule: {
    enabled: boolean;
    cronExpression?: string;
    intervalMinutes?: number;
    timezone: string;
  };

  @Column({ type: 'simple-json' })
  retention: {
    keepHourly?: number;
    keepDaily?: number;
    keepWeekly?: number;
    keepMonthly?: number;
    deleteOlderThanDays?: number;
  };

  @Column({ type: 'simple-json' })
  options: {
    compression: 'none' | 'gzip' | 'zstd';
    encryption: 'none' | 'aes_256_gcm';
    verifyChecksum: boolean;
    dryRun: boolean;
    excludePatterns?: string[];
  };

  @Column({ nullable: true })
  lastRunAt?: Date;

  @Column({ nullable: true })
  nextRunAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
