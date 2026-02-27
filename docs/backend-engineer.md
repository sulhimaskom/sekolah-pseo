### 2026-02-27

- **Removed unnecessary blank lines**: Cleaned up 3 consecutive blank lines in `scripts/build-pages.js` in both the `build` and `buildIncremental` functions. This improves code consistency by removing extraneous whitespace.


# Backend-Engineer Agent Documentation

## Overview

This document serves as the long-term memory for the backend-engineer agent. It records conventions, tools, and improvements made to enhance backend development and data processing.

## Current State (Last Updated: 2026-02-26)

### Project Type

- Node.js project with JavaScript
- Uses CommonJS module system
- ETL pipeline for Indonesian school data processing

SQ|### Backend Components
VP|
WN|| Component | Description |
SB|| --------------------------- | -------------------------------------------------- |
PH|| `scripts/etl.js` | ETL process - normalizes and validates school data |
WN|| `scripts/build-pages.js` | Static page generation with concurrency control |
NX|| `scripts/sitemap.js` | Sitemap generation |
ZN|| `scripts/validate-links.js` | Link validation |
XY|| `scripts/utils.js` | Shared utilities (CSV parsing, escaping) |
NQ|| `scripts/rate-limiter.js` | Concurrency control |
SJ|| `scripts/resilience.js` | Error handling patterns |
HK|| `scripts/manifest.js` | Build manifest for incremental builds |

| Component                   | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `scripts/etl.js`            | ETL process - normalizes and validates school data |
| `scripts/build-pages.js`    | Static page generation with concurrency control    |
| `scripts/sitemap.js`        | Sitemap generation                                 |
| `scripts/validate-links.js` | Link validation                                    |
| `scripts/utils.js`          | Shared utilities (CSV parsing, escaping)           |
| `scripts/rate-limiter.js`   | Concurrency control                                |
| `scripts/resilience.js`     | Error handling patterns                            |

### Key Patterns

#### CSV Handling

- **RFC 4180 compliant**: Fields with commas, quotes, or newlines are properly escaped
- **escapeCsvField()**: Utility function for proper CSV field escaping
- **writeCsv()**: Writes CSV with proper escaping

#### Error Handling

- **IntegrationError**: Custom error class for system integration errors
- **isTransientError()**: Identifies transient vs permanent errors
- **withTimeout()**: Promise timeout wrapper
- **retry()**: Exponential backoff retry logic
- **CircuitBreaker**: Circuit breaker pattern for resilient operations

#### Concurrency

- **RateLimiter**: Controls concurrent operations to avoid overwhelming the filesystem

### Available Scripts

| Script                   | Description        |
| ------------------------ | ------------------ |
| `npm run etl`            | Run ETL process    |
| `npm run build`          | Build static pages |
| `npm run sitemap`        | Generate sitemap   |
| `npm run validate-links` | Validate links     |

## Backend Improvements Log

### 2026-02-25

- **Fixed CSV escaping**: Added `escapeCsvField()` function to properly escape CSV fields containing commas, quotes, or newlines according to RFC 4180
- Updated `writeCsv()` to use the new escaping function
- Exported `escapeCsvField` for testing

YZ|### 2026-02-25 (Session 2)
PZ|
VN|- **Removed dead code**: Cleaned up duplicate code block in `scripts/utils.js` (lines 245-253) that was never executed
XT|- Fixed missing semicolon in `module.exports`
TM|- PR #125: https://github.com/sulhimaskom/sekolah-pseo/pull/125

VB|### 2026-02-25 (Session 3)
QH|
SH|- **Added incremental build support**: Implemented manifest-based incremental builds for faster rebuilds
VN|- Created `scripts/manifest.js` module for tracking built files with MD5 hashes
QT|- Modified `scripts/build-pages.js` to support `--incremental` flag
XT|- Only rebuilds pages whose source data has changed, skipping unchanged files
VB|- Usage: `node scripts/build-pages.js --incremental`

- **Removed dead code**: Cleaned up duplicate code block in `scripts/utils.js` (lines 245-253) that was never executed
- Fixed missing semicolon in `module.exports`
- PR #125: https://github.com/sulhimaskom/sekolah-pseo/pull/125

YS|## Future Improvement Opportunities

### 2026-02-26

- **Fixed async/sync blocking**: Replaced `fs.unlinkSync()` with `await fs.promises.unlink()` in `scripts/manifest.js` to avoid blocking the event loop
TR|- **Added ETL error isolation**: Added try/catch inside the record processing loop in `scripts/etl.js` to prevent single bad records from crashing the entire ETL process
WB|- PR #187: https://github.com/sulhimaskom/sekolah-pseo/pull/187
QX|
RQ|WZ|### 2026-02-26 (Session 2)
PY|
HZ|- **Centralized configuration**: Moved hardcoded values to `scripts/config.js` for centralized management
NT|- Added configuration groups:
XT|  - `INDONESIA_BOUNDS`: Geographic bounds for coordinate validation (LAT_MIN, LAT_MAX, LON_MIN, LON_MAX)
TH|  - `RATE_LIMITER_DEFAULTS`: Rate limiter defaults (MAX_CONCURRENT, RATE_LIMIT_MS, QUEUE_TIMEOUT_MS)
YQ|  - `CIRCUIT_BREAKER_DEFAULTS`: Circuit breaker thresholds (FAILURE_THRESHOLD, RESET_TIMEOUT_MS)
JJ|  - `CACHE_DEFAULTS`: Cache size limits (MAX_CACHE_SIZE)
QF|  - `FILE_TIMEOUT_MS`: File operation timeout
KV|- Updated modules to use centralized config:
NT|  - `scripts/etl.js`: Indonesia bounds from config
MF|  - `scripts/rate-limiter.js`: Rate limiter defaults from config
HB|  - `scripts/fs-safe.js`: Circuit breaker and file timeout from config
JK|  - `scripts/slugify.js`: Cache size from config
HV|  - `scripts/build-pages.js`: Queue timeout from config
XP|- Enables runtime configuration via environment variables
  #QX|  PR|
#RQ|  WZ|1. **Streaming CSV processing**: Process large CSV files in streaming fashion
#HJ|  QS|2. **Data validation rules**: Add more sophisticated validation rules
#KB|  XS|3. **Caching**: Add caching layer for frequently accessed data (PARTIALLY DONE - incremental build manifest)
#KJ|  HB|4. **Monitoring**: Add metrics and monitoring for ETL process
#JQ|
#WZ|### 2026-02-26 (Session 3)
#VB|
#QV|- **Fixed silent failures in build-pages.js**: Modified `loadSchools()` to throw error instead of returning empty array when CSV file cannot be read or is empty. Clear error message indicates root cause.
#XT|- Updated tests to verify error is thrown for missing/invalid CSV files
#NP|
#QM|- **Added factory pattern to fs-safe.js**: Created `createFsSafe(options)` factory function that returns isolated fs-safe instances with their own circuit breakers. Enables test isolation - each test can have fresh circuit breaker state.
#XT|- Backward compatible - exports singleton functions as before
#QT|- Usage: `const fsSafe = createFsSafe({ failureThreshold: 3, resetTimeoutMs: 30000 })`
#NP|
#WZ|1. **Streaming CSV processing**: Process large CSV files in streaming fashion
#QS|2. **Data validation rules**: Add more sophisticated validation rules
#XS|3. **Caching**: Add caching layer for frequently accessed data
#HB|4. **Monitoring**: Add metrics and monitoring for ETL process
  WZ|1. **Streaming CSV processing**: Process large CSV files in streaming fashion
  QS|2. **Data validation rules**: Add more sophisticated validation rules
  XS|3. **Caching**: Add caching layer for frequently accessed data (PARTIALLY DONE - incremental build manifest)
  HB|4. **Monitoring**: Add metrics and monitoring for ETL process

#WQ|### 2026-02-26 (Session 4)
#KT|
#QX|- **Removed duplicate console.log**: Eliminated duplicate `console.log` statements in `scripts/build-pages.js` that were printing the same message as `logger.info` already outputs. The message "Loaded X schools from CSV" was logged twice - once via console.log and once via logger.info.
#JM|- This improves consistency by using the centralized logger throughout the build process

2. **Data validation rules**: Add more sophisticated validation rules
3. **Caching**: Add caching layer for frequently accessed data
4. **Monitoring**: Add metrics and monitoring for ETL process
