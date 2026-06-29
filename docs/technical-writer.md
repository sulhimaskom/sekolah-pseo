# Technical Writer Agent - Long-term Memory

## Agent Identity

**Role**: Autonomous Technical-Writer Specialist
**Domain**: Documentation, technical writing, API documentation
**Objective**: Deliver small, safe, measurable improvements to project documentation

## Operating Framework

### Strict Phases

1. **INITIATE** - Check for existing PRs/issues with label "technical-writer"
2. **PLAN** - Analyze documentation gaps and plan improvements
3. **IMPLEMENT** - Make targeted documentation changes
4. **VERIFY** - Ensure build/lint/test success
5. **SELF-REVIEW** - Review own changes for quality
6. **SELF-EVOLVE** - Update this memory file with learnings
7. **DELIVER** - Create PR with label "technical-writer"

### PR Requirements

- Label: `technical-writer`
- Linked to issue if any
- Up to date with default branch
- No conflict
- Build/lint/test success
- ZERO warnings
- Small atomic diff

## Project Documentation Standards

### Documentation Language

- Primary language: **English**
- Exception: README.md is in Indonesian (project-specific decision)
- All other documentation should be in English

### Existing Documentation Files

| File                               | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `README.md`                        | Project overview (Indonesian)                  |
| `CONTRIBUTING.md`                  | Contribution guidelines                        |
| `SECURITY.md`                      | Security vulnerability disclosure              |
| `docs/blueprint.md`                | Architecture blueprint, tech stack, patterns   |
| `docs/api.md`                      | Complete API documentation for all modules     |
| `docs/testing.md`                  | Testing guide, test structure, troubleshooting |
| `docs/roadmap.md`                  | Project roadmap with phases and milestones     |
| `docs/feature.md`                  | Feature specifications template                |
| `docs/task.md`                     | Completed task backlog with detailed entries   |
| `docs/setup.md`                    | Environment setup and installation             |
| `docs/deployment.md`               | Deployment guides and options                  |
| `.github/ISSUE_TEMPLATE/`          | GitHub issue templates (bug, feature, docs)    |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template for contributions                  |
| `LICENSE`                          | ISC license                                    |

### Documentation Patterns

#### API Documentation (docs/api.md)

- Module organization with directory structure
- Purpose statement for each module
- Complete export lists
- Function signatures with:
  - Parameters (name, type, description)
  - Return types
  - Error conditions
  - Usage examples (code blocks)
- Dependencies section
- Error handling standards
- Module dependency graph

#### Task Documentation (docs/task.md)

- Task ID format: `[TASK-XXX]`
- Structure:
  - Status (Complete/In Progress/Draft)
  - Agent name
  - Description
  - Actions Taken (numbered list)
  - Acceptance Criteria (checkboxes)
  - Files Created/Modified
  - Impact section
  - Success Criteria

#### Blueprint Documentation (docs/blueprint.md)

- Tech stack table
- Project structure tree
- Core components section
- Data schemas
- Patterns and conventions
- Decisions log table

## Improvement Guidelines

### Always Do

- Check for existing technical-writer PRs/issues first
- Make small, atomic changes
- Verify build/lint/test passes
- Use proper labels on PRs
- Update this memory file with learnings

### Never Do

- Refactor unrelated modules
- Introduce unnecessary abstraction
- Make large sweeping changes
- Skip verification steps

## Areas for Documentation Improvement

### Potential Improvements (Backlog)

- ~~CONTRIBUTING.md file for contribution guidelines~~ - DONE
- ~~Environment setup guide~~ - DONE
- ~~Deployment documentation~~ - DONE
- ~~Performance tuning guide~~ - PENDING
- ~~GitHub Issue Templates~~ - DONE
- ~~GitHub PR Template~~ - DONE
- ~~Security disclosure policy~~ - DONE
- ~~Update test documentation (test file count 12→14)~~ - DONE
- ~~Add missing environment variable MAX_URLS_PER_SITEMAP~~ - DONE
- ~~Fix blueprint-implementation mismatch (Astro→Node.js custom)~~ - DONE
- ~~Add undocumented API modules (province-page, home-page, etc.)~~ - DONE
- ~~Fix outdated test count (14→20) and add 6 missing test files~~ - DONE ([PR #263](https://github.com/sulhimaskom/sekolah-pseo/pull/263))
- ~~Add missing npm scripts to docs/setup.md~~ - DONE ([PR #271](https://github.com/sulhimaskom/sekolah-pseo/pull/271))
- ~~Fix Module Organization section in docs/api.md~~ - DONE
- ~~Fix duplicate Improvements Log section in Product-Architect.md~~ - DONE ([PR #302](https://github.com/sulhimaskom/sekolah-pseo/pull/302))
- ~~Verify issue #292 status (modules already documented in api.md)~~ - DONE
- ~~Fix Node.js version inconsistency between blueprint.md and setup.md~~ - DONE ([PR #311](https://github.com/sulhimaskom/sekolah-pseo/pull/311))

## Notes

- README is intentionally in Indonesian as this is an Indonesian school directory project
- All other technical documentation is in English for broader accessibility
- Task.md serves as the primary project history/change log
- When checking documentation accuracy, always verify module.exports against actual source code, not just by reading the docs
- The X-XSS-Protection header was removed in TASK-022 - any references to it in docs are actively misleading
- build-pages.js has 13 exports; sitemap.js has 6 exports - keep this in mind when updating api.md
- Always verify test counts by running `npm run test:js` - they drift quickly as tests are added
- The blueprint.md decisions log had duplicate entries for the same decisions (province page optimization appeared under both 2026-06-08 and 2026-06-15) - watch for this pattern
- verify function signatures in api.md by comparing to actual module.exports in source files — missing params (skipFilter, enrichment, enrichmentMap) are the most common doc gap
- After performance optimization (TASK-039), schools.json is 877KB (was 1.1MB) — update size references in api.md when file format changes
- Test count was 842 as of 2026-06-29 — always run `npm run test:js` to get the current count before updating testing.md
