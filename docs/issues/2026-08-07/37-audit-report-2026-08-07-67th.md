# Phase 1 — Diagnostic & Comprehensive Scoring Report (67th verification, 2026-08-07)

**Evaluation Date**: 2026-08-07
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (`2cea269` — 66th run docs, PR #598 merged) [detected: main]
**Trigger**: `ulw-loop` — Phase 0.1/0.2 → 0 open PRs / 0 open issues → PHASE 1 (AUDIT MODE, read-only).
**Mode**: Full command-matrix execution (lint / format:check / build / JS tests / coverage / Python tests / workflow-security / freshness / sitemap / validate-links / github-issue probe) + 4 parallel `explore` subagents (source map, CI/CD+configs, tests/security, docs). No production source code modified; worktree clean at start.

## Executive Summary

| Domain                                | Score    | Grade | vs 66th  |
| ------------------------------------- | -------- | ----- | -------- |
| **A. Code Quality**                   | 75.1/100 | C     | ±0.0     |
| **B. System Quality**                 | 71.1/100 | C     | ±0.0     |
| **C. Experience Quality**             | 79.7/100 | B     | ±0.0     |
| **D. Delivery & Evolution Readiness** | 58.2/100 | C+    | ±0.0     |
| **COMPOSITE**                         | 71.0/100 | C     | **±0.0** |

Composite **71.0 (±0.0)** — second consecutive flat confirmation run. HEAD ==
origin/main == `2cea269`; zero code churn since the 66th run. The full command
matrix passed again (lint 0, JS 1056/0 + 4 skip, Python 27/27, build exit 0,
coverage 94.94/92.2/96.65 above thresholds) and every high-value ledger finding
was re-verified firsthand:

- **F002 (issue-creation block)** — CONFIRMED 64th consecutive: `gh issue
create` → `GraphQL: Resource not accessible by integration (createIssue)`.
  Root cause confirmed at source: `on-pull.yml` workflow `permissions:` block
  omits `issues: write` (only contents/pull-requests/actions/repository-projects
  declared), whereas `opencode.yml` grants it. Under the scheduled `/ulw-loop`
  the token can never open GitHub issues or PRs.
- **F005 (Prettier drift)** — HELD at **64 files** (`npm run format:check`
  exit 1). Population = `docs/issues/*`, self-inflicted write-time formatting.
- **F018 (data STALE)** — CONFIRMED: freshness gate exit 1, last update
  2026-07-20 (**18 days**, threshold 7), 2 records.
- **F024 (build omits sitemap)** — CONFIRMED: after `npm run build` the dist/
  tree has no `sitemap-index.xml` (build only runs build-pages.js, not
  sitemap.js; sitemap is a separate `npm run sitemap` step).
- **Workflow security cluster (F056-F059, F037/F038, F013, F063/F064/F065)**
  — CONFIRMED: `node scripts/check-workflow-security.js` exits **1 with 12
  violations (2 CRITICAL DUPLICATE_API_KEY + 10 HIGH)** across 5 workflow files.
- **F018/CI** — no CI workflow runs build/lint/test as a gate (grep of
  `.github/workflows/*` for `npm run (build|lint|test)|pytest` → zero matches;
  only `npm ci || true` in parallel.yml:72/347).

**Reported skills used** (contract §5): project `.opencode/skill/*` inspected —
7 general agent-behavior skills (systematic-debugging, backend-standards,
git-commit-message, context-engineering-memory, testing-QE, adk-tool,
debugging-strategies). **No audit-specific procedure skill exists to apply**;
all findings were verified empirically (command execution, `gh` API probes,
git-history forensics, 4 parallel `explore` subagents).

## Global Penalties

| Rule                   | Penalty | Justification                                                                                |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Build failure          | —       | `npm run build` exit 0 — 2 pages, 0 failed, budgets met                                      |
| Test failure           | —       | JS 1056 pass / 0 fail / 4 skip (1060 total); coverage 94.94/92.2/96.65; Python 27/27 (100%)  |
| Critical vulnerability | applied | **F037+F038 (CRITICAL, CI-pipeline)** + F056-F059 cluster — criterion-level Security penalty |
| (Issue output)         | —       | **F002**: GitHub issue creation returns 403 `createIssue` (token lacks `issues:write`)       |

## Audit Commands (this run, witnesses firsthand)

| Command                                   | Result                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `git fetch` + window check                | HEAD == origin/main == `2cea269` — zero churn since 66th                                                   |
| `npm install`                             | 131 packages added; `EBADENGINE` warning lint-staged@17.3.0 needs node >=22.22.1, env v20.20.2 (F012/F064) |
| `npm run lint`                            | exit 0 — zero ESLint errors/warnings                                                                       |
| `npm run format:check`                    | **exit 1 — 64 files** (F005 HELD, no growth)                                                               |
| `npm run build`                           | exit 0 — homepage + 2 province + 2 school + robots.txt + styles.css; 26 ms; budgets met                    |
| `npm run test:js`                         | 1060 tests / 1056 pass / 0 fail / 4 skipped                                                                |
| `npm run test:js:coverage`                | 94.94% stmt / 92.2% branch / 96.65% func — above 80/75 gates                                               |
| `python3 tests/run_tests.py`              | 27/27 passed (100%); `pytest tests/` 13 passed (dual-runner, F-doc)                                        |
| `npm run sitemap`                         | exit 0 — 1 sitemap, 5 URLs; **warns SITE_URL placeholder `https://example.com`**                           |
| `npm run validate-links`                  | exit 0 — 6 HTML files, no broken links                                                                     |
| `npm run check-freshness`                 | **exit 1 — STALE 18 days** (threshold 7); 2 records @ 2026-07-20 (F018)                                    |
| `node scripts/check-workflow-security.js` | **exit 1 — 12 violations (2 CRITICAL + 10 HIGH)** (F cluster held)                                         |
| `ls dist` post-build                      | no `sitemap-index.xml` → **F024 confirmed**                                                                |
| `gh issue create` probe                   | **403 `GraphQL: Resource not accessible by integration (createIssue)` (F002, 64th consecutive)**           |

## A. CODE QUALITY (75.1/100, ±0.0)

Criterion scoring with observations / evidence / impact / rationale.

### Correctness (W 15, score 76, weighted 11.40)

- **Observations**: All 10 CLI entrypoints end-to-end correct; 1060 JS + 27 Py tests pass; coverage ~95%; build deterministic (26 ms, budgets met).
- **Evidence**: `scripts/build-pages.js`, `src/services/BuildOrchestrator.js`; test run logs (exit 0); coverage report.
- **Impact/Risk**: The main residual correctness risk is untrusted-input handling on the boundary (F056 path-guard bypass, F057 prototype-key injection via NPSN on plain maps). These are in `scripts/config.js`, `scripts/manifest.js`, `src/services/BuildOrchestrator.js`.
- **Score rationale**: −24 for the held boundary-security findings (re-verified at source and via script); tests otherwise near-perfect.

### Readability & Naming (W 10, score 88, weighted 8.80)

- **Observations**: consistently camelCase + JSDoc; one duplicate JSDoc block on `generateHomepageHtml` (`src/presenters/templates/homepage.js:42-51`).
- **Evidence**: `src/services/PageBuilder.js`, entire source tree.
- **Rationale**: −12 for the duplicated comment + minor test-file naming inconsistency.

### Simplicity (W 10, score 80, weighted 8.00)

- **Observations**: thin controllers; I/O-free PageBuilder; legacy double-exports in `scripts/build-pages.js` retained for back-compat test imports (F048 dead code removed, but legacy exports remain).
- **Evidence**: `scripts/build-pages.js` (63-ln thin shell re-exporting BuildOrchestrator).
- **Score rationale**: −20 for legacy re-export surface + two concurrency APIs (`processConcurrently` vs `processInBatches`).

### Modularity & SRP (W 15, score 72, weighted 10.80)

- **Observations**: ADR-0005 layering (scripts=controllers/infra, src/services=logic, src/presenters=template+CSS) largely upheld; but `scripts/` mixes controllers with shared infra, `scripts/utils.js` is a 436-line grab-bag, `src/presenters/styles.js` is 1296 lines, `homepage.js` 670 lines incl. inline client JS.
- **Evidence**: layering map; `src/presenters/styles.js` (oversized-file issue), `scripts/utils.js`.
- **Score rationale**: −28 for oversized `styles.js`, the `utils.js` grab-bag, and controller/infra mixing (F008/F036 persist).

### Consistency (W 5, score 55, weighted 2.75)

- **Observations**: `npm run format:check` **fails on 64 files** (F005), a consistency gate that the repo itself cannot pass at HEAD.
- **Evidence**: `prettier --check .` exit 1; infected files in `docs/issues/*`.
- **Score rationale**: −45. Single worst criterion; bot-generated docs are not being prettier-formatted at write time.

### Testability (W 15, score 70, weighted 10.50)

- **Observations**: strong — 1060 JS / 27-64 py, coverage 94.94/92.2/96.65, co-located `node:test` files, c8 gates.
- **Evidence**: test matrix results; `.github`/package.json scripts.
- **Impact/Risk**: tests exist but are **not wired as a CI gate** (see Domain D) — they can regress silently in CI unless run locally.
- **Score rationale**: −7 for dual Python runner fragmentation / no CI wiring.

### Maintainability / Complexity (W 10, score 71, weighted 7.10)

- **Observations**: heavy JSDoc + ADR + issue-ID annotations; duplicated logic (INDONESIA_BOUNDS in config.js:77 && data-schema.js:27; validateLatLon vs isValidCoordinate; REQUIRED_SCHOOL_FIELDS vs requiredFields; statusLabels vs formatStatus).
- **Evidence**: duplication inventory (duplicate bounding box, coordinate validators, required-field list, status map).
- **Score rationale**: −6 for duplicated constants/validators; −23 for oversized styles.js. Net 71.

### Error Handling (W 10, score 78, weighted 7.80)

- **Observations**: `IntegrationError` + `ERROR_CODES`, retry/timeout/circuit-breaker, per-record ETL rejection, fs-safe wrappers all strong. Minor: unhandled client-side rejection (`homepage.js:258` `throw` without `.catch`); `utils.js:416` empty catch (intentional).
- **Evidence**: scripts/resilience.js, scripts/fs-safe.js, scripts/etl.js:364.
- **Score rationale**: −22 for the gap cluster (client-side unhandled + intentional silent catches that obscure failures on the bulk-write path).

### Dependency Discipline (W 5, score 84, weighted 4.20)

- **Observations**: single runtime dep (`pino`); CommonJS only; eslint security rules active. `EBADENGINE` mismatch (env node 20 vs lint-staged ≥22.22.1) and npm strict-mode absent.
- **Evidence**: package.json (`"dependencies": {"pino": "^10.3.1"}`); install log.
- **Score rationale**: −16 (F012, F064).

### Determinism & Predictability (W 5, score 74, weighted 3.70)

- **Observations**: bounded/env-driven concurrency; but `lastmod` sitemap derivation is known-drifty and per-run ordering can vary.
- **Evidence**: `scripts/sitemap.js`; F032 lastmod finding.
- **Score rationale**: −26 cumulative.

**Domain A = 75.05 → 75.1 (±0.0).**

## B. SYSTEM QUALITY (RUNTIME) (71.1/100, ±0.0)

### Stability (W 20, score 74, weighted 14.80)

- **Observations**: repeatable build; resilience layer present. But the scheduled `on-pull` agent runs have long-misfired (F063 orchestrator dead ~75 days; failure observed; `actions/read` limited).
- **Evidence**: workflow run history; ../F063.
- **Score rationale**: −26 per orchestration instability + serialized global concurrency.

### Performance Efficiency (W 15, score 91, weighted 13.65)

- **Observations**: 31-76 pages/sec; budgets met; caching (WeakMap, memoized CSS, cached escape/slug).
- **Evidence**: build perf report Status PASS; `src/presenters/styles.js` memoized.
- **Score rationale**: minimal deductions (pure static generation is high-perf).

### Security Practices (W 20, score 46, weighted 9.20)

- **Observations**: repo's own `check-workflow-security.js` **exits 1 with 12 violations**: 2 CRITICAL `DUPLICATE_API_KEY` (API_KEY=GEMINI, on-push.yml:26, parallel.yml:37/282/362/416), 4 `id-token: write` non-OIDC, 4 `actions: write` non-merge, 2 `GH_TOKEN` (orchestrator.yml:33/41, architect-agent.yml:37). Plus client-side unhandled rejection and the already-referenced boundary findings (F056/F057 verbose).
- **Evidence**: workflow-security CLI output; source files; SECURITY_AUDIT_NOTE.md stale "5/5" claim.
- **Impact/Risk**: high; a failure-free local commit can still ship these regressions because `.husky/pre-commit` wraps the checker in `|| echo skipped` — the gate is dead.
- **Score rationale**: −54 (global penalty for the critical cluster + duplicate-alias secrets + dead pre-commit gate).

### Scalability Readiness (W 15, score 74, weighted 11.10)

- **Observations**: batched writes, bounded concurrency, 50k-URL sitemap splitting; data regrid boundaries apply; static-site scaling trivia.
- **Evidence**: `processInBatches`, sitemap.js splitter, config limits.
- **Score rationale**: −26 cumulative (F031, F018 STALE 18 d).

### Resilience & Fault Tolerance (W 15, score 80, weighted 12.00)

- **Observations**: retry, timeout, circuit breaker, safe-FS retry tier; per-item ETL failure isolation (F046); block-level raw fs. Errors are graceful.
- **Evidence**: scripts/resilience.js, scripts/fs-safe.js, etl.js rejection list.
- **Score rationale**: −20 (no server; resilience logic strong but bulk-path `fastWriteFile` relies on caller recovery).

### Observability (W 15, score 70, weighted 10.50)

- **Observations**: shared pino `logger.js` (JSON, levels, child loggers). But entry scripts `build-pages.js`, `data-schema.js`, `fs-safe.js`, `rate-limiter.js`, `resilience.js`, `slugify.js` are **silent** (neither logger nor console), and build-pages is the main entrypoint; no error tracking / metrics export.
- **Evidence**: logger usage map; F060 observability cluster.
- **Score rationale**: −30 (F060 held).

### Domain B = 71.10 → 71.1 (±0).

## C. EXPERIENCE QUALITY (UX / DX) (79.7/100, ±0.0)

Accessibility (W10, 92) — ARIA, skip-links, `sr-only`, semantic HTML in templates. Evidence `src/presenters/templates/*`. Rationale −8.
User Flow Clarity (W10, 88) — breadcrumbs/navigation, per-province/kabupaten nesting, search+filter; .map draft. −12 minor UX gaps.
Feedback & Error Messaging (W10, 78) — CLI meaningful; but silent build module (build-pages emits nothing) and unhandled client throw are gaps. −22.
Responsiveness (W10, 92) — mobile-first breakpoints in `styles.js`. −8.
API Clarity (DX) (W12, 86) — documented API (api.md), JSDoc; but api.md tree omits `SearchDataService.js`/`ExportService.js`; phantom `addNumbers` (F062). −14.
Local Dev Setup (DX) (W12, 82) — npm scripts clean; but `.env.example` documents 7 vars while CI injects 10+ secrets; dotenv added but not consumed; `manifest` doc mismatch (`.build-manifest.json`). −18 (F06/F012/F062).
Documentation Accuracy (W14, 44) — **F062 drift cluster held**: release.md:67 references non-existent `.github/workflows/release.yml`; api.md phantom `addNumbers`; setup.md v20-claim vs .nvmrc=22; deployment.md dist tree/schools.json mismatch.

Evidence: `docs/release.md` vs `ls .github/workflows` (no release.yml → F062), `docs/api.md`, `docs/setup.md`, `docs/deployment.md`.
**Controled by F062** but I completed **verification with high confidence**.
Debug/FA (DX) (W10, 78) — `--json` modes; pino structured. −7.
Build/Test Feedback Loop (DX) (W12, 88) — fast build; but no CI test-gate feedback. −10.

## Domain Experience = 79.68 → 79.7 (±0).

## D. DELIVERY & EVOLUTION READINESS (58.2/100, ±0.0)

### CI/CD Health (W 20, score 46, weighted 9.20)

- **Observations**: `on-push.yml` (README claims "quality gate (lint + format check)") — **false**; grep across `.github/workflows` for `npm run build|test|lint|format|pytest` returns zero matches; `on-pull.yml` / `on-push.yml` / `parallel.yml` run `opencode run` (agent) only; `parallel.yml` runs `npm install || true` (swallows failure) and `continu-on-error`/fail-fast on the specialists job.
- **Evidence**: grep result, `on-push.yml`, `on-pull.yml:44/51`, `parallel.yml:227/230/72/347`.
- **Impact/Risk**: a red marge with zero gates is the norm; regressions routinely slip silently.
- **Score rationale**: −44.

### Release & Rollback Safety (W20, score 44, weighted 8.80)

- **Observations**: no `release.yml` exists (only orchestrator/parallel/on-pull/on-push/opencode/architect), no tag-version workflow; `docs/release.md:67` documents a phantom tag→release flow; `package.json` still 1.0.0.
- **Evidence**: `docs/release.md`, `glob *.yml` absent release workflow.
- **Score rationale**: −56 for the missing deploy/release gate.

### Config & Env Parity (W15, score 73, weighted 10.95)

- **Observations**: `.env.example` lists 7 local vars; CI injects 10+ secrets not in .env.example; .vmultiple-file node version mismatch (.nvmrc=22 vs workflows node-version 20); pre-commit-config (pre-commit framework) not actually installed (requirements.txt lacks it); `setup-opencode` composite action unused/dead.
- **Evidence**: `.env.example`, workflow env blocks, `.nvmrc`, `pre-commit-config`, `.github/actions/setup-opencode/`.
- **Score rationale**: −27 (F061, F012, unreachable config).

### Migration Safety (W15, score 66, weighted 9.90)

- **Observations**: incremental build + manifest v2 (length-prefixed MD5) tracks changes/cleanup; orphan-page F045. But data stuck at old csv `2026-07-20` = stale platform.
- **Evidence**: `manifest.js`; check-freshness STALE.
- **Score rationale**: −34 (stale data migration risk).

### Technical Debt Exposure (W15, score 52, weighted 7.80)

- **Observations**: 60+ tracked findings across 27-date ledger; filter severity cluster INCLUDES a 12-issue workflow matrix HUGE audit debt (F005, F056-F059, F062, F063/F064/F065).
- **Evidence**: `docs/issues/*` ledger (100+ records).
- **Score rationale**: −48 (the security/debt cluster remains unfixed many runs).

### Change Velocity & Blast Radius (W15, score 82, weighted 12.30)

- **Observations**: atomic loop fixes; high docs throughput; but no CI gate increases blast radius of each pushed change (awaiting human review between runs).
- **Evidence**: commit log cadence (66 verification runs).
- **Score rationale**: −10 (unchanged).

### Domain D = 58.15 → 58.2 (±0).

## Composite fuzz / final

| Domain         | Weight | Score | Weighted         |
| -------------- | ------ | ----- | ---------------- |
| A (Code)       | 25%    | 75.1  | 18.775           |
| B (System)     | 25%    | 71.1  | 17.775           |
| C (Experience) | 25%    | 79.7  | 19.925           |
| D (Delivery)   | 25%    | 58.2  | 14.55            |
| COMPOSITE      |        |       | **71.03 → 71.0** |

## Findings Record (this run resolves to docs — GitHub issues blocked by F002)

Every finding list is created per contract §phase-1/output. Because `gh issue
create` is blocked (403 `createIssue`, F002 held 64 sessions), findings ship as
**labeled docs records** under `docs/issues/2026-08-07/` (repo convention),
each body carrying: evaluation date, domain table, criteria-level breakdown,
evidence per criterion, and file(s) affected.

Issue-labels selected (existing GitHub labels):

- F002 (`ci` / `P1`) — Token lacks `issues:write` on the scheduled loop path.
- F005 (`docs` / `P3`) — Prettier drift, 64 files, infra-only.
- F024 (`bug` / `P2`) — Build omits `sitemap-index.xml`.
- Workflow-security cluster F056-F059 + CRITs F037/F038 (`security` / `P1`).
- F065 (`ci` / `P2`) — Continue-on-error swallows CI failures.
- F064 (`ci` / `P2`) — Dependabot red-merge + node-engine mismatch.
- F061/F062 (`chore` / `P2`, `docs` / `P3`) — .env/doc drift.

## Decision summary — why Phase 1 ran

Phase 0 found **0 open PRs and 0 open issues** (verified via `gh pr list` /
`gh issue list`), stepping 0.1→0.3 (empty-box) → **Phase 1 (AUDIT, read-only)**.
No PR-handling and no issue-manager mode was required.

## Action log

| Time (UTC)        | Action                         | Target                                                     | Result                           |
| ----------------- | ------------------------------ | ---------------------------------------------------------- | -------------------------------- |
| 2026-08-07 ~16:44 | Phase-0 gate                   | gh.open: pr/issues                                         | 0 PR / 0 issues → Phase 1        |
| ~16:45            | install deps                   | `npm install`, `pip -r requirements`                       | 131 pkgs + pytest 9.1.1          |
| ~16:46            | command matrix                 | lint/format/build/test/coverage/sitemap/validate/freshness | see table                        |
| ~16:47            | security gate                  | `scripts/check-workflow-security.js`                       | exit 1, 12 violations            |
| ~16:48            | issue-capability probe         | `gh issue create`                                          | 403 createIssue (F002 confirmed) |
| ~16:44-16:50      | 4 parallel `explore` subagents | source map / CI / tests+security / docs                    | all returned evidence            |
| ~16:51            | record audit + findings        | `docs/issues/2026-08-07/37-*.md`                           | this file                        |

## Final State

- **Active phase**: Phase 1 (Diagnostic & Comprehensive Scoring) — completed.
- **Decision summary**: Empty-repo state → audit-only read; no destructive action; no new GitHub issue/PR opened due to F002.
- **Final status**: **waiting for human review** — the Phase 2 (hardening/repair) or Phase 3 (strategy) next step requires a token with `issues:write` + `workflows:write` to unblock the pipeline and meaningful change-velocity; meanwhile the sole concrete remediation (a `ci.yml` on `npm test`-gate + removal of the 12 workflow-security violations) is deferred to review.
- **Blocked**: GitHub-issue output (F002 persistent 403), and therefore any PR that opens a linked issue path, is blocked until the loop token gains `issues:write` (contract §FAIL-SAFE adhered — no guessing).

## Notes on scoring movement

1. **Flat confirm (71.0, ±0)** for the 2nd consecutive run — zero code churn, zero new findings.
2. **F033 is still over the fence**: the virtual CI surface is unstable as-is; every fix must first pass the blocked-by-F077 token-gate review.
3. No oracle/momus delegation was needed (pure command-matrix + forensics); evidence is firsthand.
