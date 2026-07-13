# Phase 3 - Strategic Expansion: FEAT-007 Regional Dashboards

**Category**: feature | **Priority**: P2
**Evaluation Date**: 2026-07-12
**Phase**: Phase 3 (Strategic Expansion)
**Audit Report**: docs/audit-report-2026-07-12.md
**Roadmap**: docs/roadpoint.md → Phase 2: Geographic Visualization

## User Story

**As a** parent exploring school options in a specific province or city,
**I want** to see aggregate statistics about schools in that region (education level distribution, public/private split, school density),
**so that** I can quickly understand the education landscape and identify areas with the most options for my child's needs.

## Value Justification

### Strategic Alignment

This feature directly addresses **FEAT-007 Regional Dashboards** in the project roadmap (`docs/roadmap.md`, Phase 2: Geographic Visualization, lines 83-86). The roadmap explicitly calls for:

- Province-level statistics
- City-level school distribution
- Interactive charts and graphs

### Existing Infrastructure

- **Data ready**: All 3474 schools have provinsi, kab_kota, bentuk_pendidikan, status fields — all statistics can be pre-computed at build time
- **Province pages exist**: `generateProvincePageHtml()` already renders province pages with per-school listings
- **No backend needed**: All aggregation runs during build, outputs static JSON + enhanced HTML
- **No new dependencies**: Charts can be rendered server-side as SVG (zero client JS required) or with lightweight Chart.js

### User Impact

- **High information density**: Users get immediate insight into education options per region
- **No load time impact**: Statistics are pre-computed HTML/SVG, not API calls
- **Accessibility-friendly**: SVG charts can have aria-labels and text fallbacks
- **SEO benefit**: Statistics data in HTML improves page relevance signals

## Acceptance Criteria

### MVP (Minimum Viable Product)

- [ ] Build-time computation of per-province school statistics:
  - School count by education level (SD/SMP/SMA/SMK/SLB)
  - School count by status (Negeri/Swasta)
  - City (kab_kota) breakdown within each province
- [ ] Statistics rendered on province page as HTML tables (no client JS required)
- [ ] Statistics data also output as structured JSON (`provinsi/{slug}/stats.json`) for future client-side enhancement

### Enhancement (Post-MVP)

- [ ] SVG bar charts rendered server-side at build time showing education level distribution
- [ ] SVG pie/donut charts showing public/private split
- [ ] Top-5 most school-dense cities per province highlighted
- [ ] National-level dashboard page with all-province comparison table
- [ ] Sortable columns in statistics tables

## Technical Approach

### Build-time Data Generation (in BuildOrchestrator)

```javascript
// In prepareBuildEnvironment() or a new computeRegionalStats() step:
function computeRegionalStats(schools) {
  const stats = {
    national: { total: 0, byType: {}, byStatus: {}, byProvince: {} },
    byProvince: {},
    byCity: {},
  };

  for (const school of schools) {
    // Aggregate nationally
    stats.national.total++;
    stats.national.byType[school.bentuk_pendidikan] =
      (stats.national.byType[school.bentuk_pendidikan] || 0) + 1;
    stats.national.byStatus[school.status] = (stats.national.byStatus[school.status] || 0) + 1;

    // Aggregate by province
    const prov = school.provinsi;
    if (!stats.byProvince[prov]) {
      stats.byProvince[prov] = { total: 0, byType: {}, byStatus: {}, cities: {} };
      stats.national.byProvince[prov] = (stats.national.byProvince[prov] || 0) + 1;
    }
    stats.byProvince[prov].total++;

    // Aggregate by city within province
    const city = school.kab_kota;
    if (!stats.byProvince[prov].cities[city]) {
      stats.byProvince[prov].cities[city] = { total: 0, byType: {}, byStatus: {} };
    }
    stats.byProvince[prov].cities[city].total++;
    stats.byProvince[prov].cities[city].byType[school.bentuk_pendidikan] =
      (stats.byProvince[prov].cities[city].byType[school.bentuk_pendidikan] || 0) + 1;
    stats.byProvince[prov].cities[city].byStatus[school.status] =
      (stats.byProvince[prov].cities[city].byStatus[school.status] || 0) + 1;
  }

  return stats;
}
```

### Province Page Enhancement

```javascript
// In generateProvincePageHtml() or a new generateProvinceDashboardHtml():
function generateProvinceDashboardHtml(provinceName, stats) {
  const { total, byType, byStatus, cities } = stats;
  // Render HTML table + optional SVG charts
  return `
    <section class="dashboard" aria-label="Regional statistics">
      <h2>Statistik ${escapeHtml(provinceName)}</h2>
      <p>Total sekolah: ${total}</p>
      <table class="stats-table">
        <caption>Distribusi jenjang pendidikan</caption>
        <thead>...</thead>
        <tbody>...</tbody>
      </table>
    </section>
  `;
}
```

### Build Impact

| Metric      | Impact                                                 |
| ----------- | ------------------------------------------------------ |
| Build time  | +10-20ms (single O(n) pass over schools array)         |
| Output size | +~50KB stats JSON, +~2KB per province HTML             |
| Memory      | Negligible (statistics object ~500KB for 3474 schools) |

## Out of Scope

- Interactive client-side charts (post-MVP)
- City-level dashboard pages (future enhancement)
- Historical trend data (not collected)
- School ranking or scoring

## Success Metrics

- Province page depth (users scrolling past school list to statistics): > 40%
- Statistics JSON API consumption: > 10% of page views
- Time-on-page increase for province pages: > 20%
