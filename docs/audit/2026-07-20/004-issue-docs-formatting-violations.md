# Issue: 8 docs files fail Prettier formatting check

**Suggested Labels**: `chore`, `P2`  
**Files**:

- `docs/audit-report-2026-07-13.md`
- `docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md`
- `docs/issues/2026-07-13/005-missing-issues-write-permission.md`
- `docs/issues/2026-07-13/007-missing-automated-release-process.md`
- `docs/issues/2026-07-13/008-duplicate-prompt-directories.md`
- `docs/issues/2026-07-13/010-ci-secret-minimization-plan.md`
- `docs/issues/2026-07-18/001-comprehensive-quality-scoring.md`
- `docs/issues/2026-07-18/002-ci-critical-steps-continue-on-error.md`

## Problem

Running `npm run format:check` shows:

```
Checking formatting...
[warn] docs/audit-report-2026-07-13.md
[warn] docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md
[warn] ... (8 files total)
Code style issues found in 8 files. Run Prettier with --write to fix.
```

All 8 files are Markdown files in `docs/` directory.

## Impact

- **LOW**: Cosmetic only, does not affect code quality
- Violates the "ALL linting warnings are fixed" constraint
- Inconsistent with the rest of the codebase which passes formatting checks

## Fix

Run `npx prettier --write docs/audit-report-2026-07-13.md docs/issues/2026-07-13/*.md docs/issues/2026-07-18/*.md`
