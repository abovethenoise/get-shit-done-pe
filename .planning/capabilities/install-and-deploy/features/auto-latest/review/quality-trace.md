# Quality Trace: auto-latest

## Phase 1: Quality Standards

Evaluating a Node.js SessionStart hook (`gsd-auto-update.js`, 102 lines) and its install wiring in `bin/install.js`. Principles under review:

- **KISS**: Is the hook appropriately sized and free of dead code paths?
- **DRY**: Is the install.js wiring consistent with existing hook patterns, without duplication?
- **Earned Abstractions**: Are there unnecessary layers or indirection?
- **Robustness**: Are errors handled, resources managed, edge cases covered?

## Phase 2: Trace Against Code

### Finding 1: Redundant gsd-check-update orphan cleanup (DRY violation)

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:228` -- `'gsd-check-update',  // cc orphan -- removed in pe`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:788-793`:
  ```js
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
    if (entry.hooks && Array.isArray(entry.hooks)) {
      return !entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'));
    }
    return true;
  });
  ```
- Reasoning: `gsd-check-update` is already in the `orphanedHookPatterns` array (line 228), which `cleanupOrphanedHooks()` processes at line 765 -- iterating all hook event types including `SessionStart`. The inline filter at lines 788-793 performs the exact same removal a second time. The summary acknowledges this as "defense-in-depth," but duplicated cleanup logic is not defense-in-depth -- it is redundant code that will need to be maintained in two places. If the orphan pattern list is the canonical cleanup mechanism, use it; if the inline filter is needed, the pattern list entry is dead weight. Pick one.

---

### Finding 2: Unnecessary JSON.parse of stdin

**Category:** KISS

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:29`:
  ```js
  try { JSON.parse(input); } catch (e) { /* ignore parse errors */ }
  ```
- Reasoning: The result of `JSON.parse(input)` is discarded. The comment says "we don't use it, but must drain it." Draining stdin is accomplished by the `data`/`end` event listeners on lines 24-26. Parsing the drained input into JSON serves no purpose -- it allocates an object that is immediately garbage collected and wraps the call in a try/catch that swallows errors. The drain contract is already fulfilled by reading into the `input` variable. This line is dead code.

---

### Finding 3: currentVersion not updated after background install

**Category:** Robustness

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:70-78`:
  ```js
  // Newer version available (or no cached version) - update in background
  cache.currentVersion = cache.currentVersion || 'unknown';
  writeCache(cache);

  const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
    detached: true,
    stdio: 'ignore'
  });
  ```
- Reasoning: When a newer version is detected, the cache is written with the *old* `currentVersion` (or `'unknown'`). The background `npm install` runs detached, and if it succeeds, `install.js` will write the new version to the cache on next install. However, until that install script runs its cache init block (lines 742-760), the hook will see `currentVersion !== latestVersion` on every session start and spawn a redundant `npm install -g` each time -- potentially for 24 hours until the next throttle window, but actually on every session within the *next* 24h window since `lastCheck` is updated. So: one redundant install per 24h cycle until the install script's postinstall runs. This is minor but worth noting -- the hook could write `latestVersion` to the cache to prevent the redundant spawn.

---

### Finding 4: Hook registration pattern is consistent (no issue)

**Category:** DRY

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:796-809` (auto-update registration):
  ```js
  const hasAutoUpdateHook = settings.hooks.SessionStart.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-auto-update'))
  );
  if (!hasAutoUpdateHook) {
    settings.hooks.SessionStart.push({ ... });
  }
  ```
- This follows the identical `.some()` idempotency guard pattern used for `gsd-context-monitor` (lines 816-829) and `gsd-askuserquestion-guard` (lines 832-846). The pattern is repeated but structurally justified -- each hook has different event types, matchers, and commands. Extracting a generic "register hook" helper would add abstraction without meaningful simplification given the variance in config shape (`matcher` field, different event types).

---

### Finding 5: Hook file is appropriately sized

**Category:** KISS

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js` -- 102 lines total, zero runtime dependencies, single-purpose flow (drain -> cache check -> throttle -> registry query -> conditional spawn).
- Reasoning: The file is linear, has no abstractions beyond `writeCache()`, and handles its contract (silent, always exit 0) consistently. The `writeCache` extraction is earned -- called from two sites (lines 66, 72). Size is proportional to the problem.

---

### Finding 6: Uninstall hook list maintained separately from install hook list

**Category:** DRY

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:447` (uninstall):
  ```js
  const gsdHooks = ['gsd-statusline.js', 'gsd-context-monitor.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:701` (install):
  ```js
  const hookFiles = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
  ```
- Reasoning: Two independent arrays listing the same hook files -- one for install, one for uninstall. Adding a new hook requires updating both lists (plus the settings.json registration block and the uninstall settings cleanup). This is a pre-existing pattern not introduced by auto-latest, but auto-latest extended it. A single `GSD_HOOKS` constant at module scope would eliminate the synchronization risk. This is not a regression introduced by this feature -- it is inherited technical debt that this feature perpetuated.

---

### Finding 7: Cache path duplicated across hook and install.js

**Category:** DRY

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:19-20`:
  ```js
  const CACHE_DIR = path.join(os.homedir(), '.claude', 'get-shit-done');
  const CACHE_PATH = path.join(CACHE_DIR, '.update-check');
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:743-744`:
  ```js
  const cacheDir = path.join(os.homedir(), '.claude', 'get-shit-done');
  const cachePath = path.join(cacheDir, '.update-check');
  ```
- Reasoning: The cache path `~/.claude/get-shit-done/.update-check` is hardcoded in two files. If this path ever changes, both files must be updated in lockstep. However, this is a pragmatic trade-off -- the hook is a standalone script that runs in its own process and cannot easily share a module with install.js without introducing a runtime dependency. The duplication is acknowledged but arguably justified by the execution model constraint. Borderline.

## Summary

| # | Title | Category | Verdict |
|---|-------|----------|---------|
| 1 | Redundant gsd-check-update orphan cleanup | DRY | not met (proven) |
| 2 | Unnecessary JSON.parse of stdin | KISS | not met (suspected) |
| 3 | currentVersion not updated after background install | Robustness | not met (suspected) |
| 4 | Hook registration pattern is consistent | DRY | met |
| 5 | Hook file is appropriately sized | KISS | met |
| 6 | Uninstall/install hook lists maintained separately | DRY | not met (suspected, pre-existing) |
| 7 | Cache path duplicated across hook and install.js | DRY | not met (suspected, justified by execution model) |

**Overall assessment:** The hook itself is clean and right-sized. The install.js wiring follows existing patterns faithfully. Two findings are actionable (1, 2), one is a robustness gap worth considering (3), and two are pre-existing debt perpetuated by this feature (6, 7).
