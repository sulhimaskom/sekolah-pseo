# F065 — continue-on-error on critical CI steps (Checkout + Setup Node) dropped from ledger, still present

- **ID**: F065
- **Category**: ci
- **Priority**: P2
- **Status**: NEW (65th run, 2026-08-07) — re-verified present
- **Reported**: 2026-08-07 (originally documented 2026-07-20 as issue #003)

## Summary

`.github/workflows/on-pull.yml` marks **critical infrastructure steps** with
`continue-on-error: true`:

- `:44` — `Checkout Code` (`actions/checkout@v7`)
- `:51` — `Setup Node.js` (`actions/setup-node@v7`)

If checkout or Node setup fails, the workflow **continues anyway** — subsequent
steps run against a broken/missing workspace or without Node, and the job can
still report success. This was documented as issue #003 (2026-07-20) but was
**dropped from the active findings ledger** (absent from the 64th findings
matrix) without evidence of resolution.

## Evidence

- `grep -n "continue-on-error" .github/workflows/on-pull.yml` → lines 44, 51.
- `.github/workflows/parallel.yml:227` also has `continue-on-error: true`.
- Ledger check: not present in `docs/issues/2026-08-07/25-audit-report-2026-08-07-64th.md` findings matrix; last explicit tracking was issue #003 (2026-07-20).
- No resolution record exists for the 2026-07-20 #003 finding.

## Impact

- **CI can silently pass with a broken setup**: checkout failure → steps run
  in an empty workspace; setup-node failure → Node 20 absent, tests either
  fail cryptically or are skipped. Combined with the F064 red-merge, the CI
  surface can report success while real work did not run.
- Finding lost from ledger = the repo's own audit process regressed.

## Recommendation

1. Remove `continue-on-error: true` from Checkout and Setup Node in
   `on-pull.yml` (and audit `parallel.yml:227`).
2. Restore this finding's ID in the active findings matrix (it was tracked as
   #003 on 2026-07-20; re-registered as F065 since the ID namespace moved).
3. Process: when a finding disappears from the ledger, require an explicit
   RESOLVED record — silent drops are how F063/F065 happened.

## Related

- F064 (failed dependabot run did not block) — consequence of silent CI.
- F063 (false "fixed" claim) — same ledger-integrity failure class.
