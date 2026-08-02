# ISSUE RECORD — F015: OS command injection in fetch-data.js validateRepoUrl

> **Status**: GitHub issue creation BLOCKED (403, `permission: none`) — record persisted per repo convention (finding 002, 22nd consecutive block).
> **Labels**: `security`, `P1`
> **Evaluation date**: 2026-08-02
> **File affected**: `scripts/fetch-data.js` (lines 55–97, 165–180)

## Summary

`validateRepoUrl()` reconstructs the git URL from `parsed.protocol//parsed.hostname +
parsed.pathname` and only enforces protocol/hostname/`.git`-suffix. Shell metacharacters
retained in `pathname` are NOT stripped. The returned value flows directly into
`execSync('git clone --depth 1 ' + safeRepoUrl + ...)` (line 178), enabling **OS command
injection**.

## PoC (re-verified live this run)

```
$ node -e "... url='https://github.com/foo/bar;id.git' → sanitized='https://github.com/foo/bar;id.git'; endsWith('.git')=true"
execSync OUTPUT: POC_PREFIX https://github.com/foo/bar
INJECTION_OK        ← shell executed the injected command after ';'
```

`bar;id.git` and `bar$(id).git` both pass validation and execute arbitrary commands.

## Evidence

- `scripts/fetch-data.js:55-97` — validateRepoUrl (no metacharacter filtering)
- `scripts/fetch-data.js:165-180` — `execSync(\`git clone ... ${safeRepoUrl}\`)`
- Node PoC executed this session (output above)

## Impact / Risk

**Critical** — Remote/arbitrary code execution on the build host whenever a crafted repo
URL reaches the fetch path (e.g., via env var, config, or CLI input). This is the 3rd+
consecutive live confirmation across verification runs.

## Suggested resolution

1. Reject URLs whose pathname/hostname contain `[^\w./:@-]` (or `;`, `$`, `(`, `)`, backtick, `|`, `&`, space).
2. Prefer `execFile`/`spawn` with an argument array instead of string interpolation into `execSync`.
3. Add a unit test asserting `validateRepoUrl('https://x/bar;id.git')` and
   `'https://x/bar$(id).git'` throw `IntegrationError` (INVALID_URL).

## Domain score impact

- **A1 Correctness** (82/100): −10 (overlapping)
- **B3 Security Practices** (54/100): **−20 global penalty (critical vulnerability)**
- **Composite**: −20 global penalty applied
