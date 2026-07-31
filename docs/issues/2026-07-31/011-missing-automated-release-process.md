# Missing Automated Release Process

**Category**: chore
**Priority**: P3
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/011-missing-automated-release-process.md

## Problem Statement

There is no automated release process: no version-bump workflow, no tag/release creation, no CHANGELOG automation. `CHANGELOG.md` exists but is maintained manually. Releases appear to be implicit (whatever is on main + Pages deployment).

## Evidence

- `.github/workflows/` — no release workflow (7 files: architect-agent, on-pull, on-push, opencode, orchestrator, parallel, template)
- `package.json` — `version: 1.0.0` unchanged across many feature commits (TASK-068, TASK-064, TASK-063, ...)
- `CHANGELOG.md` — manual, no CI hook

## Impact

- No version history → cannot attribute regressions to releases
- No rollback markers → Release & Rollback Safety capped at 72
- Contributors cannot track what shipped in a given deployment

## Suggested Fix

1. Add `release.yml` triggered on version tag push (`v*`) that:
   - Bumps version, generates CHANGELOG (e.g. git-cliff or keep-a-changelog tooling)
   - Creates GitHub Release with notes
2. Adopt semantic versioning on package.json (currently 1.0.0 flat)
3. Document release process in `docs/release.md`

## Related

- `docs/issues/2026-07-13/007-missing-automated-release-process.md`
