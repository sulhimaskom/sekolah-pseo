# Prettier Format Violations in docs/issues/2026-07-30/

**Category**: docs
**Priority**: P3
**Evaluation Date**: 2026-07-31
**File**: docs/issues/2026-07-31/005-docs-formatting-violations.md

## Problem Statement

Three documentation files fail `npm run format:check`:

```
[warn] docs/issues/2026-07-30/00-audit-report.md
[warn] docs/issues/2026-07-30/01-phase2-hardening.md
[warn] docs/issues/2026-07-30/02-phase3-strategic-expansion.md
Code style issues found in 3 files. Run Prettier with --write to fix.
```

## Evidence

- `npm run format:check` → exit non-zero, 3 warnings (2026-07-31 run)
- Files committed in `9dd1998` (2026-07-30 docs commit)

## Impact

- `format:check` gate fails → CI pipeline red on push
- Markdown tables/alignment drift from repo standard

## Suggested Fix

```bash
npx prettier --write docs/issues/2026-07-30/
```

Include the fix in the next docs commit. Prefer a prettier pre-commit hook for docs (`.pre-commit-config.yaml` exists) or extend lint-staged to markdown.
