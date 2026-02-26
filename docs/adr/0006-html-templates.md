# ADR-0006: Extract HTML Templates to Separate Modules

## Status

Accepted

## Date

2026-01-07

## Context

HTML templates were initially embedded in build scripts, making them:

- Hard to test in isolation
- Difficult to modify without touching business logic
- Not reusable across different contexts

## Decision

Extract HTML templates to separate modules in `src/presenters/templates/`.

## Consequences

### Positive

- Templates are testable in isolation
- Easier to modify appearance without touching business logic
- Reusable across different build contexts
- Clearer separation between data and presentation

### Negative

- Additional file management overhead
- Need to manage template dependencies

### Neutral

- Implemented in `src/presenters/templates/school-page.js`

## Status History

| Date       | Status   | Notes                       |
| ---------- | -------- | --------------------------- |
| 2026-01-07 | Accepted | Initial template extraction |
