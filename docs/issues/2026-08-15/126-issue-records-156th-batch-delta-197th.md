# Issue Records — 156th Batch (Delta, 197th verification, 2026-08-15)

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 196th audit matrix on `c8ae869`, re-executed fresh this run (see
`125-audit-report-2026-08-15-197th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **185th
consecutive denial**, freshly probed this run). Per the 196-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit (audit-only window, no source churn), **all findings HELD FLAT** — F008 styles.js flat at 1576 (P1, no growth), F005 flat 99 (45th), F004 stable 59/10, F018 held at 26 days, orchestrator 10/10 HELD (38 days), pull CI 11/3/1 (46th window in progress; 3 infra-class failures held), composite 69.65 HELD (±0.00), F029 NOT re-observed

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                        | State           |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                    | HELD (98th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 38 days)                                               | HELD (38 days)  |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (185th denial)                                            | HELD            |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                   | HELD            |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (45th flat, held)                                        | HELD/FLAT       |
| F008 | refactor    | P1       | src/presenters/styles.js 1576 lines — FLAT this run (no growth; P1 from 196th escalation)                    | HELD (FLAT)     |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                           | HELD            |
| F018 | enhancement | P1       | Data freshness watchdog STALE (26 days > 7 threshold; held at 26)                                            | HELD            |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                            | HELD            |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                        | HELD            |
| F063 | ci          | P1       | pull CI hourly — 11/3/1; 43rd-window infra + 44th + 45th-window opencode timeout (exit 124, all infra-class) | WATCH           |
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

## Run delta summary (197th vs 196th)

- **Composite**: 69.65 → 69.65 (**HELD**, ±0.00) — first flat window since the
  195th run.
- **F008**: 1576 lines → 1576 (**FLAT**) — the 196th-run P1 escalation showed no
  further growth; no new feature styles landed this window.
- **F005**: 99 files, 44th → **45th consecutive flat**.
- **F037**: 97th → **98th observation** (12 violations, unchanged).
- **F038**: 37 → **38 days** held (10/10 checkout failures).
- **F002**: 184th → **185th consecutive denial** (issue creation still blocked).
- **F018**: STALE **26 days** (held at 26, no further drift).
- **F063**: pull CI last-15 **11 success + 3 failure + 1 in-progress**; no new
  failure class; 46th window is this run.
- **F004**: **59 refs / 10 unique** (57 yml + 2 template) — stable, no drift.
- **F029**: NOT re-observed (working tree clean after full suite).
- **Tests**: 1121 JS + 27 Python, 0 fail; coverage 95.54/93.01 — held at gate.

## F063 detail (no change)

The 45th-window failure (run 31892084637, 15:12Z) remains classified
infra-class: the `timeout -k 1m 90m opencode run /ulw-loop …` wrapper killed the
process at the 90-minute budget after it had completed and merged PR #736
(15:13:59Z). The 44th window (13:24Z) matched the same pattern. The 43rd window
(11:12Z) was `Endpoint is unavailable` (Actions infrastructure). Zero code
regressions. F063 stays WATCH; no repo-side action warranted.

## F008 note (held flat)

No growth in `src/presenters/styles.js` this window (1576 → 1576). The P1
escalation (styles module split — per-component style modules following the
`src/presenters/templates/shared/` pattern) remains the top unblocked source-level
Phase 2 candidate, queued for a dedicated implementation window per the
minimal/atomic change rule.
