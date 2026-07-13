# Security Regressed: `secrets.GH_TOKEN` Still Used Instead of `secrets.GITHUB_TOKEN`

**Category**: security | **Priority**: P1
**Evaluation Date**: 2026-07-13
**Audit Report**: docs/audit-report-2026-07-13.md
**References**: #003 (2026-07-12), PR #315 (closed as fixed)

## Description

The `secrets.GH_TOKEN` issue previously reported in issue #003 and supposedly fixed via PR #315 has **regressed**. Two workflow files still reference `secrets.GH_TOKEN` instead of using the built-in `secrets.GITHUB_TOKEN`.

## Findings

### 1. `.github/workflows/architect-agent.yml` (line 37)
```yaml
GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 2. `.github/workflows/orchestrator.yml` (lines 33, 41)
```yaml
GH_TOKEN: ${{ secrets.GH_TOKEN }}  # line 33
token: ${{ secrets.GH_TOKEN }}      # line 41
```

## Impact

- **High**: Non-standard token usage bypasses GitHub's built-in token management
- `secrets.GH_TOKEN` must be manually managed/rotated, unlike GITHUB_TOKEN which is auto-managed
- If `GH_TOKEN` is a classic PAT with broad permissions, compromise risk is elevated
- Indicates the regression prevention mechanism (check-workflow-security.js) is not integrated into CI

## Root Cause

The security checker script (`scripts/check-workflow-security.js`) detects this issue but is **not run in CI** and has **no tests** (see issue #002). Without CI enforcement, fixes silently regress.

## Recommended Fix

Replace `secrets.GH_TOKEN` with `${{ secrets.GITHUB_TOKEN }}` in:

1. `.github/workflows/architect-agent.yml` line 37
2. `.github/workflows/orchestrator.yml` lines 33, 41

Then integrate the security checker into the CI pipeline to prevent future regressions.

## Verification

```bash
node scripts/check-workflow-security.js
```
Expected: Zero `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN` violations.
