# Issue Records — 152nd Batch (Delta, 193rd verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 192nd audit matrix on `788eb1d`, re-executed fresh this run (see
`113-audit-report-2026-08-15-193rd.md`), plus the F065 config source fix
(Phase 2).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **181st
consecutive denial**, freshly probed this run). Per the 192-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: PR #733 merged (PR HANDLER MODE, prettier-clean at gate), **F065 config validatePath sibling-prefix escape FIXED** (Phase 2 execution), orchestrator 10/10 HELD (34 days), pull CI best held 14/0/0 (42nd window), F005 flat 99 (41st), F004 stable 59/10, F018 held at 26 days, composite 69.65 (+0.10)

## Open findings (held)

| ID   | Category    | Priority | Title                                                                         | State           |
| ---- | ----------- | -------- | ----------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)     | HELD (94th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (secrets.GH_TOKEN vs GITHUB_TOKEN, 34 days) | HELD (34 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (181st denial)             | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template    | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (41st flat, held)         | HELD/FLAT       |
| F008 | refactor    | P2       | src/presenters/styles.js is 1318 lines (maintainability)                      | HELD            |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                            | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)             | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages             | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)         | HELD            |
| F063 | ci          | P1       | pull CI hourly timeout cluster (08-12) — SELF-RECOVERED, 42nd clean window    | HEALTHY         |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                         | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                         | HELD            |
| F067 | chore       | P1       | husky pre-commit gate swallow — cosmetic gate fix (source-writable)           | CANDIDATE       |

## RESOLVED this run

| ID   | Category | Priority | Title                                                         | State    |
| ---- | -------- | -------- | ------------------------------------------------------------- | -------- |
| F065 | security | P2       | config validatePath sibling-prefix escape (scripts/config.js) | RESOLVED |

F065 resolution: `validatePath()` now requires a path-separator boundary after
the exact-match equality check (`baseWithSep` prefix) instead of a raw
`startsWith(baseNormalized)`. This closes the sibling-prefix escape class:
`/project2`, `/project2/src`, `/project-extra` are all rejected for base
`/project`, while valid nested paths and exact matches are preserved. 3
regression tests added (`scripts/config.test.js`, suite 37→40). Full matrix
re-verified green after the fix (lint 0/0, build PASS, test:js 1104/0/4, pytest
13/13, prettier-clean).

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                  | State    |
| ---- | -------- | -------- | ------------------------------------------------------ | -------- |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security) | RESOLVED |
| F027 | ci       | P2       | CI check attribution for docs PRs                      | RESOLVED |
| F017 | docs     | P2       | stale docs drift (setup/api)                           | RESOLVED |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0)               | RESOLVED |
| F032 | security | P2       | secrets over-exposure in source tree                   | RESOLVED |

## Labels applied per contract §4

Category labels used: `security` (F037, F044, F065, F028, F032), `ci` (F038,
F063, F026, F027), `enhancement` (F018), `chore` (F002, F005, F011, F025, F064,
F067), `refactor` (F008, F007, F019), `docs` (F017). Priority labels: P0 (F037),
P1 (F038, F002, F018, F025, F063, F028, F067), P2 (F044, F005, F008, F065, F007,
F064, F026, F027, F017, F032), P3 (F011, F019). Exactly one category and one
priority per finding.
