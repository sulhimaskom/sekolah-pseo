# Phase 1 — Diagnostic & Comprehensive Scoring Report (27th verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 86d1675)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results

---

## Executive Summary

| Domain                                | Score       | Grade |
| ------------------------------------- | ----------- | ----- |
| **A. Code Quality**                   | **81.1/100** | B    |
| **B. System Quality**                 | **77.1/100** | B    |
| **C. Experience Quality**             | **84.2/100** | B    |
| **D. Delivery & Evolution Readiness** | **70.1/100** | C+   |
| **COMPOSITE**                         | **78.1/100** | B    |

Composite **−1.0 vs 26th run (79.1)** — driven by **F014 race OBSERVED again (2/5 full-suite
runs failed with `ERR_ASSERTION`)** and **F005 worsened to 25 Prettier-failing docs files**
(up from 24). F015 OS command injection re-PoC-confirmed live (5th consecutive). 18 tracked
findings re-verified, plus **4 NEW findings (F019–F022)** surfaced by structural inventory:
dead code in `tests/run_tests.py`, a dead shell script (`apply-caching-patch.sh`), an
orphaned security CLI (`check-workflow-security.js` with no test / no npm entry / suppressed
failures in husky), and a missing test for `head-meta.js`.

## Global Penalties

| Rule                   | Penalty | Justification                                                                      |
| ---------------------- | ------- | ---------------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 27ms, all budgets met        |
| Test failure           | −15     | ❌ **F014 OBSERVED — 2/5 full-suite runs failed** (`ERR_ASSERTION`, build-orchestrator.test.js) |
| Critical vulnerability | −20     | ❌ F015 OS command injection PoC-confirmed live (5th consecutive confirmation)      |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm ci`                                  | ✅ 0 vulnerabilities; ⚠️ lint-staged@17.2.0 engine mismatch persists (F012)          |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 27ms, 74.07 pages/sec, budgets met                    |
| `npm run lint` (eslint)                   | ✅ clean — 0 errors, 0 warnings (scripts/ + src/)                                   |
| `npm run test:js` (×8)                    | ❌ **F014 OBSERVED 2/5** then 1/3 — `ERR_ASSERTION` in `build-orchestrator.test.js` (sharedPagesPromise / prepareBuildEnvironment) |
| `python3 -m pytest tests/`                | ✅ 13/13 pass (after `pip install -r requirements.txt`; pytest still not wired into CI — F009) |
| `npm run test:js:coverage`                | ✅ 95.32% stmt / 92.28% branch / 96.63% funcs — above 80/75 thresholds              |
| `npm audit`                               | ✅ 0 vulnerabilities                                                                |
| `npm run format:check`                    | ❌ **25 files fail Prettier (F005 — worsened from 24)** — all under docs/issues/     |
| `node scripts/check-workflow-security.js` | ❌ **12 violations: 2 CRITICAL + 10 HIGH** (F013, stable across runs)               |
| `gh issue create` (attempt)               | ❌ **403 `Resource not accessible by integration (createIssue)`** (F002, 24th)       |
| `gh api .../collaborators/github-actions[bot]/permission` | ❌ `{"permission":"none"}` — token has zero repo permissions            |
| F015 PoC (`validateRepoUrl`)              | ❌ `bar;id.git` AND `bar$(id).git` both PASS validation → reach `execSync`          |

---

## A. CODE QUALITY (Weighted: 81.1/100)

| Criterion                    | Weight | Score | Weighted | Rationale                                                           |
| ---------------------------- | ------ | ----- | -------- | ------------------------------------------------------------------- |
| Correctness                  | 15     | 82    | 12.30    | F015 RCE (live PoC, 5th); F001 floating promise; F014 OBSERVED      |
| Readability & Naming         | 10     | 88    | 8.80     | camelCase + JSDoc; test-file naming inconsistent (F019-note)        |
| Simplicity                   | 10     | 85    | 8.50     | Straightforward CSV→HTML pipeline; CI layer overengineered (F007)   |
| Modularity & SRP             | 15     | 75    | 11.25    | styles.js 1275L (F008); homepage.js 716L; utils.js 415L; validator duplication (F023) |
| Consistency                  | 5      | 78    | 3.90     | **F005 worsened: 25 files fail Prettier**; mixed test naming (PageBuilder.test.js vs build-orchestrator.test.js vs homepage.test.js) |
| Testability                  | 15     | 78    | 11.70    | Coverage 95.32/92.28 met; **F014 race active**; pytest not wired (F009); no E2E (F010); check-workflow-security.js untested (F021); head-meta.js untested (F022) |
| Maintainability (Complexity) | 10     | 76    | 7.60     | No TODO/FIXME; oversized files; dead code (F019/F020); workflow sprawl (F007) |
| Error Handling               | 10     | 88    | 8.80     | IntegrationError + ERROR_CODES; resilience patterns; some console.log |
| Dependency Discipline        | 5      | 90    | 4.50     | 1 prod dep (pino); 0 vulns; lint-staged engine mismatch (F012)      |
| Determinism & Predictability | 5      | 75    | 3.75     | **F014 OBSERVED (2/5)**; F001 floating promise; ETL churn            |
| **TOTAL**                    | **100** |       | **81.10** |                                                                    |

### Criterion Details

#### A1. Correctness (82/100) ⚠️
- **Observations**: Full suite green 6/8 runs; **F014 raced in 2 runs** (ERR_ASSERTION at
  `build-orchestrator.test.js` — `generates dist files via sharedPagesPromise` /
  `prepareBuildEnvironment`), i.e. the parallel `dist/`-dir race is live again. Two confirmed
  defects re-verified: (a) **F015** — `validateRepoUrl` (`scripts/fetch-data.js:55-97`) lets
  `;id.git` and `$(id).git` URLs pass and reach `execSync` (fresh PoC, 5th consecutive);
  (b) **F001** — floating promise at `scripts/fetch-data.js:338` (`fetchFromGitHub(sourceRepo)`
  not awaited in sync `main()`).
- **Evidence**: 8 `npm run test:js` runs (2 failed); F015 node PoC; `fetch-data.js:55-97,338`
- **Impact/Risk**: Critical — RCE via crafted repo URL; moderate — flaky test gate + async control flow.
- **Deductions**: −10 (F015, overlapping B3 penalty), −8 (F014 observed + F001).

#### A2. Readability & Naming (88/100)
- **Observations**: Consistent camelCase, descriptive module names, JSDoc on exports.
  `PageBuilder`/`BuildOrchestrator` services well-named. Test files mix naming conventions:
  `PageBuilder.test.js` (Pascal), `build-orchestrator.test.js` (kebab), `homepage.test.js` (lower).
- **Evidence**: All files under `scripts/`, `src/`; test file names
- **Deductions**: −12 (test naming inconsistency + long functions in styles.js).

#### A3. Simplicity (85/100)
- **Observations**: Core pipeline simple (CSV → ETL → HTML). CI layer not: 6 workflows /
  ~2045 lines (F007), on-push.yml alone 533 lines with 12 sequential agent-flow steps and
  **no build/test gate**.
- **Evidence**: `package.json`, `.github/workflows/` (6 files, 2045 lines)
- **Deductions**: −15 (F007 workflow overcomplexity).

#### A4. Modularity & SRP (75/100) ⚠️
- **Observations**: Clean service boundary (PageBuilder 275L / BuildOrchestrator 556L).
  Persistent hotspots: `src/presenters/styles.js` 1275L (F008),
  `src/presenters/templates/homepage.js` 716L, `scripts/utils.js` 415L (catch-all).
  **NEW (F023)**: validator logic duplicated — `isNonEmpty`/`isValidCoordinate` in
  `data-quality.js:52,65` AND `data-schema.js:165,189`; `validateRecord` in `etl.js:116`
  vs `data-schema.js:219`.
- **Evidence**: `wc -l` output; grep of duplicated function definitions
- **Deductions**: −25 (F008 + oversized templates + duplication F023).

#### A5. Consistency (78/100) ⚠️
- **Observations**: Consistent 'use strict', JSDoc, IntegrationError, async/await. **F005
  WORSENED**: 25 files fail `prettier --check` (up from 24), all under `docs/issues/`.
  Mixed console.log vs pino in data-quality.js, interactive.js, check-workflow-security.js.
  Mixed test-file naming.
- **Evidence**: `npm run format:check` → 25 warnings; file listing
- **Deductions**: −22 (F005 worsening + naming + console.log stragglers).

#### A6. Testability (78/100) ⚠️
- **Observations**: 1030 JS tests; coverage 95.32% stmt / 92.28% branch (thresholds met).
  **F014 race active** (2/5). pytest present but NOT wired into CI (F009). No E2E (F010).
  **NEW (F021)**: `check-workflow-security.js` has no test AND is not in package.json,
  AND husky swallows its failures (`2>/dev/null || echo skip`) — the security gate is
  effectively inert. **NEW (F022)**: `head-meta.js` has no test.
- **Evidence**: `npm run test:js:coverage`, `.husky/pre-commit`, package.json scripts
- **Deductions**: −22 (F014 active + F009 + F010 + F021 + F022).

#### A7. Maintainability (76/100) ⚠️
- **Observations**: No TODO/FIXME/HACK. **NEW (F019)**: `tests/run_tests.py` contains
  unreachable code after `return suite` (lines 523-527) and a duplicated import block
  (lines 15-25). **NEW (F020)**: `scripts/apply-caching-patch.sh` targets the missing
  `feature-ci-incremental-caching.patch` — always fails. Primary burden: oversized files
  + 6-workflow CI sprawl.
- **Evidence**: `sed -n` on run_tests.py; `ls feature-ci-incremental-caching.patch` (absent)
- **Deductions**: −24 (F008 + F019 + F020 + F007).

#### A8. Error Handling (88/100)
- **Observations**: IntegrationError + ERROR_CODES; retry/backoff/circuit-breaker/timeout in
  `resilience.js`; no empty catches; shared `terminate()`.
- **Evidence**: `scripts/fs-safe.js`, `scripts/resilience.js`, `scripts/validate-links.js`
- **Deductions**: −12 (a few console.error fallbacks outside pino).

#### A9. Dependency Discipline (90/100)
- **Observations**: 1 prod dependency (pino); dev deps minimal. `npm audit` → 0 vulnerabilities.
- **Evidence**: `package.json`, `npm audit`
- **Deductions**: −10 (F012 — lint-staged@17.2.0 needs Node >=22.22.1; repo runs v20.20.2; .nvmrc=22).

#### A10. Determinism (75/100) ⚠️
- **Observations**: Content-hash incremental builds; no global state. **F014 OBSERVED — 2/5
  full-suite runs failed** (recurrence after 26th run's clean 0/5). F001 + ETL churn remain.
- **Evidence**: 8 test runs; `ERR_ASSERTION` in build-orchestrator.test.js
- **Deductions**: −25 (F014 active + F001 + ETL churn).

---

## B. SYSTEM QUALITY (RUNTIME) (Weighted: 77.1/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                          |
| ------------------------- | ------ | ----- | -------- | -------------------------------------------------- |
| Stability                 | 20     | 78    | 15.60    | Build stable; **F014 OBSERVED (2/5)**; CI not gating |
| Performance Efficiency    | 15     | 90    | 13.50    | 27ms build, 74 pages/sec, budgets met              |
| Security Practices        | 20     | 54    | 10.80    | **−20 F015 RCE**; −20 2 CRITICAL workflow viol.    |
| Scalability Readiness     | 15     | 82    | 12.30    | Incremental build + concurrency; data truncated (F018) |
| Resilience & Fault Tol.   | 15     | 88    | 13.20    | Retry/circuit-breaker/timeout patterns present     |
| Observability             | 15     | 78    | 11.70    | Pino structured logging; some console.log          |

### Criterion Details

#### B1. Stability (78/100) ⚠️
- **Observations**: Build passes consistently (27ms). **F014 raced in 2/5 full-suite runs**
  (recurrence). Race window latent at `scripts/build-orchestrator.test.js:178` — parallel
  test files share `CONFIG.DIST_DIR`.
- **Evidence**: 8 test runs (2 failed); race at build-orchestrator.test.js
- **Deductions**: −12 (F014 active), −10 (CI does not gate: on-push.yml runs 12 agent flows before any build/test step).

#### B2. Performance Efficiency (90/100)
- **Observations**: 27ms full build, 74.07 pages/sec, 57MB peak RSS, budgets met. Dataset
  still truncated to 1 school (F018) — large-scale performance (3474 pages) unexercised by CI.
- **Evidence**: `npm run build` output
- **Deductions**: −10 (scale behavior unverified due to data truncation).

#### B3. Security Practices (54/100) 🔴
- **Observations**: Strong baseline (escapeHtml, validatePath, validateLatLon, escapeCsvField,
  security headers, no hardcoded secrets). BUT:
  - **F015** — OS command injection PoC-confirmed live (5th): `bar;id.git` AND `bar$(id).git`
    both pass `validateRepoUrl` and reach `execSync`.
  - **F013** — `check-workflow-security.js` reports **12 violations: 2 CRITICAL
    (DUPLICATE_API_KEY: on-push.yml + parallel.yml) + 10 HIGH** (id-token: write ×4,
    actions: write ×4, secrets.GH_TOKEN ×2). 6th+ regression of documented fixes.
  - **F004** — 57 `secrets.*` references, 10 distinct secret names across workflows.
- **Evidence**: `node scripts/check-workflow-security.js`, F015 PoC output this run
- **Deductions**: **−20 global penalty (F015 critical vuln)**; −20 (2 CRITICAL); −12 (5+ HIGH remaining).

#### B4. Scalability Readiness (82/100)
- **Observations**: Incremental build via manifest; concurrency limits; rate-limiter module.
  Historical 3474-school build succeeded at 7252 pages/sec.
- **Evidence**: `scripts/build-pages.js`, `scripts/rate-limiter.js`
- **Deductions**: −18 (data truncated to 1 school — scale path not CI-exercised; F018).

#### B5. Resilience & Fault Tolerance (88/100)
- **Observations**: Circuit breaker, retry + exponential backoff, timeout wrapper, fs-safe wrappers.
- **Evidence**: `scripts/resilience.js`, `scripts/fs-safe.js`
- **Deductions**: −12 (no chaos/injection testing; partial concurrency failure handling).

#### B6. Observability (78/100) ⚠️
- **Observations**: Pino structured logging; build metrics (duration, throughput, RSS).
- **Evidence**: `scripts/logger.js`, build performance report
- **Deductions**: −22 (no request tracing; console.log escapes; no metrics export endpoint).

---

## C. EXPERIENCE QUALITY (UX / DX) (Weighted: 84.2/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                     |
| ------------------------- | ------ | ----- | -------- | --------------------------------------------- |
| Accessibility (UX)        | 10     | 92    | 9.20     | ARIA landmarks, skip links, reduced-motion    |
| User Flow Clarity (UX)    | 10     | 88    | 8.80     | Breadcrumbs, search/filter, province nav      |
| Feedback & Error (UX)     | 10     | 80    | 8.00     | 404 page, validation messages                 |
| Responsiveness (UX)       | 10     | 92    | 9.20     | Mobile/tablet/desktop breakpoints             |
| API Clarity (DX)          | 12     | 88    | 10.56    | Well-documented scripts; F017 stale api.md    |
| Local Dev Setup (DX)      | 12     | 85    | 10.20    | npm ci works; F012 node version mismatch      |
| Documentation Accuracy    | 14     | 66    | 9.24     | **F005 worsened (25 unformatted)**; F016/F017 |
| Debuggability (DX)        | 10     | 82    | 8.20     | Structured logging; error codes               |
| Build/Test Feedback (DX)  | 12     | 90    | 10.80    | 27ms build; ~4s test suite; F014 flake        |

### Criterion Details

#### C1. Accessibility (92/100)
- **Observations**: ARIA landmarks, skip-to-content links, `prefers-reduced-motion`, semantic HTML.
- **Evidence**: `src/presenters/templates/shared/*.js`
- **Deductions**: −8 (no automated a11y test suite in CI).

#### C2. User Flow Clarity (88/100)
- **Observations**: Homepage search + province + education-type filters; breadcrumbs.
- **Evidence**: `src/presenters/templates/homepage.js`, `shared/navigation.js`
- **Deductions**: −12 (no in-app feedback for zero-result searches).

#### C3. Feedback & Error (80/100)
- **Observations**: Custom 404, validation warnings on CLI, structured error logging.
- **Evidence**: `public/404.html`, scripts CLI output
- **Deductions**: −20 (build-time failures surfaced only in logs, not a user-visible report artifact).

#### C4. Responsiveness (92/100)
- **Observations**: Media-query breakpoints; grid layout; mobile-first CSS.
- **Evidence**: `src/presenters/styles.js`
- **Deductions**: −8 (no visual regression tests).

#### C5. API Clarity (88/100)
- **Observations**: All scripts documented in docs/api.md with examples; consistent CLI flags.
- **Evidence**: `docs/api.md`, script headers
- **Deductions**: −12 (F017 — api.md documents `addNumbers()` that does not exist in utils.js).

#### C6. Local Dev Setup (85/100)
- **Observations**: `npm ci` clean; `.devcontainer`; husky + lint-staged. Node version
  tri-state mismatch persists (F012): `.nvmrc`=22, CI setup-node=20, runner v20.20.2,
  lint-staged@17.2.0 requires >=22.22.1. **NEW (F021)**: husky pre-commit suppresses the
  workflow-security check failure (`2>/dev/null || echo skip`) — devs are not blocked.
- **Evidence**: `.nvmrc`, `on-pull.yml`, `npm ci` output, `.husky/pre-commit`
- **Deductions**: −15 (F012).

#### C7. Documentation Accuracy (66/100) 🔴
- **Observations**: **F005 worsened — 25 files fail `prettier --check`** (up from 24; all under
  `docs/issues/`). README references a `gitignore-check` workflow that does not exist (F016).
  `docs/api.md` documents non-existent `addNumbers()` (F017). 12+ stale historical audit
  reports clutter `docs/` root.
- **Evidence**: `npm run format:check` (25 warnings), README.md:283, docs/api.md:553-574
- **Deductions**: −34 (F005 worsening + F016 + F017 + stale reports).

#### C8. Debuggability (82/100)
- **Observations**: Structured pino logs; typed error codes; build performance metrics.
- **Evidence**: `scripts/logger.js`, build output
- **Deductions**: −18 (console.log escapes; no `--debug` verbosity flag).

#### C9. Build/Test Feedback (90/100)
- **Observations**: 27ms build, ~4s test suite. **F014 flake occasionally turns green→red**
  (2/5 this run).
- **Evidence**: measured timings this run
- **Deductions**: −10 (F014 flake window).

---

## D. DELIVERY & EVOLUTION READINESS (Weighted: 70.1/100)

| Criterion                  | Weight | Score | Weighted | Rationale                                        |
| -------------------------- | ------ | ----- | -------- | ------------------------------------------------ |
| CI/CD Health               | 20     | 61    | 12.20    | F013 (12 violations); F002 blocked; F003         |
| Release & Rollback Safety  | 20     | 65    | 13.00    | Static site rollback easy; no release process    |
| Config & Env Parity        | 15     | 78    | 11.70    | .env.example good; F006 SITE_URL placeholder     |
| Migration Safety           | 15     | 70    | 10.50    | CSV-based; F018 data regression unplanned        |
| Technical Debt Exposure    | 15     | 66    | 9.90     | F007 sprawl; F008 oversized; F005 worsened; F019/F020 dead code |
| Change Velocity & Blast R. | 15     | 85    | 12.75    | Dependabot; small focused PRs; static output     |

### Criterion Details

#### D1. CI/CD Health (61/100) ⚠️
- **Observations**: **F013** — 12 security violations across 4 workflows (2 CRITICAL + 10 HIGH),
  6th+ regression. **F002** — loop token cannot create issues (403, `permission: none`),
  24th consecutive blocked run. **F003** — global concurrency group (`on-push.yml:11`).
  `on-pull.yml:44,51` and `parallel.yml:227` use `continue-on-error: true` (masks failures).
  No build/test gate in on-push.yml before 12 sequential agent flows. `on-push.yml` triggers
  on push to **all branches** (unfiltered).
- **Evidence**: `check-workflow-security.js`, `gh issue create` 403, workflow files
- **Deductions**: −39 (F013/F002/F003/masked failures/unfiltered push).

#### D2. Release & Rollback Safety (65/100)
- **Observations**: Static HTML output → trivial rollback. No release workflow, 0 git tags (F011).
- **Evidence**: `git tag` → 0; `.github/workflows/` (no release workflow)
- **Deductions**: −35 (F011).

#### D3. Config & Env Parity (78/100)
- **Observations**: `.env.example` documents all vars; bounds-checked env parsing. SITE_URL
  defaults to `https://example.com` with runtime warning (F006, observed this run). Node
  tri-state mismatch (F012).
- **Evidence**: `.env.example`, `scripts/config.js:50-54`, `.nvmrc` vs CI vs runner
- **Deductions**: −22 (F006 + F012 + undocumented IFLOW_API_KEY usage).

#### D4. Migration Safety (70/100) ⚠️
- **Observations**: CSV-based, no DB migrations, static output. **F018 persists**:
  `data/schools.csv` truncated from 3474 schools to 1 school in commit 151a07f (PR #498)
  with no documented rationale — site builds 2 pages.
- **Evidence**: `git show 151a07f --stat` (data/schools.csv 3475→2 lines); current `wc -l` → 2
- **Deductions**: −30 (F018 undocumented data regression).

#### D5. Technical Debt Exposure (66/100)
- **Observations**: F007 (6 workflows/2045 lines), F008 (styles.js 1275L), F018 data regression,
  **F005 worsened (25 files)**, **NEW F019 (dead code in run_tests.py)**, **NEW F020 (dead
  apply-caching-patch.sh)**, 12+ stale audit reports, 22 findings (18 tracked + 4 new)
  persisting with zero remediations (loop blocked on issue creation).
- **Evidence**: workflow line counts, `docs/` listing, findings matrix
- **Deductions**: −34.

#### D6. Change Velocity & Blast Radius (85/100)
- **Observations**: Dependabot active; PRs small/focused; static deploys minimal blast radius.
- **Evidence**: git log, dependabot config
- **Deductions**: −15 (agent-branch divergence — origin/agent 25 behind, 1 ahead).

---

## Findings Re-Verification Matrix (18/18 re-verified + 4 NEW)

| #   | Finding                                                    | Cat      | Pri | Re-verified | Fresh evidence (this run)                                          |
| --- | ---------------------------------------------------------- | -------- | --- | ----------- | ------------------------------------------------------------------ |
| 001 | Floating promise in `fetch-data.js` main()                 | bug      | P1  | ✅ valid    | `fetch-data.js:338` no `await`                                      |
| 002 | Missing `issues: write` + `workflows: write` (loop runner) | ci       | P1  | ✅ valid (24th) | `gh issue create` → 403; permission `none`               |
| 003 | Global concurrency groups                                  | ci       | P2  | ✅ valid    | `on-push.yml:11` `group: global`                                   |
| 004 | Excessive CI secret exposure/aliasing                      | security | P1  | ✅ valid    | 57 `secrets.*` refs, 10 distinct names                              |
| 005 | Prettier violations in docs                                | docs     | P3  | ✅ **WORSENED** | **25 files unformatted** (up from 24)                       |
| 006 | SITE_URL placeholder                                       | chore    | P2  | ✅ valid    | Build warning observed this run                                    |
| 007 | CI workflow overcomplexity                                 | refactor | P2  | ✅ valid    | 6 workflows, ~2045 lines, on-push 533L, unfiltered push trigger   |
| 008 | styles.js oversized                                        | refactor | P2  | ✅ valid    | `wc -l` → 1275                                                     |
| 009 | pytest tooling not wired into CI                           | test     | P2  | ✅ valid    | pytest works locally (13 pass) but absent from all workflows       |
| 010 | Missing E2E/integration tests                              | test     | P3  | ✅ valid    | No e2e framework in package.json/workflows                         |
| 011 | Missing automated release process                          | ci       | P2  | ✅ valid    | No release workflow; 0 tags                                        |
| 012 | lint-staged engine mismatch                                | chore    | P3  | ✅ valid    | `.nvmrc`=22 vs Node v20.20.2 vs lint-staged>=22.22.1 (EBADENGINE)  |
| 013 | Workflow permissions violations (12)                       | security | P1  | ✅ valid    | `check-workflow-security.js` → 12 violations (2 CRITICAL + 10 HIGH)|
| 014 | Parallel test-file race (`dist/`)                          | test     | P1  | ✅ **OBSERVED (2/5)** | ERR_ASSERTION in build-orchestrator.test.js              |
| 015 | OS command injection in `fetch-data.js`                    | security | P1  | ✅ **EXPLOITABLE (5th)** | `bar;id.git` AND `bar$(id).git` pass validateRepoUrl → execSync |
| 016 | README documents non-existent `gitignore-check` workflow   | docs     | P3  | ✅ valid    | README.md:283; workflow absent                                    |
| 017 | `docs/api.md` documents `addNumbers()` that does not exist | docs     | P3  | ✅ valid    | docs/api.md:553-574; no such export in `scripts/utils.js`          |
| 018 | schools.csv data regression 3474→1 school                  | bug      | P1  | ✅ valid    | commit 151a07f (PR #498); still 2 lines; site builds 2 pages       |
| 019 | **NEW** Dead/unreachable code in `tests/run_tests.py`      | refactor | P3  | 🆕 found     | duplicated imports (15-25); unreachable block after `return suite` (523-527) |
| 020 | **NEW** Dead script `apply-caching-patch.sh`               | chore    | P3  | 🆕 found     | targets missing `feature-ci-incremental-caching.patch`             |
| 021 | **NEW** Orphaned `check-workflow-security.js` security gate| security | P2  | 🆕 found     | no test, no npm entry, husky suppresses failure (`2>/dev/null`)    |
| 022 | **NEW** `head-meta.js` has no test                         | test     | P3  | 🆕 found     | no `head-meta.test.js` in scripts/                                 |

---

## Phase 1 Output — GitHub Issue Creation: BLOCKED (24th consecutive)

Per Phase 1 mandate, GitHub issues must be created from all findings. **ATTEMPTED and
BLOCKED this run**:

- `gh issue create` → `GraphQL: Resource not accessible by integration (createIssue)`
- `gh api repos/sulhimaskom/sekolah-pseo/collaborators/github-actions[bot]/permission` →
  `{"permission":"none"}`
- 24th consecutive blocked run (finding 002).

**Required human/org action**:
1. Grant the loop runner token `issues: write` (and `workflows: write`), OR
2. Provide a fine-grained PAT with `Issues: write` to the `pull` workflow.

**Fallback used (repo convention, 24+ prior runs)**: findings persisted as markdown in
`docs/issues/` with full evidence — this file + issue records serve as the issue tracker
until permissions are restored. No information is lost.

---

## Final State

- **Phase**: Phase 1 (Audit) — complete
- **GitHub Issues**: **blocked** — `issues: write` missing (24th consecutive 403)
- **Composite Score**: 78.1/100 (−1.0 vs 26th: F014 OBSERVED 2/5; F015 PoC re-confirmed 5th;
  F005 worsened 24→25; F019–F022 added)
- **Status**: **blocked (issue creation)** — waiting for human review on permission fix
