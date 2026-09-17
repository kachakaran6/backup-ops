# Environment Variables & Configuration Reference

## Overview

BackupOps follows twelve-factor application configuration principles. All runtime configuration is supplied via environment variables or `.env` files. This document serves as the definitive reference for all configuration parameters across the control plane API, asynchronous worker, web frontend, agent, database, and reverse proxy.

---

## Configuration Matrix

| Variable | Required | Default | Service | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | All Node.js | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `3000` | API | HTTP port for the control plane API |
| `DATABASE_URL` | Yes | — | API, Worker | PostgreSQL connection string |
| `REDIS_URL` | Yes | `redis://localhost:6379` | API, Worker | Redis connection string for BullMQ |
| `BACKUP_OPS_JWT_SECRET` | Yes | — | API, Worker | Secret key for signing session & access tokens (min 32 chars) |
| `BACKUP_OPS_API_KEY` | Yes | — | API | System API key for automated access |
| `BACKUP_OPS_ENCRYPTION_KEY` | Yes | — | API, Worker | 256-bit hex encryption key for credentials vault |
| `BACKUP_OPS_AGENT_ENDPOINT` | No | `http://localhost:8080` | API | HTTP endpoint to connect to Go infrastructure agent |
| `BACKUP_OPS_AGENT_SECRET` | No | — | API, Agent | Shared secret for agent authentication |
| `VITE_API_BASE_URL` | Yes | `http://localhost:3000/api/v1` | Web | Base URL for API requests from the browser |
| `POSTGRES_DB` | Yes | `backup_ops` | Postgres | Database name |
| `POSTGRES_USER` | Yes | `backup_ops` | Postgres | Database username |
| `POSTGRES_PASSWORD` | Yes | — | Postgres | Database password |

---

## Service-Specific Configuration

### 1. Control Plane API (`apps/api`)

The API requires database connectivity, Redis for job queuing, and security keys for encryption:

```bash
# General
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://backup_ops:secure_password@postgres:5432/backup_ops

# Queue & Cache
REDIS_URL=redis://redis:6379

# Cryptography & Tokens
BACKUP_OPS_JWT_SECRET=c043e74281f6291a27e366bc592bf18858a8d79b9b5f5d6f3b0e1d2c3b4a5f6e
BACKUP_OPS_API_KEY=bkops_live_9a7d3f28c14e4b52
BACKUP_OPS_ENCRYPTION_KEY=e4f3a2b1c09876543210fedcba9876543210fedcba9876543210fedcba987654

# Infrastructure Agent
BACKUP_OPS_AGENT_ENDPOINT=http://agent:8080
BACKUP_OPS_AGENT_SECRET=agent_secret_token_98765
```

### 2. Asynchronous Worker (`apps/worker`)

The worker coordinates queue processing, runs provider transfers, and handles retry state machines:

```bash
NODE_ENV=production
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://backup_ops:secure_password@postgres:5432/backup_ops
BACKUP_OPS_ENCRYPTION_KEY=e4f3a2b1c09876543210fedcba9876543210fedcba9876543210fedcba987654
WORKER_CONCURRENCY=10
```

### 3. Web UI (`apps/web`)

The Vite React application reads environment variables prefixed with `VITE_` at build and development time:

```bash
PORT=3001
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 4. Infrastructure Agent (`agent/`)

The Go agent executes on target user infrastructure:

```bash
AGENT_ID=agent-prod-us-east-01
AGENT_PORT=8080
BACKUP_OPS_API_URL=https://backupops.internal.example.com
BACKUP_OPS_AGENT_SECRET=agent_secret_token_98765
LOG_LEVEL=info
```

---

## Security & Secrets Management

### Key Generation

Generate cryptographically secure keys for production:

```bash
# 256-bit encryption key (64 hex characters)
openssl rand -hex 32

# JWT Secret (64 hex characters)
openssl rand -hex 32
```

### Critical Rules

1. **Never Commit Secrets**: Do not commit `.env` or files containing live credentials.
2. **Credential Encryption at Rest**: Any user infrastructure passwords, S3 secret keys, or SSH private keys stored in the database are encrypted using `BACKUP_OPS_ENCRYPTION_KEY` using AES-256-GCM.
3. **Key Rotation**: If `BACKUP_OPS_ENCRYPTION_KEY` is rotated, use the key migration utility to re-encrypt stored credentials.
