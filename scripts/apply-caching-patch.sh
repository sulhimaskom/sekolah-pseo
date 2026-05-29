#!/bin/bash
# Apply incremental build CI caching patch
# This script applies the patch to add build artifact caching to CI workflows.
# Run from repository root: bash scripts/apply-caching-patch.sh
#
# The patch adds:
# - Cache .build-manifest.json and dist/ between CI runs
# - Key cache on data/schools.csv hash for auto-invalidation
# - Add build:incremental step to on-pull.yml
# - Extend on-push.yml cache to include build artifacts

set -euo pipefail

PATCH_FILE="feature-ci-incremental-caching.patch"

if [ ! -f "$PATCH_FILE" ]; then
    echo "Error: $PATCH_FILE not found in repository root"
    exit 1
fi

echo "Checking if patch applies cleanly..."
if git apply --check "$PATCH_FILE" 2>&1; then
    echo "Patch applies cleanly. Applying..."
    git apply "$PATCH_FILE"
    echo "Patch applied successfully!"
    echo ""
    echo "Changes made:"
    echo "  - .github/workflows/on-pull.yml: Added build artifact caching + incremental build"
    echo "  - .github/workflows/on-push.yml: Extended cache to include build artifacts + build step"
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes: git diff"
    echo "  2. Commit: git add .github/workflows/ && git commit -m 'Apply incremental build CI caching'"
    echo "  3. Push: git push"
else
    echo "Patch does not apply cleanly. The workflow files may have been modified."
    echo "Regenerate the patch with: git diff -- .github/workflows/ > $PATCH_FILE"
    exit 1
fi
