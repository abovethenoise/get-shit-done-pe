---
type: review-synthesis
feature: install-feedback
plan: 02-PLAN (refactor)
synthesized: "2026-03-03"
reviewers: end-user, functional, technical, quality
---

## Review Synthesis

### Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | banner lines 46-56, silent install lines 634-868, runValidation line 993, success msg line 884, fail msg line 987 — all verified |
| functional | 5 | 5 | 0 | settingsWasCorrupt chain lines 783-785/864/1011, readSettings lines 129-142, require.main guard line 371 — all verified |
| technical | 4 | 4 | 0 | TC-01.2 suppress lines 30-31, TC-01.3 return shape lines 362-367, TC-01.6 gap lines 783-785, TC-01.8 ccWarnings lines 294-347 — all verified |
| quality | 5 | 5 | 0 | settingsWasCorrupt lines 783-785, readSettings lines 129-142, empty if-branch lines 726-730, auto-update handler lines 77-84, validation sequence lines 983-1013 — all verified |

No citation failures across any reviewer. All four reports carry full confidence.

---

### Findings

#### Finding 1: settingsWasCorrupt flag detects only missing file, not corrupt JSON

**Severity:** major
**Source:** functional (partial verdict), technical (documented gap), quality (Finding 1 + Finding 2)
**Requirement:** 02-PLAN must-have — settingsWasCorrupt flag propagated to finishInstall message
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `bin/install.js:783-785`:
  ```js
  const settingsExistedBefore = fs.existsSync(settingsPath);
  const settings = cleanupOrphanedHooks(readSettings(settingsPath));
  const settingsWasCorrupt = !settingsExistedBefore;
  ```
  Flag is set from a file-existence check, not a corruption check. If settings.json exists but contains invalid JSON, `readSettings()` returns the baseline silently and `settingsWasCorrupt` remains `false`.
- `bin/install.js:884-887` — warning message `"settings.json was missing or corrupt — initialized with GSD defaults"` never fires for the corrupt-but-present case.
- `bin/install.js:129-142` — `readSettings()` swallows both ENOENT and SyntaxError in a single catch block, returning the baseline in both cases with no signal to the caller. The caller has no mechanism to distinguish "file missing" from "file existed but was corrupt."

**Spot-check:** verified — `bin/install.js:783-785` and `bin/install.js:129-142` confirmed exactly as quoted by all three reviewers.

**Quality reviewer framing (Finding 2):** The design forces a leaky two-step — `fs.existsSync()` before `readSettings()` — that still does not cover the corrupt case. If the flag matters, `readSettings()` should return it as part of its result. The current approach is a TOCTOU risk and a leaky abstraction.

---

#### Finding 2: Validation runs before settings.json is fully written

**Severity:** major
**Source:** quality (Finding 8)
**Requirement:** FN-02 / TC-01 (functional integrity of auto-validation)
**Verdict:** not met (suspected — latent fragility, not current bug)

**Evidence (from reviewer):**
- `bin/install.js:984` — `install(isGlobal)` returns a settings object; it does NOT write settings.json.
- `bin/install.js:994` — `runValidation({ quiet: true })` runs here.
- `bin/install.js:1006-1013` — `finishInstall(...)` is where `writeSettings()` is called — after validation.
- `scripts/validate-install.js:181-190` — Check 1 validates hook file presence only; no existing check reads settings.json hook registrations.
- Reasoning: Validation runs after files are written to disk but before settings.json is finalized. Current checks do not inspect settings.json, so no current bug exists. However, the install contract is not fulfilled until `finishInstall()` completes. If a future validation check reads settings.json hook registrations, it will see incomplete state.

**Spot-check:** verified — `bin/install.js:983-1013` confirmed. `runValidation` at line 994 precedes `finishInstall` at line 1006. Sequence is exactly as described.

---

#### Finding 3: Banner ASCII art does not present "-PE" as a visible identity marker

**Severity:** major
**Source:** end-user
**Requirement:** EU-01-AC1 — banner displays with -PE identity (ASCII art mirrors existing style)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:46-56` — ASCII block art spells "GSD" using filled-block characters (`██`, `╔══╝`). "-PE" appears only in the lowercase tagline `get-shit-done-pe` at line 54, not as a visual element of the ASCII art itself.
- `bin/install.js:86` — `console.log(banner);` — banner prints unconditionally.
- Reviewer reasoning: The FEATURE.md TC-01 example shows `Get Shit Done -PE` as the product name, rendered in box-drawing border style (`╔═══╗`). The implementation renders a different style (filled-block) and spells a different identifier (GSD, not -PE). Style diverges and the product's "-PE" suffix has no visual prominence in the rendered output.

**Spot-check:** verified — `bin/install.js:46-56` confirmed. Filled-block art characters spell "GSD". Line 54 reads `'  get-shit-done-pe '` in lowercase only.

**Note:** No other reviewer challenges this finding. Severity set to major (not blocker) because the banner renders successfully and the package is identifiable — this is a spec conformance issue on style and identity presentation, not a functional failure.

---

#### Finding 4: Duplicate recursive directory scan logic / redundant token check

**Severity:** minor
**Source:** quality (Finding 3)
**Requirement:** quality — DRY
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:610-628` — `validateNoUnresolvedTokens()`, inner `scan()` function: recursive walk, `.md|.js|.json`, checks `{GSD_ROOT}`.
- `scripts/validate-install.js:205-218` — `scanForTokens()`: same recursive walk, same extension filter, same token check.
- `scripts/validate-install.js:299-314` — `scanForStale()`: third instance of same recursive walk with different match logic.
- `bin/install.js:750-758` — token scan in `install()` runs and then `runValidation()` at line 994 runs `scanForTokens()` over the identical directories immediately after. Same check runs twice per install.

**Spot-check:** not independently verified in full, but quality reviewer's citation is internally consistent and the redundancy logic is sound given the confirmed call sequence at lines 750-994.

---

#### Finding 5: Empty if-branch for hooks verifyInstalled check

**Severity:** minor
**Source:** quality (Finding 4)
**Requirement:** quality — dead code / inconsistent pattern
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:726-730`:
  ```js
  if (verifyInstalled(hooksDest, 'hooks')) {
    // hooks installed successfully
  } else {
    failures.push('hooks');
  }
  ```
- All other `verifyInstalled()` calls in the same function use the negation pattern directly: `if (!verifyInstalled(...)) { failures.push(...); }` at lines 666-668, 674-676, 705-707.
- The affirmative branch contains only a comment stub. Logically equivalent to the negation form used everywhere else.

**Spot-check:** verified — `bin/install.js:726-730` confirmed exactly as quoted.

---

#### Finding 6: Auto-update error handler re-reads cache from disk unnecessarily

**Severity:** minor
**Source:** quality (Finding 5)
**Requirement:** quality — KISS
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
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
- The `cache` object is already in-scope and was written to disk at line 71 via `writeCache(cache)`. The handler could extend `cache` directly without a redundant disk read and second JSON.parse. The inner `try/catch` indicates the author recognized the fragility introduced by the extra I/O.
- The improvement over no error handler is real; the implementation is more complex than necessary.

**Spot-check:** not independently verified (hooks/gsd-auto-update.js not read in full). Citation is specific and internally consistent.

---

### Conflicts

#### Disagreements

- **settingsWasCorrupt verdict label:** Functional reviewer calls it "partial." Technical reviewer calls it "met (proven), with a documented detection gap." Quality reviewer calls it "not met (proven)."
  - Resolution: The `readSettings()` baseline behavior (returning GSD_BASELINE_SETTINGS instead of `{}`) is met and is a distinct question from the flag accuracy. The `settingsWasCorrupt` flag for the corrupt-but-present case is not met — the warning message never fires for that case, which is the stated purpose of the flag. Synthesized verdict for Finding 1: not met. Technical reviewer's "met" label was applied to too broad a scope; functional reviewer's "partial" is closest to accurate.
  - Tiebreaker applied: no — judgment sufficient.

- **Banner verdict (EU-01-AC1):** End-user marks "not met (proven)." Functional reviewer's summary table says "met" for EU-01 AC-1, citing `bin/install.js:30-40,71`. Technical reviewer does not address this criterion.
  - Resolution: End-user priority applies. The end-user reviewer examined the criterion most closely against the spec example. Functional reviewer's "met" appears to address presence of a banner generally, not the "-PE identity" and style specifics. End-user verdict accepted.
  - Tiebreaker applied: yes — end-user > functional priority ordering.

#### Tensions

- **Validation sequencing (Finding 2) vs. FN-02 "met" verdict:** Functional and technical reviewers mark FN-02 met because auto-validation runs unconditionally and failures propagate. Quality flags the pre-`finishInstall` sequencing as latent fragility. These are not contradictory — both are simultaneously true.
  - Assessment: FN-02 is met against its current spec and current validation scope. Finding 2 is a design risk that should be resolved before any future validation check is added that reads settings.json. Both findings coexist; neither invalidates the other.

- **readSettings() design:** Quality recommends `readSettings()` return a structured result including a corruption flag, eliminating the leaky `fs.existsSync()` pre-flight. Functional and technical confirm the baseline return behavior is correct and accept the two-step approach. Quality's recommendation is architecturally sounder; the functional/technical verdicts are correct for the narrower baseline question.
  - Assessment: The design recommendation should accompany any fix to Finding 1. The leaky abstraction is the root cause; fixing the flag without fixing the design produces the same class of bug on the next edge case.

---

### Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 3     |
| Minor    | 3     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| settingsWasCorrupt flag (corrupt-but-present) | not met | major | functional, technical, quality |
| Validation sequence before writeSettings | not met (suspected) | major | quality |
| EU-01-AC1 (banner -PE identity) | not met | major | end-user |
| DRY — duplicate recursive scan / redundant token check | not met | minor | quality |
| Dead code — empty if-branch hooks check | not met | minor | quality |
| KISS — auto-update error handler disk re-read | not met | minor | quality |
| EU-01-AC2 / FN-01 (silent install) | met | — | end-user, functional, technical |
| EU-01-AC3 / FN-02 (auto-validation) | met | — | end-user, functional, technical |
| EU-01-AC4 (single pass message + hint) | met | — | end-user, functional |
| EU-01-AC5 / FN-03 (single fail message + step) | met | — | end-user, functional, technical |
| EU-01-AC6 (no intermediate noise) | met | — | end-user, functional |
| TC-01.1 (npx + node contexts) | met | — | technical |
| TC-01.2 (options.quiet, no monkey-patch) | met | — | technical, functional |
| TC-01.3 (validate-install.js programmatic) | met | — | technical, functional |
| TC-01.4 (human-readable errors, no stack traces) | met | — | technical |
| TC-01.5 (result object shape) | met | — | technical |
| TC-01.6 (readSettings() baseline behavior) | met | — | functional, technical |
| TC-01.7 (auto-update child.on error handler) | met | — | technical |
| TC-01.8 (ccWarnings dead code removed) | met | — | functional, technical |
| TC-01.9 (log/logErr pattern complete) | met | — | technical |
