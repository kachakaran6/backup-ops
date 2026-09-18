# BackupOps — Coolify Integration

## Overview

Coolify is a first-class infrastructure discovery source for BackupOps. When a user connects their Coolify instance, BackupOps discovers servers, databases, applications, and services managed by Coolify.

## Integration Flow

```text
Add Integration → Coolify
         ↓
Enter Coolify URL + API Token
         ↓
Test Connection
         ↓
Discover Infrastructure
         ↓
Servers, Databases, Applications, Services
```

## CoolifyProvider Interface

```typescript
interface CoolifyProvider {
  testConnection(url: string, token: string): Promise<ConnectionTestResult>;
  listServers(): Promise<CoolifyServer[]>;
  getServer(uuid: string): Promise<CoolifyServerDetail>;
  listServerResources(serverUuid: string): Promise<CoolifyResource[]>;
  listApplications(): Promise<CoolifyApplication[]>;
  listDatabases(): Promise<CoolifyDatabase[]>;
  listServices(): Promise<CoolifyService[]>;
  getResourceDetails(uuid: string): Promise<CoolifyResourceDetail>;
}
```

## Coolify API Endpoints Used

Based on the official Coolify API documentation:

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get version | GET | `/api/v1/version` |
| List servers | GET | `/api/v1/servers` |
| Get server | GET | `/api/v1/servers/{uuid}` |
| Server resources | GET | `/api/v1/servers/{uuid}/resources` |
| Server domains | GET | `/api/v1/servers/{uuid}/domains` |
| List applications | GET | `/api/v1/applications` |
| Get application | GET | `/api/v1/applications/{uuid}` |
| List databases | GET | `/api/v1/databases` |
| Get database | GET | `/api/v1/databases/{uuid}` |
| List services | GET | `/api/v1/services` |
| Get service | GET | `/api/v1/services/{uuid}` |

All requests use `Authorization: Bearer <API_TOKEN>` header.

## Security Rules

1. Coolify API tokens are **encrypted at rest** using AES-256-GCM
2. Tokens are **never returned** to the frontend in API responses
3. Tokens are **never logged**
4. The integration is **read-only by default** — no deploy, restart, or delete operations
5. Write operations (deploy, restart) require explicit user action and future phase implementation

## Data Model

```sql
CREATE TABLE coolify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  -- API token stored encrypted, never returned to frontend
  encrypted_api_token TEXT NOT NULL,
  team_name VARCHAR(255),
  version VARCHAR(50),
  connection_status VARCHAR(50) DEFAULT 'unknown',
  last_sync_at TIMESTAMP,
  servers_discovered INTEGER DEFAULT 0,
  databases_discovered INTEGER DEFAULT 0,
  applications_discovered INTEGER DEFAULT 0,
  services_discovered INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Sync Behavior & Idempotency

- **Manual sync**: User clicks "Sync Now" to refresh infrastructure from Coolify
- **Background sync**: Optional periodic sync (configurable interval, default 15 minutes)
- **Sync scope**: Reads infrastructure inventory only — does not modify Coolify resources
- **Idempotent Reconciliation**: Running sync 1 time or 100 times produces the exact same server and database set without duplicates.
- **Resource Identity & Deduplication**:
  - Coolify servers are reconciled by composite key `(organizationId, coolifyConnectionId, coolifyServerUuid)` as well as `(organizationId, host, port)`.
  - Coolify databases are reconciled by composite key `(organizationId, coolifyConnectionId, coolifyResourceUuid)`.
  - Existing records are updated with latest metadata (CPU, RAM, status, uptime, names) rather than blindly inserted.
  - Safe duplicate removal reassigns all child database, backup, and credential relationships to the canonical record before removing redundant rows.
- **Persistent Counts**: Database counts and discovery metrics are computed directly from persisted canonical entities.

## Discovered Resources

When Coolify discovers a PostgreSQL database, BackupOps creates or reconciles:

1. A **Server** record linked to the Coolify server (unique by Coolify UUID and IP/port)
2. A **Database** record linked to the discovered PostgreSQL instance (unique by resource UUID)
3. The database is marked as `discovered` — not `protected` until user configures backup

## Error Handling

- Connection timeout: Report as `connection_failed` status
- Invalid token: Report as `authentication_failed`
- Rate limiting: Respect Coolify API rate limits, retry with backoff
- Partial failure: If some resources fail to sync, report partial success without leaving orphaned or duplicate records.
