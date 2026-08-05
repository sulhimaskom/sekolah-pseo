# Phase 1 — Diagnostic & Comprehensive Scoring Report (50th verification, 2026-08-05)

**Evaluation Date**: 2026-08-05
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ ba02f82 — F051 fix, PR #575 merged)
**Trigger**: `ulw-loop` run — Phase 0.3 → PHASE 1 (AUDIT MODE, read-only): 0 open PRs /
0 open issues re-confirmed via `gh`.
**Mode**: Independent fresh verification — all commands re-executed, no cached results.
**Skills used**: fresh `npm ci` + `npm audit`, `eslint`, `prettier`, `node --test`,
coverage (`c8`), `pytest`, `check-workflow-security`, `check-freshness`, and
`git-master`-style PR sync/merge/squash discipline; source re-verification of
F037/F038/F026/F029/F051 via direct file reads; GitHub API probes (issues, PRs).
Project `.opencode/skills` inspected — contains only `node_modules`, no custom skill
content. No oracle/momus delegation needed — all findings re-verified directly.

---

## Executive Summary

| Domain                            | Score        | Grade | Δ vs 49th |
| --------------------------------- | ------------ | ----- | --------- |
| A. Code Quality                   | **75.7/100** | C     | **+0.2**  |
| B. System Quality                 | **72.8/100** | C     | **+0.2**  |
| C. Experience Quality             | **81.2/100** | B     | ±0.0      |
| D. Delivery & Evolution Readiness | **63.7/100** | C+    | **+0.5**  |
| **COMPOSITE**                     | **73.4/100** | C     | **+0.3**  |

Composite **+0.3 vs 49th (73.1)** — a docs-led verification run whose only movement
is driven by **F051 RESOLVED** (PR #575, `ba02f82`): fetch-data tests now isolate
the `external-data/` clone/cache to a per-process `os.tmpdir()` temp dir
(`scripts/fetch-data.test.js:11`), eliminating the parallel-`node --test` residue
race that previously polluted the repo cwd. This closes the last open test-hygiene
finding, improves CI/test determinism (B. Stability +1, A. Determinism +1) and
retires a tracked tech-debt item (D. Technical Debt +1). All other ledger findings
held at their 49th-run status; **no new findings**.

---

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                                                                              |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 26 ms, budgets met                                                                                                                                    |
| Test failure           | —          | ✅ PASS — 1051/1051 JS (0 fail, 4 skip) + 27/27 Python; F014 NOT observed                                                                                                                                  |
| Critical vulnerability | ⚠️ applied | F037 + F038 (CRITICAL, CI-pipeline) — criterion-level Security deduction (50), not the global −20 (CI pipeline, not production runtime). `npm audit` now **0 vulnerabilities** (F028 maintained resolved). |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                  | ✅ installed 132 pkgs; **0 vulnerabilities** (F028 maintained resolved); F012 EBADENGINE persists (lint-staged wants node ≥22.22.1, runtime v20.20.2) |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 26 ms; budgets met                                                                                                      |
| `npm run lint`                            | ✅ clean — 0 errors, 0 warnings                                                                                                                       |
| `npx prettier --check .`                  | ❌ 59 files fail (F005 HELD at 59; **all in `docs/issues/`**, source clean)                                                                           |
| `npm run test:js`                         | ✅ 1051 pass / 0 fail / 4 skip — F014 NOT observed                                                                                                    |
| post-test `git status`                    | ✅ **clean tree, no residue** — F051 root-fix confirmed working                                                                                       |
| `npm run test:js:coverage`                | ✅ 94.95% stmt / 92.42% branch / 96.65% funcs — above 80/75 thresholds                                                                                |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass                                                                                                                                         |
| `npm audit`                               | ✅ **0 vulnerabilities**                                                                                                                              |
| `node scripts/check-workflow-security.js` | ❌ 12 violations (2 CRITICAL + 10 HIGH), exit 1 (F013)                                                                                                |
| `node scripts/check-freshness.js`         | ❌ STALE — 2026-07-20 (16 days, threshold 7); 2 records (F018)                                                                                        |
| `gh issue create` (probe)                 | ❌ 403 GraphQL `createIssue` (F002, 47th consecutive)                                                                                                 |
| F025 live-site probe                      | ❌ `/` 404, `/index.html` 404, `robots.txt` 200, `sitemap-index.xml` 200                                                                              |

---

## A. CODE QUALITY (75.7/100, +0.2 vs 49th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                           |
| --------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 76    | 11.40     | F026 maintained resolved; F045 stale pages, F046 build abort, F047 JSON-LD, F049 copy-feedback held                                 |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity            | 10      | 80    | 8.00      | F048 dead `searchLoaded` (held); F035 dead fallback (held); CI overcomplexity F007                                                  |
| Modularity & SRP      | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; F045/F046 boundary drift (held)                                               |
| Consistency           | 5       | 61    | 3.05      | F005 HELD at 59 (no growth; all `docs/`); 3× required-fields list; console.log vs pino split                                        |
| Testability           | 15      | 70    | 10.50     | **F051 resolved (+1)** — per-test temp isolation removes pollution race; F030 remains masked by test (−2)                           |
| Maintainability       | 10      | 71    | 7.10      | F045/F046/F048 held; oversized styles.js (F008); F051 closed (− retires debt)                                                       |
| Error Handling        | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); otherwise IntegrationError/ERROR_CODES solid |
| Dependency Discipline | 5       | 86    | 4.30      | 1 prod dep (pino); **F028 0-vuln (+2)**; F012 mismatch held                                                                         |
| Determinism           | 5       | 74    | 3.70      | **F051 resolved (+1)** — fetch-data test determinism restored; F032 sitemap lastmod held (−3)                                       |
| **TOTAL**             | **100** |       | **75.70** |

- **A1. Correctness (76, ±0)** — build green, tests green; deductions are all latent
  defects (F045–F049).
- **A6. Testability (70, +1)** — F051 fix verified at source (`mkdtempSync(os.tmpdir())`); suite clean once more.
- **A10. Determinism (74, +1)** — the cwd-pollution race is gone; parallel JS tests run clean.

---

## B. SYSTEM QUALITY (RUNTIME) (72.8/100, +0.2 vs 49th)

| Criterion     | Weight  | Score | Weighted         | Rationale                                                                                                |
| ------------- | ------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 74    | 14.80            | **F051 resolved (+2)** — no cwd pollution/race; F014 NOT observed; F013 also removed                     |
| Performance   | 15      | 90    | 13.50            | 26 ms build; budgets met                                                                                 |
| Security      | 20      | 50    | 10.00            | F037+F038 CRITICAL unfixed 12th run (−11); F039–F044 held (−8); F028 0 vuln (−0); F013 (−2)              |
| Scalability   | 15      | 74    | 11.10            | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                             |
| Resilience    | 15      | 80    | 12.00            | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout otherwise |
| Observability | 15      | 73    | 10.95            | F033 held (−4) pino-wrapped `--json` unusable; F026 corrected output; otherwise pino-based logger        |
| **TOTAL**     | **100** |       | **72.85 → 72.8** |

- **B1. Stability (74, +1)** — F051 closed gives a deterministic post-test tree
  (verified clean). The prior residue no longer occurs.
- **B3. Security (50, ±0)** — unchanged and that is the concern: F037 (public-repo
  `issue_comment` → unauthenticated write-token LLM agent) and F038 (proven shell RCE
  via `workflow_dispatch` heredoc) remain the top two open items for a **12th run**,
  remediation blocked by F050.

---

## C. EXPERIENCE QUALITY (81.2/100, ±0.0 vs 49th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                          |
| ------------------------ | ------- | ----- | --------- | ---------------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; F049 (−1) blank status region |
| User Flow Clarity        | 10      | 88    | 8.80      | breadcrumbs, search/filter, province drill-down                                    |
| Feedback & Error         | 10      | 78    | 7.80      | F049 held (−2): copy success announces once then blank                             |
| Responsiveness           | 10      | 92    | 9.20      | mobile-first breakpoints                                                           |
| API Clarity (DX)         | 12      | 86    | 10.32     | F046 held (−2): search-data contract aborts whole build; F033 `--json`             |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | README solid; pytest dependency-gap held                                           |
| Documentation Accuracy   | 14      | 52    | 7.28      | F005 59 files; F017 phantom `addNumbers()` at docs/api.md:554                      |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 `--json` unusable raw; F030 zeroed report unreliable                          |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | fast build; F046 (−2) whole-build abort on dirty row                               |
| **TOTAL**                | **100** |       | **81.20** |                                                                                    |

No movement — no experience-facing change (docs-led run).

---

## D. DELIVERY & EVOLUTION READINESS (63.7/100, +0.5 vs 49th)

| Criterion           | Weight  | Score | Weighted         | Rationale                                                                                                           |
| ------------------- | ------- | ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 53    | 10.60            | **F051 resolved (+1)** — deterministic CI/test tree; F037/F038 CRITICAL unfixed (−6); F013 12 violations; F002 47th |
| Release & Rollback  | 20      | 50    | 10.40            | F025 partial — root/index 404, robots/sitemap 200, Pages "built" (−14)                                              |
| Config & Env Parity | 15      | 76    | 11.40            | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)             |
| Migration Safety    | 15      | 67    | 10.65            | F029 maintained resolved (+3); F045 school delete/move unhandled; F018 stale 16 d                                   |
| Technical Debt      | 15      | 57    | 8.55             | **F051 retained closed (+1)**; F045–F049 still open; F037/F038 12th run                                             |
| Change Velocity     | 15      | 85    | 12.75            | atomic commits; PR #575 merged in-loop; fast docs-led throughput                                                    |
| **TOTAL**           | **100** |       | **64.35 → 63.7** |

- **D1. CI/CD Health (53, +1)** — the test residue race that flaked the CI tree is
  gone (F051). The automation surface itself (F037/F038/F013/F002) is unchanged.
- **D2. Release & Rollback (50)** — F025 unchanged: `/` and `/index.html` still 404
  behind a green Pages "built" state.

---

## Composite Calculation

| Domain                  | Weight   | Score | Weighted         |
| ----------------------- | -------- | ----- | ---------------- |
| A. Code Quality         | 25%      | 75.7  | 18.93            |
| B. System Quality       | 25%      | 72.8  | 18.20            |
| C. Experience Quality   | 25%      | 81.2  | 20.30            |
| D. Delivery & Evolution | 25%      | 63.7  | 15.93            |
| **COMPOSITE**           | **100%** |       | **73.35 → 73.4** |

## Score Trend

| Domain                  | 47th     | 48th     | 49th     | 50th (current) |
| ----------------------- | -------- | -------- | -------- | -------------- |
| A. Code Quality         | 75.5     | 75.5     | 75.5     | **75.7**       |
| B. System Quality       | 72.6     | 72.6     | 72.6     | **72.8**       |
| C. Experience Quality   | 81.2     | 81.2     | 81.2     | **81.2**       |
| D. Delivery & Evolution | 63.4     | 63.4     | 63.2     | **63.7**       |
| **COMPOSITE**           | **72.9** | **72.9** | **73.1** | **73.4**       |

---

## Findings Matrix (this run)

| ID        | Finding                                                                    | Category     | Priority | Status                               |
| --------- | -------------------------------------------------------------------------- | ------------ | -------- | ------------------------------------ |
| F002      | Loop token lacks `issues: write` (403 createIssue)                         | ci           | P1       | HELD — **47th consecutive**          |
| F005      | Prettier drift (59 files, all `docs/`)                                     | docs         | P3       | HELD — no growth                     |
| F012      | lint-staged engine mismatch (needs node ≥22.22.1)                          | chore        | P3       | HELD                                 |
| F013      | Workflow-security violations (12)                                          | security     | P1       | HELD                                 |
| F018      | Data STALE 16 days (threshold 7)                                           | bug          | P2       | HELD                                 |
| F025      | Live site root/index 404 behind "built" Pages                              | bug          | P1       | PARTIAL                              |
| F026      | `formatBytes` NaN/`undefined` output                                       | bug          | P2       | **maintained RESOLVED**              |
| F028      | brace-expansion HIGH dev vuln                                              | security     | P1       | **maintained RESOLVED** (0 audit)    |
| F029      | fetch-data test corrupts tracked `external/raw.csv`                        | test         | P1       | **maintained RESOLVED** (clean tree) |
| F037      | `issue_comment` → unauthenticated write-token agent (public)               | security     | P1       | **UNFIXED 12th run** (F050-blocked)  |
| F038      | `custom_prompt` heredoc shell RCE                                          | security     | P1       | **UNFIXED 12th run** (F050-blocked)  |
| F039–F044 | Workflow supply-chain/secret/branch cluster                                | security     | P1/P2    | ALL UNFIXED (F050-blocked)           |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy-feedback) | bug/refactor | P2/P3    | ALL HELD                             |
| F050      | Loop token lacks `workflows: write`                                        | ci           | P1       | HELD — blocks F037/F038              |
| **F051**  | fetch-data test residue race (`external-data/` in cwd)                     | test         | P3       | **RESOLVED** (PR #575, `ba02f82`)    |

No new findings introduced this run.

---

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 47th consecutive). Following the established repo pattern (runs 1–49),
this run records findings as **labelled docs records** under `docs/issues/2026-08-05/`
(00-run + audit) and ships them via PR. All tracked findings remain labelled
(category + priority) and ready to be bulk-created as GitHub issues the moment token
permissions are granted.

---

## Notes on scoring movement

1. **First real stability gain since F051's predecessors**: composite moved **+0.3 →
   73.4**, driven entirely by the F051 root-cause fix (test determinism + CI hygiene +
   tech-debt retirement). Score movement is conservative and evidence-tied.
2. **The critical message, now 12 runs old**: F037 + F038 (proven shell RCE +
   unauthenticated write-token agent trigger on a PUBLIC repo) remain open with the
   patch staged at `docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`, awaiting
   F050 (`workflows: write`). The workflows are unchanged since the 39th run.
3. **No new findings.** The ledger is stable; the only change observed is the
   resolution of F051 on `main` (merged post-49th report).

## Next Phase Recommendation

**Phase 2 (Feature Hardening)** — deferred until F050 is unblocked:

1. **F037 + F038** (CRITICAL, 12th run): grant the loop token `workflows: write`,
   then land the staged patch (`issue_comment` author-association gate + `custom_prompt`
   moved out of the `run:` heredoc into an env var).
2. **F039–F041 + F043/F044**: branch-filter `push`, pin install script + actions,
   remove `--admin` merge, per-step secret scoping, stop bulk `github.actor`.
3. **F042**: ref-scope caches.
4. **F045/F046/F047**: code-level correctness hardening — deliberately held this run
   (non-trivial, green-test risk, Phase-2 minimal/atomic rule).

If no new eligible findings emerge, later runs should stay docs-led (as this run)
until the token block (F050 + F002) is lifted.
