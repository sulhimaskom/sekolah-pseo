# COMPREHENSIVE QUALITY AUDIT REPORT

**Evaluation Date**: 2026-07-31
**Auditor**: Autonomous ULW Loop (Phase 1 - Audit Mode)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main
**Previous Audit**: 2026-07-30

---

## Global Penalty Check

| Check                    | Status         | Evidence                                                                 |
| ------------------------ | -------------- | ------------------------------------------------------------------------ |
| Build                    | ✅ PASS        | 2 pages, 0 failed, 39ms, all performance budgets met                     |
| JS Tests (full suite)    | ❌ **1 FAIL**  | 1025/1030 pass, **1 fail** (fetch-data.test.js), 4 skipped               |
| JS Tests (isolated)      | ✅ PASS        | fetch-data.test.js: 51/51 pass × 3 runs → **order-dependent async leak** |
| Python Tests (run_tests) | ✅ PASS        | 27/27 pass (0.12s)                                                       |
| Python Tests (pytest)    | ⚠️ NOT RUN     | pytest not installed in runner env                                       |
| Lint                     | ✅ PASS        | 0 errors                                                                 |
| Format (Prettier)        | ❌ **3 files** | docs/issues/2026-07-30/{00,01,02}*.md                                    |
| Coverage                 | ✅ PASS        | Statements 95.32%, Branches 92.28%, Functions 96.63% (thresholds met)    |
| npm audit                | ✅ PASS        | 0 vulnerabilities                                                        |
| **Penalties applied**    | **-15**        | Test failure → Code Quality / Testability                                |

### Global Penalty Justification

- **Test failure (Code Quality / Testability -15)**: `npm run test:js` fails 1/1030 tests.
  `scripts/fetch-data.test.js` test "handles fetch error gracefully when cached fallback succeeds"
  (line 402) generates async activity after the test ended → `unhandledRejection`
  `IntegrationError: Operation failed after 3 attempt(s)`. Isolated runs pass 51/51 × 3 →
  order-dependent flakiness caused by a **floating promise** (see Issue 001).

---

## A. CODE QUALITY (Weighted Score: **82.40/100**)

| Criterion                    | Weight | Score | Weighted | Rationale                                                                     |
| ---------------------------- | ------ | ----- | -------- | ----------------------------------------------------------------------------- |
| Correctness                  | 15%    | 88    | 13.20    | Build passes; 1029/1030 tests pass. One async defect in fetch-data.js         |
| Readability & Naming         | 10%    | 90    | 9.00     | Consistent camelCase, JSDoc, 'use strict' everywhere                          |
| Simplicity                   | 10%    | 78    | 7.80     | Clean CSV→HTML pipeline; CI overengineered (2045 lines, 7 workflows)          |
| Modularity & SRP             | 15%    | 84    | 12.60    | Good layering (PageBuilder/BuildOrchestrator); styles.js 1275 lines oversized |
| Consistency                  | 5%     | 90    | 4.50     | CommonJS, IntegrationError, pino logging uniform                              |
| Testability                  | 15%    | 75    | 11.25    | **-15 global penalty**. 95.32% coverage but flaky suite; async leak           |
| Maintainability (Complexity) | 10%    | 80    | 8.00     | styles.js 1275 lines; 0 TODO/FIXME in source                                  |
| Error Handling               | 10%    | 82    | 8.20     | IntegrationError + retry/circuit-breaker; but floating promise defeats catch  |
| Dependency Discipline        | 5%     | 95    | 4.75     | Only pino prod dep; 0 vulnerabilities                                         |
| Determinism & Predictability | 5%     | 82    | 4.10     | Manifest builds deterministic; test order-dependence breaks determinism       |

### Criterion Details

#### Correctness (88/100)

- **Observations**: Build passes 0-failed. 1029/1030 JS tests pass. 27/27 Python tests pass. One defect: `main()` in fetch-data.js never awaits async `fetchFromGitHub()` → rejection escapes sync try/catch.
- **Evidence**: `scripts/fetch-data.js:338` (`const csvPath = fetchFromGitHub(sourceRepo);`), `scripts/resilience.js:213` (`async function retry`), test log `IntegrationError: Operation failed after 3 attempt(s)`
- **Impact/Risk**: Medium — cache-fallback path unreachable in production; test suite red
- **Score Rationale**: -12 for the async correctness defect

#### Readability & Naming (90/100)

- **Observations**: Clear module names, JSDoc annotations on all public functions.
- **Evidence**: All files in scripts/, src/

#### Simplicity (78/100)

- **Observations**: Core pipeline is simple and clear. CI layer is 2045 lines across 7 workflows with 12 sequential opencode steps (12 × 90-min timeouts).
- **Evidence**: `.github/workflows/` (2045 total lines: on-push 533, parallel 456, on-pull 437, architect-agent 216, opencode 203, orchestrator 200)
- **Impact/Risk**: High — CI complexity is the top maintainability concern

#### Modularity & SRP (84/100)

- **Observations**: BuildOrchestrator (556 lines) + PageBuilder separation is good. styles.js at 1275 lines violates SRP.
- **Evidence**: `wc -l` analysis

#### Consistency (90/100)

- **Observations**: Uniform CommonJS, IntegrationError pattern, pino structured logging.
- **Evidence**: All modules reviewed

#### Testability (75/100)

- **Observations**: 1030 tests at 95.32% statement coverage. **Suite is non-deterministic**: fetch-data.test.js fails in full run, passes in isolation.
- **Evidence**: Full run `# fail 1`; isolated `# pass 51 / # fail 0` × 3
- **Score Rationale**: -15 global penalty (test failure) on top of base 90

#### Maintainability (80/100)

- **Observations**: styles.js (1275) is the primary concern. 0 TODO/FIXME.
- **Evidence**: `wc -l`, grep

#### Error Handling (82/100)

- **Observations**: IntegrationError with codes, retry/timeout/circuit-breaker, HTML escaping. BUT `main()` calls async function without await → try/catch cannot catch the rejection → `useCachedData()` fallback dead code.
- **Evidence**: `scripts/fetch-data.js:319-341`, `scripts/resilience.js:213`
- **Score Rationale**: -10 for the unhandled-rejection path

#### Dependency Discipline (95/100)

- **Observations**: Single production dependency (pino). npm audit clean.
- **Evidence**: package.json, `npm install` → `found 0 vulnerabilities`

#### Determinism & Predictability (82/100)

- **Observations**: Deterministic page generation with manifest. Test order-dependence and floating promise introduce nondeterminism.
- **Evidence**: Test suite behavior, fetch-data.js

---

## B. SYSTEM QUALITY (RUNTIME) (Weighted Score: **86.20/100**)

| Criterion                    | Weight | Score | Weighted | Rationale                                                                 |
| ---------------------------- | ------ | ----- | -------- | ------------------------------------------------------------------------- |
| Stability                    | 20%    | 90    | 18.00    | Build+lint stable; 1 flaky test in suite                                  |
| Performance Efficiency       | 15%    | 92    | 13.80    | Build 39ms (2 schools); suite 5.4s/1030 tests; memoized CSS               |
| Security Practices           | 20%    | 82    | 16.40    | HTML escaping, CSP, 0 vulns; CI exposes 8+ secrets with duplicate aliases |
| Scalability Readiness        | 15%    | 86    | 12.90    | Static site, rate limiter, sitemap splitting                              |
| Resilience & Fault Tolerance | 15%    | 82    | 12.30    | Circuit breaker + retry + timeout; but cache fallback unreachable         |
| Observability                | 15%    | 85    | 12.75    | Pino structured logs, build perf report; stdout-only                      |

### Criterion Details

#### Stability (90/100)

- **Observations**: Build, lint, Python tests deterministic. JS suite has 1 order-dependent failure.
- **Evidence**: Full vs isolated test runs

#### Performance Efficiency (92/100)

- **Observations**: Build 39ms/2 pages; 1030 tests in ~5.4s; CSS memoization (TASK-068).
- **Evidence**: Build performance report, test duration

#### Security Practices (82/100)

- **Observations**: HTML escaping, CSP, security headers, 0 npm vulns. **CI exposes 9 secrets in env blocks across 6 workflows with duplicate aliases** (`API_KEY` = `GEMINI_API_KEY`, `VITE_SUPABASE_ANON_KEY` = `VITE_SUPABASE_KEY`, `SUPABASE_ANON_KEY` redundant).
- **Evidence**: `.github/workflows/on-push.yml:18-28`, 39 `secrets.` references across 6 workflow files
- **Impact/Risk**: High — secret sprawl to AI agents running in CI
- **Score Rationale**: -8 for CI secret hygiene

#### Scalability Readiness (86/100)

- **Observations**: Static generation scales horizontally; RateLimiter + concurrency limits (BUILD_CONCURRENCY_LIMIT=100).

#### Resilience & Fault Tolerance (82/100)

- **Observations**: Retry with backoff, circuit breaker, timeout enforcement exist. **Floating promise in main() makes the cache fallback path dead code** — fetch failures will not degrade gracefully in production.
- **Evidence**: fetch-data.js main(), resilience.js retry()
- **Score Rationale**: -10 for broken fallback path

#### Observability (85/100)

- **Observations**: Pino JSON logging, build performance report (Status: PASS, memory delta, throughput). Stdout-only — no log file sinks.

---

## C. EXPERIENCE QUALITY (UX / DX) (Weighted Score: **87.30/100**)

### UX Criteria

| Criterion                  | Score | Evidence                                                                               |
| -------------------------- | ----- | -------------------------------------------------------------------------------------- |
| Accessibility              | 92    | ARIA roles + alt text in all templates (homepage 22, school 6, province 3); WCAG 2.1 A |
| User Flow Clarity          | 86    | Homepage search + province nav; breadcrumbs                                            |
| Feedback & Error Messaging | 84    | Graceful build errors, pino logging; placeholder SITE_URL warning                      |
| Responsiveness             | 88    | Mobile-first, responsive CSS in styles.js                                              |

### DX Criteria

| Criterion                | Score | Evidence                                                                        |
| ------------------------ | ----- | ------------------------------------------------------------------------------- |
| API Clarity              | 88    | docs/api.md, JSDoc annotations                                                  |
| Local Dev Setup          | 90    | README, .env.example, .devcontainer, npm scripts                                |
| Documentation Accuracy   | 85    | 3 prettier violations in docs/issues/2026-07-30; stale audit reports accumulate |
| Debuggability            | 82    | Structured logging; floating promise hard to trace (unhandledRejection)         |
| Build/Test Feedback Loop | 95    | Full suite in ~5.5s; `npm run dev` = lint + test                                |

---

## D. DELIVERY & EVOLUTION READINESS (Weighted Score: **74.60/100**)

| Criterion                      | Weight | Score | Weighted | Rationale                                                                                       |
| ------------------------------ | ------ | ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CI/CD Health                   | 20%    | 68    | 13.60    | 7 workflows / 2045 lines; `group: global` concurrency serializes all pushes; no `issues: write` |
| Release & Rollback Safety      | 20%    | 72    | 14.40    | Static artifacts = trivial rollback; no automated release process                               |
| Config & Env Parity            | 15%    | 78    | 11.70    | .env.example present; SITE_URL placeholder default; secret alias duplication                    |
| Migration Safety               | 15%    | 82    | 12.30    | Manifest-based incremental builds; ADRs exist (docs/adr/)                                       |
| Technical Debt Exposure        | 15%    | 78    | 11.70    | styles.js 1275 lines; floating promise; CI complexity                                           |
| Change Velocity & Blast Radius | 15%    | 72    | 10.80    | Global concurrency group + 90-min sequential steps throttle throughput                          |

### Criterion Details

#### CI/CD Health (68/100)

- **Observations**: on-push.yml `concurrency.group: global` blocks parallel pushes repo-wide; permissions block lacks `issues: write`; 12 sequential 90-min opencode steps.
- **Evidence**: `.github/workflows/on-push.yml:6-12`, verified `createIssue` rejected by token (GraphQL + REST)
- **Score Rationale**: -32 for concurrency + permissions + complexity

#### Release & Rollback Safety (72/100)

- **Observations**: No release workflow or version tags; Pages deployment via pages-build-deployment. Static site means rollback = re-deploy old commit.

#### Config & Env Parity (78/100)

- **Observations**: `SITE_URL` defaults to `https://example.com` placeholder (build warns). Duplicate secret aliases across workflows. `.env.example` current.
- **Evidence**: scripts/config.js:50-54, build log warning

#### Technical Debt Exposure (78/100)

- **Observations**: Oversized styles.js; floating promise; CI overcomplexity; no E2E tests; thin Python tests.

---

## COMPOSITE SCORE

| Domain                            | Score     |
| --------------------------------- | --------- |
| A. Code Quality                   | 82.40     |
| B. System Quality                 | 86.20     |
| C. Experience Quality             | 87.30     |
| D. Delivery & Evolution Readiness | 74.60     |
| **Composite Score**               | **82.63** |

**Delta vs 2026-07-30**: -2.28 (84.91 → 82.63), driven by the new flaky-test finding (-15 penalty on Testability) and confirmation that 07-30 hardening changes (issues:write, concurrency scoping) were **never pushed** to main.

---

## Identified Issues (issue-ready records)

| #   | Issue                                                                             | Category | Priority | New?      | File                                     |
| --- | --------------------------------------------------------------------------------- | -------- | -------- | --------- | ---------------------------------------- |
| 1   | Floating promise in fetch-data.js main() — cache fallback dead code + flaky suite | bug      | P1       | **NEW**   | 001-floating-promise-fetch-data.md       |
| 2   | on-push.yml missing `issues: write` — automated issue creation blocked            | ci       | P1       | Recurring | 002-missing-issues-write-permission.md   |
| 3   | Global + unscoped concurrency groups serialize CI                                 | ci       | P1       | Recurring | 003-ci-concurrency-groups.md             |
| 4   | Excessive CI secret exposure with duplicate aliases                               | security | P1       | Recurring | 004-ci-secret-exposure.md                |
| 5   | Prettier format violations in docs/issues/2026-07-30/*                            | docs     | P3       | **NEW**   | 005-docs-formatting-violations.md        |
| 6   | SITE_URL placeholder default produces example.com URLs in artifacts               | chore    | P2       | **NEW**   | 006-site-url-placeholder.md              |
| 7   | CI/CD workflow overcomplexity (2045 lines, 7 workflows)                           | ci       | P2       | Recurring | 007-ci-workflow-overcomplexity.md        |
| 8   | styles.js (1275 lines) oversized                                                  | refactor | P2       | Recurring | 008-oversized-styles-js.md               |
| 9   | Insufficient Python test coverage; pytest not installed                           | test     | P2       | Recurring | 009-insufficient-python-test-coverage.md |
| 10  | Missing E2E/integration tests                                                     | test     | P2       | Recurring | 010-missing-e2e-integration-tests.md     |
| 11  | Missing automated release process                                                 | chore    | P3       | Recurring | 011-missing-automated-release-process.md |
| 12  | lint-staged@17.2.0 requires Node >=22.22.1 — 3-way version mismatch               | chore    | P2       | **NEW**   | 012-lint-staged-engine-mismatch.md       |
| 13  | Workflow security checker: 12 violations (2 CRITICAL); guard non-blocking         | security | P2       | **NEW**   | 013-workflow-permissions-violations.md   |

---

## GitHub Issue Creation — BLOCKED

Attempted `gh issue create` (GraphQL) and REST `POST /issues` with the runner token:
`Resource not accessible by integration (createIssue)` in both cases.

**Root cause**: `.github/workflows/on-push.yml` permissions block is `contents: write, pull-requests: write` — **no `issues: write`**. The 07-30 hardening log documented the fix (`.github/workflows/on-push.yml` add `issues: write`; scope concurrency groups) but it was never pushed (workflow changes need `workflows` permission).

**Fallback applied**: All findings documented as issue-ready records in `docs/issues/2026-07-31/` per repo convention, with full evidence, labels (category + priority), and recommended fixes.

## Final State

- **Phase**: Phase 1 — Audit Complete
- **GitHub Issues**: Blocked (token lacks `issues: write`; PR/issue #2 addresses the fix)
- **Status**: **waiting for human review** (issue creation requires `issues: write` permission)

---

## Addendum — Fresh Re-Scoring (third same-day run, see 04-verification-2026-07-31.md)

Evaluation date 2026-07-31, full suite re-executed from scratch. Global penalty rules: no build failure, **no test failure this run** (1026 pass / 0 fail — the flaky test did not trigger; defect confirmed in code), 0 vulnerabilities. New evidence: 12 workflow security violations (own checker), orchestrator scheduled run failing on unset `secrets.GH_TOKEN`, lint-staged engine mismatch.

### A. CODE QUALITY (Weighted Score: **84.55/100**)

| Criterion                    | Weight | Score | Weighted | Rationale                                                                  |
| ---------------------------- | ------ | ----- | -------- | -------------------------------------------------------------------------- |
| Correctness                  | 15%    | 90    | 13.50    | Build + full suite pass; floating-promise defect confirmed in code (-10)   |
| Readability & Naming         | 10%    | 90    | 9.00     | JSDoc, camelCase, uniform conventions                                      |
| Simplicity                   | 10%    | 78    | 7.80     | Core pipeline clean; CI 2045 lines / 7 workflows overengineered            |
| Modularity & SRP             | 15%    | 84    | 12.60    | Good layering; styles.js 1275 lines                                        |
| Consistency                  | 5%     | 90    | 4.50     | CommonJS + pino + IntegrationError uniform                                 |
| Testability                  | 15%    | 84    | 12.60    | 95.32% coverage; 0 fail this run; residual order-dependent flake risk (-6) |
| Maintainability (Complexity) | 10%    | 80    | 8.00     | styles.js oversized; CI complexity                                         |
| Error Handling               | 10%    | 82    | 8.20     | retry/circuit-breaker/timeout; floating promise defeats catch path (-10)   |
| Dependency Discipline        | 5%     | 85    | 4.25     | Single prod dep, 0 vulns; lint-staged engine mismatch (-10)                |
| Determinism & Predictability | 5%     | 82    | 4.10     | Manifest deterministic; async leak nondeterministic                        |

### B. SYSTEM QUALITY (RUNTIME) (Weighted Score: **85.35/100**)

| Criterion                    | Weight | Score | Weighted | Rationale                                                                 |
| ---------------------------- | ------ | ----- | -------- | ------------------------------------------------------------------------- |
| Stability                    | 20%    | 90    | 18.00    | Build/lint/Python deterministic; known intermittent JS flake (0 this run) |
| Performance Efficiency       | 15%    | 92    | 13.80    | Build 27ms / 2 pages; full suite 4.6s                                     |
| Security Practices           | 20%    | 78    | 15.60    | HTML escaping/CSP/0 vulns; 12 workflow violations + 57 secrets refs (-22) |
| Scalability Readiness        | 15%    | 86    | 12.90    | Static gen, rate limiter, sitemap split                                   |
| Resilience & Fault Tolerance | 15%    | 82    | 12.30    | retry/breaker/timeout; cache fallback unreachable (-10)                   |
| Observability                | 15%    | 85    | 12.75    | pino structured logs + perf report; stdout-only                           |

### C. EXPERIENCE QUALITY (UX / DX) (Weighted Score: **87.45/100**)

UX: Accessibility 92, User Flow Clarity 86, Feedback & Error Messaging 84, Responsiveness 88 (avg 87.5)
DX: API Clarity 88, Local Dev Setup 88 (pytest missing, engine mismatch), Documentation Accuracy 84 (prettier violations + stale reports), Debuggability 82, Build/Test Feedback Loop 95 (avg 87.4)

### D. DELIVERY & EVOLUTION READINESS (Weighted Score: **72.40/100**)

| Criterion                      | Weight | Score | Weighted | Rationale                                                                                                   |
| ------------------------------ | ------ | ----- | -------- | ----------------------------------------------------------------------------------------------------------- |
| CI/CD Health                   | 20%    | 62    | 12.40    | 2045 lines/7 workflows; global concurrency; no issues:write; orchestrator failing; guard non-blocking (-38) |
| Release & Rollback Safety      | 20%    | 72    | 14.40    | Static artifacts rollback-safe; no automated release                                                        |
| Config & Env Parity            | 15%    | 74    | 11.10    | SITE_URL placeholder; 3-way Node version mismatch; secret alias duplication (-4)                            |
| Migration Safety               | 15%    | 82    | 12.30    | Manifest incremental builds; ADRs                                                                           |
| Technical Debt Exposure        | 15%    | 76    | 11.40    | styles.js, floating promise, CI complexity, 12 workflow violations                                          |
| Change Velocity & Blast Radius | 15%    | 72    | 10.80    | Global concurrency group + sequential 90-min steps throttle throughput                                      |

### Composite (fresh run)

| Domain                            | Score     |
| --------------------------------- | --------- |
| A. Code Quality                   | 84.55     |
| B. System Quality                 | 85.35     |
| C. Experience Quality             | 87.45     |
| D. Delivery & Evolution Readiness | 72.40     |
| **Composite Score**               | **82.44** |

**Delta vs 07-31 audit (82.63): -0.19** — security/CI degradations (12 violations, orchestrator CI failure, engine mismatch) partially offset by a clean test run this cycle (no -15 global penalty).
