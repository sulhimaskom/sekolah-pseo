# [RESOLVED] Phase 2 - Hardening: Incremental Build Reimplements Full Build Logic

**Category**: refactor | **Priority**: P3
**Evaluation Date**: 2026-07-12
**Resolution Date**: 2026-07-12
**Resolution PR**: #476
**Audit Report**: docs/audit-report-2026-07-12.md

## Description

The incremental build (`--incremental` flag) and full build paths in `build-pages.js` shared significant code duplication. Both paths independently implemented:

- Directory creation logic
- Page generation loops
- Manifest save/load operations
- Performance tracking setup

This created maintenance risk where a fix applied to one path may not be applied to the other.

### Resolution

Both paths were unified into a single `build()` function that handles both modes via the `--incremental` flag. `buildIncremental()` retained as a backward-compatibility thin wrapper.

**Changes**:
- Single shared pipeline: `prepareBuildEnvironment()` → filter (if incremental) → write pages → save manifest → export CSV (full only)
- Removed duplicate `prepareBuildEnvironment()` and `finalizeBuild()` calls
- Shared logging and performance tracking
- 555 → 543 lines (net -12 lines)

**Verification**: Build ✅ (3474 pages), Tests ✅ (902/902 pass), Lint ✅
