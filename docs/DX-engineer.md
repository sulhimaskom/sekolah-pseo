# DX-Engineer Agent Documentation

This document serves as the long-term memory for the DX-engineer agent. It records conventions, tools, and improvements made to enhance developer experience.

## Current State (Last Updated: 2026-02-26)

### Project Type

- Node.js project with JavaScript
- Uses CommonJS module system (`"type": "commonjs"` in package.json)
- Includes JavaScript and Python tests
- Requires Node.js >=20.0.0

### Code Quality Tools

#### ESLint

- **Status**: Configured and working
- **Config file**: `eslint.config.js`
- **Rules**: strict (no-unused-vars, no-undef, semi, quotes, no-var, prefer-const)
- **Run**: `npm run lint`

#### Prettier

- **Status**: Configured
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

#### EditorConfig

- **Status**: Configured
- **Config file**: `.editorconfig`
- Provides IDE consistency

### CI Integration

- **GitHub Actions Workflow**: `.github/workflows/on-pull.yml`
- Runs on: Pull requests to main branch
- Jobs:
  - `lint`: Runs ESLint
  - `format`: Runs Prettier format check

### Git Hooks (Husky)

- **Status**: Configured
- **Config**: `.husky/pre-commit`
- Runs lint-staged on pre-commit

### Test Suite

- **JavaScript tests**: `npm run test:js` (Node.js native test runner)
- **Python tests**: `npm run test:py` (custom test runner)
- **All tests**: `npm test`
- **Coverage**: `npm run coverage` (requires 80% lines, 75% branches)

### Structured Logging

- **Library**: `pino`
- **Module**: `scripts/logger.js`
- **Configuration**:
  - Default level: `info`
  - LOG_LEVEL env var support: trace, debug, info, warn, error, fatal
  - Timestamps: ISO 8601 format
- **Run**: Set `LOG_LEVEL=debug node scripts/your-script.js`

### Dependabot

- **Status**: Configured 2026-02-26
- **Config file**: `.github/dependabot.yml`
- **Schedule**: Weekly (Monday 09:00 UTC)
- **Updates**:
  - npm packages (dependencies and devDependencies)
  - GitHub Actions
- **Labels**: dependencies, DX-engineer

### Node.js Version

- **Required**: >=20.0.0
- **Config files**:
  - `package.json`: `engines` field
  - `.nvmrc`: `20` (for nvm users)

### Devcontainer

- **Status**: Configured
- **Config file**: `.devcontainer/devcontainer.json`
- **Base image**: `mcr.microsoft.com/devcontainers/javascript-node:20`
- **Features**: OpenCode integration
- **Extensions**: ESLint, Prettier
- **Post-create**: Runs `npm install` automatically
- **Ports**: 3000 (Application), 8080 (Preview)

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
| `npm run coverage`       | Run tests with coverage   |

## DX Improvements Log

### 2026-02-27

- **Fixed schools.csv gitignore**: Added `schools.csv` to `.gitignore`, removed from git tracking (~539KB reduction for future clones)

### 2026-02-26

### 2026-02-26

- **Added Dependabot**: Automated dependency updates for npm and GitHub Actions (weekly schedule)
- **Added Structured Logging (Pino)**: Added `pino` logger in `scripts/logger.js` with LOG_LEVEL support
- **Added Node.js version consistency**: Added `engines` field to package.json (>=20.0.0) and `.nvmrc` file
- **Added Husky + lint-staged**: Pre-commit hooks for automatic linting/formatting
- **Improved Devcontainer**: Enhanced `.devcontainer/devcontainer.json` with Node.js 20 image, VSCode extensions (ESLint, Prettier), automatic `npm install`, and port forwarding (3000, 8080)

### 2026-02-25

- **Added Prettier** configuration for code formatting
- **Added CI integration** for lint/format checks (GitHub Actions workflow)
- **Added EditorConfig** for IDE consistency
- Created this documentation file

## Future Improvement Opportunities

1. **Auto-merge Dependabot PRs**: Enable automerge for patch/minor updates (requires code owner review)
2. **Security updates**: Enable Dependabot security updates
3. **Dependabot PR limits**: Consider increasing open-pull-requests-limit after initial testing
