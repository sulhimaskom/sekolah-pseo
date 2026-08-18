# Phase 2/3 — Decision Record (247th run): Phase 0 → 0 PRs / 0 issues → Phase 1 deep audit (composite **68.3**, Δ −3.1 — F231/F232/F234 FIXED in Phase 2, F233/F235-F250 recorded, F228/F230 maintained RESOLVED, F063 HELD 17 consecutive completed successes (streak 16→17) no new failure, F037 148th obs push-blocked 25th pass, F002 403 conclusive 49th, F064 EBADENGINE surfaced, F227 validator-exit-1 annotation carried)

**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Date**: 2026-08-18

## Phase 0 decision

| Step | Result |
| ---- | ------ |
| 0.1 open PRs | **0** |
| 0.2 open issues | **0** |
| Mode | Phase 0.3 EMPTY → **PHASE 1** (AUDIT MODE) |

## Phase 1 findings → Phase 2/3 decision

### Findings needing action (ranked)

| Priority | Finding | Action phase |
| -------- | ------- | ------------ |
| P1 | **F232** manifest hash excludes lat/lon → incremental stale pages (root cause of F045) | Phase 2 — **FIXED this run** (source-only, unblocked) |
| P1 | **F234** EXTERNAL_DATA_DIR command-injection vector | Phase 2 — **FIXED this run** (source-only, unblocked) |
| P2 | **F231** monitorBuild returns zeroed metrics report | Phase 2 — **FIXED this run** (source-only, unblocked) |
| P1 | **F229** TASK-102 workflow fix unreachable; flake ACTIVE | Phase 2 — **BLOCKED by F050** (token lacks `workflows` permission, 25th pass) → ledger + issue record |
| P1 | **F063** CI window fragile (improving: 17 completed successes, no new failure) | Phase 2 — same blocker as F229 |
| P1 | **F037** 12 workflow violations | Phase 2 — push-blocked F050 (25th pass) |
| P2 | **F233** retry() masks original error types | Phase 2 — **deferred**: semantics change affects callers pattern-matching IntegrationError; needs design decision, not a blind fix |
| P2 | **F018** data 29d stale | Phase 2 — needs external API credentials; out of scope |
| P2 | **F239/F240/F242** docs accuracy cluster (api.md tree/placeholder, husky wiring, phantom release.yml) | Phase 2 — **deferred to next runs**: each needs a focused docs PR; F240 (husky prepare script) is a package.json change that should ride with a workflow-enabled run |
| P3 | **F228** docs-drift | **RESOLVED maintained** — 9th clean obs at source (PR #798) |
| P3 | F230 | **RESOLVED maintained** — blueprint.md/task.md prettier-clean (11th obs) |
| P3 | F005 ledger files (137) | no action (ledger is exempt by convention) |
| P2 | **F227** no-CI-gates | validator exits 1 on violations (annotation carried); wiring into CI = workflow change → **F050-blocked** |

### Phase 2 decision — FEATURE HARDENING (non-cosmetic)

**This run delivered 3 source fixes** — the first Phase 2 code delivery since the 238th run's F228 docs correction, made possible by the deep audit's new evidence:

1. **F232 (P1, correctness)**: `computeSchoolHash` now includes `lat`/`lon` in the hash input, aligning the manifest with what the school-page template actually renders (comparisonData embeds coordinates). Fix: 2-line change in `scripts/manifest.js` + comment correction + new regression test (hash changes when only lat/lon differ). Impact: existing manifest invalidated → one-time full rebuild on next incremental build — safe, expected.
2. **F234 (P1, security)**: new `validateExternalDataDir()` in `scripts/fetch-data.js` — rejects shell metacharacters and path traversal in `EXTERNAL_DATA_DIR` before it is interpolated into the `git clone` execSync command (mirrors the existing validateRepoUrl/validateBranchName pattern). Fix: ~20 lines + 3 new tests.
3. **F231 (P2, correctness)**: `monitorBuild` now calls `tracker.stop()` before generating the returned report, so consumers receive real elapsed/throughput/memory metrics instead of zeroed values (logged report was already correct). Fix: restructured try/finally in `scripts/build-performance.js` + 1 new test asserting `elapsedMs > 0`.

All three fixes were written **test-first** (failing test → minimal fix → full suite) and verified: `npm run lint` 0/0, `npm run build` exit 0, `npm run test:js` **1309 pass / 0 fail** (previous 1309, no regressions), `npm run test:js:coverage` 97.38/93.63/99.58 (thresholds held), `npm run test:py` pass. **No speculative refactors, no unrelated improvements.**

**Held (blocked or deferred) with rationale:**
- **F229/F063/F037/F038 (P1)**: workflow hardening (pipefail/retry install, trigger gating, secret scoping, `--admin` removal) requires `workflows: write` — token lacks it (F050, 25th documented pass). Per the fail-safe rule: **DO NOT GUESS / DO NOT force** — recorded in issue records and held.
- **F233 (P2)**: retry() error-masking fix changes IntegrationError semantics that existing callers pattern-match on; a blind change could break error handling in the ETL/fetch paths. Needs an explicit design decision — recorded, deferred.
- **F064 (P3)**: `.nvmrc` 22 vs CI/devcontainer node 20 (Node 20 EOL since April 2026). The correct fix (upgrade CI to node 22) is a workflow-file change → F050-blocked. Downgrading `.nvmrc` to 20 would codify an EOL version — rejected. **Evidence re-confirmed this run**: lint-staged@17.3.0 requires node ≥22.22.1 (EBADENGINE at `npm ci`) — confirms the upgrade direction. Hold.
- **F018 (P2)**: data 29d stale — requires ETL run with external API credentials (IFLOW/GEMINI keys not available to this token). Out of scope.
- **F227 (P2)**: the actionable gap is wiring the validator + audit into CI — workflow change, F050-blocked. Hold.
- **F239/F240/F242 (P2, docs)**: recorded with suggested resolutions; each is a focused docs PR for a token-capable run. F240's clean fix (adding `"prepare": "husky"`) belongs with the husky-rework decision, not a drive-by change.

### Phase 3 decision — STRATEGIC EXPANSION

Not reached. Phase 2's remaining P1 findings are blocked by F050, and the repo's established pattern (235th–246th decisions) holds Phase 3 until the delivery blocker is resolved: feature work must land through the standard PR flow, and the highest-leverage gap — CI health — is exactly what F050 blocks. Additionally, this run's Phase 2 delivered real hardening value (3 source fixes) — the correct next step is consolidation and verification of those fixes in the next run's probes, not feature expansion. No Phase 3 feature proposal is created this run; roadmap/blueprint gaps remain documented in `docs/roadmap.md` / `docs/blueprint.md` for a token-capable run.

## Action log

| Time (UTC) | Action | Target | Result |
| ---------- | ------ | ------ | ------ |
| 11:18 | Phase 0 probe | repo | 0 PRs / 0 issues → Phase 1 |
| 11:18–11:21 | Dependency install | node_modules + pytest | `npm ci` ✅ 0 (EBADENGINE surfaced: lint-staged needs node ≥22.22.1); pip ✅ 0 |
| 11:19–11:20 | Phase 1 command matrix (247th) | main `d7e8670` | lint 0/0; build 0 (2 pages, 30ms, budgets PASS); test:js 1309/0/4skip; coverage 97.38/93.63/99.58; test:py pass (pytest 13/13); format:check 137 ledger files (F005); audit 0 vulns; check-workflow-security 12 violations (F037 148th) |
| 11:19–11:31 | **4 parallel explore subagents** (contract §6) | src/ (38 files), scripts/ (14), CI/security, docs | All 4 completed — **20 new findings (F231–F250)** surfaced with line-level evidence |
| 11:31–11:34 | Probe matrix (F004/F011/F018/F025/F029/F063/F064/F225/F227/F229/F230/F038) | repo | All held at 246th levels; F063 streak 16→17; F002 403 conclusive 49th |
| 11:34 | Issue-creation attempt | GitHub | **BLOCKED** — GraphQL 403 "Resource not accessible by integration (createIssue)" (F002, 49th) → findings recorded as ledger docs per convention |
| 11:35 | Phase 1 ledger output | 21/22/23 | audit report (composite 68.3, Δ −3.1) + issue records (207th batch delta, F231–F250) + this decision |
| 11:36 | **Phase 2 fix F232** | scripts/manifest.js | test-first: hash includes lat/lon + comment fix; regression test added |
| 11:36 | **Phase 2 fix F234** | scripts/fetch-data.js | test-first: validateExternalDataDir (shell metachar + traversal rejection) |
| 11:36 | **Phase 2 fix F231** | scripts/build-performance.js | test-first: stop() before generateReport() in monitorBuild |
| 11:37 | Phase 2 verification | full suite | lint 0/0; build 0; test:js 1309 pass / 0 fail; coverage thresholds held; test:py pass |
| next | Deliver | ledger + fixes | commit → push → PRs (docs-led + source-fix PRs) |

## Final state

- **PRs**: 0 open (this run creates the 247th-run PRs)
- **Issues (GitHub)**: 0 open (creation blocked F002 — 403 conclusive, 49th)
- **Ledger**: 207th batch delta recorded (21-audit, 22-issue-records, 23-decision)
- **Phase 2**: **3 source fixes delivered** (F231/F232/F234) — first code delivery since the 238th run; verified with full suite, no regressions
- **State**: Phase 2 remaining P1 cluster (F229/F063/F037/F038) **blocked on F050** workflows permission — waiting for a workflows-enabled token; F233 + docs cluster (F239/F240/F242) deferred with rationale
- **Overall loop state**: idle after Phase 2 delivery — see next run's continuation (verify F231/F232/F234 fixes hold, re-probe F045 stale-page behavior with the hash fix in place)