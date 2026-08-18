# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Shared hero and index-page `<head>` components (TASK-101, PR #792) — eliminated
  verbatim duplication across province/kabupaten/kecamatan templates
- Shared school comparison tray (FEAT-005) rendered on every page type
  (`src/presenters/templates/shared/comparison.js`)

### Changed

- Shared infrastructure extracted into `src/core/` layer (TASK-094, PR #781):
  config, data-schema, fs-safe, logger, rate-limiter, resilience, slugify, utils
- Integration hardening: retry jitter, Retry-After handling, single-flight
  half-open probes, timeout-abort (TASK-100, PR #792)

### Fixed

- `monitorBuild` returned zeroed metrics report — report now generated after
  `tracker.stop()` (F231)
- Incremental-build stale pages when only lat/lon change — manifest hash now
  includes coordinates (F232)
- `EXTERNAL_DATA_DIR` command-injection vector — shell metacharacters and path
  traversal rejected before interpolation into `git clone` (F234)
- `retry()` lost original error identity — non-transient failures now preserved
  in `IntegrationError.details.cause` (F233)
- Link validator reported mailto/tel/javascript/data and protocol-relative
  links as broken — non-hierarchical schemes now skipped (F235)
- Interactive CLI ran at require time — `main()` now gated on
  `require.main === module` (F238)
- Footer copyright year became injectable for deterministic builds (F246)
- Homepage search fallback emitted `/provinsi/undefined/` — deterministic
  client-side province slug fallback added (F247)
- `hasCoordinateData` accepted garbage values via partial `parseFloat` match (F248)
- `CircuitBreaker.reset()` emitted a misleading `stateChange` payload (F249)
- Coordinate validation accepted partial numeric matches (`'12abc'`) and npsn
  was reported twice for the same defect (F250)

### Security

- Workflow security validator (`scripts/check-workflow-security.js`) enforces
  duplicate-API-key, id-token, actions-write, and GH_TOKEN rules; 12 violations
  remain at baseline — see `SECURITY_AUDIT_NOTE.md` (F037)

### Documentation

- `docs/api.md` module tree realigned with the `src/core/` move (F239)
- `docs/release.md` clarified that the release workflow is not yet present (F242)
- `docs/roadmap.md` FEAT-005 Comparison Tool marked implemented (F243)
- `README.md` workflow-validation wording corrected to reflect held violations (F244)

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
