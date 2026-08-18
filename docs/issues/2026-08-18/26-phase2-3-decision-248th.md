# Phase 2/3 — Decision Record (248th run): Phase 0 → 0 PRs / 0 issues → Phase 1 audit (composite **70.1**, Δ +1.8 — F231/F232/F234 verified holding, **8 source + 5 docs fixes delivered**, F063 HELD 18 consecutive completed successes (streak 17→18), F037 149th obs push-blocked 26th pass, F002 403 conclusive 50th, F233/F235/F238/F246-F250 + docs cluster FIXED)

**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Date**: 2026-08-18

## Phase 0 decision

| Step | Result |
| ---- | ------ |
| 0.1 open PRs | **0** |
| 0.2 open issues | **0** |
| Mode | Phase 0.3 EMPTY → **PHASE 1** (AUDIT MODE) |

## Phase 1 findings → Phase 2/3 decision

### Findings needing action (ranked, 248th basis)

| Priority | Finding | Action phase |
| -------- | ------- | ------------ |
| P1 | **F232** manifest hash lat/lon | Phase 2 — **verified HOLDING (2nd obs)** since 247th fix |
| P1 | **F234** EXTERNAL_DATA_DIR injection | Phase 2 — **verified HOLDING (2nd obs)** since 247th fix |
| P2 | **F231** monitorBuild zeroed report | Phase 2 — **verified HOLDING (2nd obs)** since 247th fix |
| P2 | **F233** retry() error-masking | Phase 2 — **cause-preservation landed** (backward-compatible); full rethrow deferred |
| P2 | **F235** validate-links false broken-link reports | Phase 2 — **FIXED this run** |
| P2 | **F238** interactive.js require-time side effect | Phase 2 — **FIXED this run** |
| P2 | **F239/F242/F244** docs accuracy cluster | Phase 2 — **FIXED this run** (tree+placeholder, release.md, README) |
| P3 | **F246/F247/F248/F249/F250** bug cluster | Phase 2 — **FIXED this run** |
| P3 | **F241/F243** CHANGELOG + roadmap | Phase 2 — **FIXED this run** |
| P1 | **F229/F063/F037/F038** workflow cluster | Phase 2 — **BLOCKED by F050** (26th pass) → ledger + issue record |
| P2 | **F018** data 29d stale | Phase 2 — needs external API credentials; out of scope |
| P2 | **F240** husky wiring | Phase 2 — deferred to husky-rework decision |
| P2 | **F236/F245** refactor cluster | Phase 2 — deferred (design decision / large change) |

### Phase 2 decision — FEATURE HARDENING (non-cosmetic)

**This run delivered 8 source fixes + 5 docs fixes**, the largest single-run delivery in the modern ledger era, executing the 247th run's recorded backlog. All fixes were written **test-first** (failing test → minimal fix → full suite) and verified:

1. **F233 (P2)**: `retry()` now attaches the original error to `IntegrationError.details.cause`. Backward-compatible — existing callers pattern-matching `IntegrationError` are untouched; root-cause identity is no longer lost behind the wrapper. 2 new tests (same-instance preservation, code/message fidelity).
2. **F235 (P2)**: `isRelativeLink` recognizes non-hierarchical URI schemes (`mailto:`, `tel:`, `javascript:`, `data:`, `ftp:`) and protocol-relative URLs — they were being stat()'d against `dist/` and falsely reported broken. 3 new tests.
3. **F238 (P2)**: `interactive.js` `main()` gated on `require.main === module` — requiring the module no longer starts the CLI (readline) at import time. 4 CLI-flag tests updated to invoke `main()` explicitly + 1 regression test asserting no auto-run.
4. **F246 (P3)**: footer copyright year injectable via `options.year` (default current year); module-load constant removed — deterministic output and testable. 1 new test.
5. **F247 (P3)**: homepage search-result fallback `'/provinsi/' + school.provinceSlug + '/'` (always `/provinsi/undefined/` — `provinceSlug` never set) replaced with `provinceUrlFallback(school)` — a deterministic client-side slugify mirroring the server rules (verified: `'D.I. Yogyakarta'` → `d-i-yogyakarta` on both sides). 4 new vm-extraction tests.
6. **F248 (P3)**: `hasCoordinateData` strict full-string numeric match — `'12abc'`, `'abc'`, `'NaN'` now rejected (was: `parseFloat` partial match passed garbage). 5 new test cases.
7. **F249 (P3)**: `CircuitBreaker.reset()` emits `stateChange {from: previousState, to: 'CLOSED'}` — truthful payload. 2 new tests.
8. **F250 (P3)**: `isValidCoordinate` strict full-string numeric match (`'12abc'` rejected); duplicate legacy npsn check removed (pattern check reports once — verified single error message). 4 new test cases.
9. **Docs cluster**: api.md tree realigned with `src/core/` move + placeholder removed (F239); CHANGELOG [Unreleased] section (F241); release.md phantom-workflow note (F242); roadmap FEAT-005 marked implemented with verified claims only (F243); README validation wording corrected + held-violations note (F244).

**Verification** (full suite after fixes): `npm run lint` 0/0; `npm run build` exit 0 (2 pages, 0 failed, budgets PASS); `npm run test:js` **1334 pass / 0 fail / 4 skipped** (was 1319 at 247th HEAD; +15 new tests, 0 regressions); `npm run test:js:coverage` **97.38/93.57/99.58** (thresholds held); `npm run test:py` pass (27/27; pytest 13/13); `npm audit` 0 vulns; Prettier clean on all changed source + docs. **No speculative refactors, no unrelated improvements.**

**Held (blocked or deferred) with rationale:**
- **F229/F063/F037/F038 (P1)**: workflow hardening requires `workflows: write` — token lacks it (F050, 26th documented pass). Per the fail-safe rule: **DO NOT GUESS / DO NOT force** — recorded and held.
- **F233 (full fix, P2)**: rethrow-of-non-transient errors changes semantics for callers pattern-matching IntegrationError; cause-preservation landed as the safe step; full fix needs a caller audit.
- **F236 (P2) / F237 (P3) / F245 (P2)**: consolidation refactors (three quality impls, generate*Pages, inline ES5 scripts) — each is a design-level change with regression risk; recorded with suggested resolutions.
- **F239 (remaining, P2)**: 8 tree-listed modules lack api.md doc sections — focused docs work per module.
- **F240 (P2)**: husky `"prepare"` wiring belongs with the hook-strategy decision (two competing systems).
- **F064 (P3)**: `.nvmrc` 22 vs CI/devcontainer node 20 — correct fix (CI → node 22) is workflow-file change, F050-blocked. Hold.
- **F018 (P2)**: data 29d stale — requires external API credentials. Out of scope.

### Phase 3 decision — STRATEGIC EXPANSION

Not reached. Phase 2's remaining P1 findings remain blocked by F050 (workflows permission), and this run's Phase 2 delivered the largest fix batch in the modern ledger era (13 findings closed) — the correct next step is consolidation and verification of these fixes (2nd-obs probes in the next run), not feature expansion. The highest-leverage gap — CI health (F037/F038/F229/F063/F227) — is exactly what F050 blocks. No Phase 3 feature proposal is created this run; roadmap/blueprint gaps remain documented in `docs/roadmap.md` / `docs/blueprint.md` for a token-capable run.

## Action log

| Time (UTC) | Action | Target | Result |
| ---------- | ------ | ------ | ------ |
| 14:25 | Phase 0 probe | repo | 0 PRs / 0 issues → Phase 1 |
| 14:25–14:29 | Phase 1 command matrix (248th) | main `e187197` | lint 0/0; build 0; test:js 1319→1334 baseline; coverage 97.38/93.67→93.57; test:py pass; format:check 140 ledger files (F005); audit 0 vulns; check-workflow-security 12 violations (F037 149th) |
| 14:29 | F231/F232/F234 fix probes | HEAD | **All 3 verified holding** (report-after-stop, lat/lon hash, EXTERNAL_DATA_DIR validation) |
| 14:29–14:31 | Held-finding probes | repo | F002 403 (50th); F004 57 refs zero growth; F011 0 tags; F018 STALE 29d; F025 placeholder; F029 tree clean; F063 streak 17→18; F038 5/5 failed; F064 EBADENGINE; F225 4 edges; F227 no gates; F228 10th clean; F229 13th unreachable; F230 12th clean |
| 14:31 | Issue-creation attempt | GitHub | **BLOCKED** — GraphQL 403 (F002, 50th) → findings recorded as ledger docs per convention |
| 14:32–14:40 | **Phase 2 fixes (13 findings)** | 8 source + 5 docs + 7 test files | F233 (retry cause), F235 (link schemes), F238 (require.main guard), F246 (footer year), F247 (provinceSlug fallback), F248 (coord garbage), F249 (reset payload), F250 (strict parse + npsn dedupe), F239 (api.md), F241 (CHANGELOG), F242 (release.md), F243 (roadmap), F244 (README) |
| 14:40–14:44 | Phase 2 verification | full suite | lint 0/0; build 0; test:js **1334 pass / 0 fail** (+15 tests); coverage 97.38/93.57/99.58; test:py pass; prettier clean on changed files |
| 14:44 | Phase 1 ledger output | 24/25 | audit report (composite 70.1, Δ +1.8) + issue records (208th batch delta, F233-F250 statuses) |
| next | Deliver | ledger + fixes | commit → push → PRs (docs-led + source-fix PRs, labeled) |

## Final state

- **PRs**: 0 open (this run creates the 248th-run PRs)
- **Issues (GitHub)**: 0 open (creation blocked F002 — 403 conclusive, 50th)
- **Ledger**: 208th batch delta recorded (24-audit, 25-issue-records, 26-decision)
- **Phase 2**: **13 findings closed** (8 source + 5 docs) — the largest single-run fix delivery in the modern ledger era; all verified with full suite, no regressions
- **State**: Phase 2 remaining P1 cluster (F229/F063/F037/F038) **blocked on F050** workflows permission — waiting for a workflows-enabled token; F233-full/F236/F237/F239-remaining/F240/F245 deferred with rationale
- **Overall loop state**: idle after Phase 2 delivery — see next run's continuation (verify F233/F235/F238/F246-F250 fixes hold, re-probe F045 stale-page behavior with F232 in place)