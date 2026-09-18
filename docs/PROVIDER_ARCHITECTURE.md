# BackupOps — Provider Architecture & Adapter System

## 1. Architectural Mandate

BackupOps strictly enforces provider-neutral domain logic. Domain controllers, services, and workflow orchestrators interact exclusively with abstract provider interfaces. 

```text
       ┌─────────────────────────────────────────────────────────┐
       │                      Domain Layer                       │
       │  (Workspaces, Policies, Jobs, Backups, Restore, Audit)  │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                   Abstract Interfaces                   │
       │    IServerProvider • IDatabaseProvider • IStorageProvider│
       └───────┬────────────────────┬────────────────────┬───────┘
               │                    │                    │
               ▼                    ▼                    ▼
     Server Adapters       Database Adapters     Storage Adapters
     ├── CoolifyProvider   ├── PostgreSQLProvider├── LocalStorageProvider
     ├── SSHProvider       ├── MySQLProvider     ├── S3StorageProvider
     └── AgentProvider     └── MariaDBProvider   └── SFTPStorageProvider
```

> **Strict Rule**: No `if (provider === 'postgres')` or `if (storage === 's3')` branching is permitted within domain services or business logic. All provider-specific protocol commands, queries, CLI flags, and API endpoints reside inside isolated adapter implementations.

---

## 2. Server Provider Interfaces

```typescript
export interface IServerProvider {
  testConnection(config: ServerConnectionConfig): Promise<ConnectionTestResult>;
  getSystemInfo(serverId: string): Promise<ServerSystemInfo>;
  inspectDocker(serverId: string): Promise<DockerRuntimeInfo>;
  executeCommand(serverId: string, cmd: string): Promise<CommandExecutionResult>;
}
```

### Implementations

1. **CoolifyServerProvider**:
   - Discovers servers managed by Coolify through the official Coolify API (`GET /api/v1/servers`).
   - Discovers applications, databases, and Docker services running on each Coolify node (`GET /api/v1/servers/{uuid}/resources`).
   - Read-only infrastructure discovery without requiring SSH credentials.
2. **SSHServerProvider**:
   - Establishes direct SSH sessions with standard Linux distributions (Ubuntu, Debian, Fedora, Arch).
   - Validates network connectivity, SSH authentication, OS release, architecture (`uname -m`), available disk space, and Docker socket permissions.
3. **AgentServerProvider**:
   - Communicates with the lightweight self-hosted Go agent deployed on remote nodes via mutual TLS or authenticated HMAC tokens.

---

## 3. Database Provider Interfaces

```typescript
export interface IDatabaseProvider {
  testConnection(config: DatabaseConnectionConfig): Promise<DatabaseTestResult>;
  getTelemetry(databaseId: string): Promise<DatabaseTelemetry>;
  getRecoveryReadiness(databaseId: string): Promise<RecoveryReadinessReport>;
  createBackupStream(databaseId: string, options: BackupStreamOptions): Promise<Readable>;
  restoreFromStream(databaseId: string, stream: Readable, options: RestoreOptions): Promise<RestoreResult>;
}
```

### Implementations

1. **PostgreSqlProvider**:
   - Executes non-locking queries to probe version, `pg_database_size`, active sessions, WAL status (`archive_mode`, `wal_level`), and replication delay.
   - Generates physical Base Backups and coordinates continuous WAL archiving for point-in-time recovery (PITR).
   - Generates logical schema and data exports via `pg_dump` when portability is requested.
2. **MySqlProvider / MariaDbProvider**:
   - Queries server version, table statistics, and binary logging status (`SHOW BINARY LOGS`).
   - Coordinates physical snapshots or `mysqldump` with binary log sequence positions for point-in-time recovery.

---

## 4. Storage Provider Interfaces

```typescript
export interface IStorageProvider {
  testConnection(): Promise<StorageTestResult>;
  getCapacity(): Promise<StorageCapacity>;
  uploadStream(stream: Readable, destinationPath: string, options: UploadOptions): Promise<UploadResult>;
  downloadStream(filePath: string): Promise<Readable>;
  verifyObject(filePath: string, expectedChecksum: string): Promise<boolean>;
  deleteObject(filePath: string): Promise<boolean>;
}
```

### Implementations

1. **LocalStorageProvider**:
   - Operates against explicit Docker host volume mounts (e.g., `/mnt/backup-storage:/var/lib/backupops/storage`).
   - Performs read, write, and delete canary probe tests to verify directory permissions and available filesystem capacity.
2. **S3StorageProvider**:
   - Interacts with AWS S3, MinIO, Cloudflare R2, Wasabi, and Ceph via AWS SDK v3.
   - Implements streaming multipart uploads, chunked transfer encoding, and object ETag/SHA-256 verification.
3. **SFTPStorageProvider**:
   - Transfers backup payloads to remote disaster recovery servers over encrypted SSH File Transfer Protocol.
