# Phase 1 — Diagnostic & Comprehensive Scoring Report (40th verification, 2026-08-04)

**Evaluation Date**: 2026-08-04
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ e8ac382 — 39th verification run PR #562)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: fresh `npm ci` + `npm audit`, `eslint`, `prettier`, `node --test`,
coverage, `pytest`, `check-workflow-security` both modes, `check-freshness`, source
re-verification of F030–F049 via direct file reads, GitHub API probes (issues,
visibility). No oracle/momus delegation needed — all findings re-verified directly.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 39th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **74.1/100** | C     | −0.1      |
| **B. System Quality**                 | **71.7/100** | C     | ±0.0      |
| **C. Experience Quality**             | **81.3/100** | B     | −0.1      |
| **D. Delivery & Evolution Readiness** | **62.7/100** | C+    | −0.2      |
| **COMPOSITE**                         | **72.4/100** | C     | **−0.2**  |

Composite **−0.2 vs 39th run (72.6)**. The repo is in a holding pattern: **no new
findings**, no fixes to the 13 findings introduced in the 39th run (F037–F049). The
only movement is **F005 (Prettier drift) worsening 56→59 files** — all in the
`docs/issues/` ledger (source code remains clean). F029 (test corrupts tracked CSV)
re-observed once, cleaned. F014 (parallel test race) NOT observed (clean again).
F002 (loop token lacks `issues: write`) holds for the 37th consecutive run, keeping
GitHub-issue output blocked. **F037 + F038 (CRITICAL workflow-security findings from
the 39th run) remain UNFIXED** — the two highest-severity items in the ledger.

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                              |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 36ms, budgets met                                                    |
| Test failure           | —          | ✅ PASS — 1049/1049 JS + 27/27 Python pass; F014 NOT observed; F029 test side-effect handled at criterion level            |
| Critical vulnerability | ⚠️ applied  | **F037 + F038 (CRITICAL, workflow CI)** — criterion-level Security deduction (66→50) as in 39th; not the global −20 (CI-pipeline, not production runtime) |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                         | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists                                                               |
| `npm run build`                                  | ✅ exit 0, 2 pages, 0 failed, 36ms; budgets met                                                                                        |
| `npm run lint`                                   | ✅ clean — 0 errors, 0 warnings                                                                                                        |
| `npx prettier --check .`                         | ❌ **60 files flagged / 59 fail Prettier (F005 WORSENED 56→59, all docs/issues ledger; source clean)**                                  |
| `npm run test:js`                                | ✅ **1053 tests / 1049 pass / 0 fail (4 skipped) — F014 NOT observed**                                                                 |
| post-test `git status` (F029 trace)              | ❌ **F029 RE-OBSERVED**: external/raw.csv → `col1\nval1`; restored via `git checkout`; no new residue this run                          |
| `npm run test:js:coverage`                       | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                 |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                                                                           |
| `npm audit`                                      | ❌ **1 high severity (brace-expansion@5.0.8, F028 held)**                                                                                |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH), human exit 1 (F013)                                                                            |
| `node scripts/check-workflow-security.js --json` | ✅ **F027 maintained RESOLVED — exit 1 with 12 violations**                                                                              |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (15 days, threshold 7); 2 records (F018, held)                                                                    |
| `gh repo view` (visibility)                      | ✅ **PUBLIC** — F037 remains exploitable                                                                                                |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 37th consecutive)**                                                                                        |
| F004 re-count (`secrets.*`)                      | ❌ 57 refs / 10 unique names (held)                                                                                                     |
| F007 line count                                  | ❌ 2045 total workflow lines (held)                                                                                                     |
| F008 line count                                  | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                        |
| F011 tag count                                   | ❌ 0 tags (held)                                                                                                                         |
| F012 engine probe (`npm ls`)                     | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2 (held)                                                                   |
| F017 api.md probe (`addNumbers`)                 | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                 |
| F026 unit repro (formatBytes NaN)                | ❌ RE-CONFIRMED — `formatBytes(NaN)` → `"NaN undefined"`                                                                                 |
| F030–F036 source re-verification                 | ❌ ALL CONFIRMED at source (monitorBuild, hash, sitemap, --json, retry, fallback, layering)                                              |
| F037–F044 source re-verification                 | ❌ **ALL CONFIRMED at source — workflows unchanged since 39th run** (opencode.yml:8-9/174, architect-agent.yml:208, on-push.yml:4, etc.)  |
| F045–F049 source re-verification                 | ❌ ALL CONFIRMED at source (BuildOrchestrator.js, PageBuilder.js, school-page.js, homepage.js)                                           |

---

## A. CODE QUALITY (74.1/100, −0.1 vs 39th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                            |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness           | 15      | 74    | 11.10     | F014 clean; F045 (stale pages), F046 (whole-build abort), F047 (JSON-LD), F049 (copy-feedback) all held                                 |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                             |
| Simplicity            | 10      | 80    | 8.00      | F048 dead searchLoaded + test-only exports (held); F035 dead fallback (held); CI overcomplexity F007                                  |
| Modularity & SRP      | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; homepage 737L; F045/F046 boundary drift (held)                                 |
| Consistency           | 5       | 62    | 3.10      | **F005 worsened 56→59 (−5)**; 3× required-fields list; console.log vs pino split                                                     |
| Testability           | 15      | 64    | 9.60      | F014 clean but latent; F029 RE-OBSERVED (−3); F030 masked by test (−2)                                                               |
| Maintainability       | 10      | 72    | 7.20      | F045/F046/F048 held debt; F035/F036 held; oversized files (F008)                                                                     |
| Error Handling        | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid     |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); F028 held (high dev vuln); F012 mismatch                                                                          |
| Determinism           | 5       | 70    | 3.50      | F014 clean; F032 held (−3) sitemap lastmod; F045 held-delta                                                                          |
| **TOTAL**             | **100** |       | **74.10** |

**A1. Correctness (74)** — no change from 39th: the four code defects introduced with
F045–F049 remain open. Build + tests green, so correctness of *current* behavior is
good; the deductions reflect latent defects (stale pages, whole-build abort, corrupted
JSON-LD, copy-feedback) that only manifest under specific conditions.

**A5. Consistency (62, −1)** — the only criterion movement in this domain: F005
Prettier drift worsened from 56 to 59 files. All 59 are `docs/issues/` ledger records;
**source code remains Prettier-clean**. The drift is a documentation-hygiene issue,
not a source-quality issue, but it trends the wrong way.

**A6. Testability (64)** — F029 re-observed: after `npm run test:js`, the tracked file
`external/raw.csv` is left as `col1\nval1` by `fetch-data.test.js`; restored this run
with `git checkout`. No new `external-data/` residue this time. F014 (parallel
test-file race on DIST_DIR) clean again — it is a latent flake, not a current failure.

---

## B. SYSTEM QUALITY (RUNTIME) (71.7/100, ±0.0 vs 39th)

| Criterion            | Weight  | Score | Weighted  | Rationale                                                                                                                              |
| -------------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Stability            | 20      | 72    | 14.40     | F014 clean; F045 stale-page accumulation (held); F013 CI nondeterminism (−2)                                                             |
| Performance          | 15      | 90    | 13.50     | 36ms build, budgets met                                                                                                                 |
| Security             | 20      | 50    | 10.00     | **F037+F038 CRITICAL UNFIXED (−11)**; F039–F044 held (−8); F028 (−2); F013 (−2); unchanged since 39th — workflows never edited            |
| Scalability          | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                                                              |
| Resilience           | 15      | 80    | 12.00     | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise                          |
| Observability        | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                                            |
| **TOTAL**            | **100** |       | **71.65** |

**B3. Security (50, unchanged)** — the defining story of the ledger. F037 (public-repo
`issue_comment` → unauthenticated write-token LLM agent) and F038 (proven shell RCE
via `workflow_dispatch custom_prompt` heredoc injection) were introduced in the 39th
run and **remain unfixed**. The repo is PUBLIC, so both are externally triggerable.
Also held: F039 (all-branch push with branch-controlled prompts + cloud secrets),
F040 (unpinned `curl | bash` install with job-level secrets), F041 (`gh pr merge
--admin` bypasses branch protection), F042 (cross-branch cache poisoning), F043 (zero
actions pinned to SHA), F044 (`github.actor` in `run:` + secret over-scoping). These
are the top-priority remediation targets for Phase 2.

---

## C. EXPERIENCE QUALITY (81.3/100, −0.1 vs 39th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                  |
| ------------------------ | ------- | ----- | --------- | -------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; F049 (−1) status region blank |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                            |
| Feedback & Error         | 10      | 78    | 7.80      | F049 held (−2): copy success announces once then blank                     |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                   |
| API Clarity (DX)         | 12      | 86    | 10.32     | F046 held (−2): search-data contract aborts whole build; F033 --json       |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap                          |
| Documentation Accuracy   | 14      | 53    | 7.42      | **F005 worsened 56→59 (−5)**; F017 phantom api.md persists                 |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 --json unusable raw; F030 zeroed report misleading                    |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | F014 clean; ~36ms build; F046 (−2) whole-build abort on dirty row          |
| **TOTAL**                | **100** |       | **81.30** |

**C4. Documentation Accuracy (53, −1)** — the only movement: F005's Prettier drift now
covers 59 docs-ledger files (56→59). The `docs/` source documents themselves are
stable; the ledger (the loop's own output artifact) is accumulating format debt. F017
(phantom `addNumbers()` in docs/api.md:554) remains re-verified.

---

## D. DELIVERY & EVOLUTION READINESS (62.7/100, −0.2 vs 39th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                              |
| ------------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL unfixed (−6)**; F013 (12 violations); F002 (37th); F025 (deploy ≠ site); F027 maintained resolved  |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; F025 site 404 (−15)                                                                 |
| Config & Env Parity | 15      | 76    | 11.40     | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)                 |
| Migration Safety    | 15      | 65    | 9.75      | F029 re-observed (−3); F045 school deletion/move unhandled; F018 STALE 15d                                                |
| Tech Debt           | 15      | 56    | 8.40      | **F005 worsened 56→59 (−5)**; 49 tracked findings, 13 introduced 39th run still open                                        |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; docs-led throughput (PRs #551–#562 merged)                                                   |
| **TOTAL**           | **100** |       | **62.70** |

**D5. Tech Debt (56, −1)** — F005's worsening is the sole driver. The finding ledger
grew to 59 non-conformant docs files, and the 13 findings from the 39th run remain
open with zero fixes merged. The workflow-security cluster (F037–F044) is the largest
concentration of open P1/P2 debt in the ledger.

---

## Findings Matrix delta (this run — no new findings, 3 movements)

| ID      | Finding                                                          | Category | Priority | Status (this run)                                  |
| ------- | ---------------------------------------------------------------- | -------- | -------- | -------------------------------------------------- |
| F002    | Loop token lacks `issues: write` (403 createIssue)               | ci       | P1       | RE-CONFIRMED (**37th**) — output blocked            |
| F005    | Prettier drift                                                   | docs     | P3       | **WORSENED — 59 files (56→59, all docs/issues)**    |
| F014    | Parallel test-file race on DIST_DIR                              | test     | P1       | **NOT observed this run** (clean again)             |
| F029    | fetch-data.test.js corrupts tracked `external/raw.csv`           | test     | P1       | **RE-OBSERVED** (restored; no new residue)          |
| F037    | issue_comment → unauthenticated write-token agent (public repo)  | security | P1       | **UNFIXED — CRITICAL, 2nd run**                     |
| F038    | custom_prompt heredoc shell RCE                                  | security | P1       | **UNFIXED — CRITICAL, 2nd run**                     |
| F039–F044 | Workflow supply-chain / secret / branch-protection cluster     | security | P1/P2    | **ALL UNFIXED — 2nd run**                           |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy-feedback) | bug/refactor | P2/P3 | **ALL UNFIXED — 2nd run**                 |

All other tracked findings (F001–F036 minus the rows above) re-verified HELD or
maintained RESOLVED per the 39th-run ledger; F015/F016/F027 maintained RESOLVED.

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 37th consecutive). Following the established repo pattern (runs 1–38),
this run records findings as labeled docs records under `docs/issues/2026-08-04/` and
ships them via PR. All **49 tracked findings** remain labeled (category + priority) and
ready to be bulk-created as GitHub issues the moment token permissions are granted.

## Score Trend

| Domain                  | 36th     | 37th     | 38th     | 39th     | **40th (current)** |
| ----------------------- | -------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 82.3     | 81.6     | 76.1     | 74.2     | **74.1**           |
| B. System Quality       | 78.8     | 78.0     | 75.8     | 71.7     | **71.7**           |
| C. Experience Quality   | 82.5     | 82.7     | 81.8     | 81.4     | **81.3**           |
| D. Delivery & Evolution | 65.7     | 65.4     | 65.0     | 62.9     | **62.7**           |
| **COMPOSITE**           | **77.3** | **76.9** | **74.7** | **72.6** | **72.4**           |

## Composite Score Calculation

| Domain                                | Weight | Score | Weighted |
| ------------------------------------- | ------ | ----- | -------- |
| A. Code Quality                       | 25%    | 74.1  | 18.53    |
| B. System Quality                     | 25%    | 71.7  | 17.91    |
| C. Experience Quality                 | 25%    | 81.3  | 20.33    |
| D. Delivery & Evolution Readiness     | 25%    | 62.7  | 15.68    |
| **COMPOSITE**                         | 100%   |       | **72.45 → 72.4** |

## Notes on scoring movement

1. **Flat run**: no new findings, no fixes. The −0.2 composite movement is entirely
   F005 Prettier drift (56→59 docs-ledger files). Source code is Prettier-clean.
2. **The critical message**: F037 + F038 (CRITICAL, proven RCE + unauthenticated
   write-token agent trigger on a PUBLIC repo) have now been open for two verification
   runs with zero remediation. The 39th run's deep audit surfaced them; the 40th run
   confirms the workflows are byte-identical. **Phase 2 must prioritize these.**
3. F029 re-observed once (restored clean); F014 stayed clean. Test hygiene remains
   the second cluster of P1 debt after the workflow-security cluster.
4. No oracle/momus delegation was needed — every finding was re-verified via direct
   file reads and fresh command execution.

## Next Phase Recommendation

**Phase 2 (Feature Hardening)** should execute in this order, all traceable to
documented findings:
1. **F037 + F038** (CRITICAL): gate `issue_comment` trigger on author association;
   move `custom_prompt` out of the `run:` heredoc into an env var.
2. **F039 + F040 + F041 + F043 + F044**: branch-filter `push`, pin install script +
   actions, remove `--admin` merge, scope secrets per-step, stop interpolating
   `github.actor`.
3. **F042**: ref-scope caches.
4. **F029**: fix `fetch-data.test.js` to restore/not touch tracked `external/raw.csv`.
5. **F045/F046/F047**: code-level correctness hardening.
