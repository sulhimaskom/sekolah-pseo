# Bug: Invalid Chinese characters in DEFAULT_SOURCE_REPO URL

**Priority**: P1 (High)
**Category**: bug
**Status**: Unresolved (cannot create GitHub issue due to token permissions)

## Description

The `DEFAULT_SOURCE_REPO` constant in `scripts/fetch-data.js` (line 32) contains Chinese characters as the repository owner name:

```javascript
const DEFAULT_SOURCE_REPO = 'https://github.com/玩家们/daftar-sekolah-indonesia.git';
```

When the URL is parsed by `validateRepoUrl()`, it gets percent-encoded to:
```
https://github.com/%E7%8E%A9%E5%AE%B6%E4%BB%AC/daftar-sekolah-indonesia.git
```

`git ls-remote` confirms **"Repository not found"** — this URL does not point to a real repository.

## Impact

- `npm run fetch-data` fails with git clone error
- External data fetching pipeline is broken for default configuration
- Cannot pull fresh school data from configured default source

## Location

- **File**: `scripts/fetch-data.js`
- **Line**: 32
- **Function**: `fetchFromGitHub()` uses this default

## Suggested Fix

Replace with a valid repo, e.g. `https://github.com/suryavip/daftar-sekolah-indonesia.git`, and move URL to config with env override.
