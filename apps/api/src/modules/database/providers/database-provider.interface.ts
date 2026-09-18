export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface DatabaseConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  version?: string;
  sizeBytes?: number;
  tableCount?: number;
  activeConnections?: number;
  walEnabled?: boolean;
  walStatus?: 'healthy' | 'warning' | 'disabled' | 'unknown';
}

export interface WalStatusResult {
  walEnabled: boolean;
  walLevel?: string;
  archiveMode?: string;
  archiveCommand?: string;
  lastWalArchived?: string;
  isReadyForPitr: boolean;
  statusText: string;
}

export interface DatabaseProvider {
  testConnection(config: DatabaseConnectionConfig): Promise<DatabaseConnectionTestResult>;
  getWalStatus(config: DatabaseConnectionConfig): Promise<WalStatusResult>;
}
