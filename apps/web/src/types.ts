export interface Resource {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: 'server' | 'database' | 'storage' | 'agent';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  config: Record<string, any>;
  lastCheckedAt?: string;
  lastError?: string;
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
