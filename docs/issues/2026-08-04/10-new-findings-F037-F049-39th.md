# New Findings F037–F049 — Deep Source Audit (39th verification run, 2026-08-04)

**Source**: fresh audit of the 39th run — 2 completed parallel deep-audit explore agents
(workflow security audit; src/ architecture audit), cross-checked against the tracked
F001–F036 ledger, with every new candidate re-verified this run via direct file reads.
A scripts/ agent and a tests/DX agent were launched in parallel but exceeded runtime
bounds and were cancelled; their partial outputs were folded into this run's
re-verification of existing findings rather than treated as new evidence.

All 13 findings are labeled (category + priority) and ready for bulk GitHub issue
creation the moment F002 (token lacks `issues: write`) is resolved.

---

## F037 — `issue_comment` trigger lets ANY public user fire a write-token LLM agent (security, P1)

- **Location**: `.github/workflows/opencode.yml:8-9` (trigger), `:17-22` (permissions),
  `:70-144` (agent run), `:174` (auto-merge)
- **Evidence** (verified this run): the repo is **PUBLIC**
  (`gh repo view` → `isPrivate:false`). `opencode.yml` triggers on
  `issue_comment: types: [created]` **with no actor/role gate**. Any GitHub user
  (no repo access needed) can comment on any PR/issue and fire the workflow, which
  runs an LLM agent with `permissions: id-token/contents/pull-requests/issues/actions:
  write` over the **attacker-controlled PR content** (title/body/diff are fed into the
  agent prompt). The agent is instructed to fix code and commit to the PR branch, and
  may auto-merge (`gh pr merge --admin`, line 174).
- **Impact**: prompt-injection RCE chain — an attacker PR can steer the agent to
  exfiltrate env secrets (IFLOW_API_KEY, SUPABASE_*, CLOUDFLARE_*) or push malicious
  code to the PR branch, then auto-merge it to `main`. Unauthenticated-triggerable on a
  public repo. Highest-severity new finding.
- **Fix**: gate the `issue_comment` trigger on actor permissions
  (`if: github.event.comment.author_association == 'OWNER' || 'MEMBER' || 'COLLABORATOR'`),
  reduce the agent token to read-only, and remove `--admin` auto-merge (see F041).

---

## F038 — `workflow_dispatch` `custom_prompt` interpolated into `run:` heredoc → proven shell RCE (security, P1)

- **Location**: `.github/workflows/architect-agent.yml:208`
- **Evidence** (verified this run): `Custom prompt dari dispatch:
  "${{ github.event.inputs.custom_prompt }}"` sits **inside a quoted heredoc body**
  passed to `opencode run "$(cat <<'PROMPT' ... )"`. GitHub evaluates the `${{ }}`
  expression **before** the shell parses, so a crafted input containing a column-1
  `PROMPT` line terminates the heredoc early and any commands after it execute.
  The workflow audit agent **proved the mechanics** on this repo's exact script shape
  (injected `echo PWNED` executed, exit 0). The step env carries `secrets.GH_TOKEN`
  (a stored PAT) and `IFLOW_API_KEY`.
- **Impact**: RCE on the runner with the stored PAT and API key — anyone able to
  trigger `workflow_dispatch` (write access, or any user if dispatch is public) can
  run arbitrary shell commands.
- **Fix**: pass the input via an environment variable / input file
  (`env: CUSTOM_PROMPT: ${{ inputs.custom_prompt }}` and reference `$CUSTOM_PROMPT`),
  never inline in `run:`. Add a linter rule banning `${{ inputs.* }}`/`${{ github.event.* }}`
  inside `run:` blocks.

---

## F039 — All-branch `push` runs branch-controlled prompts with cloud secrets in env (security, P1)

- **Location**: `.github/workflows/on-push.yml:4` (`push:` — no branch filter),
  `:18-28` (env secrets), `:77-165` (reads `.github/prompt/*.md` from the checked-out branch)
- **Evidence** (verified this run): `on: push:` with **no `branches:` filter** means
  every push to **any** branch triggers the workflow, which checks out the pushed
  branch and feeds `.github/prompt/*.md` **from that branch** into the agent. The job
  env includes `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GEMINI_API_KEY`,
  `SUPABASE_*`, `IFLOW_API_KEY`, and `API_KEY` (= GEMINI_API_KEY).
- **Impact**: any collaborator (or compromised account) pushes a branch containing a
  modified prompt file → the agent runs with production cloud secrets in env and can
  be steered to exfiltrate them. Trivial secret theft by any write-access actor.
- **Fix**: restrict `push:` to `branches: [main]` (and `pull_request` to
  `branches: [main]`), or checkout `main` explicitly; scope secrets per-step so only
  steps that need them receive them.

---

## F040 — Unpinned `curl | bash` install of opencode CLI with job-level secrets (security, P1)

- **Location**: all 6 workflows — `orchestrator.yml:49`, `architect-agent.yml:47`,
  `on-pull.yml:63`, `on-push.yml:63`, `parallel.yml:76/271/351/405`, `opencode.yml:55`
- **Evidence** (verified this run): every workflow executes
  `curl -fsSL https://opencode.ai/install | bash` — an unpinned script from a mutable
  URL. Secrets are declared at **job level** (`on-push.yml:18-28`, `on-pull.yml:26-31`,
  `parallel.yml:31-37/276-282`, `orchestrator.yml:32-34`, `architect-agent.yml:36-38`),
  so the install step itself runs with `CLOUDFLARE_API_TOKEN`, `SUPABASE_SECRET_KEY`,
  `IFLOW_API_KEY`, `GH_TOKEN` in its environment.
- **Impact**: compromise of the install endpoint (or TLS/DNS misdirection) = arbitrary
  code with every production secret and a write token, in all 6 workflows, including
  on schedule.
- **Fix**: download to a file, pin and verify a known SHA256, execute only after
  verification; scope secrets per-step so install steps get none.

---

## F041 — `gh pr merge --admin` bypasses branch protection (security, P2)

- **Location**: `.github/workflows/opencode.yml:174`; prompt instruction at
  `on-pull.yml:193` (`Use gh pr merge --admin to bypass branch protection when
  conditions are met.`)
- **Evidence** (verified this run): `--admin` ignores branch protection (required
  reviewers, required checks). The only gates are workflow self-imposed ones
  (`opencode.yml:162-166`: CI SUCCESS + ≥1 APPROVED review + `ready-to-merge` label) —
  and the label is agent-addable (allowed action). `on-pull.yml:191` also says
  "Set to auto merge if check takes too long", removing the manual step.
- **Impact**: once any PR passes CI with a single approval, it is force-merged and its
  branch deleted with no human confirmation. Combined with F037, an attacker-influenced
  PR can land on `main`.
- **Fix**: remove `--admin` (and `--delete-branch`); require explicit maintainer
  approval; never auto-merge security-labeled PRs.

---

## F042 — Cross-branch cache poisoning of agent memory and npm cache (security, P2)

- **Location**: `.github/workflows/on-push.yml:46-54`, `parallel.yml:54-61` — `path:
  ~/.opencode, ~/.npm`, key `opencode-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-v1`,
  restore-keys `opencode-${{ runner.os }}-v1` (no branch scoping)
- **Evidence** (verified this run): cache restore-keys search across **all branches**;
  the key is attacker-influenceable via `package-lock.json` in a pushed branch.
  `~/.opencode` contains the agent's session memory/config — poisoning it injects
  instructions into every later agent run (including `main`/schedule runs with secrets).
- **Impact**: a collaborator writes a poisoned cache entry; the next privileged run
  (hourly `on-pull`, daily `orchestrator`) restores it and executes poisoned agent
  memory with write tokens + secrets.
- **Fix**: bind the key to the ref (`hashFiles` + `github.ref`/`github.sha`), drop
  bare `restore-keys`, and do not cache agent-memory dirs across untrusted branches.

---

## F043 — Zero third-party actions pinned to commit SHA (security, P2)

- **Location**: all 18 `uses:` lines across all 6 workflows — `actions/checkout@v7`
  (on-push:40, on-pull:43, orchestrator:38, architect-agent:42, parallel:40/248/336/392,
  opencode:48), `actions/setup-node@v7` (on-pull:50, parallel:68/265/343/399),
  `actions/cache@v6` (on-push:46, parallel:54), `softprops/turnstyle@v3` (on-push:32,
  on-pull:35)
- **Evidence** (verified this run): major-version tags are mutable; a tag force-move or
  upstream compromise silently changes code executed in every run with write tokens.
- **Impact**: supply-chain compromise of `actions/` or `softprops/` → arbitrary code in
  all privileged runs.
- **Fix**: pin every action to a full 40-char commit SHA (with the version tag as a
  comment); add a linter rule forbidding `uses: *@v*`.

---

## F044 — `github.actor` interpolated into `run:` git-config steps + job-level secret over-scoping (security, P2)

- **Location**: `on-pull.yml:58-59`, `parallel.yml:65-66/262-263/341-342/397-398`,
  `on-push.yml:58-59` — `git config --global user.name "${{ github.actor }}"` in `run:`
- **Evidence** (verified this run): GitHub's hardening guide names `github.actor` as
  untrusted input for `pull_request` events; interpolated straight into shell. Current
  exploitability is capped by GitHub's username charset (alphanumeric/hyphen), but it is
  the canonical script-injection pattern. These same trivial steps run with the job's
  full secret set in env (`on-pull.yml:26-31` puts `SUPABASE_SECRET_KEY` in the env of
  the git-config step).
- **Impact**: latent script injection; every secret present in every step's env,
  maximizing blast radius of F038/F039/F040.
- **Fix**: use `$GITHUB_ACTOR`/`$GITHUB_ACTOR_ID` (or `env: ACTOR: ${{ github.actor }}`
  + `$ACTOR`) instead of inline interpolation; scope secrets at step level.

---

## F045 — Incremental build never removes stale pages for deleted or moved schools (bug, P2)

- **Location**: `src/services/BuildOrchestrator.js:406-449`; `scripts/manifest.js:150-176`
- **Evidence** (verified this run): `getChangedSchools` iterates only **current** schools
  and compares hashes. Schools **removed** from `schools.csv` are never deleted from
  `dist/`; schools whose **path changes** (provinsi/kab_kota/kecamatan/nama change →
  different relative path) leave the old page orphaned while the new one is written.
  The manifest stores `path` but nothing reconciles `dist/` against it.
- **Impact**: stale, linkable pages accumulate in `dist/` after incremental builds —
  contradicts the incremental-build correctness guarantee (same defect class as F031,
  but in the *removal/move* dimension).
- **Fix**: diff manifest paths vs current schools; delete orphaned pages (or reconcile
  `dist/` against the manifest) during incremental builds.

---

## F046 — One malformed school row aborts the ENTIRE build via search-data path (bug, P2)

- **Location**: `src/services/PageBuilder.js:245-264` (`prepareSchoolDataForSearch` →
  `getSchoolRelativePath` throws); `src/services/BuildOrchestrator.js:346-353`
  (`writeSearchDataFile(schools)` inside `sharedPagesPromise`)
- **Evidence** (verified this run): `writeSchoolPagesConcurrently` tolerates per-school
  failures (each school page is individually guarded), but `prepareSchoolDataForSearch`
  calls `getSchoolRelativePath(school)` which **throws** on any school missing a required
  field (`ERROR_CODES.MISSING_REQUIRED_FIELD`, PageBuilder.js:38-45). That throw rejects
  `sharedPagesPromise` → the whole `build()` fails (exit 1) because of ONE bad CSV row,
  even though the school-pages path would have skipped it.
- **Impact**: inconsistent error handling — the search-data generator (a derived
  artifact) is more fragile than the primary page pipeline; a single dirty row in
  `schools.csv` takes down the entire build with no per-school recovery.
- **Fix**: skip-and-log invalid schools in `prepareSchoolDataForSearch` (mirroring the
  per-school tolerance in `writeSchoolPagesConcurrently`), or validate all rows once at
  load and report counts.

---

## F047 — JSON-LD structured data double-escaped with `escapeHtml` (bug, P2)

- **Location**: `src/presenters/templates/school-page.js:102-117`
- **Evidence** (verified this run): inside `<script type="application/ld+json">`, fields
  are rendered with `escapeHtml(...)`, which converts `&`→`&amp;`, `"`→`&quot;`,
  `<`→`&lt;`. `<script>` is a **raw-text element**: HTML entities are NOT decoded, so
  the JSON parser receives literal `&amp;`/`&quot;` inside string values → the JSON is
  syntactically valid but the **data is corrupted** (e.g. `SDN & B` becomes
  `SDN &amp; B`) for search-engine consumers.
- **Impact**: corrupted Schema.org/JSON-LD structured data for any school whose
  name/address contains `&`, quotes, or `<` — silently degrades SEO/rich-result data.
- **Fix**: emit JSON via `JSON.stringify` (and escape `<` as `\u003c` for script-context
  safety) instead of HTML-escaping into the JSON body.

---

## F048 — Dead code: `searchLoaded` flag and test-only exports (refactor, P3)

- **Location**: `src/presenters/templates/homepage.js:315,351` (`searchLoaded` written,
  never read); `homepage.js:22-42` (`extractFilterOptions`), `:49-77`
  (`aggregateByProvince`) — exported at `:734-736` but referenced only by
  `scripts/homepage.test.js`
- **Evidence** (verified this run): `searchLoaded` is assigned `false`→`true` and never
  read; the two aggregation helpers are exported but only tests import them — the
  production path uses `aggregateProvinceAndFilters` (homepage.js:116). Test-only
  exports keep dead code alive and give a false coverage signal.
- **Impact**: maintenance burden; misleading coverage; dead branches in the shipped
  client bundle (homepage script).
- **Fix**: delete `searchLoaded`; either remove the test-only exports or mark them
  `@internal` and move to the test-only module if genuinely needed.

---

## F049 — Copy-feedback shows blank text after the first copy (bug, P3)

- **Location**: `src/presenters/templates/school-page.js:216-217,233`
- **Evidence** (verified this run): `defaultText` is captured from
  `feedback.textContent` at click time; after the first copy the timeout empties the
  `role="status"` region (`feedback.textContent = ''`, line 233). On the **second**
  click, `defaultText` is now `''` → the "Tersalin!" message is never restored; the
  button flashes with an empty feedback bubble.
- **Impact**: accessibility/UX defect — the copy-success announcement fires once, then
  becomes blank for every subsequent copy on the page.
- **Fix**: capture the template constant (`T.COPIED`) instead of the live
  `textContent`, or restore the original text from a stored constant after the timeout.

---

## Candidate findings from agents NOT tracked this run

The partial src-audit output also surfaced cleanup items that map to existing tracked
findings or are too low-signal for separate tracking; recorded for the record:
- Duplicate `escapeHtml` client-side implementation in homepage.js:382 — overlaps F035.
- `run_tests.py` duplicate imports + dead code after `return` — tracked as F019.
- Sitemap/province-page path drift possibilities — folded into F024 (sitemap omitted
  from build) and F045.
- `styles.js` client-side duplication of aggregation logic — folds into F008/F036-era
  cleanup.
