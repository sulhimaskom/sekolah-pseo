# Issue Records — 165th Batch (Delta, 206th verification, 2026-08-16)

**Evaluation Date**: 2026-08-16
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 205th audit matrix on `6dc0780`, re-executed fresh this run (see
`152-audit-report-2026-08-16-206th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **194th
consecutive denial**, freshly probed this run). Per the 204-run docs-only
convention, findings are recorded in this ledger. Each entry carries the
mandated category + priority labels (contract §4).

## This run: 0 open PRs / 0 open issues → Phase 1 audit only — composite **70.4 (±0.0, 10th flat)**, no new findings, no source delta; F037 107th obs, F038 42d, F002 194th, F005 99/54th, F018 27d held, F008 RESOLVED maintained (41L + 11 modules), F029 NOT re-observed, 1121 JS + 27 py green, coverage 95.57/93.07, pull CI window 12/2/1 with 47th+48th+49th+50th+51st+52nd+53rd windows SUCCEEDED ×7 back-to-back (54th win in-prog, 45th/46th-window infra failures re-confirmed, 44th rolled off), pytest 13/13 + run_tests 27/27

## Open findings (held)

| ID   | Category    | Priority | Title                                                                                                                                                                                       | State            |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F037 | security    | P0       | Workflow security: 12 violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)                                                                                                                   | HELD (107th obs) |
| F038 | ci          | P1       | Orchestrator workflow fails 10/10 (checkout exit 128, 42 days)                                                                                                                              | HELD (42 days)   |
| F002 | chore       | P1       | GitHub issue creation denied for integration token (194th denial)                                                                                                                           | HELD             |
| F044 | security    | P2       | Over-scoped secrets: 10 unique names / 59 refs across workflows + template                                                                                                                  | HELD             |
| F005 | chore       | P2       | 99 docs/issues ledger files fail `prettier --check` (54th flat, held)                                                                                                                       | HELD/FLAT        |
| F007 | refactor    | P2       | 2045 lines across 6 workflow YAMLs                                                                                                                                                          | HELD             |
| F018 | enhancement | P1       | Data freshness watchdog STALE (27 days > 7 threshold; held at 27)                                                                                                                           | HELD             |
| F025 | chore       | P1       | SITE_URL env placeholder (https://example.com) in generated pages                                                                                                                           | HELD             |
| F064 | chore       | P2       | `.nvmrc` 22 vs runtime node 20 vs CI node 20 (lint-staged EBADENGINE)                                                                                                                       | HELD             |
| F063 | ci          | P1       | pull CI hourly — 12/2/1; 45th/46th-window failures all infra-class (`opencode timeout` + `Endpoint is unavailable`, 44th rolled off); 47th+48th+49th+50th+51st+52nd+53rd windows SUCCESS ×7 | WATCH            |
| F011 | chore       | P3       | 0 git tags — no release/rollback path                                                                                                                                                       | HELD             |
| F019 | refactor    | P3       | run_tests.py duplicate imports (lines 12–18 vs 20–24: sys/json/time/traceback/argparse/typing)                                                                                              | HELD             |

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
(git history `86fcf9f..6dc0780` is docs-only, so no new source surface exists):

- **scripts/ scan candidates** (interactive.js:345 `main()` no `.catch()`;
  fetch-data.js:221 EXTERNAL_DATA_DIR shell-metachar gap; check-workflow-security
  .js:117–124 no-op rule; check-freshness.js:57–63 sorted-CSV assumption;
  validate-links.js:76–83 `..` link resolution; enrichment.js:136–138 unbounded
  body) — all **Low**, map to held F014/F021/F034/F045–F049-class latent debt;
  the check-workflow-security no-op rule is F026/F030-class (zero-test + dead
  rule surface).
- **tests/ scan candidates** (run_tests.py silent-skips counted as PASS at 14
  sites; real-timer flake risk in rate-limiter/resilience tests; test_data_
  validation.py conditional skips; run_tests.py dead code 507–511) — map to
  held F014/F030/F019-class testability debt; ETL-skip redundancy with etl-run
  .test.js is a partial mitigation of the held F014 basis, not a new issue.
- **docs/ scan candidates** (SECURITY.md:77 vs 94 internal contradiction;
  stale test metrics testing.md:228–230 "31 files/1030 cases" vs actual 33
  files/1121 tests; roadmap.md:19 "902+ tests") — map to held F017-class docs
  drift; all **Low**.
- **src/ scan candidates** (dead client-side escapeHtml homepage.js:342–346;
  unvalidated URL scheme school-page.js:57; manifest error-isolation gap
  BuildOrchestrator.js:519; broken provinceSlug fallback homepage.js:391) —
  map to held F021/F034/F045–F049/F014-class latent debt.

No duplicate issues created. Per the 203-run docs-only convention, candidates
remain latent (priced into held criteria bases) until a source-level window
opens.
