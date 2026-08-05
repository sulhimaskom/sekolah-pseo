# Phase 1 — Diagnostic & Comprehensive Scoring Report (46th verification, 2026-08-05)

**Evaluation Date**: 2026-08-05 (run executed 2026-08-05T05:39Z – 05:45Z)
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 30d5509 — 45th verification run, PR #570 merged)
**Trigger**: `ulw-loop` run — Phase 0.1/0.2 probes → 0 open PRs, 0 open issues → Phase 1 (AUDIT MODE)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven re-verification of
F014 stability and F026 NaN repro). Project skills inspected under `.opencode/skill/`
(7 SKILL.md present: debugging-strategies, backend-models-standards, moai-tool-opencode,
context-engineering-memory-systems, systematic-debugging, agentic-qe-skill-builder,
git-commit-message) — audit is read-only, so no fix-skill execution required this run.
Commands: `npm install`, `npm run lint`, `npm run format:check`, `npm audit`, `npm run build`,
`npm run test:js`, `npm run test:js:coverage`, `python3 tests/run_tests.py`,
`pip3 install pytest` + `python3 -m pytest`, `node scripts/check-workflow-security.js`,
`node scripts/check-freshness.js`, `gh` API probes, live-site curl probes, source
re-verification of F037/F038/F017/F026/F045–F049 via direct file reads.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 45th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **75.1/100** | C     | ±0.0      |
| **B. System Quality**                 | **71.9/100** | C     | ±0.0      |
| **C. Experience Quality**             | **81.3/100** | B     | ±0.0      |
| **D. Delivery & Evolution Readiness** | **63.4/100** | C+    | **+0.6**  |
| **COMPOSITE**                         | **72.9/100** | C     | **+0.1**  |

First upward composite movement since the 42nd run (+0.1), driven by **F025 partial
restoration**: `robots.txt` returned to 200 and Pages reports "built" (45th run had
a full outage — root/robots/index/Vercel all 404). The site **remains down at root**
(`/` and `/index.html` still 404), so F025 stays OPEN and D's Release & Rollback
penalty only eases (−17 → −14), not clears. No code changes since 45th: **F014**
(1053→1049/0 fail) and **F029** (clean tree ×5) both **maintained RESOLVED**.
**F005 HELD at 59 files** (no growth). The two most severe findings — **F037 + F038
(CRITICAL workflow-security) — remain UNFIXED for an 8th run**, both re-confirmed at
source; remediation still blocked by F050 (loop token lacks `workflows: write`).
F002 blocks GitHub-issue output for the **43rd consecutive run**; findings ship as
labeled docs records per the established pattern.

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                                                                          |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 29ms, all performance budgets met                                                                                                                 |
| Test failure           | —          | ✅ PASS — 1053/1049/0 fail JS + 27/27 Python + 13/13 pytest; F014 NOT observed; F029 no residue (5/5 clean trees)                                                                                      |
| Critical vulnerability | ⚠️ applied | **F037 + F038 (CRITICAL, workflow CI-Pipeline)** — criterion-level Security deduction (50) as in 39th–45th; not the global −20 (CI-pipeline, not production runtime); F025 partial outage also mined in D |

## Audit Commands (fresh, this run)

| Command                                   | Result                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                             | ✅ installed; ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8, GHSA-rgw5-rvv9-x895)**; F012 EBADENGINE persists (lint-staged wants node ≥22.22.1, run v20.20.2)                   |
| `npm run lint`                            | ✅ clean — 0 errors, 0 warnings                                                                                                                                              |
| `npm run format:check`                    | ❌ **59 files fail Prettier (F005 HELD at 59; all docs/issues ledger, source clean)**                                                                                        |
| `npm audit`                               | ❌ 1 high severity (brace-expansion@5.0.8, F028 held)                                                                                                                        |
| `npm run build`                           | ✅ exit 0, 2 pages, 0 failed, 29ms, budgets met                                                                                                                              |
| `npm run test:js`                         | ✅ **1053 tests / 1049 pass / 0 fail / 4 skipped — F014 NOT observed (maintained)**                                                                                          |
| `npm run test:js:coverage`                | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                                                       |
| `python3 tests/run_tests.py`              | ✅ 27/27 pass (100%)                                                                                                                                                         |
| `pip3 install pytest` + `pytest tests/`   | ⚠️ pytest absent from runner image (env gap) → installed ad hoc → ✅ 13/13 pass                                                                                              |
| `node scripts/check-workflow-security.js` | ❌ **12 violations (2 CRITICAL + 10 HIGH), exit 1 (F013 held)**                                                                                                              |
| `node scripts/check-freshness.js`         | ⚠️ **STALE — 2026-07-20 (16 days, threshold 7; held)**; 2 records (F018)                                                                                                     |
| `gh issue create` (probe)                 | ❌ **403/GraphQL `createIssue` (F002, 43rd consecutive)**                                                                                                                    |
| F004 re-count (`secrets.*`)               | ❌ 59 refs / 10 unique names (held)                                                                                                                                          |
| F007 line count                           | ❌ 2045 total workflow lines (held)                                                                                                                                          |
| F008 line count                           | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                                                            |
| F011 tag count                            | ❌ 0 tags (held)                                                                                                                                                             |
| F017 api.md probe (`addNumbers`)          | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                                                     |
| F025 live-site probe (curl ×3 + Pages)    | ⚠️ **PARTIAL RESTORATION — root 404, index.html 404, robots.txt 200 (was 404), Pages status "built"**                                                                        |
| F026 unit repro (`formatBytes(NaN)`)      | ❌ RE-CONFIRMED — returns `"NaN undefined"` (units[NaN] undefined)                                                                                                           |
| F037 source re-verification               | ❌ CONFIRMED — opencode.yml:8-9 `issue_comment: [created]`, no author-association gate, PUBLIC repo (**8th run**)                                                            |
| F038 source re-verification               | ❌ CONFIRMED — architect-agent.yml:208 `${{ github.event.inputs.custom_prompt }}` inside `run:` heredoc (proven RCE; **8th run**)                                            |
| F045–F049 source spot-checks              | ❌ ALL HELD — BuildOrchestrator stale pages (F045), search-data build abort (F046), school-page JSON-LD double-escape (F047), homepage searchLoaded dead code (F048), copy-feedback (F049) |

---

## A. CODE QUALITY (75.1/100, ±0.0 vs 45th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                           |
| --------------------- | ------- | ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 75    | 11.25     | **F014 maintained on main** (1049/0 fail, verified); F045/F046/F047/F049 held; no new code defects observed                         |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                            |
| Simplicity            | 10      | 80    | 8.00      | F048 dead searchLoaded + test-only exports (held); F035 dead fallback (held); CI overcomplexity F007                                |
| Modularity & SRP      | 15      | 72    | 10.80     | F036 layering inversion (held); F008 styles.js 1296L; F045/F046 boundary drift (held)                                               |
| Consistency           | 5       | 62    | 3.10      | **F005 HELD at 59 files** (no growth); 3× required-fields list; console.log vs pino split                                           |
| Testability           | 15      | 69    | 10.35     | **F014 maintained resolved (+3)**; **F029 maintained resolved (+2)**; F030 masked by test (−2)                                      |
| Maintainability       | 10      | 72    | 7.20      | F045/F046/F048 held debt; F035/F036 held; oversized files (F008)                                                                    |
| Error Handling        | 10      | 78    | 7.80      | F046 held (−4): inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid   |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); F028 held (high dev vuln); F012 mismatch                                                                         |
| Determinism           | 5       | 72    | 3.60      | **F014 on main, stable (+2)**; F032 held (−3) sitemap lastmod; F045 held-delta                                                     |
| **TOTAL**             | **100** |       | **75.10** |

**A1. Correctness (75, ±0)** — F014's fix is permanent on main (PR #568); this run's
single full-suite run yielded 1049 pass / 0 fail, race not observed. F045–F049 code
defects remain open, unchanged.

**A5. Consistency (62, ±0)** — F005 drift count unchanged at 59 files (new
2026-08-05 records written Prettier-clean).

**A6. Testability (69, ±0)** — F014 (maintained) and F029 (clean tree ×5, maintained)
both remain resolved.

---

## B. SYSTEM QUALITY (RUNTIME) (71.9/100, ±0.0 vs 45th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                        |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 73    | 14.60     | **F014 on main (+1)**; F045 stale-page accumulation (held); F013 CI nondeterminism (−2)                          |
| Performance   | 15      | 90    | 13.50     | 29ms build, budgets met                                                                                          |
| Security      | 20      | 50    | 10.00     | **F037+F038 CRITICAL UNFIXED 8th run (−11)**; F039–F044 held (−8); F028 (−2); F013 (−2)                          |
| Scalability   | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; F045 held (−2); data truncated (F018)                                     |
| Resilience    | 15      | 80    | 12.00     | F046 held (−3) whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise |
| Observability | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                    |
| **TOTAL**     | **100** |       | **71.85** |

**B3. Security (50, ±0)** — unchanged for an **eighth verification run**: F037
(public-repo `issue_comment` → unauthenticated write-token LLM agent, opencode.yml:8-9)
and F038 (proven shell RCE via `workflow_dispatch custom_prompt` heredoc injection,
architect-agent.yml:208) remain open, re-confirmed at source this run. The repo is
PUBLIC, so both remain externally triggerable. F039–F044 held. Remediation requires
`workflows: write` (F050), which the loop token lacks; the 42nd-run patch
(`docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md`) remains valid but unpushable.

---

## C. EXPERIENCE QUALITY (81.3/100, ±0.0 vs 45th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                          |
| ------------------------ | ------- | ----- | --------- | ---------------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; F049 (−1) status region blank |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                                    |
| Feedback & Error         | 10      | 78    | 7.80      | F049 held (−2): copy success announces once then blank                             |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                           |
| API Clarity (DX)         | 12      | 86    | 10.32     | F046 held (−2): search-data contract aborts whole build; F033 --json               |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; ⚠️ pytest env gap on fresh runners (this run)   |
| Documentation Accuracy   | 14      | 53    | 7.42      | **F005 held at 59 files**; F017 phantom api.md persists                            |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 --json unusable raw; F030 zeroed report misleading                            |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | F014 deterministic on main; ~29ms build; F046 (−2) whole-build abort on dirty row  |
| **TOTAL**                | **100** |       | **81.30** |

**C4. Documentation Accuracy (53, ±0)** — F005 drift count unchanged at 59. F017
(phantom `addNumbers()` at docs/api.md:554) re-verified this run.

---

## D. DELIVERY & EVOLUTION READINESS (63.4/100, +0.6 vs 45th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                  |
| ------------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL unfixed 8th run (−6)**; F013 (12 violations); F002 (43rd); F027 maintained resolved   |
| Release & Rollback  | 20      | 51    | 10.20     | **F025 PARTIAL restoration — root/index 404 but robots 200 + Pages "built" (−14, eased from −17)**         |
| Config & Env Parity | 15      | 76    | 11.40     | F044 held (−2) job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)    |
| Migration Safety    | 15      | 67    | 10.05     | **F029 maintained resolved (+3)**; F045 school deletion/move unhandled; **F018 STALE 16d (held)**          |
| Tech Debt           | 15      | 57    | 8.55      | F014+F029 resolved (+1); **F005 held at 59 files**; 49 tracked findings, 13 from 39th run open             |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; F014 landed via PR #568 (maintained)                                            |
| **TOTAL**           | **100** |       | **63.35** |

**D2. Release & Rollback (51, +3)** — F025 eased: the 45th run observed a full
outage (root/robots/index/Vercel all 404, penalty −17). This run `robots.txt`
returns 200 and the Pages API reports status "built"; however `/` and `/index.html`
still return 404, so the site remains down for visitors — penalty reduced −17 → −14,
finding stays OPEN.

---

## Tracked-findings status (delta vs 45th)

| Finding | Severity | Status this run |
| ------- | -------- | --------------- |
| F002 (no `issues: write`)              | P1 | HELD — 43rd consecutive (probe 403) |
| F005 (prettier drift)                  | P3 | HELD at 59 files |
| F007 (workflow 2045 lines)             | P3 | HELD |
| F008 (styles.js 1296 lines)            | P3 | HELD |
| F011 (0 tags)                          | P3 | HELD |
| F013 (workflow-security 12 violations) | P1 | HELD — 2 CRITICAL + 10 HIGH |
| F014 (parallel test race)              | P2 | ✅ MAINTAINED RESOLVED (1049/0 fail) |
| F017 (phantom api.md)                  | P3 | HELD |
| F018 (data stale 16 days)              | P2 | HELD (no further drift) |
| F025 (live site outage)                | P1 | ⚠️ PARTIAL IMPROVEMENT — root/index 404, robots 200, Pages built |
| F026 (formatBytes NaN)                 | P3 | HELD — `"NaN undefined"` repro'd |
| F028 (brace-expansion HIGH vuln)       | P2 | HELD |
| F029 (test corrupts raw.csv)           | P2 | ✅ MAINTAINED RESOLVED (clean tree ×5) |
| F037 (issue_comment write-token agent) | **CRITICAL** | HELD — **8th run unfixed** |
| F038 (custom_prompt heredoc RCE)       | **CRITICAL** | HELD — **8th run unfixed** |
| F045–F049 (code defects)               | P2/P3 | ALL HELD |

## Issues created (Phase 1 output)

GitHub issue creation is **blocked by F002** (token lacks `issues: write`; probe
failed again this run — 43rd consecutive). Per the established pattern, all findings
are recorded as labeled docs records in `docs/issues/` with category+priority
labels, and this report ships via the docs-records PR.

## Final state

- **Phase 1 (AUDIT)**: COMPLETE — composite **72.9/100 (+0.1)**
- **Phase 2 (HARDENING)**: F037/F038 patch ready (42nd run) but unpushable under
  F050; re-checked this run — no token change, still blocked
- **State**: **waiting for human review** — blockers: F050 (no `workflows: write`),
  F002 (no `issues: write`). Highest-value human actions: grant the loop token
  `workflows: write` + `issues: write`, then re-run to land the F037/F038 fix PR.
