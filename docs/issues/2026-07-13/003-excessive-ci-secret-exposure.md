# Excessive CI Secret Exposure

**Category**: security
**Priority**: P1
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/003-excessive-ci-secret-exposure.md

## Problem Statement

CI workflows expose excessive secrets to all job steps, increasing the blast radius if any step is compromised. This is a persistent issue flagged in multiple previous audits.

## Impact

- **High severity**: If any single step in the 12-step on-push pipeline is compromised, ALL secrets are leaked
- **Unnecessary exposure**: Secrets like `SUPABASE_ANON_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` are not needed for static site generation
- **Duplicate aliases**: `API_KEY` is a direct alias of `GEMINI_API_KEY` (parallel.yml line 37)

## Evidence

**on-push.yml** (lines 20-28):
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  API_KEY: ${{ secrets.GEMINI_API_KEY }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
```

**parallel.yml** (lines 33-38):
```yaml
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## Recommended Actions

1. Audit which secrets are truly needed by each workflow
2. Set secrets only on the specific step that needs them (step-level `env:`) instead of job-level
3. Remove the duplicate `API_KEY` alias
4. Remove Supabase and Cloudflare secrets if they are not actually used by the build pipeline
5. Use GitHub Environments for additional protection on production secrets
