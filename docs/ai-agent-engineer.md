# AI Agent Engineer - Domain Knowledge

This document serves as the long-term memory for the ai-agent-engineer agent.

## Domain Overview

The ai-agent-engineer domain focuses on improving the automation and agent infrastructure of this repository. The repository uses OpenCode AI agents for automated software engineering tasks.

## Repository Context

- **Project**: Sekolah PSEO - Indonesian School SEO Platform
- **Tech Stack**: Node.js (scripts), Python (tests), JavaScript (frontend)
- **CI/CD**: GitHub Actions with OpenCode integration
- **Testing**: Node.js native test runner + Python pytest

## Key Files & Patterns

### Scripts (`scripts/`)
- `build-pages.js` - Static HTML page generation
- `etl.js` - Data extraction and transformation
- `sitemap.js` - Sitemap generation
- `validate-links.js` - Link validation
- `rate-limiter.js` - Rate limiting for API calls
- `resilience.js` - Retry, circuit breaker patterns
- `utils.js` - Utility functions

### Tests (`scripts/*.test.js`, `tests/*.py`)
- JavaScript tests: `node --test scripts/*.test.js`
- Python tests: `python3 -m pytest tests/`
- Combined: `npm test`

### GitHub Actions (`.github/workflows/`)
- `on-push.yml` - Main automation workflow
- `on-pull.yml` - Pull request checks
- `parallel.yml` - Parallel job execution

## Improvement Patterns

### Valid Improvements
1. **Test Coverage** - Add missing tests for edge cases
2. **Code Quality** - Fix lint issues, improve code structure
3. **CI/CD** - Optimize GitHub Actions workflows
4. **Documentation** - Improve README, add code comments
5. **Performance** - Optimize slow operations
6. **Error Handling** - Add better error messages, logging

### Improvement Criteria
- Must be **small** and **atomic**
- Must be **safe** (no breaking changes)
- Must be **measurable** (can verify improvement)
- Must not introduce unnecessary abstraction
- Must not refactor unrelated modules

## Common Tasks

1. **Initiate**: Check for existing ai-agent-engineer PRs/issues
2. **Scan**: Proactively find improvements in:
   - Test coverage gaps
   - Code quality issues
   - CI/CD inefficiencies
   - Documentation gaps
3. **Implement**: Make the improvement
4. **Verify**: Run tests, ensure build passes
5. **PR**: Create PR with `ai-agent-engineer` label

## Notes

- This repository uses a sophisticated multi-phase agent system (00-11 flows)
- The agent should focus on infrastructure/improvement tasks, not new features
#QQ|- Always sync with default branch before creating PR

## Recent Improvements

- **2026-02-25**: Fixed Prettier formatting in scripts/*.js (8 test files) - added missing newlines at EOF, reformatted import statements

- **2026-02-26**: Added trailing newline to config.js - follows POSIX standard for text files

- **2026-02-26**: Added test coverage for two previously untested modules:
  - `scripts/manifest.test.js` - Tests for build manifest module (computeSchoolHash, getChangedSchools, getUnchangedSchools)
  - `scripts/homepage.test.js` - Tests for homepage HTML generation (aggregateByProvince, generateHomepageHtml)