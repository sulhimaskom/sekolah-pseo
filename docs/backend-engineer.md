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
- **Improved error resilience**: Changed `Promise.all()` to `Promise.allSettled()` in `scripts/validate-links.js` to handle partial failures gracefully
- **Added ETL error isolation**: Added try/catch inside the record processing loop in `scripts/etl.js` to prevent single bad records from crashing the entire ETL process
- PR #187: https://github.com/sulhimaskom/sekolah-pseo/pull/187
  PR|
  WZ|1. **Streaming CSV processing**: Process large CSV files in streaming fashion
  QS|2. **Data validation rules**: Add more sophisticated validation rules
  XS|3. **Caching**: Add caching layer for frequently accessed data (PARTIALLY DONE - incremental build manifest)
  HB|4. **Monitoring**: Add metrics and monitoring for ETL process

1. **Streaming CSV processing**: Process large CSV files in streaming fashion
2. **Data validation rules**: Add more sophisticated validation rules
3. **Caching**: Add caching layer for frequently accessed data
4. **Monitoring**: Add metrics and monitoring for ETL process
