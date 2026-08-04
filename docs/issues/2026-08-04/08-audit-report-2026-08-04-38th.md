# Phase 1 — Diagnostic & Comprehensive Scoring Report (38th verification, 2026-08-04)

**Evaluation Date**: 2026-08-04
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 8957b0b — 37th verification run PR #560)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: fresh `npm ci` + `npm audit`, `eslint`, `prettier`, `node --test`
(4 runs), `pytest`, coverage, `check-workflow-security` (human + `--json`),
**4 parallel deep-audit explore agents** (scripts code, src/ architecture, workflow
security, tests/DX) with outputs cross-checked and new findings re-verified via
direct file reads, targeted greps, GitHub API probes (issues, PRs, Pages), live PoC
payload probes for F015. No `oracle`/`momus` delegation needed this run.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 37th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **76.1/100** | C+    | −5.5      |
| **B. System Quality**                 | **75.8/100** | C+    | −2.2      |
| **C. Experience Quality**             | **81.8/100** | B     | −0.9      |
| **D. Delivery & Evolution Readiness** | **65.0/100** | C+    | −0.4      |
| **COMPOSITE**                         | **74.7/100** | C+    | **−2.2**  |

Composite **−2.2 vs 37th run (76.9)** — the largest single-run drop in the 38-run
series. Driver: the **first deep source audit** of `scripts/` and `src/` (4 parallel
explore agents) surfaced **7 NEW findings (F030–F036)**, each re-verified with
direct file reads this run. Headline new items: **F031 (P1)** — `computeSchoolHash`
omits enrichment/lat/lon/kelurahan while the school page template renders
enrichment, so incremental builds silently serve stale pages; **F030 (P2)** —
`monitorBuild` returns a report built *before* `tracker.stop()`, so the returned
`elapsedMs/throughput/peakRss` are always 0 (test-masked via `MIN_THROUGHPUT: 0`);
**F034 (P2)** — `retry()` re-wraps the original error code as `RETRY_EXHAUSTED`,
breaking `error.code` branches; **F033 (P2)** — `check-freshness --json` is
pino-wrapped, not raw JSON; **F032 (P2)** — sitemap stamps `lastmod = today` on
every URL (non-deterministic); **F036 (P2)** — templates import from `scripts/`
(layering inversion); **F035 (P3)** — dead `school.provinceSlug` fallback. **F014
RE-OBSERVED** (1 of 4 `test:js` runs failed); **F029 RE-OBSERVED TWICE** (`raw.csv`
corrupted by both `test:js` and `test:js:coverage`, restored from git). F015
maintained RESOLVED (PoC: no execution for raw/encoded/double-encoded payloads).
F005 held 53 files; F018 held STALE 15d; F028 held (fix 5.0.9); F025 held (root
404); F002 blocks issue creation (403, 35th consecutive).

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                                                                                      |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 27ms, budgets met                                                                                                                           |
| Test failure           | ⚠️ partial | **F014 RE-OBSERVED**: 1 of 4 `npm run test:js` runs failed (flaky, race-dependent). Not a stable failure → no fixed −15, but criterion-level deductions applied across A/B. Python 27/27 stable.     |
| Critical vulnerability | —          | ⚠️ F028 high-severity (dev-tooling only, no production surface) — criterion deduction, not global −20                                                                                              |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                         | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists                                                                      |
| `npm run build`                                  | ✅ exit 0, 2 pages, 0 failed, 27ms; budgets met                                                                                                |
| `npm run lint`                                   | ✅ clean — 0 errors, 0 warnings                                                                                                                |
| `npm run format:check`                           | ❌ **53 files fail Prettier (F005, held; all docs/issues ledger)**                                                                             |
| `npm run test:js` (run 1 of 4)                   | ❌ **1053 tests / 1 fail (F014 RE-OBSERVED — not ok 17 prepareBuildEnvironment)**                                                              |
| `npm run test:js` (runs 2–4)                     | ✅ 1053 tests / 1049 pass / 0 fail (4 skipped) × 3                                                                                            |
| post-test `git status` (F029 trace)              | ❌ **F029 RE-OBSERVED**: `external/raw.csv` overwritten with `col1\nval1`; restored from git                                                    |
| `npm run test:js:coverage`                       | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds; ❌ raw.csv corrupted again (F029), restored again                        |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                                                                                  |
| `npm audit`                                      | ❌ **1 high severity (brace-expansion@5.0.8, F028 held)**                                                                                      |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH) — human exit 1 (F013)                                                                                  |
| `node scripts/check-workflow-security.js --json` | ✅ **F027 maintained RESOLVED — exit 1 with 12 violations**                                                                                    |
| Live site probe (gh api pages + curl)            | ❌ **F025: root HTTP 404; robots 200; Pages "built"**                                                                                          |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (15 days, threshold 7); 2 records (F018, held)                                                                           |
| F004 re-count (`secrets.*`)                      | ❌ **57 refs / 10 unique names** (held)                                                                                                        |
| F007 line count                                  | ❌ 2045 total workflow lines (held)                                                                                                            |
| F008 line count                                  | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                              |
| F011 tag count                                   | ❌ 0 tags (held)                                                                                                                               |
| F016 README probe (`gitignore-check`)            | ✅ maintained RESOLVED — 0 hits                                                                                                                |
| F017 api.md probe (`addNumbers`)                 | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                       |
| F012 engine probe (`npm ls`, engines)            | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2 (held)                                                                          |
| F015 PoC probes (3 payload classes)              | ✅ **maintained RESOLVED** — raw/`%24` rejected; `%2524` passes validator, reaches git clone, no file created                                   |
| F026 unit repro (formatBytes NaN)                | ❌ RE-CONFIRMED — `formatBytes(NaN)` → `"NaN undefined"`                                                                                       |
| Deep audit (4 parallel explore agents)           | scripts/ src/ workflows/ tests/ | ✅ 7 NEW findings F030–F036 re-verified at source; rest mapped to tracked F-numbers                                                            |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 35th consecutive)**                                                                                              |

---

## A. CODE QUALITY (76.1/100, −5.5 vs 37th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                                              |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness           | 15      | 78    | 11.70     | **F031 NEW (−4)**: hash omits enrichment → stale pages; **F030 NEW (−3)**: zeroed report; F014 re-observed (−4); F034 NEW (−2); F026 NaN (−2)         |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                                                |
| Simplicity            | 10      | 82    | 8.20      | **F035 NEW (−3)**: dead fallback; dead client escapeHtml/aggregateByProvince dupes; CI layer overcomplex (F007)                                         |
| Modularity & SRP      | 15      | 74    | 11.10     | **F036 NEW (−4)**: layering inversion (templates→scripts); F008 styles.js 1296L (held); homepage 737L                                                  |
| Consistency           | 5       | 65    | 3.25      | **F005 held 53 files (−3)**; 3× required-fields list; console.log vs pino split                                                                        |
| Testability           | 15      | 64    | 9.60      | **F014 observed (−4)**; **F029 RE-OBSERVED (−4)**: test corrupts tracked raw.csv (2×); **F030 masked by test (−2)** (MIN_THROUGHPUT:0 hides zeroed report) |
| Maintainability       | 10      | 74    | 7.40      | **F031 (hash field drift) + F036 (layering) + F035 (dead code) NEW (−2)**; oversized files (F008); test-only dead exports                               |
| Error Handling        | 10      | 84    | 8.40      | **F034 NEW (−4)**: retry rewraps error code → callers branching on `error.code` break; IntegrationError + ERROR_CODES otherwise solid                  |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); **F028 held** (high vuln in dev chain); F012 mismatch                                                                               |
| Determinism           | 5       | 69    | 3.45      | **F014 observed (−4)**: test count/ordering race; **F032 NEW (−3)**: sitemap lastmod=today for every URL                                               |
| **TOTAL**             | **100** |       | **76.10** |

**A1. Correctness (78, −16)** — the deep audit found two genuine logic defects the
black-box gates could never see: F031 (incremental builds can serve stale
enrichment because `computeSchoolHash` ignores enrichment and other
template-affecting fields while `school-page.js` renders them) and F030 (the
programmatic report contract of `monitorBuild` is broken — returned metrics are
always zero because the report is generated before `stop()`; the log is correct but
the return value is not). F014 re-observation continues to undermine the
determinism guarantee.

**A7. Maintainability (74, −2)** — new debt from F031/F035/F036: hash field set
drifts from actual template inputs (a maintenance trap), dead code remains
unremoved, and the template→scripts import inversion couples layers. F008 (1296L)
and F007 (2045 workflow lines) hold.

---

## B. SYSTEM QUALITY (RUNTIME) (75.8/100, −2.2 vs 37th)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                        |
| ------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 70    | 14.00     | **F014 observed 1/4 (−4)**: CI nondeterminism live; **F032 NEW (−2)**: non-deterministic sitemap output           |
| Performance   | 15      | 90    | 13.50     | 27ms build, budgets met                                                                                           |
| Security      | 20      | 66    | 13.20     | **F027 maintained RESOLVED** (json gate works); **F028 held (−2)**: high-severity dev dep; F013 12 (−2); F015 maintained RESOLVED |
| Scalability   | 15      | 78    | 11.70     | incremental build exists but **F031 NEW (−3)**: hash misses enrichment → stale incremental pages; data truncated (F018) |
| Resilience    | 15      | 85    | 12.75     | **F034 NEW (−3)**: retry/circuit-breaker/timeout present, but retry destroys error identity                         |
| Observability | 15      | 71    | 10.65     | **F033 NEW (−4)**: `--json` output pino-wrapped (not machine-usable); F026 NaN (−2); console.log escapes (held)    |
| **TOTAL**     | **100** |       | **75.80** |

**B4. Scalability (78, −3)** — the incremental build is the project's scale story,
and F031 directly compromises it: `computeSchoolHash` (manifest.js:120-142) omits
enrichment data that `generateEnrichmentSection` renders, so an enrichment update
will not trigger a rebuild of affected school pages. Same class of defect as the
TASK-073 fix (manifest.js:31-35) but in the *field-selection* dimension rather than
the *serialization* dimension.

**B5. Resilience (85, −3)** — F034: `retry()` re-wraps the final error (or any
non-transient error) into `RETRY_EXHAUSTED`, so callers that branch on
`error.code === 'ENOENT'`/`'EEXIST'` (verified pattern in fs-safe.js and
data-reporting modules) receive the wrong code. Root-cause identity must be
preserved for non-transient failures.

---

## C. EXPERIENCE QUALITY (81.8/100, −0.9 vs 37th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                  |
| ------------------------ | ------- | ----- | --------- | -------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion                        |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                            |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback                        |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                   |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports; F035 dead fallback is a latent footgun       |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap                          |
| Documentation Accuracy   | 14      | 55    | 7.70      | **F005 held 53 (ledger, −2)**; F017 phantom api.md persists; F016 maintained resolved (+3) |
| Debuggability (DX)       | 10      | 78    | 7.80      | **F033 NEW (−3)**: `--json` unusable raw; **F030 NEW (−2)**: zeroed report misleading |
| Build/Test Feedback (DX) | 12      | 86    | 10.32     | ~27ms build; tests <5s; **F014 flake (−4)**: 1/4 runs failed               |
| **TOTAL**                | **100** |       | **81.76** |

**C8. Debuggability (78, −4)** — F033 makes the documented `--json` interface
non-machine-usable (pino-wrapped), and F030 means anyone consuming
`monitorBuild`'s return value gets fabricated zero metrics — both are "the tool
lies to you" class DX defects that cost debugging time.

---

## D. DELIVERY & EVOLUTION READINESS (65.0/100, −0.4 vs 37th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                                |
| ------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| CI/CD Health        | 20      | 58    | 11.60     | F027 maintained; F013 (12); F002 35th; F025 (deploy status ≠ site health)                                                |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                                                               |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder; node version drift (.nvmrc 22 vs CI 20 vs engines 20)                                          |
| Migration Safety    | 15      | 66    | 9.90      | **F018 held (15d stale)**; **F029 RE-OBSERVED (−4)**: test can corrupt tracked ETL input (2× this run); data regression unplanned |
| Tech Debt           | 15      | 60    | 9.00      | **F030–F036 NEW (−3)**: 7 new findings; F005 (53) vs F016 (resolved) net held; F019/F020 dead code                       |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; docs-led throughput (PRs #551–#560 merged)                                                    |
| **TOTAL**           | **100** |       | **64.95** |

**D4. Migration Safety (66, held)** — F029 re-observed twice this run (both
`test:js` and `test:js:coverage` corrupt `external/raw.csv` to `col1\nval1`),
raising its severity read: the corruption is not a one-off — every full JS test
cycle has now reproduced it. F018 held at 15 days stale; the 2-record dataset
(baseline 3474) remains frozen since 2026-07-20.

**D5. Tech Debt (60, −3)** — the deep audit quantified latent debt that was
invisible to gate-based scoring: 7 new findings (F030–F036), one P1 and five P2,
all re-verified at source. This is the primary driver of the −2.2 composite drop.

---

## Findings Matrix (36 tracked entries)

| ID            | Finding                                                    | Category | Priority | Status (this run)                                                                     |
| ------------- | ---------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`                 | bug      | P1       | maintained RESOLVED (awaited at fetch-data.js:378)                                    |
| F002          | Loop token lacks `issues: write` (403 createIssue)         | ci       | P1       | RE-CONFIRMED (35th) — output blocked                                                  |
| F003          | Global concurrency groups in on-push.yml                   | ci       | P2       | RE-VERIFIED (line 10)                                                                 |
| F004          | Excessive CI secret exposure (57 refs)                     | security | P1       | RE-VERIFIED — held at 57 refs / 10 unique                                             |
| F005          | Prettier drift                                             | docs     | P3       | HELD — 53 files (all docs/issues ledger)                                              |
| F006          | SITE_URL placeholder (example.com)                         | chore    | P2       | RE-VERIFIED (build/check-freshness log)                                               |
| F007          | CI workflow overcomplexity (2045L)                         | refactor | P2       | RE-VERIFIED (wc -l exact)                                                             |
| F008          | styles.js oversized                                        | refactor | P2       | HELD — 1296 lines                                                                     |
| F009          | pytest not wired into CI                                   | test     | P2       | RE-VERIFIED (+ pytest module absent in env)                                           |
| F010          | Missing E2E/integration tests                              | test     | P3       | RE-VERIFIED                                                                           |
| F011          | Missing automated release (0 tags)                         | ci       | P2       | RE-VERIFIED (git tag → 0)                                                             |
| F012          | lint-staged engine mismatch                                | chore    | P3       | RE-VERIFIED (EBADENGINE: needs node ≥22.22.1)                                         |
| F013          | Workflow permissions (12 violations)                       | security | P2       | RE-VERIFIED (2 CRITICAL + 10 HIGH)                                                    |
| F014          | Parallel test-file race on DIST_DIR                        | test     | P1       | **RE-OBSERVED — 1/4 runs failed (1053 tests/1 fail)**                                 |
| F015          | OS command injection in fetch-data.js                      | security | P1       | maintained RESOLVED (fix #542); PoC probes clean this run                             |
| F015-RESIDUAL | Encoded + parser-rewritten metacharacters accepted         | security | P2       | OPEN — double-encoded `%2524...` passes validator, reaches git clone, no execution   |
| F016          | README documents non-existent `gitignore-check`            | docs     | P3       | maintained RESOLVED — verified 0 hits                                                 |
| F017          | docs/api.md documents nonexistent `addNumbers()`           | docs     | P3       | RE-VERIFIED (docs/api.md:554)                                                         |
| F018          | schools.csv data regression 3472→2                         | bug      | P1       | RE-CONFIRMED (**STALE 15d**)                                                          |
| F019          | Dead code tests/run_tests.py                               | refactor | P3       | RE-VERIFIED (dup imports, dead code after return)                                     |
| F020          | Dead script apply-caching-patch.sh                         | chore    | P3       | RE-VERIFIED (patch file missing)                                                      |
| F021          | Orphaned check-workflow-security.js gate                   | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                                                     |
| F022          | head-meta.js untested                                      | test     | P3       | RE-VERIFIED (no test file)                                                            |
| F023          | Validator logic duplication                                | refactor | P3       | RESOLVED as filed (file never existed)                                                |
| F024          | Build omits sitemap; 404.html broken link                  | bug      | P2       | RE-CONFIRMED (no sitemap step in build)                                               |
| F025          | **Live GitHub Pages site returns 404 (green deploy)**      | bug      | P1       | RE-CONFIRMED (Pages "built", root 404)                                                |
| F026          | formatBytes NaN on negative memory delta                   | bug      | P3       | RE-CONFIRMED (unit repro)                                                             |
| F027          | checker `--json` exits 0 with violations                   | security | P2       | maintained RESOLVED (process.exit added)                                              |
| F028          | brace-expansion@5.0.8 high-severity DoS vuln               | security | P2       | HELD — GHSA-rgw5-rvv9-x895, fix 5.0.9                                                 |
| F029          | fetch-data.test.js corrupts tracked `external/raw.csv`     | test     | P1       | **RE-OBSERVED TWICE** (test:js + test:js:coverage); restored from git                 |
| **F030**      | **monitorBuild returns zeroed report (before stop())**     | bug      | P2       | **NEW** — verified build-performance.js:334-358; test-masked via MIN_THROUGHPUT:0     |
| **F031**      | **computeSchoolHash omits enrichment → stale pages**       | bug      | P1       | **NEW** — verified manifest.js:120-142 vs school-page.js:41-50                        |
| **F032**      | **Sitemap lastmod=today for every URL**                    | chore    | P2       | **NEW** — verified sitemap.js:87-114 (non-deterministic)                              |
| **F033**      | **check-freshness --json pino-wrapped, not raw JSON**      | bug      | P2       | **NEW** — verified check-freshness.js:188                                             |
| **F034**      | **retry() rewraps original error code as RETRY_EXHAUSTED** | bug      | P2       | **NEW** — verified resilience.js:230-240; breaks error.code branches                 |
| **F035**      | **Dead school.provinceSlug fallback (homepage)**           | bug      | P3       | **NEW** — verified homepage.js:431                                                    |
| **F036**      | **Layering inversion: templates import from scripts/**     | refactor | P2       | **NEW** — verified 9 cross-layer requires in src/presenters/templates/               |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → GraphQL 403 "Resource not accessible by integration
(createIssue)", 35th consecutive run). Following the established repo pattern
(runs 1–37), this run records findings as labeled docs records under
`docs/issues/2026-08-04/` and ships them via PR. All **36 tracked findings** remain
labeled (category + priority) and ready to be bulk-created as GitHub issues the
moment token permissions are granted (F002 resolution). PR creation/merge is
available (PRs #551–#560 merged under this token), so the docs-led output path is
fully functional.

## Score Trend

| Domain                  | 35th     | 36th     | 37th     | **38th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 81.8     | 82.3     | 81.6     | **76.1**           |
| B. System Quality       | 78.4     | 78.8     | 78.0     | **75.8**           |
| C. Experience Quality   | 82.5     | 82.5     | 82.7     | **81.8**           |
| D. Delivery & Evolution | 65.45    | 65.7     | 65.4     | **65.0**           |
| **COMPOSITE**           | **77.0** | **77.3** | **76.9** | **74.7**           |

## Composite Score Calculation

| Domain                                | Weight | Score | Weighted  |
| ------------------------------------- | ------ | ----- | --------- |
| A. Code Quality                       | 25%    | 76.1  | 19.03     |
| B. System Quality                     | 25%    | 75.8  | 18.95     |
| C. Experience Quality                 | 25%    | 81.8  | 20.45     |
| D. Delivery & Evolution Readiness     | 25%    | 65.0  | 16.25     |
| **COMPOSITE**                         | 100%   |       | **74.68 → 74.7** |

## Notes on scoring movement

1. The −2.2 composite drop is **measurement-depth-driven, not regression-driven**:
   the first deep source audit revealed latent defects (F030–F036) that gate-based
   scoring could not observe. The code did not get worse this run; the audit got
   deeper.
2. F031 (P1) is the highest-impact new finding: the incremental-build correctness
   guarantee is silently violated for enrichment changes. Recommended first fix.
3. F014 + F029 remain the two live test-hygiene blockers (P1 each); F029 now
   reproduced on **every** full JS test cycle this run (2/2).
4. No new issues were resolved this run; F015/F016/F027/F001 maintained resolved.
