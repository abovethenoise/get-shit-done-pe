# End-User Trace: auto-latest

## Phase 1: Requirements Internalization

### EU-01: GSD always runs the latest version

**Story:** User never manually updates; GSD auto-updates silently on session start.

**Acceptance Criteria:**
1. After initial install, user never needs to manually update
2. Updates happen silently on session start (no prompts, no output)
3. If update fails (network, npm, install error), current version continues working
4. npm is not hit more than once per 24 hours

---

## Phase 2: Trace Against Code

### EU-01: GSD always runs the latest version

**Verdict:** met

**Evidence per acceptance criterion:**

#### AC-1: After initial install, user never needs to manually update

- `/Users/philliphall/get-shit-done-pe/bin/install.js:742-760` -- Cache initialization on install:
  ```js
  const cacheDir = path.join(os.homedir(), '.claude', 'get-shit-done');
  const cachePath = path.join(cacheDir, '.update-check');
  // ...
  cacheData.currentVersion = pkg.version;
  if (!cacheData.lastCheck) {
    cacheData.lastCheck = new Date(0).toISOString(); // epoch = always check
  }
  ```
  Fresh install sets `lastCheck` to epoch, forcing an immediate check on the first session.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:796-809` -- Hook registration with idempotency guard:
  ```js
  const hasAutoUpdateHook = settings.hooks.SessionStart.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-auto-update'))
  );
  if (!hasAutoUpdateHook) {
    settings.hooks.SessionStart.push({
      hooks: [{ type: 'command', command: autoUpdateCommand }]
    });
  }
  ```
  Hook is registered in `settings.json` SessionStart, so it fires every session without user action.

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:74-78` -- Background install spawned detached:
  ```js
  const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  ```
  Update runs automatically, no user command needed.

- Reasoning: The hook fires on every session start, checks npm when throttle allows, and spawns a background global install. User never runs an update command.

#### AC-2: Updates happen silently on session start (no prompts, no output)

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:1-10` -- Contract header:
  ```js
  // Contract:
  // - NEVER prints to stdout or stderr
  // - NEVER exits with non-zero code
  // - All errors are swallowed silently
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:74-78` -- `stdio: 'ignore'` on child process:
  ```js
  const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
    detached: true,
    stdio: 'ignore'
  });
  ```

- Reasoning: No `console.log`, no `console.error`, no `process.stdout.write` calls exist in the hook. The spawned npm process has `stdio: 'ignore'`. Every code path exits with `process.exit(0)`. The hook produces no visible output to the user.

#### AC-3: If update fails, current version continues working

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:81-83` -- Inner try/catch exits cleanly:
  ```js
  } catch (e) {
    process.exit(0);
  }
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:87-88` -- Network errors exit cleanly:
  ```js
  req.on('error', () => process.exit(0));
  req.on('timeout', () => { req.destroy(); process.exit(0); });
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:90-92` -- Outer try/catch:
  ```js
  } catch (e) {
    process.exit(0);
  }
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:95-101` -- Cache write failure is non-fatal:
  ```js
  function writeCache(data) {
    try {
      // ...
    } catch (e) {
      // Silent - cache write failure is not fatal
    }
  }
  ```

- Reasoning: Every error path (network failure, JSON parse failure, npm timeout, cache corruption, cache write failure) results in `process.exit(0)`. The background `npm install -g` is detached and unreffed -- if it fails, it fails independently without affecting the running session. The current version is never removed or modified before the new version is confirmed installed (npm handles atomic global installs).

#### AC-4: npm is not hit more than once per 24 hours

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:18` -- Throttle constant:
  ```js
  const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:39-44` -- Throttle check:
  ```js
  if (cache.lastCheck) {
    const elapsed = Date.now() - new Date(cache.lastCheck).getTime();
    if (elapsed < THROTTLE_MS) {
      process.exit(0);
    }
  }
  ```

- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:61` -- Timestamp updated after successful npm query:
  ```js
  cache.lastCheck = new Date().toISOString();
  ```

- Reasoning: The cache file stores `lastCheck` as an ISO timestamp. On each session start, elapsed time is computed. If under 24 hours, the process exits before any network call. The timestamp is only updated after a successful npm registry response (line 61 is inside the `res.on('end')` callback), so failed checks do not reset the throttle window. This matches the spec requirement in FN-03 that says "Update timestamp after successful npm query (not after skip)."

**Cross-layer observations:**

- The version comparison at line 64 uses strict string equality (`latestVersion === cache.currentVersion`). This means if the registry returns `2.0.0` and cache has `2.0.0`, no update runs -- correct. However, if `currentVersion` in the cache diverges from the actual installed version (e.g., user manually installs a different version outside of this mechanism), the cache will be stale. This is an acceptable limitation given "rollback" and "pinning" are explicitly out of scope.

- The spec (FN-02) says `npx get-shit-done-pe@latest --global` but the implementation uses `npm install -g get-shit-done-pe@latest` (line 74). This is a deviation from the spec text but is functionally equivalent (and arguably more correct since `npx` is for execution, not installation). Flagged as a spec-vs-implementation text mismatch, not a behavioral defect.

- The `currentVersion` in the cache is initialized by `install.js` (line 752: `cacheData.currentVersion = pkg.version`) but is never updated by the hook after a successful background install completes. The hook writes `cache.currentVersion = cache.currentVersion || 'unknown'` at line 71 before spawning the update, meaning the cache version stays at the old value. On next session, if the background install succeeded, the hook would find `latestVersion === currentVersion` (since a fresh install also runs `install.js` which updates the cache). This works because `npm install -g` re-runs the `postinstall` script in `package.json`, which would re-run `install.js` and update the cache. If `postinstall` is not configured or fails, the cache would be stale and the hook would trigger another update attempt -- a safe degradation.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | `hooks/gsd-auto-update.js` -- SessionStart hook with 24h throttle, silent npm check, detached background install, all-errors-exit-0 pattern; `bin/install.js:742-809` -- cache init + hook registration |
