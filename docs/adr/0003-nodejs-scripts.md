# ADR-0003: Node.js Scripts

## Status

Accepted

## Date

2026-01-07

## Context

The project required a build and data processing system. Considerations included:

- Cross-platform compatibility
- Team expertise and familiarity
- Availability of necessary libraries
- Ease of maintenance

## Decision

Use Node.js for all build scripts and data processing utilities.

## Consequences

### Positive

- Cross-platform compatibility
- Large ecosystem of npm packages
- JavaScript/TypeScript consistency across codebase
- Easy to learn and maintain
- Good support for file system operations

### Negative

- CommonJS module system (no native ESM at time of decision)
- May have performance limitations for CPU-intensive tasks

### Neutral

- Well-suited for ETL and static site generation tasks

## Status History

| Date       | Status   | Notes                        |
| ---------- | -------- | ---------------------------- |
| 2026-01-07 | Accepted | Initial decision for Node.js |
