export type StorageType = 'local' | 's3' | 'minio' | 'sftp';

export type StorageStatus = 'connected' | 'degraded' | 'unreachable' | 'unknown';

export interface Storage {
  id: string;
  organizationId: string;
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
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
