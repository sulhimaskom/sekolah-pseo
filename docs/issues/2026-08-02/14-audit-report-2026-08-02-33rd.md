# Phase 1 — Diagnostic & Comprehensive Scoring Report (33rd verification, 2026-08-02)

**Evaluation Date**: 2026-08-02
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 98007c6 — F015 fix #542 merged)
**Trigger**: `ulw-loop` run — no open PRs, no open issues (Phase 0.3 → Phase 1)
**Mode**: Independent fresh verification — all commands re-executed, no cached results
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven verification of
F001/F014/F015; payload-class enumeration for F015-RESIDUAL); security PoC harness
(validator-only replication, no `execSync` executed)

---

## Executive Summary

| Domain                                | Score        | Grade |
| ------------------------------------- | ------------ | ----- |
| **A. Code Quality**                   | **81.6/100** | B     |
| **B. System Quality**                 | **79.3/100** | B     |
| **C. Experience Quality**             | **83.1/100** | B     |
| **D. Delivery & Evolution Readiness** | **69.5/100** | C+    |
| **COMPOSITE**                         | **78.4/100** | B     |

Composite **+1.1 vs 31st run (77.3)** — the F015 repair (PR #542) removed the single
largest deduction (−20 Security, −10 Correctness). **F015 RESOLVED for literal payloads**;
a NEW residual hardening gap (F015-RESIDUAL, P2) was discovered: percent-encoded shell
metacharacters (`%26%26`, `%3B`, `%7C`, `%60`) still pass `validateRepoUrl` — not
currently exploitable (shell does not percent-decode) but a defense-in-depth gap. **F001
impact upgraded to functional breakage**: live probe proved `fetchFromGitHub` returns a
floating Promise and `npm run fetch-data` therefore always falls back to cache — the CLI
cannot load fresh data (self-reinforcing F018). **F014 race NOT observed (0/3)** this run
but root cause unchanged. **F005 stable at 48 files** (this run's records formatted
pre-commit). **F002 still blocks issue creation** — 403 `createIssue`, 30th consecutive
run; output ships as docs records + PR (established repo pattern).

## Global Penalties

| Rule                   | Penalty | Justification                                                                        |
| ---------------------- | ------- | ------------------------------------------------------------------------------------ |
| Build failure          | —       | ✅ PASS — `npm run build` → exit 0, 2 pages, 0 failed, 28ms, budgets met             |
| Test failure           | —       | ✅ PASS ×3 — 1032 pass / 0 fail (4 skipped); F014 not observed this run              |
| Critical vulnerability | —       | ✅ F015 primary vectors rejected; residual gap (F015-RESIDUAL) not exploitable today |

## Audit Commands (fresh, this run)

| Command                                      | Result                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm install`                                | ✅ 0 vulnerabilities; ⚠️ lint-staged@17.2.0 engine mismatch persists (F012)     |
| `npm run build`                              | ✅ exit 0, 2 pages, 0 failed, 28ms, budgets met; deterministic                  |
| `npm run lint` (eslint)                      | ✅ clean — 0 errors, 0 warnings                                                 |
| `npm run test:js` (×3 fresh)                 | ✅ 3/3 clean — 1032 pass / 0 fail (F014 latent, not observed)                   |
| `npm run test:js:coverage`                   | ✅ 95.33% stmt / 92.30% branch / 96.63% funcs — above 80/75 thresholds          |
| `python3 tests/run_tests.py`                 | ✅ 27/27 pass                                                                   |
| `npm audit`                                  | ✅ 0 vulnerabilities                                                            |
| `npm run format:check`                       | ❌ **48 files fail Prettier (F005 — stable vs 31st)**                           |
| `node scripts/check-workflow-security.js`    | ❌ **12 violations: 2 CRITICAL + 10 HIGH (F013, stable)**                       |
| `npm run validate-links` (post-build, clean) | ❌ **F024 confirmed: 2 broken links** (404.html → /sitemap-index.xml)           |
| `npm run check-freshness`                    | ⚠️ STALE — last update 2026-07-20 (13 days, threshold 7); 2 records (F018)      |
| F001 live probe (`fetchFromGitHub` return)   | ❌ **PROMISE (floating)** — copyToRaw receives a Promise object                 |
| F015 PoC (validator, 6 literal + 6 encoded)  | ✅ literal payloads REJECTED; ❌ 4 encoded payload classes still PASS           |
| `gh issue create` (probe)                    | ❌ **403 `createIssue`** (F002, 30th consecutive); collaborator permission none |
| `gh pr create` (probe)                       | ✅ PR creation viable (output path established, runs 1–32)                      |

---

## A. CODE QUALITY (Weighted: 81.6/100)

| Criterion             | Weight  | Score | Weighted  | Rationale                                                                                   |
| --------------------- | ------- | ----- | --------- | ------------------------------------------------------------------------------------------- |
| Correctness           | 15      | 90    | 13.50     | F015 closed (−0 vs 31st); F001 upgraded to functional breakage (−8); F014 latent (−2)       |
| Readability & Naming  | 10      | 88    | 8.80      | camelCase + JSDoc; test-file naming inconsistent                                            |
| Simplicity            | 10      | 85    | 8.50      | Simple CSV→HTML pipeline; CI layer overengineered (F007)                                    |
| Modularity & SRP      | 15      | 74    | 11.10     | styles.js 1275L (F008); homepage.js 716L; utils.js 415L; validator duplication (F023)       |
| Consistency           | 5       | 70    | 3.50      | F005 48 files fail Prettier; mixed console.log vs pino                                      |
| Testability           | 15      | 78    | 11.70     | Coverage 95.33 met; F014 latent; pytest not wired (F009); no E2E (F010); F021/F022 untested |
| Maintainability       | 10      | 76    | 7.60      | No TODO/FIXME; oversized files; dead code (F019/F020); workflow sprawl (F007)               |
| Error Handling        | 10      | 88    | 8.80      | IntegrationError + ERROR_CODES; resilience patterns                                         |
| Dependency Discipline | 5       | 90    | 4.50      | 1 prod dep (pino); 0 vulns; lint-staged mismatch (F012)                                     |
| Determinism           | 5       | 72    | 3.60      | F014 latent; F001 floating promise                                                          |
| **TOTAL**             | **100** |       | **81.60** |

### Criterion Details (key changes vs 31st)

#### A1. Correctness (90/100, +10 vs 31st)

- **+10**: F015 RCE primary vectors now rejected (verified live, 6 literal payload
  classes). The single largest previous deduction is closed.
- **−8 F001 (impact upgraded)**: live probe proved `fetchFromGitHub` returns a Promise
  (async `fetchCircuitBreaker.execute`), `main()` never awaits it, and `copyToRaw` then
  calls `fs.copyFileSync(Promise, …)` → TypeError → cache-fallback branch always taken.
  `npm run fetch-data` is functionally unable to load fresh data.
- **−2 F014 (latent)**: not observed 0/3 this run, but five test files still race on the
  real dist/ (root cause unchanged).

#### A6. Testability (78/100, unchanged)

Coverage 95.33% stmt / 92.30% branch met. F014 race latent. `pytest` not wired into CI
(F009); no E2E (F010); `check-workflow-security.js` untested (F021); `head-meta.js`
untested (F022).

---

## B. SYSTEM QUALITY (RUNTIME) (79.3/100)

| Criterion     | Weight  | Score | Weighted  | Rationale                                                                                                       |
| ------------- | ------- | ----- | --------- | --------------------------------------------------------------------------------------------------------------- |
| Stability     | 20      | 78    | 15.60     | Build deterministic; F014 latent (0/3); CI not gating (F009/F010)                                               |
| Performance   | 15      | 90    | 13.50     | 28ms build, budgets met                                                                                         |
| Security      | 20      | 65    | 13.00     | **F015 primary closed (+20); F015-RESIDUAL encoded payloads (−5); F013 12 violations (−23); F004 59 refs (−7)** |
| Scalability   | 15      | 82    | 12.30     | incremental build; data truncated (F018)                                                                        |
| Resilience    | 15      | 88    | 13.20     | retry/circuit-breaker/timeout                                                                                   |
| Observability | 15      | 78    | 11.70     | pino logging; console.log escapes (data-quality.js)                                                             |
| **TOTAL**     | **100** |       | **79.30** |

**B3. Security (65/100, +11 vs 31st)** — **F015 primary RCE vector RESOLVED** (verified:
`;id`, `$(id)`, backtick-literal, `&&` literal all rejected). Residual: percent-encoded
payloads (`%26%26`, `%3B`, `%7C`, `%60`) still pass validation — not exploitable today
(shell does not decode) but must be hardened (F015-RESIDUAL, new, P2). **F013**:
12 workflow violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH) unchanged. **F004**:
59 `secrets.*` refs across 11 names unchanged.

---

## C. EXPERIENCE QUALITY (83.1/100, unchanged)

| Criterion                | Weight  | Score | Weighted  | Rationale                                           |
| ------------------------ | ------- | ----- | --------- | --------------------------------------------------- |
| Accessibility            | 10      | 92    | 9.20      | ARIA landmarks, skip links, sr-only, reduced-motion |
| User Flow Clarity        | 10      | 88    | 8.80      | Breadcrumbs, search/filter, province drill-down     |
| Feedback & Error         | 10      | 80    | 8.00      | Status messages; limited user-facing error feedback |
| Responsiveness           | 10      | 92    | 9.20      | Mobile-first breakpoints                            |
| API Clarity (DX)         | 12      | 88    | 10.56     | Well-documented JSDoc exports                       |
| Local Dev Setup (DX)     | 12      | 85    | 10.20     | Clear README; `npm install` + scripts work          |
| Documentation Accuracy   | 14      | 58    | 8.12      | F005 (48 files); F016/F017 stale refs               |
| Debuggability (DX)       | 10      | 82    | 8.20      | pino; named errors; build metrics                   |
| Build/Test Feedback (DX) | 12      | 90    | 10.80     | 28ms build; tests <5s                               |
| **TOTAL**                | **100** |       | **83.08** |

No UX/DX-affecting change since 31st run; F015 fix is internal plumbing.

---

## D. DELIVERY & EVOLUTION READINESS (69.5/100)

| Criterion           | Weight  | Score | Weighted  | Rationale                                                                        |
| ------------------- | ------- | ----- | --------- | -------------------------------------------------------------------------------- |
| CI/CD Health        | 20      | 61    | 12.20     | F013 (12 violations); F002 blocked 30th; F003 global concurrency; F009/F010 gaps |
| Release & Rollback  | 20      | 65    | 13.00     | no release process (F011); 0 tags                                                |
| Config & Env Parity | 15      | 78    | 11.70     | F006 SITE_URL placeholder                                                        |
| Migration Safety    | 15      | 70    | 10.50     | F018 data regression unplanned                                                   |
| Tech Debt           | 15      | 62    | 9.30      | F005 (48 files); F015 security debt reduced; dead code F019/F020; sprawl F007    |
| Change Velocity     | 15      | 85    | 12.75     | atomic commits; fast loop; F015 fix shipped as single atomic PR (#542)           |
| **TOTAL**           | **100** |       | **69.45** |

---

## Findings Re-Verification Matrix (25 tracked entries)

| ID            | Finding                                             | Category | Priority | Status (this run)                                    |
| ------------- | --------------------------------------------------- | -------- | -------- | ---------------------------------------------------- |
| F001          | Floating promise in fetch-data.js `main()`          | bug      | P1       | **RE-CONFIRMED + impact upgraded (live probe)**      |
| F002          | Loop token lacks `issues: write` (403 createIssue)  | ci       | P1       | RE-CONFIRMED (30th) — output blocked                 |
| F003          | Global concurrency groups in on-push.yml            | ci       | P2       | RE-VERIFIED (line 10)                                |
| F004          | Excessive CI secret exposure (59 refs, 11 names)    | security | P1       | RE-VERIFIED (fresh count 59)                         |
| F005          | Prettier drift                                      | docs     | P3       | RE-VERIFIED — stable 48 files (formatted pre-commit) |
| F006          | SITE_URL placeholder (example.com)                  | chore    | P2       | RE-VERIFIED (freshness log)                          |
| F007          | CI workflow overcomplexity (2045L)                  | refactor | P2       | RE-VERIFIED (wc -l)                                  |
| F008          | styles.js oversized 1275L                           | refactor | P2       | RE-VERIFIED                                          |
| F009          | pytest not wired into CI                            | test     | P2       | RE-VERIFIED (0 workflow hits)                        |
| F010          | Missing E2E/integration tests                       | test     | P3       | RE-VERIFIED                                          |
| F011          | Missing automated release (0 tags)                  | ci       | P2       | RE-VERIFIED (git tag → 0)                            |
| F012          | lint-staged engine mismatch                         | chore    | P3       | RE-VERIFIED (EBADENGINE on install)                  |
| F013          | Workflow permissions (12 violations)                | security | P2       | RE-VERIFIED (check-workflow-security.js)             |
| F014          | Parallel test-file race on DIST_DIR                 | test     | P1       | NOT OBSERVED (0/3) — root cause unchanged            |
| F015          | OS command injection in fetch-data.js               | security | P1       | **RESOLVED — literal payloads rejected (fix #542)**  |
| F015-RESIDUAL | Percent-encoded metacharacters pass validateRepoUrl | security | P2       | **NEW — 4 encoded payload classes accepted**         |
| F016          | README documents non-existent `gitignore-check`     | docs     | P3       | RE-VERIFIED (file absent)                            |
| F017          | docs/api.md documents nonexistent `addNumbers()`    | docs     | P3       | RE-VERIFIED (0 hits)                                 |
| F018          | schools.csv data regression 3474→2                  | bug      | P1       | RE-VERIFIED (2 records, STALE 13d)                   |
| F019          | Dead code tests/run_tests.py                        | refactor | P3       | RE-VERIFIED                                          |
| F020          | Dead script apply-caching-patch.sh                  | chore    | P3       | RE-VERIFIED (patch file missing)                     |
| F021          | Orphaned check-workflow-security.js gate            | security | P2       | RE-VERIFIED (husky `2>/dev/null`)                    |
| F022          | head-meta.js untested                               | test     | P3       | RE-VERIFIED (no test file)                           |
| F023          | Validator logic duplication                         | refactor | P3       | RE-VERIFIED                                          |
| F024          | Build omits sitemap; 404.html broken link           | bug      | P2       | RE-CONFIRMED (2 broken links, 4th)                   |

## Issue Output Status

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh
issue create` → 403, 30th consecutive run — token has `collaborator permission: none`).
Following the established repo pattern (runs 1–32 shipped identical docs PRs #531–#541),
this run records findings as labeled docs records under
`docs/issues/2026-08-02/10-issue-records-33rd/` and ships them via PR. All 25 tracked
findings remain labeled (category + priority) and ready to be bulk-created as GitHub
issues the moment token permissions are granted (F002 resolution).

## Score Trend

| Domain                  | 29th     | 30th     | 31st     | **33rd (current)** |
| ----------------------- | -------- | -------- | -------- | ------------------ |
| A. Code Quality         | 80.4     | 80.2     | 80.1     | **81.6**           |
| B. System Quality       | 76.9     | 76.7     | 76.7     | **79.3**           |
| C. Experience Quality   | 83.9     | 83.6     | 83.1     | **83.1**           |
| D. Delivery & Evolution | 70.2     | 69.8     | 69.2     | **69.5**           |
| **COMPOSITE**           | **77.9** | **77.6** | **77.3** | **78.4**           |
