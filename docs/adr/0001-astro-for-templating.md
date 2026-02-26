# ADR-0001: Use Astro for Templating

## Status

Deprecated

## Date

2026-01-07

## Context

The project required a lightweight, fast static site generator for displaying Indonesian school information. The initial technology assessment evaluated multiple options including Astro, Next.js, and custom solutions.

## Decision

Use Astro for templating and static site generation.

## Consequences

### Positive

- Lightweight and fast static site generation
- Built-in support for component-based architecture
- Good developer experience with hot reload

### Negative

- **Note**: This decision was later deprecated. The project ultimately used CommonJS modules with custom Node.js templating instead of Astro, as documented in the implementation.

### Neutral

- Required learning curve for team members unfamiliar with Astro

## Status History

| Date       | Status     | Notes                                |
| ---------- | ---------- | ------------------------------------ |
| 2026-01-07 | Accepted   | Initial decision to use Astro        |
| 2026-02-26 | Deprecated | Implementation uses CommonJS instead |
