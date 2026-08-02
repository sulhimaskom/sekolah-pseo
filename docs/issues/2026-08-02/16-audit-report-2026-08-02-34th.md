# Phase 1 — Diagnostic & Comprehensive Scoring Report (34th verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ f1945a0 — 33rd verification docs merged via #543)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven verification
of F001/F015/F015-RESIDUAL; root-cause isolation of F026 formatBytes NaN); security PoC
harness (validator-only replication, no `execSync` executed); `explore` subagents (4×
parallel background: structure map, code-quality patterns, security surfaces, CI/docs
coverage — all collected via `background_output`)

---

## Executive Summary

| Domain                                | Score         | Grade | Δ vs 33rd |
| ------------------------------------- | ------------- | ----- | --------- |
| **A. Code Quality**                   | **81.6/100**  | B     | 0.0       |
| **B. System Quality**                 | **79.0/100**  | B     | −0.3      |
| **C. Experience Quality**             | **82.8/100**  | B     | −0.3      |
| **D. Delivery & Evolution Readiness** | **65.85/100** | C+    | −3.65     |
| **COMPOSITE**                         | **77.3/100**  | B     | **−1.1**  |

Composite **−1.1 vs 33rd run (78.4)**. Headline: **TWO new findings**. **F025 (P1)**: the
GitHub Pages deployment is green (31/31 successful `pages build and deployment` runs)
yet the live site returns **HTTP 404 on the root path** — `dist/` is gitignored and
never committed, so no `index.html` is published; the deployment pipeline is green while
the product is unreachable. **F026 (P3)**: `formatBytes()` produces `"NaN undefined"`
for negative memory deltas (post-GC), an observability/logging bug in the build report.
All 24 prior findings re-verified (F014 not observed 0/3; F015 fix #542 holds). F002
still blocks GitHub issue creation (403 `createIssue`, 31st consecutive); findings ship
as labeled docs records + PR (established pattern).

## Global Penalties

| Rule                   | Penalty | Justification                                                                       |
| ---------------------- | ------- | ----------------------------------------------------------------------------------- |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, ~33ms, budgets met (×2 runs) |
| Test failure           | —       | ✅ PASS ×3 — 1032 pass / 0 fail (4 skipped); Python 27/27; F014 not observed        |
| Critical vulnerability | —       | ✅ F015 primary vectors rejected; F015-RESIDUAL not exploitable today               |

## Audit Commands (fresh, this run)

| Command                                     | Result                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm ci`                                    | ✅ 0 vulnerabilities; ⚠️ lint-staged@17.2.0 EBADENGINE persists (F012)        |
| `npm run build` (×2)                        | ✅ exit 0, 2 pages, 0 failed; ⚠️ 1st run "Memory delta: NaN undefined" (F026) |
| `npm run lint` (eslint)                     | ✅ clean — 0 errors, 0 warnings                                               |
| `npm run format:check`                      | ❌ **48 files fail Prettier (F005, stable)**                                  |
| `npm run test:js` (×3 fresh)                | ✅ 3/3 clean — 1032 pass / 0 fail (F014 latent, 0/3)                          |
| `npm run test:js:coverage`                  | ✅ 95.33% stmt / 92.30% branch / 96.63% funcs — above 80/75 thresholds        |
| `python3 tests/run_tests.py`                | ✅ 27/27 pass                                                                 |
| `npm run test:py:pytest`                    | ❌ `No module named pytest` — Python test deps not installed (F009/012 adj.)  |
| `npm audit`                                 | ✅ 0 vulnerabilities                                                          |
| `node scripts/check-workflow-security.js`   | ❌ **12 violations: 2 CRITICAL + 10 HIGH (F013, stable)**                     |
| `npm run validate-links` (post-build)       | ❌ **F024: 2 broken links** (sitemap-index.xml refs)                          |
| `npm run check-freshness`                   | ⚠️ STALE — 2026-07-20 (13 days, threshold 7); 2 records (F018)                |
| F001 code trace (`main()` → copyToRaw)      | ❌ floating Promise confirmed (`fetch-data.js:353`)                           |
| F015/F015-RESIDUAL PoC (6 literal + 5 enc.) | ✅ literal REJECTED; ❌ 5 encoded payload classes ACCEPTED                    |
| F026 formatBytes PoC (negative delta)       | ❌ `"NaN undefined"` reproduced (root cause: Math.log(negative))              |
| Live site probe (gh api pages + curl)       | ❌ **F025: root HTTP 404; robots.txt 200; 31/31 green deployments**           |
| `gh issue create` (probe)                   | ❌ **403 `createIssue` (F002, 31st consecutive)**                             |

---

## A. CODE QUALITY (Weighted: 81.6/100 — unchanged)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                   |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 90    | 13.50     | F015 closed; F001 functional breakage (−8); F014 latent (−2)                                |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistent                                            |
| Simplicity            | 10      | 85    | 8.50      | Simple CSV→HTML pipeline; CI layer overengineered (F007); isTransientError complexity 29    |
| Modularity & SRP      | 15      | 74    | 11.10     | styles.js 1275L (F008); homepage.js 716L; utils.js 415L; validator duplication (F023)       |
| Consistency           | 5       | 70    | 3.50      | F005 48 files; 3× required-fields list; 4× coord checkers; console.log vs pino split        |
| Testability           | 15      | 78    | 11.70     | Coverage 95.33 met; F014 latent; pytest not wired (F009); no E2E (F010); F021/F022 untested |
| Maintainability       | 10      | 76    | 7.60      | No TODO/FIXME; oversized files; test-only dead exports (checkNpsnUniqueness et al.)         |
| Error Handling        | 10      | 88    | 8.80      | IntegrationError + ERROR_CODES; resilience; some silent swallows                            |
| Dependency Discipline | 5       | 90    | 4.50      | 1 prod dep (pino); 0 vulns; lint-staged mismatch (F012)                                     |
| Determinism           | 5       | 72    | 3.60      | F014 latent; F001 floating promise; timestamps in manifest/sitemap                          |
| **TOTAL**             | **100** |       | **81.60** |

---

## B. SYSTEM QUALITY (RUNTIME) (79.0/100, −0.3 vs 33rd)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                          |
| ------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 78    | 15.60     | Build deterministic (×2); F014 latent (0/3); CI not gating                                         |
| Performance   | 15      | 90    | 13.50     | ~33ms build, budgets met                                                                           |
| Security      | 20      | 65    | 13.00     | F015 primary closed (+20); F015-RESIDUAL encoded (−5); F013 12 violations (−23); F004 57 refs (−7) |
| Scalability   | 15      | 82    | 12.30     | incremental build; data truncated (F018)                                                           |
| Resilience    | 15      | 88    | 13.20     | retry/circuit-breaker/timeout (fs-safe, fetch-data)                                                |
| Observability | 15      | 76    | 11.40     | pino logging; **F026 (−2)**: "Memory delta: NaN undefined"; console.log escapes (data-quality.js)  |
| **TOTAL**     | **100** |       | **79.00** |

**B3. Security (65, unchanged)** — F015 RESOLVED maintained (6 literal payload classes
rejected live). F015-RESIDUAL re-confirmed: 5 encoded payload classes accepted
(`%26%26`, `%3B`, `%7C`, `%60`, `%2F` with `.git` preserved). F013: 12 violations
unchanged (DUPLICATE_API_KEY ×5 occurrences across 2 files). F004: 57 secret refs.

**B6. Observability (76, −2)** — NEW F026: `formatBytes(-N)` → `Math.log` → NaN →
"NaN undefined" (verified with negative-delta unit reproduction). Log-only cosmetic,
but degrades exactly the metric maintainers need when GC frees memory.

---

## C. EXPERIENCE QUALITY (82.8/100, −0.3 vs 33rd)

| Criterion                | Weight  | Score | Weighted  | Rationale                                           |
| ------------------------ | ------- | ----- | --------- | --------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down     |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                            |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports                       |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap   |
| Documentation Accuracy   | 14      | 56    | 7.84      | F005 (48 files); F016/F017 stale refs; README drift |
| Debuggability (DX)       | 10      | 82    | 8.20      | pino; named errors; F026 NaN metric (−)             |
| Build/Test Feedback (DX) | 12      | 90    | 10.80     | ~33ms build; tests <5s; fast local loop             |
| **TOTAL**                | **100** |       | **82.80** |

**C6. Documentation Accuracy (56, −2)** — README drift confirmed (3 spots: phantom
`gitignore-check` workflow; `manifest.json` vs actual `.build-manifest.json`; directory
structure omits 7 scripts + .devcontainer/.github/actions/.husky). F005 48 files,
F016, F017 unchanged. Docs coverage itself is exemplary (34-run verification ledger).

---

## D. DELIVERY & EVOLUTION READINESS (65.85/100, −3.65 vs 33rd)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                      |
| ------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------ |
| CI/CD Health        | 20      | 58    | 11.60     | F013 (12); F002 blocked 31st; F009/F010; **F025 green-but-broken deploy (−3)** |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                     |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder; node version drift (.nvmrc 22 vs CI 20)             |
| Migration Safety    | 15      | 70    | 10.50     | F018 data regression (3474→2) unplanned                                        |
| Tech Debt           | 15      | 62    | 9.30      | F005 (48); F019/F020 dead code; F007 sprawl; F001/F024/F025 live               |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; 84 commits/33d; 73% agent-generated                 |
| **TOTAL**           | **100** |       | **65.85** |

**D1. CI/CD Health (58, −3)** — the `pull` workflow (on-pull.yml) is the only actively
green pipeline (62/64 recent runs); `oc - orchestrator` is 4/4 failed; `parallel.yml` is
manually disabled; `on-push.yml` dormant since 2026-07-27. **F025**: `pages build and
deployment` 31/31 green while the site 404s — deployment status is not a proxy for site
health. No deterministic build/test gate in CI (agent-driven only).

**D2. Release & Rollback (50, −15)** — NEW F025 deduction: a "green" release pipeline
publishing an empty artifact is the strongest possible failure of release safety. No
tags, no release workflow, no rollback procedure. Live-site 404 means current state is
broken-in-production.

---

## Findings Matrix (27 tracked entries)

| ID            | Finding                                               | Category | Priority | Status (this run)                                      |
| ------------- | ----------------------------------------------------- | -------- | -------- | ------------------------------------------------------ |
| F001          | Floating promise in fetch-data.js `main()`            | bug      | P1       | **RE-CONFIRMED** (code trace)                          |
| F002          | Loop token lacks `issues: write` (403 createIssue)    | ci       | P1       | RE-CONFIRMED (31st) — output blocked                   |
| F003          | Global concurrency groups in on-push.yml              | ci       | P2       | RE-VERIFIED (line 10)                                  |
| F004          | Excessive CI secret exposure (57 refs)                | security | P1       | RE-VERIFIED (fresh count 57)                           |
| F005          | Prettier drift                                        | docs     | P3       | RE-VERIFIED — stable 48 files                          |
| F006          | SITE_URL placeholder (example.com)                    | chore    | P2       | RE-VERIFIED (build log)                                |
| F007          | CI workflow overcomplexity (2045L)                    | refactor | P2       | RE-VERIFIED (wc -l)                                    |
| F008          | styles.js oversized 1275L                             | refactor | P2       | RE-VERIFIED                                            |
| F009          | pytest not wired into CI                              | test     | P2       | RE-VERIFIED (+ pytest module absent in env)            |
| F010          | Missing E2E/integration tests                         | test     | P3       | RE-VERIFIED                                            |
| F011          | Missing automated release (0 tags)                    | ci       | P2       | RE-VERIFIED (git tag → 0)                              |
| F012          | lint-staged engine mismatch                           | chore    | P3       | RE-VERIFIED (EBADENGINE on install)                    |
| F013          | Workflow permissions (12 violations)                  | security | P2       | RE-VERIFIED (checker: 2 CRITICAL + 10 HIGH)            |
| F014          | Parallel test-file race on DIST_DIR                   | test     | P1       | NOT OBSERVED (0/3) — root cause unchanged              |
| F015          | OS command injection in fetch-data.js                 | security | P1       | **RESOLVED — maintained (fix #542)**                   |
| F015-RESIDUAL | Percent-encoded metacharacters pass validateRepoUrl   | security | P2       | RE-CONFIRMED (5 encoded classes accepted)              |
| F016          | README documents non-existent `gitignore-check`       | docs     | P3       | RE-VERIFIED (file absent)                              |
| F017          | docs/api.md documents nonexistent `addNumbers()`      | docs     | P3       | RE-VERIFIED (0 hits)                                   |
| F018          | schools.csv data regression 3474→2                    | bug      | P1       | RE-CONFIRMED (2 records, STALE 13d)                    |
| F019          | Dead code tests/run_tests.py                          | refactor | P3       | RE-VERIFIED                                            |
| F020          | Dead script apply-caching-patch.sh                    | chore    | P3       | RE-VERIFIED (patch file missing)                       |
| F021          | Orphaned check-workflow-security.js gate              | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                      |
| F022          | head-meta.js untested                                 | test     | P3       | RE-VERIFIED (no test file)                             |
| F023          | Validator logic duplication                           | refactor | P3       | RE-VERIFIED                                            |
| F024          | Build omits sitemap; 404.html broken link             | bug      | P2       | RE-CONFIRMED (2 broken links)                          |
| **F025**      | **Live GitHub Pages site returns 404 (green deploy)** | bug      | P1       | **NEW** — curl root=404, robots=200, dist/ uncommitted |
| **F026**      | **formatBytes NaN on negative memory delta**          | bug      | P3       | **NEW** — "NaN undefined" reproduced                   |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh
issue create` → 403, 31st consecutive run). Following the established repo pattern (runs
1–33), this run records findings as labeled docs records under
`docs/issues/2026-08-02/11-issue-records-34th/` and ships them via PR. All 27 tracked
findings remain labeled (category + priority) and ready to be bulk-created as GitHub
issues the moment token permissions are granted (F002 resolution).

## Score Trend

| Domain                  | 30th     | 31st     | 33rd     | **34th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 80.2     | 80.1     | 81.6     | **81.6**           |
| B. System Quality       | 76.7     | 76.7     | 79.3     | **79.0**           |
| C. Experience Quality   | 83.6     | 83.1     | 83.1     | **82.8**           |
| D. Delivery & Evolution | 69.8     | 69.2     | 69.5     | **65.85**          |
| **COMPOSITE**           | **77.6** | **77.3** | **78.4** | **77.3**           |
