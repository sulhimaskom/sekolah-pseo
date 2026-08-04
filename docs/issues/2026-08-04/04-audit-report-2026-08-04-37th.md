# Phase 1 — Diagnostic & Comprehensive Scoring Report (37th verification, 2026-08-04)

**Evaluation Date**: 2026-08-04
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ f4c59b1 — 36th verification run PR #559)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: fresh `npm ci` + `npm audit`, `eslint`, `prettier`, `node --test`
(5 runs), `pytest`, coverage, `check-workflow-security` (human + `--json`), targeted
greps (code-quality, security, CI/docs), GitHub API probes (issues, PRs, Pages).
No `oracle`/`momus` delegation needed this run.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 36th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **81.6/100** | B     | −0.7      |
| **B. System Quality**                 | **78.0/100** | B     | −0.8      |
| **C. Experience Quality**             | **82.7/100** | B     | +0.2      |
| **D. Delivery & Evolution Readiness** | **65.4/100** | C+    | −0.3      |
| **COMPOSITE**                         | **76.9/100** | B     | **−0.4**  |

Composite **−0.4 vs 36th run (77.3)**. Headline: **NEW F029 (P1, test)** —
`fetch-data.test.js` corrupts the tracked `external/raw.csv` via the cache-fallback
path during `npm run test:js` (observed live: file overwritten with `col1\nval1`,
restored from git). **F014 (parallel test-file race) RE-OBSERVED** — 1 of 5
full-suite runs failed with a variable test count (1054/1 fail vs 1053/0),
confirming the CI nondeterminism is live. **F016 RESOLVED** — README no longer
documents the phantom `gitignore-check` workflow (verified 0 hits). **F005 Prettier
drift WORSENED 49 → 53 files** (all `docs/issues/` ledger; source clean). **F018
data STALE worsened to 15 days**. **F008 styles.js grew 1275 → 1296 lines**.
F028 (brace-expansion high-severity DoS, fix 5.0.9) held; F027 (`--json` gate exit
code) maintained resolved; F025 live site still root-404 with Pages "built". F002
still blocks GitHub issue creation (403, 34th consecutive); output ships as labeled
docs records + PR.

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                                                                      |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 34ms, budgets met                                                                                                                           |
| Test failure           | ⚠️ partial | **F014 RE-OBSERVED**: 1 of 5 `npm run test:js` runs failed (flaky, race-dependent). Not a stable failure, so no fixed −15, but criterion-level deductions applied across A/B. Python 27/27 stable. |
| Critical vulnerability | —          | ⚠️ F028 high-severity (dev-tooling only, no production surface) — criterion deduction, not global −20                                                                                              |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                         | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists                                                                      |
| `npm run build`                                  | ✅ exit 0, 2 pages, 0 failed, 34ms; budgets met                                                                                                |
| `npm run lint`                                   | ✅ clean — 0 errors, 0 warnings                                                                                                                |
| `npm run format:check`                           | ❌ **53 files fail Prettier (F005, WORSENED 49→53, all docs/issues ledger)**                                                                   |
| `npm run test:js` (run 1 of 5)                   | ❌ **1054 tests / 1 fail (F014 RE-OBSERVED)**                                                                                                  |
| `npm run test:js` (runs 2–5)                     | ✅ 1053 tests / 1049 pass / 0 fail (4 skipped) × 4                                                                                             |
| post-test `git status` (F029 trace)              | ❌ **NEW F029**: `external/raw.csv` overwritten with `col1\nval1` fixture; root-caused to fetch-data.test.js cache-fallback; restored from git |
| `npm run test:js:coverage`                       | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                         |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                                                                                  |
| `npm audit`                                      | ❌ **1 high severity (brace-expansion@5.0.8, F028 held)**                                                                                      |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH) — human exit 1 (F013)                                                                                  |
| `node scripts/check-workflow-security.js --json` | ✅ **F027 maintained RESOLVED — exit 1 with 12 violations**                                                                                    |
| Live site probe (gh api pages + curl)            | ❌ **F025: root HTTP 404; robots 200; Pages "built"**                                                                                          |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (15 days, threshold 7); 2 records (F018, WORSENED)                                                                       |
| F004 re-count (`secrets.*`)                      | ❌ **57 refs / 10 unique names** (held)                                                                                                        |
| F007 line count                                  | ❌ 2045 total workflow lines (held)                                                                                                            |
| F008 line count                                  | ❌ src/presenters/styles.js **1296 lines** (GREW 1275→1296)                                                                                    |
| F011 tag count                                   | ❌ 0 tags (held)                                                                                                                               |
| F016 README probe (`gitignore-check`)            | ✅ **RESOLVED — 0 hits**                                                                                                                       |
| F017 api.md probe (`addNumbers`)                 | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                       |
| F012 engine probe (`npm ls`, engines)            | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2 (held)                                                                          |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 34th consecutive)**                                                                                              |

---

## A. CODE QUALITY (Weighted: 81.9/100, −0.4 vs 36th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                            |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness           | 15      | 94    | 14.10     | **F014 RE-OBSERVED (−4 vs latent −2)**: 1/5 runs failed; F026 NaN metric (−2)                                                        |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistent (held)                                                                              |
| Simplicity            | 10      | 85    | 8.50      | Simple CSV→HTML pipeline; CI layer overengineered (F007); isTransientError complexity 29                                             |
| Modularity & SRP      | 15      | 78    | 11.70     | SearchDataService/ExportService extracted; **F008 styles.js 1296L (grew)**; homepage 716L                                            |
| Consistency           | 5       | 65    | 3.25      | **F005 WORSENED 53 files (−3)**; 3× required-fields list; console.log vs pino split                                                  |
| Testability           | 15      | 72    | 10.80     | Coverage 95.23 met; **F014 observed (−4)**; **F029 NEW (−2)**: test corrupts tracked raw.csv; pytest not wired (F009); F022 untested |
| Maintainability       | 10      | 76    | 7.60      | No TODO/FIXME (verified 0 genuine); oversized files (F008); test-only dead exports                                                   |
| Error Handling        | 10      | 88    | 8.80      | IntegrationError + ERROR_CODES; resilience; some silent swallows                                                                     |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); **F028 held** (high vuln in dev chain); F012 mismatch                                                             |
| Determinism           | 5       | 76    | 3.80      | **F014 observed (−4)**: test count varies 1053/1054; timestamps in manifest/sitemap                                                  |
| **TOTAL**             | **100** |       | **81.60** |

---

## B. SYSTEM QUALITY (RUNTIME) (78.0/100, −0.8 vs 36th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                               |
| ------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 76    | 15.20     | Build deterministic; **F014 observed 1/5 (−4)**: CI nondeterminism live                                 |
| Performance   | 15      | 90    | 13.50     | 34ms build, budgets met                                                                                 |
| Security      | 20      | 66    | 13.20     | **F027 maintained RESOLVED** (json gate works); **F028 held (−2)**: high-severity dev dep; F013 12 (−2) |
| Scalability   | 15      | 82    | 12.30     | incremental build; data truncated (F018)                                                                |
| Resilience    | 15      | 88    | 13.20     | retry/circuit-breaker/timeout (fs-safe, fetch-data)                                                     |
| Observability | 15      | 76    | 11.40     | pino logging; F026 NaN metric (−2); console.log escapes (interactive 26, checker 14, data-quality 2)    |
| **TOTAL**     | **100** |       | **78.00** |

**B1. Stability (76, −4)** — the only movement this domain. F014 re-observation
directly attacks the determinism guarantee: run 1 executed 1054 tests (1 fail),
runs 2–5 executed 1053 tests (0 fail). Root cause unchanged (shared `CONFIG.DIST_DIR`
racing), fix guidance in the F014 record.

**B3. Security (66, held)** — F027 `--json` exit-code fix remains functional (exit 1
with 12 violations in payload — re-verified live). F028 brace-expansion@5.0.8 DoS
advisory (GHSA-rgw5-rvv9-x895) held; fix 5.0.9 is a compatible single bump, still
awaiting the documented dependency-maintenance PR. F013 12 violations unchanged.

---

## C. EXPERIENCE QUALITY (82.7/100, +0.2 vs 36th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                        |
| ------------------------ | ------- | ----- | --------- | -------------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion                              |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                                  |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback                              |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                         |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports                                                    |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap                                |
| Documentation Accuracy   | 14      | 55    | 7.70      | **F016 RESOLVED (+3)**; F005 53 files (ledger, −2); F017 phantom api.md persists |
| Debuggability (DX)       | 10      | 82    | 8.20      | pino; named errors; F026 NaN metric (−)                                          |
| Build/Test Feedback (DX) | 12      | 90    | 10.80     | ~34ms build; tests <5s; fast local loop (F014 flake −)                           |
| **TOTAL**                | **100** |       | **82.66** |

**C6. Documentation Accuracy (55, +1)** — F016 resolved removes a documented
inaccuracy (README "CI Verification" now lists only real workflows — verified 0
`gitignore-check` hits). Net offset by F005 ledger drift (49→53) and persistent
F017 phantom `addNumbers()` in docs/api.md:554. Docs coverage ledger itself remains
exemplary (37-run verification history).

---

## D. DELIVERY & EVOLUTION READINESS (65.7/100, +0.0 vs 36th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                               |
| ------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 58    | 11.60     | F027 maintained; F013 (12); F002 34th; F025 (deploy status ≠ site health)                                               |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                                                              |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder; node version drift (.nvmrc 22 vs CI 20 vs engines 20)                                        |
| Migration Safety    | 15      | 66    | 9.90      | **F018 WORSENED (15 days stale)**; **F029 NEW**: test can corrupt tracked ETL input; data regression (3474→2) unplanned |
| Tech Debt           | 15      | 63    | 9.45      | F005 (53, worsened) vs F016 (resolved) — net held; F019/F020 dead code; F007                                            |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; docs-led throughput (PRs #551–#559 merged)                                                   |
| **TOTAL**           | **100** |       | **65.40** |

**D4. Migration Safety (66, −4)** — F018 worsened to 15 days stale, and **F029
(New)**: the fetch-data test can overwrite the tracked ETL input (`external/raw.csv`)
via the cache-fallback path. The 2-record dataset (baseline 3474) has been frozen
since 2026-07-20; every day it persists, the risk of shipping outdated school data
grows. F029 is the highest-priority test-hygiene blocker (P1) — a single test run
can silently destroy source data.

---

## Findings Matrix (29 tracked entries)

| ID            | Finding                                                    | Category | Priority | Status (this run)                                                         |
| ------------- | ---------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`                 | bug      | P1       | maintained RESOLVED (awaited at fetch-data.js:378)                        |
| F002          | Loop token lacks `issues: write` (403 createIssue)         | ci       | P1       | RE-CONFIRMED (34th) — output blocked                                      |
| F003          | Global concurrency groups in on-push.yml                   | ci       | P2       | RE-VERIFIED (line 10)                                                     |
| F004          | Excessive CI secret exposure (57 refs)                     | security | P1       | RE-VERIFIED — held at 57 refs / 10 unique                                 |
| F005          | Prettier drift                                             | docs     | P3       | **WORSENED — 53 files (was 49); all docs/issues ledger**                  |
| F006          | SITE_URL placeholder (example.com)                         | chore    | P2       | RE-VERIFIED (build/check-freshness log)                                   |
| F007          | CI workflow overcomplexity (2045L)                         | refactor | P2       | RE-VERIFIED (wc -l exact)                                                 |
| F008          | styles.js oversized                                        | refactor | P2       | **GREW 1275 → 1296 lines**                                                |
| F009          | pytest not wired into CI                                   | test     | P2       | RE-VERIFIED (+ pytest module absent in env)                               |
| F010          | Missing E2E/integration tests                              | test     | P3       | RE-VERIFIED                                                               |
| F011          | Missing automated release (0 tags)                         | ci       | P2       | RE-VERIFIED (git tag → 0)                                                 |
| F012          | lint-staged engine mismatch                                | chore    | P3       | RE-VERIFIED (EBADENGINE: needs node ≥22.22.1)                             |
| F013          | Workflow permissions (12 violations)                       | security | P2       | RE-VERIFIED (2 CRITICAL + 10 HIGH)                                        |
| F014          | Parallel test-file race on DIST_DIR                        | test     | P1       | **RE-OBSERVED — 1/5 runs failed (1054 tests/1 fail)**                     |
| F015          | OS command injection in fetch-data.js                      | security | P1       | maintained RESOLVED (fix #542)                                            |
| F015-RESIDUAL | Encoded + parser-rewritten metacharacters accepted         | security | P2       | OPEN — 7 classes (5 encoded + 2 re-encoded)                               |
| F016          | README documents non-existent `gitignore-check`            | docs     | P3       | **RESOLVED — verified 0 hits**                                            |
| F017          | docs/api.md documents nonexistent `addNumbers()`           | docs     | P3       | RE-VERIFIED (docs/api.md:554)                                             |
| F018          | schools.csv data regression 3474→2                         | bug      | P1       | RE-CONFIRMED (**STALE 15d, WORSENED**)                                    |
| F019          | Dead code tests/run_tests.py                               | refactor | P3       | RE-VERIFIED                                                               |
| F020          | Dead script apply-caching-patch.sh                         | chore    | P3       | RE-VERIFIED (patch file missing)                                          |
| F021          | Orphaned check-workflow-security.js gate                   | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                                         |
| F022          | head-meta.js untested                                      | test     | P3       | RE-VERIFIED (no test file)                                                |
| F023          | Validator logic duplication                                | refactor | P3       | RESOLVED as filed (file never existed)                                    |
| F024          | Build omits sitemap; 404.html broken link                  | bug      | P2       | RE-CONFIRMED (no sitemap step in build)                                   |
| F025          | **Live GitHub Pages site returns 404 (green deploy)**      | bug      | P1       | RE-CONFIRMED (Pages "built", root 404)                                    |
| F026          | formatBytes NaN on negative memory delta                   | bug      | P3       | RE-CONFIRMED (unit repro)                                                 |
| F027          | checker `--json` exits 0 with violations                   | security | P2       | maintained RESOLVED (process.exit added)                                  |
| F028          | brace-expansion@5.0.8 high-severity DoS vuln               | security | P2       | HELD — GHSA-rgw5-rvv9-x895, fix 5.0.9                                     |
| **F029**      | **fetch-data.test.js corrupts tracked `external/raw.csv`** | test     | P1       | **NEW** — observed live; file overwritten with fixture, restored from git |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 34th consecutive run). Following the established repo pattern
(runs 1–36), this run records findings as labeled docs records under
`docs/issues/2026-08-04/` and ships them via PR. All 29 tracked findings remain
labeled (category + priority) and ready to be bulk-created as GitHub issues the
moment token permissions are granted (F002 resolution). PR creation/merge is
available (PRs #551–#559 merged under this token), so the docs-led output path is
fully functional.

## Score Trend

| Domain                  | 34th     | 35th     | 36th     | **37th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 81.6     | 81.8     | 82.3     | **81.6**           |
| B. System Quality       | 79.0     | 78.4     | 78.8     | **78.0**           |
| C. Experience Quality   | 82.8     | 82.5     | 82.5     | **82.7**           |
| D. Delivery & Evolution | 65.85    | 65.45    | 65.7     | **65.4**           |
| **COMPOSITE**           | **77.3** | **77.0** | **77.3** | **76.9**           |
