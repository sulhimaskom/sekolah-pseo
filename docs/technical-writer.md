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

| File                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `README.md`         | Project overview (Indonesian)                  |
| `docs/blueprint.md` | Architecture blueprint, tech stack, patterns   |
| `docs/api.md`       | Complete API documentation for all modules     |
| `docs/testing.md`   | Testing guide, test structure, troubleshooting |
| `docs/roadmap.md`   | Project roadmap with phases and milestones     |
| `docs/feature.md`   | Feature specifications template                |
| `docs/task.md`      | Completed task backlog with detailed entries   |
| `LICENSE`           | ISC license                                    |

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

- ~~CONTRIBUTING.md file for contribution guidelines~~ - DONE: Created CONTRIBUTING.md with setup, scripts, code style, and testing guidelines
- ~~Environment setup guide~~ - DONE: Created docs/setup.md with prerequisites, installation, configuration, and troubleshooting
- ~~Deployment documentation~~ - DONE: Created docs/deployment.md with GitHub Pages, Netlify, Vercel, Docker, and traditional hosting guides
- ~~Performance tuning guide~~ - PENDING: Can be added if needed
#VN|- ~~Security disclosure policy~~ - DONE: Created SECURITY.md with vulnerability reporting guidelines, supported versions, and security best practices

## Notes

- README is intentionally in Indonesian as this is an Indonesian school directory project
- All other technical documentation is in English for broader accessibility
- Task.md serves as the primary project history/change log
