# Phase 2 — Feature Hardening & Integration Findings (27th run, 2026-08-02)

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — records persisted per
> repo convention (finding 002, 24th consecutive block). Discovered during Phase 1 audit +
> structural inventory of the 27th verification run.
> **Evaluation date**: 2026-08-02
> **Labels**: per-finding category + priority

## Scope Compliance

All findings below are **non-cosmetic** hardening actions tied to existing features and
documented gaps. No new features, no UI polish, no rename-only refactors, no cosmetic cleanup.

---

## H1 — Consolidate duplicated validator logic into data-schema.js

> **Labels**: `refactor`, `P2`

### Finding

`isNonEmpty` + `isValidCoordinate` are identically re-implemented in
`scripts/data-quality.js:52,65` AND `scripts/data-schema.js:165,189`. `validateRecord` is
re-implemented in `scripts/etl.js:116` while `data-schema.js:219` provides the centralized
schema validator (and `etl.js:346` already calls `SCHEMA.validateRecord` for the second path —
two divergent validation branches in the same module).

### Traceability

- Existing feature: ETL data validation (`docs/blueprint.md` §Data Quality) and data-quality CLI.
- Documented intent: `data-schema.js` header declares itself the centralized schema authority.

### Action

- `data-quality.js` should import `isNonEmpty`/`isValidCoordinate` from `data-schema.js`
  (it already re-exports `SCHEMA.isNonEmpty`/`SCHEMA.isValidCoordinate` at lines 398–399 —
  the local copies are redundant).
- `etl.js` should use a single `SCHEMA.validateRecord` path; remove the divergent branch.
- Add a cross-module assertion test that both modules agree on the same validation rules.

---

## H2 — Fix the F014 parallel-test race root cause (shared DIST_DIR)

> **Labels**: `test`, `P1`

### Finding

Parallel test files (`build-orchestrator.test.js`, `build-pages.test.js`, `sitemap.test.js`,
`validate-links.test.js`) all write to the shared `CONFIG.DIST_DIR` (`dist/`). Under
`node --test` concurrency this races: **OBSERVED again this run (2/5 full-suite runs failed
with `ERR_ASSERTION`)** at `build-orchestrator.test.js:178` (`generates dist files via
sharedPagesPromise` / `prepareBuildEnvironment`).

### Traceability

- Existing feature: incremental build + manifest (`README.md` §Build Inkremental).
- Documented intent: deterministic CI (F014 has flapped 6+ sessions).

### Action

- Isolate `DIST_DIR` per test file (unique temp dir per suite, cleanup in `after`), OR
  run test files serially with `--test-concurrency=1`, OR give each test file a distinct
  output subdir. Prefer isolation — it preserves parallelism and removes the race permanently.
- Add a CI gate that runs the suite 3× to smoke-test determinism.

---

## H3 — Make the workflow-security gate fail closed

> **Labels**: `security`, `P2`

### Finding

`.husky/pre-commit` runs `node scripts/check-workflow-security.js 2>/dev/null || echo "...skipped"`
— the `|| echo` swallows the non-zero exit code, so **the only automated guard against the
F013 workflow-permission regressions (2 CRITICAL + 10 HIGH) can never block a commit**. The
regressions have returned 6+ times while this gate prints a warning and exits 0. The script
also has no package.json entry and no tests.

### Traceability

- Existing feature: `scripts/check-workflow-security.js` (workflow security validation, documented in docs/api.md §Workflow Security Module).
- Documented intent: SECURITY_AUDIT_NOTE.md tracks the F013 regression history.

### Action

- Add `check-workflow-security` to package.json scripts.
- Change the pre-commit hook to exit non-zero on CRITICAL violations (fail closed); keep
  warnings as informational.
- Add unit tests for the scanner's detection logic.
- Wire the scanner into CI (on-pull/on-push) so violations fail the build.

---

## H4 — Remove dead code and dead maintenance scripts

> **Labels**: `chore`, `P3`

### Finding

- `tests/run_tests.py` — duplicated import block (lines 15–25) + unreachable code after the
  first `return suite` (lines 523–527).
- `scripts/apply-caching-patch.sh` — targets the non-existent
  `feature-ci-incremental-caching.patch`; always fails.

### Traceability

- Existing features: Python test harness (`npm run test:py`), caching feature (git history).

### Action

- Remove duplicate imports and unreachable block from `run_tests.py`.
- Either restore the patch file, or delete the script and its references if the caching
  feature is permanently applied.

---

## H5 — Align CI concurrency and error-masking with documented intent

> **Labels**: `ci`, `P2`

### Finding

- `on-push.yml:11` global `group: global` serializes unrelated workflows (F003) — unrelated
  jobs block each other, inflating CI latency and starvation risk.
- `on-pull.yml:44,51` + `parallel.yml:227` use `continue-on-error: true` on checkout/setup
  steps, masking real infrastructure failures.
- `on-push.yml` triggers on push to **all branches** (unfiltered), running 12 agent flows
  against any branch push.

### Traceability

- Existing feature: CI pipeline (`.github/workflows/`, docs/ci-consolidation-audit.md).

### Action

- Scope concurrency groups per workflow/job (or remove global serialization).
- Remove `continue-on-error` from checkout/setup-node steps.
- Restrict `on-push.yml` push trigger to `main` (and `develop` if used).

---

## Final State (Phase 2)

- **Findings created**: H1–H5 (records above)
- **GitHub Issues**: **blocked** — `issues: write` missing (24th consecutive 403)
- **Status**: findings persisted as markdown per repo convention; awaiting permission fix
