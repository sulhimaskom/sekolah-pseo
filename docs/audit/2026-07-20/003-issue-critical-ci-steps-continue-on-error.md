# Issue: Critical CI steps use continue-on-error masking failures

**Suggested Labels**: `bug`, `P1`  
**Files**: `.github/workflows/on-pull.yml` (lines 43, 50)

## Problem

In `on-pull.yml`, two critical CI steps use `continue-on-error: true`:

1. **Checkout Code** (line 43-48): `continue-on-error: true`
2. **Setup Node.js** (line 49-54): `continue-on-error: true`

If either fails, the workflow continues silently. A failed checkout means:

- No source code to test
- Subsequent steps operate on stale or empty workspace
- Failures are masked

## Impact

- **HIGH**: Silent failures in CI pipeline
- Checkout failure is unrecoverable — nothing works after it
- Masked failures delay detection of infrastructure/environment issues
- Contradicts the "ALL linting warnings are fixed" and "All checks green" constraints

## Fix

Remove `continue-on-error: true` from both steps. These are critical path operations that should fail the workflow if they fail:

```yaml
- name: Checkout Code
  uses: actions/checkout@v7
  # Remove: continue-on-error: true
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}
```
