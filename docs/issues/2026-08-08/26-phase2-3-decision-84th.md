# Phase 2/3 — Decision Record (84th run): F066 hardening applied in-loop

**Evaluation Date**: 2026-08-08
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 1 (audit) → Phase 2 → Phase 3, strict order. Phase 1
completed first; then Phase 2/3 evaluated against documented gaps.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

**Objective**: strengthen/integrate existing features; trace every action to a documented gap.

| Candidate | State | Verdict |
| --------- | ----- | ------- |
| **F066 sitemap.test.js deletes real dist artifacts** | NEW (P1) | **APPLIED — one-file fix, unblocked** (mirrored F052 temp-dir redirect). Restores F024's guarantee end-to-end (build → test → dist intact) and removes the last surviving F014-family defect. |
| Workflow security cluster (F037/F038, F056–F059) | HELD (P0/P1) | needs `workflows: write` — blocked (F050 token perimeter) |
| F063 orchestrator fictitious GH_TOKEN | HELD (P1) | needs secret/workflow write — blocked |
| F065 continue-on-error | HELD (P2) | workflow edit — blocked by F050 |
| F018 data refresh | HELD (P1) | upstream JSON-only — ETL change consumes a real fix cycle without a JSON-source contract; deferred |
| F064 lint-staged engine | HELD (P2) | `.nvmrc`=22 vs runtime v20 — CI-environment config, not a source defect |

**Decision**: F066 was the single unblocked, minimal, atomic hardening item this run —
a test-hygiene fix in `scripts/sitemap.test.js` (temp-dir redirect) with a verifiable
outcome (`npm run build && npm run test:js` → `dist/sitemap-index.xml` must survive).
**Applied in-loop**: `CONFIG.DIST_DIR` redirected to `sitemap-test-dist-${process.pid}`
immediately after loading `./config` (mirrors `build-pages.test.js` /
`build-orchestrator.test.js`). Verified: 1056/1056 JS tests pass, sitemap survives,
Prettier-clean, lint exit 0, coverage gate met. No speculative or cosmetic change made.

## Phase 3 — Strategic Expansion (Product Mode)

**Objective**: add ONE high-leverage functional capability from documented gaps (blueprint /
roadmap).

- **Gap source**: `docs/roadmap.md` → FEAT-005 "Comparison Tool" already fully specified in
  the 81st-run record (`docs/issues/2026-08-08/16-phase3-feat005-comparison-tool.md`):
  user story, acceptance criteria, value justification, implementation sketch.
- **Contract constraint (§2)**: never create duplicate issues. FEAT-005 already recorded —
  creating a new Phase-3 proposal would duplicate it. No new feature is warranted while the
  one candidate remains unimplemented and unblocked.
- **No Phase-3 issues created** this run.

## Action log (UTC)

| Time | Action | Target | Result |
| ---- | ------ | ------ | ------ |
| 12:36 | Phase-2 scan | F066 NEW + F037/F038, F063, F065, F018, F064 | F066 ELIGIBLE; rest blocked/held |
| 12:37 | F066 fix | scripts/sitemap.test.js | DIST_DIR → temp dir (F052 pattern) |
| 12:37 | F066 verify | build → test:js → ls dist/ | sitemap SURVIVES; 1056/1056 pass |
| 12:38 | full gate | lint + python + coverage | lint 0; 27/27; gate met |
| 12:38 | Phase-3 scan | roadmap FEAT-005 | already recorded — no duplicate |
| 12:38 | docs write | 24–26 records under docs/issues/2026-08-08/ | audit + records + decision |

## Final state

- Active phase: Phase 1 completed (AUDIT) → Phase 2 hardening **applied (F066)**; Phase 3
  evaluated — no new item (FEAT-005 already recorded).
- Overall final status: **idle — PR delivery follows** (F066 fix + docs records).
- Blocked: F002 (issue create), F050 (workflow edits), F018 (data refresh). Fail-safe
  respected — nothing destructive or speculative performed.
