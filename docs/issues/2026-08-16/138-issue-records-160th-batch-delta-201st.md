# Issue Records — 160th Batch (Delta, 201st verification, 2026-08-16)

**Evaluation Date**: 2026-08-16
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 200th audit matrix on `9ad6f9c`, re-executed fresh this run (see
`137-audit-report-2026-08-16-201st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **189th
consecutive denial**, freshly probed this run). Per the 199-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 5th flat)**, no new findings, no source delta; F037 102nd obs, F038 40d, F002 189th, F005 99/49th, F018 27d (drifted +1), F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 27 py green, coverage 95.57/93.07, pull CI window 10/4/1 with 47th+48th windows SUCCEEDED back-to-back (46th-window `Endpoint is unavailable` re-confirmed infra-class from run log), pytest 27/27 holds

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                                                        | State            |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                                                    | HELD (102nd obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 40 days)                                                                                               | HELD (40 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (189th denial)                                                                                            | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                                                   | HELD             |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (49th flat, held)                                                                                        | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                                           | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (27 days > 7 threshold; drifted 26→27)                                                                                         | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                                            | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                                                        | HELD             |
| F063 | ci          | P1       | pull CI hourly — 10/4/1; 43rd/44th/45th/46th-window failures all infra-class (`Endpoint is unavailable` ×2 + opencode timeout ×2); 47th+48th windows SUCCESS | WATCH            |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                                                        | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24)                                                                                                        | HELD             |

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
`docs` (F017). Priority labels: P0 (F037), P1 (F038, F002, F008, F018, F025,
F063, F028, F067, F029), P2 (F044, F005, F065, F007, F064, F026, F027, F017,
F032), P3 (F011, F019). Exactly one category and one priority per finding.

## Run delta summary (201st vs 200th)

- **Composite**: **70.4 (±0.0)** — fifth consecutive flat run; no source-level
  delta since the 198th run's F008 split.
- **F037**: 101st → **102nd observation** (12 violations, unchanged).
- **F002**: 188th → **189th consecutive denial** (issue creation still blocked).
- **F005**: 99 files, 48th → **49th consecutive flat** (all docs/issues; source
  re-checked 100% prettier-clean including the styles/ modules).
- **F063**: 49th window = this run (in progress). **47th (22:12Z) + 48th
  (23:13Z) windows SUCCEEDED back-to-back** — two consecutive greens after the
  46th-window infra failure. 46th-window failure (31906137151, 20:14Z)
  re-confirmed infra-class from the run log: runner provisioned, then died
  inside the On-Pull prompt echo, exit 1, no partial work.
- **F038**: held at **40 days** (10/10 checkout failures; newest 00:53Z run
  31918283766 also failed at checkout ×3 — `fatal: could not read Username`).
- **F018**: STALE **27 days** (drifted 26→27 — first movement since the 190th).
- **F004**: **59 refs / 10 unique** (57 yml + 2 template) — stable, no drift.
- **F008**: **RESOLVED maintained** — styles.js 41 lines + 11 modules;
  coverage unchanged 95.57/93.07.
- **F029**: NOT re-observed (working tree clean after full suite).
- **Tests**: 1121 JS + 27 Python, 0 fail; coverage 95.57/93.07 — above gate.

## F063 detail (WATCH — 47th+48th window back-to-back success noted)

The last-15 window holds **10 success + 4 failure + 1 in-progress**. The 4
failures (43rd 11:12Z, 44th 13:24Z, 45th 15:12Z, 46th 20:14Z) are all documented
infra-class (two `Endpoint is unavailable`, two opencode timeout exit 124).
The 46th-window log was re-fetched and re-verified this run — runner provisioned,
then died inside the ULW prompt echo, exit 1, no partial work, no PR. **The 47th
(31911545953, 22:12Z, 8m44s) and 48th (31914160622, 23:13Z, 19m11s) windows
SUCCEEDED back-to-back** — first consecutive greens since the 42nd window. Zero
code regressions in any window failure; F063 stays WATCH with no repo-side
action warranted.
