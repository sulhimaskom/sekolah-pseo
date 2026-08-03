# Consolidated stable findings — F001–F022 + F024–F026 (re-verified, 35th run)

**Evaluation Date**: 2026-08-02 (35th run)
**Category**: multiple
**Priority**: mixed
**Status**: OPEN (all re-verified valid; evidence refreshed this run)

Each finding below was independently re-verified this run with fresh commands. Details
unchanged from prior records unless noted. **This run's deltas**: NEW **F027**
(`--json` mode exit 0 — see sibling record `00-F027`); **F023 RESOLVED as filed** (see
`01-F023`); **F015-RESIDUAL BROADENED** to include parser-rewritten literal payloads
(see `02-F015-RESIDUAL`); F004 drifted 57→59 refs; F005 drifted 48→49 files; F025
Pages deployments now 33/33 green while the site still 404s.

## F001 — Floating promise in fetch-data.js `main()` (bug, P1) — RE-CONFIRMED

`scripts/fetch-data.js:353` — `const csvPath = fetchFromGitHub(sourceRepo);` calls an
async-returning function **without await**. Root cause isolated: `fetchFromGitHub`
(`:179-254`) returns `fetchCircuitBreaker.execute(...)`, and `CircuitBreaker.execute`
is `async` (`scripts/resilience.js:289`) wrapping `async retry` (`:213`) — so a Promise
flows back to `main()`, which contains zero `await`/`.then`/`.catch` (`fetch-data.js:334-378`).
`copyToRaw(csvPath, …)` then receives a Promise → `fs.copyFileSync` TypeError →
`useCachedData()` fallback → **`npm run fetch-data` always uses the cache**.
Entry point `:393` — bare `main();` with no `.catch`. Verified by direct code trace.

## F002 — Loop token lacks `issues: write` (ci, P1) — 32nd consecutive block

`gh issue create` → `GraphQL: Resource not accessible by integration (createIssue)`.
Probed live this run. Phase 1 issue output ships as labeled docs records + PR
(established pattern, runs 1-34).

## F003 — Global concurrency group in on-push.yml (ci, P2) — RE-VERIFIED

`.github/workflows/on-push.yml:10-11` — `group: global`. Also `-global` groups in
orchestrator.yml:16-17 and architect-agent.yml:20-21; fixed `oc-agent` group in
on-pull.yml:16-17. Only parallel.yml:18-19 and opencode.yml:25-26 are ref-scoped.

## F004 — Excessive CI secret exposure (security, P1) — RE-VERIFIED, DRIFT 57→59

Fresh count: **59 `secrets.*` references across 11 unique names** (was 57 refs / 23
distinct per 34th record; per-file: parallel.yml 26, on-push.yml 13, on-pull.yml 12,
orchestrator.yml 3, architect-agent 2, template.md 2, opencode.yml 1). Names exposed
include GEMINI_API_KEY, IFLOW_API_KEY, CLOUDFLARE_API_TOKEN, SUPABASE_SECRET_KEY,
VITE_SUPABASE_KEY. CWE-200 surface unchanged, drifted upward.

## F005 — Prettier drift (docs, P3) — RE-VERIFIED, DRIFT 48→49

`npm run format:check` → exit 1, **"Code style issues found in 49 files"** (drifted +1
vs 34th; the increment is this run's and prior run's own record files).

## F006 — SITE_URL placeholder (chore, P2) — RE-VERIFIED

Build log: "SITE_URL is set to default placeholder 'https://example.com'".
`scripts/config.js:50-58` — `process.env.SITE_URL || 'https://example.com'`.

## F007 — CI workflow overcomplexity (refactor, P2) — RE-VERIFIED (exactly 2045L)

`wc -l .github/workflows/*.yml` → **2045 total** (on-push 533, on-pull 437, parallel
456, architect-agent 216, opencode 203, orchestrator 200) + template.md 174.

## F008 — styles.js oversized (refactor, P2) — RE-VERIFIED (exactly 1275L)

`src/presenters/styles.js` = 1275 lines; homepage.js = 716; scripts/utils.js = 415.

## F009 — pytest not wired into CI (test, P2) — RE-VERIFIED

`python3 tests/run_tests.py` → **27/27 pass**; `npm run test:py:pytest` fails:
`No module named pytest` (dependency not installed). Zero workflow jobs run Python
tests (0 hits for pytest/test steps in any workflow).

## F010 — Missing E2E/integration tests (test, P3) — RE-VERIFIED

No e2e toolchain; no full-pipeline integration test.

## F011 — Missing automated release (ci, P2) — RE-VERIFIED

`git tag | wc -l` → 0. No release workflow. **Worsened by F025** (green deploy, empty site).

## F012 — lint-staged engine mismatch (chore, P3) — RE-VERIFIED

`npm ci` → EBADENGINE: lint-staged@17.2.0 requires node ≥22.22.1, running v20.20.2.
`.nvmrc` = 22; CI pins node-version 20 (on-pull.yml:53, parallel.yml ×4, action.yml:49).

## F013 — Workflow permissions (security, P2) — RE-VERIFIED (12 violations)

`node scripts/check-workflow-security.js` → **12 violations: 2 CRITICAL + 10 HIGH**
(DUPLICATE_API_KEY ×2; ID_TOKEN_WRITE ×4; ACTIONS_WRITE_NON_MERGE ×4;
GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN ×2). **Now compounded by F027** — `--json` mode
exits 0 with these 12 present, so the documented CI contract never fails.
`SECURITY_AUDIT_NOTE.md:95` recommends `security-regression-check.yml`; file absent.

## F014 — Parallel test-file race on DIST_DIR (test, P1) — NOT OBSERVED (0/3)

`npm run test:js` ×3 fresh → 1032 pass / 0 fail each (F014 latent). Shared-workspace
effect independently confirmed: after test:js, `dist/` is wiped (validate-links finds
0 HTML) and `npm run build` repopulates it (6 HTML files).

## F015 — OS command injection in fetch-data.js (security, P1) — RESOLVED (maintained)

`SHELL_METACHARACTER_REGEX` (`fetch-data.js:38`) rejects literal `;` `$(` `&&` `|`
payloads (verified 35th run). Fix #542 holds for the directly-exploitable classes.

## F015-RESIDUAL — Encoded + parser-rewritten metacharacters pass (security, P2) — BROADENED

**5 encoded classes accepted** (`%26%26`, `%3B`, `%7C`, `%60`, `%2F`) **plus 2 literal
classes that the WHATWG parser rewrites before the regex check** (backtick → `%60`,
`<>` → `%3C%3E`). Validator-only PoC; not exploitable today (shell does not
percent-decode). See `02-F015-RESIDUAL-broadened.md`.

## F016 — README documents non-existent `gitignore-check` (docs, P3) — RE-VERIFIED

README §CI Verification (README.md:283-287) references `gitignore-check`; file absent
from `.github/workflows/` (0 gitignore refs in `.github/`).

## F017 — docs/api.md documents nonexistent `addNumbers()` (docs, P3) — RE-VERIFIED

`docs/api.md:553,573-574` documents `addNumbers(a, b)`; 0 hits in scripts/.

## F018 — schools.csv data regression (bug, P1) — RE-CONFIRMED

`data/schools.csv` = 2 records; `npm run check-freshness` → "Last Update: 2026-07-20
(13 days ago) … Status: STALE" (threshold 7 days). CHANGELOG claims 3474.

## F019 — Dead code tests/run_tests.py (refactor, P3) — RE-VERIFIED

run_tests.py (609 lines) hand-rolls a pytest replacement; no workflow invokes it.
`pytest.ini` + `requirements.txt` exist but pytest is not installed in env.

## F020 — Dead script apply-caching-patch.sh (chore, P3) — RE-VERIFIED

`scripts/apply-caching-patch.sh` (39 lines) references non-existent
`feature-ci-incremental-caching.patch` at repo root; zero `*.patch` files in repo.
Script would fail at its own guard; the caching it describes was never applied.

## F021 — Orphaned check-workflow-security.js gate (security, P2) — RE-VERIFIED

No test, no npm script; `.husky/pre-commit:3` suppresses with `2>/dev/null` + `|| echo`
— findings never fail the commit. **Compounded by F027** (JSON mode exit 0).

## F022 — head-meta.js untested (test, P3) — RE-VERIFIED

No `head-meta.test.js` in scripts/ (only shared/*.js component tests for
back-to-top, footer, navigation exist).

## F024 — Build omits sitemap; 404.html broken link (bug, P2) — RE-CONFIRMED

`npm run build` (package.json:10: `node scripts/build-pages.js && cp -r public/* dist/`)
never invokes sitemap generation; `scripts/sitemap.js` is not referenced by
build-pages.js, BuildOrchestrator.js, or any workflow. `dist/` contains no sitemap XML.
Live root sitemap-index.xml returns 200 while content 404s (F025).

## F025 — Live GitHub Pages site returns 404 (bug, P1) — RE-CONFIRMED

`pages build and deployment` now **33/33 successful**; root path still HTTP 404.
`dist/` gitignored (`.gitignore:236`) and never committed (0 index.html in tree).
No workflow builds or deploys `dist/` at all. See `00-F025-live-site-404.md` (34th).

## F026 — formatBytes NaN on negative memory delta (bug, P3) — RE-CONFIRMED

Unit repro: `formatBytes(-1024)` → `"NaN undefined"`, `formatBytes(-1)` → `"NaN
undefined"`. Root cause `build-performance.js:189`: `Math.log(negative)` → NaN → unit
index undefined. Not observed in natural builds this run (positive deltas both runs).
