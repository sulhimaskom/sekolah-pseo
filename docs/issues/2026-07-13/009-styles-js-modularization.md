# styles.js Modularization Plan

**Category**: refactor
**Priority**: P2
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/009-styles-js-modularization.md
**Parent Issue**: #002 Oversized Source Files

## Problem Statement

`src/presenters/styles.js` at 1275 lines is a single monolithic CSS generator. It combines design tokens, component styles, responsive breakpoints, animations, and utility classes in one file. The previous successful extraction of BuildOrchestrator from build-pages.js (542→44 lines) proves this pattern works.

## Proposed Modular Structure

```javascript
src/presenters/styles/
├── index.js           // Orchestrator — composes all modules
├── tokens.js          // Design tokens (colors, spacing, typography)
├── base.js            // Base styles (reset, typography, body)
├── components.js      // Component styles (header, footer, cards, search)
├── responsive.js      // Responsive breakpoints and media queries
└── utilities.js       // Utility classes and animations
```

## Acceptance Criteria

- [ ] styles.js split into minimum 4 focused modules
- [ ] index.js serves as thin orchestrator (under 30 lines)
- [ ] All existing CSS output is identical (no visual changes)
- [ ] Build passes, lint passes, all tests pass
- [ ] Coverage maintained at or above current levels
- [ ] Each module < 300 lines

## Out of Scope

- CSS output changes (pure refactor, no visual changes)
- Adding new CSS features or design tokens
- Changes to HTML templates or page structure
