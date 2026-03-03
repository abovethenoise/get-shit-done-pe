# Research Synthesis

**Synthesized:** 2026-03-03
**Subject:** capability: install-and-deploy — Transform get-shit-done-pe into a publishable npm package with clean install, automatic updates, cc-replacement, and clear user feedback. 4 features: package-identity, cc-replacement, install-feedback, auto-latest.
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### npx Does NOT Guarantee @latest Without Explicit Tag

`npx get-shit-done-pe` reuses cached packages after first use. Only `npx get-shit-done-pe@latest` forces a registry fetch. The BRIEF.md claim that "npx get-shit-done-pe = always gets newest version" is architecturally incorrect. Install instructions must use `@latest` explicitly. The auto-update hook should use `npm install -g get-shit-done-pe@latest` (not npx) for reliability.

[Sources: Domain Truth, Tech Constraints, Prior Art, Edge Cases — all cite npm/cli issues #2329, #4108, #6179]

### hooks/dist Build Pipeline Is Broken — Ship Source Hooks Directly

`scripts/build-hooks.js` does not exist in the repo. `prepublishOnly: npm run build:hooks` will fail on `npm publish`. Meanwhile, `package.json` `files` includes `hooks/dist` (not `hooks/`), but `install.js` reads from `hooks/` (source). When published, hooks would silently not deploy. The hooks are plain CommonJS -- no bundling needed. Resolution: change `files` from `"hooks/dist"` to `"hooks"`, remove the dead build step.

[Sources: Tech Constraints, Existing System, Edge Cases — all independently discovered the same broken pipeline]

### validate-install.js Cannot Be require()'d — Needs Wrapping

The script calls `process.exit()` at top level, which terminates any parent process that `require()`s it. Two viable alternatives: (a) `execSync('node scripts/validate-install.js', {stdio: 'pipe'})` to capture output in a child process, or (b) refactor to export a function with `if (require.main === module)` guard. Both are feasible; (b) is cleaner long-term.

[Sources: Domain Truth, Existing System, Tech Constraints, Edge Cases]

### Background Spawn + unref() Is the Correct Auto-Update Pattern

`spawn(process.execPath, [...], {detached: true, stdio: 'ignore'})` + `child.unref()` is the canonical Node.js fire-and-forget pattern. Already proven in the live `gsd-check-update.js`. Zero deps, CJS-native, non-blocking. All external libraries (update-notifier, cli-autoupdate) are ruled out: ESM-only, unmaintained, or add unnecessary deps.

[Sources: Prior Art, Tech Constraints, Domain Truth, Existing System]

### Delimiter-Managed CLAUDE.md Is the Only Safe Pattern

`<!-- GSD-PE:START -->` / `<!-- GSD-PE:END -->` delimiters enable safe install/uninstall of GSD content without corrupting user content. This pattern is proven by Homebrew, mise, direnv. Writing without delimiters is an anti-pattern -- uninstall becomes destructive. Note: CLAUDE.md management is entirely new code; no existing foundation in install.js.

[Sources: Prior Art, Domain Truth, Edge Cases, Existing System]

### settings.json Must Be Read-Modify-Write, Never Overwrite

`~/.claude/settings.json` is shared global state. Other tools and user config live there. Overwriting discards MCP servers, permissions, etc. Current `readSettings()` / `writeSettings()` utilities already implement this correctly. However, `readSettings` silently returns `{}` on JSON parse failure, which would discard all existing settings.

[Sources: Domain Truth, Existing System, Edge Cases]

### gsd-check-update.js Is Stale and Must Be Cleaned Up

The live `~/.claude/settings.json` has a `SessionStart` hook pointing to `gsd-check-update.js`, a file not in the repo source. `cleanupOrphanedHooks()` does not include this pattern. It will survive re-installs indefinitely unless added to the orphan patterns list.

[Sources: Existing System, Tech Constraints, Edge Cases]

### cc Uninstall Should Use npm uninstall -g, Not Upstream npx

The upstream cc uninstaller has a known bug: misdetects global vs local when run from `$HOME`. Running `npx get-shit-done-cc@latest --uninstall` is unreliable. The safer path is `npm uninstall -g get-shit-done-cc` directly, followed by pe's own remnant scan for leftover files.

[Sources: Domain Truth, Tech Constraints, Edge Cases, User Intent]

### bin Key and name Field Are Independent — Both Must Change

`package.json` `name` controls npm registry identity; `bin` key controls the shell command name. Currently both say `get-shit-done-cc`. Both must be updated to `get-shit-done-pe` for the package-identity feature.

[Sources: Domain Truth, Existing System, Tech Constraints]

### Zero Runtime Dependencies Is a Hard Constraint

All new code (registry queries, background processes, file operations) must use Node.js stdlib only (`fs`, `path`, `os`, `https`, `child_process`). No node-fetch, axios, semver, or update-notifier.

[Sources: Domain Truth, Tech Constraints, Prior Art, Existing System]

### SessionStart Hooks Need Idempotency Guards

`install.js` initializes the `SessionStart` array but pushes nothing to it. There is no idempotency check for SessionStart (unlike PostToolUse which has `hasContextMonitorHook`). The auto-latest hook registration must add a `.some()` guard to prevent duplicate entries on re-install.

[Sources: Existing System, Tech Constraints, Edge Cases]

### validate-install.js Missing gsd-askuserquestion-guard.js Check

The expected hooks list only includes `gsd-context-monitor.js` and `gsd-statusline.js`. The guard hook (added in the AskUserQuestion fix) is not validated. This gap would propagate into the install-feedback feature's integrated validation.

[Sources: Existing System, Tech Constraints, Edge Cases]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Silent Install vs. cc-Replacement Warnings

**User Intent says:** install-feedback requires "no output between banner and final result" (FN-03).
**Edge Cases says:** cc-replacement FN-01 specifies "warn user, continue" if upstream uninstall fails, which produces intermediate output.

**Resolution:** Both can coexist. The "warning" from cc-replacement should be accumulated into an internal status tracker and surfaced in the final result line (e.g., "Installed successfully (cc uninstall failed -- manual cleanup may be needed)"). The silent-mode constraint applies to stdout during execution; warnings fold into the final message. User Intent identifies this exact tension as a "Risk: Misalignment" item.

### How to Invoke validate-install.js Programmatically

**Tech Constraints says:** `execSync` with `{stdio: 'pipe'}` is viable and consistent with existing patterns in the same file.
**Domain Truth says:** The script must be "callable programmatically -- returning a structured result rather than printing to stdout."
**Edge Cases says:** Refactor to export a function is the clean path.

**Resolution:** Refactor validate-install.js to export a function with `if (require.main === module)` guard. This satisfies all three positions: it can still be run standalone, it returns structured results, and it avoids the overhead/fragility of `execSync` child process spawning. The BRIEF.md says "structural refactor of install.js internals" is out of scope, but validate-install.js is a separate file -- refactoring it is not the same as restructuring install.js.

### Auto-Update: npm registry HTTP vs. npm view execSync

**Tech Constraints says:** `https.get()` to `registry.npmjs.org` with `?fields=dist-tags` is lighter (no subprocess spawn).
**Prior Art says:** `execSync('npm view ...')` inside the detached child is simpler and sufficient since the child is already isolated.
**Domain Truth says:** The lightweight JSON API is "the correct implementation pattern."

**Resolution:** Either works. The `https.get()` approach is preferred because: (a) it avoids spawning another subprocess inside an already-background process, (b) the response is ~100 bytes vs npm view's full CLI bootstrap, (c) it has a deterministic timeout via `req.setTimeout()`. The existing `gsd-check-update.js` uses `execSync` but that's a convenience, not a constraint. Engineering decision for the implementer.

### Claude Code async: true Hook vs. DIY Background Spawn

**Tech Constraints says:** Claude Code 2.1+ supports `async: true` on hooks, which runs them in background without blocking session start.
**Prior Art / Existing System say:** The proven pattern is `spawn({detached:true})` + `child.unref()` inside a synchronous hook.

**Resolution:** Use `async: true` on the SessionStart hook registration if available. This is the platform-native solution and eliminates the need for the hook script itself to manage background process spawning. The hook script can then be simpler (synchronous version check + conditional `npm install -g`). If `async: true` is not available in the target Claude Code version, fall back to the spawn/unref pattern. Implementer should verify Claude Code version requirements.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **`async: true` hook support** -- Only Tech Constraints mentions this Claude Code 2.1+ feature. No other gatherer validated it. If the target Claude Code version predates 2.1, this option is unavailable. [Source: Tech Constraints only]

- **pnpm/yarn global install detection** -- Edge Cases notes that `npm list -g` won't find packages installed via pnpm or yarn. Single-source finding; low practical risk given the user base (author only, uses npm). [Source: Edge Cases only]

- **settings.json concurrent write race** -- Edge Cases cites Claude Code GitHub issues (#28847, #29217) about concurrent writes. Fix reportedly shipped in Claude Code v2.1.61 for CC's own writes, but third-party installers (like install.js) are not covered. Practical mitigation: warn user to close CC sessions before installing. [Source: Edge Cases only]

- **copyWithPathReplacement deletes destDir before copying** -- Edge Cases flags this as a crash-safety risk (partial wipe with no rollback). Single-source, rare failure mode, but severity is high. [Source: Edge Cases only]

### Unanswered Questions

- Should `--global` be the default behavior (no flag needed) or remain explicit? BRIEF.md implies no flag; feature specs show `--global` explicitly. The current install.js defaults to interactive mode without `--global`.
- What happens to the `--local` install path? All specs describe global-only scenarios. Local mode may not handle auto-latest or cc-replacement correctly.
- What is the exact `async: true` behavior on hook timeout? Tech Constraints cites it but doesn't specify timeout behavior for async hooks.

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Zero runtime dependencies -- Node.js stdlib only | Domain Truth, Tech Constraints, Prior Art | Adding any dep breaks project constraint; use `fs`, `path`, `os`, `https`, `child_process` only |
| `package.json` `files` array must include `hooks/` (not `hooks/dist`) | Tech Constraints, Existing System, Edge Cases | Published package will have no hooks if `hooks/dist` is listed but doesn't exist |
| `scripts/build-hooks.js` does not exist -- `prepublishOnly` will fail | Tech Constraints, Edge Cases | `npm publish` is blocked until build step is fixed or removed |
| `validate-install.js` calls `process.exit()` -- cannot be `require()`'d | Tech Constraints, Existing System, Edge Cases | Parent process dies if imported directly |
| `bin` key in package.json defines CLI command name (independent of `name`) | Domain Truth, Tech Constraints | Wrong bin key = wrong binary name registered by npm |
| SessionStart hooks block session start if synchronous and slow | Domain Truth, Tech Constraints | Registry check must be non-blocking (async hook or background spawn) |
| `readSettings()` returns `{}` on parse failure, silently discarding all user settings | Edge Cases, Existing System | Corrupted settings.json causes silent loss of MCP servers, permissions, other hooks |
| `cleanupOrphanedHooks()` does not include `gsd-check-update` pattern | Existing System, Tech Constraints, Edge Cases | Stale hook survives every re-install |
| Idempotency = f(f(x)) == f(x); must overwrite, not append | Domain Truth | Duplicate hooks, stale files if only "don't error on re-run" |
| Node.js >= 16.7.0 engine requirement | Tech Constraints | All stdlib APIs used are covered by this floor |
| `npm list -g` returns exit code 1 for absent packages | Edge Cases | `execSync` throws -- must try/catch |
| Hook files are plain CommonJS -- no transpilation needed | Tech Constraints, Prior Art | esbuild build step is unnecessary overhead |

## Recommended Scope

Actionable guidance for the planner: what to build, what to skip, what needs more investigation.

### Build (In Scope)

- **package-identity**: Static edits to `package.json` (name, author, bin key, description, repository, homepage, bugs) and install.js banner text. Lowest risk, zero logic changes, prerequisite for everything else. [Sources: Domain Truth, Existing System, Prior Art]
- **Fix hooks publish path**: Change `package.json` `files` from `"hooks/dist"` to `"hooks"`. Remove or update `prepublishOnly` script. Must happen before any npm publish. [Sources: Tech Constraints, Existing System, Edge Cases]
- **cc-replacement**: Detect cc via `npm list -g --json` (try/catch), uninstall via `npm uninstall -g get-shit-done-cc`, remnant scan of `~/.claude/`, CLAUDE.md delimiter management, extend `cleanupOrphanedHooks()` with `gsd-check-update` pattern. [Sources: Domain Truth, Existing System, Edge Cases, Tech Constraints]
- **install-feedback**: Replace ~8 `console.log` calls in `install()` with internal accumulator. Banner first, silent steps, single final pass/fail line. Refactor `validate-install.js` to export a function. Add `gsd-askuserquestion-guard.js` to validation expected hooks. [Sources: User Intent, Existing System, Domain Truth, Edge Cases]
- **auto-latest**: New `gsd-auto-update.js` hook registered on `SessionStart`. Version check via `https.get()` to npm registry API with 5s timeout. 24h throttle via JSON cache file at `~/.claude/get-shit-done/.update-check`. Background `npm install -g get-shit-done-pe@latest` on version mismatch. Idempotency guard for SessionStart registration. [Sources: Prior Art, Tech Constraints, Domain Truth, Existing System]
- **README attribution section**: Credit upstream GSD/TACHES, state the product-management pivot. [Sources: User Intent]

### Skip (Out of Scope)

- **Structural refactor of install.js** -- BRIEF.md explicitly excludes this. Output changes (install-feedback) touch ~8 console.log call sites but do not restructure the file. [Source: BRIEF.md Scope Out]
- **npm publish action** -- Author takes this action manually after code changes are complete. [Source: BRIEF.md Scope Out]
- **Verbose/debug mode** -- Not requested, adds complexity. [Source: User Intent]
- **Rollback to previous versions** -- Out of scope per auto-latest feature spec. [Source: User Intent]
- **GitHub Actions for auto-publish** -- Follow-up item, not current scope. [Source: BRIEF.md Follow-ups]
- **update-notifier, cli-autoupdate, or any external update library** -- ESM-only, unmaintained, or adds deps. DIY spawn pattern is proven. [Source: Prior Art]
- **Restoring `scripts/build-hooks.js`** -- Hooks are plain JS, build step is unnecessary (YAGNI). [Source: Tech Constraints, Prior Art]

### Investigate Further

- **`async: true` hook support in target Claude Code version** -- If available, simplifies auto-latest hook significantly. Verify CC version before deciding between async hook vs. manual spawn/unref. [Source: Tech Constraints -- single-source finding]
- **`--global` default behavior** -- Should bare `npx get-shit-done-pe@latest` (no `--global` flag) default to global install? Current code requires the flag. BRIEF.md implies no flag needed. Resolve before planning install-feedback. [Source: User Intent -- ambiguous scope item]
- **`readSettings()` silent failure on corrupted JSON** -- Currently returns `{}`, discarding all user config. Should it abort with a human-readable error instead? Low likelihood but catastrophic impact. [Source: Edge Cases, Existing System]
- **`copyWithPathReplacement` atomic safety** -- Currently deletes destDir before copying. A crash mid-copy leaves `~/.claude/` partially wiped. Consider copy-to-temp + rename pattern. Low likelihood, high severity. [Source: Edge Cases -- single-source finding]
