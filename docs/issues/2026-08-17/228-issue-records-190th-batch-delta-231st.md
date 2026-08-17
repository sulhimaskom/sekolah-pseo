# Issue Records — 190th Batch (Delta, 231st verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: PR Handler Mode (merged #776, closed #775) + 231st audit matrix on
`b8f75b5` (see `227-audit-report-2026-08-17-231st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **219th
consecutive denial**, freshly probed this run). Per the 219-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 2 open PRs → PR HANDLER MODE; post-handling 0 PRs / 0 issues → Phase 1 audit — composite **70.6 (+0.1, PR #776 TASK-087/TASK-086)**, no new findings; F037 132nd obs, F038 49d (15/15), F002 219th, F005 102/79th, F018 28d held, F008 RESOLVED maintained, coverage **97.4/93.43**, **1151 JS pass +17** (#776), pytest 13/13 + 27/27 holds, pull CI **24/0/1 zero-failure maintained** (99th win in-prog at 10:24Z), F063 IMPROVING, 190th batch delta

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                              | State            |
| ---- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                          | HELD (132nd obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 15/15 (checkout exit 128, 49 days)                                                                     | HELD (49 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (219th denial)                                                                  | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                         | HELD             |
| F005 | chore       | P2       | 102 docs/issues ledger files fail `prettier --check` (79th flat, held)                                                             | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                 | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (28 days > 7 threshold; **held at 28d this run**)                                                    | HELD (28 days)   |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                  | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE re-confirmed: requires `>=22.22.1`)                           | HELD             |
| F063 | ci          | P1       | pull CI hourly — **24/0/1, zero-failure window maintained**; 10:24Z in-progress = 99th win; F038 remains the structural CI failure | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                              | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–24)                                                                              | HELD             |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                  | State                               |
| ---- | -------- | -------- | ------------------------------------------------------ | ----------------------------------- |
| F008 | refactor | P1       | src/presenters/styles.js oversized source file         | RESOLVED (198th; 41L + 11 modules)  |
| F067 | security | P1       | husky pre-commit gate swallow (`.husky/pre-commit`)    | RESOLVED                            |
| F065 | security | P2       | config validatePath sibling-prefix escape              | RESOLVED                            |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0, re-confirmed) | RESOLVED                            |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security) | RESOLVED                            |
| F027 | ci       | P2       | CI check attribution for docs PRs                      | RESOLVED                            |
| F017 | docs     | P2       | stale docs drift (setup/api)                           | RESOLVED                            |
| F032 | security | P2       | secrets over-exposure in source tree                   | RESOLVED                            |
| F029 | test     | P1       | fetch-data.test.js corrupts tracked `external/raw.csv` | RESOLVED (NOT re-observed this run) |

## Labels applied per contract §4

Category labels used: `security` (F037, F044, F067, F065, F028, F032),
`refactor` (F008, F007, F019), `ci` (F038, F063, F026, F027),
`enhancement` (F018), `chore` (F002, F005, F011, F025, F064), `test` (F029),
`docs` (F017). Priority labels: P0 (F037), P1 (F038, F002, F018, F025, F063,
F067, F065, F028, F029), P2 (F044, F005, F007, F064, F026, F027, F017, F032),
P3 (F011, F019).

## PR handling record (this run)

| PR   | Branch                      | Verdict                                   | Rationale                                                                                                                                                                        |
| ---- | --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #776 | docs/task-088-security-docs | **MERGED** (squash, `b8f75b5`)            | docs (TASK-088 record) + TASK-087 tests; synced with main (prettier fix 3fe2523); full matrix green (lint 0, build pass, 1151 JS 0 fail, 27 py, coverage 97.4/93.43)             |
| #775 | agent                       | **CLOSED** (superseded; branch preserved) | after sync with main the diff was **empty** (all content already merged via #772/#776); TASK-089/TASK-088 fix content push-blocked (workflows permission) — not on remote branch |

## Duplicate-prevention check (contract §2/§4)

No new findings this run — PR #776's coverage/test gains are an improvement
tracked via the +0.1 delta; every candidate surfaced by the direct deterministic
probes was re-matched to existing held/resolved ledger entries. No two open
entries describe the same defect; all retained entries carry exactly one
category + one priority label. PR #775 was not merged (empty diff) — closing it
as superseded avoids a misleading no-op merge record while preserving the
`agent` branch that carries the push-blocked TASK-088/089 work.

## Fail-safe check (contract)

PR #775 was **not** force-merged: its remote diff was empty (all commits already
on main via #772/#776) and `--delete-branch` would have destroyed the carrier
branch for pending TASK-088/089 work — the conservative close-and-preserve
action was chosen and logged (see PR comment #5314891792). No other destructive
actions taken. The repository remains in a clean, buildable, green state (see
`227-audit-report-2026-08-17-231st.md`).
