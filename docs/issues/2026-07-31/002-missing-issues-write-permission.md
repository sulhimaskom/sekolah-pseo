# Missing `issues: write` Permission in on-push.yml — Automated Issue Creation Blocked

**Category**: ci
**Priority**: P1
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/002-missing-issues-write-permission.md

## Problem Statement

`.github/workflows/on-push.yml` permissions block grants only `contents: write` and `pull-requests: write`. The autonomous maintenance loop cannot create GitHub issues — verified at runtime:

```
gh issue create → GraphQL: Resource not accessible by integration (createIssue)
POST /repos/{owner}/{repo}/issues → Resource not accessible by integration
```

This is the third consecutive audit (07-13, 07-30, 07-31) blocked by this gap. The 07-30 hardening log documented the one-line fix but could not push it (workflow file changes require `workflows` permission on the token).

## Evidence

- `.github/workflows/on-push.yml:6-8` — `permissions: contents: write, pull-requests: write`
- `docs/issues/2026-07-30/01-phase2-hardening.md` — documented fix, never pushed
- Runtime verification 2026-07-31: createIssue rejected via GraphQL + REST

## Impact

- Phase 1/2/3 findings cannot be tracked as GitHub issues
- Audit knowledge is siloed in docs/ instead of actionable issue tracker items
- Blocks the ISSUE MANAGER MODE of the loop entirely

## Suggested Fix

1. Add `issues: write` to `permissions:` block in `.github/workflows/on-push.yml`
2. Also add `workflows: write` (or use a PAT like `GH_TOKEN` as orchestrator.yml does) so hardening changes to workflow files can be pushed
3. Verify with `gh issue create` on next push

## Related

- `docs/issues/2026-07-13/005-missing-issues-write-permission.md`
- `docs/issues/2026-07-30/00-audit-report.md` (blocked)
