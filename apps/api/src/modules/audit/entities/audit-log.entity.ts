import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  action: string;

  @Column({ default: 'info' })
  severity: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ type: 'simple-json' })
  details: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
