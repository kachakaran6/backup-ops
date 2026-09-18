import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_deliveries')
@Index(['organizationId', 'createdAt'])
@Index(['integrationId', 'createdAt'])
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  event: string;

  @Column()
  integrationId: string;

  @Column({ type: 'varchar' })
  status: 'success' | 'failed';

  @Column()
  attemptedAt: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @Column({ nullable: true })
  error?: string;

  @Column({ type: 'text', nullable: true })
  payloadSummary?: string;

  @CreateDateColumn()
  createdAt: Date;
}
