# Phase 3 — Strategic Expansion: FEAT-006 Location-Based "Schools Near Me"

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — record persisted per
> repo convention (finding 002, 24th consecutive block).
> **Evaluation date**: 2026-08-02
> **Labels**: `feature`, `P1`
> **Phase**: Phase 3 — Strategic Expansion (Product Mode)
> **File affected**: `src/presenters/templates/homepage.js`, `src/services/PageBuilder.js`, new `near-me` module

---

## Roadmap Gap

`docs/roadmap.md` Phase 2 (Geographic Visualization, milestone target **2026-09**) lists three
features: FEAT-003 Map Integration (proposed, see `docs/issues/2026-07-12/011-...`),
FEAT-006 Location-Based Features, FEAT-007 Regional Dashboards (proposed 2026-07-12).
**FEAT-006 is the only Phase 2 feature with no proposal and no implementation.** It also
directly supports the Phase 2 success metric "`Near Me` feature usage: > 20%".

---

## User Story

> **As a** parent or student researching schools in an unfamiliar neighborhood,
> **I want** to find schools within a chosen radius (5/10/20 km) of my location,
> **so that** I can shortlist nearby schools without knowing their names or province first.

---

## Acceptance Criteria

### Data & Distance (core)

- [ ] New `scripts/geo.js` module implements haversine distance between two lat/lon pairs
      (already validated per-school via `hasCoordinateData()` in `scripts/utils.js`).
- [ ] Distance calculation accuracy within 1% of reference implementations for known pairs
      (unit-tested with fixed coordinates, e.g., Jakarta–Bandung ≈ 117 km).
- [ ] Schools missing coordinates are excluded from near-me results with a count reported
      (no silent drop of data).

### UX (static-site compatible)

- [ ] "Cari Sekolah Terdekat" section on homepage: geolocation button + radius selector
      (5/10/20 km).
- [ ] Results render client-side from existing `dist/schools.json` (no new network request),
      sorted by distance, each linking to its school page.
- [ ] Graceful degradation: if geolocation is denied/unavailable, show an inline message
      ("Aktifkan lokasi untuk mencari sekolah terdekat") and keep the existing search UX.
- [ ] Mobile-responsive: radius chips + result list work on 360px viewport.
- [ ] All controls have ARIA labels; keyboard navigable (consistent with existing a11y baseline).

### Data Flow & Observability

- [ ] Build-time: a `nearMe` index (schools with coords, pre-sorted by province/kab_kota)
      emitted alongside `schools.json`; build metrics report index size.
- [ ] No build-time network calls; deterministic output (content-hash stable).
- [ ] Errors (e.g., missing schools.json) surface via existing IntegrationError/logger patterns.

### Performance

- [ ] Near-me search over the full 3,474-school dataset (post F018 restoration) completes
      in < 50 ms on mid-range devices (haversine over ≤ 3.5k records).
- [ ] No layout shift on result load; results paginated/limited to 50.

---

## Value Justification

1. **Strategic alignment**: implements the last unproposed Phase 2 roadmap item; unblocks the
   `> 20% Near Me usage` success metric; milestone target 2026-09 is 1 month out.
2. **Zero new infrastructure**: reuses existing coordinate data, `schools.json` static export,
   and the current no-backend static architecture — no API keys, no runtime services.
3. **User impact**: the #2 requested discovery pattern for school directories (after search);
   directly improves mobile UX for parents in unfamiliar areas.
4. **Build impact**: one new small module (`scripts/geo.js`) + homepage section; build-time
   cost negligible (< 10 ms) — consistent with the 27 ms full build.
5. **Risk mitigation**: pure additive capability; does not touch ETL, fetch, or build pipeline;
   full rollback = revert commit (static output).

---

## Domain score impact (expected)

- **C2 User Flow Clarity** (88/100): +6 (new discovery path)
- **B4 Scalability Readiness** (82/100): +4 (dataset-scale exercise after F018 restoration)
- **A6 Testability** (78/100): +4 (new geo module with unit tests)

---

## Final State (Phase 3)

- **Proposal created**: FEAT-006 Location-Based "Schools Near Me" (above)
- **GitHub Issues**: **blocked** — `issues: write` missing (24th consecutive 403)
- **Status**: proposal persisted as markdown per repo convention; awaiting permission fix
