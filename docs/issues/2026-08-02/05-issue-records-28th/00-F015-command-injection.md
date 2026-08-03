# F015 — OS Command Injection in `scripts/fetch-data.js` (CRITICAL)

**Evaluation Date**: 2026-08-02 (28th run)
**Category**: security
**Priority**: P0
**Status**: open (Blocked — issue creation 403, tracked in docs/issues)
**Applies to**: scripts/fetch-data.js

## Summary
`validateRepoUrl()` (fetch-data.js:55–97) returns a sanitized URL that still preserves shell
metacharacters when a full `http(s)://` URL is provided, allowing OS command injection via
`execSync` in `execGitCommand()` (fetch-data.js:148–153), reachable through `git clone --depth 1
${safeRepoUrl}` (fetch-data.js:178).

## Live PoC (run 6 of 6 consecutive confirmations)
```js
const { validateRepoUrl } = require('./scripts/fetch-data.js');
validateRepoUrl('https://github.com/foo/bar;id.git')  // PASS -> "https://github.com/foo/bar;id.git"
validateRepoUrl('https://github.com/foo/bar$(id).git') // PASS -> "https://github.com/foo/bar$(id).git"
validateRepoUrl('https://github.com/foo/bar`id`.git')  // PASS -> ".../bar%60id%60.git"
```
The returned string is interpolated untrusted into the shell command string, so `;`, command
substitution, and backticks execute.

## Impact
Remote Code Execution (RCE) when an attacker can influence the repo URL (CLI `--source` flag /
config env).

## Suggested fix
Do not reconstruct a URL from `URL` components for shell use. Instead whitelist a regex that
rejects any `[;&$|\`<>]` / whitespace after reconstructing, and pass the validated URL as an
array argument to `spawnSync` (no shell) rather than `execSync` string interpolation.

## Affected
`scripts/fetch-data.js:55–97, 148–179, 338`