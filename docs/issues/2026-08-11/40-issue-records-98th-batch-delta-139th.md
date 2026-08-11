# Issue Records — 98th Batch (Delta, 139th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 138th audit matrix on `7e00bf2` (see `39-audit-report-2026-08-11-139th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 127th consecutive
denial). Per the 136-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 97th-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                            |
| ---- | ----------------- | ------ | ---------------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                             |
| F037 | security/P0       | HELD   | duplicate `GEMINI_API_KEY` API_KEY refs — CRITICAL (40th)                    |
| F038 | security/P0       | HELD   | workflow `id-token`/`actions` write on non-merge, GH_TOKEN refs — CRITICAL   |
| F063 | ci/P1             | HELD   | orchestrator 7/7 sampled failure incl. 2026-08-11 — checkout auth (GH_TOKEN) |
| F002 | chore/P1          | HELD   | `gh issue create` denied (127th)                                             |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                             |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                                  |
| F025 | feature/P1        | HELD   | live site root HTTP 404; robots 200; Pages "built" (egress gap)              |
| F004 | security/P2       | HELD   | `secrets.*` refs across workflow envs (57 refs / 10 unique names this run)   |
| F007 | refactor/P2       | HELD   | 2045 lines across 6 workflow YAMLs                                           |
| F008 | refactor/P2       | HELD   | src/presenters/styles.js 1318 lines                                          |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                         |
| F017 | docs/P3           | ✅     | maintained RESOLVED — `addNumbers` absent from live docs/api.md (0 hits)     |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                                    |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191)        |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/`        |

## New evidence / refinements (this run)

### R-139-1: F004 re-count — method variance, not workflow change (security, P2)

- **Finding**: `secrets.*` ref count measured at **57 refs / 10 unique names** this
  run (`grep -oE 'secrets\.[A-Z_]+' .github/workflows/*.yml`) vs 59 refs recorded at
  the 137th/138th. Workflow YAMLs are byte-identical to those runs (git log since
  shows docs-only commits; last workflow change `156a15b ci: Bump
actions/setup-node from 6 to 7`), so the delta is counting-method variance, not a
  real change. Per-file split: parallel.yml 26, on-push.yml 13, on-pull.yml 12,
  orchestrator.yml 3, architect-agent.yml 2, opencode.yml 1.
- **Files affected**: `.github/workflows/*.yml` (unchanged; observation only).
- **Impact / Risk**: none for runtime; ledger-metric tracking only. Recommend the
  next fix window standardize the count command in the ledger to end variance.
- **Suggested fix (deferred)**: document the canonical re-count command in
  CONTRIBUTING.md or the ledger README.
- **Labels**: `security`, `P2`.

### R-139-2: Build timing variance within budget (chore, P3)

- **Finding**: full build 27ms / 74.07 pages/sec this run vs 29ms / 68.97 pages/sec at
  the 138th — run-to-run noise on a 2-school sample; budgets still PASS.
- **Files affected**: none (observation only).
- **Labels**: `chore`, `P3`.

### R-139-3: orchestrator failure sample extended to 7 (ci, P1)

- **Finding**: `gh run list --workflow=orchestrator.yml --limit 6` → 6/6 `failure`
  (2026-08-06 → 2026-08-11), extending the 138th's 6/6 sample. Combined with the
  earlier 2026-08-11 run this is a consistent 7/7 (or more) consecutive failure
  streak. Root cause unchanged: checkout cannot authenticate
  (`secrets.GH_TOKEN` missing/invalid; terminal prompts disabled).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}`; align the remaining `GH_TOKEN` refs
  (`on-push.yml:26`, `parallel.yml`, `architect-agent.yml`, `opencode.yml`).
- **Labels**: `ci`, `P1`.

### R-139-4: SITE_URL placeholder warning re-observed (chore, P2)

- **Finding**: `check-freshness.js` emits a warning every run: SITE_URL is the default
  placeholder `https://example.com`; robots.txt (`robots.txt:6`) points the Sitemap at
  example.com. Production deployment without SITE_URL set would publish placeholder
  links. Re-observed 11th run.
- **Evidence**: `node scripts/check-freshness.js` → "SITE_URL is set to default
  placeholder \"https://example.com\"" (this run, 20:41:18Z). Config reference:
  `scripts/config.js` + `.env.example`.
- **Impact / Risk**: low for CI builds, medium for any real deployment; documented env
  parity gap (D — Config & Env Parity).
- **Suggested fix (deferred)**: enforce SITE_URL presence in CI deploy job or default
  to the Pages URL; document in docs/setup.md.
- **Labels**: `chore`, `P2`.

### R-139-5: workflow-security violations re-sampled (security, P0 — 40th observation)

- **Finding**: `node scripts/check-workflow-security.js` exits 1 with **12 violations**
  — 2 CRITICAL + 10 HIGH (**40th consecutive observation** of F037/F038):

| Severity | Rule                             | Count |
| -------- | -------------------------------- | ----- |
| CRITICAL | DUPLICATE_API_KEY                | 2     |
| HIGH     | ID_TOKEN_WRITE                   | 4     |
| HIGH     | ACTIONS_WRITE_NON_MERGE          | 4     |
| HIGH     | GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN | 2     |

- **Files affected**: `.github/workflows/parallel.yml` (DUPLICATE_API_KEY,
  id-token:16, actions:15), `orchestrator.yml:9/13` (id-token/actions write, GH_TOKEN
  refs), `on-push.yml`, `architect-agent.yml`, `opencode.yml` (ID_TOKEN_WRITE /
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
