# Phase 3: Strategic Expansion Proposal

**Date**: 2026-07-30
**Proposed Feature**: FEAT-003 — Interactive School Map Integration
**Source**: docs/roadmap.md (Phase 2, Q2 2026)

---

## User Story

As a **parent or student researching schools**,
I want to **see all schools on an interactive map**,
So that **I can quickly identify schools near my location and understand their geographic distribution**.

---

## Acceptance Criteria

1. **Map Display**: Full-width interactive map on homepage with school pins
2. **Clickable Pins**: Shows school name, type, status, and link to school page
3. **Search Integration**: Map pins update when search/filter is applied
4. **Province View**: Province pages show filtered map
5. **Clustering**: Nearby schools clustered when zoomed out
6. **Responsive**: Touch-friendly on mobile
7. **No API Keys**: Free, open-source (Leaflet + OpenStreetMap)

---

## Technical Approach

### Library: Leaflet.js (free, open-source, no API key)
- Map tiles from OpenStreetMap
- Data from existing `schools.json` (flat array, 128KB gzipped)
- Clustering via Leaflet.markercluster plugin

### Integration Points
- `src/presenters/templates/homepage.js` — map container + initialization
- `src/services/PageBuilder.js` — build GeoJSON alongside schools.json
- `src/presenters/styles.js` — Leaflet container styles

## Category: feature
## Priority: P2
