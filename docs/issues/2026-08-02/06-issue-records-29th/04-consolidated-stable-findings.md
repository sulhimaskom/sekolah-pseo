# Consolidated stable findings — F001–F004, F006–F012, F016–F023 (re-verified, 29th run)

**Evaluation Date**: 2026-08-02 (29th run)
**Category**: multiple
**Priority**: mixed
**Status**: OPEN (all re-verified valid)

Each finding below was independently re-verified this run. Details unchanged from 27th/28th
records; fresh evidence noted inline.

## F001 — Floating promise in fetch-data.js (bug, P1)
`main()` (fetch-data.js:319) calls `fetchFromGitHub()` and `copyToRaw()` synchronously —
the async work is fire-and-forget; `main` returns before fetch resolves. `if (require.main
=== module) main();` (line 378) — no `.catch()`. Verified: main is synchronous, no await.
- Fix: `main().catch(...)` + make `main` async (or `.then/.catch` at the call site).

## F002 — Loop token lacks `issues: write` (ci, P1)
`gh issue create` probe → **403 `Resource not accessible by integration (createIssue)`**
(26th consecutive). Token collaborator permission: `none`. Blocks Phase 1 output (issues).

## F003 — Global concurrency groups (ci, P2)
on-push.yml `concurrency: group: global` (line 11) — all pushes serialize; combined with
`cancel-in-progress: false` this can queue CI indefinitely. Verified present.

## F004 — Excessive CI secret exposure (security, P1)
59 `secrets.*` references across 25 distinct secret names in workflows. Secrets passed to
all steps incl. untrusted opencode runs.

## F006 — SITE_URL placeholder (chore, P2)
Every run logs: `SITE_URL is set to default placeholder "https://example.com"`. Generated
site links/robots/sitemap point at example.com. Affects dist output correctness in prod.

## F007 — CI workflow overcomplexity (refactor, P2)
6 workflows + template.md, 2045+ lines, embedded 400+ line prompts, 3 layers of orchestration.
High maintenance surface for a static-site generator.

## F008 — styles.js oversized 1275L (refactor, P2)
`wc -l src/presenters/styles.js` → 1275. Also homepage.js 716L, utils.js 415L.

## F009 — pytest not wired into CI (test, P2)
`python3 tests/run_tests.py` → 27/27 pass locally, but no workflow/job runs Python tests.

## F010 — Missing E2E/integration tests (test, P3)
No e2e toolchain; no full-pipeline (ETL→build→sitemap→validate) integration test.

## F011 — Missing automated release (ci, P2)
No release workflow, 0 tags. No changelog automation beyond manual CHANGELOG.md.

## F012 — lint-staged engine mismatch (chore, P3)
`.nvmrc` = 22, CI `setup-node node-version: 20`, lint-staged@17.2.0 requires ≥22.22.1 →
husky/lint-staged engine warning on `npm ci`.

## F016 — README documents non-existent `gitignore-check` (docs, P3)
README §"CI Verification" references `gitignore-check` workflow; `.github/workflows/` has no
such file.

## F017 — docs/api.md documents nonexistent `addNumbers()` (docs, P3)
api.md:553 documents `addNumbers(a, b)`; no such export exists in scripts/.

## F018 — schools.csv data regression 3474→1 (bug, P1)
`wc -l data/schools.csv` → 2 records (header + 2 schools; was 3474). Freshness: STALE
(2026-07-20, 13 days > 7-day threshold). Build now produces 2 pages only.

## F019 — Dead code tests/run_tests.py (refactor, P3)
Duplicate imports at lines 20–25; unreachable code at 523–527.

## F020 — Dead script apply-caching-patch.sh (chore, P3)
References a patch file that does not exist in repo.

## F021 — Orphaned check-workflow-security.js gate (security, P2)
No test, no npm script entry; husky pre-commit suppresses its output with `2>/dev/null`.

## F022 — head-meta.js untested (test, P3)
No `scripts/head-meta.test.js` (verified absent this run).

## F023 — Validator logic duplication (refactor, P3)
`isNonEmpty`/`isValidCoordinate` duplicated: data-quality.js:52,65 vs data-schema.js:165,189;
`validateRecord` in etl.js:116 vs data-schema.js:219.
