# Workflow Parallelization Plan

**Issue:** #179 - Performance: Sequential workflow execution creates 6+ hour bottleneck
**Related:** #299 - Optimize GitHub workflow: sequential flows should run in parallel (duplicate of #179)

## Problem

The `on-push.yml` workflow runs 12 sequential AI agent flows (00-11) as steps within a single job.
Each flow has a 120-minute timeout and can take up to 90 minutes to complete.
Total worst-case runtime: 12 × 90 min = **18 hours**.

## Solution

Convert the single job into three jobs with a matrix strategy for parallel execution:

1. **`setup` job** - Queue, checkout, cache, git config, OpenCode install, issue count check
2. **`flows` job** - Matrix strategy running all 12 flows in parallel
3. **`finalize` job** - Runs only when no open issues exist

### Estimated improvement

- Sequential: 12 flows × ~30 min avg = **~6 hours**
- Parallel: 1 flow × ~30 min avg = **~30 minutes**
- **Speedup: ~12x**

## Exact Change Required

### File: `.github/workflows/on-push.yml`

Replace the entire file content with the following (requires `workflows` permission on GITHUB_TOKEN):

```yaml
name: on-push
on:
  workflow_dispatch:
  push:

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: global
  cancel-in-progress: false

jobs:
  setup:
    name: Setup
    runs-on: ubuntu-24.04-arm
    outputs:
      open_issue_count: ${{ steps.check_issues.outputs.open_issue_count }}
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      API_KEY: ${{ secrets.GEMINI_API_KEY }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_KEY }}

    steps:
      - name: Wait in Queue
        uses: softprops/turnstyle@v3
        with:
          poll-interval-seconds: 30
          same-branch-only: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Checkout
        uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Cache
        uses: actions/cache@v5
        with:
          path: |
            ~/.opencode
            ~/.npm
          key: opencode-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-v1
          restore-keys: |
            opencode-${{ runner.os }}-v1
            opencode-${{ runner.os }}-

      - name: Configure Git
        run: |
          git config --global user.name "${{ github.actor }}"
          git config --global user.email "${{ github.actor_id }}+${{ github.actor }}@users.noreply.github.com"

      - name: Install OpenCode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH

      - name: Check Open Issues
        id: check_issues
        run: |
          count=$(gh issue list --state open --json number --jq 'length')
          echo "open_issue_count=$count" >> $GITHUB_OUTPUT
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  flows:
    name: "Flow ${{ matrix.flow }}"
    needs: setup
    runs-on: ubuntu-24.04-arm
    strategy:
      matrix:
        flow: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
      fail-fast: false
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      API_KEY: ${{ secrets.GEMINI_API_KEY }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_KEY }}

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/cache@v5
        with:
          path: |
            ~/.opencode
            ~/.npm
          key: opencode-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-v1
          restore-keys: |
            opencode-${{ runner.os }}-v1
            opencode-${{ runner.os }}-

      - name: Configure Git
        run: |
          git config --global user.name "${{ github.actor }}"
          git config --global user.email "${{ github.actor_id }}+${{ github.actor }}@users.noreply.github.com"

      - name: Install OpenCode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH

      - name: ${{ matrix.flow }} flow
        timeout-minutes: 120
        run: |
          timeout -k 1m 90m opencode run "$(cat .github/prompt/${{ matrix.flow }}.md)" \
            --model opencode/deepseek-v4-flash-free \
            --thinking false \
            --share false

  finalize:
    name: on-push
    needs: [setup, flows]
    if: needs.setup.outputs.open_issue_count == '0'
    runs-on: ubuntu-24.04-arm
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      API_KEY: ${{ secrets.GEMINI_API_KEY }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_KEY }}

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/cache@v5
        with:
          path: |
            ~/.opencode
            ~/.npm
          key: opencode-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-v1
          restore-keys: |
            opencode-${{ runner.os }}-v1
            opencode-${{ runner.os }}-

      - name: Configure Git
        run: |
          git config --global user.name "${{ github.actor }}"
          git config --global user.email "${{ github.actor_id }}+${{ github.actor }}@users.noreply.github.com"

      - name: Install OpenCode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH

      - name: on-push
        timeout-minutes: 120
        run: |
          timeout -k 1m 90m opencode run "$(cat <<'PROMPT'
          [Insert the full on-push prompt text from the original workflow]
          PROMPT
          )" \
            --model opencode/deepseek-v4-flash-free \
            --thinking false \
            --share false
```

> **Note:** The `[Insert the full on-push prompt text]` placeholder should be replaced with the verbatim prompt content from lines 175-528 of the original `on-push.yml` file.

## Design Decisions

1. **Matrix strategy over manual job splitting**: Cleaner, more maintainable, easy to add/remove flows
2. **`fail-fast: false`**: One flow failure doesn't cancel others
3. **Repeated setup per job**: Each GitHub Action job is isolated; checkout, cache, git config, and OpenCode install must be repeated
4. **Concurrency group preserved**: `group: global, cancel-in-progress: false` prevents concurrent workflow runs
5. **Condition preserved**: `finalize` job only runs if `setup` reports zero open issues

## Blocker

The `GITHUB_TOKEN` in this repository lacks the `workflows` permission, required to push changes to `.github/workflows/` files. Resolution options:
1. Grant `workflows: write` permission to the GITHUB_TOKEN in the repository settings
2. Use a Personal Access Token (PAT) with `workflows` scope
3. Apply this change manually via the GitHub web interface
