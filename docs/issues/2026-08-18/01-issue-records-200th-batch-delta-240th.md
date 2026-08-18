# Issue Records — 200th Batch Delta (240th run, 2026-08-18)

**Ledger**: 200th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (240th).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (43rd)** — token lacks `issues: write`. GitHub-native issue creation remains blocked (held since 222nd record). All findings recorded here in the ledger, the established output channel.

## Finding status table (240th basis)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (43rd)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 239th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **116 files** (88th obs): 115 ledger + SECURITY_AUDIT_NOTE.md — **ledger-only, zero source/active-doc drift** (F230 fix held; +3 = 239th run records) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process |
| F014    | test     | P1       | NOT OBSERVED | 2/2 test runs clean (parallel DIST_DIR race) |
| F017    | docs     | P3       | RESOLVED maintained | 0 `addNumbers` refs in api.md |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F019    | refactor | P3       | RESOLVED maintained | tests/run_tests.py single import block verified at HEAD (PR #797 fix held) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com`; live site root 404 while Pages "built" |
| F026    | bug      | P3       | RESOLVED maintained | formatBytes NaN→"NaN", Infinity→"Infinity", 1024→"1.00 KB" (BuildPerformanceTracker) |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **141st obs**, push-blocked F050 (18th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **6/6 failed — 58 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (18th push-block pass) |
| F063    | ci       | P1       | HELD   | on-pull: **7 consecutive successes since 16:18Z curl-429 flake; no NEW failure** (17:20Z→23:15Z) |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI node 20 (Node 20 EOL); **eslint v10 EBADENGINE (node ≥22.22.1)** surfaced at install this run |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci \|\| true` fail-open |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:298-301, SECURITY.md:48, deployment.md:64 accurate at HEAD — **2nd clean obs, PR #798 fix held** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (5th obs); on-pull.yml:63 unhardened install (no pipefail/retry) |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (4th clean obs) |

## New findings detail

**None this window.** F228 maintained RESOLVED (2nd clean obs). F230 maintained RESOLVED (4th obs). F063 window static with **7 consecutive successes** (no new failure since the 16:18Z curl-429 flake; 00:50Z run in-progress at audit time). F004 zero growth (byte-identical workflows). F026/F017/F028/F019 maintained RESOLVED. F064 gained new evidence: eslint v10 emits EBADENGINE (requires node ≥22.22.1) against the node-20 runtime — the `.nvmrc` 22 vs CI/devcontainer 20 drift now degrades local installs with warnings.

## Suggested resolutions (ranked)

1. **F229/F063/F037/F038 (P1, BLOCKED)**: workflow hardening (pipefail/retry install, trigger gating, secret scoping, `--admin` removal) requires `workflows: write` — token lacks it (F050, 18th documented pass). Record and hold; deliverable only with a workflows-enabled token.
2. **F018 (P2)**: data 29d stale — requires ETL run with external API credentials; out of scope for this run's token.
3. **F064 (P3)**: `.nvmrc` 22 vs CI/devcontainer node 20 — the correct fix (aligning CI to node 22) is a workflow change, F050-blocked; aligning `.nvmrc` down to 20 would codify an EOL version. Hold. Note: eslint v10 engine requirement (≥22.22.1) makes the upgrade direction the only correct one.
4. **F005 (P3)**: ledger files exempt by convention (88th obs) — no action.

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 43rd consecutive). Following the established repo pattern (222nd-record convention), this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.