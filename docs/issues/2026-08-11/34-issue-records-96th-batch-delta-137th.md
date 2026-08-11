# Issue Records — 96th Batch (Delta, 137th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 136th audit matrix on `81befe9` (see `33-audit-report-2026-08-11-137th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 125th consecutive
denial). Per the 134-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 95th-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                          |
| ---- | ----------------- | ------ | -------------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                           |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (38th)                  |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs — CRITICAL |
| F063 | ci/P1             | HELD   | orchestrator 6/6 sampled failure — checkout auth (GH_TOKEN)                |
| F002 | chore/P1          | HELD   | `gh issue create` denied (125th)                                           |
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

### R-137-1: Build timing variance within budget (chore, P3)

- **Finding**: full build 32ms / 62.5 pages/sec this run vs 29ms / 68.97 pages/sec at
  the 136th — run-to-run noise on a 2-school sample; budgets still PASS.
- **Files affected**: none (observation only).
- **Labels**: `chore`, `P3`.

### R-137-2: SITE_URL placeholder warning re-observed (chore, P2)

- **Finding**: `check-freshness.js` emits a warning every run: SITE_URL is the default
  placeholder `https://example.com`; robots.txt (`robots.txt:6`) points the Sitemap at
  example.com. Production deployment without SITE_URL set would publish placeholder
  links.
- **Evidence**: `node scripts/check-freshness.js` → "SITE_URL is set to default
  placeholder \"https://example.com\"" (re-observed 9th run). Config reference:
  `scripts/config.js` + `.env.example`.
- **Impact / Risk**: low for CI builds, medium for any real deployment; documented env
  parity gap (D — Config & Env Parity).
- **Suggested fix (deferred)**: enforce SITE_URL presence in CI deploy job or default
  to the Pages URL; document in docs/setup.md.
- **Labels**: `chore`, `P2`.

### R-137-3: orchestrator failure sample consistent (ci, P1)

- **Finding**: last 6 scheduled `oc - orchestrator` runs (2026-08-06 → 2026-08-11) all
  `failure` — consistent with the 136th's 5/5 sample. Root cause unchanged: checkout
  cannot authenticate (`secrets.GH_TOKEN` missing/invalid; terminal prompts disabled).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}`; align the remaining `GH_TOKEN` refs
  (`on-push.yml:26`, `parallel.yml`, `architect-agent.yml`, `opencode.yml`).
- **Labels**: `ci`, `P1`.

### R-137-4: F068 pytest re-observed, resolved in-loop (test, P2)

- **Finding**: pytest not pre-installed in the clean runner environment; `python3 -m
pytest` initially failed (`No module named pytest`). Resolved by
  `pip install -q -r requirements.txt` (pytest 9.1.1, pytest-cov, pytest-html,
  pytest-json-report) → 13/13 passed in 0.03s.
- **Files affected**: none (environment setup only).
- **Suggested fix (deferred)**: document `pip install -r requirements.txt` as a
  prerequisite in docs/testing.md; consider CI caching of Python deps.
- **Labels**: `test`, `P2`.

### R-137-5: workflow-security violations re-sampled in detail (security, P0)

- **Finding**: `node scripts/check-workflow-security.js` exits 1 with **12 violations**
  — 2 CRITICAL + 10 HIGH (38th consecutive observation of F037/F038):

| Severity | Rule                             | Count |
| -------- | -------------------------------- | ----- |
| CRITICAL | DUPLICATE_API_KEY                | 2     |
| HIGH     | ID_TOKEN_WRITE                   | 4     |
| HIGH     | ACTIONS_WRITE_NON_MERGE          | 4     |
| HIGH     | GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN | 2     |

- **Files affected**: `.github/workflows/parallel.yml` (DUPLICATE_API_KEY,
  id-token:16, actions:15), `orchestrator.yml:13` (actions write, GH_TOKEN refs),
  `on-push.yml`, `architect-agent.yml`, `opencode.yml` (ID_TOKEN_WRITE /
  ACTIONS_WRITE_NON_MERGE / GH_TOKEN refs).
- **Suggested fix (deferred — F050 write boundary)**: remove the duplicate `API_KEY`
  mapping, drop `id-token`/`actions` write from non-merge workflows, migrate all
  `GH_TOKEN` refs to `GITHUB_TOKEN`.
- **Labels**: `security`, `P0`.

## Cumulative finding-state note

No new finding IDs were minted this run; no resolution or regression was observed.
F005 remains the sole drift item (docs-ledger Prettier debt, 0 source files). The
failure-to-record path (F002) is unchanged, so findings continue to ship as labeled
ledger records rather than GitHub issues.
