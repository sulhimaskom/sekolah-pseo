# Frontend Engineer - Long-term Memory

## Project Overview

This is a **static site generator** for Indonesian schools (Sekolah PSEO). The project processes school data from CSV and generates static HTML pages for each school.

## Technology Stack

- **Build**: Node.js scripts
- **Templates**: Server-side generated HTML (no framework)
- **Styling**: Plain CSS with CSS custom properties (design tokens)
- **Testing**: Node.js native test runner + Python pytest

## Frontend Architecture

### Key Files

| File                                      | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `src/presenters/design-system.js`         | Design tokens (colors, spacing, typography) |
| `src/presenters/styles.js`                | CSS generation for all pages                |
| `src/presenters/templates/school-page.js` | HTML template for school pages              |
| `src/presenters/templates/homepage.js`    | Homepage template                           |
| `src/services/PageBuilder.js`             | Page data building service                  |
| `scripts/build-pages.js`                  | Build orchestration                         |
| `public/404.html`                         | Custom error page                           |

### Generated Output

- Static HTML files in `dist/` directory
- Centralized `styles.css` file
- 3474+ school pages generated

## Past Improvements

### Remove Duplicate Require Statements (2026-02-25)

Fixed code quality issue in homepage.js by removing duplicate require statements:

1. **Removed redundant imports** - The `slugify` module was required 3 times unnecessarily
2. **Code cleanup** - Reduced from 3 require statements to 1
3. **Maintenance improvement** - Cleaner codebase, easier to maintain

### Dynamic Year in 404 Page (2026-02-25)

Fixed hardcoded year in 404.html for consistency with other pages:

1. **Changed hardcoded "2026"** - Replaced with `<script>document.write(new Date().getFullYear())</script>`
2. **Consistent with school-page.js** - Both pages now use dynamic year rendering
3. **Maintenance improvement** - No need to manually update year each year

### Custom 404 Error Page (2026-02-25)

Added a custom 404.html error page to improve user experience when navigating to non-existent pages:

1. **Created public/404.html** - Custom error page with:
   - Indonesian error message ("Halaman Tidak Ditemukan")
   - Skip link for accessibility
   - ARIA landmarks (header, main, footer)
   - Navigation links to homepage and sitemap
   - Consistent styling using design tokens from design-system
   - Dynamic year rendering

2. **Updated build script** - Added `cp -r public/* dist/` to copy static files during build

3. **SEO optimized** - Added robots noindex tag to prevent indexing of error pages

### Favicon Support (2026-02-25)

Added SVG favicon to improve brand recognition and user experience:

1. **Created favicon.svg** - Scalable vector favicon with "S" letter for Sekolah
2. **Added favicon link** - Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` to school page template
3. **Applied to all pages** - Favicon now appears on all 3474+ generated school pages

### SEO Enhancement (2026-02-25)

Added critical SEO meta tags to generated pages:

1. **Meta description** - Auto-generated from school data
2. **Open Graph tags** - For social media sharing (og:title, og:description, og:type, og:url)
3. **Canonical URL** - Prevents duplicate content issues
4. **Dynamic footer year** - No hardcoded dates

## Coding Standards

- Accessibility-first (ARIA labels, skip links, semantic HTML)
- Mobile-responsive with CSS breakpoints
- Security headers in CSP
- Schema.org structured data (JSON-LD)
- No duplicate code or imports


## Past Improvements (Continued)

### Fix Orphaned CSS Rules (2026-02-26)

Fixed CSS syntax error in `styles.js` that caused invalid CSS in the generated output:

1. **Identified the bug** - Orphaned CSS rules were present outside the `@media (prefers-reduced-motion: reduce)` block
2. **Removed invalid syntax** - Deleted 3 orphaned lines (extra closing braces)
3. **Proper rule placement** - Ensured `.back-to-top:hover` is inside the reduced motion media query
4. **CSS file size reduced** - Generated CSS went from 1045 lines to 1042 lines

This fix ensures proper CSS parsing across all browsers and correct behavior for users with reduced motion preferences.

### XSS Security Fix - Replace innerHTML with DOM APIs (2026-02-27)

Fixed security vulnerability in homepage.js search functionality:

1. **Replaced innerHTML with DOM APIs** - The search results were previously rendered using `innerHTML` which is vulnerable to XSS attacks. Now using `document.createElement()` and `textContent` which automatically escape HTML.

2. **Created safe createSchoolResultElement function** - New function uses DOM APIs:
   - `document.createElement()` for element creation
   - `textContent` property for setting text (automatically escapes HTML)
   - `appendChild()` for building the DOM tree

3. **Defense in depth** - Even if escapeHtml fails, the DOM API approach provides additional protection

VB|4. **All tests pass** - 547 tests pass including existing XSS escape tests

### Centralize 404 Page Styles (2026-02-27)

Moved inline CSS from 404.html to centralized styles.css:

1. **Added 404 styles to styles.js** - New CSS classes: `.error-container`, `.error-code`, `.error-title`, `.error-message`, `.error-actions`, `.btn`, `.btn-primary`, `.btn-secondary`

2. **Removed inline styles from 404.html** - Reduced file from 111 lines to 42 lines

3. **Consistent with other pages** - Now follows same pattern as homepage, school-page, and province-page templates

4. **Uses design tokens** - All styling uses CSS custom properties from design-system for consistency