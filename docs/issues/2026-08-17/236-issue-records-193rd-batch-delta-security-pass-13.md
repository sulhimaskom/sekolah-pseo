# Issue Records — 193rd Batch (Security Pass 13, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (Principal Security Engineer)
**Basis**: TASK-097 security audit — workflow security gate (`scripts/check-workflow-security.js`)
on `agent` branch.

## This run: F037 RESOLVED

F037 (security, P0) — **Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)**
is now **RESOLVED**. All 12 violations remediated across 5 workflow files
(architect-agent.yml, on-push.yml, opencode.yml, orchestrator.yml, parallel.yml):

- Removed 2 CRITICAL `DUPLICATE_API_KEY` clusters (1 on on-push + 4 on parallel)
- Removed wrong `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_KEY` mapping (on-push)
- Replaced `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (orchestrator 2×, architect-agent 1×)
- Removed `id-token: write` / `actions: write` from all non-OIDC/non-merge workflows
  (parallel, opencode, orchestrator, architect-agent — top-level AND job-level)

Pre-commit gate hardened to **zero-tolerance** (`.husky/pre-commit` baseline 12 → 0),
so any future regression blocks commits instead of being tolerated (F067 superseded).

Verification: gate 0 violations exit 0; JS 1266 pass / Python 27 pass; lint + prettier clean.

**Previous root cause**: fixes applied on `agent` never merged to `main`; `main→agent`
merges restored insecure versions (11 occurrences). Delivery to `main` via PR with this
pass to break the cycle.

## Open findings (held, unchanged by this pass)

| ID   | Category    | Priority | Title                                                                 | State            |
| ---- | ----------- | -------- | --------------------------------------------------------------------- | ---------------- |
| F038 | ci          | P1       | Orchestrator workflow fails 8/8 (checkout exit 128, 51+ days)          | HELD             |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (221st+ denial)     | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows        | HELD             |
| F005 | chore       | P2       | 103 docs/issues ledger files fail `prettier --check` (held/flat)       | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                    | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (28+ days > 7 threshold)                 | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages      | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)  | HELD             |
| F063 | ci          | P1       | pull CI hourly zero-failure window maintained                          | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                 | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–25)                  | HELD             |
