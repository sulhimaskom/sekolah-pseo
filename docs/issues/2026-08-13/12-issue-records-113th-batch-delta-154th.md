# Issue Records — 113th Batch (Delta, 154th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 153rd audit matrix on `b8b3b98`, re-executed fresh this run (see
`11-audit-report-2026-08-13-154th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 142nd consecutive
denial). Per the 153-run docs-only convention, findings are recorded in this ledger.

## This run: F005 growth narrative corrected to FLAT (96), pull CI first zero-failure window, orchestrator 6/6 held

F005 is **flat at 96 files** — not growing. Two facts reconcile the count: (a) the
153rd's own 3 records (`08`/`09`/`10`) were prettier-cleaned by PR #694 this
session, and (b) the 152nd-era baseline at `4f478ea` re-measures at 96 under the
lockfile-pinned prettier 3.9.6 (identical 96-file list), not the 93 the 152nd
report claimed. The 153rd's "+3 growth" (93→96) was partly a measurement/version
artifact; the ledger's self-referential additions are now held at parity by
formatting fixes (this run's own records are committed prettier-clean). Pull
schedule CI improved to **10 success / 1 cancelled / 0 failures** — first
zero-failure window (F063 trending better, 8/1/1 → 10/1/0). Orchestrator checkout
failure holds **6/6** (GH_TOKEN, exit 128). EBADENGINE attribution corrected:
**lint-staged@17.3.0** requires node ≥22.22.1 (not eslint — its engine
`^20.19.0` accepts v20.20.2).

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not accessible
by integration (createIssue)` — HTTP 403, **F002, 142nd consecutive denial**. The
integration token (`github-actions[bot]`) lacks `issues: write`. Findings are
therefore recorded in this ledger per the established 153-run convention, and the
FAIL-SAFE rule is satisfied: uncertainty about the token capability was probed, not
guessed.

## Findings ledger (status as of 154th run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status       | Evidence this run                                                                                          |
| ---- | ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| F005 | docs/P2           | **FLAT**     | prettier: **96 files** (growth narrative corrected; 153rd's 3 records cleaned by #694; all `docs/issues/`) |
| F037 | security/P0       | HELD         | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (55th obs)                                              |
| F038 | security/P0       | HELD         | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (55th); **live checkout failure 6/6**      |
| F063 | ci/P1             | HELD(+       | pull schedule **10 success / 1 cancelled / 0 failures** (best reading, first zero-failure window)          |
| F002 | ci/P1             | HELD         | `gh issue create` denied (142nd)                                                                           |
| F018 | feature/P1        | HELD         | data STALE 24 days (threshold 7) — flat vs 153rd                                                           |
| F025 | feature/P1        | HELD         | SITE_URL placeholder `https://example.com` re-observed live                                                |
| F064 | chore/P2          | HELD         | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; **EBADENGINE = lint-staged@17.3.0 (≥22.22.1), not eslint**    |
| F004 | security/P2       | HELD         | **57 `secrets.*` refs / 10 unique names** (stable; incl. 3× GH_TOKEN absent from Actions env)              |
| F007 | refactor/P2       | HELD         | 2045 lines across workflow YAMLs                                                                           |
| F008 | refactor/P2       | HELD         | src/presenters/styles.js 1318 lines                                                                        |
| F011 | chore/P3          | HELD         | 0 tags — no releases                                                                                       |
| F019 | refactor/P3       | HELD         | tests/run_tests.py dup imports + dead block after return                                                   |
| F014 | test/P1           | NOT OBSERVED | 11th consecutive clean run — 1104/1100/0/4-skip                                                            |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                          |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------- |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                           |
| F026 | bug/P2            | `formatBytes` guard `!Number.isFinite(bytes)` verified at source: build-performance.js:186–204 |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences)                                           |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                                  |
| F032 | feature/P2        | sitemap lastmod derived from data `updated_at` (source re-verified)                            |

## Measurement correction — F005 baseline (153rd → 154th)

- 153rd report claimed: 88 → 90 → 93 → 96, "5th consecutive growth run".
- This run re-measured the **152nd-era HEAD (`4f478ea`)** with the lockfile-pinned
  prettier 3.9.6 (identical `npm ci`): **96 files, identical list** (`comm` on the
  two failing-file lists → empty). The "93" figure from the 152nd run does not
  reproduce under the locked toolchain — likely a prettier version difference in
  that earlier runner environment.
- Combined with PR #694's formatting fix (3 files cleaned), the honest statement
  is: **F005 count is flat at 96; the growth narrative was inflated by measurement
  drift.** Future runs: measure with the lockfile-pinned prettier 3.9.6 and report
  `npx prettier --version` alongside the count.

## Operational confirmation — orchestrator checkout failure held at 6/6 (F038 live)

- **File**: `.github/workflows/orchestrator.yml` (2× `secrets.GH_TOKEN`)
- **Live failure**: `gh run list --workflow=orchestrator.yml` — **6/6 most recent
  runs FAILED** (2026-08-08 through 2026-08-13, daily 01:0x schedule) — held at
  6/6 (no widening since 153rd)
- **Root cause**: checkout references `secrets.GH_TOKEN`; the Actions runtime only
  provides `secrets.GITHUB_TOKEN` → `fatal: could not read Username` exit 128
- **Impact**: the daily orchestrator job has not successfully started for ≥6 days;
  its agent work (incl. the 00–11 flow steps) never runs
- **Fix**: `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (both occurrences) — part of
  the F037/F038 resolution batch (blocked by F050, token lacks `workflows: write`)

## Positive delta this run

1. **Pull schedule first zero-failure window**: 10 success / 1 cancelled / 0
   failures (vs 8/1/1 at 153rd). The exit-124 agent-loop timeouts are gone from
   the completed window. F063 trending better for the third consecutive run.
2. **F005 narrative corrected** — the count is flat (96), not compounding; the
   153rd's own 3 records were cleaned by PR #694 (style(docs) fix) before merge.
3. **EBADENGINE attribution corrected** — lint-staged@17.3.0 is the package
   requiring node ≥22.22.1; eslint 10.8.0's engine (`^20.19.0`) accepts the
   runtime. Removes a false finding surface from F064.

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
   **Unblocks the live 6/6 orchestrator checkout failure.**
2. **F063** — ci/P1: orchestrator remains the sole failing CI surface (6/6
   checkout); pull schedule self-improved to 10/1/0 without intervention. Watch
   next run whether the zero-failure window persists.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs). Count is flat at 96; this run's records are
   committed prettier-clean to hold parity.
4. **F064** — chore/P2: align `.nvmrc`/CI node with lint-staged's `>=22.22.1`
   engine requirement (EBADENGINE persists, attribution now corrected).

## Domain score impact

A. Code Quality 77.7 → **77.8** (+0.1) on Consistency (F005 narrative corrected to
flat, +2). D. Delivery & Evolution 49.5 → **49.9** (+0.4) on CI/CD Health
(pull 10/1/0, first zero-failure window, +2). Composite **69.4** (+0.1 vs 153rd).
B/C unchanged. Orchestrator 6/6 checkout failure still prices into CI/CD Health.
