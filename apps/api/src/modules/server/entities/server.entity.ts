import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ServerConnectionMode {
  COOLIFY = 'coolify',
  SSH = 'ssh',
  AGENT = 'agent',
}

export enum ServerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
}

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: ServerConnectionMode.SSH,
  })
  connectionMode: ServerConnectionMode;

  @Column({ nullable: true })
  coolifyConnectionId?: string;

  @Column({ nullable: true })
  coolifyServerUuid?: string;

  @Column()
  host: string;

  @Column({ type: 'int', default: 22 })
  port: number;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  credentialId?: string;

  @Column({ nullable: true })
  os?: string;

  @Column({ nullable: true })
  arch?: string;

  @Column({ nullable: true })
  kernel?: string;

  @Column({ type: 'int', nullable: true })
  cpuCores?: number;

  @Column({ type: 'bigint', nullable: true })
  memoryBytes?: number;

  @Column({ type: 'bigint', nullable: true })
  diskBytes?: number;

  @Column({ default: false })
  dockerInstalled: boolean;

  @Column({ nullable: true })
  dockerVersion?: string;

  @Column({
    type: 'varchar',
    default: ServerStatus.UNKNOWN,
  })
  status: ServerStatus;

  @Column({ nullable: true })
  lastHeartbeatAt?: Date;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
