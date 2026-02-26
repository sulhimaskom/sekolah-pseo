# Contributing to Sekolah PSEO

Thank you for your interest in contributing to the Sekolah PSEO project.

## Development Setup

### Prerequisites

- Node.js (LTS version)
- Python 3.x
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sulhimaskom/sekolah-pseo.git
cd sekolah-pseo

# Install Node.js dependencies
npm install
```

### Pre-commit Hooks

This project uses pre-commit hooks to enforce code quality. After installing dependencies, set up the hooks:

```bash
# Install pre-commit
pip install pre-commit

# Install git hook scripts
pre-commit install
```

The hooks will automatically run ESLint and Prettier on staged files before each commit.

## Available Scripts


| Command                  | Description                             |
| ------------------------ | --------------------------------------- |
| `npm run etl`            | Run ETL pipeline to process school data |
| `npm run build`          | Generate static HTML pages              |
| `npm run sitemap`        | Generate sitemap.xml                    |
| `npm run validate-links` | Validate internal links                 |
| `npm run lint`           | Run ESLint                              |
| `npm run format`         | Format code with Prettier               |
| `npm run test`           | Run all tests                           |

## Code Style

- **Language**: JavaScript (CommonJS)
- **Linting**: ESLint (configured in `eslint.config.js`)
- **Formatting**: Prettier (configured in `.prettierrc`)

Run linting and formatting before committing:

```bash
npm run lint
npm run format
```

## Testing

The project uses both JavaScript and Python tests:

```bash
# Run all tests
npm test

# Run JavaScript tests only
npm run test:js

# Run Python tests only
npm run test:py
```

## Project Structure

```
sekolah-pseo/
├── src/              # Source code (templates, services)
├── scripts/          # Build scripts and utilities
├── data/             # Processed school data
├── dist/             # Generated HTML output
├── tests/            # Python tests
└── docs/             # Documentation
```

## Submitting Changes

1. Create a branch for your feature or fix
2. Make your changes
3. Run lint, format, and tests to ensure code quality
4. Submit a pull request with a clear description

## Documentation

- Project overview: `README.md` (in Indonesian)
- Architecture: `docs/blueprint.md`
- API documentation: `docs/api.md`
- Testing guide: `docs/testing.md`
