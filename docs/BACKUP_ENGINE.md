# BackupOps — Backup Engine & Execution Architecture

## 1. Core Principles

1. **Non-Blocking Control Plane**: Backup execution never runs inside HTTP request handlers. The API writes metadata and enqueues a job into BullMQ (Redis).
2. **Streaming Pipeline**: Large backups stream directly from source to destination without staging entire multi-gigabyte or terabyte files on the control plane's root disk.
3. **Cryptographic Verification**: Every backup artifact produces a streaming SHA-256 checksum during transmission, verified against destination storage immediately upon completion.
4. **Resumability**: Multi-gigabyte operations leverage chunking, checkpoints, and multipart protocols to prevent starting from zero upon network interruption.

---

## 2. End-to-End Execution Pipeline

```text
User / Schedule Trigger
          │
          ▼
 API Control Plane (NestJS)
          │  1. Authorize workspace
          │  2. Create Backup record (status: pending)
          │  3. Enqueue BullMQ job
          ▼
   Redis / BullMQ Queue
          │
          ▼
   Async Worker Process
          │
          ├── [PLANNING]
          │     ├── Decrypt source credentials in-memory
          │     ├── Query source metadata & size estimate
          │     └── Validate target storage capacity & permissions
          │
          ├── [STREAMING & RUNNING]
          │     ┌──────────────────────────────────────────────────────────┐
          │     │ Source Stream (pg_dump / basebackup / tar)              │
          │     │    │                                                     │
          │     │    ▼                                                     │
          │     │ Pass-Through Tee Stream:                                 │
          │     │    ├── Branch A: Streaming SHA-256 Digest Calculator     │
          │     │    └── Branch B: Compression Engine (Zstandard / Gzip)  │
          │     │                        │                                 │
          │     │                        ▼                                 │
          │     │            Optional AES-256-GCM Envelope                 │
          │     │                        │                                 │
          │     │                        ▼                                 │
          │     │ Destination Upload Stream (Local Volume / S3 Multipart)  │
          │     └──────────────────────────────────────────────────────────┘
          │
          ├── [VERIFYING]
          │     ├── Confirm object exists on storage destination
          │     ├── Verify stored byte length matches stream output
          │     ├── Validate checksum integrity against storage ETag / hash
          │     └── Update database lastBackupAt & recovery readiness
          │
          └── [COMPLETED]
                └── Emit audit log & update Backup record (status: completed, verified: true)
```

---

## 3. Job State Machine

```text
       ┌───────────┐
       │  QUEUED   │
       └─────┬─────┘
             ▼
       ┌───────────┐
       │ PLANNING  │
       └─────┬─────┘
             ▼
       ┌───────────┐         (Transient Error)
       │  RUNNING  ├────────────────────────────┐
       └─────┬─────┘                            │
             │ (Stream Complete)                ▼
             ▼                            ┌───────────┐
       ┌───────────┐                      │ RETRYING  │
       │ VERIFYING │                      └─────┬─────┘
       └─────┬─────┘                            │
             │ (Checksum Verified)              ▼
             ▼                            ┌───────────┐
       ┌───────────┐                      │  FAILED   │
       │ COMPLETED │                      └───────────┘
       └───────────┘
```

### State Definitions

- **QUEUED**: Job registered in BullMQ; waiting for available worker concurrency slot.
- **PLANNING**: Pre-flight checks: verifying source reachability, target storage write permissions, available disk space.
- **RUNNING**: Active streaming transfer. Emits byte throughput, files processed, and ETA.
- **VERIFYING**: Payload upload completed. Verifying SHA-256 checksum and storage object existence.
- **COMPLETED**: Verified and recorded in database backup history.
- **FAILED**: Unrecoverable error occurred. Detailed error message and stack recorded for audit.
- **CANCELLED**: Operation explicitly halted by operator. Incomplete chunk artifacts pruned.

---

## 4. Verification Stages

Every backup record exposes multi-stage verification metadata in the UI:

```text
Backup Artifact #9821
┌──────────────────────────────┬────────┐
│ Verification Stage           │ Status │
├──────────────────────────────┼────────┤
│ 1. Upload Stream             │   ✓    │
│ 2. SHA-256 Hash Digest       │   ✓    │
│ 3. Storage Object Integrity  │   ✓    │
│ 4. Database Archive Check    │   ✓    │
│ 5. Automated Restore Test    │   ⏳   │
└──────────────────────────────┴────────┘
```

---

## 5. Retention & Pruning Engine

Retention policies define the lifecycle of backup artifacts:

- **Grandfather-Father-Son (GFS)**:
  - `keepDaily`: e.g. Keep last 7 daily backups
  - `keepWeekly`: e.g. Keep last 4 weekly backups
  - `keepMonthly`: e.g. Keep last 12 monthly backups
- **Safety Controls**:
  - **No Silent Pruning**: Pruning executions are fully auditable with before/after manifests.
  - **Base Backup Protection**: A base backup is never pruned if active incremental / WAL recovery chains depend on it.
  - **Dry-Run Mode**: Operators can preview which files will be deleted before applying pruning rules.
