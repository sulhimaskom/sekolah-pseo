# F015 — OS Command Injection in fetch-data.js — **RESOLVED (32nd run)**

**Evaluation Date**: 2026-08-02 (32nd run)
**Category**: security
**Priority**: P1
**Status**: **RESOLVED** — fix verified, regression tests added
**Skills used**: `obra-superpowers-systematic-debugging` (root-cause isolation: traced
payload flow from CLI arg → validateRepoUrl → execSync interpolation); security PoC
harness (direct replication of validateRepoUrl logic before + after fix)

## Summary

`validateRepoUrl` (scripts/fetch-data.js) did NOT sanitize the URL **pathname** against
shell metacharacters. It reconstructed:

```js
const sanitizedUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
```

and returned it, after which `fetchFromGitHub` interpolated it directly into a shell
command:

```js
execGitCommand(`git clone --depth 1 ${safeRepoUrl} ${EXTERNAL_DATA_DIR}`, ...)
// execGitCommand → execSync(command, ...)  (child_process; shell semantics)
```

PoC-confirmed live for **9 consecutive runs** (24th–31st); composite score declined
monotonically (78.0 → 77.3) because the finding was re-recorded but never repaired.
This run repairs it (REPAIR MODE, highest-priority open issue per contract).

## Root cause

The WHATWG `URL` parser percent-encodes some characters (spaces → `%20`, backticks →
`%60`) but leaves shell-active characters **intact** in `hostname`/`pathname`:
`;`, `$`, `&`, `(`, `)`, `|`, `'`, `"`, `!`, `*`, etc. The prior "sanitization" only
reconstructed the URL — it never rejected these.

## Fix (scripts/fetch-data.js)

1. Added module-level `SHELL_METACHARACTER_REGEX = /[;&|`$()<>*?'"#!\\\s]/`.
2. In `validateRepoUrl`, after reconstruction, the reconstructed URL is tested against
   the regex; any shell metacharacter → `IntegrationError` (`INVALID_URL`,
   reason `shell_metacharacters`). This mirrors the existing `validateBranchName`
   allowlist-rejection pattern already in the module.

## Verification (this run, all fresh)

| Check                                   | Result                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PoC pre-fix (5 payload classes)         | ❌ `;id`, `$(id)`, backtick, `&&`, `\|` ALL passed validation                                        |
| PoC post-fix                            | ✅ all shell-active payloads REJECTED (`IntegrationError`); legitimate URLs still accepted unchanged |
| Hostname-side injection `github.com;id` | ✅ REJECTED                                                                                          |
| Credentials/port/fragment forms         | ✅ stripped by URL parser, inert (accepted as sanitized URL)                                         |
| `npm run lint`                          | ✅ 0 errors, 0 warnings                                                                              |
| `npm run test:js` ×3 full suites        | ✅ 1036 tests, 0 fail each run (F014 not observed)                                                   |
| `npm run test:js:coverage`              | ✅ 95.36% stmt / 92.39% branch / 96.63% funcs (above 80/75 gates)                                    |
| `npm run build`                         | ✅ exit 0, 2 pages, 0 failed                                                                         |
| `python3 tests/run_tests.py`            | ✅ 27/27 pass                                                                                        |
| Prettier (changed files)                | ✅ clean                                                                                             |

## Regression tests added (scripts/fetch-data.test.js, +6)

- semicolon command-chaining `bar;id.git`
- command substitution `$(id).git`
- ampersand chaining `bar&&rm -rf x.git`
- pipe `bar|cat /etc/passwd.git`
- hostname-side semicolon injection `github.com;id`
- legitimate complex URL `foo-bar_baz.qux.git` still accepted (no over-blocking)

## Impact assessment

Removes RCE on any host running `npm run fetch-data` /
`node scripts/fetch-data.js --source <url>` (previously: full repo compromise under CI
token). Defense-in-depth note: a future stronger fix would switch `execGitCommand` to
`execFileSync` with argument arrays (no shell at all) — tracked for follow-up.

## Affected

- scripts/fetch-data.js: `validateRepoUrl` (~line 55), new regex constant
- scripts/fetch-data.test.js: +6 regression tests

## Status tracking

- 24th run: PoC-confirmed 1st
- ...
- 31st run: PoC-confirmed 9th
- **32nd run: RESOLVED — payloads rejected, tests green, shipped in PR**
