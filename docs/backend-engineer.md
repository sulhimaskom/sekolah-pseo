# Backend-Engineer Agent Documentation

## Overview

This document serves as the long-term memory for the backend-engineer agent. It records conventions, tools, and improvements made to enhance backend development and data processing.

## Current State (Last Updated: 2026-02-27)

### Project Type

- Node.js project with JavaScript
- Uses CommonJS module system
- ETL pipeline for Indonesian school data processing

### Backend Components

| Component                   | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `scripts/etl.js`            | ETL process - normalizes and validates school data |
| `scripts/build-pages.js`    | Static page generation with concurrency control    |
| `scripts/sitemap.js`        | Sitemap generation                                 |
| `scripts/validate-links.js` | Link validation                                    |
| `scripts/utils.js`          | Shared utilities (CSV parsing, escaping)           |
| `scripts/rate-limiter.js`   | Concurrency control                                |
| `scripts/resilience.js`     | Error handling patterns                            |
| `scripts/manifest.js`       | Build manifest for incremental builds              |

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

### 2026-02-25 (Session 2)

- **Removed dead code**: Cleaned up duplicate code block in `scripts/utils.js` (lines 245-253) that was never executed
- Fixed missing semicolon in `module.exports`
- PR #125: https://github.com/sulhimaskom/sekolah-pseo/pull/125

### 2026-02-25 (Session 3)

- **Added incremental build support**: Implemented manifest-based incremental builds for faster rebuilds
- Created `scripts/manifest.js` module for tracking built files with MD5 hashes
- Modified `scripts/build-pages.js` to support `--incremental` flag
- Only rebuilds pages whose source data has changed, skipping unchanged files
- Usage: `node scripts/build-pages.js --incremental`
- PR #125: https://github.com/sulhimaskom/sekolah-pseo/pull/125

### 2026-02-26

- **Fixed async/sync blocking**: Replaced `fs.unlinkSync()` with `await fs.promises.unlink()` in `scripts/manifest.js` to avoid blocking the event loop
- **Added ETL error isolation**: Added try/catch inside the record processing loop in `scripts/etl.js` to prevent single bad records from crashing the entire ETL process
- PR #187: https://github.com/sulhimaskom/sekolah-pseo/pull/187

### 2026-02-26 (Session 2)

- **Centralized configuration**: Moved hardcoded values to `scripts/config.js` for centralized management
- Added configuration groups:
  - `INDONESIA_BOUNDS`: Geographic bounds for coordinate validation (LAT_MIN, LAT_MAX, LON_MIN, LON_MAX)
  - `RATE_LIMITER_DEFAULTS`: Rate limiter defaults (MAX_CONCURRENT, RATE_LIMIT_MS, QUEUE_TIMEOUT_MS)
  - `CIRCUIT_BREAKER_DEFAULTS`: Circuit breaker thresholds (FAILURE_THRESHOLD, RESET_TIMEOUT_MS)
  - `CACHE_DEFAULTS`: Cache size limits (MAX_CACHE_SIZE)
  - `FILE_TIMEOUT_MS`: File operation timeout
- Updated modules to use centralized config:
  - `scripts/etl.js`: Indonesia bounds from config
  - `scripts/rate-limiter.js`: Rate limiter defaults from config
  - `scripts/fs-safe.js`: Circuit breaker and file timeout from config
  - `scripts/slugify.js`: Cache size from config
  - `scripts/build-pages.js`: Queue timeout from config
- Enables runtime configuration via environment variables

### 2026-02-26 (Session 3)

- **Fixed silent failures in build-pages.js**: Modified `loadSchools()` to throw error instead of returning empty array when CSV file cannot be read or is empty. Clear error message indicates root cause.
- Updated tests to verify error is thrown for missing/invalid CSV files
- **Added factory pattern to fs-safe.js**: Created `createFsSafe(options)` factory function that returns isolated fs-safe instances with their own circuit breakers. Enables test isolation - each test can have fresh circuit breaker state.
- Backward compatible - exports singleton functions as before
- Usage: `const fsSafe = createFsSafe({ failureThreshold: 3, resetTimeoutMs: 30000 })`

### 2026-02-26 (Session 4)

- **Removed duplicate console.log**: Eliminated duplicate `console.log` statements in `scripts/build-pages.js` that were printing the same message as `logger.info` already outputs. The message "Loaded X schools from CSV" was logged twice - once via console.log and once via logger.info.
- This improves consistency by using the centralized logger throughout the build process

### 2026-02-27 (Session 5)

- **Investigated CSV Formula Injection vulnerability (Issue #254)**: Found that the vulnerability is ALREADY FIXED in the codebase
- **escapeCsvField()** function in `scripts/utils.js` (lines 223-229) includes formula injection protection:
  - Prefixes dangerous characters (=, +, -, @, tab) with single quote (') to prevent spreadsheet formula execution
  - This protection is applied when writing CSV output via `writeCsv()`
- **Tests confirm the protection**: `scripts/utils.test.js` (lines 152-185) includes comprehensive formula injection tests
- **Conclusion**: Issue #254 appears to be stale - the fix was implemented previously but the automated scanner issue wasn't updated/closed
- All backend tests pass - the codebase is secure against CSV formula injection attacks

### 2026-02-27 (Session 6)

- **Backend Health Verification**: Performed comprehensive verification of backend components
- All 558 JavaScript tests pass (100% success)
- All 18 Python tests pass (100% success)
- ESLint passes with no errors
- Structured logging (pino) fully implemented - only 5 console.\* statements remain, all in test files
- CSV formula injection protection confirmed working (Issue #254 - already resolved)
- Incremental build system operational with manifest tracking
- Circuit breakers and resilience patterns properly implemented
VN|- No backend-engineer PRs open - proactive scan completed

### 2026-02-27 (Session 7)

- **Fixed ESLint error in utils.js**: Changed double quotes to single quotes in `escapeCsvField()` function (line 234)
- Changed `return "'" + str;` to `return '\\'' + str;` to fix ESLint string quote rule
- All tests pass (558 JS + 18 Python)
- ESLint passes with zero errors
- PR #304: https://github.com/sulhimaskom/sekolah-pseo/pull/304

## Future Improvement Opportunities

1. **Streaming CSV processing**: Process large CSV files in streaming fashion
2. **Data validation rules**: Add more sophisticated validation rules
3. **Caching**: Add caching layer for frequently accessed data (PARTIALLY DONE - incremental build manifest)
4. **Monitoring**: Add metrics and monitoring for ETL process
