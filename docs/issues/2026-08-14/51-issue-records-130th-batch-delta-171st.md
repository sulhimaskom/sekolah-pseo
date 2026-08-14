# Issue Records — 130th Batch (Delta, 171st verification, 2026-08-14)

**Evaluation Date**: 2026-08-14
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 170th audit matrix on `6eaf8a6`, re-executed fresh this run (see
`50-audit-report-2026-08-14-171st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **159th
consecutive denial**, freshly probed this run). Per the 170-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: PR #711 merged (PR HANDLER MODE), orchestrator 10/10 HELD (21 days), pull CI best held 14/1/0 (20th window), F005 flat 96 (19th), F004 stable 59/10, F018 held at 25 days

## Open findings (held)

| ID   | Category    | Priority | Title                                                                         | State           |
| ---- | ----------- | -------- | ----------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)     | HELD (72nd obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (secrets.GH_TOKEN vs GITHUB_TOKEN, 21 days) | HELD (21 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (159th denial)             | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template    | HELD            |
| F005 | chore       | P2       | 96 docs/issues ledger files fail `prettier --check` (19th flat)               | HELD/FLAT       |
| F008 | refactor    | P2       | src/presenters/styles.js is 1318 lines (maintainability)                      | HELD            |
| F065 | bug         | P2       | Homepage undefined-slug latent bug (src/presenters/templates/homepage.js)     | CANDIDATE       |
| F065 | security    | P2       | config validatePath hardening candidate (scripts/config.js)                   | CANDIDATE       |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                            | HELD            |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                         | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 19–25)                         | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (25 days > 7 threshold; held at 25)             | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages             | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)         | HELD            |
| F063 | ci          | P1       | pull CI hourly timeout cluster (08-12) — SELF-RECOVERED, 20th clean window    | HEALTHY         |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                  | State    |
| ---- | -------- | -------- | ------------------------------------------------------ | -------- |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security) | RESOLVED |
| F027 | ci       | P2       | CI check attribution for docs PRs                      | RESOLVED |
| F017 | docs     | P2       | stale docs drift (setup/api)                           | RESOLVED |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0)               | RESOLVED |
| F032 | security | P2       | secrets over-exposure in source tree                   | RESOLVED |

## Labels applied per contract §4

Category labels used: `bug` (F065), `security` (F037, F044, F065, F028, F032),
`ci` (F038, F063, F026, F027), `enhancement` (F018), `chore` (F002, F005, F011,
F025, F064), `refactor` (F008, F007, F019), `docs` (F017). Priority labels:
P0 (F037), P1 (F038, F002, F018, F025, F063, F028), P2 (F044, F005, F008, F065,
F007, F064, F026, F027, F017, F032), P3 (F011, F019). Exactly one category and
one priority per finding.
