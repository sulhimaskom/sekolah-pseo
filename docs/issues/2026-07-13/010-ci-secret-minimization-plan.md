# CI Secret Minimization Plan

**Category**: security
**Priority**: P1
**Evaluation Date**: 2026-07-13
**File**: docs/issues/2026-07-13/010-ci-secret-minimization-plan.md
**Parent Issue**: #003 Excessive CI Secret Exposure

## Problem Statement

The on-push.yml and parallel.yml workflows expose 8+ secrets at the job level. Most of these secrets are not needed for the static site build pipeline and represent unnecessary blast radius.

## Secret Audit

| Secret                    | Needed? | Workflow      | Risk                        |
| ------------------------- | ------- | ------------- | --------------------------- |
| `GITHUB_TOKEN`            | ✅ Yes  | on-push       | Standard, auto-generated    |
| `IFLOW_API_KEY`           | ❓ TBD  | on-push       | Unknown purpose             |
| `VITE_SUPABASE_URL`       | ❓ TBD  | on-push       | Infra credential            |
| `VITE_SUPABASE_KEY`       | ❓ TBD  | on-push       | Infra credential            |
| `CLOUDFLARE_ACCOUNT_ID`   | ❌      | on-push       | Not used by build pipeline  |
| `CLOUDFLARE_API_TOKEN`    | ❌      | on-push       | Not used by build pipeline  |
| `GEMINI_API_KEY`          | ✅ Yes  | on-push       | Used by OpenCode AI agent   |
| `API_KEY` (alias)         | ❌      | on-push       | Duplicate of GEMINI_API_KEY |
| `SUPABASE_ANON_KEY`       | ❓ TBD  | on-push       | Public key, low risk         |
| `VITE_SUPABASE_ANON_KEY`  | ❓ TBD  | on-push       | Duplicate of SUPABASE_ANON_KEY|

## Acceptance Criteria

- [ ] Secrets moved from job-level `env:` to step-level where possible
- [ ] Duplicate `API_KEY` alias removed from parallel.yml
- [ ] Cloudflare secrets scoped only to steps that need them (or removed)
- [ ] Supabase key duplication eliminated
- [ ] Workflow runs still succeed after minimization
- [ ] Document which steps need which secrets
