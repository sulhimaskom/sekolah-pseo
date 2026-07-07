# Phase 2 - Hardening: Incremental Build Reimplements Full Build Logic

**Category**: refactor | **Priority**: P3
**Evaluation Date**: 2026-07-06
**Phase**: Phase 2 (Feature Hardening & Integration)

## Description

The incremental build (`--incremental` flag) and full build paths in `build-pages.js` share significant code duplication. Both paths independently implement:

- Directory creation logic
- Page generation loops
- Manifest save/load operations
- Performance tracking setup

This creates maintenance risk where a fix applied to one path may not be applied to the other.

### Evidence

- `scripts/build-pages.js`: ~200 lines of shared setup (lines 60-260) followed by separate full-build path (~150 lines) and incremental-build path (~100 lines)
- `build:incremental` script reimplements the full build command with just `--incremental` flag instead of being a separate optimized codepath

### Impact

- **Medium**: Bug fixes must be verified against both build paths
- **Low**: Current test coverage catches most regressions
- **Medium**: Code complexity increases maintenance burden

### Recommendations

1. Refactor to a single build pipeline that accepts a "changed files filter" instead of separate full/incremental paths
2. Full build = incremental build with empty filter (process all)
3. Reduce build-pages.js controller from 536 to < 300 lines by extracting the pipeline into a service
