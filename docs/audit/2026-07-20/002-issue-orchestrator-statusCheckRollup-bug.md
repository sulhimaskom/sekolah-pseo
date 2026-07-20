# Issue: Orchestrator workflow fails due to invalid statusCheckRollup query

**Suggested Labels**: `bug`, `P1`  
**File**: `.github/workflows/orchestrator.yml`

## Problem

The orchestrator workflow's "Verify PR Status" step uses:

```bash
CI_STATUS=$(gh pr view $PR_NUMBER --json statusCheckRollup --jq '.statusCheckRollup.state')
```

`statusCheckRollup` returns an **array** of check run objects, but the jq query treats it as a single object. This causes:

```
expected an object but got: array
```

## Impact

- Every PR gets a failing CI check
- Blocks automated merges via CI gating
- False negative — code changes are valid
- Affected all 3 Dependabot PRs (#494, #493, #492)

## Fix

Replace the jq query to properly iterate over the array:

```bash
CI_STATUS=$(gh pr view $PR_NUMBER --json statusCheckRollup --jq '[.statusCheckRollup[] | .conclusion] | join(",")')
```

Or check if any check has failed:

```bash
HAS_FAILURE=$(gh pr view $PR_NUMBER --json statusCheckRollup --jq '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
if [ "$HAS_FAILURE" -gt 0 ]; then echo "checks have failures"; fi
```
