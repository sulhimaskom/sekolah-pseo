# RnD (Research & Development) - Long-term Memory

## Overview

This document serves as the long-term memory for the RnD agent, tracking improvements, patterns, and learnings.

## Completed Improvements

### 2026-02-25: Add .gitignore verification documentation

- **PR**: #156
- **Branch**: `rnd/gitignore-ci-verification`
- **Changes**:
  - Documented .gitignore setup in README:
    - Environment files (.env, .env.local)
    - Node.js artifacts (node_modules, .npm)
    - Logs (\*.log)
    - IDE files (.idea/, .vscode/)
    - OS files (.DS_Store, Thumbs.db)
  - Created gitignore-check.yml workflow locally (blocked from push due to GitHub App permissions)
- **Issue**: Fixes #147
- **Results**:
  - Tests: 403 JS tests + 18 Python tests passing
  - Lint: Zero warnings

### 2026-02-25: Improve .gitignore with proper exclusions

#XW|
#QT|### 2026-02-25: Improve .gitignore with proper exclusions
#SK|
#HY|- **PR**: #141
#TT|- **Branch**: `rnd/improve-gitignore`
#ZB|- **Changes**:
#ZB| - Added `.env.local` and `.env.*.local` for local environment files
#KQ| - Added `.idea/` for IntelliJ IDE
#NJ| - Added `.vscode/` for VSCode
#HN| - Added `*.swp` and `*.swo` for vim swap files
#PN| - Added `.DS_Store` for macOS
#YZ| - Added `Thumbs.db` for Windows
#PS| - Cleaned up file formatting (added trailing newline)
#BT|- **Issue**: Fixes #134
#RK|- **Results**:
#RH| - All 403 tests passing
#YM| - No false positives (only .gitignore changed)
#TQ|
#QT|### 2026-02-25: Edge Case Tests for resilience.js

### 2026-02-25: Edge Case Tests for resilience.js

- **PR**: #128
- **Branch**: `rnd/resilience-edge-cases`
- **Changes**:
  - Added 6 new tests for IntegrationError:
    - Empty details object handling
    - Various error codes validation
    - Timestamp ISO format verification
    - Nested details in JSON serialization
  - Added 4 new tests for isTransientError:
    - Empty string message handling
    - Error objects with both code and message
    - Empty object edge case
    - Non-string message handling
  - Added 5 new tests for withTimeout:
    - Zero timeout behavior
    - Very short timeout handling
    - Operation name preservation in error messages
    - Promise that resolves immediately
  - Added 7 new tests for retry:
    - maxDelayMs limit enforcement
    - Custom shouldRetry function
    - shouldRetry returning false
    - Synchronous function error handling
    - Error details in retry exhaustion
  - Added 4 new tests for CircuitBreaker:
    - lastFailureTime tracking
    - Custom failure threshold
    - Below threshold behavior
    - getState() returns correct state object
- **Results**:
  - Tests: 403 passing (was 334, +69 new tests)
  - Lint: N/A (eslint not installed)

### 2026-02-25: Test Coverage for fs-safe.js and config.js

### 2026-02-25: Test Coverage for fs-safe.js and config.js

- **PR**: #115
- **Branch**: `rnd/test-coverage-fs-safe-config`
- **Changes**:
  - Added `scripts/fs-safe.test.js` - 24 tests covering:
    - `safeReadFile`, `safeWriteFile`, `safeMkdir`, `safeAccess`, `safeReaddir`, `safeStat`
    - Custom timeouts, error handling, edge cases
  - Added `scripts/config.test.js` - 26 tests covering:
    - Path validation and path traversal prevention
    - Directory configurations
    - Concurrency limit validation with environment variables
    - URL configuration
- **Results**:
  - Tests: 382 passing (was 334, +48 new tests)
  - Lint: Zero warnings

## Patterns & Learnings

### Test File Structure

- Use `before()` hook at top-level describe for test fixtures
- Use unique temporary directories for each test that creates files
- Clean up with `after()` hook using `fs.rm` with `recursive: true, force: true`

### Node.js Test Runner

- Import pattern: `const { describe, it, before, after } = require('node:test');`
- Use `assert.rejects()` for testing async errors
- Use `assert.strictEqual()` for exact equality checks

### Lint Considerations

- Always remove unused imports to avoid lint errors
- Check with `npm run lint` before committing

## Future Improvement Ideas

1. ~~Add more edge case tests for resilience.js~~ (Done: PR #128)
2. Add integration tests for the full ETL pipeline
3. Add performance benchmarks for page building

4. Add more edge case tests for resilience.js
5. Add integration tests for the full ETL pipeline
6. Add performance benchmarks for page building
