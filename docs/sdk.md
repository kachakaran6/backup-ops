# BackupOps SDK Documentation

## Overview

BackupOps provides a comprehensive SDK for integrating with the platform programmatically. The SDK enables developers to interact with BackupOps features from custom applications, automation scripts, and third-party integrations while maintaining security, type safety, and ease of use.

## SDK Architecture

### Core Components

```text
sdk/
├── clients/                      # Language-specific clients
│   ├── javascript/              # JavaScript/TypeScript SDK
│   ├── python/                  # Python SDK
│   ├── go/                      # Go SDK
│   └── java/                     # Java SDK
├── types/                        # Shared type definitions
│   ├── api/                     # API client types
│   ├── models/                  # Data model types
│   ├── services/                # Service interfaces
│   └── utils/                   # Helper types
├── auth/                         # Authentication utilities
├── plugins/                      # Plugin system
└── transformers/                 # Data transformation utilities
```

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @backup-ops/sdk
```

### Quick Start

```typescript
import { BackupOpsClient, ResourceClient, JobClient, PolicyClient } from '@backup-ops/sdk';

// Initialize client
const client = new BackupOpsClient({
  baseURL: 'https://backup-ops.example.com',
  apiKey: 'your-api-key',
});

// Get resources
const resources = await client.resources.list();

// Create a resource
const resource = await client.resources.create({
  name: 'production-db',
  type: 'postgresql',
  configuration: {
    host: 'localhost',
    port: 5432,
    database: 'production',
  },
});
```

### Core Clients

#### ResourceClient

```typescript
interface ResourceClient {
  // List resources
  list(params?: ResourceListParams): Promise<Resource[]>;
  
  // Get resource by ID
  get(id: string): Promise<Resource>;
  
  // Create resource
  create(resource: CreateResourceRequest): Promise<Resource>;
  
  // Update resource
  update(id: string, updates: Partial<Resource>): Promise<Resource>;
  
  // Delete resource
  delete(id: string): Promise<void>;
  
  // Test resource connection
  testConnection(id: string): Promise<ConnectionTestResult>;
  
  // Get resource capabilities
  getCapabilities(type: string): Promise<ResourceCapability[]>;
  
  // Browse resource contents
  browse(resourceId: string, path?: string): Promise<ResourceItem[]>;
}
```

#### JobClient

```typescript
interface JobClient {
  // List jobs
  list(params?: JobListParams): Promise<JobCollection>;
  
  // Get job details
  get(id: string): Promise<Job>;
  
  // Create job
  create(job: CreateJobRequest): Promise<Job>;
  
  // Cancel job
  cancel(id: string): Promise<void>;
  
  // Retry job
  retry(id: string): Promise<Job>;
  
  // Get job logs
  getLogs(id: string, params?: JobLogParams): Promise<LogEntry[]>;
  
  // Monitor job progress
  monitor(id: string, callback: JobProgressCallback): Observable<JobProgress>;
}
```

#### PolicyClient

```typescript
interface PolicyClient {
  // List policies
  list(params?: PolicyListParams): Promise<PolicyCollection>;
  
  // Get policy
  get(id: string): Promise<Policy>;
  
  // Create policy
  create(policy: CreatePolicyRequest): Promise<Policy>;
  
  // Update policy
  update(id: string, updates: Partial<Policy>): Promise<Policy>;
  
  // Delete policy
  delete(id: string): Promise<void>;
  
  // Execute policy
  execute(id: string): Promise<Job>;
  
  // Validate policy
  validate(policy: CreatePolicyRequest): Promise<ValidationResult>;
}
```

#### WorkflowClient

```typescript
interface WorkflowClient {
  // List workflows
  list(params?: WorkflowListParams): Promise<WorkflowCollection>;
  
  // Get workflow
  get(id: string): Promise<Workflow>;
  
  // Create workflow
  create(workflow: CreateWorkflowRequest): Promise<Workflow>;
  
  // Update workflow
  update(id: string, updates: Partial<Workflow>): Promise<Workflow>;
  
  // Delete workflow
  delete(id: string): Promise<void>;
  
  // Execute workflow
  execute(id: string): Promise<WorkflowExecution>;
  
  // Get workflow execution status
  getExecution(workflowId: string, executionId: string): Promise<WorkflowExecution>;
}
```

### Authentication

#### API Key Authentication

```typescript
const client = new BackupOpsClient({
  baseURL: 'https://api.backup-ops.example.com',
  apiKey: 'your-api-key-here',
  timeout: 30000,
});
```

#### OAuth 2.0 Authentication

```typescript
import { OAuth2Client } from '@backup-ops/sdk/auth';

const oauthClient = new OAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/callback',
  authURL: 'https://backup-ops.example.com/oauth/authorize',
  tokenURL: 'https://backup-ops.example.com/oauth/token',
});

const accessToken = await oauthClient.getAccessToken(code);

const client = new BackupOpsClient({
  baseURL: 'https://api.backup-ops.example.com',
  accessToken,
});
```

### Error Handling

```typescript
import { BackupOpsError, ErrorCode } from '@backup-ops/sdk';

try {
  const resource = await client.resources.get('non-existent-id');
} catch (error) {
  if (error instanceof BackupOpsError) {
    switch (error.code) {
      case ErrorCode.NOT_FOUND:
        console.log('Resource not found');
        break;
      case ErrorCode.UNAUTHORIZED:
        console.log('Authentication required');
        break;
      case ErrorCode.VALIDATION_ERROR:
        console.log('Invalid request:', error.message);
        break;
      default:
        console.log('Unexpected error:', error.message);
    }
  }
}
```

### Type Definitions

#### Resource Types

```typescript
enum ResourceType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  SERVER = 'server',
  DOCKER = 'docker',
  S3 = 's3',
  LOCAL_FS = 'local-fs',
  SFTP = 'sftp',
}

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  configuration: Record<string, any>;
  health?: ResourceHealth;
  capabilities: ResourceCapability[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  metadata?: Record<string, any>;
}
```

#### Job Types

```typescript
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
}

enum JobType {
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  COPY = 'COPY',
  MOVE = 'MOVE',
  SYNC = 'SYNC',
  MIRROR = 'MIRROR',
  VERIFY = 'VERIFY',
  DELETE = 'DELETE',
  PRUNE = 'PRUNE',
}

interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  resourceId: string;
  configuration: JobConfiguration;
  progress: JobProgress;
  logs: LogEntry[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  organizationId: string;
  policyId?: string;
  workflowId?: string;
  metadata?: Record<string, any>;
}
```

## Python SDK

### Installation

```bash
pip install backup-ops-sdk
```

### Quick Start

```python
from backup_ops import BackupOpsClient

# Initialize client
client = BackupOpsClient(
    base_url='https://backup-ops.example.com',
    api_key='your-api-key'
)

# Get resources
resources = client.resources.list()

# Create a resource
resource = client.resources.create({
    'name': 'production-db',
    'type': 'postgresql',
    'configuration': {
        'host': 'localhost',
        'port': 5432,
        'database': 'production'
    }
})
```

### Python-Specific Features

#### Context Managers

```python
async with BackupOpsClient(...) as client:
    resource = await client.resources.get('id')
    # Automatically handles cleanup
```

#### Type Hints and Validation

```python
from backup_ops.types import ResourceConfig

def create_resource(config: ResourceConfig) -> Resource:
    return client.resources.create(config)
```

## Go SDK

### Installation

```bash
go get github.com/backup-ops/sdk/go
```

### Quick Start

```go
package main

import (
    "context"
    "github.com/backup-ops/sdk/go"
)

func main() {
    // Create client
    client, err := sdk.NewClient(&sdk.ClientConfig{
        BaseURL: "https://backup-ops.example.com",
        APIKey: "your-api-key",
    })
    if err != nil {
        panic(err)
    }
    
    // List resources
    resources, err := client.Resources.List(context.Background(), nil)
    if err != nil {
        panic(err)
    }
    
    // Create resource
    resource, err := client.Resources.Create(context.Background(), &sdk.Resource{
        Name: "production-db",
        Type: "postgresql",
        Configuration: map[string]interface{}{
            "host": "localhost",
            "port": 5432,
            "database": "production",
        },
    })
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Created resource: %s", resource.ID)
}
```

### Go SDK Features

#### Concurrency Support

```go
// Fetch resources concurrently
ctx := context.Background()
resourceIDs := []string{"id1", "id2", "id3"}

var wg sync.WaitGroup
results := make(chan *sdk.Resource, len(resourceIDs))

for _, id := range resourceIDs {
    wg.Add(1)
    go func(resourceID string) {
        defer wg.Done()
        resource, err := client.Resources.Get(ctx, resourceID)
        if err != nil {
            // Handle error
            return
        }
        results <- resource
    }(id)
}

wg.Wait()
close(results)
```

## Java SDK

### Installation

```xml
<dependency>
    <groupId>com.backup-ops</groupId>
    <artifactId>sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Quick Start

```java
import com.backupops.sdk.*;

public class BackupOpsExample {
    public static void main(String[] args) throws BackupOpsException {
        // Initialize client
        BackupOpsClient client = new BackupOpsClient(
            "https://backup-ops.example.com",
            "your-api-key"
        );
        
        // List resources
        List<Resource> resources = client.resources().list();
        
        // Create resource
        Resource resource = client.resources().create(
            Resource.builder()
                .name("production-db")
                .type("postgresql")
                .configuration(Map.of(
                    "host", "localhost",
                    "port", 5432,
                    "database", "production"
                ))
                .build()
        );
    }
}
```

## SDK Configuration

### Client Configuration

```typescript
interface ClientConfig {
  baseURL: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
}
```

### Environment Configuration

```typescript
// config.ts
export const config = {
  backupOps: {
    baseURL: process.env.BACKUP_OPS_URL || 'https://backup-ops.example.com',
    apiKey: process.env.BACKUP_OPS_API_KEY,
    timeout: parseInt(process.env.BACKUP_OPS_TIMEOUT) || 30000,
    retries: parseInt(process.env.BACKUP_OPS_RETRIES) || 3,
  },
};
```

## Plugin System

### Plugin Architecture

```typescript
interface Plugin {
  name: string;
  version: string;
  author: string;
  
  initialize(client: BackupOpsClient): void;
  destroy(): void;
  getClientExtensions(): ClientExtension[];
  getMiddleware(): Middleware[];
}
```

### Built-in Plugins

#### Logging Plugin

```typescript
class LoggingPlugin implements Plugin {
  name = 'logging';
  version = '1.0.0';
  author = 'BackupOps Team';
  
  initialize(client: BackupOpsClient) {
    client.addMiddleware(new LoggingMiddleware());
  }
  
  destroy() {
    // Cleanup
  }
  
  getClientExtensions(): ClientExtension[] {
    return [];
  }
  
  getMiddleware(): Middleware[] {
    return [new LoggingMiddleware()];
  }
}
```

#### Validation Plugin

```typescript
class ValidationPlugin implements Plugin {
  name = 'validation';
  version = '1.0.0';
  author = 'BackupOps Team';
  
  initialize(client: BackupOpsClient) {
    client.addMiddleware(new ValidationMiddleware());
  }
  
  destroy() {
    // Cleanup
  }
  
  getClientExtensions(): ClientExtension[] {
    return [new ValidationExtension()];
  }
  
  getMiddleware(): Middleware[] {
    return [new ValidationMiddleware()];
  }
}
```

## Testing and Development

### Unit Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BackupOpsClient } from '@backup-ops/sdk';
import { MockApiClient } from './mocks/api-client';

describe('ResourceClient', () => {
  let client: BackupOpsClient;
  let mockApi: MockApiClient;
  
  beforeEach(() => {
    mockApi = new MockApiClient();
    client = new BackupOpsClient({ baseURL: 'https://test.example.com' });
    client.setApiClient(mockApi);
  });
  
  it('should list resources', async () => {
    const mockResources = [
      { id: '1', name: 'Resource 1', type: 'postgresql' },
      { id: '2', name: 'Resource 2', type: 'server' },
    ];
    
    mockApi.setResponse('/resources', mockResources);
    
    const resources = await client.resources.list();
    expect(resources).toEqual(mockResources);
  });
});
```

### Integration Testing

```typescript
import { BackupOpsClient } from '@backup-ops/sdk';

describe('Integration Tests', () => {
  it('should create and retrieve resource', async () => {
    const client = new BackupOpsClient({
      baseURL: process.env.BACKUP_OPS_URL,
      apiKey: process.env.BACKUP_OPS_API_KEY,
    });
    
    const resource = await client.resources.create({
      name: 'integration-test',
      type: 'server',
      configuration: { host: 'localhost' },
    });
    
    expect(resource.id).toBeDefined();
    
    const retrieved = await client.resources.get(resource.id);
    expect(retrieved.id).toEqual(resource.id);
    
    await client.resources.delete(resource.id);
  }, 60000); // 60 second timeout
});
```

## Migration Guide

### From v0.x to v1.0

1. **Breaking Changes**:
   - Client constructor signature changed
   - Method signatures updated
   - Type definitions enhanced

2. **Migration Steps**:
   ```typescript
   // Old way
   const client = new BackupOpsClient('https://api.example.com', 'key');
   
   // New way
   const client = new BackupOpsClient({
     baseURL: 'https://api.example.com',
     apiKey: 'key',
   });
   ```

3. **Updated Methods**:
   ```typescript
   // Old
   const resource = await client.getResource('id');
   
   // New
   const resource = await client.resources.get('id');
   ```

### Version Support

The SDK maintains compatibility with the current BackupOps API version and supports:

- **API Version**: v1
- **TypeScript**: 4.5+
- **Node.js**: 16+
- **Python**: 3.8+
- **Go**: 1.19+
- **Java**: 11+

## Future Development

### Planned SDK Enhancements

1. **Streaming API**: Support for real-time operations
2. **GraphQL Integration**: Alternative query interface
3. **WebSocket Client**: Real-time updates
4. **CLI Tools**: Command-line interface for common operations
5. **IDE Plugins**: Enhanced developer experience

### Community Contributions

The SDK welcomes contributions:

- **Bug Reports**: Report issues in GitHub
- **Feature Requests**: Submit enhancement requests
- **Code Contributions**: Pull requests with tests
- **Documentation**: Improve examples and guides

## Conclusion

The BackupOps SDK provides a comprehensive, type-safe interface for integrating with BackupOps across multiple programming languages. With its modular architecture, extensive plugin system, and comprehensive testing, the SDK enables developers to build powerful automation solutions while maintaining security and reliability.