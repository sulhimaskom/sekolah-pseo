---
name: Search Autocomplete Feature
about: Implement autocomplete suggestions in the school search box
title: "[FEAT-002] Add autocomplete suggestions to school search"
labels: feature, P2
assignees: ''
---

## User Story

As a parent searching for schools,
I want to see autocomplete suggestions as I type in the search box,
So that I can quickly find my target school without typing the full name or navigating results manually.

## Acceptance Criteria

- [ ] As the user types in the search box, a dropdown list of matching school suggestions appears within 300ms
- [ ] Suggestions are filtered by the currently selected province and type filters
- [ ] Each suggestion shows: school name, type (SD/SMP/SMA/etc.), and location (kab_kota)
- [ ] The user can navigate suggestions with keyboard (arrow keys, Enter, Escape)
- [ ] Clicking or pressing Enter on a suggestion navigates to the school's page
- [ ] No external dependencies — uses the already-embedded `#school-data` JSON
- [ ] Works on mobile (touch-friendly, properly sized)
- [ ] Falls back to current search behavior if JavaScript fails
- [ ] Accessible: ARIA attributes for screen readers (combobox pattern)

## Value Justification

1. **Search completion rate** (roadmap metric: >80%): Autocomplete reduces the friction of finding a school
2. **User engagement**: Instant feedback keeps users engaged
3. **Low implementation cost**: Data already embedded in page, search logic exists
4. **No new dependencies**: Pure vanilla JS

## Technical Notes

- Source: docs/roadmap.md → FEAT-002
- Detailed proposal: `.sisyphus/phase3-feature-proposal.md`
- Data source: `#school-data` JSON already embedded in homepage
- Files: `src/presenters/templates/homepage.js`, `src/presenters/styles.js`
