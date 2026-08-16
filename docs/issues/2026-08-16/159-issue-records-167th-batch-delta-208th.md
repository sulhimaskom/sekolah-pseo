# Issue Records — 167th Batch (Delta, 208th verification, 2026-08-16)

**Evaluation Date**: 2026-08-16
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 207th audit matrix on `22bcc2a`, re-executed fresh this run (see
`158-audit-report-2026-08-16-208th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **196th
consecutive denial**, freshly probed this run). Per the 204-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 12th flat)**, no new findings, no source delta; F037 109th obs, F038 42d, F002 196th, F005 99/56th, F018 27d held, F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 27 py green, coverage 95.57/93.08, pull CI window 13/1/1 with 47th+48th+49th+50th+51st+52nd+53rd+54th+55th windows SUCCESS ×9 back-to-back (56th win in-prog, 46th-window infra failure re-confirmed, 45th rolled off), pytest 13/13 + run_tests 27/27

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                                                                  | State            |
| ---- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                                                              | HELD (109th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 42 days)                                                                                                         | HELD (42 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (196th denial)                                                                                                      | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                                                             | HELD             |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (56th flat, held)                                                                                                  | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                                                     | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (27 days > 7 threshold; held at 27)                                                                                                      | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                                                      | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                                                                  | HELD             |
| F063 | ci          | P1       | pull CI hourly — 13/1/1; 46th-window failure infra-class (`Endpoint is unavailable`, 45th rolled off); 47th+48th+49th+50th+51st+52nd+53rd+54th+55th windows SUCCESS ×9 | WATCH            |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                                                                  | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 13–18 vs 20–24)                                                                                                                  | HELD             |

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

No new findings this run — every candidate surfaced by the 203rd-run parallel
deep scans was re-matched to existing held/resolved ledger entries this window
(git history `9e86766..22bcc2a` is docs-only, so no new source surface exists):
duplication clusters → F019/F048; workflow security → F037/F044; testability
gaps → F030/F014; docs drift → F005/F017. No two open entries describe the same
defect; all retained entries carry exactly one category + one priority label.

## Fail-safe check (contract)

No destructive actions taken this run. No files, branches, or docs deleted. All
probes were read-only (`gh issue create` probe is the sole write-side probe, and
it is denied by token scope before any mutation — F002). The repository remains
in a clean, buildable, green state (see `158-audit-report-2026-08-16-208th.md`).
