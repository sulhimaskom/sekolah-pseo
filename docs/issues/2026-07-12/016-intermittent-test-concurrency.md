# Finding 016: Intermittent Test Concurrency Failure in build-pages.test.js

**Evaluation Date**: 2026-07-12 (second pass)
**Category**: test
**Priority**: P2
**Status**: Open

## Observation

When all JavaScript tests run concurrently (`node --test scripts/*.test.js`), tests in `build-pages.test.js` intermittently fail (approximately 1 in 4 runs) with:

```
not ok 29 - ensureDistDir creates dist directory when it does not exist
  error: "ENOTEMPTY: directory not empty, rmdir '...dist/provinsi/.../kec-cilandak'"

not ok 26 - buildIncremental runs without error
  error: "index.html should exist after incremental build"

not ok 23 - build creates dist directory and generates files
  error: varies by timing
```

## Root Cause

Multiple test files share the `dist/` directory (`CONFIG.DIST_DIR`). When one test file's cleanup (`fs.rm`) runs concurrently with another test file's write operations, the `rm` can fail on non-empty directories, or the incremental build test can fail because the dist directory state was modified by another test.

## Evidence

- Occurs in ~1/4 runs when all test files execute together
- Does NOT occur when running individual test files sequentially
- Caused by shared filesystem state between test suites

## Impact

- Medium: Causes CI flakiness
- All 902 tests always pass individually; the issue only appears under concurrent execution

## File Affected

- `scripts/build-pages.test.js` (lines 415-425, 365-383, and similar cleanup lines)

## Suggested Fix

Options:

1. Use unique temp directories per test file instead of shared `dist/`
2. Add file-locking/mutex around dist/ operations
3. Isolate the incremental build tests to a temp directory
