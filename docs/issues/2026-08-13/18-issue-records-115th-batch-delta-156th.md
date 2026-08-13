# Issue Records — 115th Batch (Delta, 156th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 155th audit matrix on `f8630e9`, re-executed fresh this run (see
`17-audit-report-2026-08-13-156th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **144th
consecutive denial**, freshly probed this run). Per the 155-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: orchestrator checkout widens to 9/9 (F038 live), pull CI best held 11/1/0, F005 flat at 96 (4th), F004 drifts 57→59

Two opposing CI movements persist, net −1 on D/CI-CD Health. The orchestrator
workflow (`secrets.GH_TOKEN` at checkout) has now failed **9 consecutive daily
runs** — widened from 8/8 (155th) and 6/6 (154th); fresh log evidence confirms
`GH_TOKEN: ***` → `could not read Username` → exit 128 at `actions/checkout@v7`.
The pull schedule held its best reading at **11 success / 1 cancelled / 0
failures** (5th consecutive zero-failure window). F005 held **flat at 96** (all
`docs/issues/`, 0 source) — fourth consecutive flat reading. F004 **drifted 57 →
59** `secrets.*` refs (10 unique names unchanged — additive reference growth,
F044 surface widening). F019 re-confirmed at source (duplicate import block in
`tests/run_tests.py` lines 12–18 vs 19–25). pytest was unavailable in this
runner env (`No module named pytest`) — an environment gap, not a repo defect; CI
uses `run_tests.py` and is unaffected.

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not
accessible by integration (createIssue)` — HTTP 403, **F002, 144th consecutive
denial**. The integration token (`github-actions[bot]`) lacks `issues: write`.
Findings are therefore recorded in this ledger per the established 155-run
convention, and the FAIL-SAFE rule is satisfied: uncertainty about the token
capability was probed, not guessed.

## Findings ledger (status as of 156th run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status   | Evidence this run                                                                                         |
| ---- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| F005 | docs/P2           | **FLAT** | prettier: **96 files**, all `docs/issues/`, 0 source — fourth consecutive flat reading                    |
| F037 | security/P0       | HELD     | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (57th obs)                                             |
| F038 | security/P0       | HELD(+)  | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (57th); **live checkout failure 9/9**     |
| F063 | ci/P1             | HELD(±)  | pull schedule **11 success / 1 cancelled / 0 failures** (best held; 5th zero-failure window)              |
| F002 | ci/P1             | HELD     | `gh issue create` denied (144th)                                                                          |
| F018 | feature/P1        | HELD     | data STALE 24 days (threshold 7) — flat vs 155th                                                          |
| F025 | feature/P1        | HELD     | SITE_URL placeholder `https://example.com` re-observed live                                               |
| F064 | chore/P2          | HELD     | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; EBADENGINE = lint-staged@17.3.0 (≥22.22.1) re-confirmed      |
| F004 | security/P2       | HELD(+)  | **59 `secrets.*` refs / 10 unique names** (DRIFTED +2 from 57; incl. 3× GH_TOKEN absent from Actions env) |
| F007 | refactor/P2       | HELD     | 2045 lines across workflow YAMLs                                                                          |
| F008 | refactor/P2       | HELD     | src/presenters/styles.js 1318 lines                                                                       |
| F011 | release/P2        | HELD     | 0 tags — no release process                                                                               |
| F019 | refactor/P3       | HELD     | tests/run_tests.py duplicate import block (lines 12–18 vs 19–25) — cosmetic class, contract-deferred      |

### Maintained RESOLVED (re-verified this run)

| ID   | Category/Priority | Status   | Evidence this run                                                               |
| ---- | ----------------- | -------- | ------------------------------------------------------------------------------- |
| F027 | ci/P1             | RESOLVED | quality-gate contract holds (lint 0/0, prettier check gate, coverage gates met) |
| F028 | security/P1       | RESOLVED | `npm audit` 0 vulnerabilities                                                   |
| F032 | chore/P2          | RESOLVED | data-derived lastmod (build manifest re-verified)                               |
| F026 | ci/P2             | RESOLVED | reporter consolidation (no regression observed)                                 |
| F017 | docs/P2           | RESOLVED | doc-accuracy ledger entries remain consistent                                   |

## Log

| Timestamp (UTC) | Action               | Target                                                | Result                                                                  |
| --------------- | -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| 11:44           | Phase 0 probe        | gh pr list / gh issue list                            | 0 open PRs / 0 open issues → EMPTY → Phase 1                            |
| 11:45           | npm ci + lint        | package.json, eslint                                  | exit 0; 0 vulns; 0 errors / 0 warnings; lint-staged EBADENGINE          |
| 11:45           | build                | npm run build                                         | PASS (2 pages, 0 failed, budgets met)                                   |
| 11:45           | tests + coverage     | test:js, coverage, run_tests.py                       | 1104/1100/0/4-skip; gates met; 27/27 py                                 |
| 11:45           | security + freshness | check-workflow-security, npm audit, check-freshness   | 12 violations (F037/F038, 57th obs); 0 vulns; STALE 24d (F018)          |
| 11:45           | live probes          | gh run list (on-pull + orchestrator), gh issue create | F063 11/1/0 best held; orchestrator exit 128 **9/9**; F002 144th denial |
| 11:46           | measurement re-count | prettier, secrets, lines, tags                        | F005 96 flat (4th); F004 59/10 (+2); F007 2045; F008 1318; F011 0 tags  |
