# Phase 3 - Strategic Expansion: FEAT-003 Map Integration

**Category**: feature | **Priority**: P2
**Evaluation Date**: 2026-07-12
**Phase**: Phase 3 (Strategic Expansion)

## User Story

**As a** parent looking for schools in an unfamiliar area,
**I want** to see all schools displayed on an interactive map with location markers,
**so that** I can visually identify schools near my home, compare their geographic distribution, and quickly navigate to school details.

## Value Justification

### Strategic Alignment

This feature directly addresses **Phase 2: Geographic Visualization** in the project roadmap (`docs/roadmap.md`), which is the highest-priority unstarted roadmap phase. The project already stores complete coordinate data (latitude/longitude) for all 3474 schools — this data is collected in the ETL pipeline but never presented to users in a geographic context.

### Existing Infrastructure

- **Data ready**: All 3474 schools have latitude/longitude coordinates (`hasCoordinateData()` in utils.js validates this)
- **Search/filter working**: Existing search/filter infrastructure can be extended to filter map markers
- **Static site compatible**: Can use Leaflet.js (free, no API key) with static GeoJSON data generated at build time
- **No backend needed**: All school data is pre-processed into static JSON at build time

### User Impact

- **High visibility**: Map is the #1 requested visual feature for school directories
- **Mobile-friendly**: Leaflet + OpenStreetMap tiles work well on mobile
- **Low maintenance**: Static GeoJSON data requires no server-side rendering
- **Progressive enhancement**: Map loads on top of existing search — non-JS users still have full functionality

## Acceptance Criteria

### MVP (Minimum Viable Product)

- [ ] Generate school locations as GeoJSON FeatureCollection during build
- [ ] Include interactive map on homepage below search results
- [ ] School location markers with basic info popup (name, type, link to school page)
- [ ] Click marker navigates to school detail page
- [ ] Map works without API keys (OpenStreetMap tiles via Leaflet)

### Enhancement (Post-MVP)

- [ ] Filter map markers by school type (SD/SMP/SMA/SMK) using existing filter system
- [ ] Marker clustering for dense urban areas (e.g., Jakarta with 500+ schools)
- [ ] Geolocation "Schools Near Me" button
- [ ] Province-level map views

## Technical Approach

### Build-time Data Generation

```javascript
// In build-pages.js or a new script:
// 1. Load all schools with coordinates
// 2. Generate schools.geojson at build time:
//    {
//      type: "FeatureCollection",
//      features: [{
//        type: "Feature",
//        geometry: { type: "Point", coordinates: [lng, lat] },
//        properties: { npsn, nama, jenis, status, url }
//      }]
//    }
// 3. Output to dist/ alongside schools.json
```

### Client-side Rendering

```html
<!-- On homepage, loaded conditionally -->
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<div id="school-map" aria-label="School locations map"></div>
```

### Dependencies

- **Leaflet.js** (free, open-source, no API key) — 40KB gzipped
- **OpenStreetMap tiles** (free for reasonable usage)
- Optional: `leaflet.markercluster` for clustering

### Build Impact

- GeoJSON generation: ~0.5 MB additional output
- Build time increase: negligible (data already in memory)
- No additional API calls or server infrastructure

## Risk Assessment

| Risk                                 | Likelihood | Impact | Mitigation                                       |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------ |
| OpenStreetMap tile rate limiting     | Low        | Medium | Use tile cache or switch to MapTiler (free tier) |
| Map not rendering (JS disabled)      | Low        | Low    | Progressive enhancement — site works without map |
| Mobile performance with 3474 markers | Medium     | Medium | Use clustering, only render visible markers      |
| Leaflet CDN availability             | Low        | Medium | Bundle Leaflet or use fallback                   |

## Success Metrics

- Map usage rate: > 25% of homepage visitors interact with map
- Navigation from map to school page: > 15% click-through rate
- Mobile map usability score: > 80 Lighthouse score
