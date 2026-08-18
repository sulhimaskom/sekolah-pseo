# Issue Records — 207th Batch Delta (247th run, 2026-08-18)

**Ledger**: 207th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (247th) with deep parallel source audit (4 explore subagents).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (49th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (247th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (49th)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 246th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **137 files** (95th obs): 136 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** (F230 fix held; +3 = 246th run records) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 extends: phantom release.yml documented) |
| F014    | test     | P1       | NOT OBSERVED | single test run clean this window (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F019    | refactor | P3       | RESOLVED maintained | tests/run_tests.py single import block verified at HEAD (PR #797 fix held) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" (BuildPerformanceTracker) |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **148th obs**, push-blocked F050 (25th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **5/5 failed — ~61 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause extended) | stale-page accumulation — **F232 (NEW) identifies a concrete root cause**: manifest hash excludes lat/lon that the template renders |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row (manifest corrupt JSON path is a related instance) |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (25th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **17 consecutive completed successes + this-window in-progress; no NEW failure** (streak extended 16→17) |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); **lint-staged EBADENGINE (node ≥22.22.1)** surfaced at install this run |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:294-304, SECURITY.md:46-50, deployment.md:62-66 accurate at HEAD — **9th clean obs, PR #798 fix held** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (12th obs); on-pull.yml:63 unhardened install (no pipefail/retry) |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (11th clean obs) |

## NEW findings this window (deep parallel source audit — F231–F250)

| Finding | Category | Priority | File(s) | Summary |
| ------- | -------- | -------- | ------- | ------- |
| **F231** | bug      | P2       | scripts/build-performance.js:354-359 | monitorBuild generates the returned report BEFORE `tracker.stop()` (finally block) → returned `report.metrics` is zeroed (elapsedMs 0, throughput 0, memoryDelta '0 B', peakRss '0 B'). Logged report is correct; returned report is garbage. Existing tests assert key existence only — bug untested. **FIXED in Phase 2 this run** |
| **F232** | bug      | P1       | scripts/manifest.js:121-143, src/presenters/templates/school-page.js:117-118 | computeSchoolHash excludes lat/lon with comment "not displayed in school page template" — but school-page.js comparisonData embeds lat/lon in every page. Changing only coordinates in the CSV → incremental build skips rebuild → stale page served. Concrete root cause for F045. **FIXED in Phase 2 this run** |
| **F233** | bug      | P2       | src/core/resilience.js:227-277 | retry() wraps every failure in IntegrationError RETRY_EXHAUSTED — non-transient errors (TypeError etc.) lose original identity; programming bugs surface as "integration failures", misleading callers and masking root cause |
| **F234** | security | P1       | scripts/fetch-data.js:38-39, 221 | EXTERNAL_DATA_DIR read from env and interpolated unvalidated into `git clone --depth 1 ${url} ${EXTERNAL_DATA_DIR}` (execSync string). Repo URL and branch are validated (validateRepoUrl/validateBranchName); destination dir is not → shell-metacharacter env value = command-injection vector. **FIXED in Phase 2 this run** |
| **F235** | bug      | P2       | scripts/validate-links.js | isRelativeLink treats mailto:/tel:/javascript:/data:/protocol-relative (`//host/path`) links as relative → path.join + stat → false "broken link" reports. No tests cover these schemes |
| **F236** | refactor | P2       | scripts/check-freshness.js, scripts/data-quality.js, scripts/etl.js | Three divergent data-quality implementations (getDataQualityMetrics / analyzeQuality / generateDataQualityReport) with different definitions of quality metrics (coordinates/zero/missing classification differs) — single source of truth missing |
| **F237** | refactor | P3       | src/services/BuildOrchestrator.js | generateProvincePages / generateKabupatenPages / generateKecamatanPages near-identical (~60 lines each, same group→mkdir→processInBatches→count shape) |
| **F238** | test     | P2       | scripts/interactive.js:345 | main() invoked at module load (before module.exports) — side effect at require time; any importer triggers CLI logic; hard-to-test seam |
| **F239** | docs     | P2       | docs/api.md:9-31, 5177 | Module tree stale (scripts/config.js etc. vs actual src/core/ — TASK-094 move not reflected); leftover editor placeholder "(unchanged from previous - see below)" at line 5177; 8 modules listed in tree but never documented (data-quality, freshness-report, enrichment, interactive, manifest, check-workflow-security, build-performance, comparison) |
| **F240** | docs     | P2       | CONTRIBUTING.md, package.json, .husky/pre-commit | Documented pre-commit hooks not wired: no `"prepare": "husky"` script in package.json; `.git/hooks/` contains only `.sample` files; two competing hook systems (.husky/pre-commit vs .pre-commit-config.yaml); contributors following CONTRIBUTING get no gating after `npm install` |
| **F241** | docs     | P3       | CHANGELOG.md | Single 1.0.0 entry (2026-05-31); ~250 commits, TASK-094..103, src/core refactor, security hardening undocumented despite "All notable changes will be documented" |
| **F242** | docs     | P2       | docs/release.md:67 | Documents `.github/workflows/release.yml` (v* tag trigger) which does NOT exist; 0 tags exist — documented release automation is phantom (extends F011) |
| **F243** | docs     | P3       | docs/roadmap.md | FEAT-005 Comparison Tool marked "(deferred)" but comparison.js is implemented, shipped in templates, and tested — roadmap contradicts code |
| **F244** | docs     | P2       | README.md:294-304 | "Semua workflow tervalidasi terhadap aturan keamanan" is misleading — 12 violations (2 CRITICAL) are held at pre-commit fail-open baseline 12 (F037) |
| **F245** | refactor | P2       | src/presenters/templates/homepage.js:242-719, school-page.js, comparison.js, back-to-top.js | ~700 lines of inline client JS inside template literals use ES5 `var` style while eslint bans `var` — embedded scripts are invisible to the linter (no-var, no-unused-vars not enforced); dead code escapeHtml at homepage.js:335-339 undetected |
| **F246** | bug      | P3       | src/presenters/templates/footer.js:18, scripts/freshness-report.js, scripts/check-freshness.js | footer.js `new Date().getFullYear()` at module load (all pages change Jan 1); freshness-report uses locale-dependent toLocaleDateString('en-US') + generatedAt timestamp → non-reproducible output; check-freshness daysAgo timezone-dependent (UTC-midnight date parse vs local now) |
| **F247** | bug      | P3       | src/presenters/templates/homepage.js:384 | `school.u \|\| '/provinsi/' + school.provinceSlug + '/'` — provinceSlug is never set anywhere → fallback always yields `/provinsi/undefined/` |
| **F248** | bug      | P3       | src/core/utils.js:203-209 | hasCoordinateData returns true for garbage strings: parseFloat('abc') → NaN, NaN !== 0 → not zero → returns true; only '0'/empty handled |
| **F249** | bug      | P3       | src/core/resilience.js:413-419 | CircuitBreaker.reset() emits stateChange `{from: 'CLOSED', to: 'CLOSED'}` — state already set CLOSED before emit; misleading event payload |
| **F250** | bug      | P3       | src/core/data-schema.js | isValidCoordinate uses parseFloat partial match — '12abc' → 12 → passes validation; npsn validated twice (pattern check + legacy check) producing duplicate error messages |

## New findings detail

**Context**: runs 241st–246th re-verified the tracked ledger with shallow probes and reported zero new findings. This run dispatched **4 parallel explore subagents** (src/ 38 files, scripts/ 14 files, CI/security surfaces, docs) which read every source file, workflow, and doc — surfacing **20 new findings (F231–F250)** with line-level evidence. All 20 are source-verified by the subagent reports and spot-checked by the orchestrator (F231/F232/F234 re-verified directly at source before Phase 2 fixes).

**Fixes applied in Phase 2 this run** (see 23-phase2-3-decision-247th): F231 (monitorBuild report ordering), F232 (manifest hash adds lat/lon), F234 (EXTERNAL_DATA_DIR validation) — all with failing-test-first and full-suite verification.

**Annotations carried**:
- (F227) validator `check-workflow-security.js` exits **1** on violations (source-verified `return 1` at lines 214/238, `process.exit(run())` at 251) — confirmed again this run (EXIT_CODE=1 with 12 violations). Practical impact unchanged: F227 remains HELD because **no CI step invokes the validator** (grep of `.github/workflows/*.yml` for `check-workflow-security` → no matches).
- (F245) eslint flat config bans `var` (no-var: error) but template-literal-embedded client scripts are strings — the linter never sees them. Verified: eslint clean (0/0) while homepage.js client script uses `var` ~60×.

## Suggested resolutions (ranked)

1. **F232 (P1, FIXED this run)**: manifest hash now includes lat/lon — one-time full rebuild on next incremental; verify in next run's F045 probe.
2. **F234 (P1, FIXED this run)**: EXTERNAL_DATA_DIR validated against shell metacharacters; documented in .env.example gap (F234-adjacent) remains open for the PERF_* vars.
3. **F231 (P2, FIXED this run)**: monitorBuild report now generated after stop().
4. **F233 (P2)**: retry() should rethrow non-transient errors directly (or preserve original error in `cause`) — semantics change; needs a decision on callers that pattern-match IntegrationError.
5. **F239/F240/F242 (P2, docs)**: api.md tree realignment + placeholder removal; husky `"prepare"` script or CONTRIBUTING rewrite; release.md alignment with reality (or implement release.yml).
6. **F229/F063/F037/F038 (P1, BLOCKED)**: workflow hardening requires `workflows: write` — token lacks it (F050, 25th documented pass). Record and hold; deliverable only with a workflows-enabled token.
7. **F018 (P2)**: data 29d stale — requires ETL run with external API credentials; out of scope for this run's token.
8. **F064 (P3)**: `.nvmrc` 22 vs CI/devcontainer node 20 — correct fix (upgrade CI to node 22) is a workflow change, F050-blocked; downgrading `.nvmrc` would codify an EOL version. Hold.
9. **F005 (P3)**: ledger files exempt by convention (95th obs) — no action.

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 49th consecutive). Following the established repo pattern (222nd-record convention), this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.