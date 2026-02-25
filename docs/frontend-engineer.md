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

| File | Purpose |
|------|---------|
| `src/presenters/design-system.js` | Design tokens (colors, spacing, typography) |
| `src/presenters/styles.js` | CSS generation for all pages |
| `src/presenters/templates/school-page.js` | HTML template for school pages |
| `src/services/PageBuilder.js` | Page data building service |
| `scripts/build-pages.js` | Build orchestration |

### Generated Output

- Static HTML files in `dist/` directory
- Centralized `styles.css` file
- 3474+ school pages generated

## Past Improvements

### Favicon Support (2026-02-25)

Added SVG favicon to improve brand recognition and user experience:

1. **Created favicon.svg** - Scalable vector favicon with "S" letter for Sekolah
2. **Added favicon link** - Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` to school page template
3. **Applied to all pages** - Favicon now appears on all 3474+ generated school pages

### SEO Enhancement (2026-02-25)

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
