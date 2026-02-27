# Environment Setup Guide

This guide covers the complete setup process for developing and running the Sekolah PSEO project.

## Prerequisites

### Required Software

| Software | Version           | Purpose            |
| -------- | ----------------- | ------------------ |
| Node.js  | Latest LTS (v20+) | JavaScript runtime |
| Python   | Python 3.8+       | For Python tests   |
| Git      | Latest            | Version control    |

### Verify Prerequisites

```bash
# Check Node.js
node --version  # Should be v20 or higher

# Check npm
npm --version

# Check Python
python3 --version  # Should be 3.8 or higher

# Check Git
git --version
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sulhimaskom/sekolah-pseo.git
cd sekolah-pseo
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required Node.js packages defined in `package.json`.

### 3. (Optional) Install Python Testing Dependencies

```bash
# For enhanced Python test features with pytest
pip install pytest

# Or install from requirements if available
pip install -r requirements.txt
```

## Configuration

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### Configuration Options

| Variable                       | Description                             | Default               |
| ------------------------------ | --------------------------------------- | --------------------- |
| `SITE_URL`                     | Base URL for sitemap generation         | `https://example.com` |
| `RAW_DATA_PATH`                | Path to raw CSV data                    | `external/raw.csv`    |
| `BUILD_CONCURRENCY_LIMIT`      | Max concurrent page builds (1-1000)     | `100`                 |
| `VALIDATION_CONCURRENCY_LIMIT` | Max concurrent link validations (1-500) | `50`                  |
| `MAX_URLS_PER_SITEMAP`         | Max URLs per sitemap file (max: 50000)  | `50000`               |

### Edit .env

```bash
# Edit with your preferred editor
nano .env
# or
vim .env
```

Example configuration:

```env
SITE_URL=https://sekolah-pseo.example.com
RAW_DATA_PATH=external/raw.csv
BUILD_CONCURRENCY_LIMIT=100
VALIDATION_CONCURRENCY_LIMIT=50
MAX_URLS_PER_SITEMAP=50000
```

## Running the Project

### Development Pipeline

The project uses a sequential data processing pipeline:

```bash
# Step 1: Extract, Transform, Load (process raw data)
npm run etl

# Step 2: Build static pages
npm run build

# Step 3: Generate sitemap
npm run sitemap

# Step 4: Validate internal links
npm run validate-links
```

### Individual Commands

| Command                           | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                     | Run lint and JavaScript tests (development workflow)             |
| `npm run etl`                     | Process raw CSV data into cleaned school data                    |
| `npm run build`                   | Generate static HTML pages for all schools                       |
| `npm run sitemap`                 | Generate XML sitemap files                                       |
| `npm run validate-links`          | Validate internal hyperlinks                                     |
| `npm run lint`                    | Lint JavaScript code with ESLint                                 |
| `npm run format`                  | Format code with Prettier                                        |
| `npm run format:check`            | Check formatting without modifying files                         |
| `npm run test`                    | Run all tests (JavaScript + Python)                              |
| `npm run test:js`                 | Run JavaScript tests only                                        |
| `npm run test:js:coverage`        | Run JS tests with coverage check (fails if below threshold)      |
| `npm run test:js:coverage:report` | Generate HTML coverage report                                    |
| `npm run test:py`                 | Run Python tests only                                            |
| `npm run test:py:pytest`          | Run Python tests with pytest (verbose output)                    |
| `npm run test:ci`                 | Run tests in CI mode (JSON output for Python)                    |
| `npm run test:all`                | Run all tests with pytest verbose mode                           |
| `npm run coverage`                | Run coverage check (shorthand for test:js:coverage)              |
| `npm run coverage:report`         | Generate coverage report (shorthand for test:js:coverage:report) |

### Testing

```bash
# Run all tests (JavaScript + Python)
npm test

# Run only JavaScript tests
npm run test:js

# Run only Python tests
npm run test:py
```

### Code Quality

```bash
# Lint JavaScript code
npm run lint

# Format code with Prettier
npm run format

# Check formatting without modifying files
npm run format:check
```

## Project Structure Overview

```
sekolah-pseo/
├── src/
│   ├── presenters/          # Presentation layer (templates, styles)
│   │   ├── templates/      # HTML templates
│   │   ├── design-system.js # Design tokens
│   │   └── styles.js       # CSS generation
│   └── services/           # Business logic
│       └── PageBuilder.js  # Page generation service
├── scripts/                # Build scripts and utilities
│   ├── etl.js            # Data processing
│   ├── build-pages.js   # Page generation controller
│   ├── sitemap.js       # Sitemap generator
│   ├── validate-links.js # Link validator
│   └── *.js             # Utility modules
├── data/                   # Processed school data
├── dist/                   # Generated HTML output
├── external/              # Raw data files
├── tests/                 # Python test suite
└── docs/                  # Documentation
```

## Common Issues and Solutions

### Node.js Version Issues

**Problem:** Build fails with syntax errors

**Solution:** Ensure Node.js LTS (v20+) is installed:

```bash
nvm install 20
nvm use 20
```

### Permission Errors

**Problem:** `EACCES` errors when installing packages

**Solution:** Fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Out of Memory During Build

**Problem:** Build fails with memory errors

**Solution:** Reduce concurrency limit in `.env`:

```env
BUILD_CONCURRENCY_LIMIT=50
```

### Python Test Failures

**Problem:** Python tests won't run

**Solution:** Use standalone runner (no dependencies):

```bash
python3 tests/run_tests.py
```

### Link Validation Failures

**Problem:** Many broken links reported

**Solution:** This is expected if you haven't run the full build pipeline. Run:

```bash
npm run etl && npm run build && npm run validate-links
```

## Next Steps

After setup, consider:

- Reading [Architecture Blueprint](blueprint.md) for technical details
- Reading [API Documentation](api.md) for module contracts
- Reading [Testing Guide](testing.md) for test details

## Troubleshooting Commands

```bash
# Clear all generated output and rebuild
rm -rf dist data/*.csv sitemap*.xml
npm run etl && npm run build

# Check for circular dependencies
npm ls

# View detailed error output
node scripts/build-pages.js

# Verbose testing
npm run test:js -- --verbose
```
