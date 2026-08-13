# Issue Records — 110th Batch (Delta, 151st verification, 2026-08-13)

**Evaluation Date**: 2026-08-13
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 150th audit matrix on `68dd696`, re-executed fresh this run (see
`02-audit-report-2026-08-13-151st.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 139th consecutive
denial). Per the 150-run docs-only convention, findings are recorded in this ledger.

## This run: F005 growth resumes (+2), F004 refs creep (+2), CI regression held

First F005 movement in 10 runs: the ledger's own new records are counted by
`prettier --check .`, making the F005 count self-referential (90 files, all
`docs/issues/`, 0 source). F004 `secrets.*` refs +2 (57→59, 10 unique names).
The orchestrator checkout failure (GH_TOKEN → exit 128) is confirmed live on 5/5
recent runs — F038 manifesting as a real CI failure.

## Issue creation attempt (mandated Phase 1 output)

`gh issue create` probe executed fresh this run → `GraphQL: Resource not accessible
by integration (createIssue)` — HTTP 403, **F002, 139th consecutive denial**. The
integration token (`github-actions[bot]`) lacks `issues: write`. Findings are
therefore recorded in this ledger per the established 150-run convention, and the
FAIL-SAFE rule is satisfied: uncertainty about the token capability was probed, not
guessed.

## Findings ledger (status as of 151st run)

### HELD (re-observed unchanged this run)

| ID   | Category/Priority | Status | Evidence this run                                                       |
| ---- | ----------------- | ------ | ----------------------------------------------------------------------- |
| F005 | docs/P2           | **GROWTH** | prettier: **90 files** (88→90, +2 — first delta in 10 runs; all `docs/issues/`, 0 source) |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (52nd obs)           |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs (52nd); **live checkout failure** |
| F063 | ci/P1             | HELD   | pull schedule 3 fail + 2 cancelled / 11 completed (exit 124); orchestrator checkout fails 5/5 |
| F002 | ci/P1             | HELD   | `gh issue create` denied (139th)                                        |
| F018 | feature/P1        | HELD   | data STALE 24 days (threshold 7) — flat vs 150th                        |
| F025 | feature/P1        | HELD   | SITE_URL placeholder `https://example.com` re-observed live             |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                             |
| F004 | security/P2       | **CREEP** | **59 `secrets.*` refs / 10 unique names (+2 refs vs 150th)**           |
| F007 | refactor/P2       | HELD   | 2045 lines across workflow YAMLs                                        |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                     |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                    |
| F019 | refactor/P3       | HELD   | tests/run_tests.py dup imports + dead block after return                |
| F014 | test/P1           | NOT OBSERVED | 8th consecutive clean run — 1104/1100/0/4-skip                          |

### Maintained RESOLVED (re-verified clean this run)

| ID   | Category/Priority | Verification this run                                                                      |
| ---- | ----------------- | ------------------------------------------------------------------------------------------ |
| F027 | security/P2       | `--json` exit 1 with violations payload — gate contract re-confirmed                        |
| F026 | bug/P2            | `formatBytes(NaN)` → `"NaN"`, `formatBytes(0.5)` → `"0.50 B"` — guard at build-performance.js:191 |
| F017 | docs/P3           | `addNumbers` absent from docs/api.md (0 occurrences)                                        |
| F028 | security/P2       | `npm audit` 0 vulnerabilities                                                               |
| F032 | feature/P2       | sitemap lastmod derived from data `updated_at` (source re-verified)                          |

## NEW operational confirmation — orchestrator checkout failure (F038 live)

- **File**: `.github/workflows/orchestrator.yml` (2× `secrets.GH_TOKEN`)
- **Live failure**: run 31657336809 — `GH_TOKEN: ***` then `fatal: could not read
  Username for 'https://github.com': terminal prompts disabled`, exit 128
- **Scope**: 5/5 most recent orchestrator runs failed at checkout (28–42s each)
- **Impact**: the daily orchestrator job cannot start; its agent never runs
- **Fix**: `secrets.GH_TOKEN` → `secrets.GITHUB_TOKEN` (both occurrences) — part of
  the F037/F038 resolution batch (blocked by F050, token lacks `workflows: write`)

## Proposed resolution batch (for ISSUE MANAGER / Phase 2+ when token allows)

1. **F037/F038** — security/P0: `on-push.yml`, `parallel.yml` (API_KEY dup),
   `orchestrator.yml`, `architect-agent.yml` (GH_TOKEN→GITHUB_TOKEN),
   `opencode.yml`, `orchestrator.yml`, `architect-agent.yml`, `parallel.yml`
   (drop id-token/actions write on non-merge). Green `check-workflow-security.js`.
2. **F063** — ci/P1: revisit on-pull.yml agent timeout/queue; the exit-124s track
   the PR-handler loop spinning inside `timeout -k 1m 90m`.
3. **F005** — docs/P2: prettier-clean the `docs/issues/` ledger (or scope prettier
   check to source + curated docs). Note: the ledger self-appends, so this count
   grows every run until scoped.

## Domain score impact

A. Code Quality 78.0 → **77.9** (−0.1) on Consistency (F005 88→90, first movement
in 10 runs). Composite **69.35 → 69.3** (≈flat). B/C/D unchanged.