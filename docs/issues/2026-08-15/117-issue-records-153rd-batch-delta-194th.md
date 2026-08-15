# Issue Records — 153rd Batch (Delta, 194th verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 193rd audit matrix on `3823d7b`, re-executed fresh this run (see
`116-audit-report-2026-08-15-194th.md`), plus the F067 husky gate source fix
(Phase 2).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **182nd
consecutive denial**, freshly probed this run). Per the 193-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit + **F067 husky gate swallow FIXED** (Phase 2 execution), orchestrator 10/10 HELD (35 days), pull CI 13/1/1 — **clean streak broke at 43rd window on transient infra failure**, F005 flat 99 (42nd), F004 stable 59/10, F018 held at 26 days, composite 69.75 (+0.10)

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                               | State           |
| ---- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                           | HELD (95th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 35 days)                                                                      | HELD (35 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (182nd denial)                                                                   | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                          | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (42nd flat, held)                                                               | HELD/FLAT       |
| F008 | refactor    | P2       | src/presenters/styles.js is 1318 lines (maintainability)                                                                            | HELD            |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                  | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)                                                                   | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                   | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                               | HELD            |
| F063 | ci          | P1       | pull CI hourly — 13/1/1; **clean streak broke at 43rd window** (11:12Z transient `Endpoint is unavailable` infra failure, not code) | WATCH           |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                               | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                                                                               | HELD            |
| F067 | chore       | P1       | husky pre-commit gate swallow — **FIXED this run** (see RESOLVED)                                                                   | → RESOLVED      |

## RESOLVED this run

| ID   | Category | Priority | Title                                               | State    |
| ---- | -------- | -------- | --------------------------------------------------- | -------- |
| F067 | security | P1       | husky pre-commit gate swallow (`.husky/pre-commit`) | RESOLVED |

F067 resolution: the pre-commit gate previously ran
`node scripts/check-workflow-security.js 2>/dev/null || echo "… skipped"` —
the `|| echo` swallowed the check's exit code, so a workflow-security
regression could never block a commit and the message misreported the check as
"skipped". The rewritten gate runs the check in `--json` mode inside an `if
output=$(…)` guard (safe under `sh -e`, husky's invocation), parses
`totalViolations`, blocks the commit only when the count exceeds the documented
baseline (12, held finding F037), reports the count otherwise, and fails open
on parse errors. Verified: 4/4 scenarios under `sh -e` (12 non-blocking, 13
BLOCKS, 0 non-blocking, garbage non-blocking), `sh -n` OK, `shellcheck -e
SC2148` clean (SC2148 pre-existing — no shebang by design), full matrix green
after fix.

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                                | State    |
| ---- | -------- | -------- | -------------------------------------------------------------------- | -------- |
| F065 | security | P2       | config validatePath sibling-prefix escape (40/40 tests, probes held) | RESOLVED |
| F026 | ci       | P2       | workflow YAML security rules (check-workflow-security)               | RESOLVED |
| F027 | ci       | P2       | CI check attribution for docs PRs                                    | RESOLVED |
| F017 | docs     | P2       | stale docs drift (setup/api)                                         | RESOLVED |
| F028 | security | P1       | dependency vulnerabilities (npm audit 0)                             | RESOLVED |
| F032 | security | P2       | secrets over-exposure in source tree                                 | RESOLVED |

## Labels applied per contract §4

Category labels used: `security` (F037, F044, F067, F065, F028, F032), `ci`
(F038, F063, F026, F027), `enhancement` (F018), `chore` (F002, F005, F011,
F025, F064), `refactor` (F008, F007, F019), `docs` (F017). Priority labels: P0
(F037), P1 (F038, F002, F018, F025, F063, F028, F067), P2 (F044, F005, F008,
F065, F007, F064, F026, F027, F017, F032), P3 (F011, F019). Exactly one
category and one priority per finding.
