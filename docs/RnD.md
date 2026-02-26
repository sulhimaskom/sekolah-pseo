# RnD (Research & Development) - Long-term Memory

## Overview

This document serves as the long-term memory for the RnD agent, tracking improvements, patterns, and learnings.

## Completed Improvements
## Completed Improvements

### 2026-02-26: Add npm audit to CI pipeline

- **Issue**: #130
- **Branch**: `rnd/npm-audit-ci`
- **Summary**: Add npm audit to CI pipeline for dependency vulnerability scanning
- **Status**: PR created with manual apply instructions for workflow changes
- **Changes proposed**:
  - Add `npm ci` step to install dependencies
  - Add `npm audit --audit-level=moderate` step to detect vulnerabilities
  - Fails on high/critical vulnerabilities
- **Verification**:
  - npm audit passes locally with 0 vulnerabilities
- **Blocker**: GitHub App permission restriction - workflow file changes require manual apply
- **Note**: Following the same pattern as PR #185


### 2026-02-26: Verify pre-commit hooks PR #163

- **PR**: #163
- **Branch**: `rnd/pre-commit-hooks`
- **Changes**:
  - Verified branch is up to date with main (no conflicts)
  - Verified tests pass (403/403)
  - Verified husky and lint-staged configuration is correct
  - Added verification comment to PR
- **Issue**: Resolves #145
- **Results**:
  - PR ready to merge

### 2026-02-26: Investigate Issue #131 (Secret Key Confusion)

- **Issue**: Line 28 in on-push.yml incorrectly references `secrets.VITE_SUPABASE_KEY` instead of `secrets.VITE_SUPABASE_ANON_KEY`
- **Root Cause Found**: Security misconfiguration - copy-paste error
- **Fix Identified**: Change line 28 from `VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_KEY }}` to `VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}`
- **Blocker**: GitHub App permission restriction - cannot push workflow file changes
- **Note**: This is a known limitation - workflow file updates require user-level permissions or manual fix

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

- **PR**: #141
- **Branch**: `rnd/improve-gitignore`
- **Changes**:
  - Added `.env.local` and `.env.*.local` for local environment files
  - Added `.idea/` for IntelliJ IDE
  - Added `.vscode/` for VSCode
  - Added `*.swp` and `*.swo` for vim swap files
  - Added `.DS_Store` for macOS
  - Added `Thumbs.db` for Windows
  - Cleaned up file formatting (added trailing newline)
- **Issue**: Fixes #134
- **Results**:
  - All 403 tests passing
  - No false positives (only .gitignore changed)

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

### GitHub App Limitations

- Workflow file changes cannot be pushed by GitHub Actions bot
- Requires user-level permissions or manual intervention
- Workaround: Document findings in issues and note in RnD.md

## Future Improvement Ideas

1. ~~Add more edge case tests for resilience.js~~ (Done: PR #128)
2. ~~Fail build when no schools loaded from CSV~~ (Done: PR #207)
3. Add integration tests for the full ETL pipeline
4. Add performance benchmarks for page building
5. Add npm audit to CI pipeline (Issue #130)
6. Add broken link checking to CI (Issue #146)

1. ~~Add more edge case tests for resilience.js~~ (Done: PR #128)
2. Add integration tests for the full ETL pipeline
3. Add performance benchmarks for page building
4. Add npm audit to CI pipeline (Issue #130)
5. Add broken link checking to CI (Issue #146)
