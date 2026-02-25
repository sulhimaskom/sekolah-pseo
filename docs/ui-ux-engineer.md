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

### HTML Templates
- Proper semantic HTML structure (header, main, article, section, footer)
- ARIA labels and roles for accessibility
- Schema.org structured data (JSON-LD)
- Security headers in CSP

## Identified Improvements

### 1. Dark Mode Support (HIGH PRIORITY)
- Currently missing prefers-color-scheme support
- Need to add dark mode color tokens in design-system.js
- Need to add @media (prefers-color-scheme: dark) styles

### 2. Hardcoded Badge Colors (MEDIUM)
- Lines 166-179 in styles.js have hardcoded hex colors
- Should use CSS variables for consistency and dark mode support

### 3. Focus-Visible Styles (MEDIUM)
- Only has :focus styles, should add :focus-visible for better keyboard UX

## Testing
- `npm run test:js` runs comprehensive tests for styles and design-system
- Tests verify CSS output, design tokens, accessibility features

## Skills Available
- playwright: Browser automation
- frontend-ui-ux: UI/UX design and implementation
- git-master: Git operations
- dev-browser: Browser interactions

## Notes
- Project uses CommonJS (no ES modules)
- No frontend framework - vanilla CSS generation
- Tests are comprehensive and should pass after changes
