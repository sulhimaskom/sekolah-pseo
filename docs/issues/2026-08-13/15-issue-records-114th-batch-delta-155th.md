# Issue Records — 114th Batch (Delta, 155th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 154th audit matrix on `daa8f78`, re-executed fresh this run (see
`14-audit-report-2026-08-13-155th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, **143rd
consecutive denial**, freshly probed this run). Per the 154-run docs-only
convention, findings are recorded in this ledger. Each entry carries the mandated
category + priority labels (contract §4).

## This run: orchestrator checkout widens to 8/8 (F038 live), pull CI new best 11/1/0, F005 flat at 96

Two opposing CI movements, net zero on D/CI-CD Health. The orchestrator workflow
(`secrets.GH_TOKEN` at checkout) has now failed **8 consecutive daily runs** —
widened from 6/6 at the 154th. The pull schedule self-improved again to **11
success / 1 cancelled / 0 failures** (fourth consecutive zero-failure window).
F005 held **flat at 96** (all `docs/issues/`, 0 source) — third consecutive flat
reading. F019 re-confirmed at source (duplicate import block in
`tests/run_tests.py` lines 12–18 vs 19–25). pytest was unavailable in this
runner env (`No module named pytest`) — an environment gap, not a repo defect; CI
uses `run_tests.py` and is unaffected.

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not
accessible by integration (createIssue)` — HTTP 403, **F002, 143rd consecutive
denial**. The integration token (`github-actions[bot]`) lacks `issues: write`.
Findings are therefore recorded in this ledger per the established 154-run
convention, and the FAIL-SAFE rule is satisfied: uncertainty about the token
capability was probed, not guessed.

## Findings ledger (status as of 155th run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status       | Evidence this run                                                                                     |
| ---- | ----------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| F005 | docs/P2           | **FLAT**     | prettier: **96 files**, all `docs/issues/`, 0 source — third consecutive flat reading                 |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (56th obs)                                         |
| F038 | security/P0       | HELD(+)      | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (56th); **live checkout failure 8/8** |
| F063 | ci/P1             | HELD(+)      | pull schedule **11 success / 1 cancelled / 0 failures** (new best; 4th zero-failure window)           |
| F002 | ci/P1             | HELD         | `gh issue create` denied (143rd)                                                                      |
| F018 | feature/P1        | HELD         | data STALE 24 days (threshold 7) — flat vs 154th                                                      |
| F025 | feature/P1        | HELD         | SITE_URL placeholder `https://example.com` re-observed live                                           |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; EBADENGINE = lint-staged@17.3.0 (≥22.22.1) re-confirmed  |
| F004 | security/P2       | HELD         | **57 `secrets.*` refs / 10 unique names** (stable; incl. 3× GH_TOKEN absent from Actions env)         |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                                                      |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                                                   |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                                                  |
| F019 | refactor/P3       | HELD         | tests/run_tests.py duplicate imports (lines 12–18 vs 19–25) re-confirmed at source                    |
| F014 | test/P1           | NOT OBSERVED | 12th consecutive clean run — 1104/1100/0/4-skip                                                       |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                        |
| ---- | ----------------- | -------------------------------------------------------------------------------------------- |
| F027 | security/P2       | `--json` gate contract re-confirmed (exit 1 with 12-violation payload)                       |
| F026 | bug/P2            | `formatBytes` guard verified at source (build-performance.js:186–204, prior run) — unchanged |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences, prior run)                              |
| F028 | security/P2       | `npm audit` 0 vulnerabilities this run                                                       |
| F032 | feature/P2        | sitemap lastmod derived from data `updated_at` (source re-verified, prior run)               |

## Positive delta this run

1. **Pull schedule new best**: 11 success / 1 cancelled / 0 failures (vs 10/1/0
   at 154th). F063 trending better for the fourth consecutive run.
2. **F005 stable**: flat at 96 for the third consecutive run — no compounding;
   this run's own records are committed prettier-clean to hold parity.
3. **F019 attribution narrowed**: the duplicate block is exactly lines 12–18 vs
   19–25 (`sys/json/time/traceback/argparse/typing`) — a one-block deletion
   candidate once a non-cosmetic window opens.

## Negative delta this run

1. **Orchestrator checkout widened to 8/8** (was 6/6 at 154th): the daily
   orchestrator job has not started for ≥8 days. Fix remains the two-line
   `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` change, blocked by F050 (token
   lacks `workflows: write`).

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
   **Unblocks the live 8/8 orchestrator checkout failure.**
2. **F063** — ci/P1: orchestrator remains the sole failing CI surface (8/8
   checkout); pull schedule self-improved to 11/1/0 without intervention. Watch
   next run whether the zero-failure window persists.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs). Count flat at 96; this run's records are
   committed prettier-clean to hold parity.
4. **F064** — chore/P2: align `.nvmrc`/CI node with lint-staged's `>=22.22.1`
   engine requirement (EBADENGINE persists; attribution corrected at 154th).

## Domain score impact

A. Code Quality 77.8 → **77.8** (±0.0). B. System Quality 72.9 → **72.9** (±0.0).
C. Experience Quality 77.0 → **77.0** (±0.0). D. Delivery & Evolution 49.9 →
**49.9** (±0.0; pull +2 offset by orchestrator −2). Composite **69.4** (±0.0 vs
154th). Orchestrator 8/8 checkout failure still prices into CI/CD Health and is
the single most material open item alongside the F037/F038 security cluster.
