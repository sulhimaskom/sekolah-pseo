# Security: Excessive CI Secret Exposure (Reopened)

**Category**: security | **Priority**: P1
**Evaluation Date**: 2026-07-12
**Audit Report**: docs/audit-report-2026-07-12.md

## Description

CI workflows expose more secrets than necessary, increasing the blast radius if a workflow is compromised. This issue was previously marked FIXED but has regressed.

### Key Findings

1. **`on-push.yml`**: Exposes 2+ secrets including `IFLOW_API_KEY`, `GEMINI_API_KEY` on every push — not all are needed for the build steps.

2. **`parallel.yml`**: Still contains `API_KEY: ${{ secrets.GEMINI_API_KEY }}` alias (line 37) — adds confusion and unnecessary secret exposure.

3. **`architect-agent.yml`**: Uses `secrets.GH_TOKEN` instead of `secrets.GITHUB_TOKEN` — non-standard token usage.

### Files Affected

- `.github/workflows/on-push.yml`
- `.github/workflows/parallel.yml`
- `.github/workflows/architect-agent.yml`
- `.github/workflows/orchestrator.yml`

### Recommendations

1. Audit each workflow for the minimum secrets needed per job
2. Remove `API_KEY` alias from `parallel.yml`
3. Replace `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN` in architect-agent.yml
4. Use fine-grained permissions per job instead of top-level only
