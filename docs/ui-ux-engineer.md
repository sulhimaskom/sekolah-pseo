# UI/UX Engineer - Long Term Memory

## Project: Sekolah PSEO

Static site generator for Indonesian school pages.

## Repository Structure

- `src/presenters/design-system.js` - Design tokens (colors, typography, spacing, shadows)
- `src/presenters/styles.js` - CSS generation for school pages
- `src/presenters/templates/school-page.js` - HTML template for school pages
- `src/presenters/templates/homepage.js` - Homepage template with province listing

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
- Homepage-specific styles (hero, stats, province list)

### HTML Templates

- Proper semantic HTML structure (header, main, article, section, footer)
- ARIA labels and roles for accessibility
- Schema.org structured data (JSON-LD)
- Security headers in CSP

## Completed Improvements (Feb 2026)

### 1. Homepage/Index Page ✅

- Created homepage template with province listing
- Shows total schools and province count
- Provides clear navigation to provinces
- Responsive design with mobile support
- Dark mode support

### 2. Dark Mode Support ✅

- Added prefers-color-scheme media query
- Added dark mode color tokens in design-system.js
- Complete dark mode CSS in styles.js

### 3. Badge Colors ✅

- Lines 170-188 in styles.js use CSS variables
- Consistent with design tokens

### 4. Focus-Visible Styles ✅

- Lines 91-103 implement proper :focus-visible
- Keyboard accessible navigation

### 5. Print Styles ✅

- Added @media print for better printing
- Hides navigation, optimizes layout for print
- Ensures readable output on paper

### 6. Back to Top Button ✅

- Added floating back-to-top button to both homepage and school pages
- Button appears after scrolling 300px down
- Smooth scroll-to-top animation on click
- Full accessibility: ARIA labels, focus-visible styles, keyboard accessible
- Dark mode support via prefers-color-scheme
- Respects prefers-reduced-motion for accessibility
- Mobile responsive sizing (48px desktop, 40px mobile)

### 7. Fix Duplicate HTML Structure ✅

- Found and fixed duplicate HTML closing tags in both school-page.js and homepage.js
- Removed duplicated footer and body/html closing tags
- Bug caused invalid HTML output
- All tests pass after fix

### 8. prefers-reduced-motion for Back to Top Button ✅

- Fixed accessibility issue where back-to-top button scroll behavior didn't respect prefers-reduced-motion
- Changed from inline onclick to proper addEventListener with window.matchMedia check
- Uses 'auto' behavior when user prefers reduced motion, 'smooth' otherwise
- Applied to both school-page.js and homepage.js templates
- Completes the accessibility support that CSS transitions already had

### 9. Province Listing Pages ✅

- Identified broken navigation: homepage linked to /provinsi/{slug}/ but pages didn't exist
- Created province-page.js template with kabupaten/kota listing
- Added province page generation to PageBuilder.js and build-pages.js
- Pages now generate at /provinsi/{slug}/index.html during build

### 10. Remove Duplicate Meta Tags ✅

- Fixed duplicate meta tags in all three HTML templates
- Removed duplicate theme-color, X-XSS-Protection, and title tags
- homepage.js: Removed duplicate theme-color (light mode) and duplicate meta block
- school-page.js: Removed duplicate theme-color (light mode)
- province-page.js: Removed duplicate entire meta tags block
- Improves HTML output cleanliness and follows HTML best practices

### 11. Fix Corrupted Template Markers ✅

- Fixed corrupted edit tool markers (#QH|, #SN|, #VP|, #YV|, #VK|, etc.) appearing in generated HTML
- Affected files: school-page.js, homepage.js, province-page.js
- These markers were being output as literal text in the HTML
  TQ|- Build and tests pass after fix
  YR|

### 12. Fix Broken Navigation - Missing Kabupaten and Kecamatan Pages ✅

- Identified critical UX bug: province pages linked to non-existent `/kabupaten/` pages
- Province page linked to `/provinsi/{slug}/kabupaten/{kabSlug}/` but no template existed
- Also fixed: search results linked to province pages instead of school pages
- Created `kabupaten-page.js` template for kabupaten/kota listing
- Created `kecamatan-page.js` template for kecamatan listing with school links
- Updated homepage.js to include full path data (kabKotaSlug, kecamatanSlug, schoolUrl)
- Fixed search result links to point directly to school pages
- Added CSS styles for `.school-link-badges` class
- Navigation now works: Province → Kabupaten → Kecamatan → School

### 13. Fix Search Results Linking ✅

- Search results were linking to province pages instead of individual school pages
- Updated `prepareSchoolDataForSearch()` to include full path information
- Now includes: provinceSlug, kabKotaSlug, kecamatanSlug, namaSlug, and schoolUrl
- Search results now link directly to school pages: `/provinsi/{prov}/kabupaten/{kab}/kecamatan/{kec}/{npsn}-{slug}.html`

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
