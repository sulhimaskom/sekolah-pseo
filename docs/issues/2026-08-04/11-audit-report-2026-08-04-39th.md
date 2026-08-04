# Phase 1 — Diagnostic & Comprehensive Scoring Report (39th verification, 2026-08-04)

**Evaluation Date**: 2026-08-04
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 9b6460b — 38th verification run PR #561)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: fresh `npm ci` + `npm audit`, `eslint`, `prettier`, `node --test`
(4 runs), `pytest`, coverage, `check-workflow-security` both modes, **2 completed
deep-audit explore agents** (workflow security, src architecture) with all new
candidates re-verified via direct file reads, GitHub API probes (issues, PRs, Pages,
visibility). scripts/ + tests/DX agents cancelled after >25min runtime (partial outputs
folded into existing finding re-verification). No `oracle`/`momus` delegation needed.

---

## Executive Summary

| Domain                                | Score        | Grade | Δ vs 38th |
| ------------------------------------- | ------------ | ----- | --------- |
| **A. Code Quality**                   | **74.2/100** | C     | −1.9      |
| **B. System Quality**                 | **71.7/100** | C     | −4.1      |
| **C. Experience Quality**             | **81.4/100** | B     | −0.4      |
| **D. Delivery & Evolution Readiness** | **62.9/100** | C+    | −2.1      |
| **COMPOSITE**                         | **72.6/100** | C     | **−2.1**  |

Composite **−2.1 vs 38th run (74.7)**. Driver: the **workflow-security deep audit**
surfaced **8 NEW security findings (F037–F044)** including a **CRITICAL pair** — F037
(public-repo `issue_comment` → any user fires a write-token LLM agent over attacker
content) and F038 (proven shell RCE via `workflow_dispatch custom_prompt` heredoc
injection). The src architecture audit added F045–F049 (two P2 incremental-build/data
correctness defects, one P2 data-integrity defect, one P3 dead code, one P3 UX defect).
Partially offset by **F014 NOT observed this run** (4/4 test runs clean) and F029
re-observation being single not double. F005 worsened 53→56 files.

## Global Penalties

| Rule                   | Penalty    | Justification                                                                                                                    |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Build failure          | —          | ✅ PASS — `npm run build` exit 0, 2 pages, 0 failed, 25ms, budgets met                                                           |
| Test failure           | —          | ✅ PASS this run — F014 NOT observed (4/4 test:js runs clean); pytest 27/27. F029 test-side-effect corruption handled at criterion level |
| Critical vulnerability | ⚠️ applied  | **F037 + F038 (CRITICAL, workflow CI)** — applied as heavy criterion-level Security deduction (66→50), not the global −20, because they are CI-pipeline findings, not production-runtime defects |

## Audit Commands (fresh, this run)

| Command                                          | Result                                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                                         | ⚠️ **1 HIGH vuln (F028 brace-expansion@5.0.8)**; F012 EBADENGINE persists                                                                  |
| `npm run build`                                  | ✅ exit 0, 2 pages, 0 failed, 25ms; budgets met                                                                                            |
| `npm run lint`                                   | ✅ clean — 0 errors, 0 warnings                                                                                                            |
| `npx prettier --check .`                         | ❌ **56 files fail Prettier (F005 worsened 53→56, all docs/issues ledger)**                                                                 |
| `npm run test:js` (runs 1–4)                     | ✅ **1053 tests / 1049 pass / 0 fail (4 skipped) × 4 — F014 NOT observed**                                                                 |
| post-test `git status` (F029 trace)              | ❌ **F029 RE-OBSERVED**: external/raw.csv → `col1\nval1`; NEW `external-data/sekolah.csv` residue; both restored/cleaned                    |
| `npm run test:js:coverage`                       | ✅ 95.23% stmt / 92.56% branch / 96.65% funcs — above 80/75 thresholds                                                                       |
| `python3 tests/run_tests.py`                     | ✅ 27/27 pass                                                                                                                                 |
| `npm audit`                                      | ❌ **1 high severity (brace-expansion@5.0.8, F028 held)**                                                                                    |
| `node scripts/check-workflow-security.js`        | ❌ 12 violations (2 CRITICAL + 10 HIGH), human exit 1 (F013)                                                                              |
| `node scripts/check-workflow-security.js --json` | ✅ **F027 maintained RESOLVED — exit 1 with 12 violations**                                                                                  |
| `npm run check-freshness`                        | ⚠️ STALE — 2026-07-20 (15 days, threshold 7); 2 records (F018, held)                                                                         |
| `gh repo view` (visibility)                      | ✅ **PUBLIC** — calibrates F037 severity                                                                                                    |
| `gh issue create` (probe)                        | ❌ **403 `createIssue` (F002, 36th consecutive)**                                                                                            |
| F004 re-count (`secrets.*`)                      | ❌ 57 refs / 10 unique names (held)                                                                                                          |
| F007 line count                                  | ❌ 2045 total workflow lines (held)                                                                                                          |
| F008 line count                                  | ❌ src/presenters/styles.js **1296 lines** (held)                                                                                            |
| F011 tag count                                   | ❌ 0 tags (held)                                                                                                                              |
| F012 engine probe (`npm ls`)                     | ⚠️ lint-staged@17.3.0 requires node ≥22.22.1, runtime v20.20.2 (held)                                                                      |
| F016 README probe (`gitignore-check`)            | ✅ maintained RESOLVED — 0 hits                                                                                                              |
| F017 api.md probe (`addNumbers`)                 | ❌ RE-VERIFIED — documented at docs/api.md:554 (phantom)                                                                                    |
| F025 live-site probe (gh api pages + curl)       | ❌ **F025: root HTTP 404; robots 200; Pages "built"**                                                                                        |
| F026 unit repro (formatBytes NaN)                | ❌ RE-CONFIRMED — `formatBytes(NaN)` → `"NaN undefined"`                                                                                    |
| F030–F036 source re-verification                 | ❌ ALL CONFIRMED at source (monitorBuild, hash, sitemap, --json, retry, fallback, layering)                                                 |
| Deep audit (2 completed explore agents)          | workflows/ + src/ | ✅ **13 NEW findings F037–F049** re-verified at source                                                                 |

---

## A. CODE QUALITY (74.2/100, −1.9 vs 38th)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                                                            |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness           | 15      | 74    | 11.10     | F014 clean (+4); **F045 NEW (−2)** stale pages; **F046 NEW (−2)** whole-build abort; F047 NEW (−1) JSON-LD; F049 NEW (−1) copy-feedback |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistency (held)                                                                             |
| Simplicity            | 10      | 80    | 8.00      | **F048 NEW (−2)**: dead searchLoaded + test-only exports; F035 dead fallback (held); CI overcomplexity F007                            |
| Modularity & SRP      | 15      | 72    | 10.80     | **F036 held (−4)**: layering inversion; F008 styles.js 1296L; homepage 737L; F045/F046 boundary drift                                |
| Consistency           | 5       | 63    | 3.15      | **F005 worsened 53→56 files (−4)**; 3× required-fields list; console.log vs pino split                                               |
| Testability           | 15      | 64    | 9.60      | F014 clean but latent; **F029 RE-OBSERVED (−3)** w/ new residue; F030 masked by test (−2)                                             |
| Maintainability       | 10      | 72    | 7.20      | F045/F046/F048 new debt; F035/F036 held; oversized files (F008)                                                                        |
| Error Handling        | 10      | 78    | 7.80      | **F046 NEW (−4)**: inconsistent per-school vs whole-build error handling; F034 held (−2); IntegrationError/ERROR_CODES otherwise solid  |
| Dependency Discipline | 5       | 84    | 4.20      | 1 prod dep (pino); **F028 held** (high dev vuln); F012 mismatch                                                                      |
| Determinism           | 5       | 70    | 3.50      | F014 clean (+4); **F032 held (−3)** sitemap lastmod; F045 held-delta                                                                  |
| **TOTAL**             | **100** |       | **74.15** |

**A1. Correctness (74, −2)** — the incremental-build and data-flow defects dominate:
F045 (deleted/moved schools leave stale pages) and F046 (a single malformed CSV row
aborts the entire build via the search-data generator, which is *less*
fault-tolerant than the per-school school-pages pipeline it feeds). F014 being clean
this run restores some determinism credit but it remains a latent flake.

**A7. Maintainability (72, −2)** — new debt stacks up: F045's missing stale-page
reconciliation, F046's inconsistent fault-tolerance contract, and F048's dead
production code kept alive only by tests. F008 (1296L) and F036 hold.

---

## B. SYSTEM QUALITY (RUNTIME) (71.7/100, −4.1 vs 38th)

| Criterion            | Weight  | Score | Weighted  | Rationale                                                                                                                              |
| -------------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Stability            | 20      | 72    | 14.40     | F014 clean (+4); **F045 NEW (−2)** stale pages accumulate; F013 CI nondeterminism (-2)                                                   |
| Performance          | 15      | 90    | 13.50     | 25ms build, budgets met                                                                                                                |
| Security             | 20      | 50    | 10.00     | **F037+F038 CRITICAL NEW (−11)**; **F039–F044 NEW (−8)**; F028 (−2); F013 (−2); F015-maintained-resolved; **heaviest deduction of series** |
| Scalability          | 15      | 74    | 11.10     | F031 held (−3) hash misses enrichment; **F045 NEW (−2)** incremental stale pages; data truncated (F018)                                 |
| Resilience           | 15      | 80    | 12.00     | **F046 NEW (−3)** whole-build abort on one bad row; F034 held (−2); retry/circuit-breaker/timeout present otherwise                     |
| Observability        | 15      | 71    | 10.65     | F033 held (−4) pino-wrapped --json; F026 NaN (−2); console.log escapes (held)                                                          |
| **TOTAL**            | **100** |       | **71.65** |

**B3. Security (50, −16)** — the single largest criterion movement of the run. The
workflow audit proved unauthenticated-triggerable RCE (F038 validated by executing an
injected command on this repo's heredoc shape) and an unauthenticated write-token
agent trigger on a **public** repo (F037). F039–F044 are supply-chain, secret-theft,
branch-protection-bypass, cache-poisoning, and over-scoping defects. These are CI/
automation surfaces rather than production-runtime, so the deduction is criterion-level
(not the full global −20), but the blast radius (Cloudflare, Supabase, Gemini keys +
stored PAT) justifies a 66→50 reading.

**B5. Resilience (80, −3)** — F046 is the ERA/DR story of this run: the primary page
pipeline is designed to tolerate per-school failures (skip-and-count), yet the
search-data generator converts a single bad row into a full build abort — an inverted
fault-tolerance gradient.

---

## C. EXPERIENCE QUALITY (81.4/100, −0.4 vs 38th)

| Criterion                | Weight  | Score | Weighted  | Rationale                                                                  |
| ------------------------ | ------- | ----- | --------- | -------------------------------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion; **F049 (−1)** status region goes blank |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down                            |
| Feedback & Error         | 10      | 78    | 7.80      | **F049 NEW (−2)**: copy success announces once then blank; limited user-facing error feedback |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                                                   |
| API Clarity (DX)         | 12      | 86    | 10.32     | **F046 NEW (−2)**: search-data contract aborts whole build; F033 --json not machine-usable |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` works; pytest dep gap                          |
| Documentation Accuracy   | 14      | 54    | 7.56      | **F005 worsened to 56 (−4)**; F017 phantom api.md persists; F016 maintained resolved |
| Debuggability (DX)       | 10      | 78    | 7.80      | F033 --json unusable raw; F030 zeroed report misleading                    |
| Build/Test Feedback (DX) | 12      | 88    | 10.56     | **F014 clean (+4)**; ~25ms build; **F046 (−2)** whole-build abort on dirty row |
| **TOTAL**                | **100** |       | **81.44** |

---

## D. DELIVERY & EVOLUTION READINESS (62.9/100, −2.1 vs 38th)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                                                              |
| ------------------- | ------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 52    | 10.40     | **F037/F038 CRITICAL (−6)**; F013 (12); F002 36th; F025 (deploy ≠ site); F027 maintained resolved                      |
| Release & Rollback  | 20      | 50    | 10.00     | no release process (F011); 0 tags; **F025 site 404 (−15)**                                                             |
| Config & Env Parity | 15      | 76    | 11.40     | **F044 NEW (−2)** job-level secret over-scoping; F006 SITE_URL; node drift (.nvmrc22 vs CI20 vs engines20)             |
| Migration Safety    | 15      | 65    | 9.75      | **F029 RE-OBSERVED w/ residue (−3)**; school deletion/move unhandled (F045); F018 STALE 15d—data frozen                  |
| Tech Debt           | 15      | 57    | 8.55      | **F037–F049 NEW (−4)**: 13 new findings (8 security + 5 code); F005 worsened (53→56)                                     |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; docs-led throughput (PRs #551–#561 merged)                                                   |
| **TOTAL**           | **100** |       | **62.85** |

**D4. Migration Safety (65, −3)** — F029 re-observed once this run with a **new**
untracked `external-data/sekolah.csv` residue (the `useCachedData` fallback writes a
copied fixture into `process.cwd()`; cleanup only partially covers it). Combined with
F045 (no deletion path on data shrink/move) and F018's frozen 2-record dataset, the
data-shrink/migration story is the weakest of the delivery readiness picture.

---

## Findings Matrix (49 tracked entries)

| ID            | Finding                                                    | Category | Priority | Status (this run)                                                                   |
| ------------- | ---------------------------------------------------------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`                 | bug      | P1       | maintained RESOLVED (awaited at fetch-data.js:378)                                  |
| F002          | Loop token lacks `issues: write` (403 createIssue)         | ci       | P1       | RE-CONFIRMED (**36th**) — output blocked                                            |
| F003          | Global concurrency groups in on-push.yml                   | ci       | P2       | RE-VERIFIED (line 10)                                                               |
| F004          | Excessive CI secret exposure (57 refs)                     | security | P1       | RE-VERIFIED — held at 57 refs / 10 unique                                           |
| F005          | Prettier drift                                             | docs     | P3       | **HELD — WORSENED to 56 files (53→56, all docs/issues ledger)**                      |
| F006          | SITE_URL placeholder (example.com)                         | chore    | P2       | RE-VERIFIED (build/check-freshness log)                                              |
| F007          | CI workflow overcomplexity (2045L)                         | refactor | P2       | RE-VERIFIED (wc -l exact)                                                           |
| F008          | styles.js oversized                                        | refactor | P2       | HELD — 1296 lines                                                                   |
| F009          | pytest not wired into CI                                   | test     | P2       | RE-VERIFIED (no python step in workflows)                                           |
| F010          | Missing E2E/integration tests                              | test     | P3       | RE-VERIFIED                                                                          |
| F011          | Missing automated release (0 tags)                         | ci       | P2       | RE-VERIFIED (git tag → 0)                                                           |
| F012          | lint-staged engine mismatch                                | chore    | P3       | RE-VERIFIED (EBADENGINE: needs node ≥22.22.1)                                       |
| F013          | Workflow permissions (12 violations)                       | security | P2       | RE-VERIFIED (2 CRITICAL + 10 HIGH)                                                  |
| F014          | Parallel test-file race on DIST_DIR                        | test     | P1       | **NOT OBSERVED this run** (4/4 test:js clean) — latent flake remains                |
| F015          | OS command injection in fetch-data.js                      | security | P1       | maintained RESOLVED (fix #542); PoC probes clean                                    |
| F015-RESIDUAL | Encoded + parser-rewritten metacharacters accepted         | security | P2       | OPEN — double-encoded `%2524...` reaches git clone, no execution                    |
| F016          | README documents non-existent `gitignore-check`            | docs     | P3       | maintained RESOLVED — verified 0 hits                                                |
| F017          | docs/api.md documents nonexistent `addNumbers()`           | docs     | P3       | RE-VERIFIED (docs/api.md:554)                                                        |
| F018          | schools.csv data regression 3472→2                         | bug      | P1       | RE-CONFIRMED (**STALE 15d**)                                                        |
| F019          | Dead code tests/run_tests.py                               | refactor | P3       | RE-VERIFIED (dup imports, dead code after return)                                   |
| F020          | Dead script apply-caching-patch.sh                         | chore    | P3       | RE-VERIFIED (patch file missing)                                                    |
| F021          | Orphaned check-workflow-security.js gate                   | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                                                   |
| F022          | head-meta.js untested                                      | test     | P3       | RE-VERIFIED (no test file)                                                          |
| F023          | Validator logic duplication                                | refactor | P3       | RESOLVED as filed (file never existed)                                              |
| F024          | Build omits sitemap; 404.html broken link                  | bug      | P2       | RE-CONFIRMED (no sitemap step in build)                                             |
| F025          | **Live GitHub Pages site returns 404 (green deploy)**      | bug      | P1       | RE-CONFIRMED (Pages "built", root 404)                                              |
| F026          | formatBytes NaN on negative memory delta                   | bug      | P3       | RE-CONFIRMED (unit repro)                                                           |
| F027          | checker `--json` exits 0 with violations                   | security | P2       | maintained RESOLVED (exit 1 with violations)                                        |
| F028          | brace-expansion@5.0.8 high-severity DoS vuln               | security | P2       | HELD — GHSA-rgw5-rvv9-x895, fix 5.0.9                                               |
| F029          | fetch-data.test.js corrupts tracked `external/raw.csv`     | test     | P1       | **RE-OBSERVED** (+ new external-data/sekolah.csv residue; both removed/restored)    |
| F030          | monitorBuild returns zeroed report (before stop())         | bug      | P2       | RE-CONFIRMED — build-performance.js:334-358; test-masked via MIN_THROUGHPUT:0        |
| F031          | computeSchoolHash omits enrichment → stale pages           | bug      | P1       | RE-CONFIRMED — manifest.js:120-142 vs school-page.js:41-50                           |
| F032          | Sitemap lastmod=today for every URL                        | chore    | P2       | RE-CONFIRMED — sitemap.js:87-114 (non-deterministic)                                |
| F033          | check-freshness --json pino-wrapped, not raw JSON          | bug      | P2       | RE-CONFIRMED — check-freshness.js:188                                               |
| F034          | retry() rewraps original error code as RETRY_EXHAUSTED     | bug      | P2       | RE-CONFIRMED — resilience.js:230-240; breaks error.code branches                    |
| F035          | Dead school.provinceSlug fallback (homepage)               | bug      | P3       | RE-CONFIRMED — homepage.js:431                                                      |
| F036          | Layering inversion: templates import from scripts/         | refactor | P2       | RE-CONFIRMED — 9 cross-layer requires in src/presenters/templates/                  |
| **F037**      | **issue_comment → unauthenticated write-token agent (PUBLIC repo)** | security | P1 | **CRITICAL NEW** — opencode.yml:8-9,17-22,70-144,174                                  |
| **F038**      | **workflow_dispatch custom_prompt heredoc shell RCE**      | security | P1       | **CRITICAL NEW** — architect-agent.yml:208; injection mechanics proven              |
| **F039**      | **All-branch push runs branch-controlled prompts + cloud secrets** | security | P1 | **NEW** — on-push.yml:4,18-28,77-165                                                 |
| **F040**      | **Unpinned curl|bash opencode install + job-level secrets**| security | P1       | **NEW** — all 6 workflows                                                            |
| **F041**      | **gh pr merge --admin bypasses branch protection**         | security | P2       | **NEW** — opencode.yml:174, on-pull.yml:193                                          |
| **F042**      | **Cross-branch cache poisoning (agent memory/npm)**        | security | P2       | **NEW** — on-push.yml:46-54, parallel.yml:54-61                                      |
| **F043**      | **Zero actions pinned to SHA**                             | security | P2       | **NEW** — 18 mutable @v* tags across workflows                                      |
| **F044**      | **github.actor in run: + job-level secret over-scoping**   | security | P2       | **NEW** — on-pull/parallel/on-push git-config steps                                 |
| **F045**      | **Incremental build never deletes stale pages**            | bug      | P2       | **NEW** — BuildOrchestrator.js:406-449, manifest.js:150-176                          |
| **F046**      | **One malformed CSV row aborts entire build (search-data)**| bug      | P2       | **NEW** — PageBuilder.js:245-264, BuildOrchestrator.js:346-353                       |
| **F047**      | **JSON-LD structured data double-escaped with escapeHtml** | bug      | P2       | **NEW** — school-page.js:102-117                                                     |
| **F048**      | **Dead searchLoaded flag + test-only exports**             | refactor | P3       | **NEW** — homepage.js:22-42,49-77,315,351,734-736                                   |
| **F049**      | **Copy-feedback blank after first copy**                   | bug      | P3       | **NEW** — school-page.js:216-217,233                                                 |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this**
(`gh issue create` → 403 `createIssue`, 36th consecutive). Output ships as **labeled
docs records** under `docs/issues/2026-08-04/` via PR (established runs 1–37 pattern).
All **49 tracked findings** remain labeled (category + priority), ready for bulk issue
creation once token permissions grant `issues: write`.

## Score Trend

| Domain                  | 36th     | 37th     | 38th     | **39th (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 82.3     | 81.6     | 76.1     | **74.2**           |
| B. System Quality       | 78.8     | 78.0     | 75.8     | **71.7**           |
| C. Experience Quality   | 82.5     | 82.7     | 81.8     | **81.4**           |
| D. Delivery & Evolution | 65.7     | 65.4     | 65.0     | **62.9**           |
| **COMPOSITE**           | **77.3** | **76.9** | **74.7** | **72.6**           |

## Composite Score Calculation

| Domain                                | Weight | Score | Weighted |
| ------------------------------------- | ------ | ----- | -------- |
| A. Code Quality                       | 25%    | 74.2  | 18.55    |
| B. System Quality                     | 25%    | 71.7  | 17.93    |
| C. Experience Quality                 | 25%    | 81.4  | 20.35    |
| D. Delivery & Evolution Readiness     | 25%    | 62.9  | 15.73    |
| **COMPOSITE**                         | 100%   |       | **72.55 → 72.6** |

## Notes on scoring movement

1. The −2.1 composite drop is **driven by the workflow-security deep audit**, not by
   production-code regression: 8 of the 13 new findings (F037–F044) are CI/automation
   supply-chain and trigger-exposure defects, with two CRITICALs. The code did not
   degrade this run; the security audit reached deeper (proven RCE, unauthenticated
   agent trigger on a public repo).
2. **F037 + F038 are the priority fixes** — both are one-constraint fixes
   (trigger gating + env-var indirection for F038; actor gating + read-only token for
   F037) and materially reduce the current composite ceiling. Recommended remediation
   order: F038 → F037 → F039 (branch filter) → F040 (pin install) → F041 (drop
   `--admin`) → F042–F044 (cache scoping, SHA pins, env scoping).
3. F014 was NOT observed (4/4 clean) but remains a live latent flake (was 1-of-4 in run
   37 and 38). F029 was re-observed with a new untracked residue, extending its read:
   the `useCachedData` fallback writes fixtures into `process.cwd()`, and cleanup is
   incomplete.
4. Production-runtime (A, C) is comparatively stable; the delta is concentrated in
   automation security (B) and delivery readiness (D). The 2-record data set (F018)
   remains frozen since 2026-07-20, capping scalability and migration-safety.
5. No new issues were resolved this run; F001/F015/F016/F027 maintained resolved.