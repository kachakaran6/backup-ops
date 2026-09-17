# BackupOps Data Models

## Overview

BackupOps uses a comprehensive data model system to represent and manage all aspects of backup operations, infrastructure resources, and system state. The data models are designed for:

- **Type Safety**: Strong TypeScript types for all data structures
- **Validation**: Runtime validation of data integrity
- **Consistency**: Clear relationships between different model types
- **Extensibility**: Support for custom extensions and future enhancements
- **Performance**: Efficient data structures for high-throughput operations

## Core Data Models

### 1. User and Authentication Models

#### User Model

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: UserStatus;
  roles: UserRole[];
  organizations: string[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: RoleScope;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  language: string;
  timezone: string;
  notificationSettings: NotificationSettings;
  accessibility: AccessibilitySettings;
  dashboard?: DashboardConfig;
}
```

#### Organization Model

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: OrganizationStatus;
  members: OrganizationMember[];
  resources: string[]; // Resource IDs
  policies: string[]; // Policy IDs
  workflows: string[]; // Workflow IDs
  storage: StorageConfiguration;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETING = 'deleting',
  PENDING_APPROVAL = 'pending_approval',
}

interface OrganizationMember {
  userId: string;
  role: UserRole;
  joinedAt: Date;
  invitedBy?: string;
  status: MembershipStatus;
}

enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECTED = 'rejected',
  LEFT = 'left',
}
```

### 2. Resource Models

#### Resource Base Model

```typescript
interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  subtype?: string;
  status: ResourceStatus;
  health: ResourceHealth;
  configuration: ResourceConfiguration;
  credentials: CredentialReference[];
  capabilities: ResourceCapability[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  metadata: ResourceMetadata;
  tags: string[];
  aliases: string[];
}

enum ResourceType {
  // Server resources
  SERVER = 'server',
  DOCKER_HOST = 'docker-host',
  LINUX_SERVER = 'linux-server',
  WINDOWS_SERVER = 'windows-server',
  MAC_SERVER = 'mac-server',
  
  // Database resources
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  SQL_SERVER = 'sql-server',
  ORACLE = 'oracle',
  MARIADB = 'mariadb',
  SQLITE = 'sqlite',
  
  // Storage resources
  S3 = 's3',
  S3_COMPATIBLE = 's3-compatible',
  SFTP = 'sftp',
  LOCAL_FS = 'local-fs',
  NFS = 'nfs',
  BLOB_STORAGE = 'blob-storage',
  
  // Infrastructure resources
  DOCKER = 'docker',
  DOCKER_VOLUME = 'docker-volume',
  KUBERNETES = 'kubernetes',
  CLOUD = 'cloud',
}

interface ResourceConfiguration {
  connection: ConnectionConfiguration;
  authentication: AuthenticationConfiguration;
  parameters: Record<string, any>;
  healthCheck?: HealthCheckConfiguration;
  monitoring?: MonitoringConfiguration;
}

interface ResourceMetadata {
  vendor?: string;
  version?: string;
  location?: string;
  region?: string;
  zone?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  customFields?: CustomField[];
}
```

#### Resource Capabilities

```typescript
interface ResourceCapability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  operations: OperationType[];
  prerequisites?: CapabilityPrerequisite[];
  limitations?: CapabilityLimitation[];
  estimatedCost?: CostEstimate;
}

enum CapabilityCategory {
  FILESYSTEM = 'filesystem',
  DATABASE = 'database',
  STORAGE = 'storage',
  NETWORK = 'network',
  SECURITY = 'security',
  MONITORING = 'monitoring',
  MANAGEMENT = 'management',
}
```

### 3. Operation and Job Models

#### Job Model

```typescript
interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  resourceId: string;
  sourceResourceId?: string;
  destinationResourceId?: string;
  configuration: JobConfiguration;
  policyId?: string;
  workflowId?: string;
  scheduleId?: string;
  
  // Execution state
  progress: JobProgress;
  currentStep?: string;
  totalSteps?: number;
  estimatedTimeRemaining?: number;
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  scheduledFor?: Date;
  
  // Participants
  organizationId: string;
  createdBy: string;
  assignedTo?: string;
  
  // Results and errors
  result?: JobResult;
  errors: JobError[];
  warnings: JobWarning[];
  
  // Metadata
  tags: string[];
  metadata: JobMetadata;
  checkpoints?: Checkpoint[];
  
  // Monitoring
  logs: LogEntry[];
  metrics?: JobMetrics;
}

enum JobType {
  BACKUP = 'backup',
  RESTORE = 'restore',
  COPY = 'copy',
  MOVE = 'move',
  SYNC = 'sync',
  MIRROR = 'mirror',
  VERIFY = 'verify',
  DELETE = 'delete',
  PRUNE = 'prune',
  ARCHIVE = 'archive',
  COMPRESS = 'compress',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  SNAPSHOT = 'snapshot',
  CLONE = 'clone',
}

enum JobStatus {
  QUEUED = 'QUEUED',
  PLANNING = 'PLANNING',
  RUNNING = 'RUNNING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  RETRYING = 'RETRYING',
  SCHEDULED = 'SCHEDULED',
}

enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

#### Job Progress

```typescript
interface JobProgress {
  percentage: number; // 0-100
  bytesProcessed: number;
  totalBytes: number;
  filesProcessed: number;
  totalFiles: number;
  currentStep: string;
  currentOperation?: string;
  estimatedTimeRemaining: number;
  transferSpeed: number; // bytes per second
  lastUpdated: Date;
}

interface JobConfiguration {
  operationType: JobType;
  parameters: Record<string, any>;
  source: ResourceReference;
  destination: ResourceReference;
  settings: OperationSettings;
  validationRules?: ValidationRule[];
  checkpointConfig?: CheckpointConfiguration;
  notificationConfig?: NotificationConfiguration;
}
```

### 4. Policy Models

#### Policy Model

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  
  // Configuration
  source: ResourceReference;
  destination: ResourceReference;
  operation: PolicyOperation;
  
  // Scheduling
  schedule: ScheduleConfiguration;
  
  // Execution settings
  configuration: PolicyConfiguration;
  settings: PolicySettings;
  
  // Participants
  organizationId: string;
  createdBy: string;
  
  // Retention and cleanup
  retention: RetentionConfiguration;
  verification: VerificationConfiguration;
  
  // Metadata
  tags: string[];
  metadata: PolicyMetadata;
  
  // Statistics
  statistics: PolicyStatistics;
  lastExecuted?: Date;
  nextExecution?: Date;
}

enum PolicyType {
  BACKUP = 'backup',
  RESTORE = 'restore',
  COPY = 'copy',
  SYNC = 'sync',
  MIRROR = 'mirror',
  VERIFY = 'verify',
  CUSTOM = 'custom',
}

enum PolicyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error',
}

interface PolicyConfiguration {
  operation: JobConfiguration;
  compression?: CompressionConfiguration;
  encryption?: EncryptionConfiguration;
  checksum?: ChecksumConfiguration;
  validation?: ValidationConfiguration;
}

interface PolicyOperation {
  type: JobType;
  parameters: Record<string, any>;
  filters?: OperationFilter[];
  transformations?: Transformation[];
}
```

### 5. Workflow Models

#### Workflow Model

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  status: WorkflowStatus;
  
  // Structure
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Execution
  configuration: WorkflowConfiguration;
  settings: WorkflowSettings;
  
  // Participants
  organizationId: string;
  createdBy: string;
  
  // Execution tracking
  lastExecuted?: Date;
  nextExecution?: Date;
  executionCount: number;
  
  // Metadata
  tags: string[];
  metadata: WorkflowMetadata;
}

enum WorkflowType {
  SEQUENCE = 'sequence',
  CONDITIONAL = 'conditional',
  PARALLEL = 'parallel',
  ITERATIVE = 'iterative',
}

enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}
```

#### Workflow Node Model

```typescript
interface WorkflowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeData;
  style?: NodeStyle;
  markers?: NodeMarker[];
}

enum NodeType {
  OPERATION = 'operation',
  CONDITION = 'condition',
  LOOP = 'loop',
  TRANSFORM = 'transform',
  WAIT = 'wait',
  BRANCH = 'branch',
  MERGE = 'merge',
  END = 'end',
}

interface NodeData {
  label: string;
  description?: string;
  operation?: JobConfiguration;
  condition?: WorkflowCondition;
  loop?: LoopConfiguration;
  wait?: WaitConfiguration;
  branch?: BranchConfiguration;
  merge?: MergeConfiguration;
  metadata?: Record<string, any>;
}
```

### 6. Storage and Backup Models

#### Backup Snapshot Model

```typescript
interface BackupSnapshot {
  id: string;
  name: string;
  description: string;
  jobId: string;
  resourceId: string;
  policyId?: string;
  
  // Snapshot metadata
  timestamp: Date;
  sourceResource: ResourceReference;
  destinationResource: ResourceReference;
  
  // Content
  files: BackupFile[]; // For filesystem backups
  databases: DatabaseBackupInfo[]; // For database backups
  objects: StorageObject[]; // For storage backups
  
  // Properties
  size: number;
  compressedSize: number;
  checksum: string;
  checksumAlgorithm: string;
  
  // Access and permissions
  accessibility: AccessibilityLevel;
  encryption: EncryptionInfo;
  
  // Metadata
  tags: string[];
  metadata: BackupMetadata;
  
  // Status
  status: SnapshotStatus;
  verificationStatus?: VerificationStatus;
}

enum SnapshotStatus {
  CREATING = 'creating',
  CREATED = 'created',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
}
```

#### Retention Policy Model

```typescript
interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  type: RetentionType;
  status: RetentionStatus;
  
  // Retention rules
  rules: RetentionRule[];
  
  // Application
  resourceIds: string[]; // Resources affected
  policyIds: string[]; // Policies affected
  
  // Schedule
  schedule: ScheduleConfiguration;
  
  // Metadata
  organizationId: string;
  createdBy: string;
  
  // Statistics
  statistics: RetentionStatistics;
}

enum RetentionType {
  TIME_BASED = 'time_based',
  COUNT_BASED = 'count_based',
  COMBINED = 'combined',
}

interface RetentionRule {
  id: string;
  type: RetentionRuleType;
  enabled: boolean;
  parameters: RetentionRuleParameters;
  action: RetentionAction;
}

enum RetentionRuleType {
  AGE = 'age',
  COUNT = 'count',
  SIZE = 'size',
  CUSTOM = 'custom',
}
```

### 7. Audit and Security Models

#### Audit Log Model

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  
  // Subject
  userId: string;
  organizationId: string;
  sessionId?: string;
  
  // Action
  action: string;
  resourceType: string;
  resourceId: string;
  
  // Changes
  changes: AuditChange[];
  
  // Context
  request: AuditRequest;
  response: AuditResponse;
  
  // Security
  ipAddress: string;
  userAgent: string;
  source: string;
  
  // Metadata
  metadata: AuditMetadata;
  severity: AuditSeverity;
}

enum AuditEventType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  AUTHENTICATE = 'authenticate',
  AUTHORIZE = 'authorize',
  CONFIGURE = 'configure',
  IMPORT = 'import',
  EXPORT = 'export',
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: ChangeType;
}

enum ChangeType {
  ADD = 'add',
  REMOVE = 'remove',
  MODIFY = 'modify',
  REORDER = 'reorder',
}
```

### 8. Configuration Models

#### Environment Configuration Model

```typescript
interface EnvironmentConfiguration {
  nodeEnv: 'development' | 'staging' | 'production';
  app: AppConfiguration;
  server: ServerConfiguration;
  database: DatabaseConfiguration;
  redis: RedisConfiguration;
  storage: StorageConfiguration;
  security: SecurityConfiguration;
  logging: LoggingConfiguration;
  monitoring: MonitoringConfiguration;
  features: FeatureFlags;
}

interface AppConfiguration {
  name: string;
  version: string;
  description: string;
  port: number;
  host: string;
  apiPrefix: string;
  environment: string;
}

interface DatabaseConfiguration {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: SSLConfiguration;
  poolSize: number;
  connectionTimeout: number;
  idleTimeout: number;
}
```

### 9. Communication and Event Models

#### Event Model

```typescript
interface Event {
  id: string;
  type: EventType;
  source: EventSource;
  timestamp: Date;
  
  // Payload
  data: any;
  metadata: EventMetadata;
  
  // Routing
  routingKey: string;
  exchange: string;
  routing: EventRouting;
  
  // Delivery
  deliveryStatus: DeliveryStatus;
  attempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
}

enum EventType {
  // Job events
  JOB_CREATED = 'job.created',
  JOB_STARTED = 'job.started',
  JOB_COMPLETED = 'job.completed',
  JOB_FAILED = 'job.failed',
  JOB_CANCELLED = 'job.cancelled',
  
  // Resource events
  RESOURCE_CREATED = 'resource.created',
  RESOURCE_UPDATED = 'resource.updated',
  RESOURCE_DELETED = 'resource.deleted',
  RESOURCE_HEALTHY = 'resource.healthy',
  RESOURCE_UNHEALTHY = 'resource.unhealthy',
  
  // Policy events
  POLICY_CREATED = 'policy.created',
  POLICY_UPDATED = 'policy.updated',
  POLICY_EXECUTED = 'policy.executed',
  
  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info',
}
```

## Model Validation

### Schema Validation

```typescript
interface ModelValidation {
  validate<T>(model: T, schema: ValidationSchema): ValidationResult;
  validateModel<T>(model: T, modelType: ModelType): ValidationResult;
  validateConstraint<T>(model: T, constraint: Constraint): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### Relationship Validation

```typescript
interface RelationshipValidation {
  validateResourceOwnership(resourceId: string, userId: string): boolean;
  validateOrganizationAccess(resourceId: string, organizationId: string): boolean;
  validatePolicyScope(policyId: string, resourceIds: string[]): boolean;
  validateWorkflowExecution(workflowId: string, resources: Resource[]): ValidationResult;
}
```

## Model Persistence

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES users(id),
  storage_configuration JSONB NOT NULL
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  subtype VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'unknown',
  health JSONB NOT NULL DEFAULT '{}',
  configuration JSONB NOT NULL,
  credentials JSONB NOT NULL DEFAULT '[]',
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  indices: (organization_id, type, status)
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  resource_id UUID REFERENCES resources(id),
  configuration JSONB NOT NULL,
  policy_id UUID REFERENCES policies(id),
  workflow_id UUID REFERENCES workflows(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  result JSONB,
  errors JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  progress JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  indices: (status, organization_id, created_at, type)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  request JSONB NOT NULL DEFAULT '{}',
  response JSONB,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  source VARCHAR(100) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  severity VARCHAR(50) NOT NULL DEFAULT 'info',
  indices: (timestamp, event_type, resource_type, user_id, organization_id)
);
```

### Index Strategy

```sql
-- Performance indexes
CREATE INDEX idx_resources_organization_type_status ON resources(organization_id, type, status);
CREATE INDEX idx_jobs_status_organization_created ON jobs(status, organization_id, created_at);
CREATE INDEX idx_jobs_type_status ON jobs(type, status);
CREATE INDEX idx_audit_logs_timestamp_event_type ON audit_logs(timestamp, event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

## Model Extensions

### Plugin-Based Extensions

```typescript
interface ModelExtension {
  name: string;
  version: string;
  description: string;
  
  // Extended models
  extendedModels: ExtendedModel[];
  
  // Validation extensions
  validationRules: ValidationRule[];
  
  // Event handlers
  eventHandlers: EventHandler[];
  
  // Lifecycle hooks
  initialize(): void;
  destroy(): void;
}

interface ExtendedModel {
  name: string;
  baseModel: string;
  fields: FieldDefinition[];
  relations: RelationDefinition[];
}
```

### Custom Model Factory

```typescript
class ModelFactory {
  private static registry: Map<string, ModelDefinition> = new Map();
  
  static register(model: ModelDefinition): void {
    this.registry.set(model.name, model);
  }
  
  static create<T>(modelName: string, data: any): T {
    const model = this.registry.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model.create(data) as T;
  }
  
  static validate<T>(modelName: string, data: any): ValidationResult {
    const model = this.registry.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model.validate(data);
  }
}
```

## Model Testing

### Unit Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { User } from '../models/user';
import { Resource } from '../models/resource';
import { Job } from '../models/job';

describe('User Model', () => {
  it('should validate user email', () => {
    const user = new User({
      id: 'test-id',
      email: 'invalid-email',
      username: 'testuser',
      displayName: 'Test User',
      status: 'active',
      roles: [],
      organizations: [],
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notificationSettings: {},
        accessibility: {},
      },
    });
    
    const result = user.validate();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { ModelValidator } from '../validation/model-validator';
import { User, Resource, Job } from '../models';

describe('Model Integration Tests', () => {
  it('should validate model relationships', async () => {
    const validator = new ModelValidator();
    
    const user = new User({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user1',
      displayName: 'User One',
      status: 'active',
      roles: [],
      organizations: ['org-1'],
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notificationSettings: {},
        accessibility: {},
      },
    });
    
    const resource = new Resource({
      id: 'resource-1',
      name: 'Test Resource',
      type: 'server',
      status: 'healthy',
      health: { status: 'healthy' },
      configuration: {
        connection: { host: 'localhost', port: 22 },
        authentication: { method: 'ssh' },
        parameters: {},
      },
      credentials: [],
      capabilities: [],
      organizationId: 'org-1',
      createdBy: 'user-1',
      metadata: {},
      tags: [],
      aliases: [],
    });
    
    const validation = await validator.validateResourceOwnership(
      resource.id,
      user.id
    );
    
    expect(validation.valid).toBe(true);
  });
});
```

## Model Migration

### Version Migration

```typescript
interface ModelMigration {
  fromVersion: string;
  toVersion: string;
  migrate(data: any): any;
  rollback(data: any): any;
}

class ModelMigrationManager {
  private migrations: Map<string, ModelMigration[]> = new Map();
  
  registerMigration(modelName: string, migration: ModelMigration): void {
    if (!this.migrations.has(modelName)) {
      this.migrations.set(modelName, []);
    }
    this.migrations.get(modelName)!.push(migration);
  }
  
  async migrate(modelName: string, data: any, targetVersion: string): Promise<any> {
    const modelMigrations = this.migrations.get(modelName) || [];
    const applicableMigrations = modelMigrations.filter(m =>
      m.toVersion === targetVersion
    );
    
    let migratedData = data;
    for (const migration of applicableMigrations) {
      migratedData = await migration.migrate(migratedData);
    }
    
    return migratedData;
  }
}
```

## Conclusion

The BackupOps data model system provides a comprehensive, type-safe foundation for managing all aspects of the backup operations platform. By following the principles of consistency, extensibility, and validation, the data models ensure data integrity, performance, and maintainability across the entire BackupOps ecosystem. The model system is designed to scale with the platform and support future enhancements while maintaining backward compatibility.