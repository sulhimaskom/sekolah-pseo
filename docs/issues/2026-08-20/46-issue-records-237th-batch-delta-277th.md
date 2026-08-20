# Issue Records — 237th Batch Delta (277th run, 2026-08-20)

**Ledger**: 237th batch delta. **Trigger**: Phase 0 → 1 open PR (#838, 276th ledger) → PR HANDLER MODE: **merged #838** → Phase 0 re-probe 0 open PRs / 0 open issues → Phase 0.3 EMPTY → Phase 1 audit (277th, read-only flat verification).

**F002 status**: `gh issue create` → GraphQL "Resource not accessible by integration" — **403 CONCLUSIVE (79th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (277th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (79th)** (re-probed direct this run) |
| F004    | security | P2       | HELD   | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 276th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **226 files** (125th obs): 225 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 28th clean obs); ledger-only drift by convention (grew by 3 from the 276th ledger merged in #838) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE **31 days** (threshold 7; held at 31d, same-day re-observation; 30d → 31d delta) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:56-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **178th obs**, push-blocked F050 (54th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **6/6 most recent FAILED** (~69+ days, latest 2026-08-20T00:50:16Z) |
| F050    | ci       | P1       | HELD   | token lacks `workflows: write` — workflow-file changes blocked (54th documented pass) |
| F063    | ci       | P1       | HELD (improving) | on-pull **29/29 completed successes** visible, 0 failures; **streak ≥24 maintained** |
| F064    | ci       | P3       | HELD   | `.nvmrc` 22 vs runtime node v20.20.2 vs CI node 20 vs devcontainer node 20; lint-staged EBADENGINE (wants node ≥22.22.1); **pytest env-parity UNAVAILABLE this run (23rd obs — continued unavailable)** |
| F225    | refactor | P2       | HELD   | services→controllers inversion: BuildOrchestrator.js requires ../../scripts/* (4 import edges) |
| F227    | ci       | P1       | HELD   | no lint/build/test/audit gates in any workflow; `npm ci \|\| true` fail-open (parallel.yml:72,347) |
| F228    | docs     | P2       | RESOLVED maintained | README.md:312 12-violation note / SECURITY.md:46-50 / deployment.md accurate at HEAD **`55984a7`** (**39th clean obs**) |
| F229    | security | P1       | HELD   | commit `0056ad8` still UNREACHABLE (**42nd obs**); unhardened `curl -fsSL https://opencode.ai/install \| bash` (no pipefail/retry) in **on-pull.yml:63 AND on-push.yml:63** |
| F230    | docs     | P3       | RESOLVED maintained | `prettier --check docs/blueprint.md docs/task.md` clean (**41st clean obs**) |
| F231    | bug      | P2       | RESOLVED maintained | monitorBuild report-after-stop verified at source (build-performance.js:344) — **31st clean obs** |
| F232    | bug      | P1       | RESOLVED maintained | manifest hash includes lat/lon (manifest.js:130-140) — **31st clean obs** |
| F233    | bug      | P2       | PARTIAL (held) | cause-preservation landed (IntegrationError.details, src/core/resilience.js:10-17); full rethrow-of-non-transient deferred (caller-audit design decision) |
| F234    | security | P1       | RESOLVED maintained | EXTERNAL_DATA_DIR injection closed (fetch-data.js:183-198) — **31st clean obs** |
| F236    | refactor | P2       | HELD   | three data-quality implementations: check-freshness.js / data-quality.js / freshness-report.js |
| F237    | refactor | P3       | HELD   | 6 `generate*Pages` refs (build-pages.js) + 12 `build*PageData` refs (PageBuilder.js) |
| F239    | docs     | P2       | RESOLVED maintained | api.md:3888 Comparison Module + api.md:6627 Test Helpers Module present (**27th obs**) |
| F240    | chore    | P2       | HELD   | husky hooks not wired (`"prepare": "husky"` absent in package.json); two competing hook systems |
| F242    | docs     | P3       | HELD   | release.md documents SemVer process; no release automation (F011 0 tags corroborates) |
| F245    | refactor | P2       | HELD   | 80 ES5 `var` sites in inline client JS (src/presenters/templates/homepage.js `<script>` block) |
| F246    | bug      | P3       | RESOLVED maintained | footer year injectable (src/presenters/templates/shared/footer.js:24/30) — verified holding |
| F247    | bug      | P3       | RESOLVED maintained | no `/provinsi/undefined/` path at source — verified holding |
| F248    | bug      | P3       | RESOLVED maintained | isValidCoordinate at src/core/data-schema.js:222 — verified holding |
| F249    | bug      | P3       | RESOLVED maintained | escape-only reset semantics (src/presenters/templates/homepage.js) — verified holding |
| F250    | bug      | P3       | RESOLVED maintained | strict coordinate parse + npsn dedupe (src/core/data-schema.js:52-57) — verified holding |
| F251    | chore    | P3       | RESOLVED maintained | `scripts/data-schema.test.js` prettier-clean (**28th clean obs** — zero source drift invariant) |
| F252    | security | P2       | HELD   | mutable action tags not SHA-pinned (`actions/checkout@v7`, `actions/cache@v6`, `softprops/turnstyle@v3`) |
| F253    | ci       | P2       | HELD   | `--admin` self-merge (on-pull.yml:193 + opencode.yml:174) + auto-merge-if-slow instructions |

## Suggested resolutions for open HELD findings (unchanged from 236th batch, held)

- **F002/F050 (blocking pair)**: grant token `issues: write` + `workflows: write` — unblocks issue bulk-creation and the F037/F038/F227/F229 workflow cluster.
- **F229**: harden installer (`set -o pipefail`, retry, checksum pin) — requires `workflows: write` (F050).
- **F037**: fix 12 workflow violations via `scripts/check-workflow-security.js` guidance — requires `workflows: write` (F050).
- **F038**: orchestrator flake root cause is commit `0056ad8` unreachability (F229) — same F050 gate.
- **F064**: align `.nvmrc`/CI/devcontainer to node 22 — workflow-file change, F050-gated.
- **F233 (full fix)**: caller audit before rethrow-of-non-transient semantics change.
- **F236/F237/F245**: consolidation refactors — design-level, regression risk; schedule deliberately.
- **F018**: data refresh needs external API credentials — out of scope for token-only runs.

## Files affected

- `docs/issues/2026-08-20/45-audit-report-2026-08-20-277th.md`
- `docs/issues/2026-08-20/46-issue-records-237th-batch-delta-277th.md` (this file)
- `docs/issues/2026-08-20/47-phase2-3-decision-277th.md`