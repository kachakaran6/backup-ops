# BackupOps — Database Architecture & Protection Specification

## 1. Overview

Databases are the core product domain of BackupOps. BackupOps treats databases as mission-critical, stateful engines requiring application-consistent protection rather than treating them as generic file blobs or uncoordinated filesystem snapshots.

## 2. Supported Database Engines

| Engine | Initial Priority | Supported Backup Strategies | Telemetry Capabilities |
|---|---|---|---|
| **PostgreSQL** | Primary | Base Backup + WAL Archiving (PITR), Logical (`pg_dump` / `pg_dumpall`) | Engine version, DB size, active connections, idle connections, `archive_mode`, `wal_level`, replication lag |
| **MySQL / MariaDB** | Primary | Full Dump / Physical Snapshot + Binary Log (Binlog), Logical (`mysqldump`) | Version, size, threads connected, binary logging status |
| **MongoDB** | Future | Snapshot + Oplog | WiredTiger stats, replica set state |
| **Redis** | Future | RDB Snapshot + AOF | Memory used, keyspace, persistence mode |

---

## 3. PostgreSQL Protection Architecture

### 3.1 Logical vs. Physical Protection

BackupOps strictly distinguishes logical exports from physical continuous recovery:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Protection                           │
├───────────────────────────────────┬────────────────────────────────────┤
│           Logical Backup          │          Physical / PITR           │
│       (pg_dump / pg_dumpall)      │       (Base Backup + WAL)          │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Cross-version migrations        │ • High-performance streaming      │
│ • Schema & subset portability     │ • Zero data loss target (RPO ~ 0)  │
│ • Slower restore on multi-TB DBs  │ • Sub-second point-in-time restore │
│ • Higher CPU impact on large DBs  │ • Recovery chain verification      │
└───────────────────────────────────┴────────────────────────────────────┘
```

> **Critical Rule**: BackupOps never claims a sequence of repeated `pg_dump` files is an "incremental backup". Incremental and continuous recovery in PostgreSQL requires Base Backups accompanied by continuous WAL Archiving and validation of the WAL sequence chain.

### 3.2 Continuous Archiving & Recovery Chain

Point-in-Time Recovery (PITR) relies on the recovery equation:

$$\text{Recovery Chain} = \text{Base Backup} + \sum_{i=1}^{n} \text{WAL Segment}_i$$

```text
Backup Chain #104
  │
  ├── [BASE BACKUP] 2026-09-18 02:00:00 UTC (Verified ✓ SHA-256)
  │     │
  │     ├── [WAL Segment] 00000001000000010000002A (Verified ✓)
  │     ├── [WAL Segment] 00000001000000010000002B (Verified ✓)
  │     ├── [WAL Segment] 00000001000000010000002C (Verified ✓)
  │     └── [WAL Segment] 00000001000000010000002D ← (Current WAL position)
  │
  └─► Recovery Target Range: 2026-09-18 02:00:00 → 2026-09-18 08:29:55
```

### 3.3 Recovery Readiness State Machine

A database's recovery readiness is dynamically computed:

- **READY**: Base backup exists within policy schedule window, `archive_mode = on`, `wal_level = replica | logical`, and WAL chain has no broken or missing LSN sequences.
- **DEGRADED**: Base backup is older than policy retention window, or WAL archive lag exceeds warning threshold (> 15 minutes).
- **UNHEALTHY**: WAL archiving failed, broken sequence gap detected in WAL chain, or destination storage unreachable.
- **UNKNOWN / UNPROTECTED**: Database discovered but no backup policy has executed or credentials have not been supplied.

---

## 4. Live Telemetry & Introspection

When database credentials are connected, BackupOps executes lightweight, non-locking operational telemetry queries:

```sql
-- Version Introspection
SELECT version();

-- Database Storage Size
SELECT pg_database_size(current_database()) AS size_bytes;

-- Active Connections & Session States
SELECT 
  count(*) AS total_connections,
  count(*) FILTER (WHERE state = 'active') AS active_connections,
  count(*) FILTER (WHERE state = 'idle') AS idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction
FROM pg_stat_activity 
WHERE datname = current_database();

-- WAL & Archiving Telemetry
SELECT name, setting FROM pg_settings WHERE name IN ('wal_level', 'archive_mode', 'archive_command');

-- Archiving Health Telemetry
SELECT archived_count, failed_count, last_archived_wal, last_archived_time, last_failed_wal, last_failed_time
FROM pg_stat_archiver;
```

---

## 5. Security & Isolation

1. **Credential Encryption**: All database passwords are encrypted at rest using AES-256-GCM.
2. **Least Privilege**: BackupOps recommends a dedicated `backupops_role` with read-only dump privileges or `pg_read_all_data` / replication privileges for base backups:
   ```sql
   CREATE ROLE backupops_backup WITH LOGIN PASSWORD '...' REPLICATION;
   GRANT pg_read_all_data TO backupops_backup;
   ```
3. **No Credential Echoing**: Database passwords are never included in job execution logs or frontend responses.
