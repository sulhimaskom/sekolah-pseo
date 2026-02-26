# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the Sekolah PSEO project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows the Michael Nygard format:

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: The issue that motivated the decision
- **Decision**: What was decided
- **Consequences**: Positive, negative, and neutral impacts

See `0000-template.md` for the template.

## Index

| ADR                                    | Title                                             | Status     | Date       |
| -------------------------------------- | ------------------------------------------------- | ---------- | ---------- |
| [0001](./0001-astro-for-templating.md) | Use Astro for Templating                          | Deprecated | 2026-01-07 |
| [0002](./0002-csv-over-database.md)    | CSV over Database                                 | Accepted   | 2026-01-07 |
| [0003](./0003-nodejs-scripts.md)       | Node.js Scripts                                   | Accepted   | 2026-01-07 |
| [0004](./0004-resilience-patterns.md)  | Implement Resilience Patterns                     | Accepted   | 2026-01-07 |
| [0005](./0005-layer-separation.md)     | Implement Layer Separation                        | Accepted   | 2026-01-07 |
| [0006](./0006-html-templates.md)       | Extract HTML Templates to Separate Modules        | Accepted   | 2026-01-07 |
| [0007](./0007-pagebuilder-service.md)  | Create PageBuilder Service Layer                  | Accepted   | 2026-01-07 |
| [0008](./0008-rate-limiting.md)        | Implement Rate Limiting for Concurrent Operations | Accepted   | 2026-01-10 |

## Creating New ADRs

1. Copy `0000-template.md` to a new file (e.g., `ADR-XXXX-title.md`)
2. Fill in the status, date, context, decision, and consequences
3. Set initial status to "Proposed"
4. When accepted, update status to "Accepted"
5. Link related ADRs if this decision supersedes any previous ones
