export type BackupStrategy = 'base_wal' | 'full' | 'incremental' | 'differential' | 'snapshot';

export type BackupType = 'base' | 'full' | 'incremental' | 'wal' | 'binlog' | 'snapshot';

export type BackupVerificationState =
  | 'pending'
  | 'upload_verified'
  | 'checksum_verified'
  | 'database_verified'
  | 'restore_tested'
  | 'failed';

export type BackupChainStatus = 'healthy' | 'broken' | 'pruned';

export interface BackupChain {
  id: string;
  organizationId: string;
  policyId?: string;
  sourceDatabaseId?: string;
  sourceServerId?: string;
  chainNumber: number;
  status: BackupChainStatus;
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
  organizationId: string;
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
  encryption: 'none' | 'aes_256_gcm';
  verificationState: BackupVerificationState;
  verificationError?: string;
  recoveryPointTime?: string;
  expiresAt?: string;
  retentionMark?: 'daily' | 'weekly' | 'monthly';
  status: 'completed' | 'failed' | 'pruned';
  createdAt: string;
  updatedAt: string;
}
