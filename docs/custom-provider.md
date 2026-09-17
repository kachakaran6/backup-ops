# Provider Adapter Interface

## Overview

BackupOps implements a comprehensive provider adapter system to enable flexible integration with various infrastructure technologies while maintaining a consistent interface across the platform. The provider adapter pattern allows users to connect to their existing infrastructure without requiring BackupOps to maintain proprietary connections or storage.

## Architecture Overview

### Core Principles

1. **Abstraction Layer**: Provider adapters abstract infrastructure-specific details
2. **Contract-Based**: Well-defined interfaces between BackupOps and infrastructure
3. **Pluggable**: New providers can be added without modifying core code
4. **Standardized**: Consistent API across all provider types
5. **Secure**: Credential management and authentication handled through adapters

### Provider Categories

```text
Resource
├── ServerProvider (Linux, Windows, macOS)
├── DatabaseProvider (PostgreSQL, MySQL, MongoDB, etc.)
├── StorageProvider (S3, SFTP, Local FS, etc.)
└── AgentProvider (Infrastructure agent integration)
```

## Provider Adapter Architecture

### Base Provider Interface

```typescript
interface Provider {
  // Metadata and identification
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: ProviderCategory;
  readonly capabilities: ProviderCapability[];
  
  // Connection management
  connect(credentials: CredentialInput): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  
  // Resource operations
  listResources(path?: string): Promise<ResourceMetadata[]>;
  getResourceMetadata(resourceId: string): Promise<ResourceMetadata>;
  testResourceAccess(resourceId: string): Promise<AccessTestResult>;
  
  // Operation execution
  executeOperation(operation: OperationRequest): Promise<OperationResult>;
  monitorOperation(operationId: string): Observable<OperationProgress>;
  
  // Configuration management
  validateConfiguration(config: ProviderConfiguration): Promise<ValidationResult>;
  getConfigurationSchema(): ProviderConfigurationSchema;
  
  // Credential management
  storeCredential(credential: CredentialInput): Promise<void>;
  retrieveCredential(credentialId: string): Promise<CredentialInput>;
  deleteCredential(credentialId: string): Promise<void>;
}
```

### Provider Metadata

```typescript
interface ProviderMetadata {
  id: string;                    // Unique provider identifier
  name: string;                 // Human-readable name
  version: string;              // Provider version
  description: string;          // Detailed description
  author: string;              // Provider author/maintainer
  category: ProviderCategory;   // Main category (server, database, storage, agent)
  capabilities: ProviderCapability[]; // Supported capabilities
  configuration: {
    required: string[];         // Required configuration fields
    optional: string[];         // Optional configuration fields
    schema: ProviderConfigurationSchema; // JSON schema for validation
  };
  authentication: AuthenticationMethod[]; // Supported auth methods
  documentation: string;        // Link to documentation
  examples?: ProviderExample[];  // Usage examples
  tags?: string[];              // Search/filter tags
}
```

### Resource Metadata

```typescript
interface ResourceMetadata {
  id: string;                   // Unique resource identifier
  name: string;                 // Human-readable name
  type: ResourceType;           // Resource type (e.g., 'database', 'filesystem')
  path?: string;                // Resource path or identifier
  description?: string;         // Resource description
  category: 'source' | 'destination'; // Role in operations
  capabilities: ResourceCapability[]; // Available operations
  status: ResourceStatus;       // Current status
  health?: ResourceHealth;      // Health information
  configuration?: Record<string, any>; // Resource-specific configuration
  metadata?: Record<string, any>; // Additional metadata
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last update timestamp
  lastAccessed?: Date;          // Last access time
}
```

### Operation Request

```typescript
interface OperationRequest {
  id: string;                   // Unique operation identifier
  type: OperationType;          // Type of operation (copy, backup, etc.)
  source: ResourceReference;    // Source resource
  destination: ResourceReference; // Destination resource
  configuration: OperationConfiguration; // Operation-specific settings
  policy?: PolicyReference;     // Associated policy
  options: OperationOptions;    // Execution options
  security: SecurityContext;    // Security context
  priority: OperationPriority;  // Execution priority
  retryPolicy: RetryPolicy;     // Retry configuration
  timeout: number;              // Operation timeout in seconds
}
```

### Operation Result

```typescript
interface OperationResult {
  success: boolean;             // Overall operation status
  operationId: string;          // Reference operation ID
  startedAt: Date;             // Start timestamp
  completedAt?: Date;           // Completion timestamp
  duration: number;             // Duration in seconds
  progress: OperationProgress;  // Current progress
  checkpoints: Checkpoint[];   // Save points for resumption
  logs: LogEntry[];             // Detailed operation logs
  verification?: VerificationResult; // Verification results
  errors: OperationError[];     // Any errors encountered
  resultData?: OperationResultData; // Operation-specific results
  metadata: Record<string, any>; // Additional metadata
}
```

## Provider Categories

### Server Provider

```typescript
interface ServerProvider extends Provider {
  category: 'server';
  capabilities: [
    'filesystem.read',
    'filesystem.write',
    'filesystem.copy',
    'filesystem.move',
    'filesystem.delete',
    'command.execute',
    'ssh.connect',
    'docker.operations',
    'package.management'
  ];
  
  // Server-specific operations
  executeCommand(command: CommandRequest): Promise<CommandResult>;
  manageFiles(fileOperation: FileOperation): Promise<FileOperationResult>;
  manageDocker(dockerOperation: DockerOperation): Promise<DockerOperationResult>;
  getSystemInfo(): Promise<SystemInfo>;
  getProcessList(): Promise<Process[]>;
  monitorResourceUtilization(): Observable<ResourceMetrics>;
}
```

#### Server Provider Examples

**Linux Server Provider**
```typescript
class LinuxServerProvider implements ServerProvider {
  readonly id = 'com.backup-ops.server.linux';
  readonly name = 'Linux Server';
  readonly version = '1.0.0';
  readonly category = 'server';
  readonly capabilities = ['filesystem.read', 'ssh.connect', 'docker.operations'];
  
  async connect(credentials: CredentialInput): Promise<ConnectionResult> {
    // Validate SSH credentials
    // Establish SSH connection
    // Return connection result
  }
  
  async executeCommand(request: CommandRequest): Promise<CommandResult> {
    // Execute command via SSH
    // Handle output, errors, and timeouts
    // Return command result
  }
}
```

**Windows Server Provider**
```typescript
class WindowsServerProvider implements ServerProvider {
  readonly id = 'com.backup-ops.server.windows';
  readonly name = 'Windows Server';
  readonly version = '1.0.0';
  readonly category = 'server';
  readonly capabilities = ['filesystem.read', 'powershell.execute', 'docker.operations'];
  
  async executeCommand(request: CommandRequest): Promise<CommandResult> {
    // Execute PowerShell commands
    // Handle Windows-specific operations
    // Return command result
  }
}
```

### Database Provider

```typescript
interface DatabaseProvider extends Provider {
  category: 'database';
  capabilities: [
    'backup.create',
    'backup.restore',
    'backup.verify',
    'query.execute',
    'schema.export',
    'schema.import',
    'replication.status',
    'point-in-time-recovery'
  ];
  
  // Database-specific operations
  executeBackup(backupRequest: DatabaseBackupRequest): Promise<DatabaseBackupResult>;
  executeRestore(restoreRequest: DatabaseRestoreRequest): Promise<DatabaseRestoreResult>;
  executeQuery(queryRequest: DatabaseQueryRequest): Promise<DatabaseQueryResult>;
  getDatabaseInfo(): Promise<DatabaseInfo>;
  getReplicationStatus(): Promise<ReplicationStatus>;
  getTableStats(): Promise<TableStatistics>;
}
```

#### Database Provider Examples

**PostgreSQL Provider**
```typescript
class PostgreSQLProvider implements DatabaseProvider {
  readonly id = 'com.backup-ops.database.postgresql';
  readonly name = 'PostgreSQL';
  readonly version = '1.0.0';
  readonly category = 'database';
  readonly capabilities = ['backup.create', 'backup.restore', 'query.execute'];
  
  async executeBackup(request: DatabaseBackupRequest): Promise<DatabaseBackupResult> {
    // Use pg_dump for backup
    // Handle pg_dump configuration
    // Return backup result with checksum
  }
  
  async executeRestore(request: DatabaseRestoreRequest): Promise<DatabaseRestoreResult> {
    // Use pg_restore for restore
    // Handle restore options
    // Return restore result
  }
}
```

**MySQL Provider**
```typescript
class MySQLProvider implements DatabaseProvider {
  readonly id = 'com.backup-ops.database.mysql';
  readonly name = 'MySQL/MariaDB';
  readonly version = '1.0.0';
  readonly category = 'database';
  readonly capabilities = ['backup.create', 'backup.restore', 'backup.verify'];
  
  async executeBackup(request: DatabaseBackupRequest): Promise<DatabaseBackupResult> {
    // Use mysqldump for backup
    // Handle MySQL-specific options
    // Return backup result
  }
}
```

### Storage Provider

```typescript
interface StorageProvider extends Provider {
  category: 'storage';
  capabilities: [
    'object.storage.read',
    'object.storage.write',
    'object.storage.list',
    'object.storage.delete',
    'file.storage.read',
    'file.storage.write',
    'file.storage.copy',
    'file.storage.move',
    'archive.upload',
    'archive.download',
    'replication.sync'
  ];
  
  // Storage-specific operations
  uploadObject(uploadRequest: ObjectUploadRequest): Promise<ObjectUploadResult>;
  downloadObject(downloadRequest: ObjectDownloadRequest): Promise<ObjectDownloadResult>;
  listObjects(listRequest: ObjectListRequest): Promise<ObjectListResult>;
  syncStorage(syncRequest: StorageSyncRequest): Promise<StorageSyncResult>;
  getStorageInfo(): Promise<StorageInfo>;
  getStorageUsage(): Promise<StorageUsage>;
}
```

#### Storage Provider Examples

**S3-Compatible Provider**
```typescript
class S3StorageProvider implements StorageProvider {
  readonly id = 'com.backup-ops.storage.s3';
  readonly name = 'S3-Compatible Storage';
  readonly version = '1.0.0';
  readonly category = 'storage';
  readonly capabilities = ['object.storage.read', 'object.storage.write', 'object.storage.delete'];
  
  async uploadObject(request: ObjectUploadRequest): Promise<ObjectUploadResult> {
    // Use S3 SDK for upload
    // Handle multipart uploads for large files
    // Return upload result with ETag
  }
  
  async downloadObject(request: ObjectDownloadRequest): Promise<ObjectDownloadResult> {
    // Use S3 SDK for download
    // Handle resumable downloads
    // Return download result with checksum
  }
}
```

**SFTP Provider**
```typescript
class SftpStorageProvider implements StorageProvider {
  readonly id = 'com.backup-ops.storage.sftp';
  readonly name = 'SFTP';
  readonly version = '1.0.0';
  readonly category = 'storage';
  readonly capabilities = ['file.storage.read', 'file.storage.write', 'file.storage.copy'];
  
  async uploadObject(request: ObjectUploadRequest): Promise<ObjectUploadResult> {
    // Use SFTP client for upload
    // Handle file transfer
    // Return upload result
  }
}
```

### Agent Provider

```typescript
interface AgentProvider extends Provider {
  category: 'agent';
  capabilities: [
    'filesystem.operations',
    'docker.operations',
    'database.operations',
    'network.operations',
    'package.management',
    'system.monitoring',
    'process.management',
    'security.operations'
  ];
  
  // Agent-specific operations
  registerAgent(agentInfo: AgentInfo): Promise<AgentRegistrationResult>;
  sendHeartbeat(agentId: string): Promise<void>;
  executeAgentOperation(operation: AgentOperation): Promise<AgentOperationResult>;
  getAgentCapabilities(agentId: string): Promise<AgentCapability[]>;
  updateAgentConfiguration(agentId: string, config: AgentConfiguration): Promise<void>;
}
```

## Configuration and Authentication

### Provider Configuration Schema

```typescript
interface ProviderConfigurationSchema {
  type: 'object';
  properties: {
    [key: string]: PropertySchema;
  };
  required: string[];
  optional: string[];
  validation?: ValidationRule[];
}

interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  title: string;
  description: string;
  format?: string; // email, uri, password, etc.
  pattern?: string; // regex pattern
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: PropertySchema; // for arrays
  properties?: { [key: string]: PropertySchema; }; // for objects
  secret?: boolean; // whether field contains sensitive data
  required?: boolean; // whether field is required
}
```

### Authentication Methods

#### SSH Authentication

```typescript
interface SshAuthentication {
  method: 'ssh';
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  hostKeyVerification?: boolean;
  port?: number;
}
```

#### Database Authentication

```typescript
interface DatabaseAuthentication {
  method: 'database';
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis';
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl?: {
    enabled: boolean;
    certificate?: string;
    ca?: string;
  };
}
```

#### S3 Authentication

```typescript
interface S3Authentication {
  method: 's3';
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  sessionToken?: string;
  assumeRoleArn?: string;
  externalId?: string;
}
```

### Credential Management

#### Encrypted Credential Storage

```typescript
interface EncryptedCredential {
  id: string;
  algorithm: 'AES-256-GCM' | 'AES-128-GCM';
  keyDerivation: 'PBKDF2' | 'Argon2';
  salt: string;
  iv: string;
  ciphertext: string;
  tag: string;
  createdAt: Date;
  expiresAt?: Date;
}

class CredentialManager {
  async encryptCredential(credential: CredentialInput, masterPassword: string): Promise<EncryptedCredential>;
  async decryptCredential(encrypted: EncryptedCredential, masterPassword: string): Promise<CredentialInput>;
  async storeCredential(credential: CredentialInput): Promise<string>;
  async retrieveCredential(credentialId: string): Promise<CredentialInput>;
  async deleteCredential(credentialId: string): Promise<void>;
  async rotateCredential(credentialId: string, newCredential: CredentialInput): Promise<void>;
}
```

## Provider Registration and Discovery

### Provider Registry

```typescript
class ProviderRegistry {
  private providers: Map<string, ProviderMetadata> = new Map();
  private instances: Map<string, Provider> = new Map();
  
  // Register new provider
  register(metadata: ProviderMetadata, implementation: Provider): void;
  
  // Unregister provider
  unregister(providerId: string): void;
  
  // Get provider metadata
  getProvider(providerId: string): ProviderMetadata | undefined;
  getProvidersByCategory(category: ProviderCategory): ProviderMetadata[];
  getAllProviders(): ProviderMetadata[];
  
  // Create provider instance
  createProvider(providerId: string, config: ProviderConfiguration): Promise<Provider>;
  
  // Test provider connectivity
  testProviderConnection(providerId: string, credentials: CredentialInput): Promise<ConnectionTestResult>;
  
  // Health check
  healthCheck(providerId: string): Promise<HealthStatus>;
  
  // Provider discovery
  discoverProviders(): Promise<ProviderMetadata[]>;
  registerDiscoveredProvider(metadata: ProviderMetadata): void;
}
```

### Provider Discovery

```typescript
interface ProviderDiscovery {
  discoverProviders(): Promise<DiscoveredProvider[]>;
  validateProviderMetadata(metadata: DiscoveredProviderMetadata): ValidationResult;
  normalizeProviderMetadata(metadata: DiscoveredProviderMetadata): ProviderMetadata;
}

interface DiscoveredProvider {
  source: 'local' | 'remote' | 'registry';
  metadata: DiscoveredProviderMetadata;
  configuration?: ProviderConfiguration;
}

interface DiscoveredProviderMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category?: ProviderCategory;
  capabilities?: string[];
  endpoint?: string;
  authentication?: AuthenticationMethod[];
  configuration?: {
    required?: string[];
    optional?: string[];
  };
}
```

## Provider Implementation Guidelines

### Implementation Checklist

1. **Metadata Compliance**
   - ✅ Provide complete ProviderMetadata
   - ✅ List all capabilities correctly
   - ✅ Define configuration schema
   - ✅ Document authentication methods

2. **Connection Management**
   - ✅ Implement connection lifecycle
   - ✅ Handle connection errors
   - ✅ Implement health checks
   - ✅ Support credential refresh

3. **Resource Operations**
   - ✅ Implement resource listing
   - ✅ Provide resource metadata
   - ✅ Support resource testing
   - ✅ Handle resource operations

4. **Security**
   - ✅ Implement secure credential storage
   - ✅ Validate all inputs
   - ✅ Log security events
   - ✅ Follow least privilege principles

5. **Error Handling**
   - ✅ Implement comprehensive error handling
   - ✅ Provide detailed error messages
   - ✅ Support retry mechanisms
   - ✅ Handle timeouts and cancellations

### Testing Provider Implementation

```typescript
interface ProviderTestSuite {
  testConnection(): Promise<void>;
  testResourceOperations(): Promise<void>;
  testOperationExecution(): Promise<void>;
  testErrorHandling(): Promise<void>;
  testSecurity(): Promise<void>;
}

class ProviderTestSuiteImpl implements ProviderTestSuite {
  constructor(private provider: Provider) {}
  
  async testConnection(): Promise<void> {
    const result = await this.provider.connect({
      // Test credentials
    });
    
    if (!result.success) {
      throw new Error(`Connection failed: ${result.error}`);
    }
  }
  
  async testResourceOperations(): Promise<void> {
    // Test listing resources
    const resources = await this.provider.listResources();
    
    if (resources.length === 0) {
      throw new Error('No resources available');
    }
    
    // Test resource metadata
    for (const resource of resources) {
      const metadata = await this.provider.getResourceMetadata(resource.id);
      if (!metadata) {
        throw new Error(`Failed to get metadata for resource ${resource.id}`);
      }
    }
  }
}
```

## Provider Lifecycle Management

### Provider Lifecycle

```typescript
enum ProviderLifecycleState {
  REGISTERED = 'registered',
  CONFIGURING = 'configuring',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  DISCONNECTING = 'disconnecting',
  UNREGISTERED = 'unregistered',
  ERROR = 'error',
}

interface ProviderLifecycle {
  state: ProviderLifecycleState;
  lastStateChange: Date;
  connectionAttempts: number;
  lastError?: ProviderError;
  config?: ProviderConfiguration;
  credentials?: CredentialReference[];
}
```

### Lifecycle Management

```typescript
class ProviderLifecycleManager {
  private lifecycleStates: Map<string, ProviderLifecycle> = new Map();
  
  async initializeProvider(providerId: string, config: ProviderConfiguration): Promise<void> {
    const lifecycle = this.getLifecycle(providerId);
    
    try {
      lifecycle.state = ProviderLifecycleState.CONFIGURING;
      
      // Validate configuration
      await this.validateProviderConfiguration(providerId, config);
      
      // Create provider instance
      const provider = await this.createProviderInstance(providerId, config);
      
      lifecycle.state = ProviderLifecycleState.CONNECTING;
      
      // Connect provider
      await provider.connect(config.authentication);
      
      lifecycle.state = ProviderLifecycleState.ACTIVE;
      lifecycle.config = config;
      lifecycle.lastStateChange = new Date();
      
    } catch (error) {
      lifecycle.state = ProviderLifecycleState.ERROR;
      lifecycle.lastError = error as ProviderError;
      lifecycle.lastStateChange = new Date();
      
      // Retry logic
      if (lifecycle.connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        setTimeout(() => {
          this.initializeProvider(providerId, config);
        }, this.getRetryDelay(lifecycle.connectionAttempts));
      }
    }
  }
  
  async cleanupProvider(providerId: string): Promise<void> {
    const lifecycle = this.getLifecycle(providerId);
    
    if (lifecycle.state === ProviderLifecycleState.ACTIVE) {
      lifecycle.state = ProviderLifecycleState.DISCONNECTING;
      
      const provider = this.getProviderInstance(providerId);
      if (provider) {
        await provider.disconnect();
      }
      
      lifecycle.state = ProviderLifecycleState.UNREGISTERED;
    }
  }
}
```

## Provider Monitoring and Observability

### Provider Metrics

```typescript
interface ProviderMetrics {
  providerId: string;
  connectionCount: number;
  activeConnections: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  lastOperation: Date;
}
```

### Monitoring Integration

```typescript
class ProviderMonitor {
  private metrics: ProviderMetrics[] = [];
  
  recordOperation(providerId: string, success: boolean, duration: number): void {
    const metric: ProviderMetrics = {
      providerId,
      connectionCount: 0, // Would be retrieved from provider
      activeConnections: 0,
      totalOperations: this.metrics.length + 1,
      successfulOperations: success ? this.getSuccessfulCount(providerId) + 1 : this.getSuccessfulCount(providerId),
      failedOperations: success ? this.getFailedCount(providerId) : this.getFailedCount(providerId) + 1,
      averageResponseTime: this.calculateAverageResponseTime(providerId, duration),
      errorRate: this.calculateErrorRate(providerId),
      lastHealthCheck: this.getLastHealthCheck(providerId),
      lastOperation: new Date(),
    };
    
    this.metrics.push(metric);
  }
  
  getProviderMetrics(providerId: string, timeRange: TimeRange): ProviderMetrics[] {
    return this.metrics.filter(metric => 
      metric.providerId === providerId &&
      metric.lastOperation >= timeRange.start &&
      metric.lastOperation <= timeRange.end
    );
  }
}
```

## Provider Migration and Upgrade

### Provider Migration

```typescript
interface ProviderMigration {
  fromVersion: string;
  toVersion: string;
  migrationSteps: MigrationStep[];
  rollbackSteps: MigrationStep[];
  
  execute(sourceProvider: Provider, targetConfig: ProviderConfiguration): Promise<void>;
  rollback(targetProvider: Provider): Promise<void>;
}

class ProviderMigrationManager {
  private migrations: Map<string, ProviderMigration> = new Map();
  
  registerMigration(migration: ProviderMigration): void {
    const key = `${migration.fromVersion}-${migration.toVersion}`;
    this.migrations.set(key, migration);
  }
  
  async migrate(providerId: string, targetConfig: ProviderConfiguration): Promise<void> {
    const currentProvider = this.getProviderInstance(providerId);
    if (!currentProvider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    
    const currentVersion = currentProvider.version;
    const migrationKey = `${currentVersion}-*`; // Find matching migration
    
    const migration = this.findMigration(migrationKey, targetConfig.version);
    if (!migration) {
      throw new Error(`No migration found from ${currentVersion} to ${targetConfig.version}`);
    }
    
    try {
      await migration.execute(currentProvider, targetConfig);
      
    } catch (error) {
      // Attempt rollback
      await migration.rollback(currentProvider);
      throw error;
    }
  }
}
```

## Future Provider Enhancements

### Planned Provider Features

1. **Template Providers**: Predefined provider configurations for common infrastructure
2. **Dynamic Providers**: Runtime provider discovery and registration
3. **Multi-Cloud Providers**: Unified interface across cloud providers
4. **Edge Computing Providers**: Support for edge and IoT devices
5. **Container-native Providers**: Native Docker and Kubernetes integration

### Provider Ecosystem

The provider ecosystem includes:

- **Core Providers**: Built-in providers for common infrastructure
- **Community Providers**: User-contributed providers
- **Enterprise Providers**: Enterprise-grade providers with advanced features
- **Custom Providers**: User-defined providers for specialized infrastructure

## Conclusion

The Provider Adapter Interface provides a robust, flexible foundation for integrating diverse infrastructure technologies into BackupOps. By implementing this interface, developers can create custom providers that seamlessly connect BackupOps to any infrastructure while maintaining security, reliability, and performance. The provider system is designed to be extensible, maintainable, and future-proof, supporting the evolution of infrastructure technologies and BackupOps capabilities.