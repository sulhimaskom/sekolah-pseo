# Issue Records — 228th Batch Delta (268th run, 2026-08-19)

**Ledger**: 228th batch delta. **Trigger**: Phase 0 → 1 open PR (#829) → PR HANDLER MODE (merged) → re-probe 0 open PRs / 0 open issues → Phase 0.3 EMPTY → Phase 1 audit (268th, read-only flat verification).

**F002 status**: `gh api graphql createIssue` (repository node id `R_kgDOQKx7JA`) → GraphQL "Resource not accessible by integration" — **403 CONCLUSIVE (70th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (268th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (70th)** (re-probed direct this run, correct node id) |
| F004    | security | P2       | HELD   | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 267th basis (0 workflow commits since `e00195f`), **zero growth** |
| F005    | docs     | P3       | HELD   | **199 files** (116th obs): 198 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 19th clean obs); ledger-only drift by convention (grew by 3 from the 267th ledger merged in #829) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE **30 days** (threshold 7; held at 30d, same-day re-observation) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:56-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **169th obs**, push-blocked F050 (45th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **6/6 most recent FAILED** (~66+ days, latest 2026-08-19T00:50:16Z) |
| F050    | ci       | P1       | HELD   | token lacks `workflows: write` — workflow-file changes blocked (45th documented pass) |
| F063    | ci       | P1       | HELD (improving) | on-pull **29/29 completed successes** visible, 0 failures + 1 in-progress (this run's PR-merge-triggered); **streak ≥24 maintained** |
| F064    | ci       | P3       | HELD   | `.nvmrc` 22 vs runtime node v20.20.2 vs CI node 20 vs devcontainer node 20; lint-staged EBADENGINE (wants node ≥22.22.1); **pytest env-parity UNAVAILABLE this run (14th obs — continued unavailable)** |
| F225    | refactor | P2       | HELD   | services→controllers inversion: BuildOrchestrator.js:52-56 requires ../../scripts/* (4 import edges) |
| F227    | ci       | P1       | HELD   | no lint/build/test/audit gates in any workflow; `npm ci \|\| true` fail-open (parallel.yml:72,347) |
| F228    | docs     | P2       | RESOLVED maintained | README.md:305-319 / SECURITY.md:46-50 / deployment.md accurate at HEAD **`866af3d`** (**30th clean obs**) |
| F229    | security | P1       | HELD   | commit `0056ad8` still UNREACHABLE (**33rd obs**); unhardened `curl -fsSL https://opencode.ai/install \| bash` (no pipefail/retry) in **on-pull.yml:63 AND on-push.yml:63** |
| F230    | docs     | P3       | RESOLVED maintained | `prettier --check docs/blueprint.md docs/task.md` clean (**32nd clean obs**) |
| F231    | bug      | P2       | RESOLVED maintained | monitorBuild report-after-stop verified at source (build-performance.js:344) — **22nd clean obs** |
| F232    | bug      | P1       | RESOLVED maintained | manifest hash includes lat/lon (manifest.js:130-140) — **22nd clean obs** |
| F233    | bug      | P2       | PARTIAL (held) | cause-preservation landed (IntegrationError.details, src/core/resilience.js:15-32); full rethrow-of-non-transient deferred (caller-audit design decision) |
| F234    | security | P1       | RESOLVED maintained | EXTERNAL_DATA_DIR injection closed (fetch-data.js:183-198) — **22nd clean obs** |
| F236    | refactor | P2       | HELD   | three data-quality implementations: check-freshness.js / data-quality.js / freshness-report.js |
| F237    | refactor | P3       | HELD   | 6 `generate*Pages` refs (build-pages.js) + 12 `build*PageData` refs (PageBuilder.js) |
| F239    | docs     | P2       | RESOLVED maintained | api.md:3888 Comparison Module + api.md:6627 Test Helpers Module present (**18th obs**) |
| F240    | chore    | P2       | HELD   | husky hooks not wired (`"prepare": "husky"` absent in package.json); two competing hook systems |
| F242    | docs     | P3       | HELD   | release.md documents SemVer process; no release automation (F011 0 tags corroborates) |
| F245    | refactor | P2       | HELD   | 80 ES5 `var` sites in inline client JS (src/presenters/templates/homepage.js `<script>` block) |
| F246    | bug      | P3       | RESOLVED maintained | footer year injectable (src/presenters/templates/shared/footer.js:24) — verified holding |
| F247    | bug      | P3       | RESOLVED maintained | no `/provinsi/undefined/` path at source (test-assertion refs only: scripts/homepage.test.js:710/712) — verified holding |
| F248    | bug      | P3       | RESOLVED maintained | isValidCoordinate at data-schema.js:222 — verified holding |
| F249    | bug      | P3       | RESOLVED maintained | escape-only reset semantics (src/presenters/templates/homepage.js:714) — verified holding |
| F250    | bug      | P3       | RESOLVED maintained | strict coordinate parse + npsn dedupe (data-schema.js:52-57/139) — verified holding |
| F251    | chore    | P3       | RESOLVED maintained | `scripts/data-schema.test.js` prettier-clean (**19th clean obs** — zero source drift invariant) |
| F252    | security | P2       | HELD   | mutable action tags not SHA-pinned (`actions/checkout@v7`, `actions/cache@v6`, `actions/setup-node@v7`) |
| F253    | ci       | P2       | HELD   | `--admin` self-merge (on-pull.yml:193 + opencode.yml:174) + auto-merge-if-slow instructions |

## Suggested resolutions for open HELD findings (unchanged from 227th batch, held)

- **F002/F050 (blocking pair)**: grant token `issues: write` + `workflows: write` — unblocks issue bulk-creation and the F037/F038/F227/F229 workflow cluster.
- **F229**: harden installer (`set -o pipefail`, retry, checksum pin) — requires `workflows: write` (F050).
- **F037**: fix 12 workflow violations via `scripts/check-workflow-security.js` guidance — requires `workflows: write` (F050).
- **F038**: orchestrator flake root cause is commit `0056ad8` unreachability (F229) — same F050 gate.
- **F064**: align `.nvmrc`/CI/devcontainer to node 22 — workflow-file change, F050-gated.
- **F233 (full fix)**: caller audit before rethrow-of-non-transient semantics change.
- **F236/F237/F245**: consolidation refactors — design-level, regression risk; schedule deliberately.
- **F018**: data refresh needs external API credentials — out of scope for token-only runs.

## Files affected

- `docs/issues/2026-08-19/30-audit-report-2026-08-19-268th.md`
- `docs/issues/2026-08-19/31-issue-records-228th-batch-delta-268th.md` (this file)
- `docs/issues/2026-08-19/32-phase2-3-decision-268th.md`