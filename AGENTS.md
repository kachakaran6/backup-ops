# BackupOps — AI Agent Implementation Guide

This file is the coordination contract for AI coding agents working in the BackupOps repository.

## 1. Mission

Build BackupOps as a professional, modular, self-hosted infrastructure data operations and backup orchestration platform.

The agent must treat the repository documentation as the product and architecture source of truth. Do not implement features based only on an isolated user request when that request conflicts with the documented architecture or phase boundaries.

## 2. Required Reading Order

Before making implementation changes, read these documents in order:

1. `docs/PRD.md` — product requirements and non-goals.
2. `docs/PROJECT_PHASES.md` — implementation roadmap and phase boundaries.
3. `docs/TECH_STACK.md` — technology choices and architectural boundaries.
4. `AGENTS.md` — this execution contract.

If more documentation is added later, determine whether it is normative, supporting, or historical and follow the newest applicable architecture decision.

## 3. Document Relationship

```text
                    docs/PRD.md
                         │
                 Product requirements
                         │
                         ▼
              docs/PROJECT_PHASES.md
                         │
                 What gets built when
                         │
                         ▼
                docs/TECH_STACK.md
                         │
               How it should be built
                         │
                         ▼
                    AGENTS.md
                         │
             How AI agents execute work
                         │
                         ▼
                    Repository
```

The agent must use all four documents together.

## 4. Product Rules

- BackupOps is an orchestration/control-plane product.
- Users own and choose their infrastructure and storage.
- Do not introduce mandatory proprietary BackupOps storage.
- Do not route user backup payloads through the control plane unless explicitly required by a documented feature.
- Operations must be provider-agnostic where practical.
- Long-running work belongs in asynchronous workers/agents, not HTTP handlers.
- Security-sensitive operations must be auditable.
- Destructive operations require safety controls.

## 5. Phase Discipline

Before implementing a feature:

1. Identify the phase that owns the feature in `docs/PROJECT_PHASES.md`.
2. Check its prerequisites.
3. Implement the smallest complete vertical slice required by that phase.
4. Do not pull future-phase complexity into an earlier phase unless a prerequisite abstraction is genuinely required.
5. Update documentation if the implementation changes an architectural decision.

If a requested feature belongs to a later phase, prefer establishing a clean interface or extension point rather than prematurely implementing the full future system.

## 6. Architecture Rules

### Frontend

Use React + TypeScript + Vite with Tailwind CSS and shadcn/ui.

Use TanStack Query for server state and Zustand only for appropriate client state.

### API

Use NestJS + TypeScript.

The API is the control plane. It handles authentication, authorization, resource metadata, policies, workflows, job creation, and coordination.

### Worker

Use Redis + BullMQ for asynchronous jobs.

Never process large backup/transfer operations synchronously inside API request handlers.

### Agent

The infrastructure agent is planned in Go. It performs privileged operations on user infrastructure and communicates securely with the control plane.

### Database

PostgreSQL is the control-plane source of truth. Do not use Redis as durable business storage.

### Containers

Docker and Docker Compose are the primary self-hosted deployment mechanism.

## 7. Provider Architecture

Use interfaces/adapters for providers.

Examples:

```text
Resource
├── ServerProvider
├── DatabaseProvider
└── StorageProvider
```

Do not spread provider-specific conditionals throughout the domain layer.

Provider-specific behavior belongs inside the provider adapter or a clearly isolated integration module.

## 8. Operation Architecture

Core operations are:

- COPY
- MOVE
- BACKUP
- RESTORE
- SYNC
- MIRROR
- VERIFY
- ARCHIVE
- DELETE
- PRUNE

The operation engine should share common concepts such as:

- source
- destination
- operation ID
- job ID
- checkpoints
- progress
- logs
- retry state
- verification
- result

Avoid creating separate, duplicated execution frameworks for each operation type.

## 9. Job Rules

All substantial operations must be asynchronous.

Preferred lifecycle:

```text
QUEUED
  ↓
PLANNING
  ↓
RUNNING
  ↓
VERIFYING
  ↓
COMPLETED
```

Failure/cancellation states must be explicit.

Jobs should be designed for:

- idempotency.
- retry.
- cancellation.
- checkpointing.
- resumability.
- durable state transitions.

Never assume a worker process will remain alive for the complete duration of an operation.

## 10. Security Rules

Never:

- Commit secrets.
- Log credentials.
- Return private keys in normal API responses.
- Trust frontend authorization decisions.
- Store plaintext provider credentials when encrypted storage is available.
- Give agents broader privileges than required.

Sensitive operations must be authorized server-side and auditable.

## 11. Data Handling Rule

The platform should distinguish clearly between:

```text
Control-plane metadata
        vs.
User data / backup payload
```

The control plane stores metadata required to orchestrate operations. User payloads remain in configured user-controlled infrastructure unless a feature explicitly requires another path.

## 12. UI Rules

The UI should be:

- Minimal.
- Professional.
- Operationally clear.
- Responsive.
- Accessible.
- Consistent with shadcn/ui patterns.

Every operation view should make source, destination, operation, state, progress, and failure reason understandable.

Destructive actions should have:

- Explicit confirmation.
- Clear impact information.
- Dry-run support where practical.

## 13. Coding Rules

- Prefer small cohesive modules.
- Keep domain logic independent of transport/UI details.
- Avoid unnecessary abstractions before they have a concrete use.
- Avoid duplicated provider logic.
- Use strong types instead of broad `any` types.
- Validate external input.
- Handle failure paths explicitly.
- Do not hide operational errors.
- Preserve backward compatibility where practical.
- Do not silently change data semantics.

## 14. Dependency Rules

Before adding a dependency:

1. Check whether the current stack already provides the capability.
2. Confirm that the dependency has a clear responsibility.
3. Prefer mature, focused dependencies.
4. Avoid multiple libraries solving the same problem.
5. Update `docs/TECH_STACK.md` if the dependency changes an architectural technology decision.

## 15. Database Rules

- Schema changes must be migration-based.
- Never manually modify production schema assumptions without migrations.
- Preserve referential integrity.
- Add indexes based on actual query patterns.
- Use transactions for multi-record state changes where atomicity matters.
- Keep secrets out of ordinary metadata tables unless encrypted appropriately.

## 16. API Rules

- Version APIs deliberately.
- Validate all request payloads.
- Authorize every resource access.
- Return stable error structures.
- Do not expose internal stack traces to clients.
- Long operations return job references rather than holding open HTTP requests.

## 17. Worker Rules

Workers must:

- Be restart-safe.
- Emit structured logs.
- Track job IDs.
- Handle retries intentionally.
- Avoid duplicate execution.
- Persist important state.
- Respect cancellation.
- Avoid unbounded concurrency.

## 18. Agent Rules

The Go agent should:

- Have a narrow permission model.
- Authenticate its identity.
- Report capabilities.
- Send heartbeats.
- Avoid storing unnecessary control-plane state locally.
- Never expose unrestricted remote command execution as a default product feature.
- Validate requested operations against available capabilities and permissions.

## 19. Testing Rules

Every meaningful implementation should include appropriate tests.

Priorities:

1. Domain logic.
2. Authorization.
3. Job state transitions.
4. Provider contracts.
5. Failure/retry/resume behavior.
6. Critical UI flows.
7. End-to-end backup/restore paths.

A feature that works only on the happy path is not complete for BackupOps.

## 20. Documentation Rules

When implementation changes behavior or architecture:

- Update the relevant documentation.
- Keep examples aligned with the actual design.
- Do not leave contradictory architecture descriptions.

Documentation hierarchy:

```text
PRD
 ↓
Project Phases
 ↓
Tech Stack
 ↓
Architecture-specific documents
 ↓
Implementation
```

If a lower-level document conflicts with a higher-level requirement, resolve the conflict before proceeding.

## 21. Change Workflow for AI Agents

For every task:

### Step 1 — Understand

Read the relevant PRD requirements and phase.

### Step 2 — Inspect

Inspect the existing repository before creating or changing files.

### Step 3 — Plan

Identify affected modules, interfaces, database changes, APIs, UI changes, tests, and documentation.

### Step 4 — Implement

Implement the smallest coherent change that satisfies the requirement.

### Step 5 — Validate

Run applicable formatting, type checks, tests, builds, and integration checks.

### Step 6 — Review

Check security, failure paths, authorization, idempotency, and backward compatibility.

### Step 7 — Document

Update architecture/phase documentation if required.

### Step 8 — Report

Summarize:

- What changed.
- Files changed.
- Validation performed.
- Known limitations.
- Recommended next step.

## 22. No-Code Foundation Rule

If the current task explicitly asks for documentation, structure, planning, or scaffolding only, do not add application implementation code.

## 23. Never Invent Missing Requirements

When a critical architectural decision is genuinely unspecified, do not silently invent a product behavior that could affect data safety. Identify the ambiguity and choose the safest reversible design or request clarification when necessary.

## 24. Data Safety Priority

For BackupOps, the order of concern is:

1. Data integrity.
2. Security.
3. Recoverability.
4. Correctness.
5. Observability.
6. Performance.
7. Convenience.

A faster backup that can silently corrupt or lose data is unacceptable.

## 25. Final Agent Principle

**Build the system as one coherent product, not as a collection of disconnected features.**

Every new resource, provider, operation, workflow, or storage integration should fit the same control-plane → worker → agent/provider → user infrastructure model.
