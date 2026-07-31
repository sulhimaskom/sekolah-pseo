# Excessive CI Secret Exposure with Duplicate Aliases

**Category**: security
**Priority**: P1
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/004-ci-secret-exposure.md

## Problem Statement

Six of seven workflows inject production secrets into the runner environment where autonomous AI agents execute. 39 `secrets.` references across workflow files, including **duplicate/redundant aliases**:

| Alias (in workflows)                                                       | Actual secret       | Verdict         |
| -------------------------------------------------------------------------- | ------------------- | --------------- |
| `API_KEY`                                                                  | `GEMINI_API_KEY`    | Duplicate alias |
| `VITE_SUPABASE_ANON_KEY`                                                   | `VITE_SUPABASE_KEY` | Duplicate alias |
| `SUPABASE_ANON_KEY`                                                        | (redundant)         | Redundant alias |
| `IFLOW_API_KEY`, `CLOUDFLARE_*`, `GEMINI_API_KEY`, `VITE_SUPABASE_URL/KEY` | —                   | Required        |

These are exposed in `env:` blocks of workflows that run `opencode` AI agents with full repo write access (`contents: write`, `pull-requests: write`).

## Evidence

- `.github/workflows/on-push.yml:18-28` — 9 env secrets
- `grep -c "secrets\." .github/workflows/*.yml` → 39 references in 6 files
- Duplicate-alias mapping verified against secret name semantics

## Impact

- Every secret in env is readable by any step, including third-party AI agent runtime
- Duplicate aliases multiply blast radius if one alias leaks
- Contradicts least-privilege: workflows that only build HTML do not need 8+ external-service secrets

## Suggested Fix

1. Remove duplicate aliases: `API_KEY`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`
2. Move secrets out of the job `env:` block into step-level `env:` only where the step genuinely consumes them
3. For workflows that do not call external APIs, drop the secret env entirely
4. Re-audit after change: `grep -c "secrets\." .github/workflows/*.yml` should drop materially

## Related

- Closed issues #178, #193, #218, #295, #315 (secret exposure minimization — reopened behavior)
- `docs/issues/2026-07-13/010-ci-secret-minimization-plan.md`
