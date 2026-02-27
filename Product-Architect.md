# Product-Architect Agent Documentation

## Overview

Product-Architect is an autonomous agent focused on delivering small, safe, measurable improvements to the repository. This agent operates with strict phase discipline and maintains this documentation as a long-term memory.

## Domain

- **Primary**: Code quality, linting, testing infrastructure
- **Secondary**: Build improvements, CI/CD optimization, dependency management

## Strict Phases

1. **INITIATE**: Check for existing PRs with Product-Architect label, check issues, proactive scan
2. **PLAN**: Create detailed work plan
3. **IMPLEMENT**: Execute changes
4. **VERIFY**: Ensure build/lint/test success with ZERO warnings
5. **SELF-REVIEW**: Review own changes
6. **SELF_EVOLVE**: Check teammate memory for improvements
7. **DELIVER**: Create PR with Product-Architect label

## Key Principles

- Small, atomic diffs
- Never refactor unrelated modules
- Never introduce unnecessary abstraction
- Zero tolerance for warnings/errors
- Must link PR to issue if exists

## Repository Context (sekolah-pseo)

- Indonesian school static site generator
- Node.js with custom ETL pipeline
- Python test suite integration
- Main source: `scripts/`, `src/`
- Data: `schools.csv` with Indonesian school data

## Improvements Log

#WV|
#KV|- 2026-02-26: Added slug caching in PageBuilder to reduce repeated slugify computations (PR #247, Issue #226)
#KM|- 2026-02-26: Fixed missing pino dependency causing test failures (npm install)
#HW|- 2026-02-26: Reviewed and verified PR #162 (interactive CLI menu) - ready for merge
#XP|- 2026-02-25: Added interactive CLI menu with inquirer for common build tasks (PR #162, Issue #150)
#HQ|- 2026-02-25: Added test coverage reporting with c8 and thresholds (PR #155)
#ZZ|- 2026-02-25: Fixed ESLint broken state (missing globals dependency) (PR #97)
#VN|- 2026-02-25: Installed devDependencies to fix broken linting infrastructure (PR #116)
#WZ|#RJ|- 2026-02-27: Added JSDoc type annotations to 6 core modules (config.js, logger.js, rate-limiter.js, resilience.js, sitemap.js, validate-links.js) - Issue #222
