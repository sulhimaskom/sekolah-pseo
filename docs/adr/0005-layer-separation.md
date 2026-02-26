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
- `scripts/utils.js` - Shared utilities

## Consequences

### Positive

- Better separation of concerns
- Improved testability - layers can be tested in isolation
- Easier to maintain and modify individual components
- Clearer code organization
- Reusable business logic

### Negative

- Additional file structure to navigate
- May require more boilerplate for simple operations
- Need to manage dependencies between layers

### Neutral

- Follows standard software architecture patterns
- Aligned with CommonJS module system

## Status History

| Date       | Status   | Notes                                   |
| ---------- | -------- | --------------------------------------- |
| 2026-01-07 | Accepted | Initial layer separation implementation |
