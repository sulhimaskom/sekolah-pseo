# Phase 1 — Diagnostic & Comprehensive Scoring Report (25th verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ a3fc19e)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results

---

## Executive Summary

| Domain                                | Score       | Grade |
| ------------------------------------- | ----------- | ----- |
| **A. Code Quality**                   | **82.2/100** | B    |
| **B. System Quality**                 | **77.1/100** | B    |
| **C. Experience Quality**             | **85.4/100** | B    |
| **D. Delivery & Evolution Readiness** | **70.4/100** | C+   |
| **COMPOSITE**                         | **78.8/100** | B    |

Composite is consistent with the 22nd–24th runs (78.4–78.9). F014 observed **2/5
full-suite runs** this session (worst frequency since 1/6), F015 OS command
injection re-PoC-confirmed live (3rd+ consecutive), and a **NEW finding F018**
(schools.csv data regression) was identified.

## Global Penalties

| Rule                   | Penalty | Justification                                                                    |
| ---------------------- | ------- | -------------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 27ms, all budgets met     |
| Test failure           | −15     | ❌ F014 parallel test-file race **OBSERVED 2/5 runs** (intermittent flake)       |
| Critical vulnerability | −20     | ❌ F015 OS command injection PoC-confirmed live (3rd+ consecutive confirmation)  |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `npm ci`                                  | ✅ 131 packages, 0 vulnerabilities; ⚠️ EBADENGINE lint-staged@17.2.0 (F012)     |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 27ms, 74.07 pages/sec, 57.27MB RSS, budgets met   |
| `npm run lint` (eslint)                   | ✅ clean — 0 errors, 0 warnings                                                 |
| `npm run test:js` (×5)                    | ⚠️ 1025 pass / 1 fail nominal; **F014 observed 2 of 5 runs**                    |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass (100%)                                                            |
| `npm run test:js:coverage`                | ✅ 95.32% stmt / 92.28% branch / 96.63% funcs — above 80/75 thresholds          |
| `npm audit`                               | ✅ 0 vulnerabilities                                                            |
| `npm run format:check`                    | ❌ 18 files fail Prettier (F005) — all under docs/issues/ and docs/audit/       |
| `node scripts/check-workflow-security.js` | ❌ **12 violations: 2 CRITICAL + 10 HIGH** (F013, stable across runs)           |
| `gh issue create` (attempt)               | ❌ **403 `Resource not accessible by integration (createIssue)`** (F002)        |
| `gh api .../collaborators/github-actions[bot]/permission` | ❌ `{"permission":"none"}` — token has zero repo permissions  |

---

## A. CODE QUALITY (Weighted: 82.2/100)

| Criterion                    | Weight | Score | Weighted | Rationale                                                          |
| ---------------------------- | ------ | ----- | -------- | ------------------------------------------------------------------ |
| Correctness                  | 15     | 82    | 12.30    | F015 RCE (live PoC); F001 floating promise; F014 flake observed    |
| Readability & Naming         | 10     | 90    | 9.00     | Consistent camelCase, JSDoc on major modules                       |
| Simplicity                   | 10     | 85    | 8.50     | Straightforward CSV→HTML pipeline; CI layer overengineered (F007)  |
| Modularity & SRP             | 15     | 75    | 11.25    | styles.js 1275L (F008); homepage.js 716L; utils.js 415L            |
| Consistency                  | 5      | 85    | 4.25     | Consistent patterns; 18 docs files fail Prettier (F005)            |
| Testability                  | 15     | 82    | 12.30    | Coverage 95.32/92.28 met; pytest not wired (F009); no E2E (F010)   |
| Maintainability (Complexity) | 10     | 78    | 7.80     | No TODO/FIXME; oversized files; workflow sprawl (F007)              |
| Error Handling               | 10     | 88    | 8.80     | IntegrationError + codes; resilience patterns; some console.log    |
| Dependency Discipline        | 5      | 90    | 4.50     | 1 prod dep (pino); 0 vulns; lint-staged engine mismatch (F012)     |
| Determinism & Predictability | 5      | 70    | 3.50     | **F014 OBSERVED 2/5**; F001 floating promise; ETL updated_at churn |

### Criterion Details

#### A1. Correctness (82/100) ⚠️
- **Observations**: Build passes; 1025/1030 JS tests nominal; two confirmed defects
  re-verified live this run: (a) **F015** — `validateRepoUrl` (`scripts/fetch-data.js:55-97`)
  reconstructs the URL from `parsed.pathname`, which retains shell metacharacters
  (`;`, `$(...)`); the result reaches `execSync('git clone ...')`
  (`scripts/fetch-data.js:165-180`). Fresh PoC: `https://github.com/foo/bar;id.git`
  passes validation and executes `id.git` in the shell. (b) **F001** — floating promise at
  `scripts/fetch-data.js:338` (main() not awaited).
- **Evidence**: `node` PoC run (output `INJECTION_OK`), `scripts/fetch-data.js:55-97,165-180,338`
- **Impact/Risk**: Critical — remote code execution if a malicious repo URL is supplied
  via env/config; moderate — unhandled async control flow.
- **Deductions**: −10 (F015, overlapping B3 penalty), −8 (F014 flake).

#### A2. Readability & Naming (90/100)
- **Observations**: Consistent camelCase, descriptive module names, JSDoc on exported
  functions. `PageBuilder`/`BuildOrchestrator` services have well-named methods.
- **Evidence**: All files under `scripts/`, `src/`
- **Deductions**: −10 for a few long functions lacking extraction (styles.js).

#### A3. Simplicity (85/100)
- **Observations**: Core pipeline is simple (CSV → ETL → HTML). CI layer is not:
  6 workflows / ~2045 lines (F007), on-push.yml alone 533 lines with 12 sequential
  agent-flow steps.
- **Evidence**: `package.json`, `.github/workflows/` (6 files)
- **Deductions**: −15 (F007 workflow overcomplexity).

#### A4. Modularity & SRP (75/100) ⚠️
- **Observations**: Clean service boundary (PageBuilder/BuildOrchestrator). Persistent
  hotspots: `src/presenters/styles.js` 1275L (F008), `src/presenters/templates/homepage.js`
  716L, `scripts/utils.js` 415L (catch-all).
- **Evidence**: `wc -l` output (styles.js 1275; PageBuilder.test.js 897; utils.js 415)
- **Deductions**: −25 (F008 + oversized templates + catch-all utils.js).

#### A5. Consistency (85/100)
- **Observations**: Consistent 'use strict', JSDoc, IntegrationError patterns, async/await.
  Inconsistency: docs files not Prettier-formatted (18 files, F005); mixed console.log
  vs pino in a few modules.
- **Evidence**: `npm run format:check` → 18 warnings
- **Deductions**: −15 (F005 + console.log stragglers).

#### A6. Testability (82/100) ⚠️
- **Observations**: 1030 JS tests; coverage 95.32% stmt / 92.28% branch (thresholds
  80/75 met). Every script has a `.test.js`. Python: 27 tests, structure-level only.
  pytest passes (13) but is NOT wired into CI (F009). No E2E framework (F010).
- **Evidence**: `npm run test:js:coverage`, `tests/`, `package.json`
- **Deductions**: **−15 global penalty (F014 observed)**; −3 for F014 latent / no E2E (F010).

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

#### A10. Determinism (70/100) ⚠️
- **Observations**: Content-hash incremental builds; no global state. BUT F014
  parallel test-file race **OBSERVED 2/5 runs** this session (highest frequency this
  week), F001 floating promise, ETL `updated_at` churn.
- **Evidence**: 5 full-suite runs (RUN 2 and RUN 4 failed with
  `build-orchestrator.test.js:178 generates dist files via sharedPagesPromise` →
  `index.html should exist after sharedPagesPromise resolves`)
- **Deductions**: −30 (F014 dominant).

---

## B. SYSTEM QUALITY (RUNTIME) (Weighted: 77.1/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                          |
| ------------------------- | ------ | ----- | -------- | -------------------------------------------------- |
| Stability                 | 20     | 78    | 15.60    | Build stable; F014 observed 2/5; CI not gating     |
| Performance Efficiency    | 15     | 90    | 13.50    | 27ms build, 74 pages/sec, budgets met              |
| Security Practices        | 20     | 54    | 10.80    | **−20 F015 RCE**; −20 2 CRITICAL workflow viol.    |
| Scalability Readiness     | 15     | 82    | 12.30    | Incremental build + concurrency; data truncated    |
| Resilience & Fault Tol.   | 15     | 88    | 13.20    | Retry/circuit-breaker/timeout patterns present     |
| Observability             | 15     | 78    | 11.70    | Pino structured logging; some console.log          |

### Criterion Details

#### B1. Stability (78/100) ⚠️
- **Observations**: Build passes consistently. F014 **OBSERVED 2/5** full-suite runs
  this session (error: `ERR_ASSERTION` `index.html should exist...`).
- **Evidence**: `npm run test:js` ×5 → RUN 2 / RUN 4 failed, RUN 1/3/5 passed
- **Deductions**: −12 (F014), −10 (CI does not gate: on-push.yml runs 12 agent flows
  before any build/test gate).

#### B2. Performance Efficiency (90/100)
- **Observations**: 27ms full build, 74.07 pages/sec, 57.27MB peak RSS, all budgets met.
  NOTE: dataset now only 1 school (F018) — large-scale performance (3474 pages) is no
  longer exercised by CI.
- **Evidence**: `npm run build` output
- **Deductions**: −10 (scale behavior unverified since data truncation).

#### B3. Security Practices (54/100) 🔴
- **Observations**: Strong baseline (escapeHtml, validatePath, validateLatLon,
  escapeCsvField, security headers, no hardcoded secrets). BUT:
  - **F015** — OS command injection PoC-confirmed live (3rd+ consecutive run)
  - **F013** — `check-workflow-security.js` reports **12 violations: 2 CRITICAL
    (DUPLICATE_API_KEY in on-push.yml + parallel.yml) + 10 HIGH** (id-token: write ×4,
    actions: write ×4, secrets.GH_TOKEN ×2). This is the **5th+ regression** of fixes
    documented in SECURITY_AUDIT_NOTE.md.
  - **F004** — 57 `secrets.*` references, 10 distinct secret names across workflows.
- **Evidence**: `node scripts/check-workflow-security.js --json`, `SECURITY_AUDIT_NOTE.md`,
  F015 PoC
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

## C. EXPERIENCE QUALITY (UX / DX) (Weighted: 85.4/100)

| Criterion                 | Weight | Score | Weighted | Rationale                                     |
| ------------------------- | ------ | ----- | -------- | --------------------------------------------- |
| Accessibility (UX)        | 10     | 92    | 9.20     | ARIA landmarks, skip links, reduced-motion    |
| User Flow Clarity (UX)    | 10     | 88    | 8.80     | Breadcrumbs, search/filter, province nav      |
| Feedback & Error (UX)     | 10     | 80    | 8.00     | 404 page, validation messages                 |
| Responsiveness (UX)       | 10     | 92    | 9.20     | Mobile/tablet/desktop breakpoints             |
| API Clarity (DX)          | 12     | 88    | 10.56    | Well-documented scripts; F017 stale api.md    |
| Local Dev Setup (DX)      | 12     | 85    | 10.20    | npm ci works; F012 node version mismatch      |
| Documentation Accuracy    | 14     | 70    | 9.80     | F005 (18 unformatted); F016/F017 stale docs   |
| Debuggability (DX)        | 10     | 82    | 8.20     | Structured logging; error codes               |
| Build/Test Feedback (DX)  | 12     | 95    | 11.40    | 27ms build; 4.7s test suite                   |

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
  Node version confusion: `.nvmrc`=22, CI setup-node=20, runner v20.20.2,
  lint-staged@17.2.0 requires >=22.22.1 (F012). First `npm run test:js` fails with
  MODULE_NOT_FOUND until `npm ci` is run (expected, but no `pretest` hook).
- **Evidence**: `.nvmrc`, `on-pull.yml`, `npm ci` output
- **Deductions**: −15 (F012).

#### C7. Documentation Accuracy (70/100) 🔴
- **Observations**: 18 files fail `prettier --check` (F005). README references a
  `gitignore-check` workflow that does not exist in `.github/workflows/` (F016).
  `docs/api.md` documents non-existent `addNumbers()` (F017). 12+ stale historical
  audit reports (2026-06-09 … 2026-07-13) clutter `docs/` root. Many docs written in
  Indonesian (matches project locale) but audit reports in English — mixed.
- **Evidence**: `npm run format:check`, README.md:283, docs/api.md:553-574,
  `ls docs/audit-report-*.md`
- **Deductions**: −30 (F005, F016, F017, stale reports).

#### C8. Debuggability (82/100)
- **Observations**: Structured pino logs with timestamps; typed error codes; build
  performance metrics printed on every run.
- **Evidence**: `scripts/logger.js`, build output
- **Deductions**: −18 (some console.log; no `--debug` verbosity flag for CLI).

#### C9. Build/Test Feedback (95/100)
- **Observations**: 27ms build and 4.7s test suite give sub-10s feedback loops; clear
  PASS/FAIL summaries.
- **Evidence**: measured timings this run
- **Deductions**: −5 (F014 flake occasionally turns green→red).

---

## D. DELIVERY & EVOLUTION READINESS (Weighted: 70.4/100)

| Criterion                  | Weight | Score | Weighted | Rationale                                        |
| -------------------------- | ------ | ----- | -------- | ------------------------------------------------ |
| CI/CD Health               | 20     | 61    | 12.20    | F013 (12 violations); F002 blocked; F003         |
| Release & Rollback Safety  | 20     | 65    | 13.00    | Static site rollback easy; no release process    |
| Config & Env Parity        | 15     | 78    | 11.70    | .env.example good; F006 SITE_URL placeholder     |
| Migration Safety           | 15     | 70    | 10.50    | CSV-based; F018 data regression unplanned        |
| Technical Debt Exposure    | 15     | 68    | 10.20    | F007 sprawl; F008 oversized; stale docs          |
| Change Velocity & Blast R. | 15     | 85    | 12.75    | Dependabot; small focused PRs; static output     |

### Criterion Details

#### D1. CI/CD Health (61/100) ⚠️
- **Observations**: **F013** — 12 security violations across 4 workflows (2 CRITICAL +
  10 HIGH), 5th+ regression of documented fixes. **F002** — loop token cannot create
  issues (403, `permission: none`), 22nd consecutive blocked run. **F003** — global
  concurrency group serializes unrelated workflows. `on-pull.yml` has
  `continue-on-error: true` on checkout + setup-node (masks real failures). No
  build/test gate in `on-push.yml` before 12 sequential agent flows.
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
- **Observations**: CSV-based data, no DB migrations, static output. NEW **F018**:
  `data/schools.csv` truncated from 3474 schools (3475 lines) to 1 school (2 lines) in
  commit 151a07f (PR #498) with no documented rationale — site output dropped from 3474
  to 2 pages. If intentional (CI speed), it must be documented; if accidental, it is a
  silent production data regression.
- **Evidence**: `git show 151a07f --stat` (data/schools.csv: 3478→2 lines);
  `git show HEAD~20:data/schools.csv | wc -l` → 3475; current `wc -l` → 2
- **Deductions**: −30 (F018 undocumented data regression).

#### D5. Technical Debt Exposure (68/100)
- **Observations**: F007 (6 workflows/2045 lines), F008 (styles.js 1275L), F018 data
  regression, 12+ stale audit reports, 17 open findings persisting across 25 runs with
  zero remediations (loop blocked on issue creation).
- **Evidence**: workflow line counts, `docs/` listing, findings matrix
- **Deductions**: −32.

#### D6. Change Velocity & Blast Radius (85/100)
- **Observations**: Dependabot active; PRs small and focused; static-site deploys have
  minimal blast radius; merge rate high (24 verification PRs in 2 days).
- **Evidence**: git log, dependabot config
- **Deductions**: −15 (agent-branch divergence — origin/agent 25 behind, 1 ahead,
  last commit 2026-07-27; merge risk).

---

## Findings Re-Verification Matrix (17/17 re-verified + 1 NEW = 18)

| #   | Finding                                                    | Cat      | Pri | Re-verified | Fresh evidence (this run)                                          |
| --- | ---------------------------------------------------------- | -------- | --- | ----------- | ------------------------------------------------------------------ |
| 001 | Floating promise in `fetch-data.js` main()                 | bug      | P1  | ✅ valid    | `fetch-data.js:338` no `await`; sync `main()`                       |
| 002 | Missing `issues: write` + `workflows: write` (loop runner) | ci       | P1  | ✅ valid (22nd) | `gh issue create` → 403; collaborator permission `none`            |
| 003 | Global concurrency groups                                  | ci       | P2  | ✅ valid    | `on-push.yml:11` `group: global`                                   |
| 004 | Excessive CI secret exposure/aliasing                      | security | P1  | ✅ valid    | 57 `secrets.*` refs, 10 distinct names; API_KEY=GEMINI alias       |
| 005 | Prettier violations in docs                                | docs     | P3  | ✅ valid    | **18 files unformatted** (up from 16)                               |
| 006 | SITE_URL placeholder                                       | chore    | P2  | ✅ valid    | Build warning observed this run                                    |
| 007 | CI workflow overcomplexity                                 | refactor | P2  | ✅ valid    | 6 workflows, ~2045 lines, on-push 533L                             |
| 008 | styles.js oversized                                        | refactor | P2  | ✅ valid    | `wc -l` → 1275                                                     |
| 009 | pytest tooling not wired into CI                           | test     | P2  | ✅ valid    | pytest passes locally (13) but absent from all workflows           |
| 010 | Missing E2E/integration tests                              | test     | P3  | ✅ valid    | No e2e framework in package.json/workflows                         |
| 011 | Missing automated release process                          | ci       | P2  | ✅ valid    | No release workflow; 0 tags                                        |
| 012 | lint-staged engine mismatch                                | chore    | P3  | ✅ valid    | `.nvmrc`=22 vs Node v20.20.2 vs lint-staged>=22.22.1 (EBADENGINE)  |
| 013 | Workflow permissions violations (12)                       | security | P1  | ✅ valid    | `check-workflow-security.js` → 12 violations (2 CRITICAL + 10 HIGH)|
| 014 | Parallel test-file race (`dist/`)                          | test     | P1  | ✅ valid — **OBSERVED 2/5** | 2 failures in 5 full-suite runs this session                |
| 015 | OS command injection in `fetch-data.js`                    | security | P1  | ✅ **EXPLOITABLE** | `bar;id.git` passes validateRepoUrl → executes via execSync   |
| 016 | README documents non-existent `gitignore-check` workflow   | docs     | P3  | ✅ valid    | README.md:283; workflow absent from `.github/workflows/`           |
| 017 | `docs/api.md` documents `addNumbers()` that does not exist | docs     | P3  | ✅ valid    | docs/api.md:553-574; no such export in `scripts/utils.js`          |
| 018 | **NEW** — schools.csv data regression 3474→1 school       | bug      | P1  | ✅ NEW       | commit 151a07f (PR #498); 3475→2 lines; site now builds 2 pages    |

---

## Phase 1 Output — GitHub Issue Creation: BLOCKED (22nd consecutive)

Per Phase 1 mandate, GitHub issues must be created from all findings. **ATTEMPTED and
BLOCKED this run**:

- `gh issue create --title "TEST-PERMISSION-CHECK-2026-08-02"` → `GraphQL: Resource not
  accessible by integration (createIssue)`
- `gh api repos/sulhimaskom/sekolah-pseo/collaborators/github-actions[bot]/permission` →
  `{"permission":"none"}`
- This is the **22nd consecutive blocked run** (finding 002).

**Required human/org action** (documented in
`docs/issues/2026-08-01/01-root-cause-correction.md`):

1. Grant the loop runner token `issues: write` (and `workflows: write` for the loop to
   self-fix workflow files), OR
2. Provide a fine-grained PAT with `Issues: write` to the `pull` workflow.

**Fallback used (repo convention, 21+ prior runs)**: findings persisted as markdown in
`docs/issues/` with full evidence — this file serves as the issue record until
permissions are restored. No information is lost.

---

## Final State

- **Phase**: Phase 1 (Audit) — complete
- **GitHub Issues**: **blocked** — `issues: write` missing (22nd consecutive 403);
  requires human/org permission fix
- **Composite Score**: 78.8/100 (F014 observed 2/5 + F015 PoC re-confirmed + NEW F018)
- **Status**: **blocked (issue creation)** — waiting for human review on permission fix
