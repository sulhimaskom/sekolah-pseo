# Phase 3 Strategic Expansion: FEAT-003 Interactive School Map

**Proposal Date**: 2026-07-11
**Phase**: Phase 3 (Strategic Expansion)
**Category**: feature
**Priority**: P2

---

## Executive Summary

Implement an interactive map of all 3,474 Indonesian schools using Leaflet.js + OpenStreetMap tiles. This is the highest-priority unstarted feature from the project roadmap (Phase 2: Geographic Visualization in `docs/roadmap.md`). The data infrastructure (coordinates for all schools) is already in place — this feature unlocks it visually.

---

## User Story

**As a** parent or student researching schools in an unfamiliar area,
**I want** to see all schools displayed on an interactive map with location markers,
**so that** I can visually identify nearby schools, compare geographic distribution, and navigate to school details — without needing to know the school name in advance.

---

## Value Justification

### 1. Strategic Alignment
- Directly implements **Phase 2: Geographic Visualization** from `docs/roadmap.md`
- The ONLY roadmap phase whose features are all currently unstarted
- High visibility feature that demonstrates product maturity

### 2. Existing Infrastructure (Zero New Dependencies)
- **Coordinates ready**: 100% of schools have lat/lon (validated by `hasCoordinateData()` in utils.js)
- **Flat array search data**: `schools.json` (877KB) already generated at build time — GeoJSON would add ~0.5MB
- **No backend required**: Static GeoJSON generated at build time, served alongside HTML
- **No API keys**: OpenStreetMap tiles + Leaflet.js are free and open-source

### 3. User Impact
- **Visual discovery**: Map is the #1 requested feature for school directories
- **Mobile-ready**: Leaflet + OSM tiles work on all devices
- **Progressive enhancement**: Site works fully without JS; map enhances experience
- **SEO benefit**: School location data in structured format improves local search relevance

### 4. Build Impact
- GeoJSON generation: negligible (<100ms, data already in memory during build)
- Output size: ~0.5MB additional (parallel to schools.json)
- No network requests at build time
- No CDN/config changes required

---

## Acceptance Criteria

### MVP (Must Have)

- [ ] **AC1**: Generate `schools.geojson` during build with all school locations as FeatureCollection
- [ ] **AC2**: Render interactive Leaflet map on homepage (below or beside search results)
- [ ] **AC3**: School markers with popup showing name, education type, and link to school page
- [ ] **AC4**: Click marker navigates to school detail page
- [ ] **AC5**: Map works with JavaScript disabled site-wide (graceful degradation — map doesn't render, core search still works)
- [ ] **AC6**: Mobile-responsive map container (full-width on mobile, constrained on desktop)
- [ ] **AC7**: All 3,474 markers render without performance issues (test on mid-range mobile)

### Enhancement (Post-MVP, documented for future)

- [ ] Filter map markers by school type (SD/SMP/SMA/SMK) using existing filter UI
- [ ] Marker clustering for dense areas (Jakarta: 500+ schools)
- [ ] Geolocation "Schools Near Me" button
- [ ] Province-level map views on province pages

---

## Technical Approach

### Build-time Data Generation

Add a `generateSchoolGeoJson()` function to the build pipeline that produces:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [106.8456, -6.2088]
      },
      "properties": {
        "npsn": "12345678",
        "nama": "SDN Contoh Jakarta",
        "bentuk_pendidikan": "SD",
        "status": "N",
        "url": "/provinsi/dki-jakarta/kabupaten/..."
      }
    }
  ]
}
```

### Client-side Rendering

```html
<!-- Leaflet CSS (loaded async, non-blocking) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Map container (hidden until JS loads) -->
<div id="school-map" style="display:none" aria-label="Peta lokasi sekolah"></div>

<!-- Leaflet JS + init (loaded at bottom of body) -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // Fetch schools.geojson, init map, add markers
</script>
```

### Files to Modify

| File | Change |
|------|--------|
| `scripts/build-pages.js` | Add `generateSchoolGeoJson()` step to `prepareBuildEnvironment()` |
| `src/presenters/templates/homepage.js` | Add map container div + Leaflet scripts to homepage HTML |
| `scripts/build-performance.js` | Add GeoJSON generation to budget tracking (if budgets applied) |

### Files to Create

| File | Purpose |
|------|---------|
| `src/presenters/templates/shared/map-init.js` | Shared Leaflet initialization + GeoJSON loading logic |

---

## Implementation Plan

### Step 1: GeoJSON Generation (30 min)
- Add `generateSchoolGeoJson(schools)` to `build-pages.js`
- Filter to only schools with valid coordinates (lat != 0, lon != 0)
- Output to `dist/schools.geojson`

### Step 2: Homepage Integration (45 min)
- Add map container div with conditional CSS (hidden → visible on JS load)
- Append Leaflet CSS `<link>` in `<head>` (with `media="print" onload="this.media='all'"` for non-blocking)
- Append Leaflet JS + init script before `</body>`

### Step 3: Performance & QA (30 min)
- Verify build time impact (<100ms added)
- Test on mobile viewport (320px width)
- Test with JS disabled (no map, but site works)
- Test marker click navigation

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OSM tile rate limiting (dev/test) | Low | Medium | Use local tiles for dev; MapTiler free tier for production |
| 3,474 markers on mobile | Medium | Medium | Add marker clustering in post-MVP; defer heavy rendering |
| Leaflet CDN availability | Low | Medium | Bundle Leaflet CSS/JS (~40KB gzipped) or use multiple CDN fallbacks |
| Build time regression | Low | Low | Data already in memory; GeoJSON serialization is O(n) |
| Accessibility (screen reader on map) | Medium | Medium | Provide fallback text description; ARIA labels on map container |

---

## Success Metrics

- Map interaction rate: >25% of homepage visitors interact with map
- Click-through from map to school page: >15%
- Mobile map usability: 80+ on Lighthouse
- Build time increase: <100ms (target: no measurable regression)
- Zero new build dependencies

---

## Out of Scope

- School-to-school routing/directions
- Heatmap layers
- Custom map tile hosting
- Offline map support
- Real-time location tracking
