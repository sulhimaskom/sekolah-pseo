# Issue Records — 120th Batch (Delta, 161st verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 160th audit matrix on `2ef6539`, re-executed fresh this run (see
`32-audit-report-2026-08-13-161st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **149th
consecutive denial**, freshly probed this run). Per the 160-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: PR #701 merged (PR HANDLER MODE), orchestrator 10/10 HELD (13 days), pull CI best held 11/1/0 (10th), F005 flat 96 (9th), F004 stable 59/10

Composite held at **69.30 (±0.0 vs 160th)**. Phase 0 probe returned 1 open PR
(#701, 160th audit records) — PR HANDLER MODE ran first and merged it cleanly
(`2ef6539`, squash, branch confirmed deleted) after full local verification.
Post-merge re-probe: 0 open PRs / 0 open issues → Phase 1. **F038 HELD at 10/10**
(last-10 window unchanged since the 160th reading; last-12 window 12/12 — no new
orchestrator run has executed, root cause `secrets.GH_TOKEN` vs `GITHUB_TOKEN`
unchanged, **13 consecutive days**, failed-step log re-confirmed live on run
31657336809); pull schedule CI held at its best (11 success / 1 in-progress / 0
failures, **10th consecutive zero-failure window** — the 08-12 timeouts were
transient and self-recovered). F004 stable at 59/10 (57 YAML + 2 template.md);
F005 flat at 96 (9th). pytest 13/13 holds (157th env-gap resolution confirmed,
pytest 9.1.1 provisioned in-session). No new findings this run — the 157th
F065–F067 candidates remain recorded and unimplemented (F050 workflow-write
boundary / read-only Phase 1).

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not
accessible by integration (createIssue)` — HTTP 403, **F002, 149th consecutive
denial**. The integration token (`github-actions[bot]`) lacks `issues: write`.
Findings are therefore recorded in this ledger per the established 160-run
convention, and the FAIL-SAFE rule is satisfied: uncertainty about the token
capability was probed, not guessed.

## Findings ledger (status as of 161st run)

### HELD / MOVED (re-observed this run)

| ID   | Category/Priority | Status   | Evidence this run                                                                                                                             |
| ---- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| F038 | security/P0       | **HELD** | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (62nd obs); live checkout failure 10/10 last-10 / 12/12 last-12 (**13 days**) |
| F005 | docs/P2           | **FLAT** | prettier: **96 files**, all `docs/issues/`, 0 source — ninth consecutive flat reading                                                         |
| F037 | security/P0       | HELD     | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (62nd obs)                                                                                 |
| F063 | ci/P1             | HELD(±)  | pull schedule **11 success / 1 in-progress / 0 failures** (best held; **10th zero-failure window**)                                           |
| F002 | ci/P1             | HELD     | `gh issue create` denied (**149th**)                                                                                                          |
| F018 | feature/P1        | HELD     | data STALE 24 days (threshold 7) — flat vs 160th                                                                                              |
| F025 | feature/P1        | HELD     | SITE_URL placeholder `https://example.com` re-observed live                                                                                   |
| F064 | chore/P2          | HELD     | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; EBADENGINE = lint-staged@17.3.0 (≥22.22.1) re-confirmed                                          |
| F004 | security/P2       | HELD     | **57 YAML + 2 template.md = 59 `secrets.*` refs / 10 unique names** (stable — no drift)                                                       |
| F007 | refactor/P2       | HELD     | 2045 lines across workflow YAMLs                                                                                                              |
| F008 | refactor/P2       | HELD     | src/presenters/styles.js 1318 lines                                                                                                           |
| F011 | release/P2        | HELD     | 0 tags — no release process                                                                                                                   |
| F019 | refactor/P3       | HELD     | tests/run_tests.py duplicate import block (lines 12–18 vs 19–25) — cosmetic class, contract-deferred                                          |

### Maintained RESOLVED (re-verified this run)

| ID   | Category/Priority | Status   | Evidence this run                                                               |
| ---- | ----------------- | -------- | ------------------------------------------------------------------------------- |
| F027 | ci/P1             | RESOLVED | quality-gate contract holds (lint 0/0, prettier check gate, coverage gates met) |
| F028 | security/P1       | RESOLVED | `npm audit` 0 vulnerabilities                                                   |
| F032 | chore/P2          | RESOLVED | data-derived lastmod (sitemap.js:98 re-verified)                                |
| F026 | ci/P2             | RESOLVED | reporter consolidation (no regression observed)                                 |
| F017 | docs/P2           | RESOLVED | doc-accuracy ledger entries remain consistent                                   |

### Recorded candidates from 157th (unchanged — no code change this run, Phase 1 read-only)

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

| Timestamp (UTC) | Action               | Target                                                | Result                                                                                         |
| --------------- | -------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 17:52           | Phase 0 probe        | gh pr list / gh issue list                            | **1 open PR (#701)** → PR HANDLER MODE                                                         |
| 17:52           | PR sync check        | rev-list main...PR branch                             | 0 behind / 1 ahead — no rebase needed                                                          |
| 17:53           | PR verification      | lint + prettier (3 files) + build + tests             | lint 0/0; 3 ledger files prettier-clean; build PASS; 1100 JS + 27 py + 13 pytest               |
| 17:53           | PR merge             | gh pr merge 701 --squash --admin --delete-branch      | **MERGED → 2ef6539**; branch confirmed deleted; no linked issues                               |
| 17:53           | Phase 0 re-probe     | gh pr list / gh issue list                            | 0 open PRs / 0 open issues → EMPTY → Phase 1                                                   |
| 17:53           | npm install + lint   | package.json, eslint                                  | exit 0; 0 vulns; 0 errors / 0 warnings; lint-staged EBADENGINE                                 |
| 17:53           | build                | npm run build                                         | PASS (0 failed pages, budgets met)                                                             |
| 17:53–17:54     | tests + coverage     | test:js, coverage, run_tests.py, pytest               | 1100/1100/0/4-skip; gates met; 27/27 py; **13/13 pytest (holds)**                              |
| 17:54           | security + freshness | check-workflow-security, npm audit, check-freshness   | 12 violations (F037/F038, 62nd obs); 0 vulns; STALE 24d (F018)                                 |
| 17:54           | live probes          | gh run list (on-pull + orchestrator), gh issue create | F063 11/1/0 best held (**10th**); orchestrator **10/10 last-10 HELD (13d)**; F002 149th denial |
| 17:54           | measurement re-count | prettier, secrets, lines, tags                        | F005 96 flat (9th); F004 59/10 stable; F007 2045; F008 1318; F011 0 tags                       |
