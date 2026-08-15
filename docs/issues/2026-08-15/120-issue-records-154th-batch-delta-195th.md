# Issue Records — 154th Batch (Delta, 195th verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 194th audit matrix on `8b7016e`, re-executed fresh this run (see
`119-audit-report-2026-08-15-195th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **183rd
consecutive denial**, freshly probed this run). Per the 194-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit (audit-only window, no source churn), F005 flat 99 (43rd), F004 stable 59/10, F018 held at 26 days, orchestrator 10/10 HELD (36 days), pull CI 12/2/1 — 44th window failure = opencode timeout exit 124 (infra-class, PR #735 work completed then killed by 90m wrapper), composite 69.73 (−0.02)

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                   | State           |
| ---- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                               | HELD (96th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 36 days)                                                          | HELD (36 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (183rd denial)                                                       | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                              | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (43rd flat, held)                                                   | HELD/FLAT       |
| F008 | refactor    | P2       | src/presenters/styles.js is 1318 lines (maintainability)                                                                | HELD            |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                      | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)                                                       | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                       | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                   | HELD            |
| F063 | ci          | P1       | pull CI hourly — 12/2/1; 43rd-window break (transient infra) + **44th-window opencode timeout (exit 124, infra-class)** | WATCH           |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                   | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                                                                   | HELD            |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                                | State    |
| ---- | -------- | -------- | -------------------------------------------------------------------- | -------- |
| F067 | security | P1       | husky pre-commit gate swallow (`.husky/pre-commit`)                  | RESOLVED |
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

## F063 detail (44th-window failure classification)

Run 31887116708 (13:24Z, on-pull) failed at the `On-Pull` step with **exit 124
— the `timeout -k 1m 90m opencode run /ulw-loop …` wrapper killed the process
at the 90-minute budget**. The run's transcript shows it completed the 194th
window's intended work (created PR #735 `fix: F067 … + 194th verification run
audit records`, pushed `docs/fix-194th-verification-records-F067`) before the
wrapper terminated it. Classified infra-class (opencode runtime timeout), NOT a
code regression. F063 remains a WATCH item with no repo-side action required —
consistent with the established self-recovery pattern.
