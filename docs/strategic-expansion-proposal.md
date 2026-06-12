# Strategic Expansion Proposal — FEAT-004: Advanced School Filtering

**Phase:** Phase 3 — Strategic Expansion
**Evaluation Date:** 2026-06-11
**Status:** Proposed (issue creation blocked by GH token)

---

## Value Justification

The homepage currently supports text search and province dropdown filtering (FEAT-002). However, users cannot filter by:

- **Education level** (SD/SMP/SMA/SMK/SLB etc.)
- **School status** (Negeri/Swasta)

This limits the discoverability of schools. A parent looking for "SMA Negeri di Jakarta" must browse through all SMA results manually. Adding these two filters would reduce search time from ~30 seconds to under 5 seconds for the most common query patterns.

**Alignment with Roadmap:** This implements FEAT-004 from `docs/roadmap.md` (Phase 1: Enhanced Discovery). It builds directly on FEAT-002's search infrastructure.

---

## User Story

> As a **parent or student** searching for schools,
> I want to **filter search results by education level (SD/SMP/SMA/SMK) and school status (Negeri/Swasta)**,
> So that I can **quickly find schools that match my specific educational needs without scrolling through hundreds of irrelevant results**.

---

## Acceptance Criteria

### Filter UI

- [ ] Two new dropdown filters on the homepage: "Jenjang" (education level) and "Status" (Negeri/Swasta)
- [ ] Filters are placed alongside the existing province filter below the search bar
- [ ] Dropdown options are populated dynamically from available data
- [ ] "Semua" (All) default option for each filter
- [ ] Mobile-responsive layout (filters stack vertically on small screens)

### Filter Logic

- [ ] Filters work independently and in combination with text search
- [ ] Selecting "SD" in Jenjang filter shows only SD-level schools
- [ ] Selecting "Negeri" in Status filter shows only public schools
- [ ] Combining text search + province + jenjang + status narrows results correctly
- [ ] Filtering is client-side (no page reload) using the existing `schools.json`
- [ ] Results update in real-time as filters change

### Accessibility

- [ ] All filter controls have proper ARIA labels
- [ ] Filter dropdowns are keyboard-navigable
- [ ] Screen reader announces filter changes
- [ ] High contrast mode support

### Performance

- [ ] Filter operations complete in < 50ms on mid-range devices
- [ ] No additional network requests (uses existing `schools.json` data)
- [ ] No layout shift when filters load

---

## Technical Approach

### Data

The existing `schools.json` already contains `bentuk_pendidikan` and `status` fields for each school. No backend changes needed.

### UI Changes

Modify `src/presenters/templates/homepage.js`:

1. Add "Jenjang" dropdown: extract unique `bentuk_pendidikan` values from school data
2. Add "Status" dropdown: extract unique `status` values (N/S), display as Negeri/Swasta

### Filter Logic

Extend the existing `filterSchools()` function in `src/presenters/templates/homepage.js` to accept `jenjang` and `status` parameters alongside existing `searchTerm` and `provinsi` parameters.

### Build

- Homepage regeneration already happens on every build (aggregate data changes)
- The `schools.json` is already exported with all required fields

---

## Out of Scope

- Multi-select filters (Phase 2 feature)
- Sort controls (alphabetical, by rating, etc.)
- Pagination of search results
- Visual indicators (badges, icons) for filter selections

---

## Labels

- **Category:** `feature`
- **Priority:** `P2` (enhances existing search feature, not critical)

---

## Dependencies

None — builds entirely on existing FEAT-002 search infrastructure and `schools.json` data export.
