# BackupOps — Product Requirements Document

## 1. Product

**BackupOps** is a self-hosted infrastructure data operations and backup orchestration platform. It provides a professional UI and control plane for users to connect infrastructure they already own and operate actions such as backup, copy, move, sync, restore, verify, archive, and retention.

### Core principle

BackupOps does **not** require users to store their data with BackupOps. Users choose where their data lives, which credentials are used, and which storage destinations are connected. BackupOps provides the orchestration, automation, visibility, policy management, and operational experience.

> **Your infrastructure. Your storage. Your data. BackupOps orchestrates it.**

## 2. Problem

Infrastructure teams commonly manage backups and data movement through disconnected shell scripts, cron jobs, database-specific tools, cloud consoles, SSH sessions, and ad-hoc monitoring. This creates poor visibility, inconsistent policies, difficult restores, and fragile operational procedures.

BackupOps provides one control plane for these operations while keeping the actual data path under the user's control.

## 3. Product Goals

- Provide a clean, professional control plane for infrastructure data operations.
- Support user-selected sources and destinations.
- Make backup policies configurable rather than hard-coded.
- Provide resumable and observable long-running operations.
- Make copy, move, sync, backup, restore, and verification first-class operations.
- Keep credentials and data paths under user control.
- Provide clear job history, logs, progress, failures, retries, and auditability.
- Support self-hosted deployment through Docker Compose.
- Design the architecture for future SaaS and enterprise capabilities without requiring SaaS for the core product.

## 4. Non-Goals for the Initial Release

- BackupOps will not provide mandatory proprietary cloud storage.
- BackupOps will not initially attempt to replace every database-native backup technology.
- BackupOps will not initially become a full server monitoring platform.
- BackupOps will not initially provide Kubernetes/VM disaster recovery as a first-release feature.
- No unnecessary code or integrations should be added before the relevant phase.

## 5. Core Concepts

### Resource

Anything BackupOps can connect to or operate on: server, filesystem, database, Docker resource, or storage destination.

### Source

The origin of an operation, such as a PostgreSQL database, Linux directory, Docker volume, or S3 bucket.

### Destination

Where an operation writes data, such as local storage, S3, SFTP, MinIO, R2, or another supported resource.

### Operation

A data action: copy, move, backup, restore, sync, mirror, verify, archive, delete, or prune.

### Job

An asynchronous execution of an operation. Jobs have lifecycle state, progress, logs, checkpoints, retries, and results.

### Workflow

A sequence of triggers, operations, transformations, verification steps, retention actions, and notifications.

### Policy

Reusable configuration describing how and when a resource should be backed up or synchronized.

## 6. Initial Supported Resource Types

### Servers

- Linux servers
- SSH-connected servers
- Agent-connected servers
- Filesystems
- Docker hosts and volumes

### Databases

Initial priority:

1. PostgreSQL
2. MySQL / MariaDB

Later:

- MongoDB
- Redis
- SQLite
- MSSQL
- Other database adapters

### Storage Destinations

Initial priority:

- Local filesystem
- S3-compatible storage
- SFTP
- MinIO

Later:

- Cloudflare R2
- Backblaze B2
- Wasabi
- Google Cloud Storage
- Azure Blob
- WebDAV
- Additional S3-compatible providers

## 7. Core Operations

### Copy

One-time source-to-destination data transfer. Source remains unchanged.

### Move

Transfer data, verify the destination, then remove the source only according to an explicit user policy.

### Backup

Create a retained version/snapshot of source data without removing the source.

### Restore

Recover data from a backup or destination into a selected target.

### Sync

Synchronize differences between source and destination according to a defined direction and conflict policy.

### Mirror

Make the destination represent the desired state of the source.

### Verify

Check integrity using metadata, checksums, database validation, or restore tests where supported.

### Archive

Transform and transfer data for long-term retention.

### Prune

Apply retention rules and remove eligible old versions.

## 8. Functional Requirements

### Authentication and Organizations

- User authentication.
- Organization/workspace support.
- Role-based access control.
- Secure session management.
- Resource-level authorization.

### Resource Management

Users must be able to:

- Add resources.
- Test connections.
- View connection health.
- Edit resource configuration.
- Browse supported resources.
- Disable or remove resources safely.

### Credentials

- Credentials must never be returned as plaintext through normal API responses.
- Secrets must not appear in logs.
- Sensitive configuration must be encrypted at rest.
- Credential access must be permission-controlled and audited.

### Job Management

Every long-running operation must run asynchronously.

Required lifecycle:

`QUEUED → PLANNING → RUNNING → VERIFYING → COMPLETED`

Failure/cancellation states must be supported:

`FAILED`, `CANCELLED`, `PAUSED`, `RETRYING`

Jobs should expose:

- Progress percentage.
- Bytes processed.
- Transfer speed.
- ETA where calculable.
- Current step.
- Logs.
- Errors.
- Retry/resume information.
- Start/end timestamps.

### Backup Policies

Policies must support configurable:

- Source.
- Destination.
- Schedule.
- Full/incremental strategy where supported.
- Compression.
- Encryption.
- Retention.
- Verification.
- Notifications.
- Concurrency limits.

### Scheduling

Support:

- One-time execution.
- Interval schedules.
- Cron expressions.
- Timezone-aware scheduling.
- Manual execution.

### Data Integrity

Operations should support:

- Checksums.
- Chunk validation.
- Resumable transfers.
- Destination verification.
- Database backup validation where supported.
- Restore testing in later phases.

### Audit

Record security-sensitive and destructive actions, including:

- Resource changes.
- Credential changes.
- Policy changes.
- Backup execution.
- Restore execution.
- Delete/prune operations.
- User and role changes.

## 9. UX Requirements

The UI should be minimal, professional, information-dense, and operationally clear.

Primary navigation:

- Overview
- Resources
- Operations / Jobs
- Backups
- Workflows
- Policies
- Storage
- Schedules
- Notifications
- Audit Log
- Settings

Important UX patterns:

- Clear status indicators.
- Real-time job progress.
- Dry-run before destructive operations.
- Explicit confirmation for delete/move/prune/restore actions.
- Useful error messages with recovery actions.
- No hidden data movement.
- Show source, destination, operation, policy, and retention context clearly.

## 10. Security Requirements

Security is a product requirement, not a later enhancement.

- Encrypt sensitive credentials at rest.
- Use least-privilege credentials wherever possible.
- Never log secrets.
- Validate and authorize every resource operation server-side.
- Protect agent communication with authenticated and encrypted channels.
- Use short-lived registration credentials where possible.
- Maintain audit logs for sensitive operations.
- Prevent accidental destructive operations with confirmation and policy checks.
- Design for encrypted backup payloads without requiring BackupOps to possess plaintext backup data.

## 11. Reliability Requirements

- Long operations must survive transient network failures.
- Transfers should support checkpoints/resume.
- Retries must be controlled and idempotent where possible.
- Workers must not duplicate an operation after process restart.
- Jobs must have deterministic state transitions.
- Backup metadata must be durable.
- The system must distinguish operation failure from verification failure.

## 12. Data Ownership Model

BackupOps is an orchestration layer. The user controls:

- Source infrastructure.
- Destination infrastructure.
- Storage provider.
- Retention policy.
- Encryption configuration.
- Credentials.
- Data residency.

The control plane stores metadata required to manage operations, not a mandatory copy of user backup payloads.

## 13. Success Criteria for MVP

A user can deploy BackupOps with Docker Compose, connect a Linux server and an S3-compatible destination, create a policy, execute a backup, observe progress, verify the result, inspect logs, retry/resume a failed transfer, and restore data without writing a custom backup script.

## 14. Future Direction

The architecture should allow expansion into:

- More database adapters.
- More storage providers.
- Deduplication.
- Content-defined chunking.
- Point-in-time recovery integrations.
- Immutable storage workflows.
- Automated restore testing.
- RPO/RTO tracking.
- Disaster recovery plans.
- Multi-region orchestration.
- Enterprise RBAC and SSO.
- SaaS control plane.

## 15. Product Rule

**Do not turn BackupOps into a proprietary storage service. The product value is orchestration, automation, reliability, visibility, and control over user-owned infrastructure.**
