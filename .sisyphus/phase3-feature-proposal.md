# Phase 3 — Strategic Expansion: Search Autocomplete

**Date**: 2026-05-30  
**Source Gap**: docs/roadmap.md → FEAT-002 "Search Functionality → Real-time search with autocomplete"

---

## User Story

As a parent searching for schools,
I want to see autocomplete suggestions as I type in the search box,
So that I can quickly find my target school without typing the full name or navigating results manually.

---

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

---

## Value Justification

1. **Search completion rate** (roadmap metric: >80%): Autocomplete reduces the friction of finding a school, directly improving the search completion rate.
2. **User engagement**: Instant feedback keeps users engaged vs. typing then waiting for results.
3. **Low implementation cost**: The school data is already embedded in the page (`#school-data` JSON). The search and filter logic already exists. Only the autocomplete dropdown UI needs to be added — ~100 lines of JavaScript and ~50 lines of CSS.
4. **No new dependencies**: Pure vanilla JS using existing data structure.

---

## Implementation Sketch

### JavaScript changes (src/presenters/templates/homepage.js)

Extend the existing search script with:

1. **Autocomplete state management**:
   - Track focused suggestion index
   - Debounce input handler (~150ms)

2. **Suggestion rendering**:
   - Filter schools by query + current filter selections
   - Render top 10 matches in a dropdown overlay
   - Show: school name (bold the matching part), type badge, location

3. **Keyboard navigation**:
   - Arrow Down: move to next suggestion
   - Arrow Up: move to previous suggestion
   - Enter: navigate to selected school
   - Escape: close autocomplete

4. **Accessibility**:
   - `role="combobox"` on input
   - `role="listbox"` on suggestions container
   - `aria-activedescendant` for focused option
   - `aria-expanded` for visibility state

### CSS changes (src/presenters/styles.js or design-system.js)

- Dropdown positioning below search input
- Selected/hover state styling
- Responsive: full-width on mobile, max-width on desktop
- Z-index layering above content
- Loading/empty state styling

---

## Risk Assessment

| Risk                          | Mitigation                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Performance with 3474 schools | Limit to top 10 suggestions; debounce input; the data is already parsed in memory |
| Screen reader confusion       | Proper ARIA combobox pattern with live region announcements                       |
| Mobile tap targets            | Minimum 44px touch targets for suggestion items                                   |
| Styling conflicts             | Use existing CSS variables from design-system.js                                  |

---

## Files Affected

- `src/presenters/templates/homepage.js` — Add autocomplete JavaScript
- `src/presenters/styles.js` — Add autocomplete CSS
- `src/presenters/design-system.js` — May need autocomplete-specific tokens
