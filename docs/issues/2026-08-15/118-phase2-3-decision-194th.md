# Phase 2/3 — Decision Record (194th run): 0 open PRs/issues → Phase 1 audit + **F067 husky gate EXECUTED**, F038 held 10/10 (35 days), pull CI clean streak broke at 43rd window (transient infra), F018 held at 26 days

**Evaluation Date**: 2026-08-15
**Evaluator**: Sisyphus (ULW Loop, autonomous run)
**State-machine ordering**: Phase 0 (0 open PRs / 0 open issues → EMPTY) → Phase
1 (audit, completed — see `116-audit-report-2026-08-15-194th.md` and
`117-issue-records-153rd-batch-delta-194th.md`) → Phase 2 → Phase 3, strict
order.

## Phase 2 — Feature Hardening (non-cosmetic, invariant-strengthening)

| Candidate                   | State                          | Verdict                                                                                             |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| F037/F038 workflow security | HELD (P0, 95th obs)            | requires `.github/workflows/*` write — outside token grant (F050)                                   |
| F038 orchestrator checkout  | **HELD (P1, live 10/10, 35d)** | workflow write boundary — blocked (F050); newest failure 08-15T00:50Z, window holds                 |
| **F067 husky gate swallow** | **EXECUTED (P1)**              | `.husky/pre-commit` — exit-code propagation + invariant enforcement, merged in this run's PR        |
| F063 pull schedule          | WATCH (13/1/1, 43rd window)    | clean streak broke on **transient infra** (11:12Z `Endpoint is unavailable`); not code — watch only |
| F065 config validatePath    | RESOLVED (P2, 193rd run)       | held RESOLVED; regression suite 40/40 re-passing in full matrix                                     |
| F044 over-scoped secrets    | HELD (P2, 10 names, 59 refs)   | workflow edit — blocked by F050                                                                     |
| F002 issue creation         | HELD (P1, 182nd)               | token grant boundary — outside agent permissions                                                    |
| F018/F025                   | HELD (P1)                      | genuine feature cycles, deferred by contract; F018 held at 26 days (no further drift)               |
| F019 run_tests.py dead code | HELD (P3)                      | cosmetic-cleanup class; contract forbids cosmetic-only changes                                      |
| F005 ledger prettier drift  | FLAT (P2, 99 files, 42nd run)  | cosmetic class (docs formatting); held at 99 — new files 116–118 prettier-clean at gate             |

**Executed this run — F067 husky pre-commit gate swallow (error-propagation,
P1)**: The pre-commit hook ran `node scripts/check-workflow-security.js
2>/dev/null || echo "⚠️ … skipped"`. The `|| echo` swallowed the check's exit
code — and since the check exits 1 whenever any violation exists (12 live
violations, held finding F037), the gate could never block a commit, and its
message misreported the check as "skipped". This is an error-propagation +
invariant defect (Phase 2 ALLOWED: "Improve error propagation and
observability", "Strengthen invariants, contracts, and boundaries"), not a
cosmetic issue.

Fix (`.husky/pre-commit`): the check now runs in `--json` mode inside an `if
output=$(…)` guard (safe under `sh -e`, which is how husky invokes hooks —
verified against `node_modules/husky/husky` line 17), `totalViolations` is
parsed, and:

- count **> 12** (documented baseline, F037) → regression warning + `exit 1`
  (commit blocked);
- count **<= 12** → non-blocking status line, continue to `npx lint-staged`;
- **parse failure** → fail-open (`0`), never false-blocks.

Verified in-session: 4/4 scenarios under `sh -e` (12 non-blocking, 13 BLOCKS,
0 non-blocking, garbage non-blocking); `sh -n` syntax OK; `shellcheck -e
SC2148` clean (SC2148 pre-existing — no shebang by design, husky wraps hooks
with `sh -e`); full matrix re-run green (lint 0/0, build PASS, test:js
1104/0/4, pytest 13/13, coverage 95.28/92.98/97.14).

**Not executed**: F019 (P3, cosmetic class — contract forbids), F005 (P2,
cosmetic docs formatting). F037/F038/F044 remain blocked by the F050 token
boundary. F063 is a WATCH item — the 11:12Z failure was a transient
`Endpoint is unavailable` LLM-infra outage, not a code or CI regression; no
repo-side action is warranted (matches the established F063 self-recovery
pattern).

## Phase 3 — Strategic Expansion (product mode)

| Candidate                         | State  | Verdict                                                                                                                                                     |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F067 husky gate fix               | DONE   | executed this window (Phase 2)                                                                                                                              |
| F018 freshness watchdog promotion | QUEUED | data-freshness automation is a documented gap (docs/roadmap.md); requires data pipeline                                                                     |
| F025 SITE_URL parity              | QUEUED | env parity; needs deploy-config write access                                                                                                                |
| F011 release/tag pipeline         | QUEUED | delivery-readiness (D-domain lowest at 49.4); requires workflows write (F050)                                                                               |
| FEAT-005 Comparison Tool          | QUEUED | roadmap Phase 1 deferred feature (docs/roadmap.md:50-53); front-end only, no workflow write needed; full proposal in `.sisyphus/phase3-feature-proposal.md` |

**Decision**: No Phase 3 feature was implemented this run. The D-domain remains
the weakest (49.4), but its highest-leverage fixes (release pipeline F011,
workflow security F037/F038, env parity F025/F044) all require
`.github/workflows/*` or deploy-config write access — outside the current token
grant (F050). FEAT-005 (Comparison Tool) remains the strongest _source-writable_
Phase 3 candidate (pure front-end composition of already-embedded
`#school-data` JSON, zero new dependencies, low blast radius) but is a
multi-file feature — executing it in the same window as the F067 hook fix
would violate the contract's minimal/atomic change rule. It remains queued for
a dedicated window. No destructive actions taken; the only code change is the
minimal F067 fix above.

## Final state

- **Phase**: Phase 2 executed (F067 husky gate RESOLVED); Phase 3 deferred (all
  candidates blocked or queued; FEAT-005 queued for a dedicated window).
- **State**: `waiting for human review` — ledger updated (153rd batch delta,
  files 116–118) + F067 source fix; next run's PR HANDLER MODE will merge this
  records PR.
