# F013 — CI Workflow Permissions Violations (12: 2 CRITICAL + 10 HIGH)

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: security
**Priority**: P2
**Status**: open

## Summary
`check-workflow-security.js` reports **12 violations** across the workflow files, mostly stable
regressions of previously-documented fixes.

## Evidence (this run — `node scripts/check-workflow-security.js`)
```
🔴 [CRITICAL] DUPLICATE_API_KEY: parallel.yml (2 findings)
   API_KEY references same secret (secrets.GEMINI_API_KEY) as GEMINI_API_KEY
🟠 [HIGH] ID_TOKEN_WRITE            x4   (orchestrator.yml:9, parallel.yml:16, +2)
🟠 [HIGH] ACTIONS_WRITE_NON_MERGE   x4   (orchestrator.yml:13, parallel.yml:15, +2)
🟠 [HIGH] GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN x2 (orchestrator.yml)
```
Total `secrets.*` references: **59 across 25 distinct names** (F004).

## Impact
Over-privileged workflow permissions and duplicate API-key aliasing expand the CI attack
surface. If a workflow secret leaks, the blast radius is much larger than necessary.

## Suggested fix
- Remove duplicate API_KEY (keep one canonical secret).
- Drop `id-token: write` and `actions: write` from non-OIDC / non-merge workflows.
- Replace `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN`.
- Reduce secrets.* usage to the minimal set actually needed.

## Affected
`.github/workflows/parallel.yml`, `orchestrator.yml`, `on-push.yml`, `on-pull.yml`