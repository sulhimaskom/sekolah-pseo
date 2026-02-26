# ADR-0007: Create PageBuilder Service Layer

## Status

Accepted

## Date

2026-01-07

## Context

The page generation logic was mixed with file I/O operations and presentation:

- Business logic tightly coupled with infrastructure
- Difficult to test page generation independently
- No clear separation between "what" and "how"

## Decision

Create a dedicated `PageBuilder` service in `src/services/PageBuilder.js` that:

- Handles business logic for page generation
- Accepts configuration and data as inputs
- Returns structured data for presentation
- Is independent of file I/O and templating details

## Consequences

### Positive

- Business logic isolated from file I/O and presentation
- Easier to test page generation logic
- Clearer code flow and responsibilities
- Can generate different output formats without major refactoring

### Negative

- Additional abstraction layer
- Need to manage service interface contracts

### Neutral

- Part of the overall layer separation architecture

## Status History

| Date       | Status   | Notes                              |
| ---------- | -------- | ---------------------------------- |
| 2026-01-07 | Accepted | Initial PageBuilder implementation |
