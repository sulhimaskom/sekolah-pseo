# Phase 1 — Diagnostic & Comprehensive Scoring Report (36th verification, 2026-08-03)

**Evaluation Date**: 2026-08-03
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 880e02d — deps-dev bump lint-staged #547)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: security PoC/replication (validator-only); targeted code-trace greps
(code-quality, security, CI/docs); fresh `npm audit`, `eslint`, `prettier`,
`node --test`, `pytest` runs. No `oracle`/`momus` delegation needed this run.

---

## Executive Summary

| Domain                                | Score         | Grade | Δ vs 35th |
| ------------------------------------- | ------------- | ----- | --------- |
| **A. Code Quality**                   | **82.3/100**  | B     | +0.5      |
| **B. System Quality**                 | **78.8/100**  | B     | +0.4      |
| **C. Experience Quality**             | **82.5/100**  | B     | +0.0      |
| **D. Delivery & Evolution Readiness** | **65.7/100**  | C+    | +0.25     |
| **COMPOSITE**                         | **77.3/100**  | B     | **+0.3**  |

Composite **+0.3 vs 35th run (77.0)**. Headline: **two tracked findings RESOLVED** —
**F001** (floating Promise in `fetch-data.js#main()` is now awaited, with inline F001
comment) and **F027** (workflow-security `--json` mode now correctly exits 1 on
violations). **One NEW finding — F028 (P2)**: `brace-expansion@5.0.8` (transitive via
`eslint → minimatch`) carries a **high-severity DoS advisory** (GHSA-rgw5-rvv9-x895,
bypass of CVE-2026-14257); fix available at 5.0.9, dev-tooling-only blast radius.
F004 secret refs drifted **59→57** (improvement); F005 Prettier drift holds at **49
files**; F025 live site still root-404 with 33/33 green Pages deployments; F018 data
**STALE 14 days** (worsened +1). F002 still blocks GitHub issue creation (403, 33rd
consecutive); output ships as labeled docs records + PR.

## Global Penalties

| Rule                   | Penalty | Justification                                                                |
| ---------------------- | ------- | ---------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, ~27ms, budgets met    |
| Test failure           | —       | ✅ PASS — 1049 pass / 0 fail (4 skipped); Python 27/27; F014 not observed    |
| Critical vulnerability | —       | ⚠️ NEW F028 high-severity (dev-tooling) — treated as criterion deduction, not global −20 (no production surface) |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `npm install`                                    | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists     |
| `npm run build`                                  | ✅ exit 0, 2 pages, 0 failed, ~27ms; budgets met                              |
| `npx eslint scripts src`                         | ✅ clean — 0 errors, 0 warnings                                               |
| `npm run format:check`                           | ❌ **49 files fail Prettier (F005, held)**                                    |
| `npm run test:js`                                | ✅ 1049 pass / 0 fail (4 skipped)                                             |
| `npm run test:js:coverage`                       | ✅ 95.28% stmt / 92.61% branch / 96.65% funcs — above 80/75 thresholds        |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                 |
| `npm audit`                                      | ❌ **NEW F028 — 1 high severity (brace-expansion)**                            |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH) — human exit 1 (F013)                 |
| `node scripts/check-workflow-security.js --json` | ✅ **F027 RESOLVED — exit 1 with 12 violations in payload**                   |
| F001 code trace (`main()` → fetchFromGitHub)     | ✅ **RESOLVED — `await fetchFromGitHub(...)` at :378**                        |
| Live site probe (gh api pages + curl)            | ❌ **F025: root HTTP 404; robots 200; Pages "built"**                         |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (14 days, threshold 7); 2 records (F018, worsened)      |
| F004 re-count (`secrets.*`)                      | ❌ **57 refs / 10 unique names** (drifted 59→57 — improvement)                |
| F007 line count                                  | ❌ 2045 total workflow lines                                                  |
| F012 engine probe (`npm ls`, install)            | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2                |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 33rd consecutive)**                             |

---

## A. CODE QUALITY (Weighted: 82.3/100, +0.5 vs 35th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                |
| --------------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------- |
| Correctness           | 15      | 96    | 14.40     | **F001 RESOLVED (+6)**: floating promise awaited; F014 latent (−2); F026 NaN metric (−2) |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistent                                         |
| Simplicity            | 10      | 85    | 8.50      | Simple CSV→HTML pipeline; CI layer overengineered (F007); isTransientError complexity 29 |
| Modularity & SRP      | 15      | 78    | 11.70     | SearchDataService/ExportService extracted (TASK-069); styles.js 1275L (F008); homepage 716L |
| Consistency           | 5       | 68    | 3.40      | F005 49 files (held); 3× required-fields list; console.log vs pino split                 |
| Testability           | 15      | 78    | 11.70     | Coverage 95.28 met; F014 latent; pytest not wired (F009); F022 untested                  |
| Maintainability       | 10      | 76    | 7.60      | No TODO/FIXME (verified 0 genuine); oversized files; test-only dead exports              |
| Error Handling        | 10      | 88    | 8.80      | IntegrationError + ERROR_CODES; resilience; some silent swallows                         |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); **F028 NEW (−6)**: high vuln in dev chain; F012 mismatch             |
| Determinism           | 5       | 80    | 4.00      | **F001 RESOLVED (+8)**: no floating promise; F014 latent; timestamps in manifest/sitemap |
| **TOTAL**             | **100** |       | **82.30** |

---

## B. SYSTEM QUALITY (RUNTIME) (78.8/100, +0.4 vs 35th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                            |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 80    | 16.00     | Build deterministic; F014 latent (0/3); **F001 resolved** removes cache-fallback instability (+2)     |
| Performance   | 15      | 90    | 13.50     | ~27ms build, budgets met                                                                             |
| Security      | 20      | 66    | 13.20     | **F027 RESOLVED (+4)**: `--json` gate works; **F028 NEW (−2)**: high-severity dev dep; F013 12 (−2)  |
| Scalability   | 15      | 82    | 12.30     | incremental build; data truncated (F018)                                                             |
| Resilience    | 15      | 88    | 13.20     | retry/circuit-breaker/timeout (fs-safe, fetch-data)                                                  |
| Observability | 15      | 76    | 11.40     | pino logging; F026 NaN metric (−2); console.log escapes (interactive 26, checker 14, data-quality 2) |
| **TOTAL**     | **100** |       | **78.80** |

**B3. Security (66, +4)** — **F027 RESOLVED**: `--json` mode now exits 1 with 12
violations in the payload (verified live this run); the documented "JSON for CI"
contract is functional again. **F028 NEW (−2)**: high-severity DoS advisory in
`brace-expansion@5.0.8` (dev-tooling chain via eslint→minimatch; no production
runtime exposure). F013: 12 violations unchanged. F004: 57 refs (−2 drift,
improvement).

**B6. Observability (76, unchanged)** — F026 `"NaN undefined"` still latent (unit
repro only; natural builds show positive memory deltas).

---

## C. EXPERIENCE QUALITY (82.5/100, +0.0 vs 35th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                              |
| ------------------------ | ------- | ----- | --------- | ------------------------------------------------------ |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion    |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down        |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback    |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                               |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports                          |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap      |
| Documentation Accuracy   | 14      | 54    | 7.56      | F005 49 files (held); F016/F017 stale refs; README drift |
| Debuggability (DX)       | 10      | 82    | 8.20      | pino; named errors; F026 NaN metric (−)                |
| Build/Test Feedback (DX) | 12      | 90    | 10.80     | ~27ms build; tests <5s; fast local loop                |
| **TOTAL**                | **100** |       | **82.52** |

**C6. Documentation Accuracy (54, unchanged)** — F005 held at 49 files; README
drift confirmed (phantom `gitignore-check`; `manifest.json` vs `.build-manifest.json`).
Docs coverage itself remains exemplary (36-run verification ledger).

---

## D. DELIVERY & EVOLUTION READINESS (65.7/100, +0.25 vs 35th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                        |
| ------------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 58    | 11.60     | **F027 RESOLVED (+2)**: checker `--json` gate works; F013 (12); F002 33rd; F025  |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                       |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder; node version drift (.nvmrc 22 vs CI 20 vs engines 20) |
| Migration Safety    | 15      | 70    | 10.50     | F018 data regression (3474→2) unplanned                                          |
| Tech Debt           | 15      | 63    | 9.45      | **F001/F027 resolved (−1 debt)**; F005 (49); F019/F020 dead code; F007 sprawl    |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; 14+ commits/24h; docs-led throughput                  |
| **TOTAL**           | **100** |       | **65.70** |

**D1. CI/CD Health (58, +2)** — F027 resolved restores the workflow-security gate.
F025 persists: Pages "built" while root 404s — deployment status is not a proxy for
site health. F002 still blocks `issues: write`.

---

## Findings Matrix (29 tracked entries)

| ID            | Finding                                               | Category | Priority | Status (this run)                                       |
| ------------- | ----------------------------------------------------- | -------- | -------- | ------------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`            | bug      | P1       | **RESOLVED** (awaited at fetch-data.js:378)             |
| F002          | Loop token lacks `issues: write` (403 createIssue)    | ci       | P1       | RE-CONFIRMED (33rd) — output blocked                    |
| F003          | Global concurrency groups in on-push.yml              | ci       | P2       | RE-VERIFIED (line 10)                                   |
| F004          | Excessive CI secret exposure (59→57 refs)             | security | P1       | RE-VERIFIED — **drift 59→57 (improvement)**             |
| F005          | Prettier drift                                        | docs     | P3       | RE-VERIFIED — 49 files (held)                          |
| F006          | SITE_URL placeholder (example.com)                    | chore    | P2       | RE-VERIFIED (build log)                                 |
| F007          | CI workflow overcomplexity (2045L)                    | refactor | P2       | RE-VERIFIED (wc -l exact)                               |
| F008          | styles.js oversized 1275L                             | refactor | P2       | RE-VERIFIED (exact)                                     |
| F009          | pytest not wired into CI                              | test     | P2       | RE-VERIFIED (+ pytest module absent in env)             |
| F010          | Missing E2E/integration tests                         | test     | P3       | RE-VERIFIED                                             |
| F011          | Missing automated release (0 tags)                    | ci       | P2       | RE-VERIFIED (git tag → 0)                               |
| F012          | lint-staged engine mismatch                           | chore    | P3       | RE-VERIFIED (EBADENGINE on install)                     |
| F013          | Workflow permissions (12 violations)                  | security | P2       | RE-VERIFIED (2 CRITICAL + 10 HIGH)                      |
| F014          | Parallel test-file race on DIST_DIR                   | test     | P1       | NOT OBSERVED (0/3) — root cause unchanged               |
| F015          | OS command injection in fetch-data.js                 | security | P1       | RESOLVED — maintained (fix #542)                        |
| F015-RESIDUAL | Encoded + parser-rewritten metacharacters accepted    | security | P2       | OPEN — 7 classes (5 encoded + 2 re-encoded)             |
| F016          | README documents non-existent `gitignore-check`       | docs     | P3       | RE-VERIFIED (file absent)                               |
| F017          | docs/api.md documents nonexistent `addNumbers()`      | docs     | P3       | RE-VERIFIED (0 hits)                                    |
| F018          | schools.csv data regression 3474→2                    | bug      | P1       | RE-CONFIRMED (2 records, **STALE 14d**, worsened)       |
| F019          | Dead code tests/run_tests.py                          | refactor | P3       | RE-VERIFIED                                             |
| F020          | Dead script apply-caching-patch.sh                    | chore    | P3       | RE-VERIFIED (patch file missing)                        |
| F021          | Orphaned check-workflow-security.js gate              | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                       |
| F022          | head-meta.js untested                                 | test     | P3       | RE-VERIFIED (no test file)                              |
| F023          | Validator logic duplication                           | refactor | P3       | RESOLVED as filed (file never existed)                  |
| F024          | Build omits sitemap; 404.html broken link             | bug      | P2       | RE-CONFIRMED (no sitemap step in build)                 |
| F025          | **Live GitHub Pages site returns 404 (green deploy)** | bug      | P1       | RE-CONFIRMED (Pages "built", root 404)                  |
| F026          | formatBytes NaN on negative memory delta              | bug      | P3       | RE-CONFIRMED (unit repro)                               |
| F027          | checker `--json` exits 0 with violations              | security | P2       | **RESOLVED** (process.exit added)                       |
| **F028**      | **brace-expansion@5.0.8 high-severity DoS vuln**      | security | P2       | **NEW** — GHSA-rgw5-rvv9-x895, fix 5.0.9                |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → 403, 33rd consecutive run). Following the established repo
pattern (runs 1–35), this run records findings as labeled docs records under
`docs/issues/2026-08-03/` and ships them via PR. All 29 tracked findings remain
labeled (category + priority) and ready to be bulk-created as GitHub issues the
moment token permissions are granted (F002 resolution).

## Score Trend

| Domain                  | 33rd     | 34th     | 35th     | **36th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 81.6     | 81.6     | 81.8     | **82.3**           |
| B. System Quality       | 79.3     | 79.0     | 78.4     | **78.8**           |
| C. Experience Quality   | 83.1     | 82.8     | 82.5     | **82.5**           |
| D. Delivery & Evolution | 69.5     | 65.85    | 65.45    | **65.7**           |
| **COMPOSITE**           | **78.4** | **77.3** | **77.0** | **77.3**           |
