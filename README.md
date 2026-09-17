# BackupOps

> **Your infrastructure. Your storage. Your data. BackupOps orchestrates it.**

BackupOps is a self-hosted infrastructure data operations and backup orchestration platform. It provides a modern control plane and intuitive web interface for teams to connect infrastructure they already own and execute actions such as **Backup**, **Restore**, **Copy**, **Move**, **Sync**, **Mirror**, **Verify**, **Archive**, and **Prune**.

Unlike traditional backup vendors, **BackupOps does not force you to store data in a proprietary cloud**. You maintain full data sovereignty: payloads stream directly between your sources and your destinations with end-to-end encryption.

---

## Key Highlights

- **Sovereign & Self-Hosted**: Zero vendor lock-in. Connect Linux servers, PostgreSQL, MySQL, S3-compatible storage, MinIO, or local NVMe storage.
- **Asynchronous Execution Engine**: Long-running transfers run reliably via BullMQ workers with real-time progress, speed telemetry, and automatic checkpointing.
- **Hardware-Grade Security**: Credentials vault encrypted at rest with AES-256-GCM. Plaintext secrets are never returned over API endpoints.
- **Automated Retention Policies**: Define recurring schedules (cron / interval), full vs incremental backups, compression (zstd/gzip), and GFS retention rules.
- **Data Integrity Verification**: Automated cryptographic checksum validation (SHA-256) on destinations to guarantee recoverable backups.
- **Full Operational Audit Trail**: Every data movement, credential access, and destructive action is recorded in immutable audit logs.

---

## Architecture Overview

```text
                                  ┌────────────────────────┐
                                  │      React Web UI      │
                                  │   (Vite + Tailwind)    │
                                  └───────────┬────────────┘
                                              │
                                              ▼
┌───────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│  PostgreSQL Metadata  │◄───────►│   NestJS Control Plane │◄───────►│  Redis + BullMQ Queue  │
│ (Source of Truth DB)  │         │     REST API & Auth    │         │ (Async State Machine)  │
└───────────────────────┘         └────────────────────────┘         └───────────┬────────────┘
                                                                                 │
                                                                                 ▼
┌───────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│   User Infrastructure │◄───────►│   Go Host Agent Node   │◄───────►│    Operation Worker    │
│  (DBs, Files, Docker) │         │  (Privileged Executor) │         │  (Payload Orchestrator)│
└───────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

---

## Monorepo Structure

```text
backup-ops/
├── apps/
│   ├── web/                 # React control plane UI (Vite + Tailwind CSS + Lucide)
│   ├── api/                 # NestJS control plane API (Auth, Vault, Policies, Jobs)
│   └── worker/              # Asynchronous operation worker (BullMQ + Redis)
│
├── agent/                   # Lightweight Go host infrastructure agent
│
├── packages/
│   ├── types/               # @backup-ops/types (Domain contracts, enums & Zod schemas)
│   ├── config/              # @backup-ops/config (Environment validation & queue constants)
│   └── ui/                  # @backup-ops/ui (Shared shadcn/ui component library)
│
├── infrastructure/
│   ├── docker/              # Production container definitions
│   ├── nginx/               # Reverse proxy & SSL configurations
│   └── postgres/            # Database initialization scripts
│
├── docs/                    # Complete product & architectural specifications
├── docker-compose.yml       # Local development & self-hosted topology
└── package.json             # Root monorepo workspace configuration
```

---

## Quick Start with Docker Compose

Deploy the entire BackupOps stack locally with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/kachakaran6/backup-ops.git
cd backup-ops

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Start all services (PostgreSQL, Redis, API, Web, Worker, Agent, Nginx)
docker compose up -d
```

Once running, access the services:
- **Web Interface**: [http://localhost:3001](http://localhost:3001)
- **Control Plane API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **OpenAPI Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check Probe**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## Documentation

Comprehensive engineering documentation is available in the [`docs/`](./docs) directory:

| Document | Purpose |
|---|---|
| [PRD.md](./docs/PRD.md) | Product vision, functional requirements, security, and non-goals |
| [PROJECT_PHASES.md](./docs/PROJECT_PHASES.md) | Implementation roadmap and phase exit criteria |
| [TECH_STACK.md](./docs/TECH_STACK.md) | Architectural choices, responsibilities, and technology boundaries |
| [AGENTS.md](./AGENTS.md) | AI agent implementation guide and coordination contract |
| [custom-provider.md](./docs/custom-provider.md) | Provider adapter interface & infrastructure connectivity |
| [models.md](./docs/models.md) | Domain data model definitions and TypeScript schemas |
| [skills.md](./docs/skills.md) | Go agent capabilities and skills execution system |
| [packages.md](./docs/packages.md) | Shared monorepo packages ecosystem guide |
| [environment-variables.md](./docs/environment-variables.md) | Platform configuration and secrets management reference |
| [architecture-decisions.md](./docs/architecture-decisions.md) | Architecture Decision Records (ADR log) |

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.