# Oversized Source Files Violate Single Responsibility Principle

**Category**: refactor | **Priority**: P2
**Evaluation Date**: 2026-07-06
**Audit Report**: docs/audit-report-2026-07-06.md

## Description

Two source files far exceed reasonable size limits, violating the Single Responsibility Principle (SRP) and reducing maintainability.

### Key Findings

1. **`src/presenters/styles.js`** — **1275 lines**
   - Mixes CSS variable definitions (design tokens), CSS generation functions, File I/O operations, responsive breakpoints, and accessibility queries in a single file.
   - No dedicated test file (CSS content tested only through template tests indirectly).

2. **`scripts/build-pages.js`** — **536 lines**
   - Acts as a controller handling: CSV data loading, build orchestration, file I/O with concurrency control, manifest management, enrichment data loading, and multiple output formats (HTML, search data, JSON export, gzip).

### Impact
- Reduced testability — styles.js has no direct test coverage
- High cognitive load for new contributors
- Merge conflict magnets during parallel development

### Files Affected
- `src/presenters/styles.js` (1275 lines)
- `scripts/build-pages.js` (536 lines)

### Recommendations
1. Split `styles.js`: extract into `reset.js`, `layout.js`, `accessibility.js`, `responsive.js`
2. Split `build-pages.js`: extract build orchestration into dedicated module, separate data loading from page generation
3. Enforce 250-line limit for logic files
