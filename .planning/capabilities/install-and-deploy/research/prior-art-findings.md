## Prior Art Findings

**Capability:** install-and-deploy
**Dimension:** Prior Art
**Focus:** Auto-update patterns, fork publishing, clean replacement/migration, install feedback UX

---

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| update-notifier (notify-only) | Background check, deferred notification message on next TTY run | Proven (~30M weekly downloads) | LOW — ESM-only since v6, breaks CJS requirement | [GitHub](https://github.com/sindresorhus/update-notifier) |
| Baked-in background spawn (DIY) | `spawn({detached:true})` + `child.unref()` to fire npm view in background; cache to JSON file; 24h throttle | Proven (used in live gsd-check-update.js) | HIGH — already validated in this codebase, zero deps, CJS native | [/Users/philliphall/.claude/hooks/gsd-check-update.js:25–62] |
| cli-autoupdate (event-based) | Wraps update-notifier, emits `update`/`finish` events, runs `npm install -g` silently in background | Emerging (low adoption, last publish >1yr) | LOW — depends on update-notifier (ESM-only), adds runtime dep, not maintained | [npm](https://www.npmjs.com/package/cli-autoupdate) |
| simple-update-notifier | Lightweight CJS-compatible alternative to update-notifier; notify-only (no auto-install) | Emerging (~0 weekly downloads per registry) | LOW — notify-only, not auto-install; effectively unmaintained | [GitHub](https://github.com/alexbrazier/simple-update-notifier) |
| npx @latest invocation pattern | Instruct users to always run `npx get-shit-done-pe@latest` — npx fetches fresh copy each time when `@latest` tag is explicit | Proven (create-react-app model) | MEDIUM — correct for initial install, but does NOT solve the auto-update-on-session-start requirement | [npm docs](https://docs.npmjs.com/cli/v11/commands/npx/) |
| postinstall script output | Fire a postinstall script in package.json to display feedback on `npm install -g` | Proven pattern, known failure mode | LOW — npm 7+ suppresses postinstall output by default; users see nothing | [npm/cli#3347](https://github.com/npm/cli/issues/3347) |
| Delimiter-managed config section | Wrap tool-owned content in start/end HTML comments; install adds block, uninstall surgically strips it | Proven (git-managed config, SSH config tools, Homebrew formula pattern) | HIGH — clean, reversible, no full-file overwrite; exactly what cc-replacement FN-03 requires | [First principles: same pattern used by Homebrew, mise, direnv for shell config injection] |
| Fork publish: rename package.json fields | Update `name`, `bin`, `author`, `repository` in package.json; publish to npm under new name; deprecate old if needed | Proven (standard npm fork pattern) | HIGH — minimal change, well-documented, exact match for package-identity feature | [npm docs: forking](https://uynguyen.github.io/2022/03/26/Fork-and-publish-your-custom-lib-to-npm/) |

---

### Recommended Starting Point

**Baked-in background spawn (DIY)** for auto-latest: The live `gsd-check-update.js` at `/Users/philliphall/.claude/hooks/gsd-check-update.js` already implements the complete pattern — `spawn({detached:true, stdio:'ignore'})` + `child.unref()` for non-blocking execution, `execSync('npm view <pkg> version')` for registry query, JSON cache file for 24h throttle. The new `gsd-auto-update.js` hook is a targeted adaptation: swap `VERSION` file lookup for `package.json` version read, change package name from `get-shit-done-cc` to `get-shit-done-pe`, move cache file to `~/.claude/get-shit-done/.update-check`. No library needed. All code paths are CJS-native and zero-dep. This is the lowest-risk, highest-confidence path because it reuses an already-working implementation from the same codebase.

**Standard package.json field update** for package-identity: No prior art research needed — this is a static file edit. The canonical npm fork pattern (update `name`, `bin`, `author`, `repository`, `homepage`, `bugs.url`) is well-established. The only constraint is ensuring the `bin` key name matches the desired CLI binary (`get-shit-done-pe`), which is a direct 1-for-1 swap.

---

### Anti-Patterns

- **update-notifier (v6+):** ESM-only since version 6.0.0 — `require()` throws `ERR_REQUIRE_ESM`. This project is CJS (`"type": "commonjs"` in package.json). The breakage is documented and has caused cascading issues across major projects (nodemon, yeoman). Do not use. — [nodemon/issues/2031](https://github.com/remy/nodemon/issues/2031)

- **postinstall for install feedback:** npm 7+ runs lifecycle scripts as background processes and suppresses stdout by default. Users see nothing unless they pass `--foreground-scripts`. This makes postinstall useless for any UX-bearing output. The `bin` field + `npx` invocation is the correct delivery mechanism for user-facing output. — [npm/cli#3347](https://github.com/npm/cli/issues/3347)

- **`npx get-shit-done-pe` without `@latest` tag:** npx caches packages and uses the cached version on subsequent runs. Without the `@latest` tag, running `npx get-shit-done-pe` a second time gives the cached version, not the newest one. The auto-latest feature (session-start hook) eliminates this problem entirely by updating in the background — but the install instructions and README must use `npx get-shit-done-pe@latest` for the initial install to avoid users getting a cached older version. — [npm/cli#2329](https://github.com/npm/cli/issues/2329)

- **`npm run upgrade` as the update command:** Several CLI tools expose an explicit `--update` flag. This was considered (see BRIEF.md open questions) and correctly rejected in favor of automatic session-start updates. The "run a command to update" pattern requires users to know the update exists, remember the command, and remember to run it. Silent background update sidesteps all of this.

- **Overwriting CLAUDE.md without delimiters:** Writing GSD content directly into `~/.claude/CLAUDE.md` without markers makes uninstall destructive — there is no safe way to remove only GSD's content without risking user content. The delimiter pattern (`<!-- GSD-PE:START --> / <!-- GSD-PE:END -->`) is the only approach that makes uninstall safe and idempotent. Not using delimiters is an anti-pattern confirmed by Homebrew, mise, and direnv — all of which learned this lesson and retroactively added section markers. — [First principles: any tool that writes to a user-owned config file without delimiting its section cannot safely uninstall]

- **cli-autoupdate as a runtime dependency:** Adds a dep that depends on ESM-only update-notifier, has near-zero weekly downloads, and was last published >1 year ago. Brings in a dependency chain that contradicts the project's zero-runtime-dep constraint and has no advantage over the DIY spawn pattern already proven in the codebase. — [npm](https://www.npmjs.com/package/cli-autoupdate)

---

### Libraries / Tools

- **update-notifier**: Notify-only update checker; background unref'd child process; configurable interval; `.notify()` displays boxed message. ESM-only since v6.0.0 — INCOMPATIBLE with CJS. Do not add as dependency. — [GitHub](https://github.com/sindresorhus/update-notifier)

- **Node.js `child_process.spawn` (stdlib)**: `spawn(process.execPath, ['-e', code], {detached:true, stdio:'ignore', windowsHide:true})` + `child.unref()` — the correct mechanism for fire-and-forget background Node processes. Already used in live `gsd-check-update.js`. No install needed. — [Node.js docs](https://nodejs.org/api/child_process.html)

- **Node.js `https` module (stdlib)**: Alternative to `execSync('npm view ...')` for npm registry queries. `https.get('https://registry.npmjs.org/get-shit-done-pe/latest', ...)` with Accept header `application/vnd.npm.install-v1+json` returns abbreviated metadata. Avoids spawning a shell, but is async and adds complexity vs. the simpler `execSync('npm view ...')` pattern. Given the background-process isolation already in place, `execSync` inside the child is simpler and sufficient. — [First principles: execSync inside a detached child process is blocking-safe since the child is isolated]

---

### Canonical Patterns

- **Background spawn + unref for non-blocking check:** `spawn` with `{detached:true, stdio:'ignore'}` + `child.unref()` allows the parent process (session-start hook) to exit immediately while the child continues running. This is the canonical Node.js pattern for fire-and-forget background work. The existing `gsd-check-update.js` uses it correctly. — [Node.js docs](https://nodejs.org/api/child_process.html), [/Users/philliphall/.claude/hooks/gsd-check-update.js:25–62]

- **JSON cache file for throttle state:** Store `{lastCheck: ISO-timestamp, currentVersion: "x.y.z"}` in a well-known location (`~/.claude/get-shit-done/.update-check`). Read on every hook invocation; skip npm call if `Date.now() - lastCheck < 24h`. Write after successful check. This is the same pattern used by update-notifier, simple-update-notifier, and the live `gsd-check-update.js`. Canonical for all throttled background checks. — [update-notifier README](https://github.com/sindresorhus/update-notifier), [/Users/philliphall/.claude/hooks/gsd-check-update.js:47–55]

- **npx as the install delivery mechanism (not postinstall):** Tools that need user-visible output on install use the `bin` field to expose a CLI entry point, then tell users to run `npx package@latest` rather than relying on postinstall. This bypasses npm 7+'s output suppression. create-react-app (`npx create-react-app`), Claude Code itself (`npx @anthropic-ai/claude-code`), and the existing `get-shit-done-cc` all use this pattern. — [npm Blog: Introducing npx](https://blog.npmjs.org/post/162869356040/introducing-npx-an-npm-package-runner)

- **Delimiter-managed config injection:** Write a start marker, content, and end marker into a shared config file. On reinstall, replace the content between markers. On uninstall, strip the marked block. Fallback if no markers: warn and skip (never corrupt user content). Used by: Homebrew shell completions, mise shell integration, direnv hook injection, GitHub Copilot CLAUDE.md injection. — [First principles: universally adopted by any CLI tool that injects into user shell/config files]

- **Fork publish pattern:** Clone upstream repo → update `package.json` (`name`, `author`, `bin`, `repository`, `homepage`, `bugs`) → update CLI binary name in `bin` key → publish to npm as new package. The upstream package remains independent. No npm-level linking or deprecation required unless the intent is to redirect existing users (not needed here — only one current user). — [npm fork guide](https://uynguyen.github.io/2022/03/26/Fork-and-publish-your-custom-lib-to-npm/)

- **Silent install + single result line:** Banner → all steps silent → final pass/fail line. This is the UX model used by Rust's `rustup`, Homebrew's install scripts, and most modern CLI installers. It contrasts with the older pattern (per-step progress output) by assuming the happy path succeeds silently and only surfaces detail on failure. The existing install.js banner-before-args structure already supports this — only the per-step `console.log` calls inside `install()` need removal. — [First principles: users need to know if it worked, not watch it happen; noise reduction for happy path, precision for failure]
