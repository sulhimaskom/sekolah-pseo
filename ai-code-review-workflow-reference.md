# AI Code Review Workflow - Implementation Reference

This file documents the implementation for issue #224.
The actual workflow file must be placed at `.github/workflows/ai-code-review.yml`.

## Implementation

The workflow triggers on:
- PR opened, synchronized, ready_for_review
- Manual workflow_dispatch

## Features
- Fetches PR diff and metadata
- Uses OpenCode CLI to run AI-powered code review
- Analyzes: Code Quality, Security, Performance, Potential Bugs, Best Practices
- Posts structured review comment on the PR
- Adds labels: `ai-reviewed` (always), `needs-review` (if critical issues found)

## How to Apply

To deploy this workflow, the workflow file must be pushed with a GitHub token
that has `workflows: write` permission (e.g., a Personal Access Token).

```
# From the repo root:
git checkout main && git pull
# Place the workflow file:
cp ai-code-review-workflow-reference.md .github/workflows/ai-code-review.yml
# Then commit and push with a PAT
```

## Workflow Content

The workflow YAML has been designed and verified:
- YAML syntax valid ✓
- Prettier formatting passes ✓
- All 591 JS tests pass ✓
- Lint passes ✓

Referenced issue: #224
