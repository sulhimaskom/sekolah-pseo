# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-31

### Added

- Initial release of Sekolah PSEO static site generator
- ETL pipeline for processing Indonesian school data from CSV
- Static HTML page generation for 3474 schools across Indonesia
- Province index pages with kabupaten/kota aggregation
- Homepage with search, filtering by province and education level
- Sitemap generator (supports up to 50000 URLs per sitemap)
- Internal link validation tool
- Incremental build support via manifest
- Data freshness checking and reporting
- Interactive CLI menu for common operations
- Resilience patterns: circuit breaker, retry with backoff, timeouts
- Rate limiting for concurrent operations
- Security headers: CSP, HSTS, XFO, etc.
- Accessibility features: ARIA landmarks, skip links, semantic HTML
- Responsive design with mobile-first CSS
- Design token system for consistent styling

### Performance

- Lazy-loaded search JSON (98.8% homepage size reduction: 1.3MB → 15KB)
- Lightweight path computation (eliminated 3474 unnecessary HTML generations)
- Module-level CURRENT_YEAR constants (eliminated 3476+ redundant Date allocations)
- Combined province aggregation + filter extraction (reduced 3 school iterations to 2)

### Security

- HSTS headers on all page types (school, province, homepage)
- Path traversal protection in config validation
- HTML escaping in all templates (XSS prevention)
- CSV formula injection prevention
- Least-privilege CI workflow permissions

### Quality

- 90.95% statement coverage (596 JS tests, 27 Python tests)
- ESLint enforcement with strict rules
- Prettier code formatting
- Pre-commit hooks for linting and formatting
