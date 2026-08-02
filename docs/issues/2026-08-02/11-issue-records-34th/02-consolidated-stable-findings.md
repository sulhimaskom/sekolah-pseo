# Consolidated stable findings — F001–F024 + F015-RESIDUAL (re-verified, 34th run)

**Evaluation Date**: 2026-08-02 (34th run)
**Category**: multiple
**Priority**: mixed
**Status**: OPEN (all re-verified valid; evidence refreshed this run)

Each finding below was independently re-verified this run with fresh commands. Details
unchanged from prior records unless noted; new evidence inline. **NEW findings this run:
F025 (live site 404, P1) and F026 (memory-delta NaN, P3)** — see sibling records.

## F001 — Floating promise in fetch-data.js `main()` (bug, P1) — RE-CONFIRMED

`scripts/fetch-data.js:353` — `const csvPath = fetchFromGitHub(sourceRepo);` calls the
async function (returns a Promise via `fetchCircuitBreaker.execute`) **without await**.
`copyToRaw(csvPath, outputPath)` then receives a Promise; `fs.copyFileSync(Promise, …)`
throws TypeError → catch → `useCachedData()` fallback → **`npm run fetch-data` always
uses the cache**. Verified by reading `main()` (lines 334-377) this run.

## F002 — Loop token lacks `issues: write` (ci, P1) — 31st consecutive block

`gh issue create` → `GraphQL: Resource not accessible by integration (createIssue)`.
`gh api user` → 403 `Resource not accessible by integration`. Probed live this run.
Phase 1 issue output ships as labeled docs records + PR (established pattern, runs 1-33).

## F003 — Global concurrency group in on-push.yml (ci, P2) — RE-VERIFIED

`.github/workflows/on-push.yml:10-12` — `concurrency: { group: global,
cancel-in-progress: false }`. Still present.

## F004 — Excessive CI secret exposure (security, P1) — RE-VERIFIED

Re-counted this run: **57 `secrets.*` references across 23 distinct names** (grep on
`.github/workflows/`). CWE-200 surface unchanged. Workflows expose GEMINI/IFLOW/
SUPABASE/CLOUDFLARE keys to agent jobs.

## F005 — Prettier drift (docs, P3) — RE-VERIFIED (stable 48 files)

`npm run format:check` → exit 1, **"Code style issues found in 48 files"** (49 warning
lines). Stable vs 33rd run. Prettier writes applied pre-commit in this run's own records.

## F006 — SITE_URL placeholder (chore, P2) — RE-VERIFIED

Build log this run: "SITE_URL is set to default placeholder 'https://example.com'".
`scripts/config.js:51` — `process.env.SITE_URL || 'https://example.com'`.

## F007 — CI workflow overcomplexity (refactor, P2) — RE-VERIFIED

`wc -l .github/workflows/*.yml` → 2045 total (on-push 533, on-pull 437, parallel 456,
architect-agent 216, opencode 203, orchestrator 200) + template.md 174.

## F008 — styles.js oversized (refactor, P2) — RE-VERIFIED

`src/presenters/styles.js` = 1275 lines; `homepage.js` = 716; `utils.js` = 415.

## F009 — pytest not wired into CI (test, P2) — RE-VERIFIED

`python3 tests/run_tests.py` → **27/27 pass**; 0 workflow jobs run Python tests.
Additionally `npm run test:py:pytest` fails in this environment: `No module named
pytest` (pytest not installed) — Python test dependency gap.

## F010 — Missing E2E/integration tests (test, P3) — RE-VERIFIED

No e2e toolchain; no full-pipeline integration test; `validate-links` run manually.

## F011 — Missing automated release (ci, P2) — RE-VERIFIED

`git tag | wc -l` → 0. No release workflow, version pinned 1.0.0. **Worsened by F025**
(deployment is green but the site 404s).

## F012 — lint-staged engine mismatch (chore, P3) — RE-VERIFIED

`.nvmrc` = 22; CI uses `setup-node node-version: 20`; lint-staged@17.2.0 requires node
≥22.22.1 → EBADENGINE warning observed again on `npm ci` (running v20.20.2).

## F013 — Workflow permissions (security, P2) — RE-VERIFIED

`node scripts/check-workflow-security.js` → **12 violations: 2 CRITICAL + 10 HIGH**.
DUPLICATE_API_KEY: `on-push.yml:26` + `parallel.yml` (4 occurrences at lines 37/282/
362/416 — checker reports 1/file); ID_TOKEN_WRITE + ACTIONS_WRITE_NON_MERGE across
workflows; GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN in orchestrator.yml.

## F014 — Parallel test-file race on DIST_DIR (test, P1) — NOT OBSERVED (0/3)

`npm run test:js` ×3 fresh runs → 1032 pass / 0 fail each (F014 latent). Root cause
unchanged: five test files share the real `dist/` working directory.

## F015 — OS command injection in fetch-data.js (security, P1) — RESOLVED (maintained)

`SHELL_METACHARACTER_REGEX` (`scripts/fetch-data.js:38`) rejects literal metacharacters;
verified live this run: `;id`, `$(id)`, backtick, `&&`, `|` payloads all rejected
(6 literal payload classes). Fix #542 holds.

## F015-RESIDUAL — Percent-encoded metacharacters pass validateRepoUrl (security, P2) — RE-CONFIRMED

Live PoC (validator-only, no exec): `https://github.com/foo/bar%26%26id.git`,
`bar%3Bid.git`, `bar%7Cid.git`, `bar%60id.git`, `foo%2Fbar.git` → **all ACCEPTED**
(fresh run, 34th). Defense-in-depth gap; not exploitable today (shell does not
percent-decode). Fix: `execFileSync` arg-array.

## F016 — README documents non-existent `gitignore-check` (docs, P3) — RE-VERIFIED

README §CI Verification references `gitignore-check`; file absent from `.github/workflows/`.

## F017 — docs/api.md documents nonexistent `addNumbers()` (docs, P3) — RE-VERIFIED

`docs/api.md:553` documents `addNumbers(a, b)`; no such export in scripts/ (0 grep hits).

## F018 — schools.csv data regression (bug, P1) — RE-CONFIRMED

`data/schools.csv` = 2 records (LINES: 2); `npm run check-freshness` → "Last Update:
2026-07-20 (13 days ago) … Status: STALE" (threshold 7 days). CHANGELOG claims 3474.

## F019 — Dead code tests/run_tests.py (refactor, P3) — RE-VERIFIED

Duplicate imports (lines 18-25), unreachable code; hand-rolled pytest replacement.

## F020 — Dead script apply-caching-patch.sh (chore, P3) — RE-VERIFIED

References non-existent patch file.

## F021 — Orphaned check-workflow-security.js gate (security, P2) — RE-VERIFIED

No test, no npm script; `.husky/pre-commit:3` suppresses with `2>/dev/null` + `|| echo`
— gate findings never fail the commit.

## F022 — head-meta.js untested (test, P3) — RE-VERIFIED

No `head-meta.test.js` in scripts/.

## F023 — Validator logic duplication (refactor, P3) — RE-VERIFIED

validateBranchName/validateRepoUrl duplicated; no shared validation module.

## F024 — Build omits sitemap; 404.html broken link (bug, P2) — RE-CONFIRMED

`npm run build` output contains no sitemap step; `dist/` has no sitemap files. Live site
serves root sitemap-index.xml (200) but content 404s (see F025).
