# BackupOps Documentation

This directory contains the product and engineering source of truth for BackupOps.

## Documents

| Document | Purpose |
|---|---|
| [PRD](./PRD.md) | Product vision, requirements, scope, security, UX, and success criteria |
| [Project Phases](./PROJECT_PHASES.md) | Sequential implementation roadmap and phase exit criteria |
| [Tech Stack](./TECH_STACK.md) | Technology choices, responsibilities, and architecture boundaries |
| [AI Agent Guide](../AGENTS.md) | Instructions for AI coding agents and implementation workflow |

## How They Work Together

```text
PRD
 │
 │ defines what BackupOps is
 ▼
PROJECT_PHASES
 │
 │ defines what should be built and when
 ▼
TECH_STACK
 │
 │ defines the implementation technologies and boundaries
 ▼
AGENTS.md
 │
 │ defines how AI agents must execute work
 ▼
CODE
```

These documents should be treated as a connected system rather than independent notes.

## Change Policy

If implementation reveals that a requirement or architecture must change:

1. Update the relevant document first or as part of the same change.
2. Keep all documents internally consistent.
3. Record significant architectural decisions in a dedicated document when needed.
4. Do not silently introduce product behavior that conflicts with the PRD.
