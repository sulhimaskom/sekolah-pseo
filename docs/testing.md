# Testing Documentation

## Overview

This project has a comprehensive test suite with both JavaScript and Python tests. Tests can run in any environment without external dependencies (except for optional pytest features).

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Only JavaScript Tests

```bash
npm run test:js
```

### Run Only Python Tests

```bash
# Using standalone runner (no dependencies)
npm run test:py

# Using pytest (requires: pip install pytest)
npm run test:py:pytest
```

### Run Tests for CI (JSON Output)

```bash
npm run test:ci
```

## Test Structure

### JavaScript Tests

Located in `scripts/*.test.js`:

- `utils.test.js` - Utility function tests
- `rate-limiter.test.js` - Rate limiting tests
- `resilience.test.js` - Resilience pattern tests (timeout, retry, circuit breaker)
- `PageBuilder.test.js` - Page builder tests
- `build-pages.test.js` - Build process tests
- `etl.test.js` - ETL pipeline tests
- `sitemap.test.js` - Sitemap generation tests
- `styles.test.js` - CSS/style generation tests
- `design-system.test.js` - Design system tests
- `school-page.test.js` - School page template tests
- `slugify.test.js` - URL slug generation tests
- `validate-links.test.js` - Link validation tests

### Python Tests

Located in `tests/`:

- `run_tests.py` - Standalone test runner (no pytest required)
- `test_basic.py` - Basic project structure tests
- `test_data_validation.py` - Data validation and ETL tests

## Test Categories

### Project Structure Tests
- Verify required files and directories exist
- Validate package.json structure
- Check documentation completeness

### Configuration Tests
- Environment configuration validation
- GitHub Actions workflow checks

### Data Validation Tests
- Schools.csv structure validation
- Required column checks
- Data integrity verification

### JavaScript Unit Tests
- Individual function testing
- Error handling validation
- Edge case coverage

## Python Test Runner

The project includes a standalone Python test runner that works without pytest:

```bash
# Run all Python tests
python3 tests/run_tests.py

# Verbose output
python3 tests/run_tests.py -v

# JSON output for CI
python3 tests/run_tests.py --json
```

### Features
- No external dependencies (uses only Python standard library)
- Works in any environment
- Supports verbose and JSON output modes
- Proper exit codes for CI integration

## Installing pytest (Optional)

For enhanced test features, install pytest:

```bash
pip install -r requirements.txt
```

Then run with pytest:

```bash
pytest tests/ -v
```

## Writing Tests

### JavaScript Tests

Uses Node.js built-in test runner:

```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('My Feature', () => {
  test('should work correctly', () => {
    assert.strictEqual(actual, expected);
  });
});
```

### Python Tests (Standalone)

Use the `TestSuite` class in `run_tests.py`:

```python
def run_my_tests(suite: TestSuite, root: str) -> None:
    suite.run_test(
        "my test name",
        lambda: suite.assert_equal(actual, expected)
    )
```

### Python Tests (pytest)

Standard pytest format:

```python
def test_my_feature():
    assert actual == expected
```

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request

GitHub Actions workflow: `.github/workflows/on-push.yml`

## Troubleshooting

### Python Tests Fail

1. Check Python 3 is installed: `python3 --version`
2. Use standalone runner: `python3 tests/run_tests.py`
3. For pytest: `pip install pytest`

### JavaScript Tests Fail

1. Check Node.js is installed: `node --version`
2. Ensure dependencies: `npm install`
3. Run directly: `node --test scripts/*.test.js`

### Test Coverage

Current test coverage:
- JavaScript: 12 test files, 100+ test cases
- Python: 18 test cases (standalone runner)
- Total: 100% pass rate

## Test Output Examples

### JavaScript Success
```
✓ buildSchoolPageData (29 subtests)
✓ getUniqueDirectories (18 subtests)
...
✓ RateLimiter (22 subtests)
```

### Python Success
```
✓ PASS package.json exists and is valid
✓ PASS Directory exists: src/
...
✓ All tests passed!
```
