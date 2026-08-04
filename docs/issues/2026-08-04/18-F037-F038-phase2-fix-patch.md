# F037/F038 — Phase 2 Hardening Fix (ready-to-apply patch) + F050 token limitation

**Record**: docs/issues/2026-08-04/18-F037-F038-phase2-fix-patch.md
**Run**: 42nd (2026-08-04), Phase 2 (Feature Hardening)
**Category**: security | **Priority**: P1

## Context

F037 + F038 (CRITICAL, unfixed since the 39th run) were re-verified at source this
run. Phase 2 hardening fixes were implemented, verified, and committed to local
branch `fix/phase2-harden-F037-F038-F029` (commit `5a77858`), but **could not be
pushed** because the loop's GitHub App token lacks `workflows: write` permission
(push rejected by GitHub: "refusing to allow a GitHub App to create or update
workflow `.github/workflows/architect-agent.yml` without `workflows` permission").

## New finding — F050

| ID   | Finding                                                                         | Category | Priority | Status         |
| ---- | ------------------------------------------------------------------------------- | -------- | -------- | -------------- |
| F050 | Loop token lacks `workflows: write` — cannot push `.github/workflows/*` changes | ci       | P1       | NEW (42nd run) |

**Evidence**: `git push origin fix/phase2-harden-F037-F038-F029` → remote rejected:
"refusing to allow a GitHub App to create or update workflow ... without `workflows`
permission". Same permission class as F002 (no `issues: write`). Workflow-hardening
fixes therefore ship as patches/docs records pending a token with `workflows: write`.

## Fix 1 — F037 (opencode.yml): gate `issue_comment` trigger on author association

**Vulnerability**: `.github/workflows/opencode.yml:8-9` triggers on any
`issue_comment` creation. Repo is PUBLIC → any unauthenticated user can comment on
an issue/PR and trigger the PR Handler job which holds `issues/pull-requests/
contents/actions: write` — an unauthenticated write-token LLM agent.

**Fix**: job-level `if` guard restricting `issue_comment` events to
OWNER/MEMBER/COLLABORATOR authors (all other triggers unaffected):

```yaml
jobs:
  pr-handler:
    name: PR Handler
    runs-on: ubuntu-24.04-arm
    timeout-minutes: 120
    # F037 fix: gate the issue_comment trigger on author association.
    # This repo is PUBLIC — without this guard any unauthenticated user can
    # comment on an issue/PR and trigger this write-token LLM agent.
    if: >-
      github.event_name != 'issue_comment' ||
      github.event.comment.author_association == 'OWNER' ||
      github.event.comment.author_association == 'MEMBER' ||
      github.event.comment.author_association == 'COLLABORATOR'
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
heredoc body was audited: no other `$` or backtick characters exist, so switching
`<<'PROMPT'` → `<<PROMPT` is safe.

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_TOKEN }}
  IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
  # F038 fix: pass custom_prompt via env var instead of interpolating into
  # the run: heredoc. GitHub Action expressions (${{ }}) are expanded into
  # the script text BEFORE the shell parses it, so attacker-controlled
  # input like $(...) would execute as shell code. Env var values are
  # expanded by the shell as data and never re-scanned for syntax.
  CUSTOM_PROMPT: ${{ github.event.inputs.custom_prompt }}
```

and inside the `run:` step: `<<'PROMPT'` → `<<PROMPT`, and line 208 →
`Custom prompt dari dispatch: "$CUSTOM_PROMPT"`.

## Verification (local)

- Both YAML files parse (`yaml.safe_load`) ✅
- `npm run lint` ✅ / `npm run build` ✅ / JS 1049+0 ✅ / Python 27/27 ✅
- `node scripts/check-workflow-security.js` — 12 violations unchanged (F013 cluster,
  separate from F037/F038 which the checker does not model)

## How to apply

The token that runs this loop lacks `workflows: write`, so the change cannot be
pushed directly. Apply via one of:

1. **`git apply` the attached patch** (branch `fix/phase2-harden-F037-F038-F029`,
   commit `5a77858`): `git format-patch main..HEAD` output stored at
   `.sisyphus/patches/F037-F038-fix.patch` (see note below), then push with a
   token/actor holding `workflows: write`.
2. Or re-implement the two inline snippets above manually in a PR.

**Note**: the patch file was staged at `/tmp/opencode/F037-F038-fix.patch` during the
run; recreate with `git format-patch main..HEAD --stdout` from the local branch if
needed.
