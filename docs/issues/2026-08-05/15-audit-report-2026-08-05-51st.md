# Phase 1 — Diagnostic & Comprehensive Scoring Report (51st verification, 2026-08-05)

**Evaluation Date**: 2026-08-05
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ d79940c — 50th verification docs, PR #576 merged)
**Trigger**: `ulw-loop` run — Phase 0.3 → PHASE 1 (AUDIT MODE, read-only): 0 open PRs /
0 open issues re-confirmed via `gh`.
**Mode**: Independent fresh verification — all commands re-executed, no cached results.
**Skills used**: `npm install` + `npm audit`, `eslint`, `prettier`, `node --test`
(including stress reproduction under concurrent load), coverage (`c8`), `pytest`,
`check-workflow-security`, `check-freshness`, source re-verification of
F037/F038/F026/F029/F051 via direct file reads, GitHub API probes (issues, PRs,
permissions), live-site probe. Project `.opencode/skills` inspected — contains
only `node_modules`, no custom skill content. No oracle/momus delegation needed —
the F052 race was reproduced empirically via stress runs.

---

## Executive Summary

| Domain                            | Score        | Grade | Δ vs 50th |
| --------------------------------- | ------------ | ----- | --------- |
| A. Code Quality                   | **75.5/100** | C     | **−0.2**  |
| B. System Quality                 | **72.6/100** | C     | **−0.2**  |
| C. Experience Quality             | **81.2/100** | B     | ±0.0      |
| D. Delivery & Evolution Readiness | **63.5/100** | C+    | **−0.2**  |
| **COMPOSITE**                     | **73.2/100** | C     | **−0.2**  |

Composite **−0.2 vs 50th (73.4)** — the first regression since F051's resolution,
driven by the **NEW F052 finding**: `build-pages.test.js` and `enrichment.test.js`
mutate real repo paths (`dist/`, `.build-manifest.json`, `data/enrichment.json`)
while Node 20's `node --test` executes test files in parallel worker processes.
Under concurrent load the suite fails with **5 cross-file races** (reproduced
deterministically; also observed once as a solo-run flake). Solo runs remain
green (1051/0/4 × 8). All other ledger findings held at their 50th-run status;
**one new finding** (F052). Global penalties unchanged (build green, tests green
solo, audit 0 vuln).

---

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                   |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 29 ms, budgets met                                                                         |
| Test failure           | —          | ⚠️ solo PASS (1051/0/4) but **5 failures under concurrent load (F052)** — treated as criterion-level determinism deduction, not the global −15  |
| Critical vulnerability | ⚠️ applied | F037 + F038 (CRITICAL, CI-pipeline) — criterion-level Security deduction (50); `npm audit` now **0 vulnerabilities** (F028 maintained resolved) |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                             | ✅ 131 pkgs; **0 vulnerabilities** (F028 maintained resolved); F012 EBADENGINE persists (lint-staged wants node ≥22.22.1, runtime v20.20.2) |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 29 ms; budgets met                                                                                            |
| `npm run lint`                            | ✅ clean — 0 errors, 0 warnings                                                                                                             |
| `npx prettier --check .`                  | ❌ 59 files fail (F005 HELD at 59; **all in `docs/issues/`**, source clean)                                                                 |
| `npm run test:js` (solo ×8)               | ✅ 1051 pass / 0 fail / 4 skip — clean solo                                                                                                 |
| `npm run test:js` (first run)             | ❌ **1055 tests, 1 fail** — flake (F052 initial evidence)                                                                                   |
| stress: 3× concurrent + format:check      | ❌ **5 failures** — build-pages ×3 (manifest read, dist rmdir, province page) + enrichment ×2 (data round-trip) — **F052 reproduced**       |
| per-file test count diff (dist vs no)     | ✅ no per-file variance — F052 is an execution-concurrency race, not discovery                                                              |
| post-test `git status`                    | ✅ clean tree, no residue — F051/F029 maintained resolved                                                                                   |
| `npm run test:js:coverage`                | ✅ 94.95% stmt / 92.42% branch / 96.65% funcs — above 80/75 thresholds                                                                      |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass                                                                                                                               |
| `npm audit`                               | ✅ **0 vulnerabilities**                                                                                                                    |
| `node scripts/check-workflow-security.js` | ❌ 12 violations (2 CRITICAL + 10 HIGH), exit 1 (F013)                                                                                      |
| `node scripts/check-freshness.js`         | ❌ STALE — 2026-07-20 (16 days, threshold 7); 2 records (F018)                                                                              |
| `gh issue create` (probe)                 | ❌ 403 GraphQL `createIssue` (F002, 48th consecutive)                                                                                       |
| `gh api .../permissions` (probe)          | ❌ admin/maintain/pull/push/triage all false — no `workflows: write` (F050)                                                                 |
| F025 live-site probe                      | ❌ `/` 404, `/index.html` 404, `robots.txt` 200, `sitemap-index.xml` 200                                                                    |

---

## A. CODE QUALITY (75.5/100, −0.2 vs 50th)

| Criterion             | Weight  | Score | Weighted         | Rationale                                                                                                                           |
| --------------------- | ------- | ----- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 76    | 11.40            | F026 maintained resolved; F045 stale pages, F046 build abort, F047 JSON-LD, F049 copy-feedback held                                 |
| Readability & Naming  | 10      | 88    | 8.80             | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity            | 10      | 80    | 8.00             | F048 dead `searchLoaded` (held); F035 dead fallback (held); CI overcomplexity F007                                                  |
| Modularity & SRP      | 15      | 72    | 10.80            | F036 layering inversion (held); F008 styles.js 1296L; F045/F046 boundary drift (held)                                               |
| Consistency           | 5       | 61    | 3.05             | F005 HELD at 59 (no growth; all `docs/`); 3× required-fields list; console.log vs pino split                                        |
| Testability           | 15      | 69    | 10.35            | **F052 NEW (−1)** — parallel-load race on shared repo paths; F051 maintained resolved (+0)                                          |
| Maintainability       | 10      | 71    | 7.10             | F045/F046/F048 held; oversized styles.js (F008); F051 closed (retired debt)                                                         |
| Error Handling        | 10      | 78    | 7.80             | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); otherwise IntegrationError/ERROR_CODES solid |
| Dependency Discipline | 5       | 86    | 4.30             | 1 prod dep (pino); **F028 0-vuln (+2)**; F012 mismatch held                                                                         |
| Determinism           | 5       | 73    | 3.65             | **F052 NEW (−1)** — suite outcome depends on load/timing; F051 resolved (+1); F032 sitemap lastmod held (−3)                        |
| **TOTAL**             | **100** |       | **75.45 → 75.5** |

- **A6. Testability (69, −1)** — F052: tests can fail without a production
  defect; fix pattern already exists (build-orchestrator temp override).
- **A10. Determinism (73, −1)** — same commit passes solo and fails under load;
  first determinism regression since F051.

---

## B. SYSTEM QUALITY (RUNTIME) (72.6/100, −0.2 vs 50th)

| Criterion     | Weight  | Score | Weighted         | Rationale                                                                                                |
| ------------- | ------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 73    | 14.60            | **F052 NEW (−1)** — CI/test-tree flake class; F051 maintained (+0); F014 NOT observed solo               |
| Performance   | 15      | 90    | 13.50            | 29 ms build; budgets met                                                                                 |
| Security      | 20      | 50    | 10.00            | F037+F038 CRITICAL unfixed 13th run (−11); F039–F044 held (−8); F028 0 vuln (−0); F013 (−2)              |
| Scalability   | 15      | 74    | 11.10            | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                             |
| Resilience    | 15      | 80    | 12.00            | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout otherwise |
| Observability | 15      | 73    | 10.95            | F033 held (−4) pino-wrapped `--json` unusable; F026 corrected output; otherwise pino-based logger        |
| **TOTAL**     | **100** |       | **72.65 → 72.6** |

- **B1. Stability (73, −1)** — F052: the test tree is not stable under concurrent
  execution (mirror of F051's +2 at run 50; conservative −1 since solo green).

---

## C. EXPERIENCE QUALITY (81.2/100, ±0.0 vs 50th)

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

No movement — no experience-facing change (test-hygiene finding only).

---

## D. DELIVERY & EVOLUTION READINESS (63.5/100, −0.2 vs 50th)

| Criterion           | Weight  | Score | Weighted         | Rationale                                                                                                      |
| ------------------- | ------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40            | **F052 NEW (−1)** — flaky-test gate under load; F037/F038 CRITICAL unfixed (−6); F013 12 violations; F002 48th |
| Release & Rollback  | 20      | 50    | 10.00            | F025 partial — root/index 404, robots/sitemap 200, Pages "built" (−15)                                         |
| Config & Env Parity | 15      | 76    | 11.40            | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)        |
| Migration Safety    | 15      | 67    | 10.05            | F029 maintained resolved (+3); F045 school delete/move unhandled; F018 stale 16 d                              |
| Technical Debt      | 15      | 57    | 8.55             | F051 retained closed (+0); F045–F049 still open; **F052 NEW debt**; F037/F038 13th run                         |
| Change Velocity     | 15      | 85    | 12.75            | atomic commits; PR #576 merged in-loop; fast docs-led throughput                                               |
| **TOTAL**           | **100** |       | **63.15 → 63.5** |

- **D1. CI/CD Health (52, −1)** — F052: the flake class F051 removed has a
  sibling in build-pages/enrichment; CI runners under parallel load can hit it.

---

## Composite Calculation

| Domain                  | Weight   | Score | Weighted         |
| ----------------------- | -------- | ----- | ---------------- |
| A. Code Quality         | 25%      | 75.5  | 18.88            |
| B. System Quality       | 25%      | 72.6  | 18.15            |
| C. Experience Quality   | 25%      | 81.2  | 20.30            |
| D. Delivery & Evolution | 25%      | 63.5  | 15.88            |
| **COMPOSITE**           | **100%** |       | **73.21 → 73.2** |

## Score Trend

| Domain                  | 48th     | 49th     | 50th     | 51st (current) |
| ----------------------- | -------- | -------- | -------- | -------------- |
| A. Code Quality         | 75.5     | 75.5     | 75.7     | **75.5**       |
| B. System Quality       | 72.6     | 72.6     | 72.8     | **72.6**       |
| C. Experience Quality   | 81.2     | 81.2     | 81.2     | **81.2**       |
| D. Delivery & Evolution | 63.4     | 63.2     | 63.7     | **63.5**       |
| **COMPOSITE**           | **72.9** | **73.1** | **73.4** | **73.2**       |

---

## Findings Matrix (this run)

| ID        | Finding                                                                    | Category     | Priority | Status                               |
| --------- | -------------------------------------------------------------------------- | ------------ | -------- | ------------------------------------ |
| F002      | Loop token lacks `issues: write` (403 createIssue)                         | ci           | P1       | HELD — **48th consecutive**          |
| F005      | Prettier drift (59 files, all `docs/`)                                     | docs         | P3       | HELD — no growth                     |
| F012      | lint-staged engine mismatch (needs node ≥22.22.1)                          | chore        | P3       | HELD                                 |
| F013      | Workflow-security violations (12)                                          | security     | P1       | HELD                                 |
| F018      | Data STALE 16 days (threshold 7)                                           | bug          | P2       | HELD                                 |
| F025      | Live site root/index 404 behind "built" Pages                              | bug          | P1       | PARTIAL                              |
| F026      | `formatBytes` NaN/`undefined` output                                       | bug          | P2       | **maintained RESOLVED**              |
| F028      | brace-expansion HIGH dev vuln                                              | security     | P1       | **maintained RESOLVED** (0 audit)    |
| F029      | fetch-data test corrupts tracked `external/raw.csv`                        | test         | P1       | **maintained RESOLVED** (clean tree) |
| F037      | `issue_comment` → unauthenticated write-token agent (public)               | security     | P1       | **UNFIXED 13th run** (F050-blocked)  |
| F038      | `custom_prompt` heredoc shell RCE                                          | security     | P1       | **UNFIXED 13th run** (F050-blocked)  |
| F039–F044 | Workflow supply-chain/secret/branch cluster                                | security     | P1/P2    | ALL UNFIXED (F050-blocked)           |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy-feedback) | bug/refactor | P2/P3    | ALL HELD                             |
| F050      | Loop token lacks `workflows: write`                                        | ci           | P1       | HELD — blocks F037/F038              |
| F051      | fetch-data test residue race (`external-data/` in cwd)                     | test         | P3       | **maintained RESOLVED**              |
| **F052**  | **build-pages/enrichment tests race on shared repo paths under load**      | **test**     | **P2**   | **NEW — 1st run**                    |

---

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks
this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 48th consecutive). Following the established repo pattern
(runs 1–50), this run records findings as **labelled docs records** under
`docs/issues/2026-08-05/` (13-F052 finding record + 14-run + 15-audit) and ships
them via PR. All tracked findings remain labelled (category + priority) and ready
to be bulk-created as GitHub issues the moment token permissions are granted.

---

## Notes on scoring movement

1. **First regression since F051's run-50 resolution**: composite **−0.2 → 73.2**,
   driven entirely by **F052** — a NEW parallel-load test race. Score movement is
   conservative and evidence-tied (stress-reproduced, not theoretical).
2. **F052 is fixable now**: the isolation pattern already exists
   (`build-orchestrator.test.js:15` overrides `CONFIG.DIST_DIR` to
   `os.tmpdir()`). Minimal atomic fix: same override at the top of
   `build-pages.test.js` + temp `ENRICHMENT_DATA_PATH` in `enrichment.test.js`.
   No production code changes. This is the Phase 2 candidate for the next run.
3. **The critical message, now 13 runs old**: F037 + F038 (proven shell RCE +
   unauthenticated write-token agent trigger on a PUBLIC repo) remain open with
   the patch staged at `docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`,
   awaiting F050 (`workflows: write`). Workflows unchanged since the 39th run.

## Next Phase Recommendation

**Phase 2 (Feature Hardening)** — F052 eligible with current token permissions:

1. **F052 (P2, test)**: isolate `build-pages.test.js` `CONFIG.DIST_DIR` +
   `.build-manifest.json` writes to per-process `os.tmpdir()`; point
   `enrichment.test.js` at a temp `ENRICHMENT_DATA_PATH`. Verify with the
   concurrent-load stress reproduction (3× `npm run test:js` + format:check →
   expect 0 failures).
2. **F037 + F038** (CRITICAL, 13th run): still blocked by F050 (`workflows:
write`) — requires human token grant.
3. **F039–F044**: blocked by F050.
4. **F045/F046/F047**: code-level correctness hardening — held (non-trivial,
   green-test risk, Phase-2 minimal/atomic rule).

If F052 lands cleanly, subsequent runs can re-focus on docs-led verification
until F050 is lifted.
