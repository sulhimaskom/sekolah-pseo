# F056–F059 — Security cluster: path-traversal guard bypass, prototype-key injection, SSRF, env-dir command injection

- **IDs**: F056, F057, F058, F059
- **Category**: security
- **Priority**: F056 P2 / F057 P1 / F058 P2 / F059 P2
- **Status**: NEW (64th run, 2026-08-07) — all four **verified by execution**
- **Reported**: 2026-08-07

## F056 — `validatePath()` prefix-boundary traversal bypass

- **File**: `scripts/config.js:18-23, 31-37`
- **Bug**: `validatePath()` uses `normalized.startsWith(baseNormalized)` with no
  path-boundary check.
- **Verified by execution**:
  ```
  RAW_DATA_PATH=../sekolah-pseo-evil.csv
  → resolves to /home/runner/work/sekolah-pseo-evil.csv
  → passes validation (isWithin: true)
  ```
- **Impact**: The traversal guard can be bypassed by any sibling path sharing
  the ROOT_DIR prefix (`..` traversal one level up still passes). Env-controlled,
  low severity, but the guard's promise ("path must be within ROOT_DIR") is false.
- **Fix**: compare `resolved` against `base + path.sep` boundary, or use
  `path.relative(base, resolved)` and reject on `..` prefix.

## F057 — Prototype-key injection via untrusted NPSN

- **Files**: `scripts/manifest.js:121-143, 160-174`,
  `src/services/BuildOrchestrator.js:236-245`, `scripts/enrichment.js:262-290`
- **Bug**: Untrusted third-party CSV `npsn` used as a key on plain objects
  (`manifest.schools[npsn]`, `enrichmentMap[npsn]`).
- **Verified by execution**:
  ```
  m['__proto__'] = { npsn:'__proto__', name:'evil' }
  → Object.prototype.hasOwnProperty(m,'__proto__') === false
  → JSON.stringify(m) === '{}'   (entry silently LOST)
  → m.__proto__.name === 'evil'  (prototype MUTATED — stale lookups)
  ```
- **Impact**: A malicious CSV row with NPSN `__proto__` (or `constructor`,
  `toString`) silently corrupts the manifest / enrichment map and can return
  stale or attacker-influenced objects. P1 because it corrupts build artifacts
  and data integrity from an untrusted input source (the whole point of the ETL
  pipeline is consuming third-party CSV).
- **Fix**: use `Object.create(null)` or `Map` for all NPSN-keyed maps.

## F058 — SSRF-allowing repo URL validation

- **File**: `scripts/fetch-data.js:64-140`
- **Bug**: `validateRepoUrl()` allows any http(s) hostname; no private-range /
  link-local / cloud-metadata block.
- **Verified by execution**: `https://169.254.169.254/latest/meta-data.git`,
  `https://127.0.0.1:8000/secret.git`, `https://10.0.0.5/internal.git` all pass.
- **Impact**: `--source` flag feeds `git clone` against internal /
  cloud-metadata hosts → SSRF. CLI-only, low severity, but blocks the ability to
  safely run fetch-data in any privileged context.
- **Fix**: reject loopback / link-local / RFC1918 / metadata-IP hostnames before
  cloning.

## F059 — `EXTERNAL_DATA_DIR` interpolated raw into shell string

- **File**: `scripts/fetch-data.js:38-39, 220-224`
- **Bug**: `git clone --depth 1 ${safeRepoUrl} ${EXTERNAL_DATA_DIR}` — only the
  URL and branch are validated; the env-controlled directory path is not, so
  shell metacharacters in `EXTERNAL_DATA_DIR` = command injection.
- **Impact**: Env-controlled, low severity (requires operator-controlled env),
  but the injection surface exists on a shell-exec path. Should use
  `execFile` with an argv array instead of a composed shell string.

## Recommendation

All four are cheap to fix (Map/Object.create(null) for F057; boundary check for
F056; hostname deny-list for F058; argv-array exec for F059). F057 is the
highest value because the input is untrusted third-party CSV. Requires
workflows:write for the workflow-triggered parts; the code fixes themselves are
ordinary PRs.

## Related

- F034 (execSync git clone) — same shell-exec family.
- F037/F038 — broader security cluster (CI-pipeline, CRITICAL).
