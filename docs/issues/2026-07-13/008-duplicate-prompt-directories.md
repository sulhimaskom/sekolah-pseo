# Duplicate Prompt Directories

**Category**: refactor
**Priority**: P3
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/008-duplicate-prompt-directories.md

## Problem Statement

Two identical prompt directories exist:

- `.github/prompt/` (13 files, 1263 lines)
- `.github/workflows/prompt/` (13 files, 1263 lines)

These directories contain identical content (verified via `diff`). The duplication wastes 1263 lines of repository space and creates a drift risk — if one copy is updated but the other is not, workflow behavior becomes inconsistent.

## Impact

- **Low-Medium**: Currently identical, but any update requires remembering to update both copies
- **Waste**: 1263 lines of unnecessary duplicate content
- **Confusion**: Two paths with same content — unclear which is authoritative

## Evidence

- `diff -r .github/prompt/ .github/workflows/prompt/` — no differences
- `on-push.yml` references `.github/prompt/` (line 77)
- Both directories have identical file listing (00.md through 11.md + README.md)

## Recommended Actions

1. Remove `.github/workflows/prompt/` directory
2. Update any workflows referencing `.github/workflows/prompt/` to use `.github/prompt/` instead
3. Keep `.github/prompt/` as the single canonical location
