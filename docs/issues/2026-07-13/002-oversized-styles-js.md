# Oversized Source File: src/presenters/styles.js

**Category**: refactor
**Priority**: P2
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/002-oversized-styles-js.md

## Problem Statement

`src/presenters/styles.js` is 1275 lines long, making it the largest file in the codebase by a significant margin. It generates all CSS for the static site — including design tokens, responsive breakpoints, animations, component styles, and utility classes.

## Impact

- **Single Responsibility Principle violation**: CSS generation for all components in one file
- **Maintainability**: Any change to styling requires navigating a 1275-line file
- **Testability**: Difficult to test individual style generation functions in isolation
- **Merge conflicts**: Large file increases likelihood of conflicting changes

## Evidence

- File: `src/presenters/styles.js` — 1275 lines
- Previous improvements: `scripts/build-pages.js` was successfully reduced from 542→44 lines via BuildOrchestrator extraction

## Recommended Actions

1. Split into logical modules: `tokens.js` (design tokens), `components.js` (component styles), `utilities.js`, `responsive.js`
2. Keep `styles.js` as a thin orchestrator that composes the modules
3. Follow the same pattern as the successful BuildOrchestrator extraction
