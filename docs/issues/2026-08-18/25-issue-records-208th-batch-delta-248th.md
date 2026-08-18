# Issue Records — 208th Batch Delta (248th run, 2026-08-18)

**Ledger**: 208th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (248th) + Phase 2 fix delivery.

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (50th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (248th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (50th)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 247th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **140 files** (96th obs): 139 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F014    | test     | P1       | NOT OBSERVED | single test run clean this window (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F019    | refactor | P3       | RESOLVED maintained | tests/run_tests.py single import block verified at HEAD |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **149th obs**, push-blocked F050 (26th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **5/5 failed — ~62 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause FIXED) | stale-page accumulation — **F232 fix (247th) verified holding** (manifest hash includes lat/lon); residual F045 surface (school deletion/move) still held |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row (manifest corrupt JSON path is a related instance) |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (26th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **18 consecutive completed successes visible + 1 in-progress; no NEW failure** (streak 17→18) |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); **lint-staged EBADENGINE (node ≥22.22.1)** surfaced at install |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:294-304, SECURITY.md:46-50, deployment.md:62-66 accurate at HEAD — **10th clean obs** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (13th obs); on-pull.yml:63 unhardened install |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (**12th clean obs**) |
| F231    | bug      | P2       | **FIXED (verified 2nd obs)** | monitorBuild report generated after stop() — returned metrics real; new regression test asserts elapsedMs > 0 |
| F232    | bug      | P1       | **FIXED (verified 2nd obs)** | computeSchoolHash includes lat/lon — incremental rebuild on coordinate-only change |
| F234    | security | P1       | **FIXED (verified 2nd obs)** | validateExternalDataDir rejects shell metacharacters + path traversal before git clone interpolation |

## FIXED this run (248th Phase 2 — see 26-phase2-3-decision-248th for test-first verification)

| Finding | Category | Priority | File(s) | Summary |
| ------- | -------- | -------- | ------- | ------- |
| **F233** | bug      | P2       | src/core/resilience.js | retry() now preserves the original error in `IntegrationError.details.cause` — backward-compatible (callers pattern-matching IntegrationError unchanged); non-transient failure identity no longer lost |
| **F235** | bug      | P2       | scripts/validate-links.js | isRelativeLink now treats non-hierarchical schemes (mailto:/tel:/javascript:/data:/ftp:) and protocol-relative (`//host`) URLs as non-relative — false broken-link reports eliminated |
| **F238** | test     | P2       | scripts/interactive.js | main() gated on `require.main === module` — no CLI side effect at require time; +regression test |
| **F246** | bug      | P3       | src/presenters/templates/shared/footer.js | footer year injectable via `options.year` (defaults to current year) — deterministic builds/tests; module-load constant removed |
| **F247** | bug      | P3       | src/presenters/templates/homepage.js | search-result fallback `'/provinsi/' + school.provinceSlug + '/'` (always `/provinsi/undefined/`) replaced with deterministic client-side `provinceUrlFallback(school)` mirroring server slugify; +4 vm-extraction tests |
| **F248** | bug      | P3       | src/core/utils.js | hasCoordinateData rejects non-numeric garbage (`'abc'`, `'12abc'`, `'NaN'`) via strict full-string numeric match; +5 test cases |
| **F249** | bug      | P3       | src/core/resilience.js | CircuitBreaker.reset() emits stateChange `{from: previousState, to: 'CLOSED'}` — truthful payload (was always from:'CLOSED'); +2 tests |
| **F250** | bug      | P3       | src/core/data-schema.js | isValidCoordinate uses strict full-string numeric match (`'12abc'` rejected); duplicate legacy npsn check removed (pattern check reports once); +4 test cases |

## FIXED this run (docs cluster)

| Finding | Category | Priority | File(s) | Summary |
| ------- | -------- | -------- | ------- | ------- |
| **F239** | docs     | P2       | docs/api.md | Module tree realigned with the TASK-094 `src/core/` move (8 infrastructure modules relocated out of scripts/ listing; src/core/ section added); editor placeholder "(unchanged from previous - see below)" removed from findCsvFiles section. Remaining: 8 tree-listed modules still lack dedicated doc sections (held, docs debt) |
| **F241** | docs     | P3       | CHANGELOG.md | Added [Unreleased] section covering TASK-094/100/101, FEAT-005 comparison, and the F231–F250 fix cluster (verifiable commits only) |
| **F242** | docs     | P2       | docs/release.md | §4 now notes `.github/workflows/release.yml` is not present (template intent, matching deployment.md convention) — no longer documents phantom automation as fact |
| **F243** | docs     | P3       | docs/roadmap.md | FEAT-005 Comparison Tool marked IMPLEMENTED (verified: COMPARISON_MAX=3, side-by-side table, 13 tests in comparison.test.js); "share" sub-feature left unclaimed (not implemented) |
| **F244** | docs     | P2       | README.md | "Semua workflow tervalidasi" corrected to "diperiksa" + note that 12 violations remain at baseline (links SECURITY_AUDIT_NOTE.md) |

## Deferred/blocked (recorded, not this run)

| Finding | Category | Priority | Rationale |
| ------- | -------- | -------- | --------- |
| F229/F063/F037/F038/F227 | ci/security | P1 | workflow hardening requires `workflows: write` — token lacks it (F050, 26th documented pass) |
| F233 (full fix) | bug      | P2 | rethrow-of-non-transient semantics still needs caller audit; cause-preservation landed as the backward-compatible step |
| F236 | refactor | P2 | three divergent data-quality implementations — consolidation needs a design decision on the single source of truth |
| F237 | refactor | P3 | generate*Pages duplication — consolidation is a larger refactor with page-output regression risk |
| F239 (remaining) | docs     | P2 | 8 tree-listed modules without doc sections (data-quality, freshness-report, enrichment, interactive, manifest, check-workflow-security, build-performance, comparison) — focused docs PR per module |
| F240 | docs     | P2 | husky `"prepare"` wiring belongs with the husky-rework decision (two competing hook systems) — recorded, deferred |
| F245 | refactor | P2 | ~700 lines of ES5 inline client JS — conversion to lint-visible modules is a large, risky change |
| F018 | data     | P2 | requires external API credentials (IFLOW/GEMINI) not available to this token — out of scope |
| F064 | config   | P3 | correct fix (upgrade CI to node 22) is a workflow change — F050-blocked; downgrading `.nvmrc` would codify an EOL version |
| F005 | docs     | P3 | ledger files exempt by convention (96th obs) — no action |

## Suggested resolutions (ranked)

1. **F037/F038/F229/F063/F227 (P1)**: workflow hardening — requires a `workflows`-enabled token (F050). Highest-leverage delivery blocker.
2. **F233 (full, P2)**: audit callers of `retry()`; rethrow non-transient errors directly where no caller relies on the wrapper.
3. **F239 (remaining, P2)**: author the 8 missing api.md module sections.
4. **F240 (P2)**: decide the hook strategy (.husky vs .pre-commit-config.yaml), then wire `"prepare": "husky"`.
5. **F236/F237 (P2/P3)**: consolidation refactors with full-suite regression verification.
6. **F245 (P2)**: extract inline client scripts to lint-covered modules.
7. **F018 (P2)**: ETL run with external credentials.
8. **F064 (P3)**: upgrade CI to node 22 (workflow change, F050-blocked).

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 50th consecutive). Following the established repo pattern, this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.