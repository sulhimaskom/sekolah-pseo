# Phase 1 — Diagnostic & Comprehensive Scoring Report (35th verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ c390351 — 34th verification docs merged via #544/#545)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven verification
of F001/F015-RESIDUAL/F026; exit-code hypothesis testing for NEW F027); security PoC
harness (validator-only replication, no `execSync` executed); 4× parallel `explore`
subagents (structure map, code-quality patterns, security surfaces, CI/docs coverage —
all collected via `background_output`)

---

## Executive Summary

| Domain                                | Score         | Grade | Δ vs 34th |
| ------------------------------------- | ------------- | ----- | --------- |
| **A. Code Quality**                   | **81.8/100**  | B     | +0.2      |
| **B. System Quality**                 | **78.4/100**  | B     | −0.6      |
| **C. Experience Quality**             | **82.5/100**  | B     | −0.3      |
| **D. Delivery & Evolution Readiness** | **65.45/100** | C+    | −0.4      |
| **COMPOSITE**                         | **77.0/100**  | B     | **−0.3**  |

Composite **−0.3 vs 34th run (77.3)**. Headline: **one NEW finding** — **F027 (P2)**:
`scripts/check-workflow-security.js --json` returns **exit code 0 even with 12
violations**, so the tool's own documented CI contract (`--json` "for CI") is a
no-op; combined with F021 (husky swallows failures) there is today **no** enforcement
path for workflow security. **F023 RESOLVED as filed** (validator-duplication premise
void — `validate-repo-url.js` never existed in tree or history). **F015-RESIDUAL
BROADENED**: the WHATWG parser rewrites literal backtick/`<>` before the regex check,
so 2 _literal_ classes are now also accepted (5 encoded + 2 re-encoded = 7 classes).
F004 drifted 57→59 secret refs; F005 drifted 48→49 Prettier files; F025 Pages
deployments now 33/33 green while the site still 404s. F002 still blocks GitHub issue
creation (403 `createIssue`, 32nd consecutive); output ships as labeled docs records + PR.

## Global Penalties

| Rule                   | Penalty | Justification                                                                |
| ---------------------- | ------- | ---------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` ×2 → exit 0, 2 pages, 0 failed, ~27ms, budgets met |
| Test failure           | —       | ✅ PASS ×3 — 1032 pass / 0 fail (4 skipped); Python 27/27; F014 not observed |
| Critical vulnerability | —       | ✅ F015 literal vectors rejected; F015-RESIDUAL not exploitable today        |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `npm ci`                                         | ✅ 0 vulnerabilities; ⚠️ lint-staged@17.2.0 EBADENGINE persists (F012)        |
| `npm run build` (×2)                             | ✅ exit 0, 2 pages, 0 failed, ~27ms; positive memory deltas (F026 latent)     |
| `npm run lint` (eslint)                          | ✅ clean — 0 errors, 0 warnings                                               |
| `npm run format:check`                           | ❌ **49 files fail Prettier (F005, drifted +1)**                              |
| `npm run test:js` (×3 fresh)                     | ✅ 3/3 clean — 1032 pass / 0 fail (F014 latent, 0/3)                          |
| `npm run test:js:coverage`                       | ✅ 95.33% stmt / 92.30% branch / 96.63% funcs — above 80/75 thresholds        |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                 |
| `npm run test:py:pytest`                         | ❌ `No module named pytest` — Python test deps not installed (F009)           |
| `npm audit`                                      | ✅ 0 vulnerabilities                                                          |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH) — human mode exit 1 (F013)            |
| `node scripts/check-workflow-security.js --json` | ❌ **NEW F027: exit 0 with 12 violations in payload**                         |
| F001 code trace (`main()` → fetchFromGitHub)     | ❌ floating Promise confirmed — no await in main(); async execute/retry chain |
| F015/F015-RESIDUAL PoC (5 literal + 5 enc.)      | ✅ `;` `$(` `&&` `                                                            | `REJECTED; ❌ backtick +`<>` + 5 encoded ACCEPTED |
| F026 formatBytes unit repro (negative delta)     | ❌ `"NaN undefined"` reproduced (`Math.log(negative)`)                        |
| Live site probe (gh api pages + curl)            | ❌ **F025: root HTTP 404; robots 200; 33/33 green deployments**               |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (13 days, threshold 7); 2 records (F018)                |
| F004 re-count (`secrets.*`)                      | ❌ **59 refs / 11 unique names** (drifted 57→59)                              |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 32nd consecutive)**                             |
| F023 git-history scan                            | ✅ **RESOLVED** — `validate-repo-url.js` never existed in any commit          |

---

## A. CODE QUALITY (Weighted: 81.8/100, +0.2 vs 34th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                |
| --------------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------- |
| Correctness           | 15      | 90    | 13.50     | F015 closed; F001 functional breakage (−8); F014 latent (−2)                             |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistent                                         |
| Simplicity            | 10      | 85    | 8.50      | Simple CSV→HTML pipeline; CI layer overengineered (F007); isTransientError complexity 29 |
| Modularity & SRP      | 15      | 76    | 11.40     | **F023 RESOLVED (+2)**; styles.js 1275L (F008); homepage.js 716L                         |
| Consistency           | 5       | 68    | 3.40      | F005 49 files (drift +1); 3× required-fields list; console.log vs pino split             |
| Testability           | 15      | 78    | 11.70     | Coverage 95.33 met; F014 latent; pytest not wired (F009); F022 untested                  |
| Maintainability       | 10      | 76    | 7.60      | No TODO/FIXME (verified 0 genuine); oversized files; test-only dead exports              |
| Error Handling        | 10      | 88    | 8.80      | IntegrationError + ERROR_CODES; resilience; some silent swallows                         |
| Dependency Discipline | 5       | 90    | 4.50      | 1 prod dep (pino); 0 vulns; lint-staged mismatch (F012)                                  |
| Determinism           | 5       | 72    | 3.60      | F014 latent; F001 floating promise; timestamps in manifest/sitemap                       |
| **TOTAL**             | **100** |       | **81.80** |

---

## B. SYSTEM QUALITY (RUNTIME) (78.4/100, −0.6 vs 34th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                            |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 78    | 15.60     | Build deterministic (×2); F014 latent (0/3); CI not gating                                           |
| Performance   | 15      | 90    | 13.50     | ~27ms build, budgets met                                                                             |
| Security      | 20      | 62    | 12.40     | **F027 NEW (−3)**: `--json` exit 0 = enforcement broken; F015-RESIDUAL broadened (−3); F013 12 (−2)  |
| Scalability   | 15      | 82    | 12.30     | incremental build; data truncated (F018)                                                             |
| Resilience    | 15      | 88    | 13.20     | retry/circuit-breaker/timeout (fs-safe, fetch-data)                                                  |
| Observability | 15      | 76    | 11.40     | pino logging; F026 NaN metric (−2); console.log escapes (interactive 26, checker 14, data-quality 2) |
| **TOTAL**     | **100** |       | **78.40** |

**B3. Security (62, −3)** — **NEW F027**: `check-workflow-security.js --json` → exit 0
with 12 violations present (verified: human mode exit 1; JSON branch lacks
`process.exit`). SECURITY_AUDIT_NOTE.md:95 recommends JSON output "for CI" — that
contract is a no-op today. F015-RESIDUAL broadened to 7 accepted classes (5 encoded +
backtick + `<>` re-encoded by WHATWG). F013: 12 violations unchanged. F004: 59 refs
(+2 drift).

**B6. Observability (76, unchanged)** — F026 `"NaN undefined"` reproduced via unit
PoC (`Math.log(negative)`); not observed in natural builds this run (positive deltas).

---

## C. EXPERIENCE QUALITY (82.5/100, −0.3 vs 34th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                              |
| ------------------------ | ------- | ----- | --------- | ------------------------------------------------------ |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion    |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down        |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback    |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                               |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports                          |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap      |
| Documentation Accuracy   | 14      | 54    | 7.56      | F005 49 files (−1); F016/F017 stale refs; README drift |
| Debuggability (DX)       | 10      | 82    | 8.20      | pino; named errors; F026 NaN metric (−)                |
| Build/Test Feedback (DX) | 12      | 90    | 10.80     | ~27ms build; tests <5s; fast local loop                |
| **TOTAL**                | **100** |       | **82.52** |

**C6. Documentation Accuracy (54, −2)** — F005 drifted to 49 files; README drift
confirmed (phantom `gitignore-check`; `manifest.json` vs `.build-manifest.json`;
directory tree omits 9 scripts). F016/F017 unchanged. Docs coverage itself remains
exemplary (35-run verification ledger).

---

## D. DELIVERY & EVOLUTION READINESS (65.45/100, −0.4 vs 34th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                        |
| ------------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 56    | 11.20     | **F027 NEW (−2)**: checker `--json` never fails; F013 (12); F002 32nd; F025      |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                       |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder; node version drift (.nvmrc 22 vs CI 20 vs engines 20) |
| Migration Safety    | 15      | 70    | 10.50     | F018 data regression (3474→2) unplanned                                          |
| Tech Debt           | 15      | 62    | 9.30      | F005 (49); F019/F020 dead code; F007 sprawl; F001/F024/F025 live                 |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; 14 commits/24h; docs-led throughput                   |
| **TOTAL**           | **100** |       | **65.45** |

**D1. CI/CD Health (56, −2)** — NEW F027: the only workflow-security tool's documented
CI mode (`--json`) exits 0 on violations; the recommended `security-regression-check.yml`
workflow still does not exist. on-pull.yml is the only actively green pipeline;
orchestrator 4/4 failed; parallel manually disabled; on-push dormant. F025: 33/33 green
Pages while site 404s — deployment status is not a proxy for site health.

**D2. Release & Rollback (50, unchanged)** — F025 persists: green pipeline publishing
an empty artifact. No tags, no release workflow, no rollback procedure.

---

## Findings Matrix (28 tracked entries)

| ID            | Finding                                               | Category | Priority | Status (this run)                                       |
| ------------- | ----------------------------------------------------- | -------- | -------- | ------------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`            | bug      | P1       | **RE-CONFIRMED** (code trace + async chain)             |
| F002          | Loop token lacks `issues: write` (403 createIssue)    | ci       | P1       | RE-CONFIRMED (32nd) — output blocked                    |
| F003          | Global concurrency groups in on-push.yml              | ci       | P2       | RE-VERIFIED (line 10)                                   |
| F004          | Excessive CI secret exposure (59 refs)                | security | P1       | RE-VERIFIED — **drift 57→59**                           |
| F005          | Prettier drift                                        | docs     | P3       | RE-VERIFIED — **drift 48→49 files**                     |
| F006          | SITE_URL placeholder (example.com)                    | chore    | P2       | RE-VERIFIED (build log)                                 |
| F007          | CI workflow overcomplexity (2045L)                    | refactor | P2       | RE-VERIFIED (wc -l exact)                               |
| F008          | styles.js oversized 1275L                             | refactor | P2       | RE-VERIFIED (exact)                                     |
| F009          | pytest not wired into CI                              | test     | P2       | RE-VERIFIED (+ pytest module absent in env)             |
| F010          | Missing E2E/integration tests                         | test     | P3       | RE-VERIFIED                                             |
| F011          | Missing automated release (0 tags)                    | ci       | P2       | RE-VERIFIED (git tag → 0)                               |
| F012          | lint-staged engine mismatch                           | chore    | P3       | RE-VERIFIED (EBADENGINE on install)                     |
| F013          | Workflow permissions (12 violations)                  | security | P2       | RE-VERIFIED (2 CRITICAL + 10 HIGH)                      |
| F014          | Parallel test-file race on DIST_DIR                   | test     | P1       | NOT OBSERVED (0/3) — root cause unchanged               |
| F015          | OS command injection in fetch-data.js                 | security | P1       | **RESOLVED — maintained (fix #542)**                    |
| F015-RESIDUAL | Encoded + parser-rewritten metacharacters accepted    | security | P2       | **BROADENED — 7 classes (5 encoded + 2 re-encoded)**    |
| F016          | README documents non-existent `gitignore-check`       | docs     | P3       | RE-VERIFIED (file absent)                               |
| F017          | docs/api.md documents nonexistent `addNumbers()`      | docs     | P3       | RE-VERIFIED (0 hits)                                    |
| F018          | schools.csv data regression 3474→2                    | bug      | P1       | RE-CONFIRMED (2 records, STALE 13d)                     |
| F019          | Dead code tests/run_tests.py                          | refactor | P3       | RE-VERIFIED                                             |
| F020          | Dead script apply-caching-patch.sh                    | chore    | P3       | RE-VERIFIED (patch file missing)                        |
| F021          | Orphaned check-workflow-security.js gate              | security | P2       | RE-VERIFIED (husky `2>/dev/null`) + **compounded F027** |
| F022          | head-meta.js untested                                 | test     | P3       | RE-VERIFIED (no test file)                              |
| F023          | Validator logic duplication                           | refactor | P3       | **RESOLVED as filed** (file never existed)              |
| F024          | Build omits sitemap; 404.html broken link             | bug      | P2       | RE-CONFIRMED (no sitemap step in build)                 |
| F025          | **Live GitHub Pages site returns 404 (green deploy)** | bug      | P1       | RE-CONFIRMED (33/33 green, root 404)                    |
| F026          | formatBytes NaN on negative memory delta              | bug      | P3       | RE-CONFIRMED (unit repro)                               |
| **F027**      | **checker `--json` exits 0 with violations**          | security | P2       | **NEW** — enforcement contract broken                   |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh
issue create` → 403, 32nd consecutive run). Following the established repo pattern (runs
1–34), this run records findings as labeled docs records under
`docs/issues/2026-08-02/12-issue-records-35th/` and ships them via PR. All 28 tracked
findings remain labeled (category + priority) and ready to be bulk-created as GitHub
issues the moment token permissions are granted (F002 resolution).

## Score Trend

| Domain                  | 31st     | 33rd     | 34th     | **35th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 80.1     | 81.6     | 81.6     | **81.8**           |
| B. System Quality       | 76.7     | 79.3     | 79.0     | **78.4**           |
| C. Experience Quality   | 83.1     | 83.1     | 82.8     | **82.5**           |
| D. Delivery & Evolution | 69.2     | 69.5     | 65.85    | **65.45**          |
| **COMPOSITE**           | **77.3** | **78.4** | **77.3** | **77.0**           |
