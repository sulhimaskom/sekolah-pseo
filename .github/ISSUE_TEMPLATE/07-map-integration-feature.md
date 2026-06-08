---
name: Map Integration Feature — FEAT-003
about: Interactive school map with geolocation-based search and density visualization
title: '[FEAT-003] Add interactive school map with geolocation features'
labels: feature, P1
assignees: ''
---

## Evaluation Date

2026-06-08

## Source Gap

**docs/roadmap.md → Phase 2: Geographic Visualization (Q2 2026)**

The roadmap identifies map integration as the next high-impact feature. Schools already have latitude/longitude coordinates in the dataset, making this feasible without external data sources.

---

## User Story

As a parent or student researching schools,
I want to explore schools on an interactive map,
So that I can discover schools near my location and visually compare their geographic distribution.

---

## Acceptance Criteria

### Core Map (P0 — Must Have)

- [ ] Interactive map displays all schools as markers, clustered at lower zoom levels
- [ ] Each marker shows school name, type, and address on click (popup/info window)
- [ ] Markers are color-coded by education type (SD/SMP/SMA/SMK)
- [ ] Map supports zoom, pan, and layer toggling
- [ ] Current filter selections (province, type) are applied to map markers

### Geolocation (P1 — Should Have)

- [ ] "Find Schools Near Me" button requests browser geolocation
- [ ] Shows schools within configurable radius (5km, 10km, 20km)
- [ ] Graceful fallback if geolocation is denied or unavailable

### Performance (P1 — Should Have)

- [ ] Map loads within 2 seconds on broadband
- [ ] Marker clustering up to 5000+ points without jank
- [ ] Lazy-load map library (not in initial page bundle)
- [ ] Total JS payload for map feature < 100KB gzipped

### Accessibility (P2 — Nice to Have)

- [ ] Map is keyboard-navigable
- [ ] Screen reader announces marker information
- [ ] Text alternative available for map view (school list)

---

## Value Justification

1. **Roadmap alignment**: Map Integration is the flagship feature of Phase 2 (Geographic Visualization, Q2 2026)
2. **Data utilization**: All 3474 schools already have lat/lng coordinates — no new data collection needed
3. **User value**: Geographic discovery is the most intuitive way to explore schools; replaces tabular browsing
4. **Competitive differentiation**: Most school directories lack interactive maps
5. **Implementation feasibility**: Leaflet.js is lightweight (~40KB gzipped), open-source, and well-documented

---

## Implementation Sketch

### Technology Choices

| Concern           | Choice                                      | Rationale                                  |
| ----------------- | ------------------------------------------- | ------------------------------------------ |
| Map library       | Leaflet.js 1.9+                             | 40KB gzipped, no API key needed, OSM tiles |
| Marker clustering | Leaflet.markercluster                       | Handles 10K+ points                        |
| Geolocation       | `navigator.geolocation` API                 | Native browser API, no deps                |
| Tile source       | OpenStreetMap (default) / Mapbox (optional) | Free tier sufficient                       |

### Architecture

```
src/presenters/templates/homepage.js
  └─ Load map.js async when user clicks "Map View" tab
  └─ Pass filtered school data to map renderer

src/presenters/templates/map.js  (NEW)
  └─ initializeMap(container, schools, filters)
  └─ addMarkers(schools, colorByType)
  └─ setupGeolocation()
  └─ setupClustering()

src/presenters/styles.js
  └─ Add map-specific styles (popup, marker, cluster)
```

### Data Flow

```
#school-data JSON (already embedded)
  → Filtered by current search/filter state
  → Passed to map.js renderer
  → Leaflet markers + clustering
  → Popup with school details + link to school page
```

### No-Build Dependency Strategy

Leaflet and its plugins will be loaded via CDN with `async` scripts:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js" defer></script>
<script
  src="https://unpkg.com/leaflet.markercluster@1.5/dist/leaflet.markercluster.js"
  defer
></script>
```

This avoids adding npm dependencies and keeps the build system unchanged.

---

## Files to Modify

| File                                    | Change                                                   |
| --------------------------------------- | -------------------------------------------------------- |
| `src/presenters/templates/homepage.js`  | Add "Map View" / "List View" toggle, embed map container |
| `src/presenters/styles.js`              | Add ~100 lines of map-specific CSS                       |
| `src/presenters/templates/map.js` (NEW) | ~200 lines of Leaflet integration                        |
| `docs/roadmap.md`                       | Update FEAT-003 status to "In Progress"                  |

---

## Risks and Mitigations

| Risk                             | Likelihood | Mitigation                                          |
| -------------------------------- | ---------- | --------------------------------------------------- |
| OpenStreetMap tile rate limiting | Low        | Cache tiles via service worker, add Mapbox fallback |
| Geolocation API not supported    | Low        | Feature-detect, show manual location input          |
| Leaflet API breaking changes     | Low        | Pin to specific version (1.9.x)                     |
| Performance with 3474 markers    | Medium     | Use clustering, viewport-filtering                  |
| CSP blocks CDN scripts           | Medium     | Add CDN to CSP allowlist, or bundle statically      |
