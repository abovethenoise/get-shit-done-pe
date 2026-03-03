## User Intent Findings

### Primary Goal

Enable the author to share GSD as a published npm package so that any user can install and always run the latest version with a single command and zero manual maintenance — source: `.planning/capabilities/install-and-deploy/BRIEF.md` ("install-and-deploy needs to become a publishable npm package with a clear update command and visible install feedback so the author can share it")

---

### Acceptance Criteria

**package-identity**

- `package.json` `name` field is `get-shit-done-pe` — pass: value matches exactly — source: `features/package-identity/FEATURE.md` FN-01
- `package.json` `author` field is `abovethenoise` — pass: value matches exactly — source: `features/package-identity/FEATURE.md` FN-01
- `package.json` `bin` entry key is `get-shit-done-pe` pointing to `bin/install.js` — pass: key and value match — source: `features/package-identity/FEATURE.md` FN-01 example
- `package.json` repository, homepage, and bugs URLs all point to `github.com/abovethenoise/get-shit-done-pe` — pass: all three fields updated — source: `features/package-identity/FEATURE.md` FN-01
- Install banner no longer references `TÂCHES`; subtitle reads `by abovethenoise` — pass: string absent / new string present — source: `features/package-identity/FEATURE.md` FN-02
- README contains attribution section that credits upstream GSD/TÂCHES and states the product-management pivot — pass: section present with both elements — source: `features/package-identity/FEATURE.md` EU-02 and Decisions
- `package.json` remains valid JSON after edits — pass: `node -e "require('./package.json')"` exits 0 — source: `features/package-identity/FEATURE.md` TC-01
- `npx get-shit-done-pe --global` resolves the binary and runs install (post-publish assumption) — pass: binary name in `bin` matches package name — source: `features/package-identity/FEATURE.md` EU-01

**cc-replacement**

- After `pe` install, `npm list -g get-shit-done-cc` shows the package is not installed — pass: command returns nothing for that package — source: `features/cc-replacement/FEATURE.md` EU-01, FN-01
- No `gsd:*` command files remain in `~/.claude/commands/` from a prior `cc` install — pass: directory scan finds zero `gsd:*` files not placed by `pe` — source: `features/cc-replacement/FEATURE.md` FN-02
- No `gsd-*` agent or hook files remain in `~/.claude/agents/` or `~/.claude/hooks/dist/` from a prior `cc` install — pass: scan finds zero — source: `features/cc-replacement/FEATURE.md` FN-02
- `~/.claude/settings.json` contains pe's hook registrations and no duplicate cc registrations — pass: hook entries are unique and reference pe hooks only — source: `features/cc-replacement/FEATURE.md` EU-01, TC-01
- `~/.claude/CLAUDE.md` pe content is wrapped in `<!-- GSD-PE:START -->` / `<!-- GSD-PE:END -->` delimiters — pass: delimiters present, content between them — source: `features/cc-replacement/FEATURE.md` FN-03
- `~/.claude/CLAUDE.md` content outside the delimiters is not modified — pass: content outside delimiters byte-identical to pre-install — source: `features/cc-replacement/FEATURE.md` FN-03
- `.planning/` directory is not touched during replacement — pass: no files in `.planning/` are modified or deleted — source: `features/cc-replacement/FEATURE.md` EU-01
- Running `pe` install twice does not produce errors or duplicate entries — pass: second run exits 0, settings.json unchanged — source: `features/cc-replacement/FEATURE.md` TC-01, CAPABILITY.md Invariant 1
- If `cc` uninstall fails, install continues and reports a warning rather than aborting — pass: install completes, warning line visible — source: `features/cc-replacement/FEATURE.md` FN-01

**install-feedback**

- Banner is the first thing printed; no other output appears until the final result line — pass: stdout contains only banner + final line — source: `features/install-feedback/FEATURE.md` EU-01, FN-03
- On full success: terminal shows exactly one pass line and one next-step hint — pass: line count between banner and EOF is 2 — source: `features/install-feedback/FEATURE.md` FN-03 example
- On failure: terminal shows exactly one fail line naming the specific step that failed — pass: fail line present, step name included, no stack trace — source: `features/install-feedback/FEATURE.md` FN-03, TC-01
- `scripts/validate-install.js` runs automatically as part of install (not a separate manual step) — pass: validation output folds into the single pass/fail result — source: `features/install-feedback/FEATURE.md` FN-02
- A validation failure causes the overall install to report failure — pass: exit code non-zero, fail message shown — source: `features/install-feedback/FEATURE.md` FN-02
- Banner shows `-PE` identity and version from `package.json` — pass: banner text contains `-PE` and matches semver from package.json — source: `features/install-feedback/FEATURE.md` TC-01 example
- Install works identically when invoked as `npx get-shit-done-pe --global` and as `node bin/install.js --global` — pass: output and behavior identical in both invocations — source: `features/install-feedback/FEATURE.md` TC-01

**auto-latest**

- A session-start hook fires a version check against the npm registry — pass: hook registered in `~/.claude/settings.json` pointing to update hook file — source: `features/auto-latest/FEATURE.md` TC-01
- Version check is skipped if fewer than 24 hours have elapsed since last check — pass: no npm network call made; cache file `lastCheck` timestamp unchanged — source: `features/auto-latest/FEATURE.md` FN-03
- When a newer version is available, update runs in the background without blocking the session — pass: session becomes usable immediately; hook is non-blocking — source: `features/auto-latest/FEATURE.md` FN-02, TC-01
- If npm query or install fails, session continues with current version and no output is shown to the user — pass: no terminal output; error written only to cache/debug file — source: `features/auto-latest/FEATURE.md` FN-02
- Updated version is active for the next session, not the current one — pass: current session version unchanged post-update — source: `features/auto-latest/FEATURE.md` FN-02, Decisions
- Cache file is stored at `~/.claude/get-shit-done/.update-check` and contains `lastCheck` and `currentVersion` fields — pass: file exists with correct schema after first check — source: `features/auto-latest/FEATURE.md` TC-01
- npm registry query has a short timeout (5 seconds) — pass: hook completes or times out within 5s without hanging — source: `features/auto-latest/FEATURE.md` TC-01

---

### Implicit Requirements

- The existing `{GSD_ROOT}` token replacement logic must not be broken by any of these changes — the CAPABILITY.md and BRIEF.md both treat it as a preserved invariant, but no feature spec explicitly says "don't break token replacement" — [First principles: token replacement is the core install mechanism; any refactor to install.js output flow risks silently suppressing errors from the replacement step]
- The install must exit with a non-zero exit code on failure — the feature spec describes "fail message" but never explicitly states `process.exit(1)`; any CI or scripted use of the installer requires it — [First principles: CLI tools must signal failure via exit code, not just output text]
- The auto-update hook must be registered by `install.js` in `~/.claude/settings.json` using the same hook registration pattern as existing hooks — auto-latest depends on package-identity and uses existing patterns but no spec states the exact settings.json key/format — source: `features/auto-latest/FEATURE.md` TC-01 ("Hook registration handled by install.js (same pattern as existing hooks)")
- The `prepublishOnly` build step (`npm run build:hooks`) must complete successfully before the package can be published — the BRIEF.md flags this as a migration risk but no feature owns it — source: `.planning/capabilities/install-and-deploy/BRIEF.md` ("hooks/dist build — prepublishOnly: npm run build:hooks must run before publish; esbuild dependency already present")
- `validate-install.js` must be callable programmatically (as a module function), not just as a standalone script — currently it may be a standalone script; install-feedback requires it to be importable — source: `features/install-feedback/FEATURE.md` TC-01
- The install must be safe to run on a machine that never had `get-shit-done-cc` installed — cc-replacement flow must handle the "not present" case without error — source: `features/cc-replacement/FEATURE.md` FN-01 ("If not present: skip, proceed to verification")
- `~/.claude/get-shit-done/` directory must exist before the update cache file can be written — auto-latest writes to `~/.claude/get-shit-done/.update-check`; install.js must create that directory — [First principles: writing a file to a directory that may not exist will throw; the directory is created by artifact copy, but that dependency is implicit]

---

### Scope Boundaries

**In scope:**
- `package.json` field updates (name, author, description, bin, repository, homepage, bugs, keywords)
- `bin/install.js` banner text update
- README attribution section (upstream credit + fork pivot statement)
- cc-replacement logic in `bin/install.js` (detect, uninstall, verify, clean remnants)
- CLAUDE.md delimiter management (`<!-- GSD-PE:START -->` / `<!-- GSD-PE:END -->`)
- `bin/install.js` output refactor: silent steps, single final pass/fail line, next-step hint
- Auto-validation integration (validate-install.js called programmatically)
- Auto-update hook: new hook file + session-start registration + throttle cache

**Out of scope:**
- Structural refactor of install.js internals (function extraction) — source: `.planning/capabilities/install-and-deploy/BRIEF.md` Scope Out
- Actually publishing to npm (manual author action) — source: `features/package-identity/FEATURE.md` EU-01 Out of Scope
- Verbose/debug mode for install — source: `features/install-feedback/FEATURE.md` EU-01 Out of Scope
- Rollback to previous versions — source: `features/auto-latest/FEATURE.md` EU-01 Out of Scope
- Changelog display after update — source: `features/auto-latest/FEATURE.md` EU-01 Out of Scope
- Handling non-GSD files in `~/.claude` during cleanup — source: `features/cc-replacement/FEATURE.md` EU-01 Out of Scope
- Full README content beyond attribution section — source: `features/package-identity/FEATURE.md` EU-02 Out of Scope
- GitHub Actions for auto-publish — source: `.planning/capabilities/install-and-deploy/BRIEF.md` Follow-ups
- Multi-config or enterprise install scenarios — source: `.planning/capabilities/install-and-deploy/BRIEF.md` Scope Out

**Ambiguous:**
- Whether `validate-install.js` needs to be refactored into a module-exportable form, or whether `install.js` can call it via `child_process.execSync` and capture the exit code — the spec says "callable programmatically" but doesn't specify the mechanism; `execSync` could work without a module rewrite — source: `features/install-feedback/FEATURE.md` TC-01
- Exact `--global` flag handling: `npx get-shit-done-pe` (no flag) vs `npx get-shit-done-pe --global` — BRIEF.md says "npx get-shit-done-pe always installs @latest (default behavior, no explicit --update flag needed)" but the feature spec EU-01 shows `npx get-shit-done-pe --global` as an acceptance criterion; it's unclear whether no-flag invocation should work — source: `features/package-identity/FEATURE.md` EU-01 vs BRIEF.md
- Which session-start hook event type to use for auto-latest — Claude Code's hook system has multiple event types; the spec says "session start trigger" but doesn't name the specific hook event — source: `features/auto-latest/FEATURE.md` TC-01
- Whether the cc upstream uninstall should use `npx get-shit-done-cc@latest --claude --global --uninstall` or `npm uninstall -g get-shit-done-cc` — FN-01 says former, Decisions section says former, but the bug note about cwd may make a direct `npm uninstall -g` more reliable — source: `features/cc-replacement/FEATURE.md` FN-01 vs TC-01 Decisions

---

### Risk: Misalignment

- **Silent install vs. cc-replacement warnings**: install-feedback specifies "no output between banner and final result" but cc-replacement FN-01 specifies "warn user, continue" if upstream uninstall fails. These conflict. The warning must either be suppressed into the final message or the feature specs need to reconcile which takes precedence — source: `features/install-feedback/FEATURE.md` EU-01 vs `features/cc-replacement/FEATURE.md` FN-01
- **Auto-latest scope creep risk**: The BRIEF.md says "simplest approach with greatest chance of success / engineering decisions delegated to implementer" but auto-latest is meaningfully complex (hook system, background process, cache file, npm registry query, timeout handling). The user's intent is "never think about updates again" — the complexity is justified, but the implementer must not over-engineer it — source: `.planning/capabilities/install-and-deploy/BRIEF.md` Target Design vs `features/auto-latest/FEATURE.md` TC-01
- **install-feedback restructuring may touch install logic**: TC-01 says "minimal change to install logic — this is an output/UX concern, not a logic rewrite" but suppressing all console.log calls during steps that currently use them for progress logging is a non-trivial change to 827 lines of flat script — risk that the "not a logic rewrite" constraint is unrealistic without some refactoring — source: `features/install-feedback/FEATURE.md` TC-01 vs BRIEF.md Scope Out ("structural refactor of install.js internals — not worth the risk")
- **cc-replacement order dependency**: The install order stated in Decisions is "upstream uninstall → verify → install pe → merge settings → CLAUDE.md". If install-feedback's silent-mode wraps this entire sequence, error capture must still distinguish *which phase* failed (upstream uninstall vs pe artifact copy vs hook registration). The silent-mode design must track phase names internally to satisfy install-feedback's failure message requirement — source: `features/install-feedback/FEATURE.md` FN-01 vs `features/cc-replacement/FEATURE.md` Decisions
- **Out of scope explicitly excludes npm publish but auto-latest depends on it**: `auto-latest` is specced against a published package (`get-shit-done-pe` on npm registry). If the package is not yet published, auto-latest cannot be tested end-to-end. This is noted but the risk is that implementing auto-latest before publish creates an untestable feature — source: `features/auto-latest/FEATURE.md` Decisions ("Depends on package-identity (must be published to npm as get-shit-done-pe)") vs BRIEF.md Scope Out ("Publishing to npm — that's an action the author takes, not a code change")
