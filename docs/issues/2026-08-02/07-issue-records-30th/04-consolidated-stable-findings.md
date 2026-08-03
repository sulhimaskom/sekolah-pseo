# Consolidated stable findings — F001–F004, F006–F013, F016–F023 (re-verified, 30th run)

**Evaluation Date**: 2026-08-02 (30th run)
**Category**: multiple
**Priority**: mixed
**Status**: OPEN (all re-verified valid)

Each finding below was independently re-verified this run. Details unchanged from
28th/29th records; fresh evidence noted inline.

## F001 — Floating promise in fetch-data.js (bug, P1)
`main()` (fetch-data.js:319) calls `fetchFromGitHub()` and `copyToRaw()` synchronously —
the async work is fire-and-forget; `main` returns before fetch resolves. `if (require.main
=== module) main();` (lines 377–378) — no `.catch()`. Verified: main is synchronous, no await.
- Fix: `main().catch(...)` + make `main` async (or `.then/.catch` at the call site).

## F002 — Loop token lacks `issues: write` (ci, P1)
`gh issue create` probe → **403 `Resource not accessible by integration (createIssue)`**
(27th consecutive). Token collaborator permission: `none`. Blocks Phase 1 output (issues).

## F003 — Global concurrency groups (ci, P2)
on-push.yml `concurrency: group: global` (lines 10–11) — all pushes serialize; combined with
`cancel-in-progress: false` this can queue CI indefinitely. Verified present.

## F004 — Excessive CI secret exposure (security, P1)
59 `secrets.*` references across 25 distinct secret names in workflows (re-counted this run).
Secrets passed to all steps incl. untrusted opencode runs.

## F006 — SITE_URL placeholder (chore, P2)
Every run logs: `SITE_URL is set to default placeholder "https://example.com"`. Generated
site links/robots/sitemap point at example.com. Affects dist output correctness in prod.

## F007 — CI workflow overcomplexity (refactor, P2)
6 workflows + template.md, **2045 lines** (re-counted: orchestrator.yml 200, on-pull.yml ~437,
on-push.yml ~533, parallel.yml 456, + others), embedded 400+ line prompts, 3 layers of
orchestration. High maintenance surface for a static-site generator.

## F008 — styles.js oversized 1275L (refactor, P2)
`wc -l src/presenters/styles.js` → **1275** (re-verified). Also homepage.js 716L, utils.js 415L.

## F009 — pytest not wired into CI (test, P2)
`python3 tests/run_tests.py` → 27/27 pass (re-verified), but **0 workflow/job runs Python
tests** (grep re-verified: no hits).

## F010 — Missing E2E/integration tests (test, P3)
No e2e toolchain; no full-pipeline (ETL→build→sitemap→validate) integration test.

## F011 — Missing automated release (ci, P2)
No release workflow, **0 tags** (re-verified). No changelog automation beyond manual CHANGELOG.md.

## F012 — lint-staged engine mismatch (chore, P3)
`.nvmrc` = 22, CI `setup-node node-version: 20` (on-pull.yml:53, parallel.yml:70/267),
lint-staged@17.2.0 requires ≥22.22.1 → EBADENGINE warning on `npm ci` (observed this run,
running v20.20.2).

## F013 — Workflow permissions (security, P2)
`node scripts/check-workflow-security.js` → **12 violations: 2 CRITICAL (DUPLICATE_API_KEY)
+ 10 HIGH** (ID_TOKEN_WRITE, ACTIONS_WRITE_NON_MERGE, GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN)
— re-verified this run. See 29th-run record 03 for detail.

## F016 — README documents non-existent `gitignore-check` (docs, P3)
README §"CI Verification" references `gitignore-check` workflow; `.github/workflows/` has no
such file (re-verified: absent; README grep → 1 hit).

## F017 — docs/api.md documents nonexistent `addNumbers()` (docs, P3)
api.md:553 documents `addNumbers(a, b)` with example at :573; no such export exists in scripts/.

## F018 — schools.csv data regression 3474→1 (bug, P1)
`wc -l data/schools.csv` → **2 records** (re-verified). Freshness: STALE (2026-07-20,
13 days > 7-day threshold). Build now produces 2 school pages only.

## F019 — Dead code tests/run_tests.py (refactor, P3)
Duplicate imports at lines 20–25; unreachable code at 523–527 (re-verified).

## F020 — Dead script apply-caching-patch.sh (chore, P3)
References `feature-ci-incremental-caching.patch` which does not exist in repo (re-verified).

## F021 — Orphaned check-workflow-security.js gate (security, P2)
No test, no npm script entry; husky pre-commit suppresses its output with `2>/dev/null`
(re-verified .husky/pre-commit:3).

## F022 — head-meta.js untested (test, P3)
No `scripts/head-meta.test.js` (verified absent this run).

## F023 — Validator logic duplication (refactor, P3)
`isNonEmpty`/`isValidCoordinate` duplicated: data-quality.js:52,65 vs data-schema.js:165,189;
`validateRecord` in etl.js:116 vs data-schema.js:219 (re-verified; data-quality.js re-exports
SCHEMA versions at :398–399).
