# BackupOps — Storage Architecture & Destination Management

## 1. Overview

Storage is a first-class domain in BackupOps. The platform does not enforce or require proprietary cloud storage. Users own and designate where backup artifacts are preserved.

```text
Backup Operation
       │
       ├──► Local Filesystem (Explicit Host Volume Mount: /mnt/backups)
       ├──► AWS S3 (Standard, Glacier, Infrequent Access)
       ├──► S3-Compatible Object Storage (MinIO, Cloudflare R2, Wasabi, Backblaze B2)
       └──► Remote SFTP Backup Server
```

---

## 2. Local Storage & Docker Mount Rules

### 2.1 The Container Isolation Trap

> **CRITICAL RULE**: BackupOps will never silently write backup payloads into a container's ephemeral root filesystem (`overlay2`). Writing backups to unmounted container directories guarantees data loss upon container recreation or upgrade.

### 2.2 Explicit Host Mount Requirement

When deploying via Docker or Docker Compose, local backup storage paths must be explicitly mounted from the host operating system into both the `api` and `worker` containers:

```yaml
# docker-compose.yml
services:
  api:
    volumes:
      - ${BACKUP_STORAGE_PATH:-/mnt/backup-storage}:/var/lib/backupops/storage

  worker:
    volumes:
      - ${BACKUP_STORAGE_PATH:-/mnt/backup-storage}:/var/lib/backupops/storage
```

The user configures `BACKUP_STORAGE_PATH` in `.env` (e.g., `/mnt/nvme-backups`, `/data/backupops-storage`, or `/volume1/backups` on a NAS).

### 2.3 Canary Verification Probes

When adding or testing a Local Storage destination, `LocalStorageProvider` performs a comprehensive end-to-end canary verification probe:

1. **Path Inspection**: Verifies directory exists and is accessible.
2. **Permission Validation**: Confirms read, write, and execute permissions for the executing process.
3. **Filesystem Telemetry**: Queries available free disk space and total capacity via `statvfs`.
4. **Canary Write**: Generates a test file with pseudo-random byte content (`.backupops-probe-[uuid].tmp`).
5. **Canary Read & Checksum**: Reads back the test file and validates SHA-256 byte parity.
6. **Canary Delete**: Unlinks the test file to confirm deletion capability.

---

## 3. S3 & S3-Compatible Storage

### 3.1 Supported Providers

- **AWS S3**: All standard AWS regions, GovCloud, and China regions.
- **MinIO**: Self-hosted on-premises high-performance object storage.
- **Cloudflare R2**: Zero-egress S3-compatible endpoints.
- **Backblaze B2 & Wasabi**: Cost-effective archival storage.

### 3.2 Configuration Parameters

| Parameter | Type | Description |
|---|---|---|
| `endpoint` | String (Optional) | Custom endpoint URL (required for MinIO, Cloudflare R2, Wasabi) |
| `region` | String | S3 region identifier (e.g., `us-east-1`, `auto`, `eu-central-1`) |
| `bucket` | String | Target bucket name |
| `prefix` | String | Base directory prefix inside bucket (e.g., `production/postgres/`) |
| `accessKeyId` | String | IAM Access Key ID |
| `secretAccessKey` | Encrypted String | IAM Secret Access Key (AES-256-GCM encrypted at rest) |
| `forcePathStyle` | Boolean | True for MinIO and legacy path-style addressing (`/bucket/key`) |
| `useTls` | Boolean | Enable HTTPS TLS transport encryption |

### 3.3 Multipart Uploads & Resumability

For backups exceeding 50 MB, `S3StorageProvider` uses AWS SDK S3 multipart upload streaming:
- Chunks of 10 MB to 50 MB are uploaded concurrently.
- Checkpoints are persisted so transient network resets can retry specific failed chunks rather than restarting a multi-hundred-gigabyte transfer from zero.
