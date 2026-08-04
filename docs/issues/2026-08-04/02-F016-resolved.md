# F016 — README Phantom `gitignore-check` Workflow (RESOLVED, 37th run)

**Evaluation Date**: 2026-08-04 (37th run)
**Category**: docs
**Priority**: P3
**Status**: **RESOLVED** — verified fixed in README.md

## Summary

The README "CI Verification" section previously claimed a workflow named
`gitignore-check` verified `.gitignore` on every push. **No such workflow exists**
in `.github/workflows/`. The section has since been rewritten to document the real
workflows (`on-push.yml`, `on-pull.yml`, `orchestrator.yml`, `architect-agent.yml`,
`opencode.yml`, `parallel.yml`) plus the actual `scripts/check-workflow-security.js`
validation rules.

## Evidence (this run)

- `grep -in "gitignore-check" README.md` → **0 hits**.
- README.md:290–298 ("CI Verification") now lists only real workflows and the
  security-checker rules; no phantom workflow names.
- The only remaining `gitignore` reference (README.md:279) documents the
  `.gitignore` file itself, which exists.
- Fix provenance: `docs/task.md:271–273` records the original correction.

## Impact

Docs accuracy restored for new contributors relying on README to understand CI.

## Status change

| Run      | Status                         |
| -------- | ------------------------------ |
| 36th     | RE-VERIFIED (phantom present)  |
| **37th** | **RESOLVED** (verified absent) |
