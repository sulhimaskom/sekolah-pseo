# Issue Records — 213th Batch Delta (253rd run, 2026-08-18)

**Ledger**: 213th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (253rd, read-only flat verification).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (55th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (253rd basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (55th)** (re-probed direct this run) |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only: 2+12+13+1+3+26) — byte-identical to 252nd basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **154 files** (101st obs): 153 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 4th clean obs); ledger-only drift by convention |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:57); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **154th obs**, push-blocked F050 (30th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **8/8 failed — ~63 days** (6/6 → 8/8 this run) |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause FIXED) | stale-page accumulation — F232 fix verified holding (7th obs); residual surface (school deletion/move) held |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (30th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **≥23 consecutive completed successes** (9 visible + 1 in-progress 22:14Z); no NEW failure |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); lint-staged EBADENGINE (node ≥22.22.1) surfaced at install; **pytest availability flip-flops across runner envs (available 252nd / unavailable 253rd, run 4)** |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges, BuildOrchestrator.js:52-55) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci || true` fail-open (parallel.yml:72,347) — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:294-304, SECURITY.md:46-50, deployment.md:62-66 accurate at HEAD — **15th clean obs** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (18th obs); on-pull.yml:63 unhardened install |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (**17th clean obs**) |
| F231    | bug      | P2       | **FIXED (verified 7th obs)** | monitorBuild report generated after stop() — returned metrics real (build-performance.js:344,374) |
| F232    | bug      | P1       | **FIXED (verified 7th obs)** | computeSchoolHash includes lat/lon — incremental rebuild on coordinate-only change (manifest.js:121+) |
| F233    | bug      | P2       | HELD (partial) | cause-preservation in `IntegrationError.details` verified holding (resilience.js:17-30); full rethrow-of-non-transient decision deferred |
| F234    | security | P1       | **FIXED (verified 7th obs)** | validateExternalDataDir rejects shell metacharacters + path traversal before git clone interpolation (fetch-data.js:189,249) |
| F236    | refactor | P2       | HELD   | three divergent data-quality implementations |
| F237    | refactor | P3       | HELD   | generate*Pages duplication — 10 refs each in scripts/build-pages.js + src/services/PageBuilder.js |
| F239    | docs     | P2       | **FIXED (verified 3rd maintained obs)** | **all 41 tree-listed modules have api.md sections** — Comparison (api.md:3888) + Test Helpers (api.md:6627) sections present at HEAD |
| F240    | docs     | P2       | HELD   | husky `"prepare"` wiring absent; two competing hook systems |
| F242    | release  | P3       | HELD   | release.md documents SemVer process; no release automation (F011 0 tags corroborates) |
| F245    | refactor | P2       | HELD   | **121 ES5 `var` occurrences in inline client JS** (templates 87 + shared 34; homepage.js:242-727 `<script>` block, 80 `var`) invisible to the linter — count method documented (see audit §F245 note) |
| F251    | test     | P3       | **FIXED (verified 4th clean obs)** | `scripts/data-schema.test.js` prettier-clean at HEAD — zero-source-drift invariant held |
| F252    | security | P2       | HELD   | unpinned mutable action tags (`actions/checkout@v7`, `actions/cache@v6`, `actions/setup-node@v7`, `softprops/turnstyle@v3`) + unpinned `curl|bash` installer across all 6 workflows (+ setup-opencode composite) |
| F253    | security | P2       | HELD   | agent self-approval merge (`gh pr merge --admin` opencode.yml:174, on-pull.yml:193) + validator blind spots (repository-projects: write, --admin/auto-merge) |

## NEW findings this run (253rd)

None. Read-only flat verification run — every probe held at 252nd levels. Only deltas: (1) pytest availability flip-flop back to unavailable (env-parity run 4 — F064-adjacent, noted in audit report §Environment parity note), (2) ledger prettier count 151 → 154 (3 new ledger files from the 252nd run itself; zero source), (3) F063 completed-success streak 22 → ≥23, (4) F038 failure window 6/6 → 8/8 (same root cause, no new evidence beyond additional failed runs), (5) F245 count method reconciled (121 counted this run vs 154 in 252nd ledger — shared count matches at 34; template method variance documented).

## Deferred/blocked (recorded, not this run)

| Finding | Category | Priority | Rationale |
| ------- | -------- | -------- | --------- |
| F229/F063/F037/F038/F227/F252/F253 | ci/security | P1/P2 | workflow hardening requires `workflows: write` — token lacks it (F050, 30th documented pass) |
| F233 (full fix) | bug      | P2 | rethrow-of-non-transient semantics still needs caller audit; cause-preservation landed as the backward-compatible step |
| F236 | refactor | P2 | three divergent data-quality implementations — consolidation needs a design decision on the single source of truth |
| F237 | refactor | P3 | generate*Pages duplication — consolidation is a larger refactor with page-output regression risk |
| F240 | docs     | P2 | husky `"prepare"` wiring belongs with the husky-rework decision (two competing hook systems) — recorded, deferred |
| F245 | refactor | P2 | ~120+ lines of ES5 inline client JS (121 `var` sites) — conversion to lint-visible modules is a large, risky change |
| F018 | data     | P2 | requires external API credentials (IFLOW/GEMINI) not available to this token — out of scope |
| F064 | config   | P3 | correct fix (upgrade CI to node 22) is a workflow change — F050-blocked; downgrading `.nvmrc` would codify an EOL version |
| F005 | docs     | P3 | ledger files exempt by convention (101st obs) — no action; zero source files confirmed (F251 verified holding) |

## Suggested resolutions (ranked)

1. **F037/F038/F229/F063/F227/F252/F253 (P1/P2)**: workflow hardening — requires a `workflows`-enabled token (F050). Highest-leverage delivery blocker.
2. **F233 (full, P2)**: audit callers of `retry()`; rethrow non-transient errors directly where no caller relies on the wrapper.
3. **F240 (P2)**: decide the hook strategy (.husky vs .pre-commit-config.yaml), then wire `"prepare": "husky"`.
4. **F236/F237 (P2/P3)**: consolidation refactors with full-suite regression verification.
5. **F245 (P2)**: extract inline client scripts to lint-covered modules.
6. **F018 (P2)**: ETL run with external credentials.
7. **F064 (P3)**: upgrade CI to node 22 (workflow change, F050-blocked).

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 55th consecutive, re-probed this run). Following the established repo pattern, this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.