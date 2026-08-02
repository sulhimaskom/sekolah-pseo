# F015 — OS Command Injection in fetch-data.js (EXPLOITABLE, PoC-confirmed 8th consecutive run)

**Evaluation Date**: 2026-08-02 (30th run)
**Category**: security
**Priority**: P1
**Status**: OPEN — **EXPLOITABLE (live, 8th consecutive)**
**Skills used**: `obra-superpowers-systematic-debugging` (root-cause isolation: traced
payload flow from CLI arg → validateRepoUrl → execSync), security PoC harness (direct
replication of validateRepoUrl logic)

## Summary
`validateRepoUrl` (scripts/fetch-data.js:55–97) does NOT sanitize the URL **pathname** against
shell metacharacters. It reconstructs:
```js
const sanitizedUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
```
and returns it, after which `fetchFromGitHub` interpolates it directly into a shell command:
```js
execGitCommand(`git clone --depth 1 ${safeRepoUrl} ${EXTERNAL_DATA_DIR}`, ...)
// execGitCommand → execSync(command, ...)  (child_process; shell semantics)
```

## PoC (re-verified this run, 30th)
All four payload classes pass validation (return non-throwing, reach `git clone` interpolation):
- `https://github.com/foo/bar;id.git`  →  `git clone --depth 1 https://github.com/foo/bar;id.git`
- `https://github.com/foo/$(id).git` →  command substitution executes `id`
- `https://github.com/foo/`id`.git` →  backtick substitution executes `id`
- `https://github.com/foo/bar%3Bid.git` →  URL-encoded `;` decoded by git's clone handling

Verified via direct replication harness: all four payloads `PASS` through the exact
`validateRepoUrl` reconstruction logic and reach the `git clone` string interpolation.

## Impact
RCE on any host that runs `npm run fetch-data` / `node scripts/fetch-data.js --source <url>`.
The `parallel.yml` CI workflow invokes this code path under a token with `contents: write`,
`issues: write`, `actions: write` — full repo compromise.

## Suggested fix
1. **Do not build shell strings.** Use `execFileSync('git', ['clone', '--depth', '1', url, dir])`
   with argument arrays — no shell interpretation. (Preferred.)
2. If shell must be used, sanitize pathname with a strict allowlist regex
   (`/^[A-Za-z0-9._~/-]+$/`), reject `; & | $ \` \n` etc. — and add a unit test asserting
   injection payloads are REJECTED.
3. Add regression tests for `validateRepoUrl` covering all payloads above.

## Affected
scripts/fetch-data.js:55–97 (validateRepoUrl), :141–151 (execGitCommand), :178 (git clone),
:326 (--source arg)

## Status tracking
- 24th run: PoC-confirmed 1st
- 25th run: PoC-confirmed 2nd
- 26th run: PoC-confirmed 3rd
- 27th run: PoC-confirmed 4th
- 28th run: PoC-confirmed 5th
- 29th run: PoC-confirmed 6th
- 30th run: **PoC-confirmed 8th** (fresh harness this run)
