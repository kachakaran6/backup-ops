import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ResourceType {
  SERVER_LINUX = 'server_linux',
  SERVER_WINDOWS = 'server_windows',
  DATABASE_POSTGRES = 'database_postgres',
  DATABASE_MYSQL = 'database_mysql',
  DATABASE_MONGODB = 'database_mongodb',
  STORAGE_S3 = 'storage_s3',
  STORAGE_LOCAL = 'storage_local',
  STORAGE_SFTP = 'storage_sftp',
  STORAGE_MINIO = 'storage_minio',
  DOCKER_HOST = 'docker_host',
  AGENT_NODE = 'agent_node',
}

export enum ResourceCategory {
  SERVER = 'server',
  DATABASE = 'database',
  STORAGE = 'storage',
  AGENT = 'agent',
}

export enum ResourceHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  type: ResourceType;

  @Column({ type: 'varchar' })
  category: ResourceCategory;

  @Column({ type: 'varchar', default: ResourceHealthStatus.UNKNOWN })
  status: ResourceHealthStatus;

  @Column({ type: 'simple-json' })
  config: Record<string, any>;

  @Column({ nullable: true })
  credentialId?: string;

  @Column({ nullable: true })
  lastCheckedAt?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
