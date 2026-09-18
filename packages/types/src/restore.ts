export type RestoreTargetType = 'original' | 'new_database' | 'different_server';

export interface RestoreJob {
  id: string;
  organizationId: string;
  backupId: string;
  targetType: RestoreTargetType;
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
