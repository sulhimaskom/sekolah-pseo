# Finding 017: on-push.yml Still Missing `issues: write` Permission

**Evaluation Date**: 2026-07-12 (second pass)
**Category**: ci
**Priority**: P1
**Status**: Open — needs manual PR with `workflows` permission

## Observation

The `on-push.yml` workflow is still missing the `issues: write` permission in its top-level `permissions:` block. This was documented as "fixed" in the previous audit run but was intentionally reverted because the CI runner token lacked the `workflows` permission to push to workflow files.

Without this permission, the GITHUB_TOKEN in CI cannot:

- Create GitHub issues from audit findings
- Add labels to issues
- Close issues

Both the previous run (2026-07-12, first pass) and this run (second pass) attempted to push this fix but were blocked by the `workflows` permission requirement.

## Evidence

```yaml
# Current (on-push.yml:6-8)
permissions:
  contents: write
  pull-requests: write
# Missing: issues: write
```

## Impact

- High: Blocks the automated issue creation pipeline
- All Phase 1-3 findings remain as local documentation only
- Every CI run re-discovers the same issues without tracking them

## File Affected

- `.github/workflows/on-push.yml` (line 8)

## Suggested Fix

Add `issues: write` to the permissions block manually:

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

This must be done via a PR with sufficient `workflows` permission, or by a maintainer pushing directly.
