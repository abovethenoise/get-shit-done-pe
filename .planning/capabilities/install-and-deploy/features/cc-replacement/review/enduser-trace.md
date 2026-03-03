# End-User Trace: cc-replacement

Reviewer: end-user proxy
Date: 2026-03-03
Scope: EU-01 (5 acceptance criteria)

## Phase 1: Requirements

### EU-01: Installing pe completely replaces cc

**Story:** As a user who previously installed get-shit-done-cc, I want installing get-shit-done-pe to completely replace it, so that I don't have conflicting GSD installations.

**Acceptance Criteria:**
1. After pe install, no `get-shit-done-cc` global binary exists
2. No orphaned cc-specific files remain in ~/.claude (commands, agents, hooks, workflows)
3. settings.json hook registrations are pe's, not duplicated with cc's
4. CLAUDE.md content managed by pe uses delimiters for clean future removal
5. .planning/ directory is never touched during replacement

---

## Phase 2: Trace Against Code

### EU-01 AC-1: No get-shit-done-cc global binary after pe install

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:279-283` -- Detection via `execSync('npm list -g get-shit-done-cc --depth=0', { stdio: 'pipe' })`; sets `ccInstalled = true` on success, `false` on error (exit 1 = not installed).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:287-293` -- Removal via `execSync('npm uninstall -g get-shit-done-cc', { stdio: 'pipe' })` when detected. Failure is caught and pushed to `ccWarnings` (best-effort, per spec).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:636` -- `replaceCc(targetDir)` is called at the top of `install()`, before any artifact copy.
- Reasoning: The code detects the cc global package, attempts removal, and continues regardless. This satisfies the acceptance criterion. The summary notes the deviation from FEATURE.md's `npx get-shit-done-cc@latest --claude --global --uninstall` approach to using `npm uninstall -g` directly, which was a deliberate research-driven decision documented in 01-SUMMARY.md.

### EU-01 AC-2: No orphaned cc-specific files remain in ~/.claude

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:296-304` -- Removes `gsd:*` files from `commands/` directory.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:306-314` -- Removes `gsd-*` files from `agents/` directory (files only, not subdirs).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:316-320` -- Removes `get-shit-done/` directory recursively.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:322-326` -- Removes `hooks/dist/` directory recursively (cc build artifact).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:228` -- `'gsd-check-update'` added to `cleanupOrphanedHooks()` orphanedHookPatterns, removing the cc-era hook from settings.json.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:295` -- Comment: "Remnant file scan -- run unconditionally" -- scan runs even if cc was not detected as globally installed, covering partial/manual installs.
- Reasoning: All four safe-to-remove categories from the spec (`commands/gsd:*`, `agents/gsd-*`, `get-shit-done/`, `hooks/dist/`) are addressed. The scan is unconditional, which is correct per FN-02 behavior. The spec also lists `.claude/hooks/dist/` which is handled at line 322-326.

### EU-01 AC-3: settings.json has pe hooks, not cc duplicates

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:765` -- `cleanupOrphanedHooks(readSettings(settingsPath))` runs before any pe hooks are registered, stripping cc orphans including `gsd-check-update` (line 228).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:788-793` -- Additional explicit cleanup of `gsd-check-update` from SessionStart before adding pe's `gsd-auto-update`.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:796-809` -- pe's `gsd-auto-update` hook added only if not already present (`hasAutoUpdateHook` check).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:816-846` -- pe's PostToolUse hooks (`gsd-context-monitor`, `gsd-askuserquestion-guard`) added with dedup checks.
- Reasoning: The settings merge is additive (reads existing, modifies, writes back). Orphaned cc hooks are filtered out before pe hooks are conditionally added. Idempotent -- running twice does not duplicate entries.

### EU-01 AC-4: CLAUDE.md uses delimiters for clean future removal

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:18-19` -- Constants: `CLAUDE_MD_START = '<!-- GSD-PE:START -->'`, `CLAUDE_MD_END = '<!-- GSD-PE:END -->'`.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:336-358` -- `writeClaudeMd()`: creates new file with delimited block if absent; replaces existing delimited block if present; appends if no delimiters found. Never overwrites non-delimited user content.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:365-385` -- `stripClaudeMd()`: surgically removes delimited block on uninstall. If no delimiters found, returns `{ warned: true }` without modifying the file.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:849-850` -- Install path calls `writeClaudeMd(targetDir, peClaudeMdContent)` with pe attribution content.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:551-557` -- Uninstall path calls `stripClaudeMd()` and prints manual-removal warning when delimiters are absent.
- Reasoning: All three FN-03 scenarios are covered: new file, replace existing block, append to file without delimiters. Uninstall handles both delimited (surgical strip) and non-delimited (warn, no-modify) cases per spec.

### EU-01 AC-5: .planning/ directory is never touched during replacement

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:276-329` -- `replaceCc()` operates exclusively on: `commands/` (gsd:* files), `agents/` (gsd-* files), `get-shit-done/` dir, `hooks/dist/` dir. No code path references `.planning` or any directory outside these four targets.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:616-856` -- `install()` function: artifact copies target `commands/gsd/`, `get-shit-done/`, `agents/`, `hooks/`, `settings.json`, `CLAUDE.md`, `package.json`. No reference to `.planning`.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:392-567` -- `uninstall()` function: operates on same GSD-specific paths. No reference to `.planning`.
- Reasoning: Grep-level confidence -- `.planning` does not appear anywhere in the operative code paths. The replacement, install, and uninstall functions are scoped to known GSD artifact paths only.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 AC-1 | met | `bin/install.js:279-293` -- detects and uninstalls cc global package |
| EU-01 AC-2 | met | `bin/install.js:296-326` -- unconditional remnant scan removes gsd:*, gsd-*, get-shit-done/, hooks/dist/ |
| EU-01 AC-3 | met | `bin/install.js:765,788-846` -- orphan hooks cleaned then pe hooks added with dedup |
| EU-01 AC-4 | met | `bin/install.js:18-19,336-385,849-850` -- delimiter-managed CLAUDE.md with surgical strip on uninstall |
| EU-01 AC-5 | met | `bin/install.js:276-329` -- no .planning reference in any code path |
