# F050 — Loop token lacks `workflows: write` — RE-CONFIRMED (8th run) + F037/F038 fix patch (46th)

**Record**: docs/issues/2026-08-05/04-F050-reconfirmed-46th.md
**Run**: 46th (2026-08-05), Phase 2 (Feature Hardening) — best-effort F037/F038 remediation attempt
**Category**: ci | **Priority**: P1

## Context

F037 + F038 (CRITICAL, unfixed since the 39th run) were re-confirmed at source this
run. Phase 2 hardening fixes were implemented, verified, and committed to local
branch `fix/phase2-harden-F037-F038-46th` (commit `b641a37`), but the push was
**rejected by GitHub** — the loop's GitHub App token still lacks `workflows: write`.

## Evidence (fresh, this run)

```
$ git push origin fix/phase2-harden-F037-F038-46th
! [remote rejected] fix/phase2-harden-F037-F038-46th -> fix/phase2-harden-F037-F038-46th
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/architect-agent.yml` without `workflows` permission)
error: failed to push some refs
```

Identical rejection class as the 42nd run. The local branch was deleted after
capturing the patch; the fix commit `b641a37` remains in the local reflog.

## Fix 1 — F037 (opencode.yml): gate `issue_comment` trigger on author association

**Vulnerability**: `.github/workflows/opencode.yml:8-9` triggers on any
`issue_comment` creation. Repo is PUBLIC → any unauthenticated user can comment on
an issue/PR and trigger the PR Handler job which holds
`id-token/contents/pull-requests/issues/actions: write` — an unauthenticated
write-token LLM agent.

**Fix** (job-level `if` guard; all non-issue_comment triggers unaffected):

```yaml
jobs:
  pr-handler:
    name: PR Handler
    runs-on: ubuntu-24.04-arm
    timeout-minutes: 120
    if: >-
      github.event_name != 'issue_comment' ||
      github.event.comment.author_association == 'OWNER' ||
      github.event.comment.author_association == 'MEMBER' ||
      github.event.comment.author_association == 'COLLABORATOR'
    permissions:
      id-token: write
      contents: write
      pull-requests: write
      issues: write
      actions: write
```

## Fix 2 — F038 (architect-agent.yml): `custom_prompt` via env var, out of the heredoc

**Vulnerability**: `.github/workflows/architect-agent.yml:208` interpolates
`${{ github.event.inputs.custom_prompt }}` directly inside the `run:` heredoc.
GitHub Actions expands `${{ }}` expressions into the script text **before** the
shell parses it, so attacker-controlled input containing `$(...)` executes as shell
code — proven RCE.

**Fix**: pass the input as a job env var (`CUSTOM_PROMPT`) and reference
`$CUSTOM_PROMPT` inside an unquoted heredoc. Shell variable expansion treats the
value as data — it is never re-scanned for `$(...)` command substitution. The
heredoc body was re-audited this run: line 55-211 contains **no other `$` or
backtick characters** besides the custom_prompt line, so switching
`<<'PROMPT'` → `<<PROMPT` is safe.

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_TOKEN }}
  IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
  CUSTOM_PROMPT: ${{ github.event.inputs.custom_prompt }}
```

and inside the `run:` step: `<<'PROMPT'` → `<<PROMPT`, and line 208 →
`Custom prompt dari dispatch: "$CUSTOM_PROMPT"`.

## Validation performed

- `yaml.safe_load` — both patched files parse OK
- `git diff --stat` — 2 files, +18/−2, minimal atomic change
- `node scripts/check-workflow-security.js` — no new violations introduced

## Blocked on

- **F050**: token needs `workflows: write` (human action — GitHub App installation
  permissions). Once granted, push `b641a37`-equivalent patch and open a PR.

## Final state

- **Phase 2 (HARDENING)**: attempted — fixes ready + verified, **blocked by F050**
  (8th consecutive run). Waiting for human review / token-permission change.
