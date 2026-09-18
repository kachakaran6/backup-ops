import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DatabaseType {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  MONGODB = 'mongodb',
  REDIS = 'redis',
}

export enum DatabaseStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  UNREACHABLE = 'unreachable',
  UNKNOWN = 'unknown',
}

export enum DatabaseProtectionStatus {
  DISCOVERED = 'discovered',
  MONITORED = 'monitored',
  PROTECTED = 'protected',
}

export enum DatabaseRecoveryReadiness {
  READY = 'ready',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

@Entity('databases')
export class Database {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  serverId?: string;

  @Column({ nullable: true })
  coolifyConnectionId?: string;

  @Column({ nullable: true })
  coolifyResourceUuid?: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: DatabaseType.POSTGRES,
  })
  type: DatabaseType;

  @Column({ nullable: true })
  version?: string;

  @Column()
  host: string;

  @Column({ type: 'int', default: 5432 })
  port: number;

  @Column()
  databaseName: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  credentialId?: string;

  @Column({
    type: 'varchar',
    default: DatabaseStatus.UNKNOWN,
  })
  status: DatabaseStatus;

  @Column({
    type: 'varchar',
    default: DatabaseProtectionStatus.DISCOVERED,
  })
  protectionStatus: DatabaseProtectionStatus;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ type: 'int', nullable: true })
  tableCount?: number;

  @Column({ type: 'int', nullable: true })
  activeConnections?: number;

  @Column({ default: false })
  walEnabled: boolean;

  @Column({ type: 'varchar', default: 'unknown' })
  walStatus: string;

  @Column({ nullable: true })
  lastBackupAt?: Date;

  @Column({ nullable: true })
  lastSuccessfulBackupAt?: Date;

  @Column({ type: 'int', nullable: true })
  backupAgeMinutes?: number;

  @Column({ type: 'varchar', default: 'none' })
  lastBackupStatus: string;

  @Column({
    type: 'varchar',
    default: DatabaseRecoveryReadiness.UNKNOWN,
  })
  recoveryReadiness: DatabaseRecoveryReadiness;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
