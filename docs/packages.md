# Shared Package Ecosystem

## Overview

BackupOps uses a modular monorepo architecture managed with pnpm workspaces. Reusable domain models, configuration logic, and user interface components are isolated in shared packages under the `@backup-ops/*` namespace. This guarantees strict boundary separation, eliminates code duplication, and ensures type-safe contracts across the web interface, API control plane, and asynchronous workers.

## Package Architecture

```text
packages/
├── types/          # Shared domain contracts, enums, interfaces, and Zod schemas
├── config/         # Environment validation, constants, queue names, defaults
└── ui/             # Reusable UI component library (shadcn/ui + Tailwind CSS)
```

### Dependency Graph

```text
               apps/web       apps/api      apps/worker
                  │              │              │
        ┌─────────┼──────────────┼──────────────┘
        │         ▼              ▼
        │   @backup-ops/config   │
        │         │              │
        ▼         ▼              ▼
       @backup-ops/types ◄───────┘
        ▲
        │
   @backup-ops/ui
```

---

## 1. `@backup-ops/types`

### Purpose
The single source of truth for all domain entities, transfer contracts, job lifecycle states, and API payload schemas.

### Key Exports

| Category | Types & Enums | Description |
|---|---|---|
| **Users & Auth** | `User`, `UserStatus`, `UserRole`, `UserPreferences` | Identity and platform permission models |
| **Organizations** | `Organization`, `OrganizationRole`, `OrganizationMembership` | Multi-tenant organizational scoping |
| **Resources** | `Resource`, `ResourceType`, `ResourceCategory`, `ResourceHealthStatus` | Infrastructure targets (servers, databases, storage) |
| **Operations** | `OperationType`, `CompressionType`, `EncryptionType`, `OperationOptions` | Transfer actions (COPY, BACKUP, RESTORE, SYNC, etc.) |
| **Jobs** | `Job`, `JobState`, `JobProgress`, `JobStep`, `JobLogEntry` | Async execution state machine and real-time metrics |
| **Policies** | `BackupPolicy`, `PolicySchedule`, `RetentionPolicy` | Automation rules, cron triggers, and retention |
| **Audit** | `AuditLog`, `AuditAction`, `AuditSeverity` | Security, destructive action, and compliance logging |
| **Agent** | `AgentRegistration`, `AgentStatus`, `AgentCapability` | Host agent registration and telemetry |

### Usage Example

```typescript
import { OperationType, JobState, Job, JobSchema } from '@backup-ops/types';

function handleJobStatus(job: Job) {
  if (job.state === JobState.RUNNING) {
    console.log(`Job ${job.id} progress: ${job.progress.percentage}%`);
  }
}
```

---

## 2. `@backup-ops/config`

### Purpose
Centralized environment validation, runtime constants, queue names, and operational defaults.

### Key Capabilities

- **Runtime Environment Parsing**: Strict Zod validation on startup to prevent boot with missing credentials.
- **Queue Definitions**: Standardized BullMQ queue identifiers (`backupops:operations`, `backupops:verification`, etc.).
- **Job Defaults**: Concurrency limits, retry backoff strategies, and checkpoint chunk sizes.

### Usage Example

```typescript
import { validateEnv, QUEUE_NAMES, JOB_DEFAULTS } from '@backup-ops/config';

// Validates process.env against AppEnvSchema
const env = validateEnv(process.env);

console.log(`Worker listening on ${QUEUE_NAMES.OPERATIONS}`);
```

---

## 3. `@backup-ops/ui`

### Purpose
A consistent, accessible design system built with React 18, Radix UI primitives, Tailwind CSS, and Lucide icons following shadcn/ui patterns.

### Key Components

- **Primitives**: `Button`, `Input`, `Dialog`, `DropdownMenu`, `Tabs`, `Toast`, `Badge`, `Card`.
- **Operational Components**: Status badges, transfer progress bars, confirmation modals for destructive operations.
- **Utilities**: `cn()` Tailwind class merge utility.

### Usage Example

```tsx
import { Button, cn } from '@backup-ops/ui';

export function ActionButton() {
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      Delete Snapshot
    </Button>
  );
}
```

---

## Development & Build Workflow

### Workspace Commands

Run commands across all packages from repository root:

```bash
# Install all dependencies across workspaces
pnpm install

# Run type check on all packages
pnpm run type-check

# Build all packages in topological order
pnpm run build

# Run unit tests across packages
pnpm run test
```

### Adding New Packages

When creating an additional package (e.g., `@backup-ops/sdk`):
1. Create directory in `packages/<package-name>`.
2. Add `package.json` with namespace `@backup-ops/<package-name>`.
3. Add `tsconfig.json` extending `../../tsconfig.base.json`.
4. Export entries in `src/index.ts`.
5. Reference in consuming apps via workspace dependency `"@backup-ops/<package-name>": "workspace:*"`.
