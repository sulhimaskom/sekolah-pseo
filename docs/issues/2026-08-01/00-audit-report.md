# Phase 1 — Comprehensive Scoring Report (ULW Loop) — 2026-08-01

**Evaluation Date**: 2026-08-01
**Evaluator**: Sisyphus (ULW Loop)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ ba4d01e)
**Trigger**: `on-pull.yml` hourly schedule (workflow 221418550, run 3375)

---

## Executive Summary

| Domain                                | Score      | Grade |
| ------------------------------------- | ---------- | ----- |
| **A. Code Quality**                   | **84.6/100** | B   |
| **B. System Quality**                 | **81.3/100** | B   |
| **C. Experience Quality**             | **86.4/100** | B   |
| **D. Delivery & Evolution Readiness** | **70.9/100** | C+  |
| **COMPOSITE**                         | **80.8/100** | B   |

Delta vs 2026-07-31 (82.44): **-1.6** — driven by conservative re-scoring of
workflow security violations (2 CRITICAL) and confirmation that the issue-tracking
blocker persists. No regression in application code.

## Global Penalties

| Rule                   | Penalty | Justification                                                                 |
| ---------------------- | ------- | ----------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 30ms, budgets met       |
| Test failure           | —       | ✅ PASS — JS 1026 pass/0 fail/4 skip (1030), Python 27/27 (100%)               |
| Critical vulnerability | —       | ✅ PASS — `npm audit` → 0 vulnerabilities                                      |

---

## A. CODE QUALITY (Weighted: 84.6/100)

| Criterion                    | Weight | Score | Weighted |
| ---------------------------- | ------ | ----- | -------- |
| Correctness                  | 15     | 90    | 13.50    |
| Readability & Naming         | 10     | 90    | 9.00     |
| Simplicity                   | 10     | 85    | 8.50     |
| Modularity & SRP             | 15     | 75    | 11.25    |
| Consistency                  | 5      | 80    | 4.00     |
| Testability                  | 15     | 85    | 12.75    |
| Maintainability (Complexity) | 10     | 78    | 7.80     |
| Error Handling               | 10     | 88    | 8.80     |
| Dependency Discipline        | 5      | 95    | 4.75     |
| Determinism & Predictability | 5      | 85    | 4.25     |
| **TOTAL**                    | **100** |       | **84.60** |

### A1. Correctness (90/100)
- **Observations**: Full suite green (1026 JS + 27 Python). Build 0 failures.
  Confirmed latent defect: `scripts/fetch-data.js:338` `const csvPath = fetchFromGitHub(sourceRepo);`
  — no `await`, `main()` is sync (line 319). Known intermittent flake (1 failure
  observed in 07-31 full run, 0 in subsequent runs).
- **Evidence**: `scripts/fetch-data.js:319,338`; test runs above.
- **Impact**: Low-moderate — floating promise can exit before fetch completes.
- **Deductions**: -10 for confirmed un-awaited async call (finding 001).

### A2. Readability & Naming (90/100)
- **Observations**: Consistent camelCase, JSDoc on major modules, descriptive names.
- **Evidence**: All modules reviewed.
- **Risk**: Low.

### A3. Simplicity (85/100)
- **Observations**: Straightforward CSV→HTML pipeline, clean separation.
- **Evidence**: Project structure.
- **Risk**: Low.

### A4. Modularity & SRP (75/100) ⚠️
- **Observations**: `src/presenters/styles.js` = **1275 lines** — single module handles
  all CSS generation, violating SRP.
- **Evidence**: `wc -l src/presenters/styles.js` → 1275 (finding 008).
- **Impact**: Medium — every style change risks the largest module in the repo.

### A5. Consistency (80/100) ⚠️
- **Observations**: `scripts/data-quality.js` uses `console.log` (2 calls, lines
  364/366) instead of the structured `logger.*` API used everywhere else.
- **Evidence**: `grep -c "console.log" scripts/data-quality.js` → 2.
- **Impact**: Low — operational inconsistency only.

### A6. Testability (85/100)
- **Observations**: Coverage 95.38% stmts / 92.3% branch / 96.63% funcs — all above
  thresholds (80/75). 97 suites. BUT `pytest` not installed (`No module named
  pytest`), so pytest.ini-based suite cannot run (finding 009); no E2E tests (finding 010).
- **Evidence**: `npm run coverage` output; `python3 -m pytest --version` fails.
- **Impact**: Medium — Python tests are thin and pytest tooling unused.

### A7. Maintainability (78/100)
- **Observations**: styles.js (1275L) and workflow files (2045L total) concentrate risk.
- **Evidence**: Line counts; finding 008, finding 007.
- **Impact**: Medium.

### A8. Error Handling (88/100)
- **Observations**: IntegrationError class, consistent try-catch, path traversal
  protection, resilience patterns (circuit breaker, retry, rate limiter).
- **Evidence**: `scripts/config.js`, `scripts/resilience.js`, `scripts/rate-limiter.js`.
- **Impact**: Low.

### A9. Dependency Discipline (95/100)
- **Observations**: 1 runtime dep (pino), small devDeps set, 0 vulnerabilities.
- **Evidence**: `package.json`, `npm audit`.
- **Impact**: Low.

### A10. Determinism (85/100)
- **Observations**: Content-hash incremental builds, no global state — but the
  floating promise (finding 001) makes `fetch-data` non-deterministic in exit timing.
- **Evidence**: manifest pattern; `fetch-data.js:338`.
- **Impact**: Low-moderate.

---

## B. SYSTEM QUALITY (RUNTIME) (Weighted: 81.3/100)

| Criterion                    | Weight | Score | Weighted |
| ---------------------------- | ------ | ----- | -------- |
| Stability                    | 20     | 85    | 17.00    |
| Performance Efficiency       | 15     | 90    | 13.50    |
| Security Practices           | 20     | 68    | 13.60    |
| Scalability Readiness        | 15     | 82    | 12.30    |
| Resilience & Fault Tolerance | 15     | 88    | 13.20    |
| Observability                | 15     | 78    | 11.70    |
| **TOTAL**                    | **100** |       | **81.30** |

### B1. Stability (85/100)
- **Observations**: Build/test pass consistently; 4th consecutive clean full suite.
  Residual: floating-promise flake + no CI gate before long AI pipelines.
- **Evidence**: Full gate run 2026-08-01; findings 001, 007.
- **Deductions**: -10 intermittent flake, -5 CI not gating (on-push.yml).

### B2. Performance (90/100)
- **Observations**: 30ms build, 66 pages/sec, 57.6MB peak RSS, budgets met.
- **Evidence**: `npm run build` performance report.
- **Risk**: Low.

### B3. Security Practices (68/100) ⚠️
- **Observations**: 0 npm vulns, path-traversal/XSS protections present. BUT
  `check-workflow-security.js` reports **12 violations incl. 2 CRITICAL
  (DUPLICATE_API_KEY in parallel.yml + on-push.yml)**; `GH_TOKEN` instead of
  `GITHUB_TOKEN` in orchestrator.yml + architect-agent.yml; `id-token: write` /
  `actions: write` in non-OIDC/non-merge workflows; secret-name aliasing
  (API_KEY=GEMINI_API_KEY) in on-push.yml env.
- **Evidence**: `node scripts/check-workflow-security.js` (findings 013, 004).
- **Impact**: Medium-high — duplicated keys and over-privileged tokens expand the
  blast radius of a leaked secret.
- **Deductions**: -20 (2 CRITICAL), -12 (5 HIGH across workflows).

### B4. Scalability (82/100)
- **Observations**: Concurrency controls, rate limiting, sitemap splitting at 50K URLs.
- **Evidence**: `config.js`, `sitemap.js`, `rate-limiter.js`.
- **Risk**: Low.

### B5. Resilience (88/100)
- **Observations**: Circuit breaker, exponential backoff, rate limiter, graceful handling.
- **Evidence**: `resilience.js`, `fs-safe.js`.
- **Risk**: Low.

### B6. Observability (78/100) ⚠️
- **Observations**: Pino structured logging in most modules; `console.log` in
  data-quality.js; no centralized monitoring/alerting.
- **Evidence**: `logger.js`, `data-quality.js:364-366`.
- **Impact**: Medium — production-only tools rely on stdout.

---

## C. EXPERIENCE QUALITY (86.4/100)

### UX Criteria
| Criterion                  | Score | Notes                                                                |
| -------------------------- | ----- | -------------------------------------------------------------------- |
| Accessibility              | 92    | ARIA landmarks, skip links, sr-only, semantic HTML, reduced-motion    |
| User Flow Clarity          | 85    | Clear navigation, breadcrumbs, search/filter, province drill-down     |
| Feedback & Error Messaging | 78    | Status messages during build; limited user-facing error feedback      |
| Responsiveness             | 88    | Mobile-first, responsive breakpoints, system font stack               |

**UX Total**: 85.75

### DX Criteria
| Criterion                | Score | Notes                                                              |
| ------------------------ | ----- | ------------------------------------------------------------------ |
| API Clarity              | 88    | JSDoc, clear exports                                               |
| Local Dev Setup          | 90    | README, npm scripts, CLI menu, devcontainer                        |
| Documentation Accuracy   | 82    | Extensive docs; SITE_URL placeholder warning (finding 006); 3 unformatted docs files |
| Debuggability            | 80    | Structured logging, named errors, build perf metrics               |
| Build/Test Feedback Loop | 95    | Build 30ms, tests <5s — exceptionally fast                         |

**DX Total**: 87.0
**Experience Quality**: (85.75 + 87.0) / 2 = **86.4**

---

## D. DELIVERY & EVOLUTION READINESS (Weighted: 70.9/100)

| Criterion                      | Weight | Score | Weighted |
| ------------------------------ | ------ | ----- | -------- |
| CI/CD Health                   | 20     | 62    | 12.40    |
| Release & Rollback Safety      | 20     | 65    | 13.00    |
| Config & Env Parity            | 15     | 78    | 11.70    |
| Migration Safety               | 15     | 70    | 10.50    |
| Technical Debt Exposure        | 15     | 70    | 10.50    |
| Change Velocity & Blast Radius | 15     | 85    | 12.75    |
| **TOTAL**                      | **100** |       | **70.85** |

### D1. CI/CD Health (62/100) ⚠️
- **Observations**: 6 workflows, 2045 lines total. on-push.yml (533L) runs 12
  sequential opencode flows with NO build/lint/test gate first. Global concurrency
  group in on-push.yml:11 (`group: global`). Missing `issues: write` in the actual
  loop runner (on-pull.yml) — root cause of 7 blocked audits.
- **Evidence**: workflow files; findings 002, 003, 007, 013.
- **Impact**: High — hours of AI compute wasted on broken code; issue tracking dead.
- **Deductions**: -15 missing gate, -10 overcomplexity, -8 concurrency/permissions.

### D2. Release & Rollback (65/100)
- **Observations**: No release workflow, no version tags, no rollback procedure.
- **Evidence**: No release config; version pinned 1.0.0 (finding 011).
- **Impact**: Medium.

### D3. Config & Env Parity (78/100)
- **Observations**: Centralized config with env support, but SITE_URL defaults to
  `https://example.com` placeholder (warning at build); no startup env validation.
- **Evidence**: `scripts/config.js:50-54` (finding 006).
- **Impact**: Low-moderate — placeholder leaks into prod if env missing.

### D4. Migration Safety (70/100)
- **Observations**: CSV data, idempotent ETL, no formal migration scripts.
- **Evidence**: `scripts/etl.js`.
- **Impact**: Medium — schema changes require reprocessing.

### D5. Technical Debt (70/100)
- **Observations**: styles.js 1275L; 3 unformatted docs files (07-30); lint-staged
  engine mismatch (`.nvmrc`=22, lint-staged@17.2.0 needs >=22.22.1, runner Node
  v20.20.2) — finding 012.
- **Evidence**: findings 005, 008, 012.

### D6. Change Velocity (85/100)
- **Observations**: Modular architecture, atomic commits, fast feedback loop.
- **Evidence**: Git history (TASK-xxx cadence), build perf.
- **Risk**: Low.

---

## Findings Summary (all 13 re-verified fresh, 2026-08-01)

| #   | Finding                                       | Cat       | Priority | Status |
| --- | --------------------------------------------- | --------- | -------- | ------ |
| 001 | Floating promise in fetch-data.js main()      | bug       | P1       | valid  |
| 002 | Missing `issues: write` (loop runner)         | ci        | P1       | valid  |
| 003 | Global concurrency group                      | ci        | P2       | valid  |
| 004 | Excessive CI secret exposure/aliasing         | security  | P1       | valid  |
| 005 | Prettier violations (docs/issues/2026-07-30)  | docs      | P3       | valid  |
| 006 | SITE_URL placeholder                          | chore     | P2       | valid  |
| 007 | CI workflow overcomplexity (2045 lines)       | refactor  | P2       | valid  |
| 008 | styles.js oversized (1275 lines)              | refactor  | P2       | valid  |
| 009 | pytest missing / thin Python tests            | test      | P2       | valid  |
| 010 | Missing E2E/integration tests                 | test      | P3       | valid  |
| 011 | Missing automated release process             | ci        | P2       | valid  |
| 012 | lint-staged engine mismatch                   | chore     | P3       | valid  |
| 013 | Workflow permissions violations (12)          | security  | P1       | valid  |

**NEW this run**: precise root cause for 002 (see `01-root-cause-correction.md`):
the actual loop runner is `on-pull.yml`, and unblocking requires `workflows: write`
(not just `issues: write`) — the token can never self-push workflow files.

## Final State

- **Phase**: Phase 1 (Audit) — complete
- **GitHub Issues**: **blocked** — `issues: write` missing AND workflow-file pushes
  rejected without `workflows: write` (human/org action required)
- **Composite Score**: 80.8/100
- **Status**: blocked (issue creation); waiting for human review on permission fix
