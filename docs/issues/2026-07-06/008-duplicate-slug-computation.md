# Phase 2 - Hardening: Duplicate Slug Computation Across Modules

**Category**: refactor | **Priority**: P3
**Evaluation Date**: 2026-07-06
**Phase**: Phase 2 (Feature Hardening & Integration)

## Description

Slug computation logic is duplicated across multiple modules instead of being centralized. `PageBuilder.js` already provides `getSchoolRelativePath()` which computes all slugs, but other modules bypass it.

### Locations with Duplicate Slug Logic
1. `src/services/PageBuilder.js` — `getSchoolRelativePath()` (centrally computes provinsi, kab_kota, kecamatan, nama slugs)
2. `src/services/PageBuilder.js` — `getUniqueDirectories()` (recomputes provinsi, kab_kota, kecamatan slugs independently)
3. `src/services/PageBuilder.js` — `getUniqueProvinces()` (recomputes province slugs)
4. `src/presenters/templates/province-page.js` — `generateProvincePageHtml()` (computes provinceSlug via direct slugify call)

### Impact
- **Low**: All implementations use the same slugify module, so results are identical
- **Medium**: If slugify logic changes (e.g., locale support), all locations must be updated
- **Low**: Performance impact is negligible due to slugify caching

### Evidence
- PageBuilder.js lines 104-106, 144, 179: duplicate slugify() calls for same school fields
- `province-page.js` line 69: direct slugify call instead of using PageBuilder

### Recommendations
1. Have `getUniqueDirectories()` and `getUniqueProvinces()` also use `getSchoolRelativePath()` internally
2. Pass pre-computed slugs through the data pipeline instead of recomputing
3. Extract a `SlugCache` class that maps (field, value) → slug for cross-module sharing
