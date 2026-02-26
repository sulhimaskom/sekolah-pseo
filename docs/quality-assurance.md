# Quality Assurance Documentation

## Repository: sekolah-pseo

**Last Updated:** 2026-02-26

---

## Coverage Thresholds

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 80%       |
| Branches   | 75%       |
| Functions  | 75%       |
| Statements | 80%       |

Coverage is enforced in CI via the `test` job in `on-pull.yml`. The workflow runs `npm run coverage` which uses `c8` to check thresholds. If coverage falls below any threshold, the CI build fails.

---

## Current Status

| Metric           | Status                 |
| ---------------- | ---------------------- |
| JavaScript Tests | ✅ PASSING (467 tests) |
| Python Tests     | ✅ PASSING (18 tests)  |
| ESLint           | ✅ PASSING (no errors) |
| npm audit        | ✅ 0 vulnerabilities   |
| Coverage         | ✅ Lines: 92.62%, Branches: 92.36%, Functions: 91.11%

| Metric           | Status                 |
| ---------------- | ---------------------- |
| JavaScript Tests | ✅ PASSING (443 tests) |
| Python Tests     | ✅ PASSING (18 tests)  |
| ESLint           | ✅ PASSING (no errors) |
| npm audit        | ✅ 0 vulnerabilities   |
| Coverage         | ✅ Lines: 87%, Branches: 93%

| Metric           | Status                 |
| ---------------- | ---------------------- |
| JavaScript Tests | ✅ PASSING (403 tests) |
| Python Tests     | ✅ PASSING (18 tests)  |
| ESLint           | ✅ PASSING (no errors) |
| npm audit        | ✅ 0 vulnerabilities   |

---

## Quality Gates

### Required Checks (must pass before merge)

1. `npm run test:js` - All JavaScript tests pass
2. `npm run test:py` - All Python tests pass
3. `npm run coverage` - Coverage meets thresholds (lines: 80%, branches: 75%, functions: 75%, statements: 80%)
4. `npm run lint` - ESLint passes with no errors (checks scripts/ and src/)
5. `npm audit` - Zero vulnerabilities

### Recommended Commands

```bash
# Full test suite
npm test

# Individual checks
npm run test:js      # JavaScript tests
npm run test:py      # Python tests
npm run lint         # ESLint
npm run coverage     # Coverage check with threshold enforcement
npm run coverage:report  # Detailed HTML coverage report
npm audit            # Security audit
npm audit fix        # Auto-fix vulnerabilities
```

---

## Known Issues & Resolutions

### Resolved Issues

1. **Vulnerability: ajv <6.14.0 (moderate)**
   - Issue: ReDoS when using `$data` option
   - Resolution: `npm audit fix`

2. **Vulnerability: minimatch <3.1.3 (high)**
   - Issue: ReDoS via repeated wildcards
   - Resolution: `npm audit fix`

3. **Test Pollution: Global circuit breaker state in fs-safe.js (Issue #194)**
   - Issue: Circuit breaker instances shared across tests could cause test pollution
   - Resolution: Added `resetCircuitBreakers()` function to clear state between tests
   - Usage: Import and call `resetCircuitBreakers()` in test setup if needed

1. **Vulnerability: ajv <6.14.0 (moderate)**
   - Issue: ReDoS when using `$data` option
   - Resolution: `npm audit fix`

2. **Vulnerability: minimatch <3.1.3 (high)**
   - Issue: ReDoS via repeated wildcards
   - Resolution: `npm audit fix`

---

## Test Coverage Areas

### JavaScript Tests (scripts/\*.test.js)

- `build-pages.test.js` - Page generation logic
- `school-page.test.js` - School page HTML generation
- `etl.test.js` - ETL pipeline
- `sitemap.test.js` - Sitemap generation
- `utils.test.js` - Utility functions
- `slugify.test.js` - URL slug generation
- `styles.test.js` - CSS generation
- `design-system.test.js` - Design tokens
- `rate-limiter.test.js` - Rate limiting
- `resilience.test.js` - Error handling & retries
- `validate-links.test.js` - Link validation

### Python Tests (tests/)

- Project structure validation
- Configuration validation
- JavaScript tests check
- GitHub workflows validation
- Data validation

---

## Dependencies

### Dev Dependencies

- `eslint: 9.39.2`
- `globals: ^17.0.0`

### ESLint Configuration

- Checks: `scripts/**/*.js` and `src/**/*.js`
- Ignores: `dist/**`, `node_modules/**`, `**/*.test.js`, `eslint.config.js`
- Rules: Error prevention (no-unused-vars, no-undef), Style (semi, quotes, no-var, prefer-const), Security (no-eval, no-implied-eval, no-new-func, no-script-url, no-throw-literal, no-proto, no-param-reassign)

### Key Runtime Dependencies

- Node.js built-in modules (fs, path, crypto, etc.)

---

## Notes

- ESLint requires `npm install` before first run
- All tests use Node.js native test runner (`node --test`)
- Python tests use custom test runner in `tests/run_tests.py`
