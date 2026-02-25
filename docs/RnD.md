# RnD (Research & Development) - Long-term Memory

## Overview

This document serves as the long-term memory for the RnD agent, tracking improvements, patterns, and learnings.

## Completed Improvements

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

1. Add more edge case tests for resilience.js
2. Add integration tests for the full ETL pipeline
3. Add performance benchmarks for page building
