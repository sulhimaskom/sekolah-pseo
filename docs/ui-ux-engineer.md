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

### 14. Fix Duplicate HTML in Kabupaten Page Template ✅

- Found duplicate HTML meta tags in `kabupaten-page.js` (lines 110-114)
- Issue: `<link rel="icon">`, `<link rel="canonical">`, and `<link rel="stylesheet">` were duplicated
- Similar to issue #10 fix but this file was missed
- Removed duplicate lines to ensure valid HTML output
- Improves SEO by eliminating duplicate content in page headers
- All tests pass after fix

### 15. Component Extraction - Shared Footer and Navigation ✅

- Extracted duplicate footer HTML from 3 templates (school-page, homepage, province-page) into shared `footer.js` component
- Extracted duplicate breadcrumb navigation from 3 templates into shared `navigation.js` component
- `footer.js` supports configurable site name and extra content (e.g., CSV download link on homepage)
- `navigation.js` accepts a breadcrumb items array — last item renders as current page with `aria-current="page"`
- Both components maintain existing accessibility: `role="contentinfo"`, `aria-label="Navigasi utama"`, `aria-current="page"`, `aria-hidden="true"` separators
- Removed duplicate `CURRENT_YEAR` constants from school-page.js and province-page.js (now handled by shared footer)
- Created 16 new tests (footer.test.js + navigation.test.js) following the same pattern as back-to-top.test.js
- All 963 JS tests pass, build clean (3474 pages)

### 16. Homepage Search Accessibility & Interaction Polish ✅ (TASK-083, 2026-08-10)

- **Escape-key scoping (UX bug fix)**: Escape now only clears the search query when the search input is focused. Previously any Escape press anywhere on the page (e.g. closing a filter dropdown) reset the query AND all three filters.
- **aria-live scoping**: `aria-live="polite"` moved from the `.search-results-info` wrapper onto `#result-count` — an interactive element (CSV button) no longer sits inside a live region.
- **Filter loading state**: the three filter `<select>`s render `disabled` and are re-enabled when `schools.json` finishes loading; on fetch failure they stay disabled and the count region announces "Data pencarian gagal dimuat." (stable via a `searchFailed` flag).
- **CSV button focus**: added `.download-csv-btn:focus-visible` outline (was opacity-only).
- **Forced-colors support**: `@media (forced-colors: active)` gives search/filter inputs, the CSV button, and the active autocomplete option explicit `Highlight` outlines (box-shadow focus indicators are suppressed in Windows High Contrast).

### 17. Restore Kabupaten & Kecamatan Navigation Pages ✅ (TASK-092, 2026-08-17)

- **Critical UX bug**: every province page linked to `/provinsi/{slug}/kabupaten/{kabSlug}/` but no `index.html` was ever generated there — all kabupaten links were 404s, and the entire Province → Kabupaten → Kecamatan → School hierarchy was dead navigation. `validate-links.js` missed it because the target *directory* exists (school pages live beneath it).
- **Root cause**: `kabupaten-page.js`/`kecamatan-page.js` templates were created (commit `4246776`) but never wired into the build pipeline — they were dead code and removed in commit `26dfc78` (PR #365), leaving the province-page links dangling.
- **Recreated** `src/presenters/templates/kabupaten-page.js` and `src/presenters/templates/kecamatan-page.js`, modernized to the shared-component convention (`T` translations, `generateBreadcrumbHtml`, `generateFooterHtml`, `generateBackToTopHtml/Script`, `HTML_HEAD_PREFIX`) and fixed the original `localeCompare(a.name, a.name)` bug (self-compare → `b.name`).
- **Wired into the build**: `PageBuilder.js` gained `buildKabupatenPageData`/`buildKecamatanPageData` + O(n) groupers `groupSchoolsByKabupaten`/`groupSchoolsByKecamatan` (NUL-joined composite keys); `BuildOrchestrator.js` gained `generateKabupatenPages`/`generateKecamatanPages` (recursive `fastMkdir` pre-creation so they're safe running in parallel with school-page dir creation), both invoked in `prepareBuildEnvironment`.
- **Navigation now works end-to-end**: Homepage → Province → Kabupaten → Kecamatan → School. Full build emits 2 kabupaten pages and 2 kecamatan pages (current dataset), `validate-links.js` reports zero broken links across all 10 HTML files.
- **Verified**: 28 new template tests + 16 new builder/generator tests pass; full JS suite green; build Status: PASS.

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
