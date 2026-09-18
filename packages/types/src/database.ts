export type DatabaseType = 'postgres' | 'mysql' | 'mariadb' | 'mongodb' | 'redis';

export type DatabaseStatus = 'connected' | 'disconnected' | 'unreachable' | 'unknown';

export type DatabaseProtectionStatus = 'discovered' | 'monitored' | 'protected';

export type DatabaseRecoveryReadiness = 'ready' | 'degraded' | 'unhealthy' | 'unknown';

export interface Database {
  id: string;
  organizationId: string;
  serverId?: string;
  coolifyConnectionId?: string;
  coolifyResourceUuid?: string;
  name: string;
  type: DatabaseType;
  version?: string;
  host: string;
  port: number;
  databaseName: string;
  username?: string;
  credentialId?: string;
  status: DatabaseStatus;
  protectionStatus: DatabaseProtectionStatus;
  sizeBytes?: number;
  tableCount?: number;
  activeConnections?: number;
  walEnabled?: boolean;
  walStatus?: 'healthy' | 'warning' | 'disabled' | 'unknown';
  lastBackupAt?: string;
  lastSuccessfulBackupAt?: string;
  backupAgeMinutes?: number;
  lastBackupStatus?: 'success' | 'failed' | 'running' | 'none';
  recoveryReadiness: DatabaseRecoveryReadiness;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
