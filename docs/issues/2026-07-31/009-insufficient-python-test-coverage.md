# Insufficient Python Test Coverage; pytest Not Installed in Runner

**Category**: test
**Priority**: P2
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/009-insufficient-python-test-coverage.md

## Problem Statement

Python testing is thin and the declared runner (`pytest`) is not installed in the CI environment. Current state:

- `tests/run_tests.py` → 27 tests, all structural (project structure, config, workflow YAML presence, data validation)
- `python3 -m pytest tests/ -v` → **ModuleNotFoundError: No module named pytest**
- No unit tests for Python-side logic (there is no Python application logic module — ETL is Node)

## Evidence

```bash
$ python3 -m pytest tests/ -v
/usr/bin/python3: No module named pytest

$ npm run test:py
Total: 27  Passed: 27  Failed: 0  Success: 100.0%
```

- `tests/` contains only `run_tests.py`, `test_basic.py`, `test_data_validation.py`, `__init__.py`
- `requirements.txt` declares pytest/pytest-cov but nothing installs it in `.github/workflows/` steps (on-pull/on-push run `npm run test:ci` which uses `run_tests.py`)

## Impact

- Python "coverage" is a smoke test, not a real test suite
- pytest path is broken out of the box — DX friction for contributors
- No CI step installs requirements.txt

## Suggested Fix

1. Add a CI step: `pip install -r requirements.txt` before Python tests
2. Use `npm run test:py:pytest` (pytest with verbose) as the canonical Python test command in CI
3. Add unit tests for any Python utility code, or remove the Python test dir if purely structural
4. Align README/test docs with the actual commands that run in CI

## Related

- `docs/issues/2026-07-13/004-insufficient-python-test-coverage.md`
