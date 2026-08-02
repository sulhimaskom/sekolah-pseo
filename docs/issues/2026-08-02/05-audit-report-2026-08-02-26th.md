# Phase 1 — Diagnostic & Comprehensive Scoring Report (26th verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ a8bdab9)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results

---

## Executive Summary

| Domain                                | Score       | Grade |
| ------------------------------------- | ----------- | ----- |
| **A. Code Quality**                   | **83.2/100** | B    |
| **B. System Quality**                 | **77.9/100** | B    |
| **C. Experience Quality**             | **85.1/100** | B    |
| **D. Delivery & Evolution Readiness** | **70.4/100** | C+   |
| **COMPOSITE**                         | **79.1/100** | B    |

Composite **+0.3 vs 25th run (78.8)** — first improvement in 4 runs. Driven by
**F014 NOT observed (0/5 full-suite runs, cleanest frequency in 6 sessions)** and
F015 OS command injection re-PoC-confirmed live (4th consecutive). Partially offset
by **F005 worsening: 24 docs files now fail Prettier** (up from 18). All 18 findings
re-verified; zero remediations remain blocked on issue-creation permission (F002, 23rd
consecutive 403).

## Global Penalties

| Rule                   | Penalty | Justification                                                                    |
| ---------------------- | ------- | -------------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 26ms, budgets met         |
| Test failure           | —       | ✅ **F014 NOT observed (0/5 runs)** — first clean session since 19th run          |
| Critical vulnerability | −20     | ❌ F015 OS command injection PoC-confirmed live (4th consecutive confirmation)    |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `npm ci`                                  | ✅ 0 vulnerabilities; ⚠️ lint-staged@17.2.0 engine mismatch persists (F012)      |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 26ms, 76.92 pages/sec, 57.05MB RSS, budgets met    |
| `npm run lint` (eslint)                   | ✅ clean — 0 errors, 0 warnings                                                 |
| `npm run test:js` (×5)                    | ✅ 1026 pass / 0 fail / 4 skip on ALL 5 runs — **F014 NOT observed (0/5)**       |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass (100%)                                                            |
| `python3 -m pytest tests/`                | ❌ `No module named pytest` on runner (F009 — pytest still not wired into CI)    |
| `npm run test:js:coverage`                | ✅ 95.32% stmt / 92.28% branch / 96.63% funcs — above 80/75 thresholds          |
| `npm audit`                               | ✅ 0 vulnerabilities                                                            |
| `npm run format:check`                    | ❌ **24 files fail Prettier (F005 — worsened from 18)** — all under docs/        |
| `node scripts/check-workflow-security.js` | ❌ **12 violations: 2 CRITICAL + 10 HIGH** (F013, stable across runs)           |
| `gh issue create` (attempt)               | ❌ **403 `Resource not accessible by integration (createIssue)`** (F002, 23rd)   |
| `gh api .../collaborators/github-actions[bot]/permission` | ❌ `{"permission":"none"}` — token has zero repo permissions  |

---

## A. CODE QUALITY (Weighted: 83.2/100)

| Criterion                    | Weight | Score | Weighted | Rationale                                                          |
| ---------------------------- | ------ | ----- | -------- | ------------------------------------------------------------------ |
| Correctness                  | 15     | 84    | 12.60    | F015 RCE (live PoC, 4th); F001 floating promise; F014 NOT observed |
| Readability & Naming         | 10     | 90    | 9.00     | Consistent camelCase, JSDoc on major modules                       |
| Simplicity                   | 10     | 85    | 8.50     | Straightforward CSV→HTML pipeline; CI layer overengineered (F007)  |
| Modularity & SRP             | 15     | 75    | 11.25    | styles.js 1275L (F008); homepage.js 716L; utils.js 415L            |
| Consistency                  | 5      | 80    | 4.00     | **F005 worsened: 24 docs files fail Prettier**; console.log stragglers |
| Testability                  | 15     | 84    | 12.60    | Coverage 95.32/92.28 met; pytest not wired (F009); no E2E (F010)   |
| Maintainability (Complexity) | 10     | 78    | 7.80     | No TODO/FIXME; oversized files; workflow sprawl (F007)              |
| Error Handling               | 10     | 88    | 8.80     | IntegrationError + codes; resilience patterns; some console.log    |
| Dependency Discipline        | 5      | 90    | 4.50     | 1 prod dep (pino); 0 vulns; lint-staged engine mismatch (F012)     |
| Determinism & Predictability | 5      | 82    | 4.10     | **F014 NOT observed (0/5)**; F001 floating promise; ETL churn      |
| **TOTAL**                    | **100** |       | **83.15** |                                                                    |

### Criterion Details

#### A1. Correctness (84/100) ⚠️
- **Observations**: Full suite green across 5 consecutive runs (1026 JS pass each). Two
  confirmed defects re-verified live: (a) **F015** — `validateRepoUrl`
  (`scripts/fetch-data.js:55-97`) reconstructs the URL from `parsed.pathname`, which
  retains shell metacharacters; fresh PoC against the exported function confirmed BOTH
  `https://github.com/foo/bar;id.git` AND `https://github.com/foo/bar$(id).git` pass
  validation (`VALIDATED: ... reaches execSync? true`). (b) **F001** — floating promise
  at `scripts/fetch-data.js:338` (`fetchFromGitHub(sourceRepo)` not awaited in sync
  `main()`).
- **Evidence**: `node` PoC output this run; `scripts/fetch-data.js:55-97,164,319-363`
- **Impact/Risk**: Critical — remote code execution if a malicious repo URL reaches the
  fetch path; moderate — unhandled async control flow.
- **Deductions**: −10 (F015, overlapping B3 penalty), −6 (F001 floating promise).

#### A2. Readability & Naming (90/100)
- **Observations**: Consistent camelCase, descriptive module names, JSDoc on exported
  functions. `PageBuilder`/`BuildOrchestrator` services have well-named methods.
- **Evidence**: All files under `scripts/`, `src/`
- **Deductions**: −10 for a few long functions lacking extraction (styles.js).

#### A3. Simplicity (85/100)
- **Observations**: Core pipeline is simple (CSV → ETL → HTML). CI layer is not:
  6 workflows / ~2045 lines (F007), on-push.yml alone 533 lines with 12 sequential
  agent-flow steps.
- **Evidence**: `package.json`, `.github/workflows/` (6 files, 2045 lines total)
- **Deductions**: −15 (F007 workflow overcomplexity).

#### A4. Modularity & SRP (75/100) ⚠️
- **Observations**: Clean service boundary (PageBuilder 275L / BuildOrchestrator 556L).
  Persistent hotspots: `src/presenters/styles.js` 1275L (F008),
  `src/presenters/templates/homepage.js` 716L, `scripts/utils.js` 415L (catch-all).
- **Evidence**: `wc -l` output (styles.js 1275; homepage.js 716; utils.js 415)
- **Deductions**: −25 (F008 + oversized templates + catch-all utils.js).

#### A5. Consistency (80/100) ⚠️
- **Observations**: Consistent 'use strict', JSDoc, IntegrationError patterns, async/await.
  **F005 worsened this run**: `npm run format:check` now reports **24 files** failing
  Prettier (up from 18 in the 25th run) — all under `docs/`. Mixed console.log vs pino
  in data-quality.js (2), interactive.js (24), check-workflow-security.js (12).
- **Evidence**: `npm run format:check` → 24 warnings; `grep -c "console.log"` on scripts
- **Deductions**: −20 (F005 worsening + console.log stragglers).

#### A6. Testability (84/100)
- **Observations**: 1030 JS tests; coverage 95.32% stmt / 92.28% branch (thresholds
  80/75 met). Every script has a `.test.js`. Python: 27 tests, structure-level only.
  pytest NOT installed on runner and absent from CI (F009). No E2E framework (F010).
  F014 latent (race window remains even though not observed this run).
- **Evidence**: `npm run test:js:coverage`, `tests/`, `package.json`, pytest failure
- **Deductions**: −10 (F009), −6 (F010 + F014 latent).

#### A7. Maintainability (78/100)
- **Observations**: No TODO/FIXME/HACK markers; clean module separation. Primary
  maintenance burden: oversized files + 6-workflow CI sprawl.
- **Evidence**: grep for TODO/FIXME → 0; file size analysis
- **Deductions**: −22 (styles.js 1275L, workflow sprawl F007).

#### A8. Error Handling (88/100)
- **Observations**: Custom IntegrationError with ERROR_CODES; retry/exponential backoff/
  circuit-breaker/timeout in `scripts/resilience.js`; no empty catches.
- **Evidence**: `scripts/fs-safe.js`, `scripts/resilience.js`, `scripts/validate-links.js`
- **Deductions**: −12 (a few console.error fallbacks outside the pino logger).

#### A9. Dependency Discipline (90/100)
- **Observations**: 1 production dependency (pino); dev deps minimal (c8, eslint,
  globals, husky, lint-staged, prettier). `npm audit` → 0 vulnerabilities.
- **Evidence**: `package.json`, `npm audit`
- **Deductions**: −10 (F012 — lint-staged@17.2.0 requires Node >=22.22.1, repo runs
  Node v20.20.2 while `.nvmrc` declares 22).

#### A10. Determinism (82/100) ⚠️
- **Observations**: Content-hash incremental builds; no global state. **F014 NOT observed
  (0/5 full-suite runs) — cleanest session since the 19th run** (prior: 2/5, 1/6, 5/13,
  3/11, 1/6). F001 floating promise and ETL `updated_at` churn remain.
- **Evidence**: 5 full-suite runs, all 1026/0/4 — zero `ERR_ASSERTION` occurrences
- **Deductions**: −18 (F001 + ETL churn; F014 latent but not observed).

---

## B. SYSTEM QUALITY (RUNTIME) (Weighted: 77.9/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                          |
| ------------------------- | ------ | ----- | -------- | -------------------------------------------------- |
| Stability                 | 20     | 82    | 16.40    | Build stable; **F014 NOT observed (0/5)**; CI not gating |
| Performance Efficiency    | 15     | 90    | 13.50    | 26ms build, 76.92 pages/sec, budgets met           |
| Security Practices        | 20     | 54    | 10.80    | **−20 F015 RCE**; −20 2 CRITICAL workflow viol.    |
| Scalability Readiness     | 15     | 82    | 12.30    | Incremental build + concurrency; data truncated    |
| Resilience & Fault Tol.   | 15     | 88    | 13.20    | Retry/circuit-breaker/timeout patterns present     |
| Observability             | 15     | 78    | 11.70    | Pino structured logging; some console.log          |

### Criterion Details

#### B1. Stability (82/100) ⚠️
- **Observations**: Build passes consistently (26ms). **F014 NOT observed across 5
  full-suite runs** this session (0/5) — first clean run since the 19th. Race window
  still latent in `scripts/build-orchestrator.test.js:178`.
- **Evidence**: `npm run test:js` ×5 → all 1026 pass / 0 fail
- **Deductions**: −10 (CI does not gate: on-push.yml runs 12 agent flows before any
  build/test gate), −8 (F014 latent).

#### B2. Performance Efficiency (90/100)
- **Observations**: 26ms full build, 76.92 pages/sec, 57.05MB peak RSS, all budgets met.
  NOTE: dataset still truncated to 1 school (F018) — large-scale performance (3474
  pages) remains unexercised by CI.
- **Evidence**: `npm run build` output
- **Deductions**: −10 (scale behavior unverified since data truncation).

#### B3. Security Practices (54/100) 🔴
- **Observations**: Strong baseline (escapeHtml, validatePath, validateLatLon,
  escapeCsvField, security headers, no hardcoded secrets). BUT:
  - **F015** — OS command injection PoC-confirmed live (4th consecutive run): both
    `;id.git` and `$(id).git` URLs pass `validateRepoUrl` and reach `execSync`
    (`/bin/sh: 1: id.git: not found` observed in shell this run).
  - **F013** — `check-workflow-security.js` reports **12 violations: 2 CRITICAL
    (DUPLICATE_API_KEY ×2: on-push.yml + parallel.yml) + 10 HIGH** (id-token: write ×4,
    actions: write ×4, secrets.GH_TOKEN ×2). This is the **6th+ regression** of fixes
    documented in SECURITY_AUDIT_NOTE.md.
  - **F004** — 57 `secrets.*` references, 10 distinct secret names across workflows
    (GITHUB_TOKEN ×14, IFLOW_API_KEY ×10, GEMINI_API_KEY ×10, CLOUDFLARE_* ×10, ...).
- **Evidence**: `node scripts/check-workflow-security.js`, `SECURITY_AUDIT_NOTE.md`,
  F015 PoC output this run
- **Deductions**: **−20 global penalty (F015 critical vuln)**; −20 (2 CRITICAL workflow
  violations); −12 (5+ HIGH remaining after CRITICAL accounting).

#### B4. Scalability Readiness (82/100)
- **Observations**: Incremental build via manifest, concurrency limits (BUILD 100 /
  VALIDATION 50), rate-limiter module. Historical 3474-school build succeeded at
  7252 pages/sec.
- **Evidence**: `scripts/build-pages.js`, `scripts/rate-limiter.js`, audit reports
- **Deductions**: −18 (current data truncated to 1 school — scale path not CI-exercised; F018).

#### B5. Resilience & Fault Tolerance (88/100)
- **Observations**: Circuit breaker, retry with exponential backoff, timeout wrapper,
  fs-safe wrappers with typed errors.
- **Evidence**: `scripts/resilience.js`, `scripts/fs-safe.js`
- **Deductions**: −12 (no chaos/injection testing; concurrency failure handling partial).

#### B6. Observability (78/100) ⚠️
- **Observations**: Pino structured logging with level control; build metrics
  (duration, throughput, RSS); per-page failure logging with reasons.
- **Evidence**: `scripts/logger.js`, build performance report
- **Deductions**: −22 (no request tracing; some console.log escapes; no metrics export
  endpoint).

---

## C. EXPERIENCE QUALITY (UX / DX) (Weighted: 85.1/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                     |
| ------------------------- | ------ | ----- | -------- | --------------------------------------------- |
| Accessibility (UX)        | 10     | 92    | 9.20     | ARIA landmarks, skip links, reduced-motion    |
| User Flow Clarity (UX)    | 10     | 88    | 8.80     | Breadcrumbs, search/filter, province nav      |
| Feedback & Error (UX)     | 10     | 80    | 8.00     | 404 page, validation messages                 |
| Responsiveness (UX)       | 10     | 92    | 9.20     | Mobile/tablet/desktop breakpoints             |
| API Clarity (DX)          | 12     | 88    | 10.56    | Well-documented scripts; F017 stale api.md    |
| Local Dev Setup (DX)      | 12     | 85    | 10.20    | npm ci works; F012 node version mismatch      |
| Documentation Accuracy    | 14     | 68    | 9.52     | **F005 worsened (24 unformatted)**; F016/F017 |
| Debuggability (DX)        | 10     | 82    | 8.20     | Structured logging; error codes               |
| Build/Test Feedback (DX)  | 12     | 95    | 11.40    | 26ms build; ~4.2s test suite                  |

### Criterion Details

#### C1. Accessibility (92/100)
- **Observations**: ARIA landmarks, skip-to-content links, `prefers-reduced-motion`,
  semantic HTML in templates.
- **Evidence**: `src/presenters/templates/shared/*.js`
- **Deductions**: −8 (no automated a11y test suite in CI).

#### C2. User Flow Clarity (88/100)
- **Observations**: Homepage search + province + education-type filters; breadcrumbs on
  school pages.
- **Evidence**: `src/presenters/templates/homepage.js`, `shared/navigation.js`
- **Deductions**: −12 (no in-app feedback when search yields zero results beyond empty list).

#### C3. Feedback & Error (80/100)
- **Observations**: Custom 404, validation warnings on CLI, structured error logging.
- **Evidence**: `public/404.html`, scripts CLI output
- **Deductions**: −20 (build-time failures surfaced only in logs, not in a user-visible
  report artifact).

#### C4. Responsiveness (92/100)
- **Observations**: Media-query breakpoints; grid layout; mobile-first CSS in styles.js.
- **Evidence**: `src/presenters/styles.js`
- **Deductions**: −8 (no visual regression tests).

#### C5. API Clarity (88/100)
- **Observations**: All scripts documented in docs/api.md with examples; consistent
  CLI flags (--json, --verbose).
- **Evidence**: `docs/api.md`, script headers
- **Deductions**: −12 (F017 — api.md documents `addNumbers()` at lines 553-574 but no
  such export exists in `scripts/utils.js`).

#### C6. Local Dev Setup (85/100)
- **Observations**: `npm ci` clean; `.devcontainer` present; husky + lint-staged.
  Node version confusion persists: `.nvmrc`=22, CI setup-node=20, runner v20.20.2,
  lint-staged@17.2.0 requires >=22.22.1 (F012). No `pretest` hook (first `test:js`
  run fails with MODULE_NOT_FOUND until `npm ci`).
- **Evidence**: `.nvmrc`, `on-pull.yml`, `npm ci` output
- **Deductions**: −15 (F012).

#### C7. Documentation Accuracy (68/100) 🔴
- **Observations**: **F005 worsened — 24 files now fail `prettier --check`** (up from
  18 in the 25th run; all under `docs/issues/` and `docs/audit/`). README references a
  `gitignore-check` workflow that does not exist in `.github/workflows/` (F016).
  `docs/api.md` documents non-existent `addNumbers()` (F017). 12+ stale historical
  audit reports (2026-06-09 … 2026-07-13) clutter `docs/` root.
- **Evidence**: `npm run format:check` (24 warnings), README.md:283, docs/api.md:553-574,
  `ls docs/audit-report-*.md`
- **Deductions**: −32 (F005 worsening + F016 + F017 + stale reports).

#### C8. Debuggability (82/100)
- **Observations**: Structured pino logs with timestamps; typed error codes; build
  performance metrics printed on every run.
- **Evidence**: `scripts/logger.js`, build output
- **Deductions**: −18 (some console.log; no `--debug` verbosity flag for CLI).

#### C9. Build/Test Feedback (95/100)
- **Observations**: 26ms build and ~4.2s test suite give sub-10s feedback loops; clear
  PASS/FAIL summaries.
- **Evidence**: measured timings this run (test suite duration 4173–4265 ms)
- **Deductions**: −5 (F014 flake window occasionally turns green→red).

---

## D. DELIVERY & EVOLUTION READINESS (Weighted: 70.4/100)

| Criterion                  | Weight | Score | Weighted | Rationale                                        |
| -------------------------- | ------ | ----- | -------- | ------------------------------------------------ |
| CI/CD Health               | 20     | 61    | 12.20    | F013 (12 violations); F002 blocked; F003         |
| Release & Rollback Safety  | 20     | 65    | 13.00    | Static site rollback easy; no release process    |
| Config & Env Parity        | 15     | 78    | 11.70    | .env.example good; F006 SITE_URL placeholder     |
| Migration Safety           | 15     | 70    | 10.50    | CSV-based; F018 data regression unplanned        |
| Technical Debt Exposure    | 15     | 68    | 10.20    | F007 sprawl; F008 oversized; F005 worsening      |
| Change Velocity & Blast R. | 15     | 85    | 12.75    | Dependabot; small focused PRs; static output     |

### Criterion Details

#### D1. CI/CD Health (61/100) ⚠️
- **Observations**: **F013** — 12 security violations across 4 workflows (2 CRITICAL +
  10 HIGH), 6th+ regression of documented fixes. **F002** — loop token cannot create
  issues (403, `permission: none`), 23rd consecutive blocked run. **F003** — global
  concurrency group serializes unrelated workflows (`on-push.yml:11` `group: global`).
  `on-pull.yml` has `continue-on-error: true` on checkout + setup-node (masks real
  failures). No build/test gate in `on-push.yml` before 12 sequential agent flows.
- **Evidence**: `check-workflow-security.js`, `gh issue create` 403, workflow files
- **Deductions**: −39 (composite of F013/F002/F003/masked failures).

#### D2. Release & Rollback Safety (65/100)
- **Observations**: Static HTML output makes rollback trivial (revert commit). BUT no
  release workflow, 0 git tags (F011), no versioned artifacts or changelog automation.
- **Evidence**: `git tag` → 0; `.github/workflows/` (no release workflow)
- **Deductions**: −35 (F011).

#### D3. Config & Env Parity (78/100)
- **Observations**: `.env.example` documents all vars; bounds-checked env parsing in
  `scripts/config.js`. SITE_URL defaults to `https://example.com` with a runtime
  warning (F006). Node version tri-state mismatch (F012).
- **Evidence**: `.env.example`, `scripts/config.js:50-54`, `.nvmrc` vs CI vs runner
- **Deductions**: −22 (F006 + F012 + undocumented IFLOW_API_KEY usage).

#### D4. Migration Safety (70/100) ⚠️
- **Observations**: CSV-based data, no DB migrations, static output. **F018 persists**:
  `data/schools.csv` remains truncated from 3474 schools (3475 lines) to 1 school
  (2 lines) in commit 151a07f (PR #498) with no documented rationale — site output
  remains 2 pages. If intentional (CI speed), it must be documented; if accidental, it
  is a silent production data regression.
- **Evidence**: `git show 151a07f --stat` (data/schools.csv: 3478→2 lines);
  `git show HEAD~20:data/schools.csv | wc -l` → 3475; current `wc -l` → 2
- **Deductions**: −30 (F018 undocumented data regression).

#### D5. Technical Debt Exposure (68/100)
- **Observations**: F007 (6 workflows/2045 lines), F008 (styles.js 1275L), F018 data
  regression, **F005 worsened (24 unformatted files)**, 12+ stale audit reports,
  18 open findings persisting across 26 runs with zero remediations (loop blocked on
  issue creation).
- **Evidence**: workflow line counts, `docs/` listing, findings matrix
- **Deductions**: −32.

#### D6. Change Velocity & Blast Radius (85/100)
- **Observations**: Dependabot active; PRs small and focused; static-site deploys have
  minimal blast radius; merge rate high (25 verification PRs in 2 days).
- **Evidence**: git log, dependabot config
- **Deductions**: −15 (agent-branch divergence — origin/agent 25 behind, 1 ahead,
  last commit 2026-07-27; merge risk).

---

## Findings Re-Verification Matrix (18/18 re-verified)

| #   | Finding                                                    | Cat      | Pri | Re-verified | Fresh evidence (this run)                                          |
| --- | ---------------------------------------------------------- | -------- | --- | ----------- | ------------------------------------------------------------------ |
| 001 | Floating promise in `fetch-data.js` main()                 | bug      | P1  | ✅ valid    | `fetch-data.js:338` no `await`; sync `main()`                       |
| 002 | Missing `issues: write` + `workflows: write` (loop runner) | ci       | P1  | ✅ valid (23rd) | `gh issue create` → 403; collaborator permission `none`            |
| 003 | Global concurrency groups                                  | ci       | P2  | ✅ valid    | `on-push.yml:11` `group: global`                                   |
| 004 | Excessive CI secret exposure/aliasing                      | security | P1  | ✅ valid    | 57 `secrets.*` refs, 10 distinct names; API_KEY=GEMINI alias       |
| 005 | Prettier violations in docs                                | docs     | P3  | ✅ valid — **WORSENED** | **24 files unformatted** (up from 18)                         |
| 006 | SITE_URL placeholder                                       | chore    | P2  | ✅ valid    | Build warning observed this run                                    |
| 007 | CI workflow overcomplexity                                 | refactor | P2  | ✅ valid    | 6 workflows, ~2045 lines, on-push 533L                             |
| 008 | styles.js oversized                                        | refactor | P2  | ✅ valid    | `wc -l` → 1275                                                     |
| 009 | pytest tooling not wired into CI                           | test     | P2  | ✅ valid    | pytest NOT installed on runner; absent from all workflows          |
| 010 | Missing E2E/integration tests                              | test     | P3  | ✅ valid    | No e2e framework in package.json/workflows                         |
| 011 | Missing automated release process                          | ci       | P2  | ✅ valid    | No release workflow; 0 tags                                        |
| 012 | lint-staged engine mismatch                                | chore    | P3  | ✅ valid    | `.nvmrc`=22 vs Node v20.20.2 vs lint-staged>=22.22.1 (EBADENGINE)  |
| 013 | Workflow permissions violations (12)                       | security | P1  | ✅ valid    | `check-workflow-security.js` → 12 violations (2 CRITICAL + 10 HIGH)|
| 014 | Parallel test-file race (`dist/`)                          | test     | P1  | ✅ valid — **NOT OBSERVED (0/5)** | 5 clean full-suite runs; race latent at build-orchestrator.test.js:178 |
| 015 | OS command injection in `fetch-data.js`                    | security | P1  | ✅ **EXPLOITABLE (4th)** | `bar;id.git` AND `bar$(id).git` both pass validateRepoUrl → execSync |
| 016 | README documents non-existent `gitignore-check` workflow   | docs     | P3  | ✅ valid    | README.md:283; workflow absent from `.github/workflows/`           |
| 017 | `docs/api.md` documents `addNumbers()` that does not exist | docs     | P3  | ✅ valid    | docs/api.md:553-574; no such export in `scripts/utils.js`          |
| 018 | schools.csv data regression 3474→1 school                  | bug      | P1  | ✅ valid    | commit 151a07f (PR #498); still 2 lines; site builds 2 pages       |

---

## Phase 1 Output — GitHub Issue Creation: BLOCKED (23rd consecutive)

Per Phase 1 mandate, GitHub issues must be created from all findings. **ATTEMPTED and
BLOCKED this run**:

- `gh issue create` → `GraphQL: Resource not accessible by integration (createIssue)`
- `gh api repos/sulhimaskom/sekolah-pseo/collaborators/github-actions[bot]/permission` →
  `{"permission":"none"}`
- This is the **23rd consecutive blocked run** (finding 002).

**Required human/org action** (documented in
`docs/issues/2026-08-01/01-root-cause-correction.md`):

1. Grant the loop runner token `issues: write` (and `workflows: write` for the loop to
   self-fix workflow files), OR
2. Provide a fine-grained PAT with `Issues: write` to the `pull` workflow.

**Fallback used (repo convention, 22+ prior runs)**: findings persisted as markdown in
`docs/issues/` with full evidence — this file serves as the issue record until
permissions are restored. No information is lost.

---

## Final State

- **Phase**: Phase 1 (Audit) — complete
- **GitHub Issues**: **blocked** — `issues: write` missing (23rd consecutive 403);
  requires human/org permission fix
- **Composite Score**: 79.1/100 (+0.3 vs 25th run: F014 NOT observed 0/5; F015 PoC
  re-confirmed 4th; F005 worsened 18→24 files)
- **Status**: **blocked (issue creation)** — waiting for human review on permission fix
