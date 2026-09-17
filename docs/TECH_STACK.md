# BackupOps — Technology Stack

## 1. Stack Principles

The stack is selected around four requirements: a professional web control plane, reliable asynchronous execution, efficient infrastructure operations, and simple self-hosted deployment.

The stack should remain modular. Provider-specific functionality must live behind interfaces/adapters instead of leaking provider assumptions into the core domain.

## 2. Frontend

### Core

- React
- TypeScript
- Vite

### UI

- Tailwind CSS
- shadcn/ui
- Radix UI primitives through shadcn where appropriate
- Lucide icons

### Application state and data

- TanStack Query for server state.
- Zustand only for client/UI state that should not live in the server cache.
- React Hook Form for complex forms.
- Zod for runtime validation and shared schemas where practical.

### Visualization

- React Flow for the workflow builder.
- Recharts for operational analytics where charts add value.

### Frontend principles

- Type-safe API boundaries.
- Accessible UI primitives.
- Responsive layouts.
- Minimal visual noise.
- Clear operational states.
- Destructive actions require explicit confirmation.
- No secrets persisted unnecessarily in browser storage.

## 3. Backend Control Plane

### Core

- NestJS
- TypeScript
- REST API initially.
- WebSocket or Server-Sent Events for real-time operation updates where appropriate.

### Responsibilities

The API/control plane owns:

- Authentication.
- Organizations and memberships.
- RBAC.
- Resource metadata.
- Credential references.
- Policies.
- Workflows.
- Schedules.
- Job creation and state coordination.
- Audit logs.
- Notifications.
- API validation and authorization.

The API should not perform large backup/transfer work inside HTTP request handlers.

## 4. Worker System

### Queue

- Redis.
- BullMQ.

### Worker responsibilities

- Execute asynchronous operations.
- Coordinate agents/providers.
- Track progress.
- Handle retries.
- Maintain checkpoints.
- Trigger verification.
- Apply retention.
- Emit operation events.

The worker system must be horizontally scalable and designed around idempotent jobs where possible.

## 5. Agent

### Language

**Go** is the planned language for the infrastructure agent.

### Agent responsibilities

- Server registration.
- Heartbeats.
- Capability reporting.
- Filesystem operations.
- Docker operations.
- Database operations.
- Data transfer.
- Compression.
- Encryption.
- Checksums.
- Chunking.
- Resume/checkpoint support.

The agent should be a small deployable binary and should not require the full BackupOps stack on the target server.

## 6. Database

### Primary database

- PostgreSQL.

### Purpose

PostgreSQL stores control-plane metadata such as:

- Users.
- Organizations.
- Memberships.
- Resources.
- Credentials metadata.
- Policies.
- Workflows.
- Jobs.
- Job steps.
- Snapshots/backup metadata.
- Schedules.
- Notifications.
- Audit logs.

Backup payloads are not required to be stored in the BackupOps database.

### ORM / data access

Use one consistent type-safe data access layer. The project may choose Prisma or Drizzle during implementation, but should not mix ORMs without a documented reason.

## 7. Cache and Queue

Redis is used for:

- BullMQ queues.
- Short-lived coordination state.
- Job event distribution where appropriate.
- Rate limiting or transient state where appropriate.

Redis must not become the source of truth for durable business data.

## 8. Storage Providers

Implement a provider interface rather than coupling the core engine to a single vendor.

### Initial

- Local filesystem.
- S3-compatible storage.
- SFTP.
- MinIO.

### Future

- Cloudflare R2.
- Backblaze B2.
- Wasabi.
- Google Cloud Storage.
- Azure Blob.
- WebDAV.

S3-compatible support should be treated as a broad capability rather than creating unnecessary vendor-specific implementations when the protocol is sufficient.

## 9. Database Providers

Use adapter interfaces.

### Initial

- PostgreSQL.
- MySQL/MariaDB.

### Future

- MongoDB.
- Redis.
- SQLite.
- MSSQL.

Provider adapters may use native database backup/recovery mechanisms when those mechanisms provide better consistency or recovery guarantees.

## 10. Containerization

### Development and self-hosted deployment

- Docker.
- Docker Compose.

Expected core services:

- Web.
- API.
- Worker.
- Scheduler where separation is useful.
- PostgreSQL.
- Redis.
- Reverse proxy.

The exact service split should remain implementation-driven; do not create unnecessary containers simply for architectural appearance.

## 11. Reverse Proxy / TLS

Support a standard reverse proxy deployment using Nginx or Caddy. TLS should terminate at the reverse proxy or an external ingress controlled by the user.

## 12. Observability

### Metrics

- Prometheus-compatible metrics.

### Dashboards

- Grafana reference dashboards.

### Logging

- Structured application logs.
- Correlation/request IDs.
- Job IDs in operation logs.
- Agent IDs in agent logs.
- No credentials or secret payloads in logs.

## 13. Security Technology Principles

- TLS for network communication.
- Encrypted secret storage.
- Strong password hashing through the selected authentication solution.
- Short-lived agent registration credentials where possible.
- Key rotation capability in the architecture.
- Least-privilege provider credentials.
- Server-side authorization.
- Input validation.
- Rate limiting for sensitive endpoints.

Backup encryption should be designed so the user can control the encryption model and storage destination.

## 14. Testing Stack

Expected categories:

### Frontend

- Component tests.
- UI interaction tests.
- End-to-end tests for critical workflows.

### Backend

- Unit tests.
- Integration tests.
- API tests.
- Provider contract tests.

### Worker

- Job lifecycle tests.
- Retry/idempotency tests.
- Failure/recovery tests.

### Agent

- Unit tests.
- Filesystem/transfer integration tests.
- Provider tests.

### System

- Docker Compose integration environment.
- Real storage emulators/test providers where appropriate.
- Test database instances.

## 15. CI/CD

GitHub Actions is the planned CI system.

CI should eventually cover:

1. Formatting/linting.
2. Type checking.
3. Unit tests.
4. Integration tests.
5. Build verification.
6. Docker image build verification.
7. Security/dependency checks.

Deployment remains user-controlled for the self-hosted product.

## 16. Repository Architecture

```text
backup-ops/
├── apps/
│   ├── web/                 # React control plane UI
│   ├── api/                 # NestJS API
│   └── worker/              # Async job workers
│
├── agent/                   # Go infrastructure agent
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared contracts/types
│   └── config/              # Shared configuration
│
├── infrastructure/
│   ├── docker/              # Container/deployment assets
│   └── nginx/               # Reverse proxy assets
│
└── docs/                    # Product and engineering documentation
```

## 17. Architectural Boundaries

### Control Plane

Knows **what should happen**.

### Worker

Coordinates **when/how an operation is executed**.

### Agent

Performs privileged operations on the user's infrastructure.

### Provider

Knows how to communicate with a specific infrastructure technology.

### Storage

Stores the user's data according to the user's configuration.

This separation is a core architectural rule.

## 18. Technology Selection Rule

Do not add a technology simply because it is popular. Every new dependency should have a clear responsibility, operational justification, and maintenance story.
