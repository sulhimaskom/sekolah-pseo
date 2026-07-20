# Issue: Stale historical audit reports clutter docs directory

**Suggested Labels**: `chore`, `P2`  
**Directory**: `docs/`

## Problem

The `docs/` directory contains 40 files, with **20+ historical audit reports** dating back to 2026-06-09:

- `docs/audit-report-2026-06-09.md`
- `docs/audit-report-2026-06-11.md`
- `docs/audit-report-2026-06-17.md`
- `docs/audit-report-2026-06-22.md`
- `docs/audit-report-2026-06-28.md`
- `docs/audit-report-2026-06-29.md`
- `docs/audit-report-2026-07-05.md`
- `docs/audit-report-2026-07-06.md`
- `docs/audit-report-2026-07-07.md`
- `docs/audit-report-2026-07-11.md`
- `docs/audit-report-2026-07-12.md`
- `docs/audit-report-2026-07-13.md`
- `docs/issues/2026-07-13/*.md` (5 files)
- `docs/issues/2026-07-18/*.md` (2 files)

These are historical snapshots that:

- Duplicate information found in newer reports
- Make the docs directory hard to navigate
- Increase repository size
- No clear archival strategy

## Impact

- **MEDIUM**: Documentation bloat and navigability
- New contributors face signal-to-noise ratio issues in docs/
- Audit findings may reference outdated issues

## Fix

1. Archive historical reports to a `docs/archive/` subdirectory
2. Keep only the latest audit report at `docs/audit-report.md`
3. Update the README to reference the current audit documentation location
