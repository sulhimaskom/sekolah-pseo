# Issue Records — 179th Batch (Delta, 220th verification, 2026-08-16)

**Evaluation Date**: 2026-08-16
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 219th audit matrix on `576cb6f`, re-executed fresh this run (see
`194-audit-report-2026-08-16-220th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **208th
consecutive denial**, freshly probed this run). Per the 216-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 24th flat)**, no new findings, no source delta; F037 121st obs, F038 48d, F002 208th, F005 **102 files held (68th observation)**, F018 27d held, F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 27 py green, coverage 95.57/93.08, pull CI window **7/0/1 zero-failure maintained** with 50th+51st+52nd+53rd+54th+55th+56th+57th+58th+59th+60th+61st+62nd+63rd+64th+65th+66th+67th+68th+69th windows SUCCESS ×20 back-to-back (70th win in-prog), F063 IMPROVING, pytest 13/13 + run_tests 27/27

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                                                                                                                                                                                | State            |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                                                                                                                                                                            | HELD (121st obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 60/60 (checkout exit 128, 48 days)                                                                                                                                                                                                                       | HELD (48 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (208th denial)                                                                                                                                                                                                                    | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                                                                                                                                                                           | HELD             |
| F005 | chore       | P2       | 102 docs/issues ledger files fail `prettier --check` (68th observation; **count held at 102**)                                                                                                                                                                                       | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                                                                                                                                                                   | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (27 days > 7 threshold; held at 27)                                                                                                                                                                                                                    | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                                                                                                                                                                    | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE re-confirmed this run: requires `>=22.22.1`)                                                                                                                                                                    | HELD             |
| F063 | ci          | P1       | pull CI hourly — **7/0/1, zero-failure window maintained**; 50th+51st+52nd+53rd+54th+55th+56th+57th+58th+59th+60th+61st+62nd+63rd+64th+65th+66th+67th+68th+69th windows (04:28Z → 21:12Z) SUCCESS ×20 back-to-back (70th = this run in-prog); F038 remains the structural CI failure | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                                                                                                                                                                                | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–23)                                                                                                                                                                                                                                | HELD             |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                           | State                               |
| ---- | -------- | -------- | --------------------------------------------------------------- | ----------------------------------- |
| F008 | refactor | P1       | src/presenters/styles.js oversized source file                  | RESOLVED (198th; 41L + 11 modules)  |
| F067 | security | P1       | husky pre-commit gate swallow (`.husky/pre-commit`)             | RESOLVED                            |
| F065 | security | P2       | config validatePath sibling-prefix escape                       | RESOLVED                            |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0, this run re-confirmed) | RESOLVED                            |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security)          | RESOLVED                            |
| F027 | ci       | P2       | CI check attribution for docs PRs                               | RESOLVED                            |
| F017 | docs     | P2       | stale docs drift (setup/api)                                    | RESOLVED                            |
| F032 | security | P2       | secrets over-exposure in source tree                            | RESOLVED                            |
| F029 | test     | P1       | fetch-data.test.js corrupts tracked `external/raw.csv`          | RESOLVED (NOT re-observed this run) |

## Labels applied per contract §4

Category labels used: `security` (F037, F044, F067, F065, F028, F032),
`refactor` (F008, F007, F019), `ci` (F038, F063, F026, F027),
`enhancement` (F018), `chore` (F002, F005, F011, F025, F064), `test` (F029),
`docs` (F017). Priority labels: P0 (F037), P1 (F038, F002, F018, F025, F063,
F008, F067, F028, F029), P2 (F044, F005, F007, F064, F065, F026, F027, F017,
F032), P3 (F011, F019). All labels exist in-repo (verified via `gh label list`).

## Delta vs 178th batch

- F037: 120th → **121st observation** (12 violations unchanged)
- F038: 48 days (held; orchestrator 60/60 failures, latest 2026-08-16T00:53Z)
- F002: 207th → **208th consecutive denial**
- F005: 67th → **68th observation**, count held at **102** (219th files 191–193
  formatted at gate; this run's 194–196 formatted at commit)
- F063: 69th → **70th window in-progress**; ×19 → **×20 back-to-back success**
  through the 69th window (21:12Z verified this run)
- Coverage: 95.57/93.07 → 95.57/93.08 (branch re-measure drift, negligible)
- All other entries: unchanged.
