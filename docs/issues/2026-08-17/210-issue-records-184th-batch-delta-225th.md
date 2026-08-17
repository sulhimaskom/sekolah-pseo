# Issue Records — 184th Batch (Delta, 225th verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 224th audit matrix on `0bd1256`, re-executed fresh this run (see
`209-audit-report-2026-08-17-225th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **213th
consecutive denial**, freshly probed this run). Per the 215-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 29th flat)**, no new findings, no source delta; F037 126th obs, F038 49d (12/12), F002 213th, F005 102/73rd, F018 **28d held**, F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 13 py + 27 wrapper green, coverage 95.57/93.07, pull CI window **19/0/1 zero-failure maintained** (93rd win in-prog at 04:33Z), F063 IMPROVING

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                              | State            |
| ---- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                          | HELD (126th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 12/12 (checkout exit 128, 49 days)                                                                     | HELD (49 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (213th denial)                                                                  | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                         | HELD             |
| F005 | chore       | P2       | 102 docs/issues ledger files fail `prettier --check` (73rd flat, held)                                                             | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                 | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (28 days > 7 threshold; **held at 28d this run**)                                                    | HELD (28 days)   |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                  | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE re-confirmed this run: requires `>=22.22.1`)                  | HELD             |
| F063 | ci          | P1       | pull CI hourly — **19/0/1, zero-failure window maintained**; 04:33Z in-progress = 93rd win; F038 remains the structural CI failure | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                              | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–24)                                                                              | HELD             |

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

No new findings this run — every candidate surfaced by the direct deterministic
probes was re-matched to existing held/resolved ledger entries this window (git
history is docs-only through `0bd1256`, so no new source surface exists):
workflow security & unused composite action → F037/F044/F007; missing automated
CI gates → F066/F068; pre-commit filter mismatch → F005/F064 cluster;
devcontainer/requirements gaps → F044/F064; data staleness & env placeholder →
F018/F025. No two open entries describe the same defect; all retained entries
carry exactly one category + one priority label.

## Fail-safe check (contract)

No destructive actions taken this run. No files, branches, or docs deleted. All
probes were read-only (`gh issue create` probe is the sole write-side probe, and
it is denied by token scope before any mutation — F002). The repository remains
in a clean, buildable, green state (see `209-audit-report-2026-08-17-225th.md`).
