# F015-RESIDUAL — Percent-encoded shell metacharacters still pass `validateRepoUrl` (defense-in-depth gap)

**Evaluation Date**: 2026-08-02 (33rd run)
**Category**: security
**Priority**: P2
**Status**: OPEN — hardening gap after F015 primary fix
**Skills used**: `obra-superpowers-systematic-debugging` (hypothesis-driven payload-class
enumeration: literal → percent-encoded → mixed encodings); security PoC harness
(validator-only replication, no `execSync` executed)

## Summary

The 32nd-run F015 fix (commit 98007c6) added `SHELL_METACHARACTER_REGEX` rejection in
`validateRepoUrl` (scripts/fetch-data.js:88). Literal shell metacharacters are now
correctly rejected. **However, percent-encoded variants survive validation** because the
WHATWG URL parser does NOT decode `%xx` sequences in `pathname`, and the regex only
matches literal characters:

```js
const SHELL_METACHARACTER_REGEX = /[;&|`$()<>*?'"#!\\\s]/; // fetch-data.js:38
```

## PoC (33rd run, validator only — no payload executed)

| Payload                                            | Decodes to (if any decoder applied) | Result (33rd)                   |
| -------------------------------------------------- | ----------------------------------- | ------------------------------- |
| `https://github.com/foo/bar;id.git`                | `;`                                 | ✅ REJECTED (primary fix works) |
| `https://github.com/foo/$(id).git`                 | `$(` `)`                            | ✅ REJECTED                     |
| `https://github.com/foo/bar%26%26rm%20-rf%20x.git` | `&&` + spaces                       | ❌ **ACCEPTED**                 |
| `https://github.com/foo/%3Bid.git`                 | `;`                                 | ❌ **ACCEPTED**                 |
| `https://github.com/foo/bar%7Cid.git`              | `\|`                                | ❌ **ACCEPTED**                 |
| `https://github.com/foo/%60id%60.git`              | `` ` ``                             | ❌ **ACCEPTED**                 |

## Why it is NOT currently exploitable (impact assessment)

The only consumer of the validated URL is `execSync('git clone --depth 1 ${safeRepoUrl} …')`
(fetch-data.js:193). `execSync` runs `/bin/sh -c`, and **the shell does not percent-decode**,
so `%26%26` stays literal text to git, not a `&&` operator. Exploitation today is blocked.

## Risk (the gap)

Any future code path that calls `decodeURIComponent()` on the URL — for logging, for
fetching, for building a clean display URL — would re-enable command injection with zero
additional attacker capability. The validator currently creates a false sense of safety
for encoded payloads. This is a classic "validate at the boundary you control" weakness:
validation must reject the _decoded_ form too.

## Suggested fix

1. **Preferred**: Validate the URL after `decodeURIComponent(sanitizedUrl)` as well —
   reject if the decoded form contains shell metacharacters (catch `%26`, `%3B`, `%7C`,
   `%60`, `%24`, `%20`, …), OR
2. **Stronger**: Stop building shell strings entirely — use
   `execFileSync('git', ['clone', '--depth', '1', url, dir])` with an argument array so no
   shell interpretation is possible regardless of URL encoding, OR
3. Reject any URL whose pathname contains a literal `%` escape (conservative allow-list of
   safe characters).

## Affected

scripts/fetch-data.js:38 (regex), :83 (reconstruction), :88 (check), :193 (`git clone`
interpolation).

## Status tracking

- 32nd run: primary fix landed (#542) — literal payloads rejected
- **33rd run: NEW residual finding — 4 encoded payload classes accepted**
