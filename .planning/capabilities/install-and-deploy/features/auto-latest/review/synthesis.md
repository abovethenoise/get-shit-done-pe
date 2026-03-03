# Review Synthesis: auto-latest

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line references accurate |
| functional | 5 | 5 | 0 | Self-corrected FN-01 step 7 mid-trace; final verdicts accurate |
| technical | 4 | 4 | 0 | Line numbers match code exactly |
| quality | 5 | 5 | 0 | All line references and code quotes verified |

All 19 spot-checked citations match the actual source code. No reviewer reliability concerns.

---

## Findings

### Finding 1: No error logging on background install failure

**Severity:** major
**Source:** functional
**Requirement:** FN-02 step 3
**Verdict:** not met (proven)

**Evidence (from functional reviewer):**
- `hooks/gsd-auto-update.js:74-78` -- `spawn('npm', [...], { detached: true, stdio: 'ignore' })` with `child.unref()`
- Spec says: "If install fails: log error to cache/debug file, continue with current version."
- No error handler on the child process, no logging of install failures anywhere.

**Spot-check:** verified -- confirmed no error capture mechanism exists in the hook. The child process is fire-and-forget with no feedback path.

**Recommendation:** Add a child `error` event handler that writes failure info to the cache directory (e.g., `~/.claude/get-shit-done/.update-error`). Keep it silent to the user but observable for debugging.

---

### Finding 2: Install command deviates from spec

**Severity:** major
**Source:** functional, technical, end-user
**Requirement:** FN-02 step 1
**Verdict:** not met (proven) -- spec deviation, implementation arguably correct

**Evidence (from functional reviewer):**
- `hooks/gsd-auto-update.js:74` -- `spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], ...)`
- Spec says: "Run `npx get-shit-done-pe@latest --global` in background."
- Technical reviewer notes: "`npx` runs a package's bin entry, it does not install globally. `npm install -g` is the correct command. The spec was wrong."

**Spot-check:** verified -- line 74 uses `npm install -g`, not `npx`.

**Recommendation:** Update the spec (FN-02) to match implementation. The implementation is correct; `npx` is not an installation command. No code change needed.

---

### Finding 3: Redundant gsd-check-update orphan cleanup (DRY)

**Severity:** minor
**Source:** quality, technical
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from quality reviewer):**
- `bin/install.js:228` -- `'gsd-check-update'` in `orphanedHookPatterns` array
- `bin/install.js:788-793` -- inline `SessionStart.filter()` removing the same `gsd-check-update` pattern
- Technical reviewer calls this "defense-in-depth." Quality reviewer disagrees: "duplicated cleanup logic is not defense-in-depth -- it is redundant code."

**Spot-check:** verified -- both cleanup paths confirmed in source. The `cleanupOrphanedHooks()` at line 765 processes all hook event types including SessionStart.

**Recommendation:** Remove the inline filter at lines 788-793. The orphanedHookPatterns mechanism already handles this.

---

### Finding 4: currentVersion not updated after background install

**Severity:** minor
**Source:** quality, end-user, functional
**Requirement:** quality (Robustness)
**Verdict:** not met (suspected) -- self-healing but wasteful

**Evidence (from quality reviewer):**
- `hooks/gsd-auto-update.js:70-72` -- cache written with old `currentVersion` before spawning update
- After a successful background install, the next 24h-cycle check will see stale `currentVersion`, triggering one redundant `npm install -g` before the postinstall re-seeds the cache.
- End-user reviewer: "This works because `npm install -g` re-runs the postinstall script... If postinstall is not configured or fails, the cache would be stale and the hook would trigger another update attempt -- a safe degradation."

**Spot-check:** verified -- line 71 writes `cache.currentVersion = cache.currentVersion || 'unknown'`, never the new `latestVersion`.

**Recommendation:** Write `latestVersion` to `cache.currentVersion` before spawning the update (line 71: `cache.currentVersion = latestVersion`). Prevents one redundant install cycle.

---

### Finding 5: Unnecessary JSON.parse of stdin

**Severity:** minor
**Source:** quality
**Requirement:** quality (KISS)
**Verdict:** not met (suspected)

**Evidence (from quality reviewer):**
- `hooks/gsd-auto-update.js:29` -- `try { JSON.parse(input); } catch (e) { /* ignore parse errors */ }`
- Result is discarded. Draining is accomplished by the `data`/`end` listeners on lines 24-26. The parse allocates an object that is immediately GC'd.

**Spot-check:** verified -- line 29 parses but never assigns the result.

**Recommendation:** Remove the `JSON.parse(input)` line. The stdin drain contract is already fulfilled by reading into the `input` variable.

---

### Finding 6: Install/uninstall hook lists maintained separately (DRY)

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (suspected) -- pre-existing debt, not a regression

**Evidence (from quality reviewer):**
- `bin/install.js:447` -- uninstall list: `['gsd-statusline.js', 'gsd-context-monitor.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js']`
- `bin/install.js:701` -- install list: `['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js']`
- Same hooks, two independent arrays. Adding a new hook requires updating both.

**Spot-check:** verified -- both arrays confirmed, same members in different order.

**Recommendation:** Extract a single `GSD_HOOKS` constant at module scope. Pre-existing debt; not blocking for this feature.

---

### Finding 7: Cache path duplicated across hook and install.js

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (suspected) -- justified by execution model

**Evidence (from quality reviewer):**
- `hooks/gsd-auto-update.js:19-20` -- `CACHE_DIR` and `CACHE_PATH` constants
- `bin/install.js:743-744` -- identical path construction
- Quality reviewer acknowledges this is "a pragmatic trade-off" since the hook runs as a standalone process.

**Spot-check:** verified -- identical path strings in both files.

**Recommendation:** Accept as-is. The hook's standalone execution model makes shared modules impractical. Document the coupling in a comment.

---

## Conflicts

### Disagreements

- **FN-01 verdict (version comparison source):** Functional reviewer initially marked FN-01 as "not met" because the hook compares `cache.currentVersion` instead of reading `package.json` directly per spec. Functional reviewer then self-corrected to "met (with deviation)." End-user reviewer marked it "met" without flagging the deviation. Technical reviewer noted it as a spec gap but gave "met."
  - Resolution: All three converge on "met with documented deviation." The behavioral outcome is equivalent. No action needed beyond ensuring the spec is updated to reflect the cache-based design.
  - Tiebreaker applied: no

- **Redundant orphan cleanup -- defense-in-depth vs DRY:** Technical reviewer characterizes the dual `gsd-check-update` cleanup as "defense-in-depth." Quality reviewer calls it a DRY violation.
  - Resolution: Quality reviewer is correct. Both code paths target the same data structure (`SessionStart` entries). The `orphanedHookPatterns` mechanism is the canonical cleanup path and already covers `SessionStart`. The inline filter is redundant, not defensive.
  - Tiebreaker applied: no (judgment sufficient)

### Tensions

- **Spec correctness vs implementation correctness (FN-02 install command):** Functional reviewer flags the `npm install -g` vs `npx --global` deviation as "not met." Technical reviewer says "the spec was wrong." End-user reviewer notes it as "a spec-vs-implementation text mismatch, not a behavioral defect."
  - Assessment: Both perspectives are valid. The implementation is correct (npm install -g is the right command). The spec needs updating. Score this as a spec defect, not an implementation defect. FN-02 remains "not met" only for the missing error logging (step 3), not for the install command choice.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 5     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01 | met | -- | end-user |
| FN-01 | met (with deviation) | -- | functional |
| FN-02 | not met (proven) | major | functional |
| FN-03 | met | -- | functional |
| TC-01 | met | -- | technical |
| Quality: DRY (orphan cleanup) | not met (proven) | minor | quality |
| Quality: KISS (JSON.parse) | not met (suspected) | minor | quality |
| Quality: Robustness (stale cache) | not met (suspected) | minor | quality, end-user |
| Quality: DRY (hook lists) | not met (suspected) | minor | quality |
| Quality: DRY (cache path) | not met (suspected) | minor | quality |
