# Issue Records — 111th Batch (Delta, 152nd verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 151st audit matrix on `de58e6b`, re-executed fresh this run (see
`05-audit-report-2026-08-13-152nd.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 140th consecutive
denial). Per the 151-run docs-only convention, findings are recorded in this ledger.

## This run: F005 growth continues (+3), orchestrator checkout failure widens to 6/6

F005 now growing for the **4th consecutive run** (88 → 90 → 93): each audit run
self-appends ~3 ledger records that `prettier --check .` counts as failures. All
93 failing files are `docs/issues/`; **0 source files**. The orchestrator
workflow (`GH_TOKEN` checkout) failed **6/6** recent runs (was 5/5) — the daily
job has not started since ≥2026-08-08. F004 measured at 57 refs this run (151st
claimed 59; method-sensitive count variance).

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not accessible
by integration (createIssue)` — HTTP 403, **F002, 140th consecutive denial**. The
integration token (`github-actions[bot]`) lacks `issues: write`. Findings are
therefore recorded in this ledger per the established 151-run convention, and the
FAIL-SAFE rule is satisfied: uncertainty about the token capability was probed, not
guessed.

## Findings ledger (status as of 152nd run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status | Evidence this run                                                       |
| ---- | ----------------- | ------ | ----------------------------------------------------------------------- |
| F005 | docs/P2           | **GROWTH** | prettier: **93 files** (90→93, +3 — 4th consecutive growth run; all `docs/issues/`, 0 source) |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (53rd obs)           |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (53rd); **live checkout failure 6/6** |
| F063 | ci/P1             | HELD   | pull schedule 2 fail + 2 cancelled / 11 completed (exit 124, improved from 3+2); orchestrator checkout fails 6/6 |
| F002 | ci/P1             | HELD   | `gh issue create` denied (140th)                                        |
| F018 | feature/P1        | HELD   | data STALE 24 days (threshold 7) — flat vs 151st                        |
| F025 | feature/P1        | HELD   | SITE_URL placeholder `https://example.com` re-observed live             |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20; eslint EBADENGINE (needs node ≥22.22.1) |
| F004 | security/P2       | HELD   | **57 `secrets.*` refs / 10 unique names** (151st counted 59 — method variance; unique names stable) |
| F007 | refactor/P2       | HELD   | 2045 lines across workflow YAMLs                                        |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                     |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                    |
| F019 | refactor/P3       | HELD   | tests/run_tests.py dup imports + dead block after return                |
| F014 | test/P1           | NOT OBSERVED | 9th consecutive clean run — 1104/1100/0/4-skip                          |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                      |
| ---- | ----------------- | ------------------------------------------------------------------------------------------ |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                        |
| F026 | bug/P2            | `formatBytes` guard `!Number.isFinite(bytes)` verified at source: build-performance.js:186–204 |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences)                                        |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                               |
| F032 | feature/P2       | sitemap lastmod derived from data `updated_at` (source re-verified)                          |

## NEW operational confirmation — orchestrator checkout failure now 6/6 (F038 live, widening)

- **File**: `.github/workflows/orchestrator.yml` (2× `secrets.GH_TOKEN`)
- **Live failure**: `gh run list --workflow=orchestrator.yml` — **6/6 most recent
  runs FAILED** (2026-08-08 through 2026-08-13, daily 01:0x schedule)
- **Root cause**: checkout references `secrets.GH_TOKEN`; the Actions runtime only
  provides `secrets.GITHUB_TOKEN` → `fatal: could not read Username` exit 128
- **Impact**: the daily orchestrator job has not successfully started for ≥6 days;
  its agent work (incl. the 00–11 flow steps) never runs
- **Fix**: `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (both occurrences) — part of
  the F037/F038 resolution batch (blocked by F050, token lacks `workflows: write`)

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
   **Unblocks the live 6/6 orchestrator checkout failure.**
2. **F063** — ci/P1: revisit on-pull.yml agent timeout/queue; the exit-124s track
   the agent loop spinning inside `timeout -k 1m 90m`. Improved this run (3→2
   failures) but not resolved.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs). Now growing +3/run — deferral compounds.
4. **F064** — chore/P2: align `.nvmrc`/CI node with eslint's `>=22.22.1` engine
   requirement (EBADENGINE surfaced this run).

## Domain score impact

A. Code Quality 77.9 → **77.8** (−0.1) on Consistency (F005 90→93, 4th growth run).
Composite **69.3** (flat vs 151st). B/C/D unchanged. Orchestrator 6/6 checkout
failure and pull schedule 3→2 improvement net to zero on CI/CD Health (44).
