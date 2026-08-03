# F015 — OS Command Injection in fetch-data.js (EXPLOITABLE, PoC-confirmed 7th consecutive run)

**Evaluation Date**: 2026-08-02 (29th run)
**Category**: security
**Priority**: P1
**Status**: OPEN — **EXPLOITABLE (live)**

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

## PoC (verified this run)
All three payloads pass validation (return non-throwing, reach `git clone` substring):
- `https://github.com/foo/bar;id.git`  →  `git clone --depth 1 https://github.com/foo/bar;id.git`
- `https://github.com/foo/bar$(id).git` →  command substitution executes `id`
- `https://github.com/foo/bar\`id\`.git` →  backtick substitution executes `id`

Any caller-supplied `--source` (CLI arg, scripts/fetch-data.js:326) or `repoUrl` parameter
triggers arbitrary OS command execution on the host running the ETL/fetch pipeline.

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
