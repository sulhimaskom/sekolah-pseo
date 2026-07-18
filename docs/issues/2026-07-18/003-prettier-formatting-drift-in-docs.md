# Prettier Formatting Drift in docs/ — 6 Files Not Formatted

**Category**: chore
**Priority**: P3
**Evaluation Date**: 2026-07-18

---

## Problem

Running `npm run format:check` (prettier check) reports 6 unformatted files:

```
docs/audit-report-2026-07-13.md
docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md
docs/issues/2026-07-13/005-missing-issues-write-permission.md
docs/issues/2026-07-13/007-missing-automated-release-process.md
docs/issues/2026-07-13/008-duplicate-prompt-directories.md
docs/issues/2026-07-13/010-ci-secret-minimization-plan.md
```

## Evidence

```
$ npm run format:check
> prettier --check .
Checking formatting...
[warn] docs/audit-report-2026-07-13.md
[warn] docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md
[warn] docs/issues/2026-07-13/005-missing-issues-write-permission.md
[warn] docs/issues/2026-07-13/007-missing-automated-release-process.md
[warn] docs/issues/2026-07-13/008-duplicate-prompt-directories.md
[warn] docs/issues/2026-07-13/010-ci-secret-minimization-plan.md
Code style issues found in 6 files.
```

## Impact

- **Low severity individually**, but indicates lack of formatting enforcement in CI
- Reduces codebase consistency over time as more files drift
- Creates noise in diffs when formatting-only changes are mixed with content changes

## Root Cause

CI pipelines (`on-push.yml`, `on-pull.yml`) do not run `npm run format:check` as a pre-merge gate. The `.prettierignore` may not properly include or exclude docs/.

## Suggested Fix

1. Run `npx prettier --write docs/` to fix current files
2. Add `npm run format:check` to CI pipeline as a non-blocking check (or blocking if desired)
3. Consider adding a `.prettierignore` entry for docs/ if intentional, or fix the files

## Files Affected

- `docs/audit-report-2026-07-13.md`
- `docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md`
- `docs/issues/2026-07-13/005-missing-issues-write-permission.md`
- `docs/issues/2026-07-13/007-missing-automated-release-process.md`
- `docs/issues/2026-07-13/008-duplicate-prompt-directories.md`
- `docs/issues/2026-07-13/010-ci-secret-minimization-plan.md`
