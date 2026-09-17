# BackupOps — Project Phases

This document is the implementation roadmap. Phases are sequential by dependency, but individual workstreams may overlap only when their prerequisites are complete.

## Phase 0 — Repository and Engineering Foundation

### Objective
Establish the monorepo structure, documentation contract, development conventions, and deployment baseline without implementing product functionality prematurely.

### Scope
- Monorepo structure.
- Frontend, API, worker, agent, packages, infrastructure, and docs boundaries.
- TypeScript and Go project conventions.
- Environment/configuration strategy.
- Docker Compose development topology.
- Basic CI planning.
- Documentation and agent instructions.

### Exit criteria
- Repository structure is stable.
- Architecture documents are authoritative.
- No secrets committed.
- Local development topology is documented.

## Phase 1 — Platform Core

### Objective
Build the control-plane foundations.

### Scope
- Authentication.
- Users.
- Organizations/workspaces.
- Memberships.
- RBAC.
- Resource model.
- Credential model.
- Audit model.
- API versioning.
- Validation/error conventions.

### Exit criteria
A user can authenticate and securely manage the metadata required for resources and permissions.

## Phase 2 — Resource Connectivity

### Objective
Create the provider abstraction and first resource adapters.

### Initial providers
- Linux/SSH.
- Local filesystem.
- S3-compatible storage.
- SFTP.

### Scope
- Connection testing.
- Health status.
- Resource metadata.
- Resource configuration.
- Secure credential references.
- Basic browsing capabilities.

### Exit criteria
A user can register resources, test them, see their status, and browse supported sources/destinations.

## Phase 3 — Operation Engine

### Objective
Create a reliable asynchronous engine for data operations.

### Operations
- Copy.
- Move.
- Sync.
- Mirror.
- Delete, with safety controls.

### Infrastructure
- Redis.
- BullMQ.
- Worker lifecycle.
- Job state machine.
- Progress reporting.
- Cancellation.
- Retry.
- Checkpointing.
- Resumability.
- Real-time updates.

### Exit criteria
A large transfer can be queued, executed asynchronously, monitored, cancelled, retried, and resumed without restarting from zero when the operation supports checkpoints.

## Phase 4 — Backup Engine

### Objective
Turn the operation engine into a policy-driven backup platform.

### Scope
- Backup policies.
- Full backups.
- Incremental strategy abstraction.
- Backup versions/snapshots.
- Compression.
- Encryption.
- Checksums.
- Retention.
- Pruning.
- Backup history.

### Exit criteria
A user can schedule recurring backups with configurable retention and verify backup integrity.

## Phase 5 — Database Providers

### Objective
Add database-aware operations rather than treating databases only as files.

### Priority
1. PostgreSQL.
2. MySQL/MariaDB.
3. MongoDB.
4. Redis.
5. SQLite.
6. MSSQL.

### Scope
- Connection testing.
- Database discovery.
- Backup.
- Restore.
- Verification.
- Provider-specific metadata.
- Native incremental/PITR capabilities where appropriate.

### Exit criteria
Database resources participate in the same policy, job, storage, verification, and audit systems as other resources.

## Phase 6 — Agent

### Objective
Introduce the lightweight Go agent for secure and efficient operations on user infrastructure.

### Scope
- Agent registration.
- Secure control channel.
- Heartbeat.
- Capability discovery.
- Filesystem operations.
- Docker operations.
- Database operations.
- Transfer engine.
- Checksum.
- Compression.
- Encryption.
- Checkpoint/resume.

### Exit criteria
Users can install an agent on a server and execute approved operations without the control plane needing unrestricted SSH access for every task.

## Phase 7 — Workflow Builder

### Objective
Allow users to compose operations visually.

### Example
Trigger → Backup → Compress → Encrypt → Upload → Verify → Retain → Notify

### Scope
- React Flow workflow editor.
- Nodes.
- Edges.
- Validation.
- Workflow versions.
- Manual run.
- Scheduled run.
- Execution history.
- Failure handling.

### Exit criteria
A complete multi-step data workflow can be designed, validated, saved, scheduled, executed, and inspected.

## Phase 8 — Storage Intelligence

### Objective
Improve transfer efficiency and storage management.

### Scope
- Chunked transfers.
- Resumable multipart transfers.
- Deduplication architecture.
- Content-defined chunking research/implementation.
- Storage usage analytics.
- Retention-aware pruning.
- Cross-storage copy.
- Storage health.

### Exit criteria
Repeated backups and large transfers avoid unnecessary work where supported and can resume efficiently after interruptions.

## Phase 9 — Verification and Recovery

### Objective
Prove that backups are usable, not merely present.

### Scope
- Integrity verification.
- Database restore verification.
- Temporary restore environments.
- Automated restore tests.
- Recovery plans.
- RPO/RTO metadata and reporting.
- Recovery runbooks.

### Exit criteria
Users can define and execute repeatable recovery tests and see evidence of successful restores.

## Phase 10 — Security Hardening

### Objective
Harden the platform for serious production environments.

### Scope
- Secret management improvements.
- Encryption key hierarchy.
- Least privilege.
- Agent identity rotation.
- RBAC refinement.
- Security audit logs.
- Rate limiting.
- Input hardening.
- Supply-chain checks.
- Container hardening.
- Backup immutability integrations.

### Exit criteria
Security controls are documented, tested, and enforced consistently across API, worker, agent, and storage integrations.

## Phase 11 — Observability and Operations

### Objective
Make BackupOps itself operationally observable.

### Scope
- Structured logs.
- Metrics.
- Health checks.
- Prometheus metrics.
- Grafana reference dashboards.
- Worker health.
- Agent health.
- Job throughput.
- Failure analytics.
- Alert integrations.

### Exit criteria
Operators can identify platform, worker, agent, storage, and operation failures quickly.

## Phase 12 — Production Self-Hosted Release

### Objective
Deliver a polished self-hosted product.

### Scope
- Production Docker Compose.
- Reverse proxy.
- TLS documentation.
- Upgrade strategy.
- Migration strategy.
- BackupOps self-backup guidance.
- Installation documentation.
- Security documentation.
- Troubleshooting documentation.

### Exit criteria
A new user can deploy, configure, upgrade, back up, and recover a production BackupOps installation using documented procedures.

## Phase 13 — Enterprise Capabilities

### Scope
- SSO/OIDC.
- Advanced RBAC.
- Teams.
- Approval workflows.
- Policy inheritance.
- Organization-level limits.
- Multi-region control planes.
- Compliance reporting.
- Advanced audit exports.

## Phase 14 — Optional Managed/SaaS Control Plane

Only after the self-hosted architecture is mature.

### Principles
- User data remains under user control.
- Backup payloads are not required to pass through BackupOps cloud.
- Agents connect outbound where possible.
- Tenant isolation is mandatory.
- Self-hosted and managed modes should share core domain concepts.

## Definition of Done for Every Phase

A phase is not complete merely because code exists. It requires:

1. Functional implementation.
2. Validation and error handling.
3. Security review appropriate to the phase.
4. Tests for critical paths.
5. Documentation updates.
6. Migration/compatibility consideration where relevant.
7. Observability for production-facing behavior.
8. Clear exit criteria demonstrated in a reproducible environment.

## Implementation Rule

**Do not skip foundational phases by prematurely implementing advanced features. Keep provider abstractions and operation semantics stable so later capabilities extend the system instead of creating parallel implementations.**
