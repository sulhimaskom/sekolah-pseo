# DX-Engineer Agent Documentation

## Overview

This document serves as the long-term memory for the DX-engineer agent. It records conventions, tools, and improvements made to enhance developer experience.

## Current State (Last Updated: 2026-02-25)

### Project Type

- Node.js project with JavaScript
- Uses CommonJS module system
- Includes JavaScript and Python tests

### Code Quality Tools

#### ESLint

- **Status**: Configured and working
- **Config file**: `.eslintrc.js`
- **Rules**: strict (no-unused-vars, no-undef, semi, quotes, no-var, prefer-const)
- **Run**: `npm run lint`

#### Prettier

- **Status**: Added 2026-02-25
- **Config file**: `.prettierrc`
- **Settings**:
  - Semi: true
  - Single quotes: true
  - Tab width: 2
  - Trailing comma: es5
  - Print width: 100
- **Run**:
  - Check: `npm run format:check`
  - Format: `npm run format`

### CI Integration

- **GitHub Actions Workflow**: `.github/workflows/lint.yml`
- Runs on: Pull requests to main branch
- Jobs:
  - `lint`: Runs ESLint
  - `format`: Runs Prettier format check

### Test Suite

- **JavaScript tests**: `npm run test:js` (Node.js native test runner)
- **Python tests**: `npm run test:py` (custom test runner)
- **All tests**: `npm test`

### Available Scripts

| Script                   | Description               |
| ------------------------ | ------------------------- |
| `npm run build`          | Build static pages        |
| `npm run etl`            | Run ETL process           |
| `npm run sitemap`        | Generate sitemap          |
| `npm run validate-links` | Validate links            |
| `npm run lint`           | Run ESLint                |
| `npm run format`         | Format code with Prettier |
| `npm run format:check`   | Check formatting          |
| `npm run test`           | Run all tests             |
| `npm run test:js`        | Run JavaScript tests      |
| `npm run test:py`        | Run Python tests          |

## DX Improvements Log

### 2026-02-25

- **Added Prettier** configuration for code formatting
- Added `format` and `format:check` scripts to package.json
- Created this documentation file
- **Added CI integration** for lint/format checks (GitHub Actions workflow)

## Future Improvement Opportunities

1. **Git hooks (husky)**: Add pre-commit linting/formatting
2. **CI integration**: Add lint/format checks to GitHub Actions ✅ DONE
3. **EditorConfig**: Add for IDE consistency
4. **Dependabot**: Automate dependency updates
