import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_rules')
@Index(['organizationId', 'event'])
export class NotificationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ type: 'varchar' })
  event: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'simple-array' })
  integrationIds: string[];

  @Column({ type: 'int', default: 5 })
  cooldownMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
