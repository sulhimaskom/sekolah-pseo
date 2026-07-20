# Missing `issues: write` Permission in on-push.yml

**Category**: ci
**Priority**: P1
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/005-missing-issues-write-permission.md

## Problem Statement

The `on-push.yml` workflow is missing `issues: write` in its top-level permissions block. This prevents GITHUB_TOKEN from creating issues automatically during CI runs, blocking the automated audit cycle.

## Impact

- **High**: Automated Phase 1 audit is blocked — issues must be documented manually in docs/
- **Persistent issue**: Previous audit (2026-07-12) attempted to fix this but the change was never committed due to token limitations
- **Cycle dependency**: Need `issues: write` to create the PR that adds `issues: write`

## Evidence

Current on-push.yml permissions (lines 6-9):

```yaml
permissions:
  contents: write
  pull-requests: write
```

Missing:

```yaml
issues: write
```

## Recommended Actions

1. Manually add `issues: write` to the permissions block in `.github/workflows/on-push.yml`
2. Push directly to main (or create a PR with admin rights)
3. Verify next workflow run can create issues
