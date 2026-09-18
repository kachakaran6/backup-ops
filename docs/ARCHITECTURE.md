# BackupOps — System Architecture

## Overview

BackupOps is a self-hosted infrastructure data protection and recovery control plane. It orchestrates backups, restores, and data operations across user-owned infrastructure without requiring proprietary cloud storage.

```text
┌─────────────────────────────────────────────────────────────┐
│                     BackupOps Control Plane                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Web UI  │  │  API     │  │  Worker   │  │ Scheduler  │  │
│  │ (React)  │──│ (NestJS) │──│ (BullMQ)  │  │ (Cron)     │  │
│  └──────────┘  └────┬─────┘  └────┬──────┘  └────────────┘  │
│                     │             │                           │
│              ┌──────┴──────┐     │                           │
│              │ PostgreSQL  │     │                           │
│              │ (metadata)  │     │                           │
│              └─────────────┘     │                           │
│              ┌──────────────┐    │                           │
│              │    Redis     │────┘                           │
│              │ (queues)     │                                │
│              └──────────────┘                                │
└──────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Coolify    │    │  SSH/Agent   │    │  Storage         │
│  Provider   │    │  Provider    │    │  Provider        │
│             │    │              │    │                  │
│  Discovers  │    │  Operates    │    │  Stores          │
│  servers,   │    │  on servers, │    │  backups to      │
│  databases, │    │  databases,  │    │  local, S3,      │
│  apps       │    │  filesystems │    │  SFTP, MinIO     │
└─────────────┘    └──────────────┘    └──────────────────┘
```

## Architectural Boundaries

### Control Plane (API)

The NestJS API owns:

- Authentication and authorization
- Workspace and membership management
- Resource metadata (servers, databases, storage, integrations)
- Credential management (encrypted at rest)
- Backup policy definitions
- Job creation and state coordination
- Audit logging
- API validation

The API **never** performs backup or transfer work inside HTTP request handlers.

### Worker

The BullMQ worker owns:

- Asynchronous job execution
- Provider coordination (SSH, database, storage adapters)
- Progress reporting
- Retry and checkpoint management
- Verification dispatch
- Retention enforcement

Workers must be restart-safe and idempotent.

### Agent (Go)

The lightweight Go agent performs privileged operations on user infrastructure:

- Heartbeat and capability reporting
- Filesystem operations
- Docker inspection
- Database operations (pg_dump, etc.)
- Data transfer, compression, encryption
- Checksum computation
- Checkpoint/resume support

The agent is optional — SSH-based operations work without it.

### Providers

Providers are adapters that know how to communicate with specific technologies:

```text
ServerProvider
├── CoolifyServerProvider    # Discovers via Coolify API
├── SSHServerProvider        # Direct SSH connection
└── AgentServerProvider      # Via BackupOps agent

DatabaseProvider
├── PostgreSQLProvider       # pg_dump, WAL, PITR
├── MySQLProvider            # mysqldump, binlog
└── MariaDBProvider          # mariadb-dump, binlog

StorageProvider
├── LocalStorageProvider     # Filesystem paths
├── S3StorageProvider        # AWS S3 and S3-compatible
├── SFTPStorageProvider      # SFTP destinations
└── MinIOStorageProvider     # MinIO (via S3 protocol)

BackupProvider
├── PostgreSQLBackupProvider # Logical + physical backup
├── MySQLBackupProvider      # Logical backup
└── FilesystemBackupProvider # File-level backup

NotificationProvider
├── SmtpProvider             # Email alerts via TLS/STARTTLS
├── TelegramProvider         # Telegram Bot API markdown alerts
├── PushoverProvider         # Mobile push alerts
└── GotifyProvider           # Self-hosted Gotify stream alerts
```

Provider-specific behavior is encapsulated inside adapters. The domain layer uses interfaces.

## Data Flow

### Infrastructure Discovery

```text
User connects Coolify instance
         ↓
CoolifyProvider.testConnection()
         ↓
CoolifyProvider.listServers()
         ↓
Servers stored in PostgreSQL metadata
         ↓
CoolifyProvider.listServerResources()
         ↓
Databases, applications discovered
         ↓
UI shows real infrastructure
```

### Backup Execution

```text
User creates backup policy
         ↓
Scheduler triggers job
         ↓
API creates Job record in PostgreSQL
         ↓
Job dispatched to BullMQ queue
         ↓
Worker picks up job
         ↓
Worker resolves provider (PostgreSQL, filesystem, etc.)
         ↓
Provider executes backup (pg_dump, file copy, etc.)
         ↓
Data streams to storage destination
         ↓
Checksum verification
         ↓
Backup metadata updated
         ↓
Job marked COMPLETED
```

### Restore

```text
User selects backup from history
         ↓
User chooses restore target
         ↓
Confirmation required for destructive restore
         ↓
Restore job created
         ↓
Worker executes restore via provider
         ↓
Verification
         ↓
Restore complete
```

## Domain Model

### Core Entities

```text
User
├── Workspace
│   ├── Membership
│   │
│   ├── CoolifyConnection
│   │   └── discovered servers, databases, apps
│   │
│   ├── Server
│   │   ├── ServerConnection (SSH or Agent)
│   │   ├── ServerHealth (CPU, memory, disk, Docker)
│   │   └── discovered databases
│   │
│   ├── Database
│   │   ├── DatabaseConnection
│   │   ├── DatabaseHealth
│   │   └── backup policies
│   │
│   ├── Storage
│   │   ├── StorageCredential (encrypted)
│   │   └── capacity, health
│   │
│   ├── BackupPolicy
│   │   ├── schedule, retention, strategy
│   │   └── linked source + destination
│   │
│   ├── Backup
│   │   ├── BackupChain
│   │   ├── BackupArtifact
│   │   └── verification state
│   │
│   ├── Job
│   │   ├── JobStep
│   │   └── JobCheckpoint
│   │
│   ├── NotificationIntegration
│   │   ├── NotificationRule
│   │   └── NotificationDelivery
│   │
│   └── AuditLog
```

## Security Architecture

- Credentials encrypted at rest with AES-256-GCM
- Encryption key from environment variable (never committed)
- Coolify API tokens treated as secrets
- SSH private keys encrypted before storage
- No secrets in API responses, logs, or job output
- Server-side authorization for every operation
- Audit trail for credential and destructive operations

## Deployment Architecture

```text
Docker Compose (self-hosted)
├── web        (React UI, served by Nginx)
├── api        (NestJS control plane)
├── worker     (BullMQ job processor)
├── postgres   (metadata store)
├── redis      (job queue)
└── nginx      (reverse proxy, TLS termination)

Optional:
├── agent      (Go binary on target servers)
```

Local backup storage requires explicit Docker volume mounts — the container filesystem is not used as backup destination.
