# Issue Records — 199th Batch Delta (239th run, 2026-08-17)

**Ledger**: 199th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (239th).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (42nd)** — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (239th basis)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (42nd)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 238th basis (git diff `2699807..HEAD` empty), **zero growth** |
| F005    | docs     | P3       | HELD   | **113 files** (87th obs): 112 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** (F230 fix held) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process |
| F014    | test     | P1       | NOT OBSERVED | 2/2 test runs clean (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 28 days (threshold 7) |
| F019    | refactor | P3       | RESOLVED maintained | tests/run_tests.py single import block verified at HEAD (PR #797 fix held) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" (BuildPerformanceTracker) |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **140th obs**, push-blocked F050 (17th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow 5/5 failed — **57 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (17th push-block pass) |
| F063    | ci       | P1       | HELD   | on-pull: 1 failure in 8-run window (16:18Z curl-429 flake, documented); **no NEW failure since 16:18Z**; 5 successes after |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI node 20 (Node 20 EOL) |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open |
| F228    | docs     | P3       | **RESOLVED** | README.md:298-301, SECURITY.md:48, deployment.md:64 all corrected at HEAD — **fix verified at source (2nd clean obs), PR #798** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (4th obs); on-pull.yml:63 unhardened install; 16:18Z log confirms curl 429 |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (3rd clean obs) |

## New findings detail

**None this window.** F228 transitioned HELD→RESOLVED (fix from 238th Phase 2, PR #798, verified corrected at source — 2nd clean obs). F230 maintained RESOLVED (3rd obs). F063 window static (no new failure since 16:18Z, 5 successes). F004 zero growth (byte-identical workflows). F026/F017/F028/F019 maintained RESOLVED.

## Suggested resolutions (ranked)

1. **F228 (P3)**: **DONE** — resolved via PR #798, verified corrected at source this run (2nd clean obs).
2. **F229/F063/F037/F038 (P1, BLOCKED)**: workflow hardening (pipefail/retry install, trigger gating, secret scoping, `--admin` removal) requires `workflows: write` — token lacks it (F050, 17th documented pass). Record and hold; deliverable only with a workflows-enabled token.
3. **F018 (P2)**: data 28d stale — requires ETL run with external API credentials; out of scope for this run's token.
4. **F064 (P3)**: `.nvmrc` 22 vs CI/devcontainer node 20 — the correct fix (aligning CI to node 22) is a workflow change, F050-blocked; aligning `.nvmrc` down to 20 would codify an EOL version. Hold.

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 42nd consecutive). Following the established repo pattern (222nd-record convention), this run records findings as labeled docs records under `docs/issues/2026-08-17/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.