# Issue Records — 87th Batch (Delta, 128th verification, 2026-08-11)

**Evaluation Date**: 2026-08-11
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Basis**: 127th audit matrix on `35c5308` (see `03-audit-report-2026-08-11-127th.md`).
**Convention**: GitHub issue creation is denied for this integration token (F002 —
`GraphQL: Resource not accessible by integration (createIssue)`, 116th consecutive
denial). Per the 125-run docs-only convention, findings are recorded in this ledger.

## Stability confirmation (no action — held findings)

All labeled findings from the 86th-batch records remain HELD with byte-identical
evidence. Summary of the active set, all re-verified this run:

| ID   | Category/Priority | Status | Evidence this run                                                     |
| ---- | ----------------- | ------ | --------------------------------------------------------------------- |
| F005 | chore/P2          | HELD   | prettier: 88 files, all `docs/issues/`, 0 source                      |
| F037 | security/P0       | HELD   | opencode.yml `issue_comment` trigger on public repo (CRITICAL)        |
| F038 | security/P0       | HELD   | architect-agent.yml `custom_prompt` heredoc interpolation (CRITICAL)  |
| F063 | ci/P1             | HELD   | orchestrator 5/5 sampled failure — checkout auth (GH_TOKEN)           |
| F002 | chore/P1          | HELD   | `gh issue create` denied (116th)                                      |
| F018 | feature/P1        | HELD   | data STALE 22 days (threshold 7)                                      |
| F064 | chore/P2          | HELD   | .nvmrc 22 vs runtime v20.20.2 vs CI node 20                           |
| F025 | feature/P1        | HELD   | live site not re-verifiable (egress blocked)                          |
| F004 | security/P2       | HELD   | `secrets.*` sprawl across workflow envs                               |
| F007 | refactor/P2       | HELD   | 2000+ lines across 6 workflow YAMLs                                   |
| F011 | chore/P3          | HELD   | 0 tags — no releases                                                  |
| F028 | security/P2       | ✅     | maintained: `npm audit` 0 vulnerabilities                             |
| F026 | bug/P2            | ✅     | RESOLVED — `formatBytes` guard re-verified (build-performance.js:191) |
| F066 | bug/P2            | ✅     | RESOLVED — pytest uses `tempfile.mkdtemp`, never touches real `dist/` |

## New evidence / refinements (this run)

### R-128-1: Build timing variance within budget (chore, P3)

- **Finding**: full build 28ms / 71.43 pages/sec this run vs 34ms / 58.82 pages/sec at
  the 127th — run-to-run noise on a 2-school sample; budgets still PASS.
- **Files affected**: none (observation only).
- **Labels**: `chore`, `P3`.

### R-128-2: SITE_URL placeholder warning surfaced (chore, P2)

- **Finding**: `check-freshness.js` emits a warning every run: SITE_URL is the default
  placeholder `https://example.com`; robots.txt/sitemap URLs point at example.com.
  Production deployment without SITE_URL set would publish placeholder links.
- **Evidence**: `node scripts/check-freshness.js` → "SITE_URL is set to default
  placeholder \"https://example.com\"". Config reference: `scripts/config.js` +
  `.env.example`.
- **Impact / Risk**: low for CI builds, medium for any real deployment; documented env
  parity gap (D — Config & Env Parity).
- **Suggested fix (deferred)**: enforce SITE_URL presence in CI deploy job or default
  to the Pages URL; document in docs/setup.md.
- **Labels**: `chore`, `P2`.

### R-128-3: orchestrator failure sample consistent (ci, P1)

- **Finding**: last 5 scheduled `oc - orchestrator` runs all `failure` — consistent
  with the 127th's 10/10. Root cause unchanged: checkout cannot authenticate
  (`secrets.GH_TOKEN` missing/invalid; terminal prompts disabled).
- **Files affected**: `.github/workflows/orchestrator.yml` (checkout step, env).
- **Suggested fix (deferred — F050 boundary)**: replace `token: ${{ secrets.GH_TOKEN }}`
  with `token: ${{ secrets.GITHUB_TOKEN }}`; align the remaining `GH_TOKEN` refs.
- **Labels**: `ci`, `P1`.

## Log

| Timestamp         | Action                | Target                                     | Result                                                                                                   |
| ----------------- | --------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 2026-08-11 07:00Z | Phase 0 probe         | `gh pr list` / `gh issue list`             | 0 open PRs / 0 issues → PHASE 1 (AUDIT MODE)                                                             |
| 2026-08-11 07:00Z | skills survey         | `.opencode/skill/` (7)                     | identified; audit executed directly (convention)                                                         |
| 2026-08-11 07:01Z | full audit matrix     | lint/build/test/coverage/prettier/security | lint 0/0 · build PASS (28ms) · JS 1087 pass/4 skip · pytest 13/13 (post-install) · cov 95.19/92.91/97.14 |
| 2026-08-11 07:03Z | security scan         | `check-workflow-security.js`               | 12 violations — 2 CRITICAL + 10 HIGH (29th)                                                              |
| 2026-08-11 07:03Z | freshness + CI probes | `check-freshness.js` / `gh run list`       | STALE 22d (F018) · orchestrator 5/5 failure (F063)                                                       |
| 2026-08-11 07:04Z | F002 probe            | `gh issue create`                          | GraphQL createIssue denied — blocked (116th)                                                             |
| 2026-08-11 07:05Z | records written       | docs/issues/2026-08-11/ (06/07/08)         | delta audit + delta issue records + decision                                                             |
