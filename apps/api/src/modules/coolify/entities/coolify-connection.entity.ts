import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CoolifyConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  AUTH_FAILED = 'auth_failed',
  UNREACHABLE = 'unreachable',
  UNKNOWN = 'unknown',
}

@Entity('coolify_connections')
export class CoolifyConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  /**
   * Encrypted API token. Never returned to frontend.
   * Encrypted with AES-256-GCM via CredentialService pattern.
   */
  @Column({ type: 'text', select: false })
  encryptedToken: string;

  @Column({ type: 'varchar', length: 24, select: false })
  tokenIv: string;

  @Column({ type: 'varchar', length: 32, select: false })
  tokenAuthTag: string;

  @Column({ nullable: true })
  teamName?: string;

  @Column({ nullable: true })
  coolifyVersion?: string;

  @Column({
    type: 'varchar',
    default: CoolifyConnectionStatus.UNKNOWN,
  })
  connectionStatus: CoolifyConnectionStatus;

  @Column({ nullable: true })
  lastSyncAt?: Date;

  @Column({ type: 'int', default: 0 })
  serversDiscovered: number;

  @Column({ type: 'int', default: 0 })
  databasesDiscovered: number;

  @Column({ type: 'int', default: 0 })
  applicationsDiscovered: number;

  @Column({ type: 'int', default: 0 })
  servicesDiscovered: number;

  @Column({ nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
