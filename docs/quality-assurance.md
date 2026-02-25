# Quality Assurance Documentation

## Repository: sekolah-pseo

**Last Updated:** 2026-02-25

---

## Current Status

| Metric | Status |
|--------|--------|
| JavaScript Tests | ✅ PASSING (403 tests) |
| Python Tests | ✅ PASSING (18 tests) |
| ESLint | ✅ PASSING (no errors) |
| npm audit | ✅ 0 vulnerabilities |
| Format Check (scripts) | ✅ PASSING |

---

## Quality Gates

### Required Checks (must pass before merge)
1. `npm run test:js` - All JavaScript tests pass
2. `npm run test:py` - All Python tests pass  
3. `npm run lint` - ESLint passes with no errors
4. `npm audit` - Zero vulnerabilities
5. `npm run format:scripts` - Prettier format check for scripts/

### Recommended Commands
```bash
# Full test suite
npm test

# Individual checks
npm run test:js      # JavaScript tests
npm run test:py      # Python tests
npm run lint         # ESLint
npm audit            # Security audit
npm audit fix        # Auto-fix vulnerabilities
npm run format:scripts # Prettier format check
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

---

## Test Coverage Areas

### JavaScript Tests (scripts/*.test.js)
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

### Key Runtime Dependencies
- Node.js built-in modules (fs, path, crypto, etc.)

---

## Notes

- ESLint requires `npm install` before first run
- All tests use Node.js native test runner (`node --test`)
- Python tests use custom test runner in `tests/run_tests.py`
