export type ServerConnectionMode = 'coolify' | 'ssh' | 'agent';
export type ServerStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface Server {
  id: string;
  name: string;
  connectionMode: ServerConnectionMode;
  coolifyConnectionId?: string;
  coolifyServerUuid?: string;
  host: string;
  port: number;
  username?: string;
  credentialId?: string;
  os?: string;
  arch?: string;
  kernel?: string;
  cpuCores?: number;
  memoryBytes?: number;
  diskBytes?: number;
  dockerInstalled: boolean;
  dockerVersion?: string;
  status: ServerStatus;
  lastHeartbeatAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DatabaseType = 'postgres' | 'mysql' | 'mariadb' | 'mongodb' | 'redis';
export type DatabaseStatus = 'connected' | 'disconnected' | 'unreachable' | 'unknown';
export type DatabaseProtectionStatus = 'discovered' | 'monitored' | 'protected';
export type DatabaseRecoveryReadiness = 'ready' | 'degraded' | 'unhealthy' | 'unknown';

export interface Database {
  id: string;
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

export type StorageType = 'local' | 's3' | 'minio' | 'sftp';
export type StorageStatus = 'connected' | 'degraded' | 'unreachable' | 'unknown';

export interface StorageDestination {
  id: string;
  name: string;
  type: StorageType;
  endpoint?: string;
  region?: string;
  bucket?: string;
  prefix?: string;
  path?: string;
  credentialId?: string;
  status: StorageStatus;
  totalCapacityBytes?: number;
  usedCapacityBytes?: number;
  availableCapacityBytes?: number;
  backupCount: number;
  lastSuccessfulOperationAt?: string;
  lastVerificationAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export type CoolifyConnectionStatus = 'connected' | 'disconnected' | 'auth_failed' | 'unreachable' | 'unknown';

export interface CoolifyConnection {
  id: string;
  name: string;
  url: string;
  teamName?: string;
  coolifyVersion?: string;
  connectionStatus: CoolifyConnectionStatus;
  lastSyncAt?: string;
  serversDiscovered: number;
  databasesDiscovered: number;
  applicationsDiscovered: number;
  servicesDiscovered: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export type BackupType = 'base' | 'full' | 'incremental' | 'wal' | 'binlog' | 'snapshot';
export type BackupVerificationState =
  | 'pending'
  | 'upload_verified'
  | 'checksum_verified'
  | 'database_verified'
  | 'restore_tested'
  | 'failed';

export interface BackupChain {
  id: string;
  policyId?: string;
  sourceDatabaseId?: string;
  sourceServerId?: string;
  chainNumber: number;
  status: 'healthy' | 'broken' | 'pruned';
  baseBackupId?: string;
  latestBackupId?: string;
  totalSizeBytes: number;
  backupCount: number;
  lastValidPoint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Backup {
  id: string;
  chainId?: string;
  parentBackupId?: string;
  policyId?: string;
  sourceDatabaseId?: string;
  sourceServerId?: string;
  destinationStorageId: string;
  type: BackupType;
  sequence: number;
  storagePath: string;
  sizeBytes: number;
  checksumSha256: string;
  encryption: string;
  verificationState: BackupVerificationState;
  verificationError?: string;
  recoveryPointTime?: string;
  expiresAt?: string;
  retentionMark?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  targetType: 'original' | 'new_database' | 'different_server';
  targetServerId?: string;
  targetDatabaseId?: string;
  targetPath?: string;
  pointInTimeTarget?: string;
  overwriteConfirmed: boolean;
  state: 'queued' | 'planning' | 'running' | 'verifying' | 'completed' | 'failed';
  progressPercent: number;
  currentStep: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }>;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  operationType: string;
  sourceResourceId: string;
  destinationResourceId?: string;
  state: 'queued' | 'planning' | 'running' | 'verifying' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;
    bytesProcessed: number;
    totalBytes: number;
    filesProcessed: number;
    totalFiles: number;
    currentStep: string;
    durationSeconds?: number;
    etaSeconds?: number;
  };
  options?: Record<string, any>;
  steps?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }>;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  sourceResourceId: string;
  destinationResourceId: string;
  operationType: string;
  schedule: {
    enabled: boolean;
    cronExpression?: string;
    timezone: string;
  };
  retention: {
    keepDaily?: number;
    keepWeekly?: number;
    keepMonthly?: number;
    deleteOlderThanDays?: number;
  };
  options: {
    compression: string;
    encryption: string;
    verifyChecksum: boolean;
    dryRun: boolean;
  };
  lastRunAt?: string;
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
  resourceId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface DashboardStats {
  infrastructure: {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    coolifyInstances: number;
  };
  databases: {
    totalDatabases: number;
    healthyDatabases: number;
    backupOverdueDatabases: number;
    unprotectedDatabases: number;
  };
  backups: {
    last24hSuccessful: number;
    last24hFailed: number;
    activeOperations: number;
    totalArtifacts: number;
  };
  storage: {
    totalDestinations: number;
    usedCapacityBytes: number;
    availableCapacityBytes: number;
  };
  recovery: {
    validChains: number;
    brokenChains: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  organizationId?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export type NotificationProviderType = 'smtp' | 'telegram' | 'pushover' | 'gotify';
export type NotificationStatus = 'connected' | 'untested' | 'failed' | 'disabled';

export interface NotificationIntegration {
  id: string;
  organizationId: string;
  provider: NotificationProviderType;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  status: NotificationStatus;
  lastTestAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  organizationId: string;
  event: string;
  enabled: boolean;
  integrationIds: string[];
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDelivery {
  id: string;
  organizationId: string;
  event: string;
  integrationId: string;
  status: 'success' | 'failed';
  attemptedAt: string;
  deliveredAt?: string;
  error?: string;
  payloadSummary?: string;
}
