# Issue Records — 116th Batch (Delta, 157th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 156th audit matrix on `78b234a`, re-executed fresh this run (see
`20-audit-report-2026-08-13-157th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **145th
consecutive denial**, freshly probed this run). Per the 156-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: orchestrator 9/9 held (10 days), pull CI best held 11/1/0 (6th), F005 flat 96 (5th), F004 stable 59/10, pytest gap resolved

A flat verification run: composite held at **69.35** (±0.0 vs 156th). F038 held
at 9/9 (first non-widening reading after 6/6→8/8→9/9 growth); pull schedule CI
held at its best (11 success / 1 in-progress / 0 failures, 6th consecutive
zero-failure window). F004's 155th→156th "drift" is resolved as a counting-window
artifact (template.md inclusion: 57 YAML refs + 2 template refs = 59 total) and
held this run. F005 flat at 96 (5th consecutive). The pytest env gap from the
156th run is closed (13/13 via pytest). Three parallel explore subagents
delivered a source-surface deep audit surfacing new latent findings (F065–F067
class) — recorded as candidates; no code changes made (read-only Phase 1).

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not
accessible by integration (createIssue)` — HTTP 403, **F002, 145th consecutive
denial**. The integration token (`github-actions[bot]`) lacks `issues: write`.
Findings are therefore recorded in this ledger per the established 156-run
convention, and the FAIL-SAFE rule is satisfied: uncertainty about the token
capability was probed, not guessed.

## Findings ledger (status as of 157th run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status   | Evidence this run                                                                                                     |
| ---- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| F005 | docs/P2           | **FLAT** | prettier: **96 files**, all `docs/issues/`, 0 source — fifth consecutive flat reading                                 |
| F037 | security/P0       | HELD     | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (58th obs)                                                         |
| F038 | security/P0       | HELD     | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (58th); **live checkout failure 9/9** (10 days, held) |
| F063 | ci/P1             | HELD(±)  | pull schedule **11 success / 1 in-progress / 0 failures** (best held; 6th zero-failure window)                        |
| F002 | ci/P1             | HELD     | `gh issue create` denied (145th)                                                                                      |
| F018 | feature/P1        | HELD     | data STALE 24 days (threshold 7) — flat vs 156th                                                                      |
| F025 | feature/P1        | HELD     | SITE_URL placeholder `https://example.com` re-observed live                                                           |
| F064 | chore/P2          | HELD     | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; EBADENGINE = lint-staged@17.3.0 (≥22.22.1) re-confirmed                  |
| F004 | security/P2       | HELD     | **57 YAML + 2 template.md = 59 `secrets.*` refs / 10 unique names** (stable — counting artifact resolved)             |
| F007 | refactor/P2       | HELD     | 2045 lines across workflow YAMLs                                                                                      |
| F008 | refactor/P2       | HELD     | src/presenters/styles.js 1318 lines                                                                                   |
| F011 | release/P2        | HELD     | 0 tags — no release process                                                                                           |
| F019 | refactor/P3       | HELD     | tests/run_tests.py duplicate import block (lines 12–18 vs 19–25) — cosmetic class, contract-deferred                  |

### Maintained RESOLVED (re-verified this run)

| ID   | Category/Priority | Status   | Evidence this run                                                               |
| ---- | ----------------- | -------- | ------------------------------------------------------------------------------- |
| F027 | ci/P1             | RESOLVED | quality-gate contract holds (lint 0/0, prettier check gate, coverage gates met) |
| F028 | security/P1       | RESOLVED | `npm audit` 0 vulnerabilities                                                   |
| F032 | chore/P2          | RESOLVED | data-derived lastmod (build manifest re-verified)                               |
| F026 | ci/P2             | RESOLVED | reporter consolidation (no regression observed)                                 |
| F017 | docs/P2           | RESOLVED | doc-accuracy ledger entries remain consistent                                   |

### NEW candidates this run (from 3-parallel source-surface deep audit; no code change — Phase 1 read-only)

| ID   | Category/Priority | Status    | Evidence (file:line)                                                                                              |
| ---- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| F065 | bug/P2            | CANDIDATE | homepage.js:387 — fallback renders `/provinsi/undefined/` (`school.provinceSlug` absent from flat search payload) |
| F065 | security/P2       | CANDIDATE | config.js:18-23 — `validatePath` `startsWith(base)` w/o separator: sibling-dir bypass (`/repo-evil` accepted)     |
| F066 | refactor/P3       | CANDIDATE | resilience.js:249 unreachable `throw lastError`; L359-364 `CircuitBreaker.reset()` emits `from: CLOSED→CLOSED`    |
| F066 | bug/P3            | CANDIDATE | build-performance.js:352-367 — `monitorBuild` finally-throw masks original build error                            |
| F067 | chore/P2          | CANDIDATE | **no `.env` loader exists** — `docs/setup.md:65` `cp .env.example .env` has no effect; 5 code-used vars missing   |
| F067 | ci/P1             | CANDIDATE | `.husky/pre-commit` — `node scripts/check-workflow-security.js 2>/dev/null \|\| echo skipped` swallows the gate   |
| F067 | docs/P2           | CANDIDATE | README claims on-push/on-pull quality gates (lint+format+build+test) that do not exist as workflow steps          |
| F067 | docs/P2           | CANDIDATE | `docs/release.md` references `.github/workflows/release.yml` — file does not exist                                |
| F067 | test/P3           | CANDIDATE | untested: `head-meta.js`, `ExportService.js`, `SearchDataService.js`, `check-workflow-security.js`                |
| F067 | docs/P3           | CANDIDATE | dependabot.yml comment claims `groups:` config; key absent                                                        |

## Log

| Timestamp (UTC) | Action               | Target                                                | Result                                                                                    |
| --------------- | -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 12:54           | Phase 0 probe        | gh pr list / gh issue list                            | 0 open PRs / 0 open issues → EMPTY → Phase 1                                              |
| 12:54           | surface mapping      | 3 parallel explore agents (src / tests-CI / docs)     | line-referenced inventories; F065–F067 candidates surfaced                                |
| 12:55           | npm install + lint   | package.json, eslint                                  | exit 0; 0 vulns; 0 errors / 0 warnings; lint-staged EBADENGINE                            |
| 12:55           | build                | npm run build                                         | PASS (2 pages, 0 failed, 30ms, budgets met)                                               |
| 12:55           | tests + coverage     | test:js, coverage, run_tests.py, pytest               | 1104/1100/0/4-skip; gates met; 27/27 py; **13/13 pytest (gap resolved)**                  |
| 12:56           | security + freshness | check-workflow-security, npm audit, check-freshness   | 12 violations (F037/F038, 58th obs); 0 vulns; STALE 24d (F018)                            |
| 12:56           | live probes          | gh run list (on-pull + orchestrator), gh issue create | F063 11/1/0 best held (6th); orchestrator exit 128 **9/9** (held, 10d); F002 145th denial |
| 12:57           | measurement re-count | prettier, secrets, lines, tags                        | F005 96 flat (5th); F004 59/10 stable; F007 2045; F008 1318; F011 0 tags                  |
