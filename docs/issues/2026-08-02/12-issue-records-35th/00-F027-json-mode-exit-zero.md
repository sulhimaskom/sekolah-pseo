# F027 — check-workflow-security.js `--json` mode exits 0 even with violations (NEW, 35th run)

**Evaluation Date**: 2026-08-02 (35th run)
**Category**: security
**Priority**: P2
**Status**: OPEN — NEW (first observed 35th run)
**Skills used**: `obra-superpowers-systematic-debugging` (exit-code hypothesis testing:
human vs JSON mode on same rule set); validator-only PoC (no fixes attempted)

## Summary

`scripts/check-workflow-security.js` — the only automated guard for the workflow
permissions findings (F013, F021) — returns **exit code 0 in `--json` mode even when 12
violations are present** (2 CRITICAL + 10 HIGH). Human mode correctly returns exit 1 on
the same violations. Since the tool's own usage text and `SECURITY_AUDIT_NOTE.md:95`
recommend using JSON output "for CI", any CI job that consumes `--json` would **always
pass** — the gate would be a no-op exactly where it is meant to enforce.

## Evidence (35th run, fresh probes)

```
$ node scripts/check-workflow-security.js ; echo "exit=$?"
  ...12 violations reported (2 🔴 CRITICAL + 10 🟠 HIGH)...
exit=1                                    # human mode: correctly fails

$ node scripts/check-workflow-security.js --json > /tmp/wf.json ; echo "exit=$?"
exit=0                                    # JSON mode: exits 0 WITH violations

$ python3 -c "import json; d=json.load(open('/tmp/wf.json')); print(len(d))"
12                                        # 12 violations present in JSON payload
```

## Root cause

`scripts/check-workflow-security.js:191-206` — the `--json` branch writes the JSON
payload with `console.log` and then falls through to the end of `run()` with **no
`process.exit(code)`**. The human branch (`:215` clean / `:229` violations) sets the exit
code explicitly; the JSON branch never does. Result: `--json` is exit-code-dead.

## Impact / Risk

- **Direct**: a CI job (`security-regression-check.yml` — recommended but still absent,
  see F013) consuming `--json` would never fail; F013 violations would ship silently.
- **Compound**: compounds F021 (husky gate already swallows failures via
  `2>/dev/null || echo skipped`). Today there is _no_ enforcement path for workflow
  security; `--json` closes off the only documented CI path as well.
- **Severity**: P2 — enforcement is defense-in-depth today (no active exploit), but the
  checker's documented CI contract is broken.

## Suggested fix

`scripts/check-workflow-security.js` — after emitting JSON, mirror the human exit logic:
`process.exit(hasViolations ? 1 : 0)` (same rule as `:229`). Add a unit test asserting
non-zero exit with a known-bad fixture and zero exit with a clean one.

## File affected

- `scripts/check-workflow-security.js:191-206` (JSON branch missing `process.exit`)
- `SECURITY_AUDIT_NOTE.md:95` (documents the JSON-for-CI usage that this defect breaks)
