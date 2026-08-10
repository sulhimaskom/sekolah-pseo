# Issue Records — 78th batch (119th verification run, 2026-08-10) — delta: no new findings

**Evaluation Date**: 2026-08-10
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**Repository**: sulhimaskom/sekolah-pseo · Default Branch: main (`03d0f5d` — 118th
records PR #654 merged via squash)
**Note**: Phase 0 probe found 0 open PRs / 0 open issues → Phase 1 (AUDIT MODE).
GitHub-issue creation remains blocked by F002 (integration token lacks `issues: write`;
108th consecutive denial re-verified this run via `gh issue create` →
`GraphQL: Resource not accessible by integration (createIssue)`). Per repo convention
findings ship as labeled docs records — each with exactly one category label and one
priority label (contract §4) — ready for bulk creation when permissions are granted.
Records written Prettier-clean per F005 convention.

## Delta statement

All findings of the 77th batch (`19-issue-records-77th-batch-delta-118th.md`, written
by the 118th run) were re-verified this run against the fresh command matrix on
`03d0f5d`:

| F-code                                  | Status this run        | Evidence                                                     |
| --------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| F037/F038 (P0, security) 12 violations  | HELD (20th regression) | `check-workflow-security.js` → exit 1, 2 CRITICAL + 10 HIGH  |
| F063 (P1, ci) orchestrator dead         | HELD (6/6 failures)    | `gh run list --workflow=orchestrator.yml`                    |
| F002 (P1, chore) issue creation blocked | HELD (108th denial)    | `gh issue create` probe → GraphQL createIssue denied         |
| F025 (P1, chore) live-site root 404     | HELD                   | live-site probe (root 404 / robots 200) — unchanged          |
| F018 (P1, chore) data STALE             | HELD (21d)             | `check-freshness.js` → STALE, threshold 7                    |
| F068 (P1, test) pytest CI parity        | HELD                   | pytest pass 13/13 locally only after manual install          |
| F064 (P1) .nvmrc drift                  | HELD (22 vs 20 vs 20)  | `.nvmrc` / runtime / CI node-version                         |
| F005 (P3) Prettier ledger               | HELD stable at 88      | format:check fails only on docs ledger; 0 source files       |
| F021/F073/F076/F070–F082 (P2/P3)        | HELD                   | source re-reads unchanged (see 77th batch)                   |
| F066/F069/F074/F026 (resolved set)      | HELD RESOLVED          | build gate, dist preservation, exports, NaN guard — re-clean |

**No new findings, no resolutions, no regressions vs the 118th run.** The full
criteria-level breakdown with per-finding evidence lives in the 77th batch records;
this batch is a delta ledger so the run-history chain stays contiguous without
duplicating content (contract: never create duplicate issues).
