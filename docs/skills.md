# Agent Skills System

## Overview

BackupOps provides a modular skills system for agents to extend their capabilities and interact with user infrastructure. Skills enable the Go agent to perform specific operations through well-defined interfaces and standardized communication patterns.

## Skills Architecture

### Core Skills

Skills are organized by functional areas:

- **Filesystem Skills**: Read, write, copy, move, delete
- **Database Skills**: Query, backup, restore, schema operations
- **Docker Skills**: Container operations, volume management
- **Network Skills**: Connection testing, SSH operations
- **Security Skills**: Authentication, authorization, credential management
- **Transfer Skills**: Chunked transfers, resumable operations
- **Verification Skills**: Checksum validation, integrity checking
- **Operation Skills**: Policy execution, workflow management

### Skills Lifecycle

1. **Registration**: Skills are discovered and registered with the agent
2. **Capability Validation**: Skills verify they can execute their operations
3. **Permission Checking**: Skills validate user permissions before execution
4. **Execution**: Skills perform their operations with proper error handling
5. **Reporting**: Skills report progress, results, and any errors
6. **Cleanup**: Skills clean up resources and state after completion

## Skills Interface

### Base Skill Interface

```go
import (
    "context"
    "time"
)

type Skill interface {
    // GetSkillInfo returns metadata about this skill
    GetSkillInfo() SkillInfo
    
    // ValidatePrerequisites checks if the skill can execute
    ValidatePrerequisites(ctx context.Context) error
    
    // Execute performs the skill's operation
    Execute(ctx context.Context, params SkillParams) (*SkillResult, error)
    
    // Cancel attempts to cancel an ongoing execution
    Cancel(ctx context.Context, executionID string) error
    
    // GetStatus retrieves the current status of an execution
    GetStatus(ctx context.Context, executionID string) (*ExecutionStatus, error)
}
```

### Skill Information

```go
type SkillInfo struct {
    ID             string   `json:"id"`
    Name           string   `json:"name"`
    Description    string   `json:"description"`
    Category       string   `json:"category"`
    Version        string   `json:"version"`
    RequiredPermissions []string `json:"requiredPermissions"`
    Capabilities   []string `json:"capabilities"`
    Resources      []string `json:"resources"`
    Timeout        time.Duration `json:"timeout"`
    RetryPolicy    RetryPolicy `json:"retryPolicy"`
    Author         string   `json:"author"`
    Documentation  string   `json:"documentation"`
}
```

### Skill Parameters

```go
type SkillParams struct {
    // Common parameters
    Context       map[string]interface{} `json:"context"`
    Options       map[string]interface{} `json:"options"`
    
    // Operation-specific parameters
    Source        *ResourceRef `json:"source,omitempty"`
    Destination   *ResourceRef `json:"destination,omitempty"`
    Configuration map[string]interface{} `json:"configuration,omitempty"`
    Credentials  map[string]string `json:"credentials,omitempty"`
}
```

### Skill Results

```go
type SkillResult struct {
    Success       bool     `json:"success"`
    Message       string   `json:"message"`
    Data          interface{} `json:"data,omitempty"`
    Metadata      map[string]interface{} `json:"metadata,omitempty"`
    StartedAt     time.Time `json:"startedAt"`
    CompletedAt   time.Time `json:"completedAt,omitempty"`
    Duration      time.Duration `json:"duration"`
    Error         *SkillError `json:"error,omitempty"`
    Logs          []LogEntry `json:"logs,omitempty"`
}
```

### Skill Error

```go
type SkillError struct {
    Code          string   `json:"code"`
    Message       string   `json:"message"`
    Details       string   `json:"details,omitempty"`
    Retryable     bool     `json:"retryable"`
    Severity      string   `json:"severity"`
    SuggestedAction string   `json:"suggestedAction,omitempty"`
}
```

### Execution Status

```go
type ExecutionStatus struct {
    ExecutionID   string   `json:"executionId"`
    SkillID       string   `json:"skillId"`
    State         ExecutionState `json:"state"`
    Progress      float64  `json:"progress"`
    CurrentStep   string   `json:"currentStep"`
    StartedAt     time.Time `json:"startedAt"`
    UpdatedAt     time.Time `json:"updatedAt"`
    Error         *SkillError `json:"error,omitempty"`
    Checkpoint    interface{} `json:"checkpoint,omitempty"`
}
```

### Retry Policy

```go
type RetryPolicy struct {
    MaxAttempts    int           `json:"maxAttempts"`
    InitialDelay   time.Duration `json:"initialDelay"`
    MaxDelay       time.Duration `json:"maxDelay"`
    BackoffFactor  float64       `json:"backoffFactor"`
    RetryableErrors []string     `json:"retryableErrors"`
}
```

### Execution State

type ExecutionState string

const (
    StatePending    ExecutionState = "pending"
    StateRunning    ExecutionState = "running"
    StateCompleted  ExecutionState = "completed"
    StateFailed     ExecutionState = "failed"
    StateCancelled  ExecutionState = "cancelled"
    StateTimeout    ExecutionState = "timeout"
    StateRetryable  ExecutionState = "retryable"
)
```

## Skill Registry

### SkillRegistry Interface

```go
import (
    "context"
    "github.com/backup-ops/agent/proto/skillspb"
)

type SkillRegistry interface {
    // Register registers a skill with the registry
    Register(skill Skill) error
    
    // Unregister unregisters a skill
    Unregister(skillID string) error
    
    // GetSkill retrieves a skill by ID
    GetSkill(skillID string) (Skill, error)
    
    // ListSkills returns all registered skills
    ListSkills() []SkillInfo
    
    // GetSkillsByCategory returns skills in a category
    GetSkillsByCategory(category string) []SkillInfo
    
    // GetSkillsForResource returns skills that can operate on a resource type
    GetSkillsForResource(resourceType string) []SkillInfo
    
    // ValidatePermissions checks if a skill can be executed with given permissions
    ValidatePermissions(skillID string, permissions []string) error
}
```

## Built-in Skills

### Filesystem Skills

#### ReadSkill

```go
// ReadSkill reads files from the filesystem
type ReadSkill struct {
    baseSkill
}

func (s *ReadSkill) GetSkillInfo() SkillInfo {
    return SkillInfo{
        ID: "com.backup-ops.filesystem.read",
        Name: "File Reader",
        Description: "Read file contents from filesystem",
        Category: "filesystem",
        Version: "1.0.0",
        RequiredPermissions: []string{"read"},
        Capabilities: []string{"read", "file"},
        Resources: []string{"file", "directory"},
        Timeout: 30 * time.Second,
        RetryPolicy: RetryPolicy{MaxAttempts: 3, InitialDelay: 1 * time.Second},
        Documentation: "Reads file contents with support for large files and resumable operations",
    }
}

func (s *ReadSkill) Execute(ctx context.Context, params SkillParams) (*SkillResult, error) {
    fileRef, ok := params.Source.(*FileResourceRef)
    if !ok {
        return nil, &SkillError{Code: "invalid_params", Message: "Source must be a file reference"}
    }
    
    // Execute file read operation
    result, err := s.executeRead(ctx, fileRef, params.Options)
    if err != nil {
        return nil, err
    }
    
    return &SkillResult{
        Success: true,
        Message: "File read successfully",
        Data: map[string]interface{}{"content": result.Content, "size": result.Size},
        StartedAt: result.StartedAt,
        CompletedAt: result.CompletedAt,
        Duration: result.Duration,
    }, nil
}
```

#### CopySkill

```go
// CopySkill copies files between locations
type CopySkill struct {
    baseSkill
}

func (s *CopySkill) GetSkillInfo() SkillInfo {
    return SkillInfo{
        ID: "com.backup-ops.transfer.copy",
        Name: "File Copier",
        Description: "Copy files from source to destination",
        Category: "transfer",
        Version: "1.0.0",
        RequiredPermissions: []string{"read", "write"},
        Capabilities: []string{"copy", "transfer", "filesystem"},
        Resources: []string{"file", "directory"},
        Timeout: 0, // No timeout for long transfers
        RetryPolicy: RetryPolicy{MaxAttempts: 2, InitialDelay: 2 * time.Second, MaxDelay: 30 * time.Second},
        Documentation: "Performs efficient file copying with checksum verification and resumable support",
    }
}
```

### Database Skills

#### PostgreSQLBackupSkill

```go
// PostgreSQLBackupSkill creates PostgreSQL database backups
type PostgreSQLBackupSkill struct {
    baseSkill
    config DatabaseConfig
}

func (s *PostgreSQLBackupSkill) GetSkillInfo() SkillInfo {
    return SkillInfo{
        ID: "com.backup-ops.database.postgresql.backup",
        Name: "PostgreSQL Backup",
        Description: "Create PostgreSQL database backup",
        Category: "database",
        Version: "1.0.0",
        RequiredPermissions: []string{"read"},
        Capabilities: []string{"backup", "database", "postgresql"},
        Resources: []string{"database"},
        Timeout: 300 * time.Second, // 5 minutes for backup
        RetryPolicy: RetryPolicy{MaxAttempts: 1, InitialDelay: 10 * time.Second},
        Documentation: "Creates PostgreSQL database backup using pg_dump with compression and checksum",
    }
}

func (s *PostgreSQLBackupSkill) Execute(ctx context.Context, params SkillParams) (*SkillResult, error) {
    // Validate database connection
    if err := s.validateConnection(ctx, params.Credentials); err != nil {
        return nil, err
    }
    
    // Execute backup
    backup, err := s.executeBackup(ctx, params.Source, params.Options)
    if err != nil {
        return nil, err
    }
    
    return &SkillResult{
        Success: true,
        Message: "Database backup completed successfully",
        Data: map[string]interface{}{
            "backupPath": backup.Path,
            "size": backup.Size,
            "checksum": backup.Checksum,
            "duration": backup.Duration,
        },
        StartedAt: backup.StartedAt,
        CompletedAt: backup.CompletedAt,
        Duration: backup.Duration,
    }, nil
}
```

### Docker Skills

#### DockerVolumeSkill

```go
// DockerVolumeSkill manages Docker volumes
type DockerVolumeSkill struct {
    baseSkill
}

func (s *DockerVolumeSkill) GetSkillInfo() SkillInfo {
    return SkillInfo{
        ID: "com.backup-ops.docker.volume",
        Name: "Docker Volume Manager",
        Description: "Manage Docker volumes for backup and restore",
        Category: "docker",
        Version: "1.0.0",
        RequiredPermissions: []string{"read", "write"},
        Capabilities: []string{"volume", "backup", "docker"},
        Resources: []string{"volume", "container"},
        Timeout: 60 * time.Second,
        RetryPolicy: RetryPolicy{MaxAttempts: 2, InitialDelay: 5 * time.Second},
        Documentation: "Manages Docker volumes including create, mount, backup, and restore operations",
    }
}
```

## Skill Communication Protocol

### Skill gRPC Service

```protobuf
syntax = "proto3";

package backup_ops.agent.skills;

option go_package = "github.com/backup-ops/agent/proto/skillspb";

import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";

// SkillRegistry service for agent to manage skills

service SkillRegistryService {
    // RegisterSkill registers a new skill with the agent
    rpc RegisterSkill(RegisterSkillRequest) returns (RegisterSkillResponse);
    
    // UnregisterSkill removes a skill from the agent
    rpc UnregisterSkill(UnregisterSkillRequest) returns (UnregisterSkillResponse);
    
    // ListSkills returns all registered skills
    rpc ListSkills(ListSkillsRequest) returns (ListSkillsResponse);
    
    // GetSkill retrieves a specific skill
    rpc GetSkill(GetSkillRequest) returns (GetSkillResponse);
    
    // ExecuteSkill executes a skill with given parameters
    rpc ExecuteSkill(ExecuteSkillRequest) returns (ExecuteSkillResponse);
    
    // CancelSkill cancels a running skill execution
    rpc CancelSkill(CancelSkillRequest) returns (CancelSkillResponse);
    
    // GetSkillStatus retrieves the status of a skill execution
    rpc GetSkillStatus(GetSkillStatusRequest) returns (GetSkillStatusResponse);
}

// Skill information
message SkillInfo {
    string id = 1;
    string name = 2;
    string description = 3;
    string category = 4;
    string version = 5;
    repeated string required_permissions = 6;
    repeated string capabilities = 7;
    repeated string resources = 8;
    google.protobuf.Duration timeout = 9;
    RetryPolicy retry_policy = 10;
    string author = 11;
    string documentation = 12;
}

// Retry policy configuration
message RetryPolicy {
    int32 max_attempts = 1;
    google.protobuf.Duration initial_delay = 2;
    google.protobuf.Duration max_delay = 3;
    double backoff_factor = 4;
    repeated string retryable_errors = 5;
}

// Skill parameters
message SkillParams {
    map<string, google.protobuf.Any> context = 1;
    map<string, google.protobuf.Any> options = 2;
    ResourceRef source = 3;
    ResourceRef destination = 4;
    map<string, string> credentials = 5;
    map<string, google.protobuf.Any> configuration = 6;
}

// Resource reference
message ResourceRef {
    string type = 1;
    string id = 2;
    map<string, string> parameters = 3;
}

// Skill result
message SkillResult {
    bool success = 1;
    string message = 2;
    google.protobuf.Any data = 3;
    map<string, google.protobuf.Any> metadata = 4;
    google.protobuf.Timestamp started_at = 5;
    google.protobuf.Timestamp completed_at = 6;
    google.protobuf.Duration duration = 7;
    SkillError error = 8;
    repeated LogEntry logs = 9;
}

// Skill error
message SkillError {
    string code = 1;
    string message = 2;
    string details = 3;
    bool retryable = 4;
    string severity = 5;
    string suggested_action = 6;
}

// Log entry
message LogEntry {
    google.protobuf.Timestamp timestamp = 1;
    string level = 2;
    string message = 3;
    map<string, string> context = 4;
}

// Execution status
message ExecutionStatus {
    string execution_id = 1;
    string skill_id = 2;
    ExecutionState state = 3;
    float progress = 4;
    string current_step = 5;
    google.protobuf.Timestamp started_at = 6;
    google.protobuf.Timestamp updated_at = 7;
    SkillError error = 8;
    google.protobuf.Any checkpoint = 9;
}

enum ExecutionState {
    STATE_UNKNOWN = 0;
    STATE_PENDING = 1;
    STATE_RUNNING = 2;
    STATE_COMPLETED = 3;
    STATE_FAILED = 4;
    STATE_CANCELLED = 5;
    STATE_TIMEOUT = 6;
    STATE_RETRYABLE = 7;
}

// Request/Response messages
message RegisterSkillRequest {
    SkillInfo skill_info = 1;
}

message RegisterSkillResponse {
    bool success = 1;
    string message = 2;
    string skill_id = 3;
}

message UnregisterSkillRequest {
    string skill_id = 1;
}

message UnregisterSkillResponse {
    bool success = 1;
    string message = 2;
}

message ListSkillsRequest {
    string category = 1;
}

message ListSkillsResponse {
    repeated SkillInfo skills = 1;
}

message GetSkillRequest {
    string skill_id = 1;
}

message GetSkillResponse {
    SkillInfo skill = 1;
}

message ExecuteSkillRequest {
    string skill_id = 1;
    SkillParams params = 2;
}

message ExecuteSkillResponse {
    bool success = 1;
    string message = 2;
    string execution_id = 3;
    google.protobuf.Timestamp started_at = 4;
}

message CancelSkillRequest {
    string execution_id = 1;
    string reason = 2;
}

message CancelSkillResponse {
    bool success = 1;
    string message = 2;
}

message GetSkillStatusRequest {
    string execution_id = 1;
}

message GetSkillStatusResponse {
    ExecutionStatus status = 1;
}
```
```

## Skill Testing Framework

### Unit Testing

```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/backup-ops/agent/skills"
)

type TestReadSkill struct {
    *skills.BaseSkill
}

func (t *TestReadSkill) TestExecute(t *testing.T) {
    skill := &ReadSkill{baseSkill: skills.NewBaseSkill(TestReadSkill{})}
    
    info := skill.GetSkillInfo()
    assert.Equal(t, "com.backup-ops.filesystem.read", info.ID)
    assert.Contains(t, info.Capabilities, "read")
}

func (t *TestReadSkill) TestValidatePrerequisites(t *testing.T) {
    skill := &ReadSkill{baseSkill: skills.NewBaseSkill(TestReadSkill{})}
    
    ctx := context.Background()
    err := skill.ValidatePrerequisites(ctx)
    // Should return error if preconditions not met
    assert.Error(t, err)
}
```

### Integration Testing

```go
import (
    "testing"
    "github.com/backup-ops/agent"
    "github.com/backup-ops/agent/skills"
)

func TestSkillIntegration(t *testing.T) {
    agentService := agent.NewAgentService()
    
    // Register a test skill
    testSkill := &TestReadSkill{}
    agentService.RegisterSkill(testSkill)
    
    // List skills
    skills := agentService.ListSkills()
    assert.NotEmpty(t, skills)
    
    // Get skill by ID
    skill, err := agentService.GetSkill("com.backup-ops.filesystem.read")
    assert.NoError(t, err)
    assert.NotNil(t, skill)
}
```

## Skill Security Model

### Permission System

Skills require explicit permissions based on their capabilities:

- **Read**: Access to read files, database tables, system information
- **Write**: Ability to write files, create databases, modify systems
- **Execute**: Permission to run commands or scripts
- **Admin**: Full administrative privileges

### Capability Verification

```go
func (s *BaseSkill) ValidatePermissions(permissions []string) error {
    for _, required := range s.info.RequiredPermissions {
        found := false
        for _, granted := range permissions {
            if required == granted {
                found = true
                break
            }
        }
        if !found {
            return &SkillError{
                Code: "insufficient_permissions",
                Message: fmt.Sprintf("Skill requires permission: %s", required),
                SuggestedAction: "Request additional permissions or use a different skill",
            }
        }
    }
    return nil
}
```

### Sandboxing

Skills run in isolated contexts with resource limits:

- **CPU Limits**: Maximum CPU usage per skill execution
- **Memory Limits**: Maximum memory consumption
- **I/O Limits**: Maximum file operations per minute
- **Network Limits**: Maximum network bandwidth
- **Timeout Limits**: Hard timeout for skill execution

## Skill Lifecycle Management

### Skill Registration

```go
// main.go
func main() {
    agent := agent.NewAgent()
    
    // Register built-in skills
    registerBuiltInSkills(agent)
    
    // Load external skills
    loadExternalSkills(agent)
    
    // Start the agent
    agent.Start()
}

func registerBuiltInSkills(agent *agent.Agent) {
    skills := []skills.Skill{
        &ReadSkill{baseSkill: skills.NewBaseSkill(ReadSkill{})},
        &CopySkill{baseSkill: skills.NewBaseSkill(CopySkill{})},
        &PostgreSQLBackupSkill{baseSkill: skills.NewBaseSkill(PostgreSQLBackupSkill{})},
        &DockerVolumeSkill{baseSkill: skills.NewBaseSkill(DockerVolumeSkill{})},
    }
    
    for _, skill := range skills {
        agent.RegisterSkill(skill)
    }
}
```

### Skill Discovery

```go
// skill-discovery.go
func DiscoverSkills(directory string) ([]skills.Skill, error) {
    files, err := filepath.Glob(filepath.Join(directory, "*.so"))
    if err != nil {
        return nil, err
    }
    
    skills := make([]skills.Skill, 0, len(files))
    for _, file := range files {
        skill, err := loadDynamicSkill(file)
        if err != nil {
            continue // Log error but continue
        }
        skills = append(skills, skill)
    }
    
    return skills, nil
}

func loadDynamicSkill(path string) (skills.Skill, error) {
    plugin, err := plugin.Open(path)
    if err != nil {
        return nil, err
    }
    
    symSkill, err := plugin.Lookup("Skill")
    if err != nil {
        return nil, err
    }
    
    skill, ok := symSkill.(skills.Skill)
    if !ok {
        return nil, fmt.Errorf("plugin does not export Skill interface")
    }
    
    return skill, nil
}
```

## Skill Monitoring and Observability

### Metrics Collection

```go
// skill-metrics.go
func RecordSkillExecution(skillID string, result *SkillResult) {
    metrics.SkillExecutionsTotal.WithLabelValues(skillID, result.Status).Inc()
    
    if result.Success {
        metrics.SkillExecutionDuration.WithLabelValues(skillID).Observe(result.Duration.Seconds())
    } else {
        metrics.SkillExecutionErrors.WithLabelValues(skillID, result.Error.Code).Inc()
    }
}

func RecordSkillPermissionError(skillID string, permission string) {
    metrics.SkillPermissionErrors.WithLabelValues(skillID, permission).Inc()
}
```

### Health Checks

```go
type SkillHealthChecker struct {
    registry skills.SkillRegistry
}

func (h *SkillHealthChecker) CheckSkillHealth(skillID string) (*HealthStatus, error) {
    skill, err := h.registry.GetSkill(skillID)
    if err != nil {
        return nil, err
    }
    
    // Validate prerequisites
    if err := skill.ValidatePrerequisites(context.Background()); err != nil {
        return &HealthStatus{Status: "unhealthy", Reason: err.Error()}, nil
    }
    
    return &HealthStatus{Status: "healthy"}, nil
}

func (h *SkillHealthChecker) CheckAllSkillsHealth() (map[string]*HealthStatus, error) {
    skills := h.registry.ListSkills()
    results := make(map[string]*HealthStatus)
    
    for _, skill := range skills {
        status, err := h.CheckSkillHealth(skill.ID)
        if err != nil {
            status = &HealthStatus{Status: "unknown", Reason: err.Error()}
        }
        results[skill.ID] = status
    }
    
    return results, nil
}
```

## Skill Documentation

### Skill API Documentation

Each skill includes comprehensive documentation:

```markdown
# Skill: File Reader

## Overview
Reads file contents from filesystem with support for large files and resumable operations.

## Capabilities
- Read file contents
- Support large files with streaming
- Resume interrupted reads
- Verify file integrity

## Permissions Required
- read

## Parameters
### Source
Type: FileResourceRef
Required: Yes

## Examples
```go
params := skills.SkillParams{
    Source: &FileResourceRef{Path: "/path/to/file"},
    Options: map[string]interface{}{
        "encoding": "utf-8",
        "chunkSize": "1MB",
        "resume": true,
    },
}
```

## Return Values
Returns a SkillResult with data containing the file content.
```go
result, err := skill.Execute(context.Background(), params)
if err != nil {
    // Handle error
}
content := result.Data.(map[string]interface{})["content"].(string)
```
```

## Future Skills

Planned skills for future phases:

1. **Content-Defined Chunking Skill**: Advanced backup skill for deduplication
2. **Compression Skill**: Various compression algorithms
3. **Encryption Skill**: AES and GPG encryption
4. **Database Sync Skill**: Database synchronization
5. **Cloud Storage Skill**: Multi-cloud storage operations
6. **Network Transfer Skill**: Optimized network transfers
7. **Verification Skill**: Advanced integrity verification
8. **Policy Skill**: Policy execution and management

## Skill Ecosystem Benefits

- **Extensibility**: Add new capabilities without modifying core agent
- **Security**: Permission-based access control
- **Reliability**: Health checks and monitoring
- **Performance**: Optimized operations with resource limits
- **Maintainability**: Clean interfaces and documentation
- **Scalability**: Dynamic skill loading and unloading

## Conclusion

The skills system provides a robust foundation for the BackupOps agent to interact with diverse infrastructure components. By using well-defined interfaces, comprehensive security models, and rich monitoring capabilities, we enable the agent to perform complex operations safely and efficiently across different platforms and technologies.