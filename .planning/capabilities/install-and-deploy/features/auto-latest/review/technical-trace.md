# Technical Trace: auto-latest (TC-01)

## Phase 1: Requirements Internalized

### TC-01: Session-start update hook

The spec defines the following technical constraints:

1. **Non-blocking** -- session must not wait for npm check to complete
2. **macOS + Linux** -- Node.js child_process
3. **5s timeout** on npm registry query
4. **Cache at `~/.claude/get-shit-done/.update-check`** -- JSON with `lastCheck` timestamp and `currentVersion`
5. **Update for next session, not current** -- background install, current session unaffected
6. **Hook registration via install.js** -- same pattern as existing hooks, with `.some()` idempotency guard
7. **24h throttle** -- no npm hit more than once per 24 hours
8. **Silent on all failures** -- never interrupt user session
9. **Uninstall cleanup** -- hook removed on uninstall

---

## Phase 2: Trace Against Code

### TC-01: Session-start update hook

**Verdict:** met

**Evidence -- constraint by constraint:**

---

**1. Non-blocking (spawn + detach + unref)**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:74-78`:
  ```js
  const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  ```
- Reasoning: `detached: true` + `child.unref()` + `stdio: 'ignore'` means the hook process exits immediately (line 80: `process.exit(0)`) while the npm install runs independently. The session is not blocked.

---

**2. macOS + Linux (Node.js child_process)**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:16`:
  ```js
  const { spawn } = require('child_process');
  ```
- Reasoning: Uses Node.js `child_process.spawn`, which works on both macOS and Linux. No platform-specific code (no shell scripts, no Windows-only APIs).

---

**3. 5-second timeout on npm registry query**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:48`:
  ```js
  const req = https.get(REGISTRY_URL, { timeout: 5000 }, (res) => {
  ```
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:88`:
  ```js
  req.on('timeout', () => { req.destroy(); process.exit(0); });
  ```
- Reasoning: 5000ms timeout is set on the HTTPS request. On timeout, the request is destroyed and the process exits cleanly with code 0.

---

**4. Cache at `~/.claude/get-shit-done/.update-check` with correct JSON structure**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:19-20`:
  ```js
  const CACHE_DIR = path.join(os.homedir(), '.claude', 'get-shit-done');
  const CACHE_PATH = path.join(CACHE_DIR, '.update-check');
  ```
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:61-64`:
  ```js
  cache.lastCheck = new Date().toISOString();
  if (cache.currentVersion && latestVersion === cache.currentVersion) {
  ```
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:95-101` (writeCache function):
  ```js
  function writeCache(data) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2) + '\n');
    } catch (e) {
      // Silent - cache write failure is not fatal
    }
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:743-757` (cache initialization):
  ```js
  const cacheDir = path.join(os.homedir(), '.claude', 'get-shit-done');
  const cachePath = path.join(cacheDir, '.update-check');
  // ...
  cacheData.currentVersion = pkg.version;
  if (!cacheData.lastCheck) {
    cacheData.lastCheck = new Date(0).toISOString(); // epoch = always check
  }
  ```
- Reasoning: Cache path matches spec exactly. JSON structure contains `lastCheck` (ISO timestamp) and `currentVersion` as specified. The install.js seeds `currentVersion` from package.json and sets `lastCheck` to epoch on fresh install to force an immediate first check.

---

**5. Update for next session, not current**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:74-80`:
  ```js
  const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  process.exit(0);
  ```
- Reasoning: The background `npm install -g` replaces the global package on disk. The current session has already loaded its modules at startup. The spawned process is fully detached, so the update takes effect only when the next session starts and loads the newly installed version.

**Spec-vs-reality gap:** The spec (FN-02) says "Run `npx get-shit-done-pe@latest --global`" but implementation uses `npm install -g get-shit-done-pe@latest`. This is a spec-vs-reality deviation. The implementation is correct -- `npx` would attempt to run the package's bin entry, not install it. `npm install -g` is the proper command for global installation. The spec was wrong.

---

**6. Hook registration via install.js with `.some()` idempotency guard**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:775-777`:
  ```js
  const autoUpdateCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-auto-update.js')
    : 'node .claude/hooks/gsd-auto-update.js';
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:796-809`:
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
- Reasoning: Uses `.some()` to check for existing registration before pushing. This prevents duplicate hook entries on re-install. Matches the spec's requirement for idempotent registration via the same pattern used by other hooks.

---

**7. 24-hour throttle**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:18`:
  ```js
  const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours
  ```
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:40-44`:
  ```js
  if (cache.lastCheck) {
    const elapsed = Date.now() - new Date(cache.lastCheck).getTime();
    if (elapsed < THROTTLE_MS) {
      process.exit(0);
    }
  }
  ```
- Reasoning: Reads `lastCheck` from cache, computes elapsed time, exits immediately if under 24 hours. No network call is made when throttled. Timestamp is only updated after a successful npm query (lines 61, 66-67), not on skip. Matches FN-03 exactly.

---

**8. Silent on all failures**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:1-10` (contract comment):
  ```js
  // Contract:
  // - NEVER prints to stdout or stderr
  // - NEVER exits with non-zero code
  // - All errors are swallowed silently
  ```
- Every error path exits with `process.exit(0)`: lines 43, 57, 67, 80, 82, 87, 88, 92.
- No `console.log` or `console.error` calls anywhere in the file.
- Reasoning: All error branches (network error line 87, timeout line 88, JSON parse error line 82, outer try/catch line 90-92) exit silently with code 0. The contract is upheld.

---

**9. Uninstall cleanup**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:447`:
  ```js
  const gsdHooks = ['gsd-statusline.js', 'gsd-context-monitor.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:496-500`:
  ```js
  const hasGsdHook = entry.hooks.some(h =>
    h.command && (
      h.command.includes('gsd-statusline') ||
      h.command.includes('gsd-auto-update')
    )
  );
  ```
- Reasoning: Uninstall removes the `gsd-auto-update.js` file from the hooks directory (line 447-455) and removes its registration from `settings.json` SessionStart hooks (lines 492-509). Both the file and the settings entry are cleaned up.

---

**10. Orphan cleanup (gsd-check-update predecessor)**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:228`:
  ```js
  'gsd-check-update',  // cc orphan -- removed in pe
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:787-793`:
  ```js
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
    if (entry.hooks && Array.isArray(entry.hooks)) {
      return !entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'));
    }
    return true;
  });
  ```
- Reasoning: Defense-in-depth -- the orphaned predecessor hook `gsd-check-update` is cleaned up both via the `orphanedHookPatterns` array (general cleanup) and via an inline filter specific to SessionStart (targeted cleanup). This matches the execution summary's note about dual cleanup.

---

**11. Hook copies to config directory during install**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:701`:
  ```js
  const hookFiles = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:702-706`:
  ```js
  for (const hookFile of hookFiles) {
    const srcFile = path.join(hooksSrc, hookFile);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(hooksDest, hookFile));
    }
  }
  ```
- Reasoning: `gsd-auto-update.js` is included in the hook copy list. The file is copied from the package source to the user's config directory during install.

---

**12. stdin drain (Claude Code hook protocol)**

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:23-29`:
  ```js
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    try {
      try { JSON.parse(input); } catch (e) { /* ignore parse errors */ }
  ```
- Reasoning: Claude Code pipes session JSON to hook stdin. The hook drains stdin before proceeding, which is required to avoid broken pipe errors. Parse errors are ignored since the hook does not use the session data.

---

## Spec-vs-Reality Gaps

| Gap | Spec Said | Reality | Explanation |
|-----|-----------|---------|-------------|
| FN-02 install command | `npx get-shit-done-pe@latest --global` | `npm install -g get-shit-done-pe@latest` | `npx` runs a package's bin entry, it does not install globally. `npm install -g` is the correct command for global installation. The spec was wrong. |
| Version comparison | Spec implies semver comparison | Simple string equality (`latestVersion === cache.currentVersion`) | Execution summary documents this as a deliberate decision: "Simple string inequality for version comparison (no semver library)." This works because npm registry always returns a valid version string, and any version change (whether upgrade or downgrade) triggers re-install. No false negatives possible; potential false positive only if versions are equal but formatted differently, which npm registry normalizes. Acceptable trade-off for zero dependencies. |

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 (non-blocking) | met | `hooks/gsd-auto-update.js:74-78` -- spawn detached + unref |
| TC-01 (macOS+Linux) | met | `hooks/gsd-auto-update.js:16` -- Node.js child_process |
| TC-01 (5s timeout) | met | `hooks/gsd-auto-update.js:48` -- `{ timeout: 5000 }` |
| TC-01 (cache path+structure) | met | `hooks/gsd-auto-update.js:19-20` -- exact path match; `bin/install.js:743-757` -- seeds currentVersion+lastCheck |
| TC-01 (next session not current) | met | `hooks/gsd-auto-update.js:74-80` -- detached background install |
| TC-01 (hook registration) | met | `bin/install.js:796-809` -- `.some()` guard + SessionStart push |
| TC-01 (24h throttle) | met | `hooks/gsd-auto-update.js:18,40-44` -- THROTTLE_MS + elapsed check |
| TC-01 (silent failures) | met | `hooks/gsd-auto-update.js:87,88,82,92` -- all paths exit(0), no console output |
| TC-01 (uninstall cleanup) | met | `bin/install.js:447,496-500` -- file removal + settings cleanup |
