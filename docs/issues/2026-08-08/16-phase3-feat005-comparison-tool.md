# Phase 3 — Strategic Expansion: School Comparison Tool (FEAT-005) (81st run)

**Evaluation Date**: 2026-08-08
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Source Gap**: `docs/roadmap.md` Phase 1 → FEAT-005 "Comparison Tool" (deferred); prior
proposal in `.sisyphus/phase3-feature-proposal.md` (2026-08-04) — feature not yet implemented.

## User Story

As a parent evaluating multiple school options,
I want to compare up to 3 schools side-by-side,
So that I can make an informed enrollment decision without juggling multiple tabs.

## Acceptance Criteria

- [ ] A "Bandingkan" (Compare) action is available on each school page, adding the school to a comparison tray (max 3)
- [ ] A comparison page/view renders selected schools side-by-side in a table
- [ ] Compared metrics: NPSN, status (Negeri/Swasta), bentuk (SD/SMP/SMA/SMK), kecamatan, kab_kota, provinsi, coordinates
- [ ] Tray is persisted in `localStorage` so selections survive navigation between static pages
- [ ] Duplicate selection is rejected; a 4th selection is blocked with a clear message
- [ ] Users can remove a school from the comparison
- [ ] Works on mobile (horizontal scroll or stacked responsive layout)
- [ ] No external dependencies — reuses embedded `#school-data` JSON and existing data schema
- [ ] Accessible: comparison table marked up with proper headers, keyboard operable tray

## Value Justification

1. **Decision support** (roadmap Phase 1 goal "improve user ability to find relevant
   schools"): side-by-side comparison directly reduces the effort of shortlisting schools —
   the natural next step after search/filter (FEAT-002/FEAT-004).
2. **No new dependencies or data pipeline work**: school data is already embedded in every
   page (`#school-data` JSON); the comparison is a pure front-end composition of existing
   fields. Low blast radius, fully static-site compatible.
3. **Engagement**: increases pages-per-session (comparison flow touches 3–4 school pages),
   supporting roadmap engagement goals.
4. **Deferred in roadmap with no technical blocker** — the only reason it was deferred was
   scope prioritization, not feasibility.

## Implementation Sketch (from prior proposal)

- New module `src/presenters/templates/shared/comparison.js` — tray state (localStorage),
  add/remove/limit-3 logic, table renderer.
- Injected into the shared `footer`/`navigation` components so the tray is present on all
  pages (compare button per school page + tray widget in the shared shell).
- Styles via `src/presenters/styles.js` design-system tokens.

## Status

RECORDED as Phase-3 candidate for the 81st run (no implementation this run — Phase 1/2
deliverables take precedence per strict ordering; feature is a net-new capability requiring
its own focused implementation cycle). No GitHub issue created — F002 blocks `issues: write`
(403 createIssue, 77th consecutive); record ships as labeled docs.
