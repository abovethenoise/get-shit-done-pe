---
phase: install-and-deploy
plan: "01"
wave: 2
depends_on:
  - install-and-deploy/package-identity/01-PLAN.md
files_modified:
  - bin/install.js
autonomous: true
requirements:
  - FN-01
  - FN-02
  - FN-03
  - TC-01
must_haves:
  - bin/install.js contains a `replaceCc(configDir)` function called at the top of `install()` before artifact copy
  - replaceCc() attempts `npm uninstall -g get-shit-done-cc` via try/catch (never throws)
  - replaceCc() scans ~/.claude for remnant gsd:* commands, gsd-* agents/hooks, hooks/dist/, get-shit-done/ and removes them
  - `cleanupOrphanedHooks()` orphanedHookPatterns includes 'gsd-check-update'
  - CLAUDE.md write uses GSD-PE:START / GSD-PE:END delimiters; uninstall surgically strips or warns
  - No .planning/ directory is ever touched
  - All npm child_process calls wrapped in try/catch (execSync throws on exit 1)
  - Idempotent: running twice produces identical state
---

# Plan: cc-replacement

## Objective

Add a pre-install cc-detection and cleanup phase to `bin/install.js` so that installing get-shit-done-pe completely replaces any prior get-shit-done-cc installation. Covers: upstream package uninstall, remnant file scan/removal, CLAUDE.md delimiter management, and orphaned hook pattern extension.

## Context

- @bin/install.js — file being modified; all new code goes here
- @.planning/capabilities/install-and-deploy/features/cc-replacement/FEATURE.md — requirements
- @.planning/capabilities/install-and-deploy/RESEARCH.md — critical findings

**Key research findings:**
- Use `npm uninstall -g get-shit-done-cc` NOT upstream npx (upstream has known $HOME cwd bug)
- `execSync` throws on non-zero exit; `npm list -g` exits 1 when package absent — wrap every npm call in try/catch
- `gsd-check-update.js` is orphaned in live settings.json SessionStart — extend `cleanupOrphanedHooks()` patterns list
- CLAUDE.md: delimiter pattern is new code, no existing foundation in install.js
- settings.json: always read-modify-write, never overwrite (existing pattern already correct)
- Safe-to-remove: `.claude/commands/gsd:*`, `.claude/agents/gsd-*`, `.claude/get-shit-done/`, `.claude/hooks/dist/`
- Never touch: `.planning/`, any non-`gsd-` prefixed files

---

## Tasks

<task name="T1: replaceCc() function — upstream uninstall + remnant scan">
  <files>bin/install.js</files>

  <action>
Add a new `replaceCc(configDir)` function to bin/install.js (place it after `cleanupOrphanedHooks`, before `uninstall`). Then call `replaceCc(targetDir)` at the very start of the `install()` function body, before `cleanupOrphanedFiles(targetDir)`.

The function must:

1. **Detect cc**: Check if `get-shit-done-cc` is globally installed.
   ```js
   const { execSync } = require('child_process');
   // Add this require at the top of the file alongside existing requires.

   let ccInstalled = false;
   try {
     execSync('npm list -g get-shit-done-cc --depth=0', { stdio: 'pipe' });
     ccInstalled = true;
   } catch (e) {
     ccInstalled = false; // exit 1 = not installed
   }
   ```

2. **Uninstall upstream package** (only if detected):
   ```js
   if (ccInstalled) {
     try {
       execSync('npm uninstall -g get-shit-done-cc', { stdio: 'pipe' });
     } catch (e) {
       // Best-effort: warn but continue
       // Accumulate warning for final output — store in returned object or module-level array
       // For now: push to a module-level `ccWarnings` array declared at top of file:
       //   const ccWarnings = [];
       ccWarnings.push('cc uninstall failed — manual cleanup may be needed');
     }
   }
   ```
   Declare `const ccWarnings = [];` at module level (near the top, after arg parsing).

3. **Remnant file scan** — run unconditionally (upstream uninstall is unreliable):
   ```js
   const claudeDir = configDir; // ~/.claude or explicit config dir

   // Remove gsd:* commands (files named gsd:*)
   const commandsDir = path.join(claudeDir, 'commands');
   if (fs.existsSync(commandsDir)) {
     for (const entry of fs.readdirSync(commandsDir, { withFileTypes: true })) {
       if (entry.isFile() && entry.name.startsWith('gsd:')) {
         fs.unlinkSync(path.join(commandsDir, entry.name));
       }
     }
   }

   // Remove gsd-* agents (files named gsd-*.md at agents/ level only, not subdirs)
   const agentsDir = path.join(claudeDir, 'agents');
   if (fs.existsSync(agentsDir)) {
     for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
       if (entry.isFile() && entry.name.startsWith('gsd-')) {
         fs.unlinkSync(path.join(agentsDir, entry.name));
       }
     }
   }

   // Remove get-shit-done/ directory (cc artifact — pe uses same name, will be freshly installed)
   const gsdDir = path.join(claudeDir, 'get-shit-done');
   if (fs.existsSync(gsdDir)) {
     fs.rmSync(gsdDir, { recursive: true });
   }

   // Remove hooks/dist/ (cc build artifact)
   const hooksDist = path.join(claudeDir, 'hooks', 'dist');
   if (fs.existsSync(hooksDist)) {
     fs.rmSync(hooksDist, { recursive: true });
   }
   ```
   All removals are idempotent (check existsSync before each operation). Never touch `.planning/`.

4. **Extend `cleanupOrphanedHooks()`**: Add `'gsd-check-update'` to the `orphanedHookPatterns` array inside the existing `cleanupOrphanedHooks()` function:
   ```js
   const orphanedHookPatterns = [
     'gsd-notify.sh',
     'hooks/statusline.js',
     'gsd-intel-index.js',
     'gsd-intel-session.js',
     'gsd-intel-prune.js',
     'gsd-check-update',  // cc orphan — removed in pe
   ];
   ```

5. Return `{ ccWarnings }` from `replaceCc()` so the caller can surface warnings later. For now, the `install()` function can simply call `replaceCc(targetDir)` without using the return value — the `ccWarnings` module-level array will hold the warnings for future surfacing via install-feedback feature.
  </action>

  <verify>
  - `replaceCc` function exists in bin/install.js
  - `const { execSync } = require('child_process');` added at top of file
  - `const ccWarnings = [];` declared at module level
  - `replaceCc(targetDir)` called at start of `install()` body
  - `npm list -g` call is wrapped in try/catch
  - `npm uninstall -g get-shit-done-cc` call is wrapped in try/catch
  - `cleanupOrphanedHooks` orphanedHookPatterns includes `'gsd-check-update'`
  - All fs operations use existsSync guards (idempotent)
  - No reference to `.planning/` anywhere in new code
  </verify>

  <done>
  `replaceCc()` function added, called from `install()`, all npm calls try/caught, gsd-check-update added to orphan patterns.
  </done>

  <reqs>FN-01, FN-02, TC-01</reqs>
</task>

<task name="T2: CLAUDE.md delimiter management">
  <files>bin/install.js</files>

  <action>
Add two new functions for delimiter-managed CLAUDE.md writes: `writeClaудeMd(configDir, content)` and `stripGsdPeContent(claudeMdPath)`. Then wire them into `install()` (append pe content) and `uninstall()` (surgical strip).

**Constants** — add near the top of the file (after color constants):
```js
const CLAUDE_MD_START = '<!-- GSD-PE:START -->';
const CLAUDE_MD_END = '<!-- GSD-PE:END -->';
```

**`writeClaudeMd(configDir, peContent)`** — add after `replaceCc`:
```js
function writeClaudeMd(configDir, peContent) {
  const claudeMdPath = path.join(configDir, 'CLAUDE.md');
  const block = `\n${CLAUDE_MD_START}\n${peContent}\n${CLAUDE_MD_END}\n`;

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, block);
    return;
  }

  let existing = fs.readFileSync(claudeMdPath, 'utf8');
  const startIdx = existing.indexOf(CLAUDE_MD_START);
  const endIdx = existing.indexOf(CLAUDE_MD_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing delimited block
    existing = existing.slice(0, startIdx) + block.trimStart() + existing.slice(endIdx + CLAUDE_MD_END.length);
  } else {
    // Append new delimited block
    existing = existing.trimEnd() + '\n' + block;
  }

  fs.writeFileSync(claudeMdPath, existing);
}
```

**`stripClaudeMd(configDir)`** — returns `{ stripped: boolean, warned: boolean }`:
```js
function stripClaudeMd(configDir) {
  const claudeMdPath = path.join(configDir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    return { stripped: false, warned: false };
  }

  const content = fs.readFileSync(claudeMdPath, 'utf8');
  const startIdx = content.indexOf(CLAUDE_MD_START);
  const endIdx = content.indexOf(CLAUDE_MD_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = content.slice(0, startIdx).trimEnd();
    const after = content.slice(endIdx + CLAUDE_MD_END.length).trimStart();
    const newContent = [before, after].filter(Boolean).join('\n') + '\n';
    fs.writeFileSync(claudeMdPath, newContent);
    return { stripped: true, warned: false };
  }

  // No delimiters — warn, don't touch
  return { stripped: false, warned: true };
}
```

**Wire into `install()`**: At the end of `install()`, before the `return { settingsPath, settings, statuslineCommand }` line, add:
```js
// Write pe attribution block to CLAUDE.md with delimiters
const peClaudeMdContent = `# GSD — Get Shit Done\n\nInstalled by get-shit-done-pe. Run \`/gsd:new\` in a blank directory to get started.`;
writeClaudeMd(targetDir, peClaudeMdContent);
```

**Wire into `uninstall()`**: After the settings.json block (before the final `console.log` at the end of `uninstall()`), add:
```js
// Strip GSD-PE content from CLAUDE.md
const claudeResult = stripClaudeMd(targetDir);
if (claudeResult.stripped) {
  removedCount++;
  console.log(`  ${green}✓${reset} Removed GSD content from CLAUDE.md`);
} else if (claudeResult.warned) {
  console.log(`  ${yellow}⚠${reset} Cannot safely remove GSD content from CLAUDE.md — please remove manually`);
}
```
  </action>

  <verify>
  - `CLAUDE_MD_START` and `CLAUDE_MD_END` constants defined
  - `writeClaudeMd()` function exists with delimiter insert/replace logic
  - `stripClaudeMd()` function exists returning `{ stripped, warned }`
  - `writeClaudeMd(targetDir, ...)` called at end of `install()` body
  - `stripClaudeMd(targetDir)` called in `uninstall()` before final console.log
  - On write: if delimiters already exist, replaces block; if not, appends
  - On strip with no delimiters: warns, does not modify file
  - Non-delimited user content is never overwritten or removed
  </verify>

  <done>
  `writeClaudeMd` and `stripClaudeMd` added and wired; CLAUDE.md managed with GSD-PE:START/END delimiters on install and surgically stripped on uninstall.
  </done>

  <reqs>FN-03, TC-01</reqs>
</task>

---

## Verification

After both tasks are complete, the executor MUST manually verify:

1. `node bin/install.js --help` exits 0 (no syntax errors)
2. `node -e "require('./bin/install.js')"` — not applicable (file has top-level side effects), but check for parse errors via `node --check bin/install.js`
3. `cleanupOrphanedHooks` in bin/install.js includes `'gsd-check-update'` in orphanedHookPatterns
4. `replaceCc` function body contains both `npm list -g` and `npm uninstall -g` each in a try/catch
5. `writeClaudeMd` and `stripClaudeMd` functions present
6. `replaceCc(targetDir)` appears as first call inside `install()` function body

## Success Criteria

- [ ] EU-01 covered: all FN requirements implemented (FN-01 upstream uninstall, FN-02 remnant scan, FN-03 CLAUDE.md delimiters)
- [ ] TC-01: pre-install phase added to install.js before artifact copy; no external deps; macOS+Linux fs/child_process only
- [ ] Idempotent: running install twice leaves identical state (all ops guarded by existsSync or try/catch)
- [ ] .planning/ never referenced in new code
- [ ] settings.json: only modified via existing read-modify-write pattern (no new direct writes)
- [ ] `node --check bin/install.js` passes (no syntax errors)
