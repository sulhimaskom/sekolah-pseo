# Issue Records — 193rd Batch (Security Pass 13, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (Principal Security Engineer)
**Basis**: TASK-097 security audit — workflow security gate (`scripts/check-workflow-security.js`)
on `agent` branch.

## This run: F037 fix APPLIED locally, push-blocked (F050)

F037 (security, P0) — **Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)**
is **remediated in the working tree** (TASK-097). All 12 violations fixed across 5 workflow files
(architect-agent.yml, on-push.yml, opencode.yml, orchestrator.yml, parallel.yml), committed on
`agent` as local commit `6a371ea`:

- Removed 2 CRITICAL `DUPLICATE_API_KEY` clusters (1 on on-push + 4 on parallel)
- Removed wrong `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_KEY` mapping (on-push)
- Replaced `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (orchestrator 2×, architect-agent 1×)
- Removed `id-token: write` / `actions: write` from all non-OIDC/non-merge workflows
  (parallel, opencode, orchestrator, architect-agent — top-level AND job-level)

**State: F037 remains HELD on the remote** — the push of `.github/workflows/*` is refused by
GitHub App token lacking `workflows` permission (F050), the same blocker behind all 11 prior
regressions. Verification on the working tree: gate 0 violations exit 0; JS 1266 pass /
Python 27 pass; lint + prettier clean. `.husky/pre-commit` baseline deliberately stays at 12
with a note to tighten to 0 in the same commit that lands the workflow fix — a 0 baseline
before the fix reaches the remote would deadlock automation commits.

**Delivery requirement**: the fix must be pushed to `main` by a token with `workflows`
permission (repo admin PAT or workflows-enabled GitHub App). Until then the remote keeps the
12 violations and the regression cycle stays open.

## Open findings (held, unchanged by this pass)

| ID   | Category    | Priority | Title                                                                 | State            |
| ---- | ----------- | -------- | --------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL + 10 HIGH) — **fix ready on agent, push-blocked F050** | HELD (fix staged) |
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
