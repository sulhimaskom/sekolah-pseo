# Re-Verification Run — 2026-07-31 (same-day)

**Session**: ULW Loop — Phase 1 (Audit Mode), re-verification
**Repository**: sulhimaskom/sekolah-pseo
**Default Branch**: main (@ 6fcff36 — 2026-07-31 audit report)
**Purpose**: Confirm the 11 findings recorded in `00-audit-report.md` are still valid after HEAD, and re-test issue creation.

---

## 1. CI Checks (re-run this session)

| Check          | Result                                          | Evidence                                  |
| -------------- | ----------------------------------------------- | ----------------------------------------- |
| Build          | ✅ PASS                                         | 2 pages, 0 failed, 26ms, budgets met      |
| Lint (ESLint)  | ✅ PASS                                         | 0 errors                                  |
| JS Tests       | ✅ PASS × 2 runs (1026/1030, 4 skipped, 0 fail) | flaky test did NOT trigger this session   |
| Python Tests   | ✅ PASS                                         | 27/27, 0.0024s                            |
| Coverage (c8)  | ✅ PASS                                         | Stmts 95.32%, Branch 92.28%, Funcs 96.63% |
| npm audit      | ✅ PASS                                         | 0 vulnerabilities                         |
| Prettier check | ❌ 3 files                                      | docs/issues/2026-07-30/{00,01,02}*.md     |

**Interpretation**: The floating-promise flakiness (Issue 001) is **order-dependent and intermittent** — the full suite passed twice this session while still failing in the 07-31 full run. The code-level defect (`main()` not awaiting `fetchFromGitHub()`) is confirmed present at `scripts/fetch-data.js:338` and remains unfixed.

## 2. Findings Re-Verification (2026-07-31 audit)

All 11 findings verified **still valid** as of this session:

| #   | Finding                                           | Verified? | Evidence (this session)                                                                                                                                                                                                                               |
| --- | ------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Floating promise in fetch-data.js main()          | ✅        | `scripts/fetch-data.js:338` `const csvPath = fetchFromGitHub(sourceRepo);` — no `await`; `main()` is sync (line 319); `fetchFromGitHub` returns `fetchCircuitBreaker.execute(...)` Promise. Flaky test did not reproduce this session (intermittent). |
| 2   | on-push.yml missing `issues: write`               | ✅        | `.github/workflows/on-push.yml` permissions = `contents: write, pull-requests: write` only. Verified live: `gh issue create` → `Resource not accessible by integration (createIssue)`; REST POST /issues → 403.                                       |
| 3   | Global + unscoped concurrency groups              | ✅        | `on-push.yml` has `concurrency: group: global`                                                                                                                                                                                                        |
| 4   | Excessive CI secret exposure                      | ✅        | 57 `secrets.` references across 6 workflows; duplicate aliases (API_KEY=GEMINI_API_KEY, SUPABASE_ANON_KEY, VITE_SUPABASE_ANON_KEY=VITE_SUPABASE_KEY)                                                                                                  |
| 5   | Prettier violations in docs/issues/2026-07-30/*   | ✅        | `prettier --check .` → 3 files fail                                                                                                                                                                                                                   |
| 6   | SITE_URL placeholder                              | ✅        | `scripts/config.js:51` default `'https://example.com'`                                                                                                                                                                                                |
| 7   | CI workflow overcomplexity                        | ✅        | 2045 lines across 7 workflows                                                                                                                                                                                                                         |
| 8   | styles.js oversized                               | ✅        | 1275 lines                                                                                                                                                                                                                                            |
| 9   | Insufficient Python test coverage; pytest missing | ✅        | `python3 -m pytest` → "No module named pytest"                                                                                                                                                                                                        |
| 10  | Missing E2E/integration tests                     | ✅        | No e2e test files in repo                                                                                                                                                                                                                             |
| 11  | Missing automated release process                 | ✅        | No release workflow in `.github/workflows/`                                                                                                                                                                                                           |

## 3. GitHub Issue Creation — STILL BLOCKED (4th consecutive audit)

Attempted with runner token `github-actions[bot]`:

- `gh issue create` (GraphQL) → `Resource not accessible by integration (createIssue)`
- `curl POST /repos/sulhimaskom/sekolah-pseo/issues` (REST) → HTTP 403, same message
- `GET /repos/{owner}/{repo}/permissions` → HTTP 404 (fine-grained token, no visibility)

**Root cause unchanged**: token scope comes from `.github/workflows/on-push.yml` permissions block (`contents: write`, `pull-requests: write`) — no `issues: write`, no `workflows: write` (so workflow-file fixes cannot be pushed either).

**Unblock options** (require human/org action):

1. Add `issues: write` (and `workflows: write`) to the `permissions:` block in `.github/workflows/on-push.yml`
2. Or supply a PAT (`GH_TOKEN`) with `repo` scope + `issues: write` for the loop job, as `orchestrator.yml` already does

**Fallback applied (per repo convention)**: all findings remain documented as issue-ready records in `docs/issues/2026-07-31/` (001–011) with category + priority labels, evidence, and suggested fixes. Canonical records: `00-audit-report.md` + `001`–`011` files.

## 4. Recommendation

Highest-leverage unblock is fixing `on-push.yml` permissions (Issue 002) — it gates ALL automated issue tracking. The P1 code defect (Issue 001) is a small, well-scoped fix (`main()` → async + `await` + entry `.catch()` + regression test) ready for ISSUE MANAGER MODE as soon as issues can be created.

## Final State

- **Phase**: Phase 1 — Audit re-verification complete
- **GitHub Issues**: blocked (`issues: write` missing from token; 4th consecutive audit)
- **Status**: **waiting for human review** — needs permissions fix or PAT before the loop can self-serve issue tracking
