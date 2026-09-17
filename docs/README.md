# BackupOps Documentation

This directory contains the product and engineering source of truth for BackupOps.

## Documents

| Document | Purpose |
|---|---|
| [PRD.md](./PRD.md) | Product vision, requirements, scope, security, UX, and success criteria |
| [PROJECT_PHASES.md](./PROJECT_PHASES.md) | Sequential implementation roadmap and phase exit criteria |
| [TECH_STACK.md](./TECH_STACK.md) | Technology choices, responsibilities, and architecture boundaries |
| [AI Agent Guide](../AGENTS.md) | Instructions for AI coding agents and implementation workflow |

## How They Work Together

```text
PRD
 \
 \
 Product requirements
 ▼
PROJECT_PHASES
 \
 \
 What gets built when
 ▼
TECH_STACK
 \
 \
 How it should be built
 ▼
AGENTS.md
 \
 \
 How AI agents execute work
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

## Documentation Conventions

- **Architecture Decisions**: Document critical decisions in `docs/` with clear rationale and context
- **Code Examples**: Include complete, runnable examples where practical
- **Cross-References**: Use relative paths (e.g., `[PRD.md](./PRD.md)`) for document links
- **Version Consistency**: Keep architectural descriptions aligned with actual implementation
- **Security**: Mark any sensitive examples with appropriate warnings

## Additional Architecture and Technical Specifications

The following supplementary architecture and engineering specifications guide platform implementation:

| Document | Status | Description |
|---|---|---|
| [custom-provider.md](./custom-provider.md) | Complete | Provider adapter interface & connectivity architecture |
| [models.md](./models.md) | Complete | Domain data model definitions & TypeScript schemas |
| [skills.md](./skills.md) | Complete | Go agent capabilities & skills execution system |
| [extensions.md](./extensions.md) | Complete | Extension & plugin architecture |
| [sdk.md](./sdk.md) | Complete | Programmatic client SDK specification |
| [themes.md](./themes.md) | Complete | UI theming system & design tokens |
| [prompt-templates.md](./prompt-templates.md) | Complete | Operational UI/UX guidance & prompt templates |
| [tui.md](./tui.md) | Complete | Terminal UI architecture & command-line interface |
| [keybindings.md](./keybindings.md) | Complete | Keyboard shortcut configuration across web & TUI |
| [packages.md](./packages.md) | Complete | Shared monorepo package ecosystem |
| [environment-variables.md](./environment-variables.md) | Complete | Platform configuration & environment reference |
| [architecture-decisions.md](./architecture-decisions.md) | Complete | Architecture Decision Records (ADR log) |

## Repository Structure

```text
backup-ops/
├── apps/
│   ├── web/                 # React control plane UI
│   ├── api/                 # NestJS API
│   └── worker/              # Async job workers
│
├── agent/                   # Go infrastructure agent
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared contracts/types
│   └── config/              # Shared configuration
│
├── infrastructure/
│   ├── docker/              # Container/deployment assets
│   └── nginx/               # Reverse proxy assets
│
└── docs/                    # Product and engineering documentation
```

## Getting Started

1. **Read the documentation in order**: PRD → PROJECT_PHASES → TECH_STACK → AGENTS.md
2. **Understand the architecture**: Review the technical stack and provider abstractions
3. **Plan implementation**: Use phase discipline to identify where each feature belongs
4. **Follow coding conventions**: Apply the guidelines in AGENTS.md consistently

## External Resources

- [Project GitHub Repository](https://github.com/your-org/backup-ops) (replace with actual URL)
- [Documentation Issues](https://github.com/your-org/backup-ops/issues) (replace with actual URL)
- [Architecture Decision Log](docs/architecture-decisions.md) (coming soon)

## Legal and Compliance

- All code is under the MIT License unless otherwise specified
- Security considerations are documented in each relevant component
- Audit logging is mandatory for all sensitive operations
- Credential management follows industry security best practices