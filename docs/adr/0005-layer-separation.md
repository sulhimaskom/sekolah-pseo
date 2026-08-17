# ADR-0005: Implement Layer Separation

## Status

Accepted

## Date

2026-01-07

## Context

The project needed clear separation between different concerns:

- Data processing and ETL logic
- Business logic for page building
- Presentation/UI layer for templates
- Configuration and utilities

## Decision

Implement layer separation following controller/service/presentation pattern:

- `scripts/` - Controllers/Orchestrators (build-pages.js, etl.js, etc.)
- `src/services/` - Business logic layer (PageBuilder.js)
- `src/presenters/` - Presentation layer (templates, styles, design system)
- `src/core/` - Shared infrastructure layer (config.js, utils.js, logger.js, fs-safe.js, resilience.js, slugify.js, data-schema.js, rate-limiter.js)

Dependencies flow inward: controllers → services → presenters, with `src/core/` as a neutral foundation any layer may depend on. Shared infrastructure was extracted from `scripts/` into `src/core/` (TASK-094, 2026-08-17) so that the presentation and business layers no longer depend on the controller directory.

## Consequences

### Positive

- Better separation of concerns
- Improved testability - layers can be tested in isolation
- Easier to maintain and modify individual components
- Clearer code organization
- Reusable business logic
- Shared infrastructure lives in a neutral layer (`src/core/`) that inverts no dependency direction

### Negative

- Additional file structure to navigate
- May require more boilerplate for simple operations
- Need to manage dependencies between layers

### Neutral

- Follows standard software architecture patterns
- Aligned with CommonJS module system

## Status History

| Date       | Status   | Notes                                                                     |
| ---------- | -------- | ------------------------------------------------------------------------- |
| 2026-01-07 | Accepted | Initial layer separation implementation                                   |
| 2026-08-17 | Accepted | Shared infrastructure extracted from `scripts/` to `src/core/` (TASK-094) |
