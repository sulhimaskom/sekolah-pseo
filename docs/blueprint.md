# Architecture Blueprint

## Overview

Static site generator for Indonesian school directory (Sekolah PSEO).

## Tech Stack

| Component       | Technology            | Purpose                          |
| --------------- | --------------------- | -------------------------------- |
| Build System    | Node.js               | Build automation                 |
| Template Engine | Node.js (custom)      | Static site generation           |
| Data Processing | Node.js               | ETL pipeline                     |
| Resilience      | Custom implementation | Timeout, retry, circuit breaker  |
| Testing         | Node.js Test, pytest  | Test framework                   |
| Linting         | ESLint                | Code quality enforcement         |
| Design System   | Custom CSS modules    | Design tokens, responsive styles |

## Project Structure

```
sekolah-pseo/
├── src/
│   ├── presenters/              # Presentation layer
│   │   ├── templates/           # Page templates
│   │   │   ├── school-page.js       # School HTML template
│   │   │   ├── homepage.js          # Homepage HTML template
│   │   │   ├── province-page.js     # Province page HTML template
│   │   │   └── shared/
│   │   │       ├── head-meta.js     # Shared HTML head prefix
│   │   │       ├── back-to-top.js   # Shared back-to-top button
│   │   │       ├── footer.js        # Shared footer component
│   │   │       └── navigation.js    # Shared breadcrumb navigation component
│   │   ├── design-system.js     # Design tokens (colors, spacing, typography)
│   │   └── styles.js            # CSS generator and external stylesheet writer
│   └── services/                # Business logic layer
│       ├── PageBuilder.js       # Page generation service
│       ├── BuildOrchestrator.js # Build pipeline orchestration service
│       ├── SearchDataService.js # Search data artifact generation (schools.json + gzip)
│       └── ExportService.js     # Static artifact exports (styles.css, schools.csv)
├── scripts/                     # Controllers/Orchestrators
│   ├── build-pages.js           # Page build controller (full + incremental)
│   ├── build-performance.js     # Build performance profiling
│   ├── check-freshness.js       # Data freshness check
│   ├── check-workflow-security.js # GitHub Actions workflow security validation
│   ├── config.js                # Shared configuration with validation
│   ├── data-quality.js          # Data quality metrics and reports
│   ├── data-schema.js           # Centralized data schema (field types, constraints, mappings)
│   ├── enrichment.js            # External data enrichment (Wikipedia)
│   ├── etl.js                   # Data ETL pipeline
│   ├── fetch-data.js            # External data fetch from GitHub
│   ├── freshness-report.js      # Detailed freshness report generation
│   ├── fs-safe.js               # Resilient file system wrappers
│   ├── interactive.js           # Interactive CLI menu
│   ├── logger.js                # Pino-based logging
│   ├── manifest.js              # Build manifest for incremental builds
│   ├── rate-limiter.js          # Rate limiting for concurrent operations
│   ├── resilience.js            # Resilience patterns (retry, timeout, circuit breaker)
│   ├── sitemap.js               # Sitemap generator
│   ├── slugify.js               # URL slug generation with caching
│   ├── utils.js                 # Utility functions (CSV, HTML, directory walk, concurrency)
│   ├── validate-links.js        # Link validation
│   └── *.test.js                # Test files
├── data/
│   └── schools.csv              # Processed school data
├── dist/                        # Generated HTML pages
│   ├── index.html               # Homepage
│   ├── styles.css               # External stylesheet
│   ├── provinsi/{slug}/         # Province pages
│   └── {path}/{npsn}-{slug}.html  # School pages
└── tests/                       # Python test files
```

## Core Components

### Data Pipeline (ETL)

- **Input**: Raw CSV (external/raw.csv)
- **Output**: Processed CSV (data/schools.csv)
- **Purpose**: Clean, normalize, and validate school data

### Page Builder

- **Input**: Processed CSV (data/schools.csv)
- **Output**: Static HTML (dist/)
- **Purpose**: Generate individual school pages, province index pages, and homepage
- **Key outputs**:
  - `dist/index.html` - Homepage with search and filtering
  - `dist/provinsi/{slug}/index.html` - Province-level index pages
  - `dist/{path}/{npsn}-{slug}.html` - Individual school pages

### Sitemap Generator

- **Input**: Generated pages (dist/)
- **Output**: sitemap.xml
- **Purpose**: SEO indexing

### Link Validator

- **Input**: Generated pages (dist/)
- **Output**: Validation report
- **Purpose**: Internal link integrity

### Incremental Build System

- **Input**: School data + previous manifest
- **Output**: Only changed pages rebuilt
- **Purpose**: Faster rebuilds by tracking content hashes per school
- **Key features**:
  - Content hash comparison detects changed records
  - Manifest persistence enables cross-session incremental builds
  - Homepage and province pages always regenerated (aggregate data)
  - Supports `--incremental` flag for targeted rebuilds

## Standards

### Code Style

- JavaScript: CommonJS (type: commonjs)
- Module system: CommonJS (module.exports/require)
- Function exports: Named exports for testing
- Error handling: IntegrationError for integration failures

### API Documentation

All internal modules have documented API contracts in `docs/api.md`:

- Function signatures with parameter types
- Return types and error conditions
- Usage examples
- Module dependencies
- Error handling patterns

### API Design Principles

- **Contract First**: All functions have clear input/output contracts
- **Self-Documenting**: Meaningful function names and parameters
- **Type Safety**: Input validation for all public functions
- **Error Consistency**: Standardized IntegrationError format
- **Idempotency**: Safe operations produce same result
- **Backward Compatibility**: No breaking changes without versioning
- Node version: Latest LTS (v20+)
- No external build tools (pure Node.js)

### Environment Variables

| Variable                     | Purpose                     | Default             |
| ---------------------------- | --------------------------- | ------------------- |
| SITE_URL                     | Base URL for sitemap        | https://example.com |
| RAW_DATA_PATH                | Raw CSV location            | external/raw.csv    |
| VALIDATION_CONCURRENCY_LIMIT | Link validation concurrency | 50                  |
| BUILD_CONCURRENCY_LIMIT      | Page build concurrency      | 100                 |
| MAX_URLS_PER_SITEMAP         | Max URLs per sitemap file   | 50000               |

### Data Schema

The data schema is defined centrally in `scripts/data-schema.js` — the single source of truth for all field definitions, types, constraints, allowed values, and validation rules.

**Schema Version**: `1.0` (defined as `SCHEMA_VERSION` in `data-schema.js`)

**Canonical Field Definitions**:

| Field               | Type   | Required | Constraints                                        | Raw Mappings                    |
| ------------------- | ------ | -------- | -------------------------------------------------- | ------------------------------- |
| `npsn`              | string | yes      | Must be numeric (`/^\d+$/`)                        | `npsn`, `NPSN`                  |
| `nama`              | string | yes      | School name                                        | `nama`, `nama_sekolah`, `Nama`  |
| `bentuk_pendidikan` | string | yes      | Allowed: SD, SMP, SMA, SMK, SLB, SDLB, SMLB, SMPLB | `bentuk_pendidikan`, `jenjang`  |
| `status`            | string | no       | Allowed: N (Negeri), S (Swasta)                    | `status`, `status_sekolah`      |
| `alamat`            | string | no       | Street address                                     | `alamat`, `alamat_jalan`        |
| `kelurahan`         | string | no       | Village/urban ward                                 | `kelurahan`, `desa`             |
| `kecamatan`         | string | yes      | District                                           | `kecamatan`                     |
| `kab_kota`          | string | yes      | City/regency                                       | `kabupaten`, `kab_kota`, `kota` |
| `provinsi`          | string | yes      | Province                                           | `provinsi`                      |
| `lat`               | string | no       | -11 to 6 (Indonesia bounds), 0 = unset             | `lat`, `latitude`               |
| `lon`               | string | no       | 95 to 141 (Indonesia bounds), 0 = unset            | `lon`, `longitude`              |
| `updated_at`        | string | no       | ISO date (YYYY-MM-DD)                              | —                               |

**CSV Column Order** (defined in `CSV_FIELD_ORDER`): `npsn, nama, bentuk_pendidikan, status, alamat, kelurahan, kecamatan, kab_kota, provinsi, lat, lon, updated_at`

**Schema Design Principles**:

1. **Centralized Definition**: All field types, constraints, allowed values, and mappings live in `data-schema.js`.
2. **Backward Compatibility**: The `schema_version` field is tracked for future schema evolution; CSV output format remains stable.
3. **Categorical Validation**: Fields with `allowedValues` are validated at the ETL boundary — invalid values are rejected with descriptive error messages.
4. **Coordinate Integrity**: Latitude/longitude validated against Indonesia geographic bounds with zero-as-unset semantics.
5. **NPSN Uniqueness**: Duplicate detection runs during ETL processing with warning output.

### Data Validation

Validation is defined centrally in `scripts/data-schema.js` and applied at the ETL boundary (`scripts/etl.js`).

**Required Fields** (must be non-empty, enforced at ETL boundary):

- `npsn`: numeric string (`/^\d+$/`), unique identifier
- `nama`: school name
- `bentuk_pendidikan`: education level
- `provinsi`: province
- `kab_kota`: city/regency
- `kecamatan`: district

**Coordinate Validation**:

- Latitude: -11 to 6 (Indonesia bounds), 0 = unset
- Longitude: 95 to 141 (Indonesia bounds), 0 = unset
- Format: decimal degrees (e.g., -6.2088)

**Categorical Field Validation** (enforced at ETL boundary):

- `status`: N (Negeri/Public) or S (Swasta/Private) — invalid values rejected during ETL
- `bentuk_pendidikan`: SD, SMP, SMA, SMK, SLB, SDLB, SMLB, SMPLB — invalid values rejected during ETL

**Data Quality Metrics** (`scripts/data-quality.js`):

- Field completeness percentages per required field
- Coordinate validity (valid, missing, zero, out-of-bounds)
- NPSN uniqueness detection (duplicate groups)
- Categorical distribution analysis (province, education type, status)
- Overall quality score (weighted composite: 40% completeness, 30% coordinates, 30% uniqueness)
- Schema version tracking in quality report summary

## Patterns

### Concurrency Management

All long-running operations use concurrency limits:

- Link validation: 50 concurrent requests
- Page building: 100 concurrent operations

### Error Handling

- ETL: Log errors, skip invalid records
- Build: Fail fast, report missing fields
- Validation: Continue on failure, report all errors

### Resilience Patterns

#### Timeouts

All file system operations use timeouts to prevent indefinite blocking:

- File reads: 30 second default timeout
- File writes: 30 second default timeout
- Directory operations: 5 second default timeout
- Directory reads: 10 second default timeout

#### Retry Logic with Exponential Backoff

Transient file system errors are automatically retried:

- Max attempts: 3 for most operations
- Initial delay: 100ms
- Backoff multiplier: 2x
- Max delay: 10 seconds
- Transient errors: EAGAIN, EIO, ENOSPC, EBUSY, ETIMEDOUT

#### Circuit Breaker Pattern

Prevents cascade failures by blocking operations after repeated failures:

- File read circuit breaker: 5 failures -> open, 60s reset timeout
- File write circuit breaker: 5 failures -> open, 60s reset timeout
- States: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing recovery)
- Automatic state transitions between states

#### External Service Resilience (Integration Hardening)

External service calls (e.g., git clone/fetch) are protected with additional resilience layers:

- **Timeouts**: All `execSync` git operations use `withTimeoutSync` with a 2-minute timeout. Prevents hanging builds when external services are unresponsive.
- **Retries**: Transient git failures (network errors, server errors) are retried up to 3 times with exponential backoff (initial: 1s, max: 10s).
- **Circuit Breaker**: A dedicated `fetchCircuitBreaker` (isolated from file system breakers) opens after 3 consecutive failures, preventing repeated calls to a down external service for 120 seconds.
- **Fallback Cache**: When external fetch fails after retries, `useCachedData()` attempts to use the previously fetched data. Builds continue with stale data instead of failing entirely.

**Error classification for transient network errors:**

| Category          | Codes / Statuses                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| OS network errors | `ECONNRESET`, `ENOTFOUND`, `ECONNREFUSED`, `ECONNABORTED`, `EPIPE`, `EPROTO`, `EAI_AGAIN`, `ESOCKETTIMEDOUT` |
| HTTP status codes | `429`, `500`, `502`, `503`, `504`                                                                            |
| Text patterns     | `socket hang up`, `socket closed`, `read ETIMEDOUT`                                                          |

#### Rate Limiting

Concurrent operations are controlled with rate limiters to prevent resource exhaustion:

- Page generation: configurable limit via BUILD_CONCURRENCY_LIMIT (default: 100)
- Link validation: configurable limit via VALIDATION_CONCURRENCY_LIMIT (default: 50)
- Queue timeout: 30 seconds default for waiting operations
- Metrics: tracks total, completed, failed, rejected, throughput, success rate
- Backpressure: queues operations when limit exceeded, rejects on timeout

#### Standardized Error Format

All integration errors use `IntegrationError` with consistent structure:

```javascript
{
  name: 'IntegrationError',
  message: 'Error description',
  code: 'ERROR_CODE',
  details: { ...context },
  timestamp: 'ISO-8601'
}
```

Error codes:

- `FILE_READ_ERROR`: File reading failed
- `FILE_WRITE_ERROR`: File writing failed
- `FILE_EMPTY`: File exists but is empty
- `VALIDATION_ERROR`: Data validation failed
- `INVALID_URL`: URL format validation failed
- `INVALID_COORDINATES`: Coordinate out of Indonesia bounds
- `INVALID_INPUT`: Invalid input provided
- `CONFIGURATION_ERROR`: Configuration issue
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `TIMEOUT`: Operation exceeded time limit
- `RETRY_EXHAUSTED`: All retry attempts failed
- `CIRCUIT_BREAKER_OPEN`: Circuit breaker is blocking
- `HTTP_ERROR`: HTTP request failed
- `NETWORK_ERROR`: Network communication failure
- `EXTERNAL_SERVICE_ERROR`: External service operation failed
- `FETCH_ERROR`: Data fetch operation failed

#### File System Operations

All file system operations use resilient wrappers (`fs-safe.js`):

- `safeReadFile()` - reads with timeout, retry, and circuit breaker
- `safeWriteFile()` - writes with timeout, retry, and circuit breaker
- `safeMkdir()` - creates directories with timeout and retry
- `safeAccess()` - checks file existence with timeout
- `safeReaddir()` - lists directory contents with timeout and retry
- `safeStat()` - gets file stats with timeout and retry

## Decisions Log

| Date       | Decision                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-01-07 | Use Node.js for templating                                                                     | Custom JavaScript templates with PageBuilder service                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-01-07 | CSV over database                                                                              | Simple, portable, low overhead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-01-07 | Node.js scripts                                                                                | Cross-platform, easy to maintain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-01-07 | Implement resilience patterns                                                                  | Prevent cascading failures, handle transient errors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-01-07 | Implement layer separation (controller/service/presentation)                                   | Better separation of concerns, testability, maintainability                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-01-07 | Extract HTML templates to separate modules                                                     | Templates testable in isolation, reusable, easy to modify                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-01-07 | Create PageBuilder service layer                                                               | Business logic isolated from file I/O and presentation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-01-10 | Implement rate limiting for concurrent operations                                              | Controlled concurrency, backpressure, metrics for operations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-01-10 | Performance optimization (homepage payload, build efficiency)                                  | 15% homepage size reduction, eliminated duplicate iterations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-05-31 | Lazy-load homepage search JSON (separate schools.json)                                         | 98.8% homepage size reduction (1.3MB → 15KB), memory -9%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-31 | Lightweight path computation in manifest creation                                              | Eliminated 3474 unnecessary HTML generations for paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-05-31 | Module-level CURRENT_YEAR constants                                                            | Eliminated 3476+ redundant Date allocations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-08 | Province page pre-grouping (O(n×p) → O(n))                                                     | Pre-group schools by province once, eliminate 95% filter work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-08 | getSchoolRelativePath WeakMap cache                                                            | Cached by object reference, eliminates redundant slugify                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-06-08 | Province page skipFilter parameter                                                             | Avoids redundant per-province filtering when pre-filtered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-08 | Eliminated duplicate getUniqueProvinces call                                                   | Pre-computed provinces reused for directory creation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-05-31 | Combined province aggregation + filter extraction                                              | Reduced 3 full-school iterations to 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-06-15 | escapeHtml bounded Map cache (50K entries)                                                     | Eliminated redundant regex replacements for repeated fields across ~83K calls; ~3.3% CPU reduction during build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-06-22 | Flat array format for schools.json                                                             | 13.2% payload reduction (1010KB → 877KB) by eliminating per-object key overhead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-06-22 | Restored gzip pre-compression (schools.json.gz)                                                | Added zlib.gzipSync to writeSearchDataFile — 125KB gzip for 86% transfer reduction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-06-22 | Parallelized build finalization                                                                | saveManifest + exportSchoolsCsv run concurrently via Promise.all                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-22 | Circuit breaker isolation for bulk file writes                                                 | Added `useCircuitBreaker` option (default true); bulk page writes bypass circuit breaker to prevent cascade failures from isolated write errors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-06-22 | Province page pre-grouping (O(n) → O(n×p)) + skipFilter                                        | Added `groupSchoolsByProvince()`, `skipFilter` param in `buildProvincePageData`/`generateProvincePageHtml` — eliminates redundant per-province filtering                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-06-29 | Eliminated redundant getUniqueProvinces call in generateProvincePages                          | Derive provinces from `groupSchoolsByProvince()` Map instead of second O(n) pass — saves one full school iteration per build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-06-29 | Async gzip level 6 (was sync level 9) in writeSearchDataFile                                   | `promisify(zlib.gzip)` at level 6 — ~3x faster compression, non-blocking event loop, <2% gzip size penalty for static-served artifacts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-29 | Parallelized build-phase generation                                                            | Homepage, schools.json, and province pages run concurrently via Promise.all — reduces critical-path wall time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-29 | Integration hardening for external data fetch                                                  | Added network error codes (HTTP_ERROR, NETWORK_ERROR, EXTERNAL_SERVICE_ERROR, FETCH_ERROR), extended isTransientError for network/HTTP errors, added withTimeoutSync for sync operations, added retry+circuit-breaker+timeout for git fetch, added cached fallback when external source is unavailable                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-29 | Shared HTML head prefix module (head-meta.js)                                                  | Extracted duplicate 1.2KB security header block from 3 templates into shared HTML_HEAD_PREFIX constant — eliminates 3× copy-paste, reduces build template work, ensures consistent security headers across all page types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-29 | schools.json preload on homepage                                                               | Added `<link rel="preload" href="/schools.json" as="fetch" crossorigin="anonymous">` to homepage `<head>` — browser starts fetching search payload earlier, reducing user-perceived time-to-search                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-06-29 | Centralized data schema (data-schema.js)                                                       | Created single source of truth for field types, constraints, allowed values, and raw field mappings; 33 tests; includes schema versioning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-29 | Categorical validation in ETL pipeline                                                         | Wired up `validateCategoricalField()` for `status` (N/S) and `bentuk_pendidikan` (SD/SMP/SMA/SMK/SLB/etc.) — invalid values now rejected during ETL with descriptive error messages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-06-29 | Header-based CSV parsing in check-freshness.js                                                 | Replaced fragile index-based field access (`fields[9]`) with `parseCsv()` header-based parsing — column-order independent, field names instead of magic indices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-07-04 | Integration error standardization (manifest, PageBuilder, school-page)                         | Replaced bare `throw new Error()` with `IntegrationError` in 4 modules (PageBuilder.js: 8 sites, school-page.js: 2 sites, manifest.js: 3 sites) for consistent error types; added retry+IntegrationError to Wikipedia API enrichment fetch; silent error swallowing in manifest replaced with IntegrationError propagation                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-06 | Single-pass escapeHtml regex (scripts/utils.js)                                                | Replaced 5 chained `.replace(/[&<>"']/g)` with single `/[\&<>"']/g` + lookup object — eliminates ~415K redundant regex evaluations across ~83K calls per full build; ~5x faster escapeHtml throughput (14.8M calls/sec)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-07-06 | Fast-path bulk file write (fastWriteFile in scripts/fs-safe.js)                                | Added `fastWriteFile()` for bulk school page writes (3474 pages) that skips retry/timeout/circuit-breaker wrappers — shaves ~17% off build duration by eliminating Promise overhead per write                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-08-03 | Extract SearchDataService + ExportService from BuildOrchestrator                               | Decomposed the 556-line orchestrator (SRP violation) into focused service modules: `SearchDataService.js` owns `writeSearchDataFile()` (search payload + gzip), `ExportService.js` owns `exportSchoolsCsv()` + `writeExternalStylesFile()`. BuildOrchestrator keeps orchestration flow and re-exports the moved functions — the 21-export public interface is unchanged, so `scripts/build-pages.js` re-exports and tests keep working. Also hoisted the lazy `require('../presenters/styles')` to module level in ExportService and removed now-dead imports (zlib/promisify/gzipAsync/prepareSchoolDataForSearch/safeMkdir) from BuildOrchestrator.                                                                                                                             |
| 2026-08-03 | Precomputed search text for client-side search (homepage.js)                                   | Client-side search rebuilt a 5-concatenation + `toLowerCase()` search string per school on every keystroke (O(n) concat per keystroke). Precompute the lowercase searchable text once (`t` field) when `schools.json` loads — both flat-array and legacy object-format payloads get a uniform `map` — and reduce the `filterSchools` hot path to a single `indexOf`. Measured 4x faster keystroke handling at 3474-school scale (8.1ms → 2.0ms per 7-keystroke query burst); 200-case fuzz parity check confirms identical results.                                                                                                                                                                                                                                               |
| 2026-08-10 | Capped client-side search result rendering + DocumentFragment batching (homepage.js, TASK-081) | Every keystroke synchronously rebuilt ALL matching rows (~10 DOM nodes each, one `appendChild` per row): a broad query at 3474-school scale created 34,741 DOM nodes via 34,740 appends (14.21ms render loop). Rendering at most `MAX_RENDERED_RESULTS` (200) rows into a `DocumentFragment` and appending once cuts this to ~2,000 nodes / 1 append / ~1.3ms per keystroke (~11x) while the count label still reports the true match total. Also fixed two pre-existing defects that made the generated homepage `<script>` fail to parse in any browser (SyntaxError → entire search feature dead): template-literal `\n` collapsing to a literal newline inside the CSV string literals, and a brace imbalance in `updateSearchResults` introduced by an earlier optimization. |
| 2026-08-03 | Hoisted static back-to-top script body (school-page.js, homepage.js)                           | `generateBackToTopScript().replace('<script>','').replace('</script>','').trim()` produces a fully static string but ran per page — ~3474 template-literal + regex evaluations per full build. Hoisted to module-level `BACK_TO_TOP_SCRIPT_BODY` constant, computed once at load. Follows existing hoisting pattern (`HTML_HEAD_PREFIX`, `CURRENT_YEAR`, `T` pre-escape).                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-08-03 | Transient-failure retry on `On-Pull` step (on-pull.yml)                                        | Hourly scheduled `pull` run failed at 5m26s with model API `503 "The request queue is full"` — a transient infrastructure error, yet the bare `timeout -k 1m 90m opencode run` step had zero retry logic, so any transient API failure failed the entire run. Wrapped the step in a `while` loop (max 3 attempts, 30s/60s backoff) that retries only fast failures (elapsed < 900s) — a long-running failure (agent worked for 15+ min then died) is a genuine failure and retrying would exceed the 120-min job timeout. Exit code, timing, and per-attempt outcomes are logged to the step output.                                                                                                                                                                              |

| 2026-08-03 | Single existence probe in `validateLinksInFile` (validate-links.js, REFACTOR-011) | Link validation probed each target twice — `safeAccess()` then a nested `safeStat()` fallback inside its catch — to answer one question ("does the target exist?"). `fs.access` (F_OK) and `fs.stat` succeed/fail together on existence, so the double-probe was redundant 4-level nesting. Collapsed to a single `await safeStat(targetPath)`: stat success (regular file OR directory) → target resolves → valid link; `IntegrationError` → broken. Deliberately NOT the literal backlog suggestion (`!stat.isDirectory()` → broken), which would have flagged existing regular-file links (e.g. `styles.css`) as broken — the old `safeAccess` success path never checked `isDirectory`. Verified behavior-identical: old and new code report exactly the same broken links on the same built `dist/`. |

| 2026-08-03 | Unambiguous content-hash serialization in `computeSchoolHash` (manifest.js) | Replaced `filter(Boolean).join('|')` with length-prefixed serialization (`"<len>:<value>"` joined by `|`) so every field boundary is unambiguous — empty-string positions and fields containing `|` previously produced identical hash input for different records (e.g. `{nama:'A', alamat:'B'}` vs `{nama:'A', kecamatan:'B'}` both → `'A|B'`), which could silently skip rebuilding a changed page (stale content served). Missing fields still hash identically to empty strings (same rendered output). Bumped `MANIFEST_VERSION` 1→2 (now exported and reused by `createManifestFromSchools` in BuildOrchestrator, removing the hardcoded `version: 1` duplicate) so the existing version-gate discards old-format manifests — one safe, non-destructive full rebuild after upgrade, then incremental builds resume normally. |

| 2026-08-03 | Shared `fileExists()` utility (utils.js) — canonical existence check | Consolidated 4 inconsistent file-existence patterns into one async helper wrapping `safeAccess()`: raw `fs.existsSync` in `check-freshness.js` (×2) and `data-quality.js` (×1), try/catch-on-`safeAccess` in `manifest.js` `loadManifest`, and try/catch-on-`safeUnlink` in `manifest.js` `clearManifest`. Existence checks now consistently benefit from the standard resilience wrappers (timeout, retry, circuit breaker). |
| 2026-08-03 | Resilient async file access in check-freshness.js + data-quality.js (REFACTOR-010) | `getDataFreshness()`, `getDataQualityMetrics()`, and `data-quality.js` `main()` migrated from raw sync `fs.existsSync`/`fs.readFileSync` to `await fileExists()` + `await safeReadFile()` — these were the last data-reporting modules bypassing the established fs-safe resilience layer. Public functions are now async (returns `Promise`); CLI behavior and output formats unchanged. `freshness-report.js` `getReportData()` made async accordingly. |

| 2026-08-03 | Accessible copy feedback + clipboard fallback (school-page.js) | Copy-button "Tersalin!" tooltip was invisible to screen readers and `navigator.clipboard` failed silently over plain HTTP. Added `role="status"` + `aria-atomic="true"` to the feedback span (textContent emptied after the 2s timeout so repeat copies re-announce), a `copyTextToClipboard()` fallback via temporary textarea + `document.execCommand('copy')` for non-secure contexts, and an announced "Gagal menyalin" failure state. |
| 2026-08-03 | Remove `.search-active` dimming + `aria-busy` search loading (homepage.js) | The `.search-active` class was added on search-input focus and never removed, permanently dimming the province list to 50% opacity after first focus (also an a11y issue: dimmed but still focusable). Removed the listener and the CSS rule — the province list is already properly hidden via the `hidden` attribute while searching. Search input now starts `aria-busy="true"` (cleared on schools.json load success/failure) so assistive tech hears the loading state; the `/` shortcut no longer hijacks when a form control is focused. |
| 2026-08-03 | Dark-mode autocomplete + `color-scheme` + non-color-only active state (styles.js) | `.search-autocomplete` rendered as a light popup on dark UI (CSS vars are light-mode by default; dark mode re-maps elements). Added dark-mode overrides for the dropdown, items, name/meta, and hover/active states. Added `color-scheme: light dark` on `html` so native form controls follow the OS scheme. Active autocomplete option now gets an inset 3px primary accent (`box-shadow: inset 3px 0 0 var(--color-primary)`) so state isn't conveyed by background color alone. |
| 2026-08-10 | `SEARCH_DATA_FIELDS` single source of truth for search payload field order (IMPROVEMENT-005) | `prepareSchoolDataForSearch()` in `PageBuilder.js` returned flat arrays whose field order existed only in comments (`[0]=npsn, [1]=nama, ...`), and the client converter in `homepage.js` consumed them with index literals (`s[0]`…`s[8]`). A field reorder would silently desync server and client. Added `SEARCH_DATA_FIELDS` (9 fields: `npsn`, `nama`, `bentuk_pendidikan`, `status`, `alamat`, `kecamatan`, `kab_kota`, `provinsi`, `url` — derived, last) to `scripts/data-schema.js` as the canonical order. `PageBuilder` builds each row via `SEARCH_DATA_FIELDS.map(...)`; `homepage.js` embeds the constant as a literal in the generated client script and converts via named `SEARCH_FIELD_INDEX` lookups — no positional index literals remain. Constant lives in `data-schema.js` (not `PageBuilder.js` as the backlog suggested) because `PageBuilder` imports `homepage`, so `homepage` cannot `require()` from `PageBuilder` (circular require) — mirrors the TASK-079 precedent for `REQUIRED_SCHOOL_FIELDS`. |
| 2026-08-10 | Dedicated circuit breaker + timeout retry fix for Wikipedia enrichment (enrichment.js, Integration Hardening) | `enrichment.js` was the only external-service integration WITHOUT a circuit breaker — the fs breakers (`fs-safe.js`) only guard file I/O, so a Wikipedia outage would make every enrichment request hang 10s and retry 3× per school with no fail-fast. Added dedicated `wikipediaCircuitBreaker` (3 failures → OPEN for 120s, isolated from fs breakers, mirrors `fetch-data.js` `fetchCircuitBreaker`). Also fixed a retry-policy bug: the old `shouldRetry` returned `false` for ALL `IntegrationError`s, but `withTimeout()` rejects with an `IntegrationError` whose code is `TIMEOUT` — so timeout retries were silently disabled despite `isTransientError()` claiming timeouts are transient. New predicate retries `IntegrationError` only when `code === TIMEOUT`; parse failures (`HTTP_ERROR`) remain non-retryable. `fetchJson` + `wikipediaCircuitBreaker` exported (additive, zero breaking changes); graceful degradation (`enrichSchoolViaWikipedia` → `{}`) preserved when the circuit is open. 6 new tests: timeout retried (3 attempts), parse failure not retried (1 attempt), breaker opens after 3 failures, fail-fast without network when open, reset-on-success recovery, graceful `{}` degradation. |

> **Note**: Keep documentation in sync with implementation. When implementation changes, update the corresponding documentation immediately. Use ADRs for significant architectural changes (see `docs/adr/`).
