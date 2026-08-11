# Issue Records — 95th Batch (Delta, 136th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 135th audit matrix on `094a78a` (see `30-audit-report-2026-08-11-136th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 124th consecutive
denial). Per the 133-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 94th-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                          |
| ---- | ----------------- | ------ | -------------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                           |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (37th)                  |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs — CRITICAL |
| F063 | ci/P1             | HELD   | orchestrator 5/5 sampled failure — checkout auth (GH_TOKEN)                |
| F002 | chore/P1          | HELD   | `gh issue create` denied (124th)                                           |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                           |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                                |
| F025 | feature/P1        | HELD   | live site root HTTP 404; robots 200; Pages "built" (egress gap)            |
| F004 | security/P2       | HELD   | `secrets.*` refs across workflow envs (multiple unique names)              |
| F007 | refactor/P2       | HELD   | 2000+ lines across 6 workflow YAMLs                                        |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                        |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                       |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md (0 hits)   |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                                  |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)      |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`      |

## New evidence / refinements (this run)

### R-136-1: Build timing variance within budget (chore, P3)

- **Finding**: full build 29ms / 68.97 pages/sec this run vs 28ms / 71.43 pages/sec at
  the 135th — run-to-run noise on a 2-school sample; budgets still PASS.
- **Files affected**: none (observation only).
- **Labels**: `chore`, `P3`.

### R-136-2: SITE_URL placeholder warning re-observed (chore, P2)

- **Finding**: `check-freshness.js` emits a warning every run: SITE_URL is the default
  placeholder `https://example.com`; robots.txt/sitemap URLs point at example.com.
  Production deployment without SITE_URL set would publish placeholder links.
- **Evidence**: `node scripts/check-freshness.js` → "SITE_URL is set to default
  placeholder \"https://example.com\"" (re-observed 8th run). Config reference:
  `scripts/config.js` + `.env.example`.
- **Impact / Risk**: low for CI builds, medium for any real deployment; documented env
  parity gap (D — Config & Env Parity).
- **Suggested fix (deferred)**: enforce SITE_URL presence in CI deploy job or default
  to the Pages URL; document in docs/setup.md.
- **Labels**: `chore`, `P2`.

### R-136-3: orchestrator failure sample consistent (ci, P1)

- **Finding**: last 5 scheduled `oc - orchestrator` runs (2026-08-07 → 2026-08-11) all
  `failure` — consistent with the 135th's 5/5. Root cause unchanged: checkout cannot
  authenticate (`secrets.GH_TOKEN` missing/invalid; terminal prompts disabled).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}`; align the remaining `GH_TOKEN` refs
  (`on-push.yml:26`, `parallel.yml`, `architect-agent.yml`, `opencode.yml`).
- **Labels**: `ci`, `P1`.

### R-136-4: F068 pytest re-observed, resolved in-loop (test, P2)

- **Finding**: pytest not pre-installed in the clean runner environment; `python3 -m
pytest` initially failed (`No module named pytest`). Resolved by
  `pip install -q -r requirements.txt` (pytest 9.1.1, pytest-cov, pytest-html,
  pytest-json-report) → 13/13 passed in 0.03s.
- **Files affected**: none (environment setup only).
- **Suggested fix (deferred)**: document `pip install -r requirements.txt` as a
  prerequisite in docs/testing.md; consider CI caching of Python deps.
- **Labels**: `test`, `P2`.

### R-136-5: workflow-security violations re-sampled in detail (security, P0)

- **Finding**: `node scripts/check-workflow-security.js` exits 1 with **12 violations —
  2 CRITICAL + 10 HIGH** (37th observation). Full breakdown this run:
  - CRITICAL `DUPLICATE_API_KEY`: `on-push.yml` (API_KEY = GEMINI_API_KEY, line 26),
    `parallel.yml` (lines 37, 282, 362, 416).
  - HIGH `ID_TOKEN_WRITE` (non-OIDC): `architect-agent.yml:13`, `opencode.yml:18`,
    `orchestrator.yml:9`, `parallel.yml:16`.
  - HIGH `ACTIONS_WRITE_NON_MERGE`: `architect-agent.yml:17`, `opencode.yml:22`,
    `orchestrator.yml:13`, `parallel.yml:15`.
  - HIGH `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN`: `architect-agent.yml` (line 37),
    `orchestrator.yml` (lines 33, 41).
- **Files affected**: `.github/workflows/{on-push,parallel,architect-agent,opencode,orchestrator}.yml`.
- **Suggested fix (deferred — F050 boundary)**: remove duplicate API_KEY entries;
  drop `id-token: write` / `actions: write` from non-merge workflows; replace
  `secrets.GH_TOKEN` with `secrets.GITHUB_TOKEN` everywhere.
- **Labels**: `security`, `P0`.

## Log

| Timestamp         | Action                | Target                                        | Result                                                                                                                      |
| ----------------- | --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-11 17:52Z | Phase 0 probe         | `gh pr list` / `gh issue list`                | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                                                |
| 2026-08-11 17:52Z | skills survey         | `.opencode/skill/` (7)                        | identified; audit executed directly (convention)                                                                            |
| 2026-08-11 17:53Z | full audit matrix     | lint/build/test/test:js:coverage/prettier/sec | lint 0/0 · build budgets PASS (29ms) · JS 1091 tests/1087 pass/4 skip · pytest 13/13 (post-install) · cov 95.19/92.91/97.14 |
| 2026-08-11 17:55Z | security scan         | `check-workflow-security.js`                  | 12 violations — 2 CRITICAL + 10 HIGH (F037/F038, 37th observation)                                                          |
| 2026-08-11 17:55Z | freshness + CI probes | `check-freshness.js` / `gh run list`          | STALE 22d (F018) · orchestrator 5/5 failure (F063) — checkout auth on GH_TOKEN · SITE_URL placeholder                       |
| 2026-08-11 17:55Z | F002 probe            | `gh issue create`                             | GraphQL createIssue denied — blocked (124th)                                                                                |
| 2026-08-11 17:56Z | records written       | docs/issues/2026-08-11/ (30/31/32)            | delta audit + delta issue records + this ledger, all Prettier-clean                                                         |
