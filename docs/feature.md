# Feature Specifications

This document tracks all features for the Sekolah PSEO project.

---

## Active Features

### [FEAT-001] Layer Separation Architecture

**Status**: Complete
**Priority**: P0

### User Story

As a developer, I want clear separation of concerns between presentation, business logic, and data layers, so that the codebase is maintainable and testable.

### Acceptance Criteria

- [x] Presentation layer separated (src/presenters/)
- [x] Service layer created (src/services/PageBuilder.js)
- [x] Controller scripts in scripts/ directory
- [x] All layers testable in isolation
- [x] Clear dependency flow: Controller → Service → Presentation

---

## Backlog

### [FEAT-002] Search Functionality

**Status**: Complete
**Priority**: P1

### User Story

As a user, I want to search for schools by name, location, or type, so that I can quickly find relevant school information.

### Acceptance Criteria

- [x] Search input on homepage with keyboard shortcut (`/` to focus, `Escape` to clear)
- [x] Filter by: name, province, city, school type
- [x] Real-time client-side search with debouncing (compact JSON payload: schools.json)
- [x] Province navigation with school counts
- [x] Mobile-responsive search interface

### Technical Notes

- Search data loaded from external `schools.json` (~877 KB, 125 KB gzipped) for 98.8% homepage size reduction
- Uses flat array format for payload efficiency with client-side conversion
- Data aggregated in a single pass via `aggregateProvinceAndFilters()` to avoid duplicate iteration

---

### [FEAT-003] Map Integration

**Status**: Draft
**Priority**: P2

### User Story

As a user, I want to see school locations on an interactive map, so that I can find schools near me.

### Acceptance Criteria

- [ ] Interactive map showing school locations
- [ ] School markers with basic info popup
- [ ] Filter map markers by school type
- [ ] Click marker to go to school page
- [ ] Map clustering for dense areas

---

### [FEAT-004] Advanced Filtering

**Status**: Draft
**Priority**: P1

### User Story

As a user, I want to filter schools by multiple criteria simultaneously, so that I can narrow down search results efficiently.

### Acceptance Criteria

- [ ] Filter by education level (SD/SMP/SMA/SMK/SLB)
- [ ] Filter by school status (Negeri/Swasta)
- [ ] Combined search + filter interface on homepage
- [ ] Filter results update in real-time with search
- [ ] Mobile-responsive filter controls
- [ ] Clear/reset all filters option

### Technical Notes

- Filter options extracted server-side via `extractFilterOptions()` in homepage.js
- Province navigation serves as a geographic filter
- Education type and status filters are derived from school data fields

---

## Template

```markdown
## [FEAT-ID] Title

**Status**: Draft | In Progress | Complete
**Priority**: P0 | P1 | P2 | P3

### User Story

As a [role], I want [capability], so that [benefit].

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```
