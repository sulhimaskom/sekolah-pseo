# Issue Records — 112th Batch (Delta, 153rd verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 152nd audit matrix on `4f478ea`, re-executed fresh this run (see
`08-audit-report-2026-08-13-153rd.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 141st consecutive
denial). Per the 152-run docs-only convention, findings are recorded in this ledger.

## This run: F005 growth continues (+3, 5th consecutive), orchestrator checkout failure holds 6/6

F005 now growing for the **5th consecutive run** (88 → 90 → 93 → 96): each audit
run self-appends ~3 ledger records that `prettier --check .` counts as failures.
All 96 failing files are `docs/issues/`; **0 source files**. The orchestrator
workflow (`GH_TOKEN` checkout) failed **6/6** recent runs (held at 6/6, no
widening) — the daily job has not started since ≥2026-08-08. F004 measured at
57 refs / 10 unique names (stable). Pull schedule improved: 8 success / 1 failure
/ 1 cancelled (vs 7/2/2 at 152nd).

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not accessible
by integration (createIssue)` — HTTP 403, **F002, 141st consecutive denial**. The
integration token (`github-actions[bot]`) lacks `issues: write`. Findings are
therefore recorded in this ledger per the established 152-run convention, and the
FAIL-SAFE rule is satisfied: uncertainty about the token capability was probed, not
guessed.

## Findings ledger (status as of 153rd run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status       | Evidence this run                                                                                                |
| ---- | ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| F005 | docs/P2           | **GROWTH**   | prettier: **96 files** (93→96, +3 — 5th consecutive growth run; all `docs/issues/`, 0 source)                    |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (54th obs)                                                    |
| F038 | security/P0       | HELD         | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (54th); **live checkout failure 6/6**            |
| F063 | ci/P1             | HELD         | pull schedule 1 fail + 1 cancelled / 11 completed (exit 124, improved from 2+2); orchestrator checkout fails 6/6 |
| F002 | ci/P1             | HELD         | `gh issue create` denied (141st)                                                                                 |
| F018 | feature/P1        | HELD         | data STALE 24 days (threshold 7) — flat vs 152nd                                                                 |
| F025 | feature/P1        | HELD         | SITE_URL placeholder `https://example.com` re-observed live                                                      |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; eslint EBADENGINE (needs node ≥22.22.1)                             |
| F004 | security/P2       | HELD         | **57 `secrets.*` refs / 10 unique names** (stable; incl. 3× GH_TOKEN absent from Actions env)                    |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                                                                 |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                                                              |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                                                             |
| F019 | refactor/P3       | HELD         | tests/run_tests.py dup imports + dead block after return                                                         |
| F014 | test/P1           | NOT OBSERVED | 10th consecutive clean run — 1104/1100/0/4-skip                                                                  |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                          |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------- |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                           |
| F026 | bug/P2            | `formatBytes` guard `!Number.isFinite(bytes)` verified at source: build-performance.js:186–204 |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences)                                           |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                                  |
| F032 | feature/P2        | sitemap lastmod derived from data `updated_at` (source re-verified)                            |

## Operational confirmation — orchestrator checkout failure held at 6/6 (F038 live)

- **File**: `.github/workflows/orchestrator.yml` (2× `secrets.GH_TOKEN`)
- **Live failure**: `gh run list --workflow=orchestrator.yml` — **6/6 most recent
  runs FAILED** (2026-08-08 through 2026-08-13, daily 01:0x schedule) — held at
  6/6 vs 152nd (was 5/5 → 6/6 at 152nd; no further widening)
- **Root cause**: checkout references `secrets.GH_TOKEN`; the Actions runtime only
  provides `secrets.GITHUB_TOKEN` → `fatal: could not read Username` exit 128
- **Impact**: the daily orchestrator job has not successfully started for ≥6 days;
  its agent work (incl. the 00–11 flow steps) never runs
- **Fix**: `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (both occurrences) — part of
  the F037/F038 resolution batch (blocked by F050, token lacks `workflows: write`)

## Positive delta this run

Pull schedule improved for the second consecutive run: **8 success / 1 failure /
1 cancelled** (vs 7/2/2 at 152nd, 6/3/2 at 151st). The exit-124 agent-loop
timeouts are trending down but not eliminated (F063 remains HELD).

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
   **Unblocks the live 6/6 orchestrator checkout failure.**
2. **F063** — ci/P1: revisit on-pull.yml agent timeout/queue; the exit-124s track
   the agent loop spinning inside `timeout -k 1m 90m`. Improved again this run
   (2+2 → 1+1) but not resolved.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs). Now growing +3/run — deferral compounds.
4. **F064** — chore/P2: align `.nvmrc`/CI node with eslint's `>=22.22.1` engine
   requirement (EBADENGINE persists).

## Domain score impact

A. Code Quality 77.8 → **77.7** (−0.1) on Consistency (F005 93→96, 5th growth run).
Composite **69.3** (flat vs 152nd). B/C/D unchanged. Orchestrator 6/6 checkout
failure and pull schedule 2+2→1+1 improvement net to zero on CI/CD Health (44).
