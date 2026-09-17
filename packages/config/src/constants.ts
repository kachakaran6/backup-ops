export const DEFAULT_API_PORT = 3000;
export const DEFAULT_WEB_PORT = 3001;
export const DEFAULT_AGENT_PORT = 8080;
export const DEFAULT_POSTGRES_PORT = 5432;
export const DEFAULT_REDIS_PORT = 6379;

export const QUEUE_NAMES = {
  OPERATIONS: 'backupops:operations',
  VERIFICATION: 'backupops:verification',
  PRUNING: 'backupops:pruning',
  NOTIFICATIONS: 'backupops:notifications',
} as const;

export const JOB_DEFAULTS = {
  MAX_RETRIES: 3,
  RETRY_BACKOFF_MS: 5000,
  PROGRESS_UPDATE_THROTTLE_MS: 1000,
  CHECKPOINT_INTERVAL_BYTES: 50 * 1024 * 1024, // 50MB
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
