# F013 — Workflow Permissions Violations (2 CRITICAL + 10 HIGH, stable)

**Evaluation Date**: 2026-08-02 (29th run)
**Category**: security
**Priority**: P2
**Status**: OPEN

## Summary
`node scripts/check-workflow-security.js` reports **12 violations: 2 CRITICAL + 10 HIGH**
(unchanged since 28th run). Verified fresh this run.

## Evidence (this run)
```
🔴 [CRITICAL] DUPLICATE_API_KEY      parallel.yml — API_KEY references same secret
                                     (secrets.GEMINI_API_KEY) as GEMINI_API_KEY
🟠 [HIGH]     ID_TOKEN_WRITE         parallel.yml:16 — id-token: write in non-OIDC workflow
🟠 [HIGH]     ACTIONS_WRITE_NON_MERGE parallel.yml:15, orchestrator.yml:13
🟠 [HIGH]     GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN orchestrator.yml (2 occurrences)
🟠 [HIGH]     (6 more HIGH violations)
```

## Impact
Excessive `actions: write`/`id-token: write` grants and duplicated API-key secrets widen the
blast radius of the F015 RCE (actions token + cloud API keys exposed to any compromised step).

## Suggested fix
- Remove `id-token: write` from non-OIDC workflows.
- Remove `actions: write` except from merge workflows.
- Replace `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN`.
- Use one distinct secret per purpose; drop `API_KEY` duplicate.

## Affected
.github/workflows/parallel.yml, orchestrator.yml, on-push.yml, on-pull.yml, opencode.yml
