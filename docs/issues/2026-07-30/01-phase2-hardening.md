# Phase 2: Feature Hardening & Integration

**Date**: 2026-07-30
**Branch**: main (local changes) — cannot push due to token `workflows` permission gap

---

## Changes Made (locally on main)

### 1. Added `issues: write` permission to on-push.yml
- **File**: `.github/workflows/on-push.yml`
- Adds `issues: write` to permissions block — unblocks automated issue creation

### 2. Fixed global concurrency group in on-push.yml
- **File**: `.github/workflows/on-push.yml`
- Changed `group: global` → `group: on-push-${{ github.ref }}`

### 3. Fixed non-scoped concurrency group in on-pull.yml
- **File**: `.github/workflows/on-pull.yml`
- Changed `group: oc-agent` → `group: pull-${{ github.ref }}`

### 4. Removed duplicate/confusing secret aliases
- **Files**: `on-push.yml`, `parallel.yml`
- Removed `API_KEY` (duplicate of GEMINI_API_KEY)
- Removed `VITE_SUPABASE_ANON_KEY` (duplicate alias)
- Removed `SUPABASE_ANON_KEY` (redundant alias)

---

## Cannot Push Due To

Token lacks `workflows` permission, required to push changes to `.github/workflows/`. These changes need to be applied manually or via a properly scoped token.

---

## Verification

| Check | Result |
|-------|--------|
| Lint | ✅ Clean |
| JS Tests | ✅ 1026/1026 pass |
| Py Tests | ✅ 13/13 pass |
| Build | ✅ Pass |
