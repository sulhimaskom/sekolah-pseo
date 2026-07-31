# Floating Promise in fetch-data.js main() — Cache Fallback Dead Code + Flaky Test Suite

**Category**: bug
**Priority**: P1
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/001-floating-promise-fetch-data.md

## Problem Statement

`main()` in `scripts/fetch-data.js` calls `fetchFromGitHub(sourceRepo)` **without `await`**, but `fetchFromGitHub` is backed by `retry()` which is `async` and returns a Promise. On git-fetch failure the Promise rejects asynchronously, escaping the synchronous `try/catch` in `main()`. Consequences:

1. **Production bug**: `useCachedData()` fallback (the resilience path) is **unreachable** — when the external GitHub source fails, the process gets an unhandled rejection instead of falling back to cached data.
2. **Test suite flakiness**: `scripts/fetch-data.test.js:402` ("handles fetch error gracefully when cached fallback succeeds") generates async activity after the test ends → `unhandledRejection` `IntegrationError: Operation failed after 3 attempt(s)` → full suite fails while isolated runs pass 51/51.

## Reproduction

```bash
# Full suite — fails 1/1030
npm run test:js
# → Error: Test ... generated asynchronous activity after the test ended.
# → unhandledRejection: IntegrationError: Operation failed after 3 attempt(s)

# Isolated — passes 51/51 (3 consecutive runs)
node --test scripts/fetch-data.test.js
```

## Root Cause

```js
// scripts/fetch-data.js:338
const csvPath = fetchFromGitHub(sourceRepo);  // ← NOT awaited; returns Promise

// scripts/resilience.js:213
async function retry(fn, options = {}) { ... }  // ← async: rejection is async
```

The sync `try/catch` in `main()` cannot catch an async rejection → `useCachedData()` never executes.

## Impact

- **Data pipeline**: production fetch failures do not degrade gracefully (stale-data fallback broken)
- **CI**: red test suite on every full run; hides real regressions
- **Determinism**: order-dependent test behavior

## Suggested Fix

1. Make `main()` async and `await fetchFromGitHub(sourceRepo)` inside the try/catch.
2. Handle `require.main === module` entry with `.catch()` on the async main.
3. Add a regression test asserting `useCachedData` is called (mock fetch failure + spy on `useCachedData`).

## Evidence

- `scripts/fetch-data.js:319-341` (main), `scripts/fetch-data.js:164-238` (fetchFromGitHub)
- `scripts/resilience.js:213-249` (async retry)
- `npm run test:js` → `# fail 1`; `node --test scripts/fetch-data.test.js` → `# pass 51 / # fail 0` (×3)
