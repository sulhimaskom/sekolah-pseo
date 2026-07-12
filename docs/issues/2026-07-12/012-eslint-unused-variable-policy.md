# Finding #012: Unused `tracker` Parameter in buildIncremental()

**Category**: refactor
**Priority**: P3
**Status**: ✅ Fixed

## Description
The `buildIncremental()` function in `scripts/build-pages.js:535` had an unused `tracker` parameter that triggered an ESLint `no-unused-vars` error. The parameter was documented as "kept for API compat" but no callers actually needed it to be passed through — the internal `build()` function creates its own tracker instance.

## Fix Applied
- Removed the `tracker` parameter from `buildIncremental()`
- Updated JSDoc accordingly
- Updated the test `buildIncremental handles tracker parameter` to `buildIncremental runs without error`

## Key Insight
This is a pattern worth noting: when maintaining backward-compatible API signatures, unused parameters should use the `_` prefix convention if ESLint is configured to allow it, or be removed entirely if callers can be updated. The underscore-prefix approach was tried first but this ESLint config doesn't support `argsIgnorePattern: '^_'`.
