# Issue Records — 223rd Batch Delta (263rd run, 2026-08-19)

**Ledger**: 223rd batch delta. **Trigger**: Phase 0 → 1 open PR (#824) → PR HANDLER MODE (merged) → re-probe 0 open PRs / 0 open issues → Phase 0.3 EMPTY → Phase 1 audit (263rd, read-only flat verification).

**F002 status**: `gh api graphql createIssue` → GraphQL "Resource not accessible by integration" — **403 CONCLUSIVE (65th)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (263rd basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (65th)** (re-probed direct this run) |
| F004    | security | P2       | HELD   | **57 refs / 10 unique names** (workflows `*.yml` only) — byte-identical to 262nd basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **184 files** (111th obs): 183 ledger + SECURITY_AUDIT_NOTE.md — **zero source files** (F251 verified holding, 14th clean obs); ledger-only drift by convention |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE **30 days** (threshold 7; held at 30d, same-day re-observation) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:56-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **164th obs**, push-blocked F050 (40th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **5/5 recent failed — ~65+ days** (held) |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause FIXED) | stale-page accumulation — F232 fix verified holding (17th obs); residual surface (school deletion/move) held |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (40th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **≥24 consecutive completed successes maintained** (5 visible + 1 in-progress 10:20:46Z — this run's PR-merge-triggered); no NEW failure |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); lint-staged EBADENGINE (node ≥22.22.1) surfaced at install; **pytest unavailable 9th consecutive run (255th → 256th → 257th → 258th → 259th → 260th → 261st → 262nd → 263rd, env-parity)** |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges, BuildOrchestrator.js:52-55) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci || true` fail-open (parallel.yml:72,347) — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md, SECURITY.md:46-50, deployment.md accurate at HEAD — **25th clean obs** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (**28th obs**); unhardened `curl\|bash` installer in **on-pull.yml:63 AND on-push.yml:63** |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (**27th clean obs**) |
| F231    | bug      | P2       | **FIXED (verified 17th obs)** | monitorBuild report generated after stop() — returned metrics real (build-performance.js:344) |
| F232    | bug      | P1       | **FIXED (verified 17th obs)** | computeSchoolHash includes lat/lon — incremental rebuild on coordinate-only change (manifest.js:130-140, lines 135-136) |
| F233    | bug      | P2       | HELD (partial) | cause-preservation in `IntegrationError.details` verified holding (resilience.js:15-32); full rethrow-of-non-transient decision deferred |
| F234    | security | P1       | **FIXED (verified 17th obs)** | validateExternalDataDir rejects shell metacharacters + path traversal before git clone interpolation (fetch-data.js:185-196) |
| F236    | refactor | P2       | HELD   | three divergent data-quality implementations (check-freshness.js / data-quality.js / freshness-report.js, each with .test.js) |
| F237    | refactor | P3       | HELD   | generate*Pages/build*PageData duplication — 6 `generate*Pages` refs in scripts/build-pages.js + 12 `build*PageData` refs in src/services/PageBuilder.js |
| F239    | docs     | P2       | **FIXED (verified 13th maintained obs)** | **all tree-listed modules have api.md sections** — Comparison (api.md:3888) + Test Helpers (api.md:6627) present at HEAD |
| F240    | docs     | P2       | HELD   | husky `"prepare"` wiring absent; two competing hook systems |
| F242    | release  | P3       | HELD   | release.md documents SemVer process; no release automation (F011 0 tags corroborates) |
| F245    | refactor | P2       | HELD   | 80 ES5 `var` occurrences in inline client JS (homepage.js `<script>` block) — count method matches prior runs |
| F246    | bug      | P2       | **FIXED (verified holding)** | footer.js year injectable (`options.year` default `new Date().getFullYear()`) |
| F247    | bug      | P2       | **FIXED (verified holding)** | no `/provinsi/undefined/` path at source — search-result fallback deterministic |
| F248    | bug      | P2       | **FIXED (verified holding)** | data-schema.js `isValidCoordinate(value, min, max)` present (line 222) |
| F249    | bug      | P2       | **FIXED (verified holding)** | homepage.js escape-only reset semantics (line 714: "never reset the filters from elsewhere") |
| F250    | bug      | P2       | **FIXED (verified holding)** | strict coordinate parse + npsn dedupe (data-schema.js:52-57,139) |
| F251    | test     | P3       | **FIXED (verified 14th clean obs)** | `scripts/data-schema.test.js` prettier-clean at HEAD — zero-source-drift invariant held |
| F252    | security | P2       | HELD   | unpinned mutable action tags (`actions/checkout@v7`, `actions/cache@v6`, `actions/setup-node@v7`, `softprops/turnstyle@v3`) + unpinned `curl|bash` installer across all 6 workflows (+ setup-opencode composite) |
| F253    | security | P2       | HELD   | agent self-approval merge (`gh pr merge --admin` on-pull.yml:193, opencode.yml:174) + validator blind spots (repository-projects: write, --admin/auto-merge) |

## NEW findings this run (263rd)

None. Read-only flat verification run (with PR handler activity) — every probe held at 262nd levels. Only deltas: (1) pytest availability remains unavailable 9th consecutive run (255th → 256th → 257th → 258th → 259th → 260th → 261st → 262nd → 263rd, env-parity — F064-adjacent, noted in audit report §Environment parity note), (2) ledger prettier count 181 → 184 (3 new ledger files from the 262nd run merged via PR #824; zero source), (3) F063 completed-success streak maintained ≥24, (4) F038 failure window held (~65+ days), (5) F229 unreachable 27th → 28th obs (unhardened `curl|bash` installer confirmed in **both** on-pull.yml:63 and on-push.yml:63), (6) F037 163rd → 164th obs, (7) F002 64th → 65th obs.

## Deferred/blocked (recorded, not this run)

| Finding | Category | Priority | Rationale |
| ------- | -------- | -------- | --------- |
| F229/F063/F037/F038/F227/F252/F253 | ci/security | P1/P2 | workflow hardening requires `workflows: write` — token lacks it (F050, 40th documented pass) |
| F233 (full fix) | bug      | P2 | rethrow-of-non-transient semantics still needs caller audit; cause-preservation landed as the backward-compatible step |
| F236 | refactor | P2 | three divergent data-quality implementations — consolidation needs a design decision on the single source of truth |
| F237 | refactor | P3 | generate*Pages/build*PageData duplication — consolidation is a larger refactor with page-output regression risk |
| F240 | docs     | P2 | husky `"prepare"` wiring belongs with the husky-rework decision (two competing hook systems) — recorded, deferred |
| F245 | refactor | P2 | 80+ ES5 inline client JS sites — conversion to lint-visible modules is a large, risky change |

## Category/priority label mapping (contract §4)

Every tracked finding carries exactly one category label and one priority label, enforced in the table above. Ledger docs are named with run sequence and prefixed by the record type (audit-report / issue-records / phase2-3-decision), preserving the convention established since the 42nd run.