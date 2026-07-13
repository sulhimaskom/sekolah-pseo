# Workflow Security: Excessive `id-token: write` and `actions: write` Permissions

**Category**: security | **Priority**: P1
**Evaluation Date**: 2026-07-13
**Audit Report**: docs/audit-report-2026-07-13.md

## Description

Multiple workflow files declare overly broad permissions (`id-token: write`, `actions: write`) that exceed their operational requirements. This increases the attack surface — if any workflow is compromised, an attacker could forge OIDC tokens or manipulate GitHub Actions resources.

### Finding 1: `id-token: write` in non-OIDC workflows

`id-token: write` is only needed when a workflow uses OIDC (OpenID Connect) to authenticate with cloud providers (AWS, Azure, GCP). None of these workflows use OIDC.

**Files affected:**

| File | Top-level | Per-job | Total |
|------|-----------|---------|-------|
| `.github/workflows/architect-agent.yml` | Line 13 | Line 30 | 2 |
| `.github/workflows/on-pull.yml` | Line 14 | — | 1 |
| `.github/workflows/opencode.yml` | Line 18 | Line 35 | 2 |
| `.github/workflows/orchestrator.yml` | Line 9 | Line 26 | 2 |
| `.github/workflows/parallel.yml` | Line 16 | — | 1 |

Total: **8 occurrences across 5 files**

### Finding 2: `actions: write` in non-merge workflows

`actions: write` allows a workflow to manage Actions artifacts, cancel/modify other workflow runs, and manage self-hosted runners. This should be restricted to workflows that need merge capabilities.

**Files affected:**

| File | Top-level | Per-job | Total |
|------|-----------|---------|-------|
| `.github/workflows/architect-agent.yml` | Line 17 | Line 34 | 2 |
| `.github/workflows/opencode.yml` | Line 22 | Line 39 | 2 |
| `.github/workflows/orchestrator.yml` | Line 13 | Line 30 | 2 |
| `.github/workflows/parallel.yml` | Line 15 | — | 1 |

Total: **7 occurrences across 4 files**

`on-pull.yml` correctly uses `actions: write` (merge workflow) — this is the allowed exception.

## Impact

- **High**: Exploitation of a workflow with `id-token: write` could allow an attacker to forge tokens to cloud resources
- **High**: `actions: write` allows an attacker to tamper with other workflow runs
- Violates principle of least privilege

## Recommended Fix

Remove `id-token: write` from all non-OIDC workflows:

```yaml
permissions:
  contents: write
  pull-requests: write
  # Remove: id-token: write
  # Remove: actions: write (unless merge workflow)
```

For workflows that need elevated permissions, use job-level granular permissions instead of top-level.

## Verification

```bash
node scripts/check-workflow-security.js
```
Expected: Zero `ID_TOKEN_WRITE` and `ACTIONS_WRITE_NON_MERGE` violations.
