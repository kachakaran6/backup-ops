export type ServerConnectionMode = 'coolify' | 'ssh' | 'agent';

export type ServerStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface Server {
  id: string;
  organizationId: string;
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

export interface ServerHealth {
  serverId: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  dockerRunning: boolean;
  networkLatencyMs: number;
  recordedAt: string;
}
