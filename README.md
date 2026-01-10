# Sekolah PSEO

A static site generator for Indonesian school directory data, transforming raw CSV data into accessible, responsive HTML pages with built-in SEO and security features.

## What and Why

Sekolah PSEO processes Indonesian school data from CSV format and generates a static website with individual school profile pages. The system provides:

- **Automated Data Processing**: ETL pipeline for cleaning and validating school data
- **Static Site Generation**: Fast, secure HTML pages with no database dependencies
- **Responsive Design**: Mobile-first design that works on all devices
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation and ARIA support
- **SEO**: Schema.org structured data for search engine indexing
- **Security**: XSS prevention, input validation, and security headers

## Quick Start

Get started in under 5 minutes with these steps:

### 1. Clone and Install

```bash
git clone https://github.com/sulhimaskom/sekolah-pseo.git
cd sekolah-pseo
npm install
```

### 2. Prepare Your Data

Place your raw school data CSV in `external/raw.csv`. Expected columns:

```csv
npsn,nama,bentuk_pendidikan,status,provinsi,kab_kota,kecamatan,alamat
"12345678","SMA Negeri 1 Jakarta","SMA","Negeri","DKI Jakarta","Jakarta Pusat","Gambir","Jl. Jend. Sudirman No. 1"
"87654321","SD Negeri 2 Bandung","SD","Negeri","Jawa Barat","Kota Bandung","Cicendo","Jl. Asia Afrika No. 2"
```

### 3. Process Data

Run the ETL pipeline to clean and validate your data:

```bash
npm run etl
```

Output: `data/schools.csv` (cleaned, validated data)

### 4. Build Pages

Generate static HTML pages for all schools:

```bash
npm run build
```

Output: `dist/` directory with school pages organized by location:

```
dist/
├── dki-jakarta/
│   └── jakarta-pusat/
│       ├── gambir/
│       │   ├── 12345678-sma-negeri-1-jakarta.html
│       │   └── ...
└── jawa-barat/
    └── kota-bandung/
        ├── cicendo/
        │   ├── 87654321-sd-negeri-2-bandung.html
        │   └── ...
```

### 5. Generate Sitemap

Create XML sitemaps for SEO:

```bash
npm run sitemap
```

Output: `dist/sitemap.xml` and `dist/sitemap-index.xml`

### 6. Validate Links (Optional)

Check for broken internal links:

```bash
npm run validate-links
```

## Configuration

Configure behavior using environment variables (see `.env.example`):

### Required Configuration

```bash
# Site URL for sitemap generation
SITE_URL=https://yourdomain.com
```

### Optional Configuration

```bash
# Raw data file location (default: external/raw.csv)
RAW_DATA_PATH=external/raw.csv

# Page build concurrency (default: 100, max: 1000)
BUILD_CONCURRENCY_LIMIT=100

# Link validation concurrency (default: 50, max: 500)
VALIDATION_CONCURRENCY_LIMIT=50

# URLs per sitemap file (default: 50000, max: 50000)
MAX_URLS_PER_SITEMAP=50000
```

Create a `.env` file with your settings:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Generate static HTML pages from processed data |
| `npm run etl` | Process raw CSV: clean, normalize, and validate |
| `npm run sitemap` | Generate XML sitemaps for SEO |
| `npm run validate-links` | Check internal links for broken references |
| `npm test` | Run all test suites |
| `npm run lint` | Run ESLint code quality checks |

## Project Structure

```
sekolah-pseo/
├── src/
│   ├── presenters/          # Presentation layer
│   │   ├── templates/       # HTML templates
│   │   ├── design-system.js # Design tokens (colors, spacing)
│   │   └── styles.js        # Responsive CSS
│   └── services/            # Business logic layer
│       └── PageBuilder.js   # Page generation logic
├── scripts/                 # Controllers and utilities
│   ├── build-pages.js       # Build controller
│   ├── etl.js              # Data ETL
│   ├── sitemap.js          # Sitemap generator
│   ├── validate-links.js   # Link validation
│   ├── config.js           # Configuration
│   ├── utils.js            # Utilities (CSV, HTML escaping)
│   ├── resilience.js       # Retry, timeout, circuit breaker
│   ├── fs-safe.js          # Resilient file operations
│   └── slugify.js          # URL slug generation
├── data/
│   └── schools.csv         # Processed school data
├── dist/                   # Generated HTML (output)
└── external/
    └── raw.csv             # Raw input data
```

## Development

### Testing

Run all tests:

```bash
npm test
```

Run specific test categories:

```bash
# JavaScript tests only
npm run test:js

# Python tests only (if available)
npm run test:py
```

### Code Quality

Check code style:

```bash
npm run lint
```

### Data Format

Required CSV fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npsn` | Numeric | Yes | National School ID (must be numeric) |
| `nama` | String | Yes | School name |
| `bentuk_pendidikan` | String | No | School type (SD, SMP, SMA, SMK, etc.) |
| `status` | String | No | School status (Negeri, Swasta) |
| `provinsi` | String | Yes | Province |
| `kab_kota` | String | Yes | City/Regency |
| `kecamatan` | String | Yes | District |
| `alamat` | String | No | Street address |

## Troubleshooting

### Build Fails with "School data not found"

**Problem**: ETL process hasn't been run or output file is missing.

**Solution**:
```bash
npm run etl
npm run build
```

### School Pages Missing Required Fields

**Problem**: CSV data is missing required fields or has invalid format.

**Solution**:
- Check that `npsn` is numeric
- Ensure required fields are not empty: `nama`, `npsn`, `provinsi`, `kab_kota`, `kecamatan`
- Validate CSV encoding (use UTF-8)
- Run `npm run etl` to see validation errors

### Sitemap URLs Use Default Domain

**Problem**: `SITE_URL` not set or .env file missing.

**Solution**:
```bash
cp .env.example .env
# Edit .env and set SITE_URL=https://yourdomain.com
npm run sitemap
```

### Link Validation Finds Broken Links

**Problem**: Internal links reference non-existent pages.

**Solution**:
- Rebuild pages: `npm run build`
- Check that ETL processed all schools: `npm run etl`
- Validate CSV data format

### Build Timeout or Performance Issues

**Problem**: Large dataset causing slow builds.

**Solution**:
```bash
# Adjust concurrency in .env
BUILD_CONCURRENCY_LIMIT=50  # Reduce if system resources limited
```

### Indonesian Characters Not Displaying Correctly

**Problem**: CSV file encoding issue.

**Solution**:
- Ensure CSV is UTF-8 encoded
- Check that special characters (é, ü, etc.) are properly saved
- Test with: `file external/raw.csv` should show "UTF-8 Unicode text"

## Architecture

This project follows a layered architecture:

1. **Controller Layer** (`scripts/`): Orchestrates workflows
2. **Service Layer** (`src/services/`): Business logic
3. **Presentation Layer** (`src/presenters/`): Templates and styles

Key patterns:
- **Resilience**: All file operations use timeout, retry, and circuit breaker patterns
- **Security**: Input validation, HTML escaping, security headers
- **Performance**: Slugify caching, directory pre-creation, concurrent processing

For detailed architecture documentation, see `docs/blueprint.md`.

## API Documentation

Complete API documentation for all internal modules is available in `docs/api.md`.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Submit a pull request

## License

ISC

## Links

- [GitHub Repository](https://github.com/sulhimaskom/sekolah-pseo)
- [Issue Tracker](https://github.com/sulhimaskom/sekolah-pseo/issues)
