# Issue Records — 109th Batch (Delta, 150th verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 149th audit matrix on `81605b6`, re-executed fresh this run (see
`00-audit-report-2026-08-13-150th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 138th consecutive
denial). Per the 149-run docs-only convention, findings are recorded in this ledger.

## This run: one regression (F063 aggravated), one new operational observation, rest flat

The first non-flat delta in 32 runs. F063's "schedule runs pass" claim inverted:
7 of the last 12 `pull` schedule runs failed with exit 124 (opencode 90-minute
timeout), and the daily `oc - orchestrator` run fails at checkout because the
workflow references `secrets.GH_TOKEN`, which does not exist in the Actions
environment (runtime token is `secrets.GITHUB_TOKEN`). This makes F038's GH_TOKEN
finding a live CI failure, not a static lint violation.

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not accessible
by integration (createIssue)` — HTTP 403, **F002, 138th consecutive denial**. The
integration token (`github-actions[bot]`) lacks `issues: write`. Findings are
therefore recorded in this ledger per the established 149-run convention, and the
FAIL-SAFE rule is satisfied: uncertainty about the token capability was probed, not
guessed.

## Findings ledger (status as of 150th run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status | Evidence this run                                                       |
| ---- | ----------------- | ------ | ----------------------------------------------------------------------- |
| F005 | docs/P2           | HELD   | prettier: 88 ledger files — stable 9th run (0 source files)             |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (51st obs)           |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (51st)  |
| F063 | ci/P1             | **AGGRAVATED** | 7/12 pull schedule runs exit-124; orchestrator checkout fails (GH_TOKEN missing) |
| F002 | ci/P1             | HELD   | `gh issue create` denied (138th)                                        |
| F018 | feature/P1        | HELD   | data STALE 24 days (threshold 7) — drift +1d vs 149th                   |
| F025 | feature/P1        | HELD   | SITE_URL placeholder `https://example.com` re-observed live             |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                             |
| F004 | security/P2       | HELD   | 57 `secrets.*` refs / 10 unique names (8th stable)                      |
| F007 | refactor/P2       | HELD   | 2045 lines across workflow YAMLs                                        |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                     |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                    |
| F019 | refactor/P3       | HELD   | tests/run_tests.py dup imports + dead block after return                |
| F014 | test/P1           | NOT OBSERVED | 7th consecutive clean run — 1104/1100/0/4-skip                          |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                      |
| ---- | ----------------- | ------------------------------------------------------------------------------------------ |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                        |
| F026 | bug/P2            | `formatBytes(NaN)` → `"NaN"`, `formatBytes(0.5)` → `"0.50 B"` — guard at build-performance.js:191 |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences)                                        |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                               |
| F032 | feature/P2       | sitemap lastmod derived from data `updated_at` (source re-verified)                          |

## NEW operational observation — GH_TOKEN checkout failure (rolls into F038)

- **File**: `.github/workflows/orchestrator.yml` lines 33/41 (`secrets.GH_TOKEN`)
- **Live failure**: run 31657336809 — `fatal: could not read Username for
  'https://github.com': terminal prompts disabled` at checkout, exit 128
- **Impact**: the daily orchestrator job cannot start; its agent never runs
- **Fix**: `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (both occurrences) — part of
  the F037/F038 resolution batch

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
2. **F063** — ci/P1: revisit on-pull.yml agent timeout/queue; the exit-124s track
   the PR-handler loop spinning inside `timeout -k 1m 90m`.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs).

## Domain score impact

D. Delivery & Evolution Readiness 50.1 → **49.5** (−0.6, first movement in 32 runs)
on CI/CD Health 48 → 44. Composite **69.5 → 69.35**.