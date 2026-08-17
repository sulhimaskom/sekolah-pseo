# Issue Records — 192nd Batch (Delta, 233rd verification, 2026-08-17)

**Evaluation Date**: 2026-08-17
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 233rd audit matrix on `0540dee` (see
`233-audit-report-2026-08-17-233rd.md`).
**Convention**: GitHub issue creation is denied for this integration token
(F002 — `GraphQL: Resource not accessible by integration (createIssue)`,
**221st consecutive denial**, freshly probed this run). Per the 221-run
docs-only convention, findings are recorded in this ledger. Each entry carries
the mandated category + priority labels (contract §4).

## This run: Phase 0 probe → 1 open PR (#780) → PR HANDLER MODE (merged #780

and #781 after conflict resolution) → re-probe 0 PRs / 0 issues → Phase 1
audit — composite **70.8 (+0.2)**; first source delta since 229th (PR #781
src/core extraction); JS suite grew **+83 → 1234 pass** (0 fail, 4 skipped),
coverage **97.39/93.44** (PR-claimed baseline matched exactly), F037 134th obs,
F038 51d (8/8), F002 221st, F005 103/81st flat, F018 28d held, F008 RESOLVED
maintained, pytest 13/13 + 27/27 holds, pull CI **9/0/1 zero-failure maintained**
(101st win in-prog at 12:40Z), F063 IMPROVING, 192nd batch delta

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                              | State            |
| ---- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                          | HELD (134th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 8/8 (checkout exit 128, 51 days)                                                                       | HELD (51 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (221st denial)                                                                  | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                         | HELD             |
| F005 | chore       | P2       | 103 docs/issues ledger files fail `prettier --check` (81st flat, held)                                                             | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                 | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (28 days > 7 threshold; **held at 28d this run**)                                                    | HELD (28 days)   |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                  | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE re-confirmed: requires `>=22.22.1`)                           | HELD             |
| F063 | ci          | P1       | pull CI hourly — **9/0/1, zero-failure window maintained**; 12:40Z in-progress = 101st win; F038 remains the structural CI failure | IMPROVING        |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                              | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–25)                                                                              | HELD             |

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

## Duplicate-prevention check (contract §2/§4)

No new findings this run — every candidate surfaced by the direct
deterministic probes was re-matched to existing held/resolved ledger entries.
No two open entries describe the same defect; all retained entries carry
exactly one category + one priority label. The branch-coverage ±0.02
fluctuation (93.44 vs 93.42 at 232nd) is measurement variance across a
1311-branch suite, not a defect — no new entry warranted. The TASK-094 src/core
extraction (PR #781) was verified regression-free (1234 pass, coverage held,
build PASS, byte-identical output per PR) and is recorded as a positive
modularity delta at the Code/Modularity criterion, not a new finding.

## Fail-safe check (contract)

Both PRs merged with full verification (build PASS, lint 0/0, JS 1234 pass,
Python 27/27 + 13/13, coverage 97.39/93.44, Prettier clean, 0 vulns) and were
synced to `main` before merging (PR #781 had a genuine conflict on
README.md/task.md resolved deterministically — agent's src/core removal of
slugify/utils from `scripts/` kept, main's test-helpers.js addition kept; both
TASK-094 entries preserved in task.md). TASK-088's workflow fixes were verified
NOT to be on the merged branch (never pushed — token lacks `workflows`
permission, the documented F050 blocker); no work lost. Working tree left clean
after the full command matrix (F029 NOT re-observed). Repository remains in a
clean, buildable, green state (see `233-audit-report-2026-08-17-233rd.md`).
