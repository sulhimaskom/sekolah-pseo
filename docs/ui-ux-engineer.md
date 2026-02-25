# UI/UX Engineer - Long Term Memory

## Project: Sekolah PSEO

Static site generator for Indonesian school pages.

## Repository Structure

- `src/presenters/design-system.js` - Design tokens (colors, typography, spacing, shadows)
- `src/presenters/styles.js` - CSS generation for school pages
- `src/presenters/templates/school-page.js` - HTML template for school pages

## Current State (as of Feb 2026)

### Design System

- Uses CSS custom properties (variables) for all design tokens
- Well-structured with colors, typography, spacing, border-radius, shadows, breakpoints, transitions, z-index
- Supports accessibility: prefers-reduced-motion, prefers-contrast

### CSS Styles

- Mobile-first responsive design
- Good accessibility: skip-link, sr-only class, proper ARIA roles
- Card-based layout for school information
- Definition list for school details (semantic HTML)
- Dark mode support via prefers-color-scheme
- Focus-visible styles for keyboard navigation
- Print styles for better printing experience

### HTML Templates

- Proper semantic HTML structure (header, main, article, section, footer)
- ARIA labels and roles for accessibility
- Schema.org structured data (JSON-LD)
- Security headers in CSP

## Completed Improvements (Feb 2026)

### 1. Dark Mode Support ✅

- Added prefers-color-scheme media query
- Added dark mode color tokens in design-system.js
- Complete dark mode CSS in styles.js

### 2. Badge Colors ✅

- Lines 170-188 in styles.js use CSS variables
- Consistent with design tokens

### 3. Focus-Visible Styles ✅

- Lines 91-103 implement proper :focus-visible
- Keyboard accessible navigation

### 4. Print Styles ✅

- Added @media print for better printing
- Hides navigation, optimizes layout for print
- Ensures readable output on paper

## Testing

- `npm run test:js` runs comprehensive tests for styles and design-system
- Tests verify CSS output, design tokens, accessibility features
- `npm run test:py` runs Python configuration tests

## Skills Available

- playwright: Browser automation
- frontend-ui-ux: UI/UX design and implementation
- git-master: Git operations
- dev-browser: Browser interactions

## Notes

- Project uses CommonJS (no ES modules)
- No frontend framework - vanilla CSS generation
- Tests are comprehensive and should pass after changes


### 5. Remove Orphaned Duplicate Code ✅

- Fixed `src/presenters/styles.js` - removed orphaned duplicate function definition
- The file had corrupted/duplicate code mixed with valid JavaScript
- Cleaned up 11 lines of orphaned code
- All 382 tests pass after the fix