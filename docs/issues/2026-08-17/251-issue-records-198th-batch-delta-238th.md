# Issue Records — 198th Batch Delta (238th run, 2026-08-17)

**Ledger**: 198th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (238th).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (41st)** — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (238th basis)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (41st)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only; 59 incl. template.md) — byte-identical to 237th basis (git diff empty), **zero growth**, method-verified at both `96d3e3a` and `2699807` |
| F005    | docs     | P3       | HELD   | **110 files** (86th obs): 109 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** (F230 fix held) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process |
| F014    | test     | P1       | NOT OBSERVED | 2/2 test runs clean (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 28 days (threshold 7) |
| F019    | refactor | P3       | **RESOLVED** | tests/run_tests.py duplicate imports removed — single import block (lines 12–19) verified at HEAD; fix landed via PR #797 |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" (BuildPerformanceTracker) |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **139th obs**, push-blocked F050 (16th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow 8/8 failed — **56 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (16th push-block pass) |
| F063    | ci       | P1       | HELD   | on-pull: 3 failures in last 12 (12:28Z/15:17Z/16:18Z — all curl-429 install flakes); **no NEW failure since 16:18Z**; 4 successes after |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI node 20 (Node 20 EOL) |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open |
| F228    | docs     | P3       | HELD   | README/SECURITY.md/deployment.md claims false — **Phase 2 fix THIS run** (safe, unblocked) |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (3rd obs); on-pull.yml:63 unhardened install; 16:18Z log confirms curl 429 |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (2nd clean obs) |

## New findings detail

**None this window.** F019 transitioned HELD→RESOLVED (fix verified at source via PR #797). F230 maintained RESOLVED (2nd obs). F063 window static (no new failure since 16:18Z, 4 successes). F004 zero growth (byte-identical workflows). F026/F017/F028 maintained RESOLVED.

## Suggested resolutions (ranked)

1. **F228 (P3, Phase 2 THIS run)**: docs-drift correction — README.md:298-301 (false quality-gate claims: on-push.yml has no lint/format steps, on-pull.yml has no build/test steps — grep-verified), SECURITY.md:48 (false "npm audit integration in CI pipeline" claim — no npm audit step in any workflow), deployment.md:64 (references non-existent `.github/workflows/deploy.yml`). **Docs files only — NOT blocked by F050** (workflow permission applies to `.github/workflows/` only; PRs #794–#797 prove docs delivery works). Atomic, verifiable (prettier + build unaffected).
2. **F229/F063/F037/F038 (P1, BLOCKED)**: workflow hardening (pipefail/retry install, trigger gating, secret scoping, `--admin` removal) requires `workflows: write` — token lacks it (F050, 16th documented pass). Record and hold; deliverable only with a workflows-enabled token.
3. **F018 (P2)**: data 28d stale — requires ETL run with external API credentials; out of scope for this run's token.
4. **F019 (P3)**: DONE — resolved via PR #797, verified at source this run.

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 41st consecutive). Following the established repo pattern (222nd-record convention), this run records findings as labeled docs records under `docs/issues/2026-08-17/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.