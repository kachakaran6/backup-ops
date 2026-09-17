import { z } from 'zod';

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

export interface ResourceConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  basePath?: string;
  useSsl?: boolean;
  credentialId?: string; // Reference to encrypted vault credential, never plaintext secret
  agentId?: string;
}

export interface Resource {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ResourceType;
  category: ResourceCategory;
  status: ResourceHealthStatus;
  config: ResourceConnectionConfig;
  lastCheckedAt?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const ResourceSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(ResourceType),
  category: z.nativeEnum(ResourceCategory),
  status: z.nativeEnum(ResourceHealthStatus),
  config: z.record(z.unknown()),
  lastCheckedAt: z.string().optional(),
  lastError: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
