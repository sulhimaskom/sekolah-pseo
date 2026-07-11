#!/usr/bin/env bash
# Bulk-create GitHub issues from docs/issues/2026-07-06/ markdown files.
# Run this from the repo root when GITHUB_TOKEN has issues:write permission.
set -euo pipefail

ISSUES_DIR="docs/issues/2026-07-06"
CREATED=0
FAILED=0

for file in "$ISSUES_DIR"/*.md; do
  [ -f "$file" ] || continue

  # Extract title from first # heading
  title=$(head -1 "$file" | sed 's/^# //')

  # Extract labels from "**Category**: X | **Priority**: Y" line
  meta=$(grep -E '^\*\*Category\*\*' "$file" | head -1)
  category=$(echo "$meta" | sed -n 's/.*Category\*\*: \([^ ]*\).*/\1/p')
  priority=$(echo "$meta" | sed -n 's/.*Priority\*\*: \([^ ]*\).*/\1/p')

  # Build body from file content (skip the first heading and metadata line)
  body=$(tail -n +2 "$file" | sed '/^\*\*Category/d' | sed '/^\*\*Evaluation Date/d' | sed '/^\*\*Audit/d')

  if gh issue create \
    --title "$title" \
    --label "$category,$priority" \
    --body "$body"; then
    echo "✅ Created: $title"
    CREATED=$((CREATED + 1))
  else
    echo "❌ Failed: $title"
    FAILED=$((FAILED + 1))
  fi
done

echo "---"
echo "Created: $CREATED, Failed: $FAILED"
