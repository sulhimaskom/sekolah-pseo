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

**Status**: Draft
**Priority**: P1

### User Story

As a user, I want to search for schools by name, location, or type, so that I can quickly find relevant school information.

### Acceptance Criteria

- [ ] Search input on homepage
- [ ] Filter by: name, province, city, school type
- [ ] Real-time search results
- [ ] Pagination for large result sets
- [ ] Mobile-responsive search interface

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
