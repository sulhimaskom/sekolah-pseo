# Issue Records — 209th Batch Delta (249th run, 2026-08-18)

**Ledger**: 209th batch delta. **Trigger**: Phase 0 → 0 PRs / 0 issues → Phase 1 audit (249th, read-only re-verification).

**F002 status**: GraphQL "Resource not accessible by integration (createIssue)" — HTTP-equivalent **403 CONCLUSIVE (51st)** — token lacks `issues: write`. GitHub-native issue creation remains blocked. All findings recorded here in the ledger, the established output channel.

## Finding status table (249th basis — active tracked findings)

| Finding | Category | Priority | Status | Observation |
| ------- | -------- | -------- | ------ | ----------- |
| F002    | ci       | P1       | HELD   | Token lacks `issues: write` — **403 CONCLUSIVE (51st)** |
| F004    | security | P2       | HELD   | **57 refs / 10 names** (workflows `*.yml` only) — byte-identical to 248th basis, **zero growth** |
| F005    | docs     | P3       | HELD   | **144 files** (97th obs): 142 ledger + SECURITY_AUDIT_NOTE.md + **NEW scripts/data-schema.test.js** — ledger-only by convention except the new source-test drift (F251) |
| F007    | refactor | P2       | HELD   | Workflow YAML overcomplexity (2045L) |
| F011    | release  | P2       | HELD   | 0 tags / no release process (F242 docs-fix landed; automation still absent) |
| F018    | data     | P2       | HELD   | Data STALE 29 days (threshold 7) |
| F025    | config   | P3       | HELD   | SITE_URL placeholder `https://example.com` (config.js:56-60); live site root 404 while Pages "built" |
| F028    | security | P2       | RESOLVED maintained | npm audit 0 vulnerabilities |
| F029    | test     | P2       | NOT OBSERVED | working tree clean after full suite (verified this run) |
| F037    | security | P1       | HELD   | 12 workflow violations (2 CRITICAL + 10 HIGH), **150th obs**, push-blocked F050 (27th documented pass) |
| F038    | ci       | P1       | HELD   | orchestrator workflow **5/5 failed — ~62 days** |
| F044    | security | P2       | HELD   | secret over-scoping (F004 cluster) — held at 57 refs |
| F045    | bug      | P1       | HELD (root cause FIXED) | stale-page accumulation — F232 fix verified holding (3rd obs); residual surface (school deletion/move) held |
| F046    | bug      | P2       | HELD   | whole-build abort on single bad row |
| F050    | ci       | P1       | HELD   | GitHub App token lacks `workflows` permission — blocks workflow-file delivery (27th push-block pass) |
| F063    | ci       | P1       | HELD (IMPROVING) | on-pull: **19 consecutive completed successes visible (7 + 1 in-progress)**; no NEW failure (streak 18→19) |
| F064    | config   | P3       | HELD   | `.nvmrc` 22 vs runtime/CI/devcontainer node 20 (Node 20 EOL); lint-staged EBADENGINE (node ≥22.22.1) surfaced at install |
| F225    | refactor | P2       | HELD   | BuildOrchestrator services→controllers inversion (4 edges) |
| F227    | ci       | P2       | HELD   | no lint/build/test/audit gates in workflows; `npm ci || true` fail-open (parallel.yml:72,347) — validator exits 1 on violations but **no CI step invokes it** |
| F228    | docs     | P3       | **RESOLVED maintained** | README.md:294-304, SECURITY.md:46-50, deployment.md:62-66 accurate at HEAD — **11th clean obs** |
| F229    | ci       | P1       | HELD   | TASK-102 fix commit `0056ad8` UNREACHABLE (14th obs); on-pull.yml:63 unhardened install |
| F230    | docs     | P3       | **RESOLVED maintained** | blueprint.md/task.md prettier-clean at HEAD (**13th clean obs**) |
| F231    | bug      | P2       | **FIXED (verified 3rd obs)** | monitorBuild report generated after stop() — returned metrics real |
| F232    | bug      | P1       | **FIXED (verified 3rd obs)** | computeSchoolHash includes lat/lon — incremental rebuild on coordinate-only change |
| F234    | security | P1       | **FIXED (verified 3rd obs)** | validateExternalDataDir rejects shell metacharacters + path traversal before git clone interpolation |
| F233    | bug      | P2       | HELD (partial) | cause-preservation in `IntegrationError.details.cause` verified holding; full rethrow-of-non-transient decision deferred |
| F236    | refactor | P2       | HELD   | three divergent data-quality implementations |
| F237    | refactor | P3       | HELD   | generate*Pages duplication |
| F239    | docs     | P2       | HELD (partial) | 8 tree-listed modules still lack doc sections |
| F240    | docs     | P2       | HELD   | husky `"prepare"` wiring absent; two competing hook systems |
| F245    | refactor | P2       | HELD   | ~700 lines of ES5 inline client JS invisible to the linter |

## NEW findings this run (249th — full issue bodies per contract §Phase 1)

### F251 — [test][P3] scripts/data-schema.test.js fails prettier — source-test format drift

- **Evaluation date**: 2026-08-18 (249th run)
- **Category label**: test | **Priority label**: P3
- **Domain score impact**: A. Code Quality 80.0 (Consistency 69, −1); D. Delivery & Evolution 50.0 (Technical Debt 59, −1)
- **Observation**: `prettier --check .` reports 144 files; **144th file is a source-test file** (`scripts/data-schema.test.js`), breaking the "zero source files" invariant held since run ~52 (F005 was ledger-only).
- **Evidence**: `scripts/data-schema.test.js:262` — `assert.strictEqual(npsnErrors.length, 1, 'npsn should be reported exactly once (no duplicate legacy check)');` exceeds 80 columns; prettier wants multiline form (verified via `npx prettier scripts/data-schema.test.js | diff -`). Root cause: the F250 fix (run 248, strict coordinate parse + npsn dedupe) added this assertion without running `prettier --write`.
- **Criteria breakdown**: Consistency (−1: single unformatted line in an otherwise prettier-clean source tree); Documentation Accuracy (minor: the F005 "ledger-only" claim in prior reports is now stale).
- **Impact / Risk**: Low — cosmetic, no runtime effect. Risk is precedent: unchecked format drift creeping into source.
- **Files affected**: `scripts/data-schema.test.js:262`
- **Suggested fix (Phase 2 candidate)**: `npx prettier --write scripts/data-schema.test.js` (single line reformat) + run `npm run format:check` to confirm 143 files (ledger + SECURITY_AUDIT_NOTE only).

### F252 — [security][P2] Unpinned mutable action tags + unpinned curl|bash installer across all 6 workflows

- **Evaluation date**: 2026-08-18 (249th run)
- **Category label**: security | **Priority label**: P2
- **Domain score impact**: B. System Quality 71.5 (Security Practices 58); D. Delivery & Evolution 50.0 (CI/CD Health 25)
- **Observation**: No GitHub Action is pinned to a commit SHA — all use mutable major-version tags (`actions/checkout@v7`, `actions/cache@v6`, `actions/setup-node@v7`/`@v6`, `softprops/turnstyle@v3`). The OpenCode installer is fetched via unpinned `curl -fsSL https://opencode.ai/install | bash` in all 6 workflows (on-push.yml:63, on-pull.yml:63, orchestrator.yml:49, architect-agent.yml:47, opencode.yml:55, parallel.yml:76/271/351/405, plus `.github/actions/setup-opencode/action.yml:59`). Supply-chain tampering of a mutable tag or installer endpoint would execute arbitrary code in CI with `contents: write`.
- **Evidence**: workflow inventory from the 249th CI/CD explore agent (all action refs verified in-file); `check-workflow-security.js` does NOT check action pinning (validator blind spot).
- **Criteria breakdown**: Security Practices (supply-chain exposure, no validator coverage); CI/CD Health (non-reproducible CI builds).
- **Impact / Risk**: Medium-High — mutable-tag supply chain is a recognized GitHub hardening requirement; no remediation gate exists.
- **Files affected**: all 6 `.github/workflows/*.yml` + `.github/actions/setup-opencode/action.yml`
- **Suggested fix (Phase 2 candidate, F050-blocked)**: pin actions to SHA with `@sha` + Dependabot `group` updates; pin installer to a versioned release artifact; extend `check-workflow-security.js` with an ACTION_PIN rule. Requires `workflows: write` (F050).

### F253 — [security][P2] Agent self-approval merge (`gh pr merge --admin`) + validator blind spots on over-scoped write permissions

- **Evaluation date**: 2026-08-18 (249th run)
- **Category label**: security | **Priority label**: P2
- **Domain score impact**: B. System Quality 71.5 (Security Practices 58); D. Delivery & Evolution 50.0 (Release & Rollback Safety 50)
- **Observation**: `opencode.yml` adds the `ready-to-merge` label itself (prompt L114) and then merges with `gh pr merge $PR_NUMBER --merge --delete-branch --admin` (L170-176) when CI success + ≥1 approval + its own label; `on-pull.yml:191-193` instructs "Set to auto merge if check takes too long" + `--admin` bypass. The validator's `ALLOWED_OVERRIDES` whitelists `on-pull.yml`'s `id-token: write` (L14) and never checks `repository-projects: write` (L13) or the `--admin`/auto-merge pattern. The workflow security gate (`.husky/pre-commit`) is fail-open at the 12-violation baseline, so none of this is blocked.
- **Evidence**: opencode.yml:114/162-176, on-pull.yml:13-14/191-193; check-workflow-security.js ALLOWED_OVERRIDES; .husky/pre-commit baseline=12.
- **Criteria breakdown**: Release & Rollback Safety (no human gate on security-sensitive merges); Security Practices (self-approval + admin bypass + validator blind spots).
- **Impact / Risk**: Medium — autonomous merge by design (loop contract) but removes the review safety net the contract itself demands ("No security-sensitive change without review").
- **Files affected**: `.github/workflows/opencode.yml:114/162-176`, `.github/workflows/on-pull.yml:13-14/191-193`, `scripts/check-workflow-security.js` (rule coverage)
- **Suggested fix (Phase 2 candidate, F050-blocked)**: require human review for security-sensitive paths; extend validator with REPOSITORY_PROJECTS_WRITE and ADMIN_MERGE rules; tighten `.husky/pre-commit` baseline to 0 when the workflow fix lands.

## Deferred/blocked (recorded, not this run)

| Finding | Category | Priority | Rationale |
| ------- | -------- | -------- | --------- |
| F229/F063/F037/F038/F227/F252/F253 | ci/security | P1/P2 | workflow hardening requires `workflows: write` — token lacks it (F050, 27th documented pass) |
| F233 (full fix) | bug      | P2 | rethrow-of-non-transient semantics still needs caller audit; cause-preservation landed as the backward-compatible step |
| F236 | refactor | P2 | three divergent data-quality implementations — consolidation needs a design decision on the single source of truth |
| F237 | refactor | P3 | generate*Pages duplication — consolidation is a larger refactor with page-output regression risk |
| F239 (remaining) | docs     | P2 | 8 tree-listed modules without doc sections — focused docs PR per module |
| F240 | docs     | P2 | husky `"prepare"` wiring belongs with the husky-rework decision (two competing hook systems) — recorded, deferred |
| F245 | refactor | P2 | ~700 lines of ES5 inline client JS — conversion to lint-visible modules is a large, risky change |
| F251 | test     | P3 | single-line prettier fix — trivial, first Phase 2 candidate (does NOT require F050) |
| F018 | data     | P2 | requires external API credentials (IFLOW/GEMINI) not available to this token — out of scope |
| F064 | config   | P3 | correct fix (upgrade CI to node 22) is a workflow change — F050-blocked; downgrading `.nvmrc` would codify an EOL version |
| F005 | docs     | P3 | ledger files exempt by convention (97th obs) — no action; F251 is the actionable exception |

## Suggested resolutions (ranked)

1. **F251 (P3, unblocked)**: `npx prettier --write scripts/data-schema.test.js` — restores the "zero source drift" invariant. Only fix not blocked by F050.
2. **F037/F038/F229/F063/F227/F252/F253 (P1/P2)**: workflow hardening — requires a `workflows`-enabled token (F050). Highest-leverage delivery blocker.
3. **F233 (full, P2)**: audit callers of `retry()`; rethrow non-transient errors directly where no caller relies on the wrapper.
4. **F239 (remaining, P2)**: author the 8 missing api.md module sections.
5. **F240 (P2)**: decide the hook strategy (.husky vs .pre-commit-config.yaml), then wire `"prepare": "husky"`.
6. **F236/F237 (P2/P3)**: consolidation refactors with full-suite regression verification.
7. **F245 (P2)**: extract inline client scripts to lint-covered modules.
8. **F018 (P2)**: ETL run with external credentials.
9. **F064 (P3)**: upgrade CI to node 22 (workflow change, F050-blocked).

## Phase 1 output note

Per contract, Phase 1 mandates GitHub issues from all findings. **F002 blocks this** (`gh issue create` → GraphQL 403 "Resource not accessible by integration (createIssue)", 51st consecutive). Following the established repo pattern, this run records findings as labeled docs records under `docs/issues/2026-08-18/` and ships them via PR. All tracked findings remain labeled (category + priority) and ready to be bulk-created as GitHub issues the moment token permissions are granted.
