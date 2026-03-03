## Existing System Findings

### Relevant Implementations

- **install.js is a flat 828-line monolith** — `/Users/philliphall/get-shit-done-pe/bin/install.js` (no modules, no imports beyond Node stdlib + `../package.json`). All logic — arg parsing, banner, utility functions, path resolution, settings read/write, hook registration, token replacement, artifact copy, orphan cleanup, uninstall, and validation — lives in a single file with named functions.

- **Banner is hardcoded ASCII at lines 24–34** — `/Users/philliphall/get-shit-done-pe/bin/install.js:24–34`. Text reads `"by TÂCHES"` and `get-shit-done-cc`. Both must change for `package-identity`. The banner is emitted unconditionally at line 64 before any arg parsing completes, which means it prints even on failure paths.

- **package.json identity is entirely upstream (TÂCHES/cc)** — `/Users/philliphall/get-shit-done-pe/package.json:2–31`. Fields `name`, `author`, `description`, `bin` key, `repository.url`, `homepage`, `bugs.url` all reference upstream identity. The `bin` key `"get-shit-done-cc": "bin/install.js"` is what npm registers as the CLI binary name. Changing this to `get-shit-done-pe` is the core of `package-identity`.

- **`install()` function returns a result object for `finishInstall()`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:483–674`. `install()` returns `{ settingsPath, settings, statuslineCommand }`. The `install-feedback` feature must intercept this return path to capture step-level pass/fail before the final output fires.

- **Per-step output is scattered throughout `install()` via `console.log`/`console.error`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:499,594,606`. The `install-feedback` redesign (silent install + single final message) requires suppressing these or replacing the pattern with an internal status accumulator. Affected calls: line 499 (`"Installing for..."`), 594 (`"Installation incomplete!"`), 606 (`"Installation failed! Unresolved tokens"`).

- **`finishInstall()` emits the terminal success message** — `/Users/philliphall/get-shit-done-pe/bin/install.js:679–695`. Currently outputs `"Done! Open a blank directory in Claude Code and run /gsd:new."` and a Discord link. Both need replacing per `install-feedback` (success line + `/gsd:init` hint) and `package-identity` (strip Discord/cc refs).

- **Hook registration in `install()` adds hooks to `PostToolUse` and `SessionStart` but never registers a SessionStart hook for GSD** — `/Users/philliphall/get-shit-done-pe/bin/install.js:626–673`. Currently wires `gsd-context-monitor` and `gsd-askuserquestion-guard` into `PostToolUse`, and initializes `SessionStart` array (line 630) but pushes nothing to it. The `auto-latest` feature's update hook will be the first real `SessionStart` registration.

- **`cleanupOrphanedHooks()` filters by hook command string patterns** — `/Users/philliphall/get-shit-done-pe/bin/install.js:214–261`. Pattern-matches `entry.hooks[].command` strings. This is the exact pattern that `cc-replacement` needs for removing cc's hook registrations from `settings.json`. The function is reusable with different patterns.

- **`uninstall()` knows the exact GSD file boundaries** — `/Users/philliphall/get-shit-done-pe/bin/install.js:268–431`. Removes: `commands/gsd/`, `get-shit-done/`, `agents/gsd-*.md`, named hooks, `package.json` if it matches `{"type":"commonjs"}`. Never touches `.planning/` or non-`gsd-` files. This defines what `cc-replacement` FN-02 must scan for as remnants.

- **`validate-install.js` is a standalone script, not a module** — `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js`. Top-level imperative code: runs checks, prints results, calls `process.exit(0|1)`. Has no exports. `install-feedback` FN-02 requires it to be callable programmatically — it currently cannot be `require()`'d without executing all side effects and exiting the process.

- **Three hooks in source, two checked by validate-install.js** — `/Users/philliphall/get-shit-done-pe/hooks/` has `gsd-askuserquestion-guard.js`, `gsd-context-monitor.js`, `gsd-statusline.js`. But `validate-install.js:178–186` only checks for `gsd-context-monitor.js` and `gsd-statusline.js` in the expected hooks list — `gsd-askuserquestion-guard.js` is not validated. This is an existing gap (not a blocker, but the guard hook was recently added and validation wasn't updated).

- **The installed `~/.claude/settings.json` has a stale `gsd-check-update.js` SessionStart hook** — `/Users/philliphall/.claude/settings.json` (live install). `SessionStart` references `node "/Users/philliphall/.claude/hooks/gsd-check-update.js"` — a file that exists in the installed hooks dir but is not in the repo source. The `cc-replacement` orphan cleanup must handle this registration. `install.js`'s `uninstall()` only strips hooks matching `gsd-statusline` (lines 368–385), which would miss this stale entry.

- **`gsd-check-update.js` in the live install uses a `VERSION` file pattern** — `/Users/philliphall/.claude/hooks/gsd-check-update.js:16–41`. Reads `~/.claude/get-shit-done/VERSION` to determine installed version; queries `npm view get-shit-done-cc version`. The `auto-latest` feature replaces this with a different mechanism (package.json version + `get-shit-done-pe` npm query), but the existing file's logic (background spawn, cache file, 24h throttle) is a direct reference model.

- **`hooks/dist/` is the npm-published hook artifact** — `/Users/philliphall/get-shit-done-pe/package.json:13` (`"files": ["bin","commands","get-shit-done","agents","hooks/dist","scripts"]`). The `prepublishOnly` script runs `build:hooks` which compiles source hooks to `hooks/dist/`. But `install.js` copies from `hooks/` (source), not `hooks/dist/`. This discrepancy means the source hooks are not published to npm — users who install via npm get the pre-built dist files, but `install.js` reads from source paths.

- **`readSettings()` and `writeSettings()` are clean utility functions** — `/Users/philliphall/get-shit-done-pe/bin/install.js:107–123`. Parse-on-read with empty-object fallback, formatted JSON write. These are directly reusable for the settings.json additive-merge pattern required by `cc-replacement` TC-01.

- **`getGlobalDir()` and `buildHookCommand()` handle path normalization** — `/Users/philliphall/get-shit-done-pe/bin/install.js:86–102`. Respects `CLAUDE_CONFIG_DIR` env var and `--config-dir` flag; normalizes backslashes for cross-platform hook commands. Any new hook registration (auto-latest) must go through `buildHookCommand()` to maintain cross-platform correctness.

---

### Constraints

- **`validate-install.js` exits the process at top level** — `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:358–368`. Cannot be `require()`'d without wrapping in a child process. `install-feedback` FN-02 ("run validation programmatically") requires either wrapping it in `execSync` or refactoring it to export a function. Refactoring is the cleaner path but TC-01 says "minimal change to install logic."

- **Banner is printed before args parse at line 64** — `/Users/philliphall/get-shit-done-pe/bin/install.js:64`. The `install-feedback` requirement ("banner always, then result") fits this existing structure — banner fires first, then all steps run silently, then final result. No restructuring of the banner position is needed, but removing per-step `console.log` calls inside `install()` will require touching ~8 call sites.

- **`uninstall()` only removes `gsd-statusline` hook registrations from settings.json** — `/Users/philliphall/get-shit-done-pe/bin/install.js:368–409`. Does not strip `gsd-context-monitor` or `gsd-askuserquestion-guard` from `PostToolUse`, and does not strip `gsd-check-update` from `SessionStart`. The `cc-replacement` cleanup needs broader hook removal logic than what `uninstall()` currently implements.

- **`package.json files` array publishes `hooks/dist/`, not `hooks/`** — `/Users/philliphall/get-shit-done-pe/package.json:8–15`. Adding the auto-latest update hook (`gsd-auto-update.js`) means it must be compiled by `build-hooks.js` to be included in the npm package. The build step must be updated.

- **`install.js` copies hooks by explicit filename list** — `/Users/philliphall/get-shit-done-pe/bin/install.js:567`. `const hookFiles = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js']`. Adding the auto-latest hook requires adding its filename to this array.

- **Node.js stdlib only, zero runtime deps** — `/Users/philliphall/get-shit-done-pe/.planning/PROJECT.md:81`. `install.js` uses only `fs`, `path`, `os`, `readline`. The `auto-latest` feature's npm registry query must use Node's built-in `https` module or `child_process.execSync('npm view ...')` — no `node-fetch` or similar.

---

### Reuse Opportunities

- **`readSettings()` / `writeSettings()`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:107–123`. Directly reusable for `cc-replacement` settings.json additive merge and for writing auto-latest's cache file pattern.

- **`cleanupOrphanedHooks()` pattern** — `/Users/philliphall/get-shit-done-pe/bin/install.js:214–261`. The `orphanedHookPatterns` array + filter-by-command-string approach is exactly the right pattern for `cc-replacement` FN-01 post-uninstall hook cleanup. Extend with `gsd-check-update` and any other cc hook names.

- **`buildHookCommand()`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:99–102`. Must be used verbatim for auto-latest's hook registration to get correct cross-platform path format.

- **`gsd-check-update.js` logic** — `/Users/philliphall/.claude/hooks/gsd-check-update.js` (live installed copy). The background `spawn` + `child.unref()` pattern, cache file structure, and `npm view` query are the right model for `auto-latest`'s new hook. The new hook replaces the VERSION file lookup with `package.json` version lookup and changes the package name from `get-shit-done-cc` to `get-shit-done-pe`.

- **`uninstall()` safe-removal boundaries** — `/Users/philliphall/get-shit-done-pe/bin/install.js:268–431`. The set of directories and patterns considered safe to remove (`commands/gsd/`, `get-shit-done/`, `agents/gsd-*.md`, named hooks) directly maps to `cc-replacement` FN-02's remnant verification list. Reuse the same boundary definitions.

- **`validateNoUnresolvedTokens()`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:459–477`. Inline scan function that returns failure list without printing. Already decoupled from output — directly reusable in a silent install step accumulator.

---

### Integration Points

- **`install()` return value** — `/Users/philliphall/get-shit-done-pe/bin/install.js:673`. Currently returns `{ settingsPath, settings, statuslineCommand }`. `cc-replacement` adds a pre-install phase before `install()` is called; `install-feedback` needs each step inside `install()` to contribute to an internal pass/fail accumulator rather than printing directly.

- **`finishInstall()` + `handleStatusline()`** — `/Users/philliphall/get-shit-done-pe/bin/install.js:679–746`. These are the final output and settings-write point. `install-feedback` replaces `finishInstall()`'s success message; `auto-latest` adds its hook registration to the settings write here (alongside statusline).

- **`settings.hooks.SessionStart` array** — `/Users/philliphall/.claude/settings.json` (live state). The `auto-latest` hook registers here. `install.js` already initializes this array (line 630) but pushes nothing — the auto-latest registration is a push to this array following the existing `PostToolUse` push pattern.

- **`hooks/dist/` build pipeline** — `/Users/philliphall/get-shit-done-pe/package.json:41–46` (`prepublishOnly: npm run build:hooks`). `scripts/build-hooks.js` was deleted (not in the repo). Any new hook file must be handled by whatever build process exists or by shipping source directly. This integration point needs investigation before `auto-latest` can be published.

---

### Undocumented Assumptions

- **The live `~/.claude` install is stale relative to the repo** — confirmed by `settings.json` containing `gsd-check-update.js` (deleted hook) in `SessionStart` and no `gsd-askuserquestion-guard.js` in `PostToolUse`. The pending `node bin/install.js --global` (noted in STATE.md) has not been run. Any testing against the live install reflects outdated state.

- **`install.js` assumes `hooks/` source files exist uncompiled** — `/Users/philliphall/get-shit-done-pe/bin/install.js:563–579`. Copies `.js` files directly from `hooks/` to `~/.claude/hooks/`. But `package.json` only publishes `hooks/dist/` — so when installed via `npm install -g`, the `hooks/` source dir is absent. The copy would find no files. This may be why `scripts/build-hooks.js` existed: to copy compiled hooks into the package. Its deletion creates a latent publish-time break.

- **CLAUDE.md at `~/.claude/CLAUDE.md` is not currently managed by install.js** — `/Users/philliphall/get-shit-done-pe/bin/install.js` (full file). No CLAUDE.md read/write logic exists anywhere in install.js. `cc-replacement` FN-03 (delimiter management) is entirely new code with no existing foundation to extend.

- **The `--global` flag is the only supported install path in practice** — `/Users/philliphall/get-shit-done-pe/.planning/CAPABILITY.md:architecture-spine`. Local install (`--local`) exists in the code but the BRIEF.md and all feature specs only describe global install scenarios. Local install mode may not handle the `auto-latest` hook or `cc-replacement` correctly.

- **`validate-install.js` does not check for `gsd-askuserquestion-guard.js`** — `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:178–186`. Only `gsd-context-monitor.js` and `gsd-statusline.js` are in `expectedHooks`. The guard hook (added in the AskUserQuestion fix) was never added to the validation check list. A "silent install + auto-validate" model (`install-feedback`) would inherit this gap without a fix.

- **`install()` initializes `SessionStart` array but registers nothing** — `/Users/philliphall/get-shit-done-pe/bin/install.js:630–631`. The array is created, written to `settings.json`, then left empty. On second install the idempotency check (`hasContextMonitorHook`, `hasAskGuardHook`) works for `PostToolUse` but there is no equivalent idempotency guard for `SessionStart`. Auto-latest must add one.
