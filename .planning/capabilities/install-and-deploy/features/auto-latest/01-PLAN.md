---
phase: auto-latest
plan: "01"
wave: 1
depends_on: []
files_modified:
  - hooks/gsd-auto-update.js
  - bin/install.js
autonomous: true
requirements:
  - FN-01
  - FN-02
  - FN-03
  - TC-01
  - EU-01
must_haves:
  - hooks/gsd-auto-update.js exists and is a valid CommonJS module
  - Cache file read/write at ~/.claude/get-shit-done/.update-check (JSON with lastCheck + currentVersion)
  - 24-hour throttle: skip npm check entirely if < 24h since lastCheck
  - Version check uses https.get() to registry.npmjs.org with 5s timeout — no subprocess
  - Update runs npm install -g get-shit-done-pe@latest via spawn({detached:true}) + child.unref()
  - All failures (network, npm error, fs error) are silent — no process.exit(1), no stdout
  - install.js registers SessionStart hook with .some() idempotency guard (no duplicates on re-install)
  - install.js uninstall path removes the SessionStart auto-update hook entry
---

# Plan: auto-latest

## Objective

Create `hooks/gsd-auto-update.js` (SessionStart hook) and wire it into `bin/install.js` so that every Claude Code session silently checks npm once per 24 hours and installs a newer version of `get-shit-done-pe` in the background if one exists.

## Context

@.planning/capabilities/install-and-deploy/features/auto-latest/FEATURE.md
@bin/install.js
@hooks/gsd-context-monitor.js

**Key constraints from RESEARCH.md:**
- Zero runtime deps — Node.js stdlib only (`fs`, `path`, `os`, `https`, `child_process`)
- Use `https.get()` for registry query, NOT `execSync('npm view ...')` (avoids subprocess-in-subprocess)
- Use `npm install -g get-shit-done-pe@latest` for update, NOT `npx` (npx caches stale versions)
- `async: true` hook support is unconfirmed — use `spawn({detached:true}) + child.unref()` as primary approach
- `gsd-check-update.js` is a deleted predecessor — adapt its spawn+unref pattern, don't invent

**install.js hook registration pattern (from existing PostToolUse hooks):**
```js
const hasContextMonitorHook = settings.hooks.PostToolUse.some(entry =>
  entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-context-monitor'))
);
if (!hasContextMonitorHook) {
  settings.hooks.PostToolUse.push({ hooks: [{ type: 'command', command: contextMonitorCommand }] });
}
```
Apply the same `.some()` idempotency guard for SessionStart.

---

## Tasks

<task name="create-auto-update-hook">
  <files>
    hooks/gsd-auto-update.js
  </files>
  <reqs>FN-01, FN-02, FN-03, TC-01</reqs>

  <action>
Create `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js` as a new file.

The hook is a SessionStart hook. Claude Code pipes JSON to stdin (`{ session_id, ... }`). The hook must be non-blocking — it spawns background work and exits immediately.

**Structure:**

```
Read stdin → parse JSON (silent fail on error)
→ read cache file (~/.claude/get-shit-done/.update-check)
→ if lastCheck < 24h ago: exit 0 (throttle)
→ https.get() to npm registry with 5s timeout
→ compare latest vs current version
→ if same: update lastCheck timestamp, exit 0
→ if newer: update lastCheck timestamp, spawn npm install -g in background, exit 0
→ on any error: exit 0 (silent)
```

**Cache file:**
- Path: `path.join(os.homedir(), '.claude', 'get-shit-done', '.update-check')`
- Format: `{ "lastCheck": "<ISO string>", "currentVersion": "<semver>" }`
- On missing file: treat as "check needed" (proceed with version check)
- Ensure parent dir exists before writing (`fs.mkdirSync(..., { recursive: true })`)

**Version check (FN-01):**
```js
const https = require('https');
const url = 'https://registry.npmjs.org/get-shit-done-pe/latest';
const req = https.get(url, { timeout: 5000 }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const latestVersion = data.version;
      // compare with local pkg version
    } catch (e) { exit(0); }
  });
});
req.on('error', () => process.exit(0));
req.on('timeout', () => { req.destroy(); process.exit(0); });
```

Get current version from `require('../package.json').version` (relative path from `hooks/` to repo root). At install time the hook lives at `~/.claude/hooks/gsd-auto-update.js` — so it cannot use `../package.json` at runtime. Instead, store the current version in the cache file on first install (see install.js task below). Read `currentVersion` from the cache file for comparison.

**Background update (FN-02):**
```js
const { spawn } = require('child_process');
const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
  detached: true,
  stdio: 'ignore'
});
child.unref();
```

**Stdin handling pattern** (match gsd-context-monitor.js):
```js
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    // all logic here
  } catch (e) {
    process.exit(0); // silent fail
  }
});
```

**No output to stdout/stderr.** The hook must never print anything. All error paths call `process.exit(0)`.

**Semver comparison:** Simple string inequality is sufficient (`latestVersion !== cachedVersion`). Do not import semver. If the cache has no `currentVersion`, treat as "update needed" (conservative).
  </action>

  <verify>
  1. File exists at `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js`
  2. `node -e "require('./hooks/gsd-auto-update.js')"` — no syntax errors (will exit 0 since stdin closes immediately)
  3. Grep for `process.exit(1)` or `console.log` — must find zero matches
  4. Grep for `child.unref()` — must find exactly one match
  5. Grep for `https.get` — must find exactly one match
  6. Grep for `.update-check` — must find the cache path
  </verify>

  <done>
  hooks/gsd-auto-update.js exists, passes node syntax check, contains spawn+unref pattern, uses https.get(), reads/writes cache at ~/.claude/get-shit-done/.update-check, zero stdout/stderr output paths.
  </done>
</task>

<task name="wire-hook-in-install">
  <files>
    bin/install.js
  </files>
  <reqs>FN-01, FN-03, TC-01</reqs>

  <action>
Edit `/Users/philliphall/get-shit-done-pe/bin/install.js`. Read the full file first.

**Change 1 — Build hook command path (install path, ~line 620 area near other hook commands):**

Add alongside the existing `contextMonitorCommand` and `askUserQuestionGuardCommand` variables:
```js
const autoUpdateCommand = isGlobal
  ? buildHookCommand(targetDir, 'gsd-auto-update.js')
  : 'node .claude/hooks/gsd-auto-update.js';
```

**Change 2 — Register SessionStart hook with idempotency guard:**

Find the block that initializes `settings.hooks.SessionStart` (currently just initializes the array but pushes nothing). After the initialization, add:

```js
const hasAutoUpdateHook = settings.hooks.SessionStart.some(entry =>
  entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-auto-update'))
);

if (!hasAutoUpdateHook) {
  settings.hooks.SessionStart.push({
    hooks: [
      {
        type: 'command',
        command: autoUpdateCommand
      }
    ]
  });
}
```

**Change 3 — Initialize currentVersion in cache on install:**

The hook reads `currentVersion` from the cache file (since `../package.json` won't resolve at runtime in `~/.claude/hooks/`). On install, write the current version to the cache so the hook has a baseline.

Find where hooks are installed (after the hook files are copied to `targetDir`). Add logic to write the initial cache file:

```js
// Initialize auto-update cache with current version
const cacheDir = path.join(os.homedir(), '.claude', 'get-shit-done');
const cachePath = path.join(cacheDir, '.update-check');
try {
  fs.mkdirSync(cacheDir, { recursive: true });
  // Only write if missing or currentVersion is absent (don't reset lastCheck on re-install)
  let cacheData = {};
  if (fs.existsSync(cachePath)) {
    try { cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) {}
  }
  cacheData.currentVersion = pkg.version;
  // Only reset lastCheck if missing (force check on fresh install)
  if (!cacheData.lastCheck) {
    cacheData.lastCheck = new Date(0).toISOString(); // epoch = always check
  }
  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2) + '\n');
} catch (e) {
  // Silent — cache init failure must not block install
}
```

Place this cache init after the hook files are copied but before `writeSettings()`.

**Change 4 — Uninstall: remove SessionStart auto-update hook entry:**

Find the uninstall block that handles SessionStart hooks (around line 367, filters `gsd-statusline`). The existing filter only removes statusline hooks from SessionStart. Extend it to also remove `gsd-auto-update` entries:

```js
settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
  if (entry.hooks && Array.isArray(entry.hooks)) {
    const hasGsdHook = entry.hooks.some(h =>
      h.command && (
        h.command.includes('gsd-statusline') ||
        h.command.includes('gsd-auto-update')
      )
    );
    return !hasGsdHook;
  }
  return true;
});
```

**Change 5 — cleanupOrphanedHooks: add gsd-check-update pattern:**

Find `cleanupOrphanedHooks()` and its `orphanedFiles` array. Also find the hook cleanup loop. Add `gsd-check-update` to the stale command pattern so it gets removed from settings on re-install:

In the hook cleanup loop (where it iterates `settings.hooks[eventType]`), the existing code already removes entries whose commands include patterns from the orphaned list. Find where orphan hook command patterns are defined and add `'gsd-check-update'` to that list. If no such list exists, add a comment-targeted filter in the SessionStart cleanup:

```js
// Also clean up orphaned gsd-check-update hook (deleted predecessor to gsd-auto-update)
settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
  if (entry.hooks && Array.isArray(entry.hooks)) {
    return !entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'));
  }
  return true;
});
```

Place this in the `cleanupOrphanedHooks` function or immediately before the SessionStart idempotency check in the install path — whichever is cleaner given the existing structure.
  </action>

  <verify>
  1. `node -e "require('./bin/install.js')" 2>/dev/null; echo "exit: $?"` — exits 0 with banner (no crash on require, though it will print banner)
  2. Grep `bin/install.js` for `gsd-auto-update` — must appear in: autoUpdateCommand declaration, SessionStart push block, SessionStart uninstall filter, and orphan cleanup
  3. Grep `bin/install.js` for `hasAutoUpdateHook` — must find exactly one `.some()` guard
  4. Grep `bin/install.js` for `.update-check` — must find the cache init block
  5. Grep `bin/install.js` for `gsd-check-update` — must find the orphan cleanup
  6. Grep `bin/install.js` for `get-shit-done-pe@latest` — must NOT appear (that's the hook's job, not install.js)
  </verify>

  <done>
  bin/install.js registers gsd-auto-update.js on SessionStart with idempotency guard, removes it on uninstall, initializes the version cache on install, and cleans up the legacy gsd-check-update orphan. No syntax errors.
  </done>
</task>

---

## Verification

After both tasks complete, run end-to-end smoke test:

```bash
# 1. Syntax check both files
node --check hooks/gsd-auto-update.js
node --check bin/install.js

# 2. Verify hook has no forbidden output patterns
grep -n "console\." hooks/gsd-auto-update.js  # expect: no matches
grep -n "process.exit(1)" hooks/gsd-auto-update.js  # expect: no matches

# 3. Simulate hook with empty stdin (should exit 0 silently)
echo '{"session_id":"test-123"}' | node hooks/gsd-auto-update.js
echo "exit code: $?"  # expect: 0

# 4. Verify install.js wiring
grep -c "gsd-auto-update" bin/install.js  # expect: >= 4 occurrences
```

## Success Criteria

- [ ] hooks/gsd-auto-update.js: valid CJS, no stdout/stderr, spawn+unref pattern, https.get() with 5s timeout, 24h throttle, cache at ~/.claude/get-shit-done/.update-check
- [ ] bin/install.js: SessionStart registration with .some() guard, uninstall removes entry, cache initialized on install, gsd-check-update orphan cleaned up
- [ ] All 5 REQ IDs covered: EU-01 (auto-update behavior), FN-01 (version check), FN-02 (silent update), FN-03 (throttle cache), TC-01 (hook registration)
- [ ] Zero runtime dependencies added
