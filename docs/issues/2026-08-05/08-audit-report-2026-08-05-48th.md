# Phase 1 — Diagnostic & Comprehensive Scoring Report (48th verification, 2026-08-05)

**Evaluation Date**: 2026-08-05
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 107cb67 — 47th verification run, PR #572 merged)
**Trigger**: `ulw-loop` run — Phase 0.1/0.2 probes → 0 open PRs, 0 open issues → Phase 1 (AUDIT MODE)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: project skills inspected under `.opencode/skill/` (7 SKILL.md:
debugging-strategies, backend-models-standards, moai-tool-opencode,
context-engineering-memory-systems, systematic-debugging, agentic-qe-skill-builder,
git-commit-message). Each SKILL.md contains only the token "Registered" — no
substantive skill content exists to apply; Phase 1 is read-only so no fix-skill
execution was required. Commands: `npm ci`, `npm run lint`, `npx prettier --check .`,
`npm audit`, `npm run build`, `npm run test:js`, `npm run test:js:coverage`,
`python3 tests/run_tests.py`, `node scripts/check-workflow-security.js`,
`node scripts/check-freshness.js`, `gh` API probes, live-site curl probes, source
re-verification of F037/F038/F017/F026/F045–F049 via direct file reads.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 47th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **75.1/100** | C     | ±0.0      |
| **B. System Quality**                 | **71.9/100** | C     | ±0.0      |
| **C. Experience Quality**             | **81.2/100** | B     | ±0.0      |
| **D. Delivery & Evolution Readiness** | **63.2/100** | C+    | ±0.0      |
| **COMPOSITE**                         | **72.9/100** | C     | **±0.0**  |

Composite **±0.0 vs 47th (72.9)** — flat for a third run. The source tree and all
workflows are **unchanged since the 39th-run audit**, so every check reproduces the
47th ledger exactly. **F005 HELD at 59 files** (no growth this run; my records are
committed Prettier-clean). **F014** (1049/0 fail) and **F029** (clean tree) both
**maintained RESOLVED** for the 4th consecutive run. **F037 + F038 (CRITICAL
workflow-security) remain UNFIXED for a 10th run**, re-confirmed at source;
remediation still blocked by F050 (loop token lacks `workflows: write`). **F002**
blocks GitHub-issue output for the **45th consecutive run**; findings ship as labeled
docs records per the established pattern. **F025 stays PARTIAL** (root and index.html
404, robots.txt 200, sitemap 200, Pages "built").

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                                                                        |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 27ms, all performance budgets met                                                                                                               |
| Test failure           | —          | ✅ PASS — 1049/0 fail JS + 27/27 Python; F014 NOT observed; F029 no residue (clean tree)                                                                                                             |
| Critical vulnerability | ⚠️ applied | **F037 + F038 (CRITICAL, workflow CI-Pipeline)** — criterion-level Security deduction (50) as in 39th–47th; not the global −20 (CI-pipeline, not production runtime); F025 partial outage mined in D |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                  | ✅ installed; ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8, GHSA-rgw5-rvv9-x895)**; F012 EBADENGINE persists (lint-staged wants node ≥22.22.1, run v20.20.2)     |
| `npm run lint`                            | ✅ clean — 0 errors, 0 warnings                                                                                                                                  |
| `npx prettier --check .`                  | ❌ **59 files fail — F005 HELD at 59 (no growth)**                                                                                                               |
| `npm audit`                               | ❌ 1 high severity (brace-expansion@5.0.8, **F028 held**)                                                                                                        |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 27ms, budgets met                                                                                                                  |
| `npm run test:js`                         | ✅ **1049 pass / 0 fail / 4 skipped — F014 NOT observed (maintained)**                                                                                           |
| `npm run test:js:coverage`                | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                                           |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass (100%)                                                                                                                                             |
| `node scripts/check-workflow-security.js` | ❌ **12 violations (2 CRITICAL + 10 HIGH), exit 1 (F013 held)**                                                                                                  |
| `node scripts/check-freshness.js`         | ❌ **STALE — 2026-07-20 (16 days, threshold 7; held)**, 2 records (F018)                                                                                         |
| `gh issue create` (probe)                 | ❌ **403/GraphQL `createIssue` (F002, 45th consecutive)**                                                                                                        |
| F004 re-count (`secrets.*`)               | ⚠️ 59 line-refs / 10 unique names (held)                                                                                                                         |
| F007 line count                           | ❌ **2045** total workflow lines (held)                                                                                                                          |
| F008 line count                           | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                                                |
| F011 tag count                            | ❌ **0 tags** (held)                                                                                                                                             |
| F017 api.md probe (`addNumbers`)          | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                                         |
| F025 live-site probe (Pages + curl ×4)    | ⚠️ **PARTIAL — root 404, index.html 404, robots.txt 200, sitemap 200, Pages "built"** (unchanged vs 47th)                                                        |
| F026 unit repro (`formatBytes(NaN)`)      | ❌ RE-CONFIRMED — units[NaN] undefined → `"NaN undefined"` (build-performance.js:186)                                                                            |
| F037 source re-verification               | ❌ CONFIRMED — opencode.yml:8-9 `issue_comment: [created]`, no author-association gate, PUBLIC repo (**10th run**)                                               |
| F038 source re-verification               | ❌ CONFIRMED — architect-agent.yml:208 `${{ github.event.inputs.custom_prompt }}` inside `run:` heredoc (proven RCE; **10th run**)                               |
| F039–F044 source spot-checks              | ❌ ALL HELD — on-push branch filter, github.actor interpolation, npm cache not ref-scoped, GH_TOKEN secret refs                                                  |
| F045–F049 source spot-checks              | ❌ ALL HELD — BuildOrchestrator stale pages (F045), build abort (F046), school-page JSON-LD (F047), homepage searchLoaded dead code (F048), copy-feedback (F049) |

Self-correction note: the two earlier `tail`/pipe-captured runs (coverage summary,
workflow-security exit code) were masked by shell pipes; both were re-run
redirected to files with explicit `EXIT=` capture — `COV_EXIT=0`, `WSEC_EXIT=1`.

---

## A. CODE QUALITY (75.1/100, ±0.0 vs 47th)

| Criterion                    | Weight  | Score | Weighted  | Rationale                                                                                                                           |
| ---------------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness                  | 15      | 75    | 11.25     | **F014 maintained on main** (1049/0 fail, verified); F045/F046/F047/F049 held; no new code defects                                  |
| Readability & Naming         | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity                   | 10      | 80    | 8.00      | F048 dead searchLoaded + test-only exports (held); F035 dead fallback (held); CI overcomplexity F007                                |
| Modularity & SRP             | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; F045/F046 boundary drift (held)                                               |
| Consistency                  | 5       | 61    | 3.05      | **F005 HELD at 59 (−1 vs clean baseline)**; 3× required-fields list; console.log vs pino split                                      |
| Testability                  | 15      | 69    | 10.35     | **F014 maintained resolved (+3)**; **F029 maintained resolved (+2)**; F030 masked by test (−2)                                      |
| Maintainability              | 10      | 72    | 7.20      | F045/F046/F048 held debt; F035/F036 held; oversized files (F008)                                                                    |
| Error Handling               | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid |
| Dependency Discipline        | 5       | 84    | 4.20      | 1 prod dep (pino); F028 held (high dev vuln); F012 mismatch                                                                         |
| Determinism & Predictability | 5       | 72    | 3.60      | **F014 on main, stable (+2)**; F032 held (−3) sitemap lastmod; F045 held-delta                                                      |
| **TOTAL**                    | **100** |       | **75.05** |                                                                                                                                     |

**A5. Consistency (61, ±0)** — F005 held at 59 files. This run's records were written
Prettier-clean from the start, so there was no drift growth and no in-loop restore
needed (unlike the 46th-run regression). The enforcement gap (merged docs bypass the
PR format gate) remains tracked.

---

## B. SYSTEM QUALITY (RUNTIME) (71.9/100, ±0.0 vs 47th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                        |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 73    | 14.60     | **F014 on main (+1)**; F045 stale-page accumulation (held); F013 CI nondeterminism (−2)                          |
| Performance   | 15      | 90    | 13.50     | 27ms build, budgets met                                                                                          |
| Security      | 20      | 50    | 10.00     | **F037+F038 CRITICAL UNFIXED 10th run (−11)**; F039–F044 held (−8); F028 (−2); F013 (−2)                         |
| Scalability   | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                                     |
| Resilience    | 15      | 80    | 12.00     | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise |
| Observability | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                    |
| **TOTAL**     | **100** |       | **71.85** |                                                                                                                  |

**B3. Security (50, ±0)** — unchanged for a **tenth verification run**: F037
(public-repo `issue_comment` → unauthenticated write-token LLM agent,
opencode.yml:8-9) and F038 (proven shell RCE via `workflow_dispatch custom_prompt`
heredoc injection, architect-agent.yml:208) remain open, re-confirmed at source this
run. The repo is PUBLIC, so both remain externally triggerable. F039–F044 held.
Remediation requires `workflows: write` (F050) which the loop token lacks; the 42nd
patch (`docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`) remains valid but
unpushable.

---

## C. EXPERIENCE QUALITY (81.2/100, ±0.0 vs 47th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                          |
| ------------------------ | ------- | ----- | --------- | ---------------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; F049 (−1) status region blank |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                                    |
| Feedback & Error         | 10      | 78    | 7.80      | F049 held (−2): copy success announces once then blank                             |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                           |
| API Clarity (DX)         | 12      | 86    | 10.32     | F046 held (−2): search-data contract abort whole build; F033 --json                |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works                                                  |
| Documentation Accuracy   | 14      | 52    | 7.28      | **F005 held 59 files**; F017 phantom api.md persists                               |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 --json unusable raw; F030 zeroed report unreliable                            |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | F014 deterministic on main; ~27ms build; F046 (−2) whole-build abort on dirty row  |
| **TOTAL**                | **100** |       | **81.16** |                                                                                    |

---

## D. DELIVERY & EVOLUTION READINESS (63.2/100, ±0.0 vs 47th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                   |
| ------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL unfixed 10th run (`−6`)**; F013 (12 violations); F002 (45th); F027 maintained resolved |
| Release & Rollback  | 20      | 51    | 10.20     | **F025 PARTIAL — root/index 404, robots/sitemap 200, Pages "built" (`−14`)**                                |
| Config & Env Parity | 15      | 76    | 11.40     | F044 held (−2) secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)               |
| Migration Safety    | 15      | 67    | 10.05     | **F029 maintained resolved (+3)**; F045 school delete/move unhandled; F018 STALE 16d (held)                 |
| Technical Debt      | 15      | 56    | 8.40      | **F005 ledger debt held at 59**; F045–F049 open; F037/F038 10th run                                         |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; 47 docs-PRs merged in sequence (@572 last merged)                                |
| **Total**           | **100** |       | **63.20** |                                                                                                             |

**D2. Release & Rollback (51, ±0)** — F025 unchanged vs 47th: `/` and `/index.html`
still 404 while `robots.txt (200)` and `sitemap-index.xml (200)` serve and Pages
reports "built". Visitors cannot load the homepage — finding stays OPEN, penalty −14.

**D5. Tech Debt (56, ±0)** — F005 held at 59 with no new drift object this run; the
enforcement gap remains tracked. No new debt introduced by the loop.

---

## Tracked-findings status (delta vs 47th)

| Finding                                    | Severity     | Status this run                                              |
| ------------------------------------------ | ------------ | ------------------------------------------------------------ |
| F002 (no `issues: write`)                  | P1           | HELD — 45th consecutive (probe 403)                          |
| F005 (prettier drift)                      | P3           | **HELD at 59 files (no growth)**                             |
| F007 (workflow 2045 lines)                 | P3           | HELD                                                         |
| F008 (styles.js 1296 lines)                | P3           | HELD                                                         |
| F011 (0 tags)                              | P3           | HELD                                                         |
| F013 (workflow-security 12 violations)     | P1           | HELD — 2 CRITICAL + 10 HIGH                                  |
| F014 (parallel test race)                  | P2           | ✅ **MAINTAINED RESOLVED** (1049/0 fail)                     |
| F017 (phantom api.md)                      | P3           | HELD                                                         |
| F018 (data stale 16 days)                  | P2           | HELD (no further drift)                                      |
| F025 (live site outage)                    | P1           | ⚠️ PARTIAL — root/index 404, robots/sitemap 200, Pages built |
| F026 (formatBytes NaN)                     | P3           | HELD — `"NaN undefined"` repro'd                             |
| F028 (brace-expansion HIGH vuln)           | P2           | HELD                                                         |
| F029 (test corrupts raw.csv)               | P2           | ✅ **MAINTAINED RESOLVED** (clean tree)                      |
| F037 (issue_comment write-token agent)     | **CRITICAL** | HELD — **10th run unfixed**                                  |
| F038 (custom_prompt heredoc RCE)           | **CRITICAL** | HELD — **10th run unfixed**                                  |
| F045–F049 (code defects)                   | P2/P3        | ALL HELD                                                     |
| F050 (loop token lacks `workflows: write`) | P1           | HELD — blocks F037/F038 remediation                          |

## Issues created (Phase 1 output)

GitHub issue creation is **blocked by F002** (token lacks `issues: write`; probe this
run → 403 GraphQL `createIssue`, 45th consecutive). Following the established repo
pattern (runs loaded since the token was granted), this run records all findings as
labeled docs records under `docs/issues/2026-08-05/` (this audit report + run
report), with each tracked finding carrying category + priority labels, and ships
them via PR. All tracked findings (F001–F050) are ready to be bulk-created as GitHub
issues the moment token permissions are granted.

## Notes on scoring movement

1. **Third consecutive flat run**: no new findings, no code fixes, no workflow
   changes. Source tree and workflows are byte-identical to the 39th-run audit; the
   47th-run ledger records were the only diff, and they were Prettier-clean at
   creation, holding F005 at 59 with zero growth.
2. **Critical message, now 10 runs old**: F037 + F038 (proven shell RCE + unauthenticated
   write-token agent trigger on a PUBLIC repo) have been open for ten verification
   runs. Workflows are unchanged since the 39th run. Fully remediation-blocked by
   F050 (token lacks `workflows: write`); suppressible only via a token with that
   permission.
3. F014 + F029 both stable-for-4-runs RESOLVED — the test-hygiene cluster is
   healthy. F025 (site outage) and F018 (stale data) are the operational _debt_ next
   after the workflow-security cluster.
4. No subagent delegation was needed: Phase 1 is read-only reuse of direct commands
   and file reads; every finding was re-verified at source. Skills inspected (7
   project SKILL.md) carry no substantive content (all "Registered").

## Next Phase Recommendation

**Phase 2 (Feature Hardening)**, in order, all traceable to documented findings:

1. **F037 + F038** (CRITICAL, 10th run): gate `issue_comment` on author association;
   move `custom_prompt` from the `run:` heredoc into an extended set. Requires
   `workflows: write` (F050). Patch ready:
   `docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`.
2. **F039 + F040 + F041 + F043 + F044**: branch-filter `push`, pin install script +
   actions, remove `--admin` merge, scope secrets per-step, stop interpolating
   `github.actor`.
3. **F042**: ref-scope caches.
4. **F045/F046/F047**: code-level correctness hardening (stale pages, whole-build
   abort, JSON-LD redundancy).
5. **F011 + F025**: tag a release; fix Pages outage so `/index.html` serves.
