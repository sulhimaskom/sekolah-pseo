# Architecture Blueprint

## Overview

Static site generator for Indonesian school directory (Sekolah PSEO).

## Tech Stack

| Component       | Technology            | Purpose                          |
| --------------- | --------------------- | -------------------------------- |
| Build System    | Node.js               | Build automation                 |
| Template Engine | Astro                 | Static site generation           |
| Data Processing | Node.js               | ETL pipeline                     |
| Resilience      | Custom implementation | Timeout, retry, circuit breaker  |
| Testing         | Node.js Test, pytest  | Test framework                   |
| Linting         | ESLint                | Code quality enforcement         |
| Design System   | Custom CSS modules    | Design tokens, responsive styles |

## Project Structure

```
sekolah-pseo/
 ├── src/
 │   ├── presenters/         # Presentation layer
 │   │   ├── templates/      # Page templates
 │   │   │   └── school-page.js  # School HTML template
 │   │   ├── design-system.js    # Design tokens (colors, spacing, typography)
 │   │   └── styles.js          # Generated CSS with responsive design
 │   └── services/           # Business logic layer
 │       └── PageBuilder.js   # Page generation service
 ├── scripts/                # Controllers/Orchestrators
 │   ├── build-pages.js      # Page build controller
 │   ├── etl.js              # Data ETL
 │   ├── sitemap.js          # Sitemap generator
 │   ├── validate-links.js   # Link validation
 │   ├── config.js           # Shared configuration
 │   ├── utils.js            # Utility functions
 │   ├── slugify.js          # URL slug generation
 │   ├── resilience.js        # Resilience patterns (retry, timeout, circuit breaker)
 │   ├── fs-safe.js          # Resilient file system wrappers
 │   ├── rate-limiter.js     # Rate limiting for concurrent operations
 │   └── *.test.js          # Test files
 ├── data/
 │   └── schools.csv         # School data source
 ├── dist/                   # Generated HTML pages
 └── tests/                  # Test files
```

## Core Components

### Data Pipeline (ETL)

- **Input**: Raw CSV (external/raw.csv)
- **Output**: Processed CSV (data/schools.csv)
- **Purpose**: Clean, normalize, and validate school data

### Page Builder

- **Input**: Processed CSV (data/schools.csv)
- **Output**: Static HTML (dist/)
- **Purpose**: Generate individual school pages

### Sitemap Generator

- **Input**: Generated pages (dist/)
- **Output**: sitemap.xml
- **Purpose**: SEO indexing

### Link Validator

- **Input**: Generated pages (dist/)
- **Output**: Validation report
- **Purpose**: Internal link integrity

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
- Node version: Latest LTS
- No external build tools (pure Node.js)

### Environment Variables

| Variable                     | Purpose                     | Default             |
| ---------------------------- | --------------------------- | ------------------- |
| SITE_URL                     | Base URL for sitemap        | https://example.com |
| RAW_DATA_PATH                | Raw CSV location            | external/raw.csv    |
| VALIDATION_CONCURRENCY_LIMIT | Link validation concurrency | 50                  |
| BUILD_CONCURRENCY_LIMIT      | Page build concurrency      | 100                 |

### Data Schema

- Province
- City/Kabupaten
- District/Kecamatan
- School ID (NPSN)
- School Name
- School Type (SD/SMP/SMA/SMK/etc)
- Address
- Contact Information

### Data Validation

**Required Fields** (must be non-empty):

- npsn: numeric string (unique identifier)
- nama: school name
- bentuk_pendidikan: education level
- provinsi: province
- kab_kota: city/regency
- kecamatan: district

**Coordinate Validation**:

- Latitude: -11 to 6 (Indonesia bounds)
- Longitude: 95 to 141 (Indonesia bounds)
- Format: decimal degrees (e.g., -6.2088)

**Categorical Fields**:

- status: N (Negeri/Public) or S (Swasta/Private)
- bentuk_pendidikan: SD, SMP, SMA, SMK, SLB, SDLB, SMLB, SMPLB

**Data Quality Metrics**:

- Field completeness percentages
- Coordinate validity (valid, missing, invalid)
- NPSN uniqueness detection
- Categorical distribution analysis

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

- `TIMEOUT`: Operation exceeded time limit
- `RETRY_EXHAUSTED`: All retry attempts failed
- `CIRCUIT_BREAKER_OPEN`: Circuit breaker is blocking
- `FILE_READ_ERROR`: File reading failed
- `FILE_WRITE_ERROR`: File writing failed
- `VALIDATION_ERROR`: Data validation failed
- `CONFIGURATION_ERROR`: Configuration issue

#### File System Operations

All file system operations use resilient wrappers (`fs-safe.js`):

- `safeReadFile()` - reads with timeout, retry, and circuit breaker
- `safeWriteFile()` - writes with timeout, retry, and circuit breaker
- `safeMkdir()` - creates directories with timeout and retry
- `safeAccess()` - checks file existence with timeout
- `safeReaddir()` - lists directory contents with timeout and retry
- `safeStat()` - gets file stats with timeout and retry

## Decisions Log

| Date       | Decision                                                     | Rationale                                                    |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 2026-01-07 | Use Astro for templating                                     | Lightweight, fast static site generation                     |
| 2026-01-07 | CSV over database                                            | Simple, portable, low overhead                               |
| 2026-01-07 | Node.js scripts                                              | Cross-platform, easy to maintain                             |
| 2026-01-07 | Implement resilience patterns                                | Prevent cascading failures, handle transient errors          |
| 2026-01-07 | Implement layer separation (controller/service/presentation) | Better separation of concerns, testability, maintainability  |
| 2026-01-07 | Extract HTML templates to separate modules                   | Templates testable in isolation, reusable, easy to modify    |
| 2026-01-07 | Create PageBuilder service layer                             | Business logic isolated from file I/O and presentation       |
| 2026-01-10 | Implement rate limiting for concurrent operations            | Controlled concurrency, backpressure, metrics for operations |
