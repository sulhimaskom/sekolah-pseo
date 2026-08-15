# Phase 2/3 — Decision Record (195th run): 0 open PRs/issues → Phase 1 audit (audit-only) + **Phase 3 FEAT-005 Comparison Tool EXECUTED**, F038 held 10/10 (36 days), pull CI 12/2/1 (44th-window opencode timeout, infra-class), F018 held at 26 days

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase
1 (audit, completed — see `119-audit-report-2026-08-15-195th.md` and
`120-issue-records-154th-batch-delta-195th.md`) → Phase 2 → Phase 3, strict
order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate                   | State                          | Verdict                                                                                                  |
| --------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| F037/F038 workflow security | HELD (P0, 96th obs)            | requires `.github/workflows/*` write — outside token grant (F050)                                        |
| F038 orchestrator checkout  | **HELD (P1, live 10/10, 36d)** | workflow write boundary — blocked (F050); newest failure window holds                                    |
| F067 husky gate swallow     | RESOLVED (P1, 194th run)       | held RESOLVED; commit gate re-verified enforcing the 12-violation baseline                               |
| F063 pull schedule          | WATCH (12/2/1, 43rd+44th win)  | both failures infra-class (11:12Z `Endpoint is unavailable`; 13:24Z opencode timeout exit 124); not code |
| F065 config validatePath    | RESOLVED (P2, 193rd run)       | held RESOLVED; regression suite 40/40 re-passing in full matrix                                          |
| F044 over-scoped secrets    | HELD (P2, 10 names, 59 refs)   | workflow edit — blocked by F050                                                                          |
| F002 issue creation         | HELD (P1, 183rd)               | token grant boundary — outside agent permissions                                                         |
| F018/F025                   | HELD (P1)                      | genuine feature cycles, deferred by contract; F018 held at 26 days (no further drift)                    |
| F019 run_tests.py dead code | HELD (P3)                      | cosmetic-cleanup class; contract forbids cosmetic-only changes                                           |
| F005 ledger prettier drift  | FLAT (P2, 99 files, 43rd run)  | cosmetic class (docs formatting); held at 99 — new files 119–121 prettier-clean at gate                  |

**Decision**: No Phase 2 execution this window. Every source-writable
non-cosmetic candidate is either already resolved (F067, F065), blocked by the
F050 token boundary (F037/F038/F044), a WATCH-only infra pattern (F063), or
cosmetic class (F019/F005 — contract forbids). This is an audit-only window.

## Phase 3 — Strategic Expansion (product mode): **FEAT-005 EXECUTED**

| Candidate                         | State    | Verdict                                                                                                                                                             |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FEAT-005 Comparison Tool**      | **EXEC** | roadmap Phase 1 deferred feature (docs/roadmap.md:50-53); pure front-end, zero new deps, no workflow write needed — **the dedicated window the 194th run reserved** |
| F018 freshness watchdog promotion | QUEUED   | data-freshness automation (docs/roadmap.md); requires data pipeline work                                                                                            |
| F025 SITE_URL parity              | QUEUED   | env parity; needs deploy-config write access                                                                                                                        |
| F011 release/tag pipeline         | QUEUED   | delivery-readiness (D-domain lowest at 49.3); requires workflows write (F050)                                                                                       |

**Why now**: The 194th decision deferred FEAT-005 explicitly — "multi-file
feature — executing it in the same window as the F067 hook fix would violate
the contract's minimal/atomic change rule. It remains queued for a dedicated
window." This 195th run is that dedicated window: audit-only, no competing
source change, full command matrix green on HEAD before the feature branch.

**User story** (docs/roadmap.md:50-53 + proposal, unchanged):

> As a parent evaluating multiple school options, I want to compare up to 3
> schools side-by-side, so that I can make an informed enrollment decision
> without juggling multiple tabs.

**Acceptance criteria** (from the proposal; executed):

- [ ] "Bandingkan" action on each school page, adding the school to a comparison tray (max 3)
- [ ] Comparison view renders selected schools side-by-side in a table
- [ ] Compared metrics: NPSN, status, bentuk, kecamatan, kab_kota, provinsi, coordinates
- [ ] Tray persisted in `localStorage` — selections survive navigation between static pages
- [ ] Duplicate selection rejected; a 4th selection blocked with a clear message
- [ ] Users can remove a school from the comparison
- [ ] Works on mobile (horizontal scroll or stacked responsive layout)
- [ ] No external dependencies — reuses embedded `#school-data` JSON + existing data schema
- [ ] Accessible: comparison table with proper headers, keyboard-operable tray, live region announcements

**Value justification**: (1) Decision support — natural next step after
FEAT-002/FEAT-004 (search/filter); (2) zero new dependencies / data pipeline
work — pure front-end composition of existing fields (school data embedded as
`#school-data` JSON per page); (3) engagement — comparison flow spans 3–4
school pages per session; (4) deferred in roadmap with no technical blocker —
scope prioritization only.

**Execution plan** (contract §6 orchestration):

1. New shared component `src/presenters/templates/shared/comparison.js` —
   tray widget HTML + client-side script (localStorage state, add/remove/limit-3,
   table renderer) — following the `back-to-top.js` generator pattern.
2. `src/presenters/templates/school-page.js` — embed `#school-data` JSON
   (script-context-safe, F047 escaping rule) + "Bandingkan" button.
3. Shared footer (`src/presenters/templates/shared/footer.js`) — inject tray +
   script so it is present on all page types (per-page persistence).
4. `src/presenters/styles.js` — tray + responsive table styles using design
   tokens (existing CSS variables).
5. Tests `scripts/comparison.test.js` + footer/school-page test updates —
   matching the established `node:test` pattern.
6. Verify: lint 0/0, build PASS, full JS suite, coverage thresholds, prettier
   clean on new files. Then commit → push → PR (single branch, synced to main).

**Not executed**: F018/F025/F011 (queued — feature cycles / blocked by F050).
No destructive actions; all changes additive and minimal-scoped to FEAT-005.

## Final state

- **Phase**: Phase 2 not executed (no source-writable non-cosmetic candidate);
  Phase 3 executed (FEAT-005 Comparison Tool, dedicated window).
- **State**: `waiting for human review` — ledger updated (154th batch delta,
  files 119–121) + FEAT-005 source implementation; next run's PR HANDLER MODE
  will merge this records PR.
