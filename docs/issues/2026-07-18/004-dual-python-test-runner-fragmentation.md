# Dual Python Test Runner Fragmentation

**Category**: test
**Priority**: P2
**Evaluation Date**: 2026-07-18

---

## Problem

The project maintains two parallel Python test runner approaches, creating fragmentation and confusion:

1. **Custom runner**: `npm run test:py` -> `python3 tests/run_tests.py` — custom test discovery and execution
2. **Pytest**: `npm run test:py:pytest` -> `python3 -m pytest tests/ -v` — standard pytest

## Evidence

From `package.json`:

```json
"test:py": "python3 tests/run_tests.py",
"test:py:pytest": "python3 -m pytest tests/ -v",
"test:all": "npm run test:js && npm run test:py:pytest",
"test:ci": "npm run test:js && npm run test:py -- --json",
```

The `test:all` script uses pytest while `test:ci` uses the custom runner.

## Impact

- **Maintenance burden**: Two test runners mean double the infrastructure to maintain
- **Inconsistent results**: Custom runner may discover tests differently than pytest
- **Confusion**: Developers don't know which runner to use for new tests
- **Feature gap**: Custom runner (27 tests) lacks pytest features (fixtures, parameterization, plugins)

## Root Cause

The custom runner (`tests/run_tests.py`) was written before pytest was added as a dependency. When pytest was introduced (`requirements.txt` includes pytest), the custom runner was never replaced.

## Suggested Fix

1. Remove `tests/run_tests.py` and consolidate on pytest
2. Update `test:py` to use pytest: `"test:py": "python3 -m pytest tests/ -v"`
3. Convert any custom test logic from run_tests.py into pytest fixtures or conftest.py
4. Remove redundant npm scripts (`test:py:pytest` becomes `test:py`, `test:ci` consolidates)

## Files Affected

- `package.json` (npm scripts for python testing)
- `tests/run_tests.py` (custom runner — candidate for removal)
- `tests/test_basic.py` (may need pytest adjustments)
- `tests/test_data_validation.py` (may need pytest adjustments)
