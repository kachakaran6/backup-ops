# BackupOps — Disaster Recovery & Restore Engine

## 1. Overview

A backup system that cannot restore data with certainty is dangerous. In BackupOps, **Restore is a first-class operational capability**, treated with equal engineering rigor as backup creation.

---

## 2. Restore Target Modes

When initiating a restore from any verified backup artifact, operators can select among three restore target patterns:

```text
                                  ┌───────────────────────────────┐
                                  │      Select Verified Backup   │
                                  └──────────────┬────────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
        ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
        │  Original Target  │          │   New Database    │          │ Different Server  │
        │   (In-Place)      │          │   (Side-by-Side)  │          │    (Migration)    │
        ├───────────────────┤          ├───────────────────┤          ├───────────────────┤
        │ Overwrites active │          │ Restores into a   │          │ Transfers payload │
        │ production data.  │          │ newly provisioned │          │ to an alternate   │
        │ High risk.        │          │ database name.    │          │ host or staging.  │
        └───────────────────┘          └───────────────────┘          └───────────────────┘
```

1. **Original Source (In-Place Restore)**:
   - Restores directly into the originating database or server directory.
   - **Destructive Operation**: Requires explicit typed confirmation and safety checkbox before queuing.
2. **New Database (Side-by-Side Verification)**:
   - Restores the backup into a fresh database instance (e.g. `production_restore_20260918`).
   - Enables operators to inspect data integrity or query lost records without disrupting live production traffic.
3. **Different Server (Cross-Host Migration)**:
   - Restores the artifact to an alternate host registered in BackupOps (e.g., restoring a production dump onto a staging server or disaster recovery secondary).

---

## 3. PostgreSQL Point-in-Time Recovery (PITR)

When continuous WAL archiving is enabled, BackupOps enables granular recovery to any exact millisecond within the archive timeline:

```text
[Base Backup: 2026-09-18 02:00:00 UTC] ────────────────────────► [Current: 08:30:00 UTC]
                              ▲
                              │ Target Timestamp: 2026-09-18 07:14:22 UTC
                              │ (Immediately prior to accidental table drop)
```

1. BackupOps extracts the Base Backup preceding the target timestamp.
2. Generates a PostgreSQL `recovery.signal` configuration:
   ```ini
   restore_command = 'cp /var/lib/backupops/storage/wal/%f %p'
   recovery_target_time = '2026-09-18 07:14:22 UTC'
   recovery_target_action = 'promote'
   ```
3. PostgreSQL replays WAL segments up to the exact target LSN and automatically promotes the database to read-write mode.

---

## 4. Destructive Confirmation Guardrails

Every restore request undergoes multi-tier security verification:

1. **API Guard**: The API rejects any in-place restore request where `overwriteConfirmed !== true`.
2. **UI Safety Barrier**:
   - Amber/Red high-visibility warning box highlighting overwrite consequences.
   - Clear display of artifact size, creation timestamp, and target database name.
   - Mandatory acknowledgment checkbox required before enabling the submit button.
3. **Audit Trail**: Every restore trigger is immediately written to the immutable compliance audit log with the operator's identity, source backup ID, and target destination parameters.
