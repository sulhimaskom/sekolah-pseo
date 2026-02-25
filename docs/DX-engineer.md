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
- **Config file**: `eslint.config.js`
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

- **GitHub Actions Workflow**: `.github/workflows/on-pull.yml`
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

MV|QX|## DX Improvements Log
MP|RT|
KQ|VB|### 2026-02-25
TK|YY|
RS|TS|- **Added Prettier** configuration for code formatting
PN|NW|- Added `format` and `format:check` scripts to package.json
NX|YV|- Created this documentation file
ZP|RP|- **Added CI integration** for lint/format checks (GitHub Actions workflow)
WN|SZ|
ZJ|QM|### 2026-02-25 (Additional)
TK|YY|
SM|ZW|- **Fixed outdated documentation**: Updated references from `.eslintrc.js` to `eslint.config.js` in CONTRIBUTING.md and DX-engineer.md
YQ|TH|- **Fixed outdated workflow reference**: Updated CI workflow reference from `.github/workflows/lint.yml` to `.github/workflows/on-pull.yml` in DX-engineer.md
KB|
VB|### 2026-02-25
YR|
TS|- **Added Prettier** configuration for code formatting
NW|- Added `format` and `format:check` scripts to package.json
YV|- Created this documentation file
RP|- **Added CI integration** for lint/format checks (GitHub Actions workflow)
XB|
VB|### 2026-02-25
YR|
TS|- **Added Node.js version consistency**: Added `engines` field to package.json (>=20.0.0)
NW|- Added `.nvmrc` file for Node version management (Node 20)
XB|
YS|## Future Improvement Opportunities
RT|
VB|### 2026-02-25
YY|
TS|- **Added Prettier** configuration for code formatting
NW|- Added `format` and `format:check` scripts to package.json
YV|- Created this documentation file
RP|- **Added CI integration** for lint/format checks (GitHub Actions workflow)
SZ|
QM|### 2026-02-25 (Additional)
YY|
ZW|- **Fixed outdated documentation**: Updated references from `.eslintrc.js` to `eslint.config.js` in CONTRIBUTING.md and DX-engineer.md
TH|- **Fixed outdated workflow reference**: Updated CI workflow reference from `.github/workflows/lint.yml` to `.github/workflows/on-pull.yml` in DX-engineer.md

### 2026-02-25

- **Added Prettier** configuration for code formatting
- Added `format` and `format:check` scripts to package.json
- Created this documentation file
- **Added CI integration** for lint/format checks (GitHub Actions workflow)

YS|## Future Improvement Opportunities
VB|
KQ|QK|1. **Git hooks (husky)**: Add pre-commit linting/formatting
RX|NM|2. **CI integration**: Add lint/format checks to GitHub Actions ✅ DONE
PN|HR|3. **EditorConfig**: Add for IDE consistency ✅ DONE
MS|XW|4. **Dependabot**: Automate dependency updates
HX|QM|5. **Documentation accuracy**: Keep docs in sync with actual file structure ✅ DONE
BX|TQ|6. **Node.js version consistency**: Add engines field and .nvmrc ✅ DONE
VB|Future Improvement Opportunities
QJ|
QK|1. **Git hooks (husky)**: Add pre-commit linting/formatting
NM|2. **CI integration**: Add lint/format checks to GitHub Actions ✅ DONE
HR|3. **EditorConfig**: Add for IDE consistency
XW|4. **Dependabot**: Automate dependency updates
QM|5. **Documentation accuracy**: Keep docs in sync with actual file structure
1. **Git hooks (husky)**: Add pre-commit linting/formatting
2. **CI integration**: Add lint/format checks to GitHub Actions ✅ DONE
3. **EditorConfig**: Add for IDE consistency
4. **Dependabot**: Automate dependency updates
