# Issue Records — 210th Batch Delta (250th run, 2026-08-18)

**Ledger**: 210th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (250th) + Phase 2 docs fix (F239 completion).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (52nd)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (250th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (52nd)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 249th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **145 files** (98th obs): 144 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 1st clean obs); ledger-only drift by convention |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:56-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **151st obs**, push-blocked F050 (27th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **5/5 failed — ~62 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause FIXED) | stale-page accumulation — F232 fix verified holding (4th obs); residual surface (school deletion/move) held |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (27th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **20 consecutive completed successes visible (7 + 1 in-progress)**; no NEW failure (streak 19→20) |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); lint-staged EBADENGINE (node ≥22.22.1) surfaced at install |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci || true` fail-open (parallel.yml:72,347) — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:294-304, SECURITY.md:46-50, deployment.md:62-66 accurate at HEAD — **12th clean obs** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (15th obs); on-pull.yml:63 unhardened install |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (**14th clean obs**) |
| F231    | bug      | P2       | **FIXED (verified 4th obs)** | monitorBuild report generated after stop() — returned metrics real |
| F232    | bug      | P1       | **FIXED (verified 4th obs)** | computeSchoolHash includes lat/lon — incremental rebuild on coordinate-only change |
| F234    | security | P1       | **FIXED (verified 4th obs)** | validateExternalDataDir rejects shell metacharacters + path traversal before git clone interpolation |
| F233    | bug      | P2       | HELD (partial) | cause-preservation in `IntegrationError.details.cause` verified holding; full rethrow-of-non-transient decision deferred |
| F236    | refactor | P2       | HELD   | three divergent data-quality implementations |
| F237    | refactor | P3       | HELD   | generate*Pages duplication |
| F239    | docs     | P2       | **FIXED (verified 1st obs)** | **all 41 tree-listed modules now have api.md sections** — `test-helpers.js` + `comparison.js` documented this run (precise gap scan: 2 modules, the 248th/249th "8 modules" figure was stale post-realignment) |
| F240    | docs     | P2       | HELD   | husky `"prepare"` wiring absent; two competing hook systems |
| F245    | refactor | P2       | HELD   | ~700 lines of ES5 inline client JS invisible to the linter |
| F251    | test     | P3       | **FIXED (verified 1st clean obs)** | `scripts/data-schema.test.js` prettier-clean at HEAD — zero-source-drift invariant restored |
| F252    | security | P2       | HELD   | unpinned mutable action tags + unpinned `curl|bash` installer across all 6 workflows (+ setup-opencode composite) |
| F253    | security | P2       | HELD   | agent self-approval merge (`gh pr merge --admin`) + validator blind spots (repository-projects: write, --admin/auto-merge) |

## NEW findings this run (250th)

None. Read-only verification run — the only delta was the F239 gap-count correction (2 modules, not 8) which was resolved in Phase 2. All other probes held at 249th levels.

## Deferred/blocked (recorded, not this run)

| Finding | Category | Priority | Rationale |
| ------- | -------- | -------- | --------- |
| F229/F063/F037/F038/F227/F252/F253 | ci/security | P1/P2 | workflow hardening requires `workflows: write` — token lacks it (F050, 27th documented pass) |
| F233 (full fix) | bug      | P2 | rethrow-of-non-transient semantics still needs caller audit; cause-preservation landed as the backward-compatible step |
| F236 | refactor | P2 | three divergent data-quality implementations — consolidation needs a design decision on the single source of truth |
| F237 | refactor | P3 | generate*Pages duplication — consolidation is a larger refactor with page-output regression risk |
| F240 | docs     | P2 | husky `"prepare"` wiring belongs with the husky-rework decision (two competing hook systems) — recorded, deferred |
| F245 | refactor | P2 | ~700 lines of ES5 inline client JS — conversion to lint-visible modules is a large, risky change |
| F018 | data     | P2 | requires external API credentials (IFLOW/GEMINI) not available to this token — out of scope |
| F064 | config   | P3 | correct fix (upgrade CI to node 22) is a workflow change — F050-blocked; downgrading `.nvmrc` would codify an EOL version |
| F005 | docs     | P3 | ledger files exempt by convention (98th obs) — no action; zero source files confirmed (F251 verified holding) |

## Suggested resolutions (ranked)

1. **F037/F038/F229/F063/F227/F252/F253 (P1/P2)**: workflow hardening — requires a `workflows`-enabled token (F050). Highest-leverage delivery blocker.
2. **F233 (full, P2)**: audit callers of `retry()`; rethrow non-transient errors directly where no caller relies on the wrapper.
3. **F240 (P2)**: decide the hook strategy (.husky vs .pre-commit-config.yaml), then wire `"prepare": "husky"`.
4. **F236/F237 (P2/P3)**: consolidation refactors with full-suite regression verification.
5. **F245 (P2)**: extract inline client scripts to lint-covered modules.
6. **F018 (P2)**: ETL run with external credentials.
7. **F064 (P3)**: upgrade CI to node 22 (workflow change, F050-blocked).

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 52nd consecutive). Following the established repo pattern, this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.
