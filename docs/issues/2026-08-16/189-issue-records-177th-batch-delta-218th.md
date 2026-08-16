# Issue Records — 177th Batch (Delta, 218th verification, 2026-08-16)

**Evaluation Date**: 2026-08-16
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 217th audit matrix on `831857c`, re-executed fresh this run (see
`188-audit-report-2026-08-16-218th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **206th
consecutive denial**, freshly probed this run). Per the 214-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 22nd flat)**, no new findings, no source delta; F037 119th obs, F038 48d, F002 206th, F005 **102 files held (66th observation)**, F018 27d held, F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 27 py green, coverage 95.57/93.07, pull CI window **7/0/1 zero-failure maintained** with 50th+51st+52nd+53rd+54th+55th+56th+57th+58th+59th+60th+61st+62nd+63rd+64th+65th+66th+67th windows SUCCESS ×18 back-to-back (68th win in-prog), F063 IMPROVING, pytest 13/13 + run_tests 27/27

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                                                                                                                                                                      | State            |
| ---- | ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                                                                                                                                                                  | HELD (119th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 6/6 (checkout exit 128, 48 days)                                                                                                                                                                                                               | HELD (48 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (206th denial)                                                                                                                                                                                                          | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                                                                                                                                                                 | HELD             |
| F005 | chore       | P2       | 102 docs/issues ledger files fail `prettier --check` (66th observation; **count held at 102**)                                                                                                                                                                             | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                                                                                                                                                         | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (27 days > 7 threshold; held at 27)                                                                                                                                                                                                          | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                                                                                                                                                          | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE re-confirmed this run: requires `>=22.22.1`)                                                                                                                                                          | HELD             |
| F063 | ci          | P1       | pull CI hourly — **7/0/1, zero-failure window maintained**; 50th+51st+52nd+53rd+54th+55th+56th+57th+58th+59th+60th+61st+62nd+63rd+64th+65th+66th+67th windows (04:28Z → 19:15Z) SUCCESS ×18 back-to-back (68th = this run in-prog); F038 remains the structural CI failure | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                                                                                                                                                                      | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–23)                                                                                                                                                                                                                      | HELD             |

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
F067, F065, F028, F029), P2 (F044, F005, F007, F064, F026, F027, F017, F032),
P3 (F011, F019).

## Duplicate-prevention check (contract §2/§4)

No new findings this run — every candidate surfaced by the audit was re-matched
to existing held/resolved ledger entries this window (git history is docs-only
through `831857c`, so no new source surface exists): duplication clusters →
F019/F048; workflow security & unused composite action → F037/F044/F007;
missing automated CI gates → F066/F068; pre-commit filter mismatch →
F005/F064 cluster; devcontainer/requirements gaps → F044/F064. No two open
entries describe the same defect; all retained entries carry exactly one
category + one priority label. The F005 count held at 102 — the 217th run's
files 185–187 were prettier-formatted at commit, and this run's files 188–190
are prettier-formatted at gate, so the ledger-accuracy correction from the 216th
run is not regressing.

## Fail-safe check (contract)

No destructive actions taken this run. No files, branches, or docs deleted. All
probes were read-only (`gh issue create` probe is the sole write-side probe, and
it is denied by token scope before any mutation — F002). The repository remains
in a clean, buildable, green state (see `188-audit-report-2026-08-16-218th.md`).
New ledger files 188–190 are prettier-formatted at commit to keep F005 from
rising beyond 102.
