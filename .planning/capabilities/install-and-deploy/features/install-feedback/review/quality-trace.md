# Quality Trace: install-feedback (02-PLAN refactor)

**Reviewer posture:** guilty-until-proven-innocent
**Framing:** enhance -- "Does the enhancement avoid bloating existing modules? Are existing patterns respected?"
**Files reviewed:** `bin/install.js` (1040 lines), `scripts/validate-install.js` (383 lines), `hooks/gsd-auto-update.js` (110 lines)

---

## Phase 1: Quality Standards

Evaluating Node.js CLI code (post-refactor) for:
- DRY compliance across install, validation, and hook layers
- Error handling completeness at system boundaries
- Complexity justification for new constructs (GSD_BASELINE_SETTINGS, settingsWasCorrupt, quiet mode)
- Dead code residue after removal of monkey-patch and ccWarnings
- Idiomatic Node.js patterns for spawned subprocesses and module boundaries

---

## Phase 2: Trace Against Code

### Finding 1: settingsWasCorrupt flag derives from wrong condition

**Category:** Idiomatic Violation / Bloat

**Verdict:** not met (proven)

**Evidence:**
- `bin/install.js:783-785`:
```js
const settingsExistedBefore = fs.existsSync(settingsPath);
const settings = cleanupOrphanedHooks(readSettings(settingsPath));
const settingsWasCorrupt = !settingsExistedBefore;
```
- Reasoning: The variable is named `settingsWasCorrupt` but its value is derived from `!settingsExistedBefore` -- a file-existence check, not a corruption check. These are different conditions. A file can exist and be corrupt (invalid JSON), and `readSettings()` handles that case by returning the baseline. But `settingsWasCorrupt` will be `false` for a corrupt-but-present file, silently suppressing the warning message that was the entire point of the flag. The name misrepresents the condition, and the condition itself is incomplete.

- The message rendered at `bin/install.js:885-887` reads:
```js
if (settingsWasCorrupt) {
  msg += `  (settings.json was missing or corrupt — initialized with GSD defaults)\n`;
}
```
- This message will never fire for the "corrupt" case. Only "missing" triggers it. The "corrupt" case is silently swallowed by `readSettings()` at line 138-140 with no mechanism to surface it to the caller.

---

### Finding 2: readSettings() cannot signal corruption to its caller

**Category:** Resource Management / Error Handling

**Verdict:** not met (suspected)

**Evidence:**
- `bin/install.js:129-142`:
```js
function readSettings(settingsPath) {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.hooks) parsed.hooks = {};
    if (!Array.isArray(parsed.hooks.PostToolUse)) parsed.hooks.PostToolUse = [];
    if (!Array.isArray(parsed.hooks.SessionStart)) parsed.hooks.SessionStart = [];
    return parsed;
  } catch (e) {
    // Missing or corrupt — return known-good baseline, not {}
    return JSON.parse(JSON.stringify(GSD_BASELINE_SETTINGS));
  }
}
```
- Reasoning: The function swallows both ENOENT (missing file) and SyntaxError (corrupt JSON) and returns a baseline in both cases. This is intentional per the comment, but it means the caller at `bin/install.js:784` has no way to distinguish the three states: (1) file existed and was valid, (2) file was missing, (3) file existed but was corrupt. Finding 1 depends on this gap -- `settingsWasCorrupt` is an attempt to recover state that `readSettings()` destroyed. The design forces an awkward two-step: `fs.existsSync()` before calling `readSettings()`, which is a TOCTOU race and a leaky abstraction. If the flag matters, `readSettings()` should return it.

---

### Finding 3: Duplicated recursive directory scan logic (DRY violation, pre-existing but not resolved by refactor)

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `bin/install.js:610-628` -- `validateNoUnresolvedTokens()`, inner `scan()` function: recursive walk, checks `.md|.js|.json` extensions, scans for `{GSD_ROOT}`.
- `scripts/validate-install.js:205-218` -- `scanForTokens()`: same recursive walk, same extension filter, same `{GSD_ROOT}` check.
- `scripts/validate-install.js:299-314` -- `scanForStale()`: third copy of the same recursive walk structure with different match logic.

- `bin/install.js:750-758` runs the token scan immediately before `runValidation()` at line 994, which runs `scanForTokens()` over the identical directories. The same token check runs twice on every install with no new information gained from the first pass.

- Reasoning: Three copies of the same recursive-walk-and-match pattern. The refactor added `runValidation({ quiet: true })` to replace the monkey-patch but did not remove the now-redundant `validateNoUnresolvedTokens()` call in `install()`. This is dead weight: if validation is the authority on token correctness, the inline scan in `install()` serves no purpose.

---

### Finding 4: if/else branch with empty body (dead structure)

**Category:** Bloat / Dead Code

**Verdict:** not met (proven)

**Evidence:**
- `bin/install.js:726-730`:
```js
if (verifyInstalled(hooksDest, 'hooks')) {
  // hooks installed successfully
} else {
  failures.push('hooks');
}
```
- Reasoning: The `if` branch is a comment stub with no code. This is logically equivalent to `if (!verifyInstalled(hooksDest, 'hooks')) { failures.push('hooks'); }`. The empty affirmative branch is noise. Every other `verifyInstalled()` call in this file uses the negation pattern directly (lines 666-668, 674-676, 705-707). This is inconsistent with the established pattern in the same file and adds a blank branch that a reader must parse and dismiss.

---

### Finding 5: Error handler in auto-update hook re-reads and re-parses cache file on every spawn error

**Category:** KISS / Unnecessary Complexity

**Verdict:** not met (suspected)

**Evidence:**
- `hooks/gsd-auto-update.js:77-84`:
```js
child.on('error', (err) => {
  try {
    const errCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    errCache.lastError = err.message;
    errCache.lastErrorTime = new Date().toISOString();
    fs.writeFileSync(CACHE_PATH, JSON.stringify(errCache, null, 2) + '\n');
  } catch (e) { /* silent */ }
});
```
- Reasoning: The error handler reads the cache file from disk, parses it, mutates it, and writes it back. The `cache` object (already in-memory and already written to disk via `writeCache(cache)` at line 71) is in scope and contains all the same data. The error handler could simply do `writeCache({ ...cache, lastError: err.message, lastErrorTime: new Date().toISOString() })` without the extra disk read and parse. The disk read introduces a redundant I/O operation and a second JSON.parse that can fail independently. The added `try/catch` inside the handler is a sign the author recognized the fragility.

- Context: The error handler was added in this refactor as an improvement over no handler. The improvement is real (spawn errors are now recorded). The implementation is more complex than necessary.

---

### Finding 6: GSD_BASELINE_SETTINGS deep-cloned on every corrupt-file read

**Category:** KISS

**Verdict:** met (minor note, not a finding)

**Evidence:**
- `bin/install.js:140`:
```js
return JSON.parse(JSON.stringify(GSD_BASELINE_SETTINGS));
```
- Reasoning: The deep-clone via round-trip JSON is intentional and correct -- it prevents callers from mutating the module-level constant. The pattern is slightly verbose for Node.js (structuredClone exists in Node 17+), but it is explicit, universally understood, and safe. Not a finding.

---

### Finding 7: require.main guard and quiet-mode implementation are idiomatic and correctly applied

**Category:** Idiomatic Excellence

**Verdict:** met

**Evidence:**
- `scripts/validate-install.js:29-31`:
```js
function runValidation(options = {}) {
  const log = options.quiet ? () => {} : console.log;
  const logErr = options.quiet ? () => {} : console.error;
```
- `scripts/validate-install.js:371-383`: `require.main === module` guard correctly confines `process.exit()` to standalone invocation.
- `bin/install.js:993-997`: Caller passes `{ quiet: true }`, catches thrown errors, and maps them to the expected result shape.
- Reasoning: The refactor correctly moved from monkey-patching globals to a `quiet` option that scopes suppression to the function's own log calls. The `require.main` guard keeps the module safe for programmatic use. Both patterns are idiomatic Node.js. No finding.

---

### Finding 8: validation called before settings are written (logical sequencing gap)

**Category:** Functional Integrity

**Verdict:** not met (suspected)

**Evidence:**
- `bin/install.js:983-1013` (runInstall):
```js
const result = install(isGlobal);          // line 984 — returns settings object, does NOT write settings.json
...
validationResult = runValidation({ quiet: true });  // line 994 — validates installed state
...
handleStatusline(result.settings, isInteractive, (shouldInstallStatusline) => {
  finishInstall(                            // line 1006 — writes settings.json HERE
    result.settingsPath,
    result.settings,
    ...
  );
});
```
- `bin/install.js:873-888` (`finishInstall`): `writeSettings()` is called here, after validation.
- `scripts/validate-install.js:181-190`: Check 1 validates hooks are present in the hooks directory (file presence). It does NOT validate settings.json hook registrations.

- Reasoning: Validation runs after files are written but before `settings.json` is finalized (statusline + `writeSettings()` happen in `finishInstall`). If validation ever adds a check that reads `settings.json` hook entries, it will see incomplete state. This is a latent fragility -- not a current bug because existing validation checks do not inspect `settings.json`, but the sequence is wrong relative to the intended contract. The install is not "done" until `finishInstall()` runs, so validation should follow it.

---

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | settingsWasCorrupt derives from wrong condition | Idiomatic Violation | not met (proven) |
| 2 | readSettings() cannot signal corruption to caller | Error Handling | not met (suspected) |
| 3 | Triple-duplicated recursive dir scan / redundant token check | DRY | not met (proven) |
| 4 | Empty if-branch for verifyInstalled(hooks) | Dead Code | not met (proven) |
| 5 | Error handler in auto-update re-reads cache from disk unnecessarily | KISS | not met (suspected) |
| 6 | GSD_BASELINE_SETTINGS deep-clone pattern | KISS | met |
| 7 | quiet-mode and require.main guard | Idiomatic | met |
| 8 | Validation runs before settings.json is fully written | Functional Integrity | not met (suspected) |

**Key concern:** Findings 1 and 2 are the same design gap viewed from two directions. `readSettings()` swallows all error state, forcing the caller to reconstruct it via a pre-flight `fs.existsSync()` that still does not cover the corrupt case. The `settingsWasCorrupt` flag was the intended fix but solves only half the problem and is misleadingly named. Finding 3 (redundant token scan) is the most straightforward cleanup -- `validateNoUnresolvedTokens()` in `install()` is now dead weight given that `runValidation()` checks the same thing immediately after.
