# Review Synthesis: cc-replacement

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line references match actual code |
| functional | 4 | 4 | 0 | All line references match; cross-layer observations accurate |
| technical | 5 | 5 | 0 | Code snippets match source verbatim |
| quality | 5 | 5 | 0 | All three not-met findings verified against source |

All 19 spot-checked citations are valid. No reviewer reliability concerns.

---

## Findings

### Finding 1: ccWarnings populated but never surfaced to user

**Severity:** major
**Source:** quality, functional
**Requirement:** FN-01 ("warn user" on failure) / quality (YAGNI)
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `bin/install.js:66` -- `const ccWarnings = [];` (module-level mutable array)
- `bin/install.js:291` -- `ccWarnings.push('cc uninstall failed...')` (populated on failure)
- `bin/install.js:328` -- `return { ccWarnings };` (returned from replaceCc)
- `bin/install.js:636` -- `replaceCc(targetDir);` (return value discarded)
- Functional reviewer: "the user will not actually see it in the current implementation"
- Quality reviewer: "A warning that nobody sees is not a warning" -- YAGNI violation

**Spot-check:** verified -- line 636 discards return value; no console.log references ccWarnings anywhere in install flow.

**Recommendation:** Either surface the warning to the user via console.log (satisfying FN-01 intent) or remove ccWarnings entirely. Do not keep speculative infrastructure for a future feature.

---

### Finding 2: Duplicate gsd-check-update cleanup

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:228` -- `'gsd-check-update'` in `cleanupOrphanedHooks` orphanedHookPatterns array
- `bin/install.js:765` -- `cleanupOrphanedHooks(readSettings(settingsPath))` runs first, removing gsd-check-update from all event types including SessionStart
- `bin/install.js:787-793` -- Inline filter on `settings.hooks.SessionStart` removes gsd-check-update a second time

**Spot-check:** verified -- line 228 includes the pattern, line 765 applies it, lines 787-793 duplicate the removal.

**Recommendation:** Remove the inline filter at lines 787-793. The generic cleanup at line 765 already handles this.

---

### Finding 3: Triple-implemented gsd-* agent removal

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `bin/install.js:307-314` -- `replaceCc()` removes all `gsd-*` files (no suffix filter)
- `bin/install.js:666-673` -- `install()` removes `gsd-*.md` files (narrower pattern)
- `bin/install.js:429-441` -- `uninstall()` removes `gsd-*.md` files

**Spot-check:** verified -- during install flow, replaceCc (broader `gsd-*`) runs at line 636 before the narrower `gsd-*.md` cleanup at line 666. The second pass is always a no-op after replaceCc. The differing filter patterns (`gsd-*` vs `gsd-*.md`) are a maintenance hazard.

**Recommendation:** The install() cleanup at 666-673 is redundant after replaceCc. Consider removing it, or narrowing replaceCc's agents filter to `gsd-*.md` for consistency. The uninstall() copy is separate (different code path) and is fine to keep.

---

### Finding 4: Remnant removal count not reported to user

**Severity:** minor
**Source:** functional, technical
**Requirement:** FN-02 ("Report what was cleaned: Removed N remnant files")
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- Functional: "Spec says 'Report what was cleaned: Removed N remnant files from previous install.' No such reporting exists in replaceCc()."
- Technical: "The implementation does not log a count of removed remnants. The replaceCc() function silently removes files without any console output."
- `bin/install.js:276-329` -- No console.log statements in the entire function.

**Spot-check:** verified -- replaceCc contains zero console.log calls.

**Recommendation:** Add a counter and a single log line at the end of replaceCc when items were removed. Low effort, satisfies spec.

---

### Finding 5: EU-01 AC-1 -- cc global binary removed after pe install

**Severity:** n/a (passing)
**Source:** end-user, functional, technical
**Requirement:** EU-01 AC-1 / FN-01
**Verdict:** met (proven)

**Evidence:** `bin/install.js:279-293` -- detect via npm list, uninstall via npm uninstall, try/catch with graceful failure. All three reviewers agree. Deviation from FEATURE.md's npx approach is justified by research (upstream $HOME cwd bug).

**Spot-check:** verified.

---

### Finding 6: EU-01 AC-2 -- No orphaned cc files remain

**Severity:** n/a (passing)
**Source:** end-user, functional, technical
**Requirement:** EU-01 AC-2 / FN-02
**Verdict:** met (proven)

**Evidence:** `bin/install.js:295-326` -- unconditional scan removes gsd:* commands, gsd-* agents, get-shit-done/, hooks/dist/. All three reviewers agree.

**Spot-check:** verified.

---

### Finding 7: EU-01 AC-3 -- settings.json has pe hooks, no cc duplicates

**Severity:** n/a (passing)
**Source:** end-user, technical
**Requirement:** EU-01 AC-3 / TC-01d
**Verdict:** met (proven)

**Evidence:** `bin/install.js:765,788-846` -- orphan hooks cleaned, pe hooks added with dedup checks. Additive merge pattern (read-modify-write). Idempotent.

**Spot-check:** verified.

---

### Finding 8: EU-01 AC-4 -- CLAUDE.md delimiter management

**Severity:** n/a (passing)
**Source:** end-user, functional, technical, quality
**Requirement:** EU-01 AC-4 / FN-03
**Verdict:** met (proven)

**Evidence:** `bin/install.js:18-19,336-385,551-557` -- delimiters defined, writeClaudeMd handles create/replace/append, stripClaudeMd handles surgical strip or warn. All four reviewers agree. Quality reviewer explicitly marks these abstractions as earned.

**Spot-check:** verified.

---

### Finding 9: EU-01 AC-5 -- .planning/ never touched

**Severity:** n/a (passing)
**Source:** end-user, functional, technical
**Requirement:** EU-01 AC-5
**Verdict:** met (proven)

**Evidence:** `.planning` does not appear anywhere in install.js operative code paths. All three reviewers confirm via grep.

**Spot-check:** verified.

---

### Finding 10: TC-01 technical constraints (cross-platform, idempotent, error handling)

**Severity:** n/a (passing)
**Source:** technical
**Requirement:** TC-01a through TC-01e
**Verdict:** met (proven)

**Evidence:** stdlib-only imports (line 1-8), all existsSync guards (lines 298-325), both execSync calls try/caught (lines 279-292), read-modify-write for settings.json (line 764-765), replaceCc called before artifact copy (line 636).

**Spot-check:** verified.

---

## Conflicts

### Disagreements

None. All four reviewers agree on all requirement verdicts (all met). The three not-met findings from quality are quality-layer concerns that do not contradict the functional/end-user verdicts.

### Tensions

- **Finding 1 (ccWarnings) -- quality vs functional framing:** Quality reviewer calls this "dead code / YAGNI" and recommends removal. Functional reviewer frames it as "behavioral gap" where spec intent ("warn user") is partially unmet. Both perspectives are valid and complementary -- the fix satisfies both (either surface the warning or remove the dead code). No tiebreaker needed.

- **Finding 3 (triple agent removal) -- quality vs technical:** Quality flags the redundancy as a DRY violation. Technical reviewer notes `replaceCc` is a "clean slate" operation that should not depend on downstream copy behavior. Quality acknowledges this tension in Finding 5 (redundant get-shit-done/ removal) and calls it "defensible." The agent case is less defensible because the filter patterns differ (`gsd-*` vs `gsd-*.md`), creating a maintenance hazard.
  - Assessment: Align the filter patterns at minimum. Removing the redundant pass in install() is preferred but lower priority.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 1     |
| Minor    | 3     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01 AC-1 | met | -- | end-user, functional, technical |
| EU-01 AC-2 | met | -- | end-user, functional, technical |
| EU-01 AC-3 | met | -- | end-user, technical |
| EU-01 AC-4 | met | -- | end-user, functional, technical, quality |
| EU-01 AC-5 | met | -- | end-user, functional, technical |
| FN-01 | met (warning gap) | major | functional, quality |
| FN-02 | met (reporting gap) | minor | functional, technical |
| FN-03 | met | -- | functional, technical |
| TC-01 | met | -- | technical |
| Quality: DRY (gsd-check-update) | not met | minor | quality |
| Quality: DRY (gsd-* agents) | not met (suspected) | minor | quality |
