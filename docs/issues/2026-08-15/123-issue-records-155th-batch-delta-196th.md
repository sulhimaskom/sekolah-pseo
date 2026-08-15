# Issue Records — 155th Batch (Delta, 196th verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 195th audit matrix on `0bcf204`, re-executed fresh this run (see
`122-audit-report-2026-08-15-196th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **184th
consecutive denial**, freshly probed this run). Per the 195-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit (audit-only window, no source churn), **F008 ESCALATED P2→P1 (styles.js 1318→1576, +258 from FEAT-005)**, F005 flat 99 (44th), F004 stable 59/10, F018 held at 26 days, orchestrator 10/10 HELD (37 days), pull CI 11/3/1 — **45th-window failure = opencode timeout exit 124 (infra-class, PR #736 work completed then killed by 90m wrapper)**, composite 69.65 (−0.08), F029 NOT re-observed

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                        | State           |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                    | HELD (97th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 37 days)                                               | HELD (37 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (184th denial)                                            | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                   | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (44th flat, held)                                        | HELD/FLAT       |
| F008 | refactor    | **P1**   | **src/presenters/styles.js 1576 lines — GREW +258 (1318→1576) from FEAT-005 (ESCALATED)**                    | **WORSENED**    |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                           | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)                                            | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                            | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                        | HELD            |
| F063 | ci          | P1       | pull CI hourly — 11/3/1; 43rd-window infra + 44th + **45th-window opencode timeout (exit 124, infra-class)** | WATCH           |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                        | HELD            |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                                                        | HELD            |

## Maintained RESOLVED (re-verified this run)

| ID   | Category | Priority | Title                                                           | State                               |
| ---- | -------- | -------- | --------------------------------------------------------------- | ----------------------------------- |
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
`docs` (F017). Priority labels: P0 (F037), P1 (F038, F002, F008, F018, F025,
F063, F028, F067, F029), P2 (F044, F005, F065, F007, F064, F026, F027, F017,
F032), P3 (F011, F019). Exactly one category and one priority per finding.

## F008 escalation detail (new this run)

`src/presenters/styles.js` grew **1318 → 1576 lines** (+258, +20%) with the
FEAT-005 comparison feature styles (tray, comparison table, responsive
breakpoints, dark-mode overrides). This is the first tracked growth of F008
since the 42nd-run baseline (1296 lines at 2026-08-04). Every shipped feature
is adding to this single CSS-generator module — maintainability debt compounds
per-feature. Escalated **P2 → P1**. Recommended hardening (Phase 2, dedicated
window): split `styles.js` into per-component style modules (shared/header/
homepage/school-page/comparison) following the `src/presenters/templates/shared/`
pattern. Source-writable, no workflow write needed — **the only unblocked
source-level P1 candidate**; deferred this run per minimal/atomic rule.

## F063 detail (45th-window failure classification)

Run 31892084637 (15:12Z, on-pull) failed at the `On-Pull` step with **exit 124
— the `timeout -k 1m 90m opencode run /ulw-loop …` wrapper killed the process
at the 90-minute budget**. The run's transcript shows it completed the 195th
window's intended work (created and merged PR #736 `feat: FEAT-005 … + 195th
verification run audit records` at 15:13:59Z) before the wrapper terminated it.
Classified infra-class (opencode runtime timeout), NOT a code regression —
identical to the 44th-window pattern. F063 remains a WATCH item with no
repo-side action required.
