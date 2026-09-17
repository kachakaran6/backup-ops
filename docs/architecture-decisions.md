# Architecture Decision Log (ADR)

This document records the architectural and design decisions made for the BackupOps platform.

---

## ADR-0001: Strict Separation of Control Plane and Data Plane

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Many backup solutions force user backup data through proprietary SaaS storage or central servers, creating vendor lock-in, data sovereignty violations, and egress cost spikes.
- **Decision**: BackupOps is strictly an orchestration and control-plane platform. User backup payloads flow directly from user-owned sources (e.g. databases, filesystems) to user-owned destinations (e.g. S3, MinIO, SFTP, local disks). The control plane only processes and stores metadata, logs, job states, and policies.
- **Consequences**: Users retain 100% data sovereignty. System scalability is vastly superior as the control plane is never bottlenecked by raw backup bandwidth.

---

## ADR-0002: Monorepo Structure with pnpm Workspaces

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: The platform contains multiple cooperating services (`apps/api`, `apps/web`, `apps/worker`) and shared packages (`packages/types`, `packages/config`, `packages/ui`).
- **Decision**: Use a single monorepo managed with `pnpm workspaces`. Shared contracts and validation schemas live in `@backup-ops/types`.
- **Consequences**: Type safety across frontend and backend boundaries is guaranteed at compile time. Atomic commits keep schemas, APIs, and client views in sync.

---

## ADR-0003: NestJS and TypeScript for Control Plane API

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Need an enterprise-grade, maintainable backend architecture supporting dependency injection, modular domain boundaries, schema validation, and OpenAPI generation.
- **Decision**: Implement `apps/api` using NestJS with TypeScript.
- **Consequences**: Clear separation of controllers, services, entities, and repositories. Built-in validation pipes and OpenAPI documentation.

---

## ADR-0004: Redis and BullMQ for Asynchronous Operation Execution

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Backup, sync, and verification operations are long-running and must never be processed synchronously inside HTTP request handlers.
- **Decision**: Use Redis with BullMQ in dedicated worker processes (`apps/worker`). The API immediately enqueues operations and returns a job reference.
- **Consequences**: Workers can scale independently, handle worker crashes gracefully, support job checkpoints, retries, and cancellation without affecting API availability.

---

## ADR-0005: PostgreSQL as Authoritative Durable Storage

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Durable control-plane state (users, organizations, resources, credentials metadata, policies, job histories, audit logs) requires relational integrity, ACID transactions, and robust migration tooling.
- **Decision**: PostgreSQL is the sole durable source of truth. Redis is strictly a transient queue and cache, never a durable business store.
- **Consequences**: High data integrity, reliable point-in-time recovery of control plane data, standard relational query capabilities.

---

## ADR-0006: Go for Infrastructure Host Agent

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Performing privileged operations (filesystem snapshots, Docker container volume freezing, database dump streaming) on remote user servers requires a lightweight, single-binary agent with low memory footprint and zero external runtime dependencies.
- **Decision**: Build the host infrastructure agent (`agent/`) in Go.
- **Consequences**: Single static binary compilation, cross-platform support (Linux, macOS, Windows), minimal resource usage on user production servers.

---

## ADR-0007: React, Vite, Tailwind CSS, and shadcn/ui for Web Interface

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: The user interface must be fast, responsive, accessible, minimal, and operationally dense without unnecessary visual clutter.
- **Decision**: Use React with Vite for fast HMR and optimized builds, Tailwind CSS for tokenized styling, and shadcn/ui (Radix primitives) for accessible components.
- **Consequences**: Excellent performance, high component reusability, consistent design language adhering to WCAG accessibility guidelines.

---

## ADR-0008: Provider Adapter Pattern for Infrastructure Connectivity

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: BackupOps must support various storage types (S3, SFTP, local, MinIO) and databases (PostgreSQL, MySQL, MongoDB) without polluting core domain logic with provider-specific conditionals.
- **Decision**: Establish abstract provider interfaces (`ServerProvider`, `DatabaseProvider`, `StorageProvider`). All infrastructure-specific logic lives inside provider adapters.
- **Consequences**: New storage engines and databases can be plugged in without modifying core job scheduling or policy engines.
