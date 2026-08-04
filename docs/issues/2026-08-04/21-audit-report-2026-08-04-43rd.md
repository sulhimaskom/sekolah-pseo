# Phase 1 — Diagnostic & Comprehensive Scoring Report (43rd verification, 2026-08-04)

**Evaluation Date**: 2026-08-04
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 5557e3a — 42nd verification run docs PR #567)
**Trigger**: `ulw-loop` run — Phase 0.3 → Phase 1 (0 PRs / 0 issues)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: fresh `npm install` + `npm audit`, `eslint`, `prettier`, `node --test`,
coverage (`c8`), `pytest`, `check-workflow-security`, `check-freshness`,
`git-master`-style PR discipline, source re-verification of F037/F038/F029/F014 via
direct file reads, GitHub API probes (issues, PRs). Project `.opencode/skills`
contains no custom skill content (node_modules only); the registered
`vasilyu1983-ai-agents-public-git-commit-message` skill is a stub — no skills with
matching domain were available to load. No oracle/momus delegation needed — all
findings re-verified directly.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 42nd |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **75.1/100** | C     | **+1.0**  |
| **B. System Quality**                 | **71.9/100** | C     | **+0.2**  |
| **C. Experience Quality**             | **81.3/100** | B     | ±0.0      |
| **D. Delivery & Evolution Readiness** | **63.3/100** | C+    | **+0.6**  |
| **COMPOSITE**                         | **72.9/100** | C     | **+0.5**  |

Composite **+0.5 vs 42nd run (72.4)** — first upward movement in 5 runs, driven by
**F014 FIXED in-loop** (test race root-caused, minimally fixed, verified 5/5 paired

- 3/3 full-suite) and **F029 maintained RESOLVED** (PR #566 fix verified effective —
  no residue). **F037 + F038 (CRITICAL workflow-security) remain UNFIXED for a 5th
  run** — re-confirmed at source, remediation still blocked by **F050** (token lacks
  `workflows: write`). F002 blocks GitHub-issue output for the 40th consecutive run.

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                               |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 26ms, budgets met                                                                                      |
| Test failure           | —          | ⚠️ F014 RE-OBSERVED once (run 1 of 5), then **FIXED + verified** (5/5 paired, 3/3 full-suite); F029 clean — handled at criterion level                      |
| Critical vulnerability | ⚠️ applied | **F037 + F038 (CRITICAL, workflow CI)** — criterion-level Security deduction (50) as in 39th–42nd; not the global −20 (CI-pipeline, not production runtime) |

## Audit Commands (fresh, this run)

| Command                                     | Result                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm install`                               | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists                                                      |
| `npm run build`                             | ✅ exit 0, 2 pages, 0 failed, 26ms; budgets met                                                                                |
| `npm run lint`                              | ✅ clean — 0 errors, 0 warnings                                                                                                |
| `npx prettier --check .`                    | ❌ **59 files fail Prettier (F005 HELD at 59, all docs/issues ledger; source clean)**                                          |
| `npm run test:js` (5 runs)                  | ⚠️ **F014 RE-OBSERVED once** (run 1: `mkdir dist/` ENOENT at build-orchestrator.test.js:157); runs 2–5 clean (1049/0)          |
| F014 paired reproduction (4 runs)           | ❌ **3/4 failed** — `build-pages.test.js` + `build-orchestrator.test.js` racing on shared `dist/`                              |
| **F014 FIX + verification (5 paired runs)** | ✅ **5/5 pass** after per-process temp DIST_DIR redirect in build-orchestrator.test.js                                         |
| **F014 fix verification (3 full runs)**     | ✅ **1053 tests / 1049 pass / 0 fail ×3**; lint clean; Prettier clean on changed file; coverage unchanged (95.23/92.56)        |
| post-test `git status` (F029 trace)         | ✅ **CLEAN** — **F029 maintained RESOLVED** (PR #566 effective; no residue)                                                    |
| `npm run test:js:coverage`                  | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                         |
| `python3 tests/run_tests.py`                | ✅ 27/27 pass                                                                                                                  |
| `npm audit`                                 | ❌ **1 high severity (brace-expansion@5.0.8, F028 held)**                                                                      |
| `node scripts/check-workflow-security.js`   | ❌ 12 violations (2 CRITICAL + 10 HIGH), human exit 1 (F013 held)                                                              |
| `npm run check-freshness`                   | ⚠️ STALE — 2026-07-20 (15 days, threshold 7); 2 records (F018 held)                                                            |
| `gh issue create` (probe)                   | ❌ **403 `createIssue` (F002, 40th consecutive)**                                                                              |
| F004 re-count (`secrets.*`)                 | ❌ 57 refs / 10 unique names (yml only; 42nd's 59 included template.md)                                                        |
| F007 line count                             | ❌ 2045 total workflow lines (held)                                                                                            |
| F008 line count                             | ❌ src/presenters/styles.js **1296 lines** (held)                                                                              |
| F011 tag count                              | ❌ 0 tags (held)                                                                                                               |
| F012 engine probe (`npm ls`)                | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2 (held)                                                          |
| F017 api.md probe (`addNumbers`)            | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                       |
| F026 unit repro (formatBytes NaN)           | ❌ RE-CONFIRMED — `formatBytes(NaN)` → `"NaN undefined"`                                                                       |
| F025 site probe (`curl`)                    | ❌ 404 (held)                                                                                                                  |
| F037 source re-verification                 | ❌ **CONFIRMED** — opencode.yml:8-9 `issue_comment` trigger with `issues/pull-requests/contents/actions: write` on PUBLIC repo |
| F038 source re-verification                 | ❌ **CONFIRMED** — architect-agent.yml:6/208 `custom_prompt` interpolated directly inside `run:` heredoc                       |

---

## A. CODE QUALITY (75.1/100, +1.0 vs 42nd)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                           |
| --------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 75    | 11.25     | **F014 FIXED (+1)**; F045/F046/F047/F049 held; no new code defects observed                                                         |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity            | 10      | 80    | 8.00      | F048 dead searchLoaded + test-only exports (held); F035 dead fallback (held); CI overcomplexity F007                                |
| Modularity & SRP      | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; homepage 737L; F045/F046 boundary drift (held)                                |
| Consistency           | 5       | 62    | 3.10      | **F005 HELD at 59 files** (no growth); 3× required-fields list; console.log vs pino split                                           |
| Testability           | 15      | 69    | 10.35     | **F014 FIXED (+3)**; **F029 maintained RESOLVED (+2)**; F030 masked by test (−2)                                                    |
| Maintainability       | 10      | 72    | 7.20      | F045/F046/F048 held debt; F035/F036 held; oversized files (F008)                                                                    |
| Error Handling        | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); F028 held (high dev vuln); F012 mismatch                                                                         |
| Determinism           | 5       | 72    | 3.60      | **F014 FIXED (+2)**; F032 held (−3) sitemap lastmod; F045 held-delta                                                                |
| **TOTAL**             | **100** |       | **75.10** |

**A1. Correctness (75, +1)** — F014 fixed: the `prepareBuildEnvironment` smoke tests
no longer race with `build-pages.test.js` on the shared `dist/` directory. F045–F049
code defects remain open (stale pages, whole-build abort, corrupted JSON-LD,
copy-feedback), unchanged.

**A6. Testability (69, +2)** — the two P1 test-hygiene findings both improved: F014
fixed in-loop with a deterministic per-process temp-dir redirect (5/5 paired + 3/3
full-suite verified), and F029 maintained resolved (clean tree after every test run
this session — PR #566's `--output` temp-path fix is effective).

---

## B. SYSTEM QUALITY (RUNTIME) (71.9/100, +0.2 vs 42nd)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                        |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 73    | 14.60     | **F014 FIXED (+1)**; F045 stale-page accumulation (held); F013 CI nondeterminism (−2)                            |
| Performance   | 15      | 90    | 13.50     | 26ms build, budgets met                                                                                          |
| Security      | 20      | 50    | 10.00     | **F037+F038 CRITICAL UNFIXED 5th run (−11)**; F039–F044 held (−8); F028 (−2); F013 (−2)                          |
| Scalability   | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                                     |
| Resilience    | 15      | 80    | 12.00     | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise |
| Observability | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                    |
| **TOTAL**     | **100** |       | **71.85** |

**B3. Security (50, ±0)** — unchanged for a **fifth verification run**: F037 (public-
repo `issue_comment` → unauthenticated write-token LLM agent, opencode.yml:8-9) and
F038 (proven shell RCE via `workflow_dispatch custom_prompt` heredoc injection,
architect-agent.yml:6/208) remain open. The repo is PUBLIC, so both remain externally
triggerable. F039–F044 also held. Remediation requires `workflows: write` (F050),
which the loop token lacks — the fix patch from the 42nd run remains valid but
unpushable.

---

## C. EXPERIENCE QUALITY (81.3/100, ±0.0 vs 42nd)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                          |
| ------------------------ | ------- | ----- | --------- | ---------------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; F049 (−1) status region blank |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                                    |
| Feedback & Error         | 10      | 78    | 7.80      | F049 held (−2): copy success announces once then blank                             |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                           |
| API Clarity (DX)         | 12      | 86    | 10.32     | F046 held (−2): search-data contract aborts whole build; F033 --json               |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap                                  |
| Documentation Accuracy   | 14      | 53    | 7.42      | **F005 held at 59 files**; F017 phantom api.md persists                            |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 --json unusable raw; F030 zeroed report misleading                            |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | F014 fixed; ~26ms build; F046 (−2) whole-build abort on dirty row                  |
| **TOTAL**                | **100** |       | **81.30** |

**C4. Documentation Accuracy (53, ±0)** — F005 drift count unchanged at 59. F017
(phantom `addNumbers()` at docs/api.md:554) remains re-verified.

---

## D. DELIVERY & EVOLUTION READINESS (63.3/100, +0.6 vs 42nd)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                 |
| ------------------- | ------- | ----- | --------- | --------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL unfixed (−6)**; F013 (12 violations); F002 (40th); F027 maintained resolved          |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; site 404 (F025) (−15)                                                  |
| Config & Env Parity | 15      | 76    | 11.40     | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)   |
| Migration Safety    | 15      | 68    | 10.20     | **F029 maintained RESOLVED (+3)**; F045 school deletion/move unhandled; F018 STALE 15d                    |
| Tech Debt           | 15      | 57    | 8.55      | **F014 fixed, F029 resolved (+1)**; **F005 held at 59 files**; 49 tracked findings, 13 from 39th run open |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; in-loop F014 fix landed in same run                                            |
| **TOTAL**           | **100** |       | **63.30** |

**D1. CI/CD Health (52, ±0)** — automation surface untouched since the 39th-run
audit: F037/F038 remain the two CRITICAL items, F013's 12 workflow violations
persist, F002 blocks issue output for the 40th run, and the live site still 404s
(F025). The F014 fix improves the test gate's determinism but does not address the
workflow-security cluster.

---

## Findings Matrix delta (this run)

| ID        | Finding                                                                    | Category     | Priority | Status (this run)                                                                     |
| --------- | -------------------------------------------------------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------- |
| F002      | Loop token lacks `issues: write` (403 createIssue)                         | ci           | P1       | RE-CONFIRMED (**40th**) — output blocked                                              |
| F005      | Prettier drift                                                             | docs         | P3       | **HELD at 59 files** (no growth; no new non-conformant files)                         |
| F014      | Parallel test-file race on DIST_DIR                                        | test         | P1       | **RE-OBSERVED then FIXED** — temp-dir isolation, 5/5 paired + 3/3 full-suite verified |
| F029      | fetch-data.test.js corrupts tracked `external/raw.csv`                     | test         | P1       | **MAINTAINED RESOLVED** (PR #566 effective; no residue all runs)                      |
| F037      | issue_comment → unauthenticated write-token agent (public repo)            | security     | P1       | **UNFIXED — CRITICAL, 5th run** (blocked by F050)                                     |
| F038      | custom_prompt heredoc shell RCE                                            | security     | P1       | **UNFIXED — CRITICAL, 5th run** (blocked by F050)                                     |
| F039–F044 | Workflow supply-chain / secret / branch-protection cluster                 | security     | P1/P2    | **ALL UNFIXED — 5th run** (blocked by F050)                                           |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy-feedback) | bug/refactor | P2/P3    | **ALL UNFIXED — 5th run**                                                             |
| F050      | Loop token lacks `workflows: write`                                        | ci           | P1       | **HELD — 2nd run** (blocks F037–F044 remediation)                                     |

All other tracked findings (F001–F036 minus the rows above) re-verified HELD or
maintained RESOLVED per the 39th-run ledger; F001/F015/F016/F027 maintained
RESOLVED. F004 re-counted at 57 refs / 10 unique names (yml only; the 42nd run's 59
included `.github/workflows/template.md`, which is not a live workflow).

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 40th consecutive). Following the established repo pattern (runs 1–42),
this run records findings as labeled docs records under `docs/issues/2026-08-04/` and
ships them via PR. All **49 tracked findings** remain labeled (category + priority)
and ready to be bulk-created as GitHub issues the moment token permissions are granted
(`scripts/bulk-create-issues.sh`).

## Score Trend

| Domain                  | 38th     | 39th     | 40th     | 41st     | 42nd     | **43rd (current)** |
| ----------------------- | -------- | -------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 76.1     | 74.2     | 74.1     | 74.1     | 74.1     | **75.1**           |
| B. System Quality       | 75.8     | 71.7     | 71.7     | 71.7     | 71.7     | **71.9**           |
| C. Experience Quality   | 81.8     | 81.4     | 81.3     | 81.3     | 81.3     | **81.3**           |
| D. Delivery & Evolution | 65.0     | 62.9     | 62.7     | 62.7     | 62.7     | **63.3**           |
| **COMPOSITE**           | **74.7** | **72.6** | **72.4** | **72.4** | **72.4** | **72.9**           |

## Composite Score Calculation

| Domain                            | Weight | Score | Weighted         |
| --------------------------------- | ------ | ----- | ---------------- |
| A. Code Quality                   | 25%    | 75.1  | 18.78            |
| B. System Quality                 | 25%    | 71.9  | 17.97            |
| C. Experience Quality             | 25%    | 81.3  | 20.33            |
| D. Delivery & Evolution Readiness | 25%    | 63.3  | 15.83            |
| **COMPOSITE**                     | 100%   |       | **72.90 → 72.9** |

## Notes on scoring movement

1. **First upward movement in 5 runs (+0.5)**: F014 fixed in-loop (test race
   eliminated with a deterministic per-process temp-dir redirect — 5/5 paired and
   3/3 full-suite verified, coverage unchanged) and F029 maintained resolved (PR
   #566 fix verified effective). Both are P1 test-hygiene items whose resolution
   lifts Code Quality (Testability/Determinism), System Quality (Stability), and
   Delivery (Migration Safety/Tech Debt).
2. **The critical message is now 5 runs old**: F037 + F038 (CRITICAL — proven shell
   RCE + unauthenticated write-token agent trigger on a PUBLIC repo) remain open
   with zero remediation. The workflows are unchanged since the 39th run. **F050
   (token lacks `workflows: write`) is the hard blocker** — the 42nd-run fix patch
   (issue_comment author-association gate + custom_prompt via env var) remains valid
   and documented at `docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`.
3. F014's in-loop fix is the first code change in the verification series since PR
   #566 (F029 fix); it required no source changes — only test-file isolation, keeping
   the blast radius minimal and the fix fully reversible.
4. F005 held at 59 with no growth — the two new docs records added this run were
   verified Prettier-clean before commit.
5. No oracle/momus delegation was needed — every finding was re-verified via direct
   file reads and fresh command execution. Project `.opencode/skills` holds no custom
   skill content.

## Next Phase Recommendation

**Phase 2 (Feature Hardening)** should execute in this order, all traceable to
documented findings:

1. **F037 + F038** (CRITICAL, 5th run unfixed): gate `issue_comment` trigger on
   author association; move `custom_prompt` out of the `run:` heredoc into an env
   var. **Blocker**: F050 — requires a token/actor with `workflows: write`.
2. **F039 + F040 + F041 + F043 + F044**: branch-filter `push`, pin install script +
   actions, remove `--admin` merge, scope secrets per-step, stop interpolating
   `github.actor`. Same F050 blocker.
3. **F042**: ref-scope caches.
4. **F045/F046/F047**: code-level correctness hardening (stale-page reconciliation,
   per-school tolerance in search-data path, JSON-LD via JSON.stringify).
5. **F026/F033**: observability fixes (formatBytes NaN guard, raw --json passthrough).
