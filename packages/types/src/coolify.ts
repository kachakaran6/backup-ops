export type CoolifyConnectionStatus = 'connected' | 'disconnected' | 'auth_failed' | 'unreachable' | 'unknown';

export interface CoolifyConnection {
  id: string;
  organizationId: string;
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

export interface CoolifyDiscoveredResource {
  uuid: string;
  name: string;
  type: string;
  status?: string;
  serverUuid?: string;
  details?: Record<string, any>;
}
