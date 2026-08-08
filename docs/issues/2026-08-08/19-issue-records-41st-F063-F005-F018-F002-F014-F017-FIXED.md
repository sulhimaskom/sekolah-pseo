# Issue Records — 82nd verification (labeled findings; GitHub-issue output blocked by F002)

**Labels**: multiple (see each record). **Format**: evaluation date / domain score table /
criteria-level breakdown / evidence / files affected. Local `gh issue create` returns HTTP 403
`createIssue` (F002 held 78 sessions; re-verified this run) — these records are the repo's
labeled issue channel for this run. Deliverable ships as docs PR (repo convention).

## Issue 1 — F063 orchestrator chronic failure: dead `GH_TOKEN` secret (20th consecutive)

- **Category/priority**: `ci` / `P1`
- **Evaluation date**: 2026-08-08
- **Domain**: D. Delivery & Evolution (CI/CD Health 42/100); B. System (Stability)
- **Criteria breakdown**: the highest-autonomy self-scheduled agent (orchestrator.yml) has
  failed every scheduled run for 20 consecutive days (2026-07-20 → 2026-08-08); root cause is a
  fictitious secret, not a code defect. Streak window confirmed again this run.
- **Evidence** (this session):
  - `gh run list --workflow=orchestrator.yml --limit 8` → **8 visible, ALL `failure`**
    (2026-08-01T02:08:17Z → 2026-08-08T01:04:58Z); ledger tracks 20 consecutive.
  - `gh run view 31231794492 --log-failed` → Checkout dies on all attempts:
    `fatal: could not read Username for 'https://github.com': terminal prompts disabled`
    (git exit 128) — `orchestrator.yml` passes fictitious `secrets.GH_TOKEN`.
- **Files**: `.github/workflows/orchestrator.yml`
- **Fix** (blocked on token): replace `${{ secrets.GH_TOKEN }}` with `${{ secrets.GITHUB_TOKEN }}`
  or provide a real fine-grained PAT; needs `workflows: write` (F050) or maintainer with
  secret access.

## Issue 2 — Security: 12 workflow violations live (F037/F038, F013, F056–F059)

- **Category/priority**: `security` / `P0`
- **Evaluation date**: 2026-08-08
- **Domain**: B. Security 46/100; D. CI/CD Health 42/100
- **Criteria breakdown**: CRITICAL duplicated API keys ship on every push; HIGH
  id-token/actions grants on non-merge workflows; fictitious GH_TOKEN in Checkout. The gate is
  dead — no CI job invokes `check-workflow-security.js` (pre-commit hook only).
- **Evidence** (`node scripts/check-workflow-security.js` → exit 1, **12 violations**):
  - CRITICAL `DUPLICATE_API_KEY`: `parallel.yml`, `on-push.yml`
  - HIGH `ID_TOKEN_WRITE`: `parallel.yml:16`, `orchestrator.yml:9`, `opencode.yml:18`,
    `architect-agent.yml:13`
  - HIGH `ACTIONS_WRITE_NON_MERGE`: `parallel.yml:15`, `orchestrator.yml:13`,
    `opencode.yml:22`, `architect-agent.yml:17`
  - HIGH `GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN`: `parallel.yml`, `on-push.yml`,
    `orchestrator.yml`, `architect-agent.yml`
  - F004 re-count: **57 `secrets.*` refs / 10 unique names** across workflows.
- **Files**: `.github/workflows/*.yml`, `.husky/pre-commit`
- **Fix** (blocked on `workflows: write`): delete API_KEY aliases, GH_TOKEN→GITHUB_TOKEN,
  drop id-token/actions from non-merge workflows, wire checker as required CI job.

## Issue 3 — F002 no `issues: write` permission (78th consecutive blocked)

- **Category/priority**: `ci` / `P1`
- **Evaluation date**: 2026-08-08
- **Domain**: D. CI/CD Health; Phase-1 output pipeline
- **Criteria breakdown**: the loop token (`github-actions[bot]` integration) can read/write
  contents + pull-requests but not issues; every Phase-1 GitHub-issue requirement is denied.
- **Evidence**: `gh issue create` probe → `GraphQL: Resource not accessible by integration
(createIssue)` — 78 consecutive runs. `gh pr create`/`gh pr merge` work.
- **Fix**: add `issues: write` to the workflow/agent token (out-of-loop, maintainer action).

## Issue 4 — F018 data STALE 19 days (P1) + F005 Prettier drift (P3, docs-only)

- **Category/priority**: `bug` / `P1` (freshness); `docs` / `P3` (format)
- **Evaluation date**: 2026-08-08
- **Domain**: D. Migration Safety; C. Documentation Accuracy
- **Criteria breakdown**:
  - F018: `node scripts/check-freshness.js` → `STALE` — last update 2026-07-20 (**19 days**,
    threshold 7), 2 records. Refresh additionally constrained: external source
    (`suryavip/daftar-sekolah-indonesia`) now ships **JSON only** (`result/*.json`, no CSV —
    verified via `gh api` contents probe this run); `fetch-data.js` `findCsvFiles()` requires
    `.csv` → refresh would fail.
  - F005: `npx prettier --check .` → **74 files, 100% under `docs/issues/**`** (0 source
    files). Source is Prettier-clean; ledger grows ~2 files per run.
- **Files**: `data/schools.csv` (F018); `docs/issues/**` (F005)
- **Fix**: F018 — add JSON source support to fetch-data/etl or restore CSV upstream; F005 —
  format in the docs PR pipeline or accept ledger-only drift.

## Issue 5 — F014 parallel flake: clean 8th consecutive run (latent, P2)

- **Category/priority**: `test` / `P2`
- **Evaluation date**: 2026-08-08
- **Domain**: A. Testability 74; Determinism 78
- **Criteria breakdown**: fs/tmp race absent 8 consecutive verifications; suite
  **1056 pass / 0 fail / 4 skipped twice in this session**.
- **Evidence**: `npm run test:js` ×2 → `# tests 1060 / # pass 1056 / # fail 0 / # skipped 4`;
  post-test `git status` clean.
- **Files**: `scripts/etl-run.test.js`, `scripts/fetch-data.test.js`, `package.json`
- **Fix** (retained): per-test tmp dirs with cleanup-wait, or `--test-concurrency=1` in CI.

## Issue 6 — F024 sitemap emission: maintained RESOLVED (P2)

- **Category/priority**: `bug` / `P2`
- **Evaluation date**: 2026-08-08
- **Domain**: A. Determinism; B. Stability
- **Evidence**: `npm run build` → `dist/sitemap-index.xml` + `dist/sitemap-001.xml` present
  (37ms, budgets met); 7/7 across last runs.
- **Files**: `scripts/build-pages.js`, `scripts/sitemap.js`
- **Status**: maintained RESOLVED.

## Issue 7 — F028 `npm audit` clean — 15th consecutive (maintained RESOLVED, P2)

- **Category/priority**: `security` / `P2`
- **Evaluation date**: 2026-08-08
- **Domain**: A. Dependency Discipline
- **Evidence**: `npm audit` → `found 0 vulnerabilities` (exit 0); `npm install` → 0 vulns.
- **Files**: `package.json`, `package-lock.json`

## Issue 8 — F064 lint-staged engine mismatch (P2) + F065 continue-on-error on critical CI steps (P2)

- **Category/priority**: `ci` / `P2` (both)
- **Evaluation date**: 2026-08-08
- **Domain**: B. Config & Env Parity (F064); D. CI/CD Health (F065)
- **Criteria breakdown**:
  - F064: `node -v` = v20.20.2; `npm ls lint-staged` = 17.3.0 (demands ≥22.22.1);
    `.nvmrc` says 22. `npm install` emits EBADENGINE warning.
  - F065: `on-pull.yml:44,51` mark **Checkout** and **Setup Node** with
    `continue-on-error: true`; `parallel.yml:227` also continues on error — critical
    infrastructure steps can fail silently and the job still reports success.
- **Files**: `.nvmrc`, `.github/workflows/on-pull.yml`, `.github/workflows/parallel.yml`,
  `package.json`
- **Fix**: pin node 22.22.1 in all locations (F064); remove continue-on-error from
  checkout/setup-node (F065) — both need `workflows: write` (F050).

## Issue 9 — F017 phantom `addNumbers` API docs (FIXED — confirmed this run, P3)

- **Category/priority**: `docs` / `P3`
- **Evaluation date**: 2026-08-08
- **Domain**: C. Documentation Accuracy (47); A. Readability
- **Criteria breakdown**: `docs/api.md` previously documented `addNumbers(a, b)` (554–577)
  but no such export exists in `scripts/utils.js`. Phantom block removed in the 81st run.
- **Verification this run**: `grep -n addNumbers docs/api.md src/ scripts/utils.js` → **0
  matches** in live files (remaining matches only in historical ledger records).
- **Files**: `docs/api.md`
- **Status**: **FIXED** (maintained).

## Summary table

| ID             | Category | Priority | Status                                  |
| -------------- | -------- | -------- | --------------------------------------- |
| F063           | ci       | P1       | CONFIRMED 20th consecutive              |
| F037/F038      | security | P0       | HELD (of 12 violations)                 |
| F013/F056–F059 | security | P1/P2    | HELD                                    |
| F002           | ci       | P1       | CONFIRMED 78th                          |
| F018           | bug      | P1       | CONFIRMED 19d STALE (+source JSON-only) |
| F005           | docs     | P3       | HELD 74 files                           |
| F014           | test     | P2       | clean 8th (latent)                      |
| F024           | bug      | P2       | maintained RESOLVED                     |
| F028           | security | P2       | maintained RESOLVED (15th)              |
| F064           | ci       | P2       | CONFIRMED                               |
| F065           | ci       | P2       | CONFIRMED                               |
| F017           | docs     | P3       | **FIXED (confirmed)**                   |
