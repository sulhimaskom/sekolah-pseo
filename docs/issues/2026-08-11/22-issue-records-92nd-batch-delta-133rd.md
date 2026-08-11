# Issue Records — 92nd Batch (Delta, 133rd verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 132nd audit matrix on `f82dc19` (see `18-audit-report-2026-08-11-132nd.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 121st consecutive
denial). Per the 130-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 91st-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                             |
| ---- | ----------------- | ------ | ----------------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                              |
| F037 | security/P0       | HELD   | opencode.yml/parallel.yml duplicate `GEMINI_API_KEY` — CRITICAL (34th)        |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs — CRITICAL    |
| F063 | ci/P1             | HELD   | orchestrator 5/5 sampled failure — checkout auth (GH_TOKEN)                   |
| F002 | chore/P1          | HELD   | `gh issue create` denied (121st)                                              |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                              |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                                   |
| F025 | feature/P1        | HELD   | live site root HTTP 404; robots 200; Pages "built" (egress gap)               |
| F004 | security/P2       | HELD   | `secrets.*` 59 refs / 10 unique names across workflow envs                    |
| F007 | refactor/P2       | HELD   | 2045 lines across 6 workflow YAMLs                                            |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                           |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                          |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from docs/api.md (0 hits repo-wide) |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                                     |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:186)         |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`         |

## New evidence / refinements (this run)

### R-133-1: Build timing variance within budget (chore, P3)

- **Finding**: full build 55ms / 36.36 pages/sec this run vs 27ms / 74.07 pages/sec at
  the 132nd — run-to-run noise on a 2-school sample; budgets still PASS.
- **Files affected**: none (observation only).
- **Labels**: `chore`, `P3`.

### R-133-2: SITE_URL placeholder warning re-observed (chore, P2)

- **Finding**: `check-freshness.js` emits a warning every run: SITE_URL is the default
  placeholder `https://example.com`; robots.txt/sitemap URLs point at example.com.
  Production deployment without SITE_URL set would publish placeholder links.
- **Evidence**: `node scripts/check-freshness.js` → "SITE_URL is set to default
  placeholder \"https://example.com\"" (re-observed 5th run). Config reference:
  `scripts/config.js` + `.env.example`.
- **Impact / Risk**: low for CI builds, medium for any real deployment; documented env
  parity gap (D — Config & Env Parity).
- **Suggested fix (deferred)**: enforce SITE_URL presence in CI deploy job or default
  to the Pages URL; document in docs/setup.md.
- **Labels**: `chore`, `P2`.

### R-133-3: orchestrator failure sample consistent (ci, P1)

- **Finding**: last 5 scheduled `oc - orchestrator` runs all `failure` — consistent
  with the 132nd's 5/5. Root cause unchanged: checkout cannot authenticate
  (`secrets.GH_TOKEN` missing/invalid; terminal prompts disabled).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}`; align the remaining `GH_TOKEN` refs.
- **Labels**: `ci`, `P1`.

### R-133-4: F068 pytest re-observed, resolved in-loop (test, P2)

- **Finding**: pytest not pre-installed in the clean runner environment; `python3 -m
pytest` initially failed. Resolved by `pip install -q -r requirements.txt`
  (pytest, pytest-cov, pytest-html, pytest-json-report) → 13/13 passed.
- **Files affected**: none (environment setup only).
- **Suggested fix (deferred)**: document `pip install -r requirements.txt` as a
  prerequisite in docs/testing.md; consider CI caching of Python deps.
- **Labels**: `test`, `P2`.

## Log

| Timestamp         | Action                | Target                                     | Result                                                                                                             |
| ----------------- | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 2026-08-11 14:15Z | Phase 0 probe         | `gh pr list` / `gh issue list`             | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                       |
| 2026-08-11 14:15Z | skills survey         | `.opencode/skill/` (7)                     | identified; audit executed directly (convention)                                                                   |
| 2026-08-11 14:16Z | `npm ci`              | node_modules (clean)                       | 131 packages, 0 vulnerabilities, EBADENGINE (lint-staged ≥22.22.1 vs 20.20.2)                                      |
| 2026-08-11 14:17Z | full audit matrix     | lint/build/test/coverage/prettier/security | lint 0/0 · build PASS (55ms) · JS 1091 tests/1087 pass/4 skip · pytest 13/13 (post-install) · cov 95.19/92.9/97.14 |
| 2026-08-11 14:18Z | security scan         | `check-workflow-security.js`               | 12 violations — 2 CRITICAL + 10 HIGH (34th)                                                                        |
| 2026-08-11 14:18Z | freshness + CI probes | `check-freshness.js` / `gh run list`       | STALE 22d (F018) · orchestrator 5/5 failure (F063) · SITE_URL placeholder (R-133-2)                                |
| 2026-08-11 14:18Z | F002 probe            | `gh issue create`                          | GraphQL createIssue denied — blocked (121st)                                                                       |
| 2026-08-11 14:19Z | records written       | docs/issues/2026-08-11/ (21/22/23)         | delta audit + delta issue records + decision                                                                       |
