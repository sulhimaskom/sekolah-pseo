# Backend-Engineer Agent Documentation

## Overview

This document serves as the long-term memory for the backend-engineer agent. It records conventions, tools, and improvements made to enhance backend development and data processing.

## Current State (Last Updated: 2026-02-25)

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

## Future Improvement Opportunities

1. **Streaming CSV processing**: Process large CSV files in streaming fashion
2. **Data validation rules**: Add more sophisticated validation rules
3. **Caching**: Add caching layer for frequently accessed data
4. **Monitoring**: Add metrics and monitoring for ETL process
