# Phase 1 — Diagnostic & Comprehensive Scoring Report (44th verification, 2026-08-04)

**Evaluation Date**: 2026-08-04 (run executed 2026-08-04T23:58Z – 2026-08-05T00:02Z)
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 5dbe662 — F014 fix PR #568, merged post-43rd)
**Trigger**: `ulw-loop` run — Phase 0.1/0.2 probes → 0 open PRs, 0 open issues → Phase 1 (AUDIT MODE)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven verification of F014 race stability across 3 full-suite runs); project skills inspected under `.opencode/skill/` (7 SKILL.md present: debugging-strategies, backend-models-standards, moai-tool-opencode, context-engineering-memory-systems, systematic-debugging, agentic-qe-skill-builder, git-commit-message) — audit is read-only, so no fix-skill execution required this run. Commands: `npm ci`, `npm run lint`, `npx prettier --check .`, `npm audit`, `npm run build`, `npm run test:js` ×3, `npm run test:js:coverage`, `python3 tests/run_tests.py`, `node scripts/check-workflow-security.js`, `npm run check-freshness`, `gh` API probes, source re-verification of F037/F038/F017/F026/F045–F049 via direct file reads.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 43rd |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **75.1/100** | C     | ±0.0      |
| **B. System Quality**                 | **71.9/100** | C     | ±0.0      |
| **C. Experience Quality**             | **81.3/100** | B     | ±0.0      |
| **D. Delivery & Evolution Readiness** | **63.2/100** | C+    | **−0.1**  |
| **COMPOSITE**                         | **72.9/100** | C     | **±0.0**  |

Flat run (72.9, ±0.0 vs 43rd). The 43rd run's F014 fix is now **permanently on main**
(PR #568 merged) and verified stable this run — 3/3 full-suite runs, 1053 tests /
1049 pass / 0 fail, F014 not observed. F029 (test corrupts tracked raw.csv) maintained
RESOLVED — clean tree after every run. **F005 held at 59 files** (no growth). **F037 +
F038 (CRITICAL workflow-security) UNFIXED for a 6th run** — the two highest-severity
items in the ledger, both re-confirmed at source, remediation still blocked by F050
(loop token lacks `workflows: write`). F002 blocks GitHub-issue output for the **41st
consecutive run**; findings ship as labeled docs records per the established pattern.
Only movement: F018 data staleness drifted 15 → 16 days (still 2 records).

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                               |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 27ms, all performance budgets met                                                                      |
| Test failure           | —          | ✅ PASS — 1053/1049/0 fail ×3 full-suite + 27/27 Python; F014 NOT observed (fix merged); F029 no residue (3/3 clean trees)                                  |
| Critical vulnerability | ⚠️ applied | **F037 + F038 (CRITICAL, workflow CI)** — criterion-level Security deduction (50) as in 39th–43rd; not the global −20 (CI-pipeline, not production runtime) |

## Audit Commands (fresh, this run)

| Command                                        | Result                                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                       | ✅ installed; ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8, CVE-2026-14257)**; F012 EBADENGINE persists (lint-staged wants node ≥22.22.1, runtime v20.20.2) |
| `npm run lint`                                 | ✅ clean — 0 errors, 0 warnings                                                                                                                             |
| `npx prettier --check .`                       | ❌ **59 files fail Prettier (F005 HELD at 59; all docs/issues ledger, source clean)**                                                                       |
| `npm audit`                                    | ❌ 1 high severity (brace-expansion@5.0.8, F028 held)                                                                                                       |
| `npm run build`                                | ✅ exit 0, 2 pages, 0 failed, 27ms, budgets met                                                                                                             |
| `npm run test:js` ×3                           | ✅ **1053 tests / 1049 pass / 0 fail ×3 — F014 NOT observed (fix merged #568, maintained)**                                                                 |
| post-test `git status --short` ×3 (F029 trace) | ✅ **CLEAN every run — F029 maintained RESOLVED** (3rd clean run)                                                                                           |
| `npm run test:js:coverage`                     | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                                      |
| `python3 tests/run_tests.py`                   | ✅ 27/27 pass (100%)                                                                                                                                        |
| `node scripts/check-workflow-security.js`      | ❌ **12 violations (2 CRITICAL + 10 HIGH), exit 1 (F013 held)**                                                                                             |
| `npm run check-freshness`                      | ⚠️ **STALE — 2026-07-20 (16 days, threshold 7; worsened 15→16d)**; 2 records (F018)                                                                         |
| `gh issue create` (probe)                      | ❌ **403 `createIssue` (F002, 41st consecutive)**                                                                                                           |
| F004 re-count (`secrets.*`)                    | ❌ 59 refs / 10 unique names (held)                                                                                                                         |
| F007 line count                                | ❌ 2045 total workflow lines (held)                                                                                                                         |
| F008 line count                                | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                                           |
| F011 tag count                                 | ❌ 0 tags (held)                                                                                                                                            |
| F017 api.md probe (`addNumbers`)               | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                                    |
| F025 live-site probe (curl)                    | ❌ root HTTP 404; robots.txt 200 (held)                                                                                                                     |
| F026 unit repro (`formatBytes(NaN)`)           | ❌ RE-CONFIRMED — returns `"NaN undefined"` (units[NaN] undefined)                                                                                          |
| F037 source re-verification                    | ❌ CONFIRMED — opencode.yml:8-9 `issue_comment: [created]`, no author-association gate, PUBLIC repo                                                         |
| F038 source re-verification                    | ❌ CONFIRMED — architect-agent.yml:208 `${{ github.event.inputs.custom_prompt }}` inside `run:` heredoc (proven RCE)                                        |
| F045–F049 source spot-checks                   | ❌ ALL HELD — BuildOrchestrator abort (F046), school-page JSON-LD (F047), homepage searchLoaded dead code (F048), copy-feedback (F049)                      |

---

## A. CODE QUALITY (75.1/100, ±0.0 vs 43rd)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                           |
| --------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 75    | 11.25     | **F014 fix now on main, verified 3/3 (maintained)**; F045/F046/F047/F049 held; no new code defects observed                         |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity            | 10      | 80    | 8.00      | F048 dead searchLoaded + test-only exports (held); F035 dead fallback (held); CI overcomplexity F007                                |
| Modularity & SRP      | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; homepage 737L; F045/F046 boundary drift (held)                                |
| Consistency           | 5       | 62    | 3.10      | **F005 HELD at 59 files** (no growth); 3× required-fields list; console.log vs pino split                                           |
| Testability           | 15      | 69    | 10.35     | **F014 maintained resolved (+3)**; **F029 maintained resolved (+2)**; F030 masked by test (−2)                                      |
| Maintainability       | 10      | 72    | 7.20      | F045/F046/F048 held debt; F035/F036 held; oversized files (F008)                                                                    |
| Error Handling        | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); F028 held (high dev vuln); F012 mismatch                                                                         |
| Determinism           | 5       | 72    | 3.60      | **F014 on main, 3/3 stable (+2)**; F032 held (−3) sitemap lastmod; F045 held-delta                                                  |
| **TOTAL**             | **100** |       | **75.10** |

**A1. Correctness (75, ±0)** — F014's per-process temp-dir fix (PR #568) is now a
permanent part of main; this run's 3 full-suite runs were byte-identical in outcome
(1053/1049/0 ×3). F045–F049 code defects remain open, unchanged.

**A5. Consistency (62, ±0)** — F005 drift count unchanged at 59 files: no new ledger
files were added this run (only this report itself, written Prettier-clean).

**A6. Testability (69, ±0)** — both P1 test-hygiene items remain resolved: F014
(maintained — 3/3 runs clean) and F029 (maintained — clean tree ×3, 3rd run).

---

## B. SYSTEM QUALITY (RUNTIME) (71.9/100, ±0.0 vs 43rd)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                        |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 73    | 14.60     | **F014 on main (+1)**; F045 stale-page accumulation (held); F013 CI nondeterminism (−2)                          |
| Performance   | 15      | 90    | 13.50     | 27ms build, budgets met                                                                                          |
| Security      | 20      | 50    | 10.00     | **F037+F038 CRITICAL UNFIXED 6th run (−11)**; F039–F044 held (−8); F028 (−2); F013 (−2)                          |
| Scalability   | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                                     |
| Resilience    | 15      | 80    | 12.00     | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise |
| Observability | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                    |
| **TOTAL**     | **100** |       | **71.85** |

**B3. Security (50, ±0)** — unchanged for a **sixth verification run**: F037
(public-repo `issue_comment` → unauthenticated write-token LLM agent, opencode.yml:8-9)
and F038 (proven shell RCE via `workflow_dispatch custom_prompt` heredoc injection,
architect-agent.yml:208) remain open, re-confirmed at source this run. The repo is
PUBLIC, so both remain externally triggerable. F039–F044 held. Remediation requires
`workflows: write` (F050), which the loop token lacks; the 42nd-run patch
(`18-F037-F038-phase2-fix-patch.md`) remains valid but unpushable.

---

## C. EXPERIENCE QUALITY (81.3/100, ±0.0 vs 43rd)

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
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | F014 deterministic on main; ~27ms build; F046 (−2) whole-build abort on dirty row  |
| **TOTAL**                | **100** |       | **81.30** |

**C4. Documentation Accuracy (53, ±0)** — F005 drift count unchanged at 59. F017
(phantom `addNumbers()` at docs/api.md:554) re-verified this run.

---

## D. DELIVERY & EVOLUTION READINESS (63.2/100, −0.1 vs 43rd)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                   |
| ------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL unfixed (−6)**; F013 (12 violations); F002 (41st); F027 maintained resolved            |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; site 404 (F025) (−15)                                                    |
| Config & Env Parity | 15      | 76    | 11.40     | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)     |
| Migration Safety    | 15      | 67    | 10.05     | **F029 maintained resolved (+3)**; F045 school deletion/move unhandled; **F018 STALE 16d (worsened 15→16)** |
| Tech Debt           | 15      | 57    | 8.55      | F014+F029 resolved (+1); **F005 held at 59 files**; 49 tracked findings, 13 from 39th run open              |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; F014 landed on main via PR #568 (merged post-43rd)                               |
| **TOTAL**           | **100** |       | **63.15** |

**D4. Migration Safety (67, −1)** — F029 remains resolved, but F018 (data freshness)
drifted 15 → 16 days stale (threshold 7), the first day-count increase in several
runs. The live `external`/`data` snapshot continues to age with no refresh process
landed; deduction reflects the monotonic drift.

---

## Findings Matrix delta (this run — no new findings, no status changes)

| ID        | Finding                                                                    | Category     | Priority | Status (this run)                                               |
| --------- | -------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------------------------------- |
| F002      | Loop token lacks `issues: write` (403 createIssue)                         | ci           | P1       | RE-CONFIRMED (**41st**) — output blocked                        |
| F005      | Prettier drift                                                             | docs         | P3       | **HELD at 59 files** (no growth)                                |
| F014      | Parallel test-file race on DIST_DIR                                        | test         | P1       | **MAINTAINED RESOLVED** — fix on main (PR #568), 3/3 runs clean |
| F018      | Data staleness (external snapshot)                                         | bug          | P2       | **WORSENED** 15 → 16 days (2 records)                           |
| F029      | fetch-data.test.js corrupts tracked `external/raw.csv`                     | test         | P1       | **MAINTAINED RESOLVED** — clean tree ×3 (3rd run)               |
| F037      | issue_comment → unauthenticated write-token agent (public repo)            | security     | P1       | **UNFIXED 6th run** — re-confirmed at opencode.yml:8-9          |
| F038      | custom_prompt heredoc shell RCE                                            | security     | P1       | **UNFIXED 6th run** — re-confirmed at architect-agent.yml:208   |
| F039–F044 | Workflow supply-chain / secret / branch-protection cluster                 | security     | P1/P2    | **ALL UNFIXED — 6th run**                                       |
| F045–F049 | Code defects (stale pages, build abort, JSON-LD, dead code, copy-feedback) | bug/refactor | P2/P3    | **ALL UNFIXED — 6th run**                                       |
| F050      | Loop token lacks `workflows: write` — cannot push workflow changes         | ci           | P1       | MAINTAINED — blocks F037/F038 patch push                        |

All other tracked findings (F001–F036 minus rows above) re-verified HELD or
maintained RESOLVED per the 39th-run ledger; F001/F015/F016/F027 maintained RESOLVED.

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 41st consecutive). Following the established repo pattern (runs 1–43),
this run records findings as labeled docs records under `docs/issues/2026-08-04/` and
ships them via PR. All **49 tracked findings** remain labeled (category + priority)
and ready to be bulk-created as GitHub issues the moment token permissions are granted.

## Score Trend

| Domain                  | 39th     | 40th     | 41st     | 42nd     | 43rd     | **44th (current)** |
| ----------------------- | -------- | -------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 74.2     | 74.1     | 74.1     | 74.1     | 75.1     | **75.1**           |
| B. System Quality       | 71.7     | 71.7     | 71.7     | 71.7     | 71.9     | **71.9**           |
| C. Experience Quality   | 81.4     | 81.3     | 81.3     | 81.3     | 81.3     | **81.3**           |
| D. Delivery & Evolution | 62.9     | 62.7     | 62.7     | 62.7     | 63.3     | **63.2**           |
| **COMPOSITE**           | **72.6** | **72.4** | **72.4** | **72.4** | **72.9** | **72.9**           |

## Composite Score Calculation

| Domain                            | Weight | Score | Weighted         |
| --------------------------------- | ------ | ----- | ---------------- |
| A. Code Quality                   | 25%    | 75.1  | 18.78            |
| B. System Quality                 | 25%    | 71.9  | 17.98            |
| C. Experience Quality             | 25%    | 81.3  | 20.33            |
| D. Delivery & Evolution Readiness | 25%    | 63.2  | 15.80            |
| **COMPOSITE**                     | 100%   |       | **72.88 → 72.9** |

## Notes on scoring movement

1. **Flat run (±0.0, composite 72.9)**: no new findings, no code changes since 43rd.
   The 43rd run's F014 fix is now merged on main and verified stable 3/3 — the +1.0
   credit it earned in 43rd is now permanent. F029 maintained resolved (3rd clean
   run). The only negative movement is F018 staleness 15 → 16 days (−0.1 in D).
2. **The critical message, now 6 runs old**: F037 + F038 (CRITICAL — proven shell RCE
   - unauthenticated write-token agent trigger on a PUBLIC repo) remain open with zero
     remediation. Workflows are unchanged since the 39th run. Both re-confirmed at
     source this run. Remediation is blocked solely by token capability (F050), not by
     absence of a fix — the patch has been ready since the 42nd run.
3. **No delegation needed**: every finding re-verified via direct command execution
   and file reads. `obra-superpowers-systematic-debugging` skill applied to the F014
   stability verification (3 sequential full-suite runs, hypothesis: merged fix holds
   → confirmed 3/3).
4. F004 held at 59 refs / 10 unique names; F007 2045 lines; F008 1296 lines; F011 0
   tags; F013 12 workflow-security violations (2 CRITICAL + 10 HIGH).

## Next Phase Recommendation

**Phase 2 (Feature Hardening)** — unchanged priorities, all traceable to findings:

1. **F037 + F038** (CRITICAL, 6th run unfixed): gate `issue_comment` on author
   association; move `custom_prompt` out of the `run:` heredoc into an env var.
   Patch ready (`18-F037-F038-phase2-fix-patch.md`) — requires token with
   `workflows: write` (F050).
2. **F039 + F040 + F041 + F043 + F044**: branch-filter `push`, pin install script +
   actions, remove `--admin` merge, scope secrets per-step, stop interpolating
   `github.actor`.
3. **F018**: refresh the external data snapshot (stale 16 days, drifting).
4. **F042**: ref-scope caches.
5. **F045/F046/F047**: code-level correctness hardening.
