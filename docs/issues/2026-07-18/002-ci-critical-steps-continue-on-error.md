# CI Critical Steps Use `continue-on-error: true` Masking Failures

**Category**: ci
**Priority**: P1
**Evaluation Date**: 2026-07-18

---

## Problem

In `.github/workflows/on-pull.yml`, two critical CI steps use `continue-on-error: true`:

```yaml
- name: Checkout Code
  uses: actions/checkout@v7
  continue-on-error: true # <-- masks checkout failures
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Setup Node.js
  uses: actions/setup-node@v6
  continue-on-error: true # <-- masks setup failures
  with:
    node-version: 20
    cache: 'npm'
```

## Impact

- If `actions/checkout` fails (network issue, token expired, repo unavailable), the workflow continues silently. All subsequent steps will operate on stale or missing checkout, producing unreliable results.
- If `actions/setup-node` fails (registry down, cache corrupted), subsequent `npm install` and build steps will use the wrong or no Node version, leading to confusing errors that are hard to trace back to the root cause.
- These are foundational steps — no subsequent step can succeed if they fail, yet the workflow masks their failures.

## Risk

**Severity: High** — masked failures in CI lead to:

1. False-positive CI passes (deploying untested code)
2. Wasted debugging time on downstream errors
3. Reduced trust in CI pipeline reliability

## Suggested Fix

Remove `continue-on-error: true` from both steps:

```yaml
- name: Checkout Code
  uses: actions/checkout@v7
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: 20
    cache: 'npm'
```

## Files Affected

- `.github/workflows/on-pull.yml` (lines 44, 51)
