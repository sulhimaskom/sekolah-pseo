# Oversized Source File: src/presenters/styles.js (1275 lines)

**Category**: refactor
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/008-oversized-styles-js.md

## Problem Statement

`src/presenters/styles.js` is 1275 lines — the largest file in the codebase by a wide margin (next: BuildOrchestrator.js 556). It generates all CSS: design tokens, responsive breakpoints, animations, component styles, utility classes.

## Evidence

```
 1275 src/presenters/styles.js
  556 src/services/BuildOrchestrator.js
  275 src/services/PageBuilder.js
```

## Impact

- SRP violation: one module owns all styling concerns
- Maintainability: any style change requires navigating 1275 lines
- Testability: hard to unit-test individual style sections
- Merge-conflict magnet

## Suggested Fix

1. Split: `design-system.js` (tokens — exists separately), `components.js`, `layout.js`, `utilities.js`
2. Keep `styles.js` as a thin composer (proven pattern: build-pages.js 542→44 lines via BuildOrchestrator)
3. Add per-module unit tests asserting generated CSS fragments

## Related

- `docs/issues/2026-07-13/002-oversized-styles-js.md`
