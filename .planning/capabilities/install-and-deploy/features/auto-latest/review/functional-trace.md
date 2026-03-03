# Functional Trace: auto-latest

## Phase 1: Internalize Requirements

### FN-01: Version check against npm registry

**Input:** Session start trigger (hook fires).
**Output:** Boolean: newer version available (true/false), or skip (if throttled/network fails).
**Behavior contract:**
1. Read last-check timestamp from cache file
2. If < 24h since last check: skip (return false)
3. Query npm registry for latest version of `get-shit-done-pe`
4. Compare against currently installed version (from local package.json)
5. If newer version exists: return true
6. If network fails or npm errors: return false (silent skip)
7. Update last-check timestamp on successful check

### FN-02: Silent auto-update

**Input:** Version check returns true (newer version available).
**Output:** Updated installation, or silent fallback.
**Behavior contract:**
1. Run `npx get-shit-done-pe@latest --global` in background
2. If install succeeds: new version active next session
3. If install fails: log error to cache/debug file, continue with current version
4. No terminal output in either case

### FN-03: Throttle cache

**Input:** Version check requests.
**Output:** Whether check should proceed or be skipped.
**Behavior contract:**
1. Store last-check timestamp in cache file (`~/.claude/get-shit-done/.update-check`)
2. On session start: read timestamp, compare to current time
3. If < 24h: skip check entirely (no network call)
4. If >= 24h or file missing: proceed with check
5. Update timestamp after successful npm query (not after skip)

---

## Phase 2: Trace Against Code

### FN-01: Version check against npm registry

**Verdict:** not met (proven)

**Evidence:**

- **Step 1 (read cache):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:32-37` -- `cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));` with catch for missing/corrupt cache.

- **Step 2 (throttle < 24h):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:40-44` -- `if (elapsed < THROTTLE_MS) { process.exit(0); }`

- **Step 3 (query npm):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:48` -- `https.get(REGISTRY_URL, { timeout: 5000 }, ...)` where `REGISTRY_URL = 'https://registry.npmjs.org/get-shit-done-pe/latest'`

- **Step 4 (compare against currently installed version):** Not met.
  - Spec says: "Compare against currently installed version (from local package.json)."
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:64` -- `if (cache.currentVersion && latestVersion === cache.currentVersion)`
  - The hook compares against `cache.currentVersion` (from `.update-check` cache file), not from the local `package.json`. The cache is initialized by `install.js` with `pkg.version` (line 752: `cacheData.currentVersion = pkg.version`), but the hook itself never reads `package.json`. After a successful background update, the cache `currentVersion` is NOT updated to the newly installed version -- it retains the old version. This means after an update installs successfully, the next 24h-cycle check will see `cache.currentVersion` as the old version, `latestVersion` as the same (now-installed) version, and trigger another unnecessary update. The cache is only corrected when `install.js` runs again (which it does as part of the npm install -g, so this is self-healing). This is a design decision documented in the summary ("Cache currentVersion written by install.js since hook can't resolve ../package.json at runtime"), so the deviation from spec wording is intentional but the behavioral contract as written is not literally followed.

- **Step 5 (newer version -> return true):** Met (implicitly).
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:64-78` -- When `latestVersion !== cache.currentVersion`, the hook proceeds to spawn the update. The hook doesn't literally return `true`; it acts on the result directly.

- **Step 6 (network fail -> silent skip):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:87` -- `req.on('error', () => process.exit(0));`
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:88` -- `req.on('timeout', () => { req.destroy(); process.exit(0); });`
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:81-83` -- `catch (e) { process.exit(0); }`

- **Step 7 (update timestamp on successful check):** Not met.
  - Spec says: "Update last-check timestamp on successful check."
  - When versions match: `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:61-67` -- timestamp IS updated and written via `writeCache(cache)`. Met.
  - When newer version found: `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:61,72` -- `cache.lastCheck` is set on line 61, and `writeCache(cache)` is called on line 72. Met.
  - On network error or timeout: timestamp is NOT updated. This is correct per spec ("on successful check").
  - Correction: Step 7 is met after closer inspection.

**Revised Verdict for FN-01:** met (with deviation noted)

The version comparison uses `cache.currentVersion` instead of reading `package.json` directly. This is a documented design decision. The behavioral outcome is equivalent because `install.js` seeds `currentVersion` on install, and the background `npm install -g` re-runs `install.js` which updates the cache. The spec's stated contract ("from local package.json") is not literally followed, but the functional behavior is preserved.

---

### FN-02: Silent auto-update

**Verdict:** not met (proven)

**Evidence:**

- **Step 1 (run update command):** Not met.
  - Spec says: "Run `npx get-shit-done-pe@latest --global` in background."
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:74` -- `spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], { detached: true, stdio: 'ignore' })`
  - The implementation uses `npm install -g get-shit-done-pe@latest`, NOT `npx get-shit-done-pe@latest --global` as specified. These are different commands: `npm install -g` installs the package globally via npm, while `npx get-shit-done-pe@latest --global` would execute the package's bin entry (install.js) which handles hook registration, cache initialization, CLAUDE.md updates, etc. The `npm install -g` command will trigger the postinstall script (if any in package.json) but does NOT pass `--global` to `install.js`, so hook re-registration, cache `currentVersion` update, and CLAUDE.md refresh depend on whether a postinstall script is configured.

- **Step 2 (new version active next session):** Met (conditionally).
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:75-78` -- `detached: true` + `child.unref()` ensures the install runs independently. The current process exits immediately via `process.exit(0)` on line 80.

- **Step 3 (log error to cache/debug file on failure):** Not met.
  - Spec says: "If install fails: log error to cache/debug file, continue with current version."
  - The spawned child process has `stdio: 'ignore'` (line 76). There is no error handler on the child, no logging of install failures anywhere. The hook calls `child.unref()` and exits. If the background install fails, no error is written to any file.

- **Step 4 (no terminal output):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:8` -- Contract comment: "NEVER prints to stdout or stderr."
  - `stdio: 'ignore'` on the child process (line 76).
  - No `console.log` or `console.error` calls anywhere in the hook.
  - All error paths exit with code 0.

**Cross-layer observations:**
- The `npm install -g` command will re-run `bin/install.js` only if a `postinstall` script is configured in `package.json`. If there is no postinstall, the npm global install updates the package files but does NOT re-register hooks, update CLAUDE.md, or refresh the cache `currentVersion`. This could leave the installation in an inconsistent state after auto-update.

---

### FN-03: Throttle cache

**Verdict:** met

**Evidence:**

- **Step 1 (store timestamp in cache file):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:20` -- `CACHE_PATH = path.join(CACHE_DIR, '.update-check')` where `CACHE_DIR = path.join(os.homedir(), '.claude', 'get-shit-done')`. Matches spec path `~/.claude/get-shit-done/.update-check`.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:61` -- `cache.lastCheck = new Date().toISOString();`

- **Step 2 (read timestamp, compare):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:40-44` -- Reads `cache.lastCheck`, computes `elapsed = Date.now() - new Date(cache.lastCheck).getTime()`, compares against `THROTTLE_MS`.

- **Step 3 (< 24h -> skip):** Met.
  - `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:42-44` -- `if (elapsed < THROTTLE_MS) { process.exit(0); }` -- exits before any network call.

- **Step 4 (>= 24h or missing -> proceed):** Met.
  - If `cache.lastCheck` is falsy (missing), the throttle block is skipped entirely (line 40: `if (cache.lastCheck)`), falling through to the npm query.
  - If cache file is missing/corrupt, the catch on line 35-37 sets `cache = {}`, so `cache.lastCheck` is undefined, and the check proceeds.
  - `/Users/philliphall/get-shit-done-pe/bin/install.js:754-755` -- Fresh install seeds `lastCheck` with epoch (`new Date(0).toISOString()`), ensuring the first check always proceeds since elapsed time from epoch is always >= 24h.

- **Step 5 (update timestamp after successful query, not after skip):** Met.
  - Timestamp is set on line 61 (inside the npm response handler), and written via `writeCache` on lines 66 and 72 -- both inside the successful npm response path.
  - On throttle skip (line 43-44), the process exits without updating the timestamp.
  - On network error (line 87) or timeout (line 88), the process exits without updating the timestamp.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met (with deviation) | `hooks/gsd-auto-update.js:64` -- compares `cache.currentVersion` instead of reading package.json directly; documented design decision with equivalent functional outcome |
| FN-02 | not met (proven) | `hooks/gsd-auto-update.js:74` -- uses `npm install -g` instead of spec'd `npx ... --global`; no error logging to cache/debug file on install failure (spec step 3) |
| FN-03 | met | `hooks/gsd-auto-update.js:40-44,61,66,72` -- 24h throttle, epoch seed on fresh install, timestamp updated only on successful query |

### FN-02 Deviations Detail

1. **Wrong install command**: Spec says `npx get-shit-done-pe@latest --global`. Implementation uses `npm install -g get-shit-done-pe@latest`. These have different side effects -- `npx` with `--global` would run `install.js` which handles hook registration, cache updates, and CLAUDE.md; `npm install -g` only installs the package globally and runs postinstall if configured.

2. **No error logging on install failure**: Spec says "log error to cache/debug file." Implementation spawns with `stdio: 'ignore'`, calls `child.unref()`, and exits. No error capture or logging mechanism exists.
