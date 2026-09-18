import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type NotificationProviderType = 'smtp' | 'telegram' | 'pushover' | 'gotify';
export type NotificationStatus = 'connected' | 'untested' | 'failed' | 'disabled';

@Entity('notification_integrations')
@Index(['organizationId', 'provider'])
export class NotificationIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ type: 'varchar' })
  provider: NotificationProviderType;

  @Column()
  name: string;

  @Column({ type: 'text', select: false })
  encryptedConfig: string;

  @Column({ type: 'varchar', select: false })
  configIv: string;

  @Column({ type: 'varchar', select: false })
  configAuthTag: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'varchar', default: 'untested' })
  status: NotificationStatus;

  @Column({ nullable: true })
  lastTestAt?: Date;

  @Column({ nullable: true })
  lastSuccessAt?: Date;

  @Column({ nullable: true })
  lastFailureAt?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
