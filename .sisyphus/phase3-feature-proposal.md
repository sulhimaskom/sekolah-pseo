# Phase 3 — Strategic Expansion: School Comparison Tool (FEAT-005)

**Date**: 2026-08-04 (updated — supersedes 2026-05-30 autocomplete proposal, which
was delivered as FEAT-002 in commit `46e2b0b` on 2026-06-08)
**Source Gap**: docs/roadmap.md:50-53 → FEAT-005 "Comparison Tool" (deferred)

---

## User Story

As a parent evaluating multiple school options,
I want to compare up to 3 schools side-by-side,
So that I can make an informed enrollment decision without juggling multiple tabs.

---

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

---

## Value Justification

1. **Decision support** (roadmap Phase 1 goal "improve user ability to find relevant
   schools"): side-by-side comparison directly reduces the effort of shortlisting
   schools — the natural next step after search/filter (FEAT-002/FEAT-004).
2. **No new dependencies or data pipeline work**: school data is already embedded in
   every page (`#school-data` JSON); the comparison is a pure front-end composition
   of existing fields. Low blast radius, fully static-site compatible.
3. **Engagement**: increases pages-per-session (comparison flow touches 3-4 school
   pages), supporting roadmap engagement goals.
4. **Deferred in roadmap with no technical blocker** — the only reason it was
   deferred was scope prioritization, not feasibility.

---

## Implementation Sketch

### Data

Reuse the per-school schema from `src/services/PageBuilder.js` / `data-schema.js`.
A comparison payload can be built client-side from `#school-data` on each page.

### New module

- `src/presenters/templates/shared/comparison.js` — tray state (localStorage),
  add/remove/limit-3 logic, table renderer.
- Injected into the shared `footer`/`navigation` components so the tray is present on
  all pages (compare button per school page + tray widget in the shared shell).

### Styles

- `src/presenters/design-system.js` tokens (existing variables)
- `src/presenters/styles.js` — tray + responsive table styles

### Pages

- Comparison view can be a client-rendered overlay/section (static-site safe) reading
  from localStorage — no new build-time page required. If server-rendered table is
  preferred, `scripts/build-pages.js` can emit `/bandingkan/index.html` from selected
  NPSNs via query string — deferred decision; client-render is the minimal path.

---

## Risk Assessment

| Risk                          | Mitigation                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------- |
| localStorage unavailability   | Graceful fallback: no tray persistence, single-session comparison only          |
| Large school count rendering  | Max 3 rows; data already in memory; table is trivial DOM                        |
| Screen reader confusion       | ARIA table semantics + live region on tray add/remove                           |
| Styling conflicts             | Use existing design-system tokens; tray z-index layered below nav               |

---

## Files Affected (estimate)

- `src/presenters/templates/shared/navigation.js` / `footer.js` — tray mount point
- `src/presenters/templates/shared/comparison.js` (new)
- `src/presenters/templates/school-page.js` — "Bandingkan" button
- `src/presenters/styles.js` — tray + table CSS
- `src/presenters/design-system.js` — comparison tokens (if any)

---

## Status (2026-08-04 — ULW Loop, 42nd run)

**Status**: 🟡 Proposed — issue record created (docs/issues/2026-08-04/19-phase3-FEAT-005-comparison-tool.md)
**Blockers**: F002 (no `issues: write` — GitHub issue not created, docs record
shipped instead); F050 (no `workflows: write` — CI workflow cannot be updated, but
this feature is front-end only and does not require workflow changes)
**Recommended execution**: after F037/F038 + F039–F044 security hardening is applied
(Phase 2 debt), per the scoring ledger's prioritization.
