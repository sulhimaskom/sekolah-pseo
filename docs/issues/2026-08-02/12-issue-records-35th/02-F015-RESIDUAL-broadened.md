# F015-RESIDUAL — Encoded AND parser-rewritten metacharacters pass validateRepoUrl (BROADENED, 35th run)

**Evaluation Date**: 2026-08-02 (35th run)
**Category**: security
**Priority**: P2
**Status**: OPEN — RE-CONFIRMED and **BROADENED** (35th run)
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven payload
sweep); validator-only PoC (no `execSync` executed — validation surface only)

## Summary

The 34th run recorded F015-RESIDUAL as "5 encoded payload classes accepted" and F015 as
"6 literal payload classes rejected". **35th-run evidence corrects the literal side**:
the WHATWG URL parser **rewrites certain literal metacharacters before the regex check**,
so two additional _literal_ payload classes (backtick, `<>`) are also **accepted**.
The residual gap is wider than previously recorded — 5 encoded + 2 literal-reencoded
classes pass `validateRepoUrl`.

## Evidence (35th run, validator-only)

```
Literal payloads (35th run):
  bar;id.git        → REJECTED   (SHELL_METACHARACTER_REGEX catches ';')
  bar$(id).git      → REJECTED   (catches '$')
  bar&&id.git       → REJECTED   (catches '&')
  bar|id.git        → REJECTED   (catches '|')
  bar`id`.git       → ACCEPTED   ← WHATWG re-encodes ` → %60 BEFORE regex check
  bar<>id.git       → ACCEPTED   ← WHATWG re-encodes < > → %3C %3E BEFORE regex check

Encoded payloads (35th run, unchanged from 34th):
  bar%26%26id.git   → ACCEPTED   (%26 = '&')
  bar%3Bid.git      → ACCEPTED   (%3B = ';')
  bar%7Cid.git      → ACCEPTED   (%7C = '|')
  bar%60id.git      → ACCEPTED   (%60 = '`')
  foo%2Fbar.git     → ACCEPTED   (%2F = '/')
```

## Root cause

`scripts/fetch-data.js:38,83-88` — `validateRepoUrl` reconstructs the URL from
`parsed.pathname`, and `new URL()` percent-encodes characters the WHATWG spec forbids in
path segments (backtick, `<`, `>`, space, etc.). The regex
`/[;&|`$()<>*?'"#!\\\s]/` then tests the already-rewritten string, so it can never see
the original metacharacters. Percent-encoded sequences are also untouched by the regex.

## Why this is NOT exploitable today (severity stays P2)

The URL flows into `git clone --depth 1 ${safeRepoUrl}` via `execSync` (`:193`). The
shell receives the **percent-encoded** string (`bar%60id%60.git`), which it does not
percent-decode — so no backtick command substitution occurs. This is a defense-in-depth
gap, not a live RCE. Exploitation would require a secondary decoder between validation
and `execSync`.

## Suggested fix (unchanged from 34th, still valid)

1. Prefer `execFileSync('git', ['clone', ...])` arg-array (`fetch-data.js:193`) so the
   shell never interprets the URL — eliminates the entire class.
2. Defense-in-depth: percent-decode the sanitized URL and re-run
   `SHELL_METACHARACTER_REGEX` against the decoded form (`fetch-data.js:88`).

## File affected

- `scripts/fetch-data.js:38` (regex), `:59-112` (validator), `:193` (execSync site)
- `scripts/fetch-data.test.js` — add encoded + parser-rewritten payload cases
