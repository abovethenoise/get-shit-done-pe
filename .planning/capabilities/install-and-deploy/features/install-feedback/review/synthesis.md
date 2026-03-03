# Review Synthesis: install-feedback

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line numbers and code snippets match source |
| functional | 4 | 4 | 0 | All line numbers and code snippets match source |
| technical | 5 | 5 | 0 | All line numbers and code snippets match source |
| quality | 4 | 4 | 0 | All line numbers and code snippets match source |

All 18 spot-checked citations verified against source. High confidence in all four reviewer reports.

---

## Findings

### Finding 1: readSettings() returns {} instead of known-good GSD baseline

**Severity:** blocker
**Source:** end-user, functional, technical (all three independently flagged)
**Requirement:** Must-have from plan
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `bin/install.js:114-123` -- `readSettings()` returns `{}` on both missing and corrupt/unparseable settings.json
- Plan must-have states: "readSettings() on missing/corrupt/unparseable settings.json returns a known-good GSD baseline (minimum required hooks, permissions, deny rules for a working pe install) -- not {}"
- Execution summary line 93 acknowledges: "readSettings() still returns {} on corrupt settings.json (documented must_have for known-good baseline not addressed in this plan -- requires separate implementation)"

**Spot-check:** verified -- `bin/install.js:114-123` confirmed, returns `{}` at lines 119 and 122.

**Recommendation:** Implement the known-good baseline return. This was an explicit must-have, not a nice-to-have. The execution team acknowledged the gap and deferred it. Needs its own follow-up work item.

---

### Finding 2: Console suppression via monkey-patching globals

**Severity:** major
**Source:** quality
**Requirement:** quality (unnecessary abstraction)
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `bin/install.js:977-988` -- `console.log` and `console.error` replaced with no-ops during `runValidation()`, restored in `finally` block
- `scripts/validate-install.js:29` -- `runValidation(options = {})` already accepts an `options` parameter that is never read
- Reasoning: The `options` parameter was scaffolded for exactly this purpose (a `quiet` mode). Using it would eliminate the monkey-patch entirely.

**Spot-check:** verified -- `bin/install.js:977-988` matches quoted code exactly; `validate-install.js:29` confirms unused `options = {}`.

**Recommendation:** Add a `quiet` option to `runValidation()` that suppresses its internal console output. Remove the monkey-patch from `bin/install.js`. This is a cleaner boundary between the two modules.

---

### Finding 3: Triple-duplicated recursive directory scan logic

**Severity:** major
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:592-610` -- `validateNoUnresolvedTokens()` with recursive `scan()` inner function
- `scripts/validate-install.js:202-215` -- `scanForTokens()` with identical structure
- `scripts/validate-install.js:296-309` -- `scanForStale()` with same recursive traversal, different match logic
- The install.js token scan (lines 732-740) is redundant with validation's token scan since `runValidation()` now runs immediately after `install()`

**Spot-check:** verified -- all three scan functions confirmed at cited lines with near-identical structure.

**Recommendation:** Since validation runs immediately after install, the token check in `install()` is redundant. Remove it from `install()` and rely on validation. If a shared scan utility is warranted, extract one, but removing the redundant call is the simpler fix.

---

### Finding 4: Unused options parameter on runValidation()

**Severity:** minor
**Source:** quality
**Requirement:** quality (bloat)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `scripts/validate-install.js:29` -- `function runValidation(options = {})` -- parameter never read in function body
- `bin/install.js:982` -- called as `runValidation()` with no arguments

**Spot-check:** verified -- confirmed at both cited lines.

**Recommendation:** Either implement the `quiet` option (solves Finding 2 simultaneously) or remove the parameter. Do not leave scaffolding that implies unused functionality.

**Note:** Findings 2, 3, and 4 are interconnected as the quality reviewer observed -- they represent a single design gap in the install/validation boundary.

---

### Finding 5: Duplicated color constant declarations

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `bin/install.js:11-15` -- `cyan`, `green`, `yellow`, `dim`, `reset`
- `scripts/validate-install.js:23-27` -- `green`, `red`, `yellow`, `dim`, `reset`
- Four constants (`green`, `yellow`, `dim`, `reset`) are identical across both files

**Spot-check:** verified -- both locations confirmed with matching ANSI escape codes.

**Recommendation:** Low priority. Tolerable for a two-file feature. Could extract to a shared module if the install/validation boundary is cleaned up per Findings 2-4.

---

### Finding 6: Interactive prompts may insert output between banner and result

**Severity:** minor
**Source:** end-user
**Requirement:** EU-01 AC-6 (no intermediate noise)
**Verdict:** met (with caveat)

**Evidence (from reviewer):**
- In the interactive path (no `--global`/`--local` flag), `promptLocation()` and `handleStatusline()` insert user-facing prompts between banner and final result
- The spec lists "Interactive prompts during install" as out of scope
- The non-interactive path (`--global`) produces clean: banner -> silence -> result

**Spot-check:** not checked (edge case, met verdict)

**Recommendation:** Awareness only. The non-interactive path meets the spec. Existing interactive prompts predate this feature and were not in scope for removal.

---

### Finding 7: Banner style diverges from FEATURE.md example

**Severity:** minor
**Source:** functional, technical (both noted as cross-layer observation)
**Requirement:** EU-01 AC-1 / FN-03 / TC-01.7
**Verdict:** met

**Evidence (from reviewers):**
- `bin/install.js:30-40` -- Banner uses large ASCII block letters for "GSD" with descriptive text below
- FEATURE.md example showed a box-drawing style (`+=====+`)
- Both reviewers agree the example was illustrative, not prescriptive
- The -PE identity, version, and attribution are all present

**Spot-check:** not checked (met verdict, presentational detail)

**Recommendation:** No action needed. The banner satisfies the functional requirements.

---

### Finding 8: Result object field name diverges from plan key_links

**Severity:** minor
**Source:** technical
**Requirement:** TC-01.5
**Verdict:** met

**Evidence (from reviewer):**
- Plan key_links references `{ failed: false }` / `{ failed: true, step, reason }`
- Implementation uses `{ ok: true }` / `{ ok: false, step, reason }`
- Plan interfaces block (normative) correctly specifies `ok: boolean`

**Spot-check:** verified -- `bin/install.js:728,852` confirmed using `ok` field.

**Recommendation:** No action needed. Implementation follows the normative interfaces spec. The key_links metadata was inconsistent but non-normative.

---

## Met Requirements (no issues)

All reviewers confirmed these as met with consistent evidence:

| Requirement | Description | Key Evidence |
|------------|-------------|--------------|
| EU-01 AC-1 | Banner with -PE identity | `bin/install.js:30-40,71` |
| EU-01 AC-2 / FN-01 | Silent install (no per-step output) | `bin/install.js:616-856` -- zero console.log in install() |
| EU-01 AC-3 / FN-02 | Auto-validation runs after install | `bin/install.js:975-988` -- runValidation() called programmatically |
| EU-01 AC-4 | Single pass message + hint | `bin/install.js:872` |
| EU-01 AC-5 / FN-03 | Single fail message naming step | `bin/install.js:971,992` |
| TC-01.1 | Works in npx and node contexts | `bin/install.js:1,8,617` -- shebang, relative require, __dirname |
| TC-01.3 | validate-install.js callable programmatically | `scripts/validate-install.js:29,366,368` |
| TC-01.4 | Human-readable error messages | `bin/install.js:971,992` -- no stack traces |
| TC-01.9 | askuserquestion hook in validation | `scripts/validate-install.js:179` |
| Quality: require.main guard | Idiomatic Node.js dual-use pattern | `scripts/validate-install.js:368-380` |
| Quality: result object pattern | Clean, testable, composable | `bin/install.js:728,852` |

---

## Conflicts

### Disagreements

None. All four reviewers reached consistent verdicts on every requirement. The readSettings() gap was independently flagged by end-user, functional, and technical reviewers with identical evidence and reasoning.

### Tensions

- **Scope of readSettings() fix:** The technical reviewer notes this must-have "touches install logic correctness (settings recovery), not install output/UX which is the stated intent" and characterizes the deferral as reasonable scoping. The end-user and functional reviewers treat it as an unmet must-have without qualification. Resolution: the plan explicitly listed it as a must-have, so it is not met regardless of whether the scope was well-drawn. However, the technical reviewer's framing is useful context -- this is better addressed as a separate work item than a blocker on shipping the UX changes.

- **Console suppression severity:** The quality reviewer flags the monkey-patch as "not met (suspected)" with a clear alternative (the unused `options` parameter). The functional and end-user reviewers accept the suppression as meeting the "no intermediate noise" requirement. Assessment: both perspectives are valid. The suppression achieves the functional goal but is technically fragile. The quality finding stands as an improvement opportunity that should be bundled with the `options` parameter cleanup.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 1     |
| Major    | 2     |
| Minor    | 5     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| Must-have: readSettings baseline | not met | blocker | end-user, functional, technical |
| Quality: console monkey-patch | not met (suspected) | major | quality |
| Quality: DRY (triple dir scan) | not met (proven) | major | quality |
| Quality: unused options param | not met (proven) | minor | quality |
| Quality: DRY (color constants) | not met (proven) | minor | quality |
| EU-01 AC-6 (interactive caveat) | met (caveat) | minor | end-user |
| TC-01.7 / FN-03 (banner style) | met | minor | functional, technical |
| TC-01.5 (result field name) | met | minor | technical |
| EU-01 AC-1 (banner) | met | -- | end-user, functional, technical |
| EU-01 AC-2 / FN-01 (silent) | met | -- | end-user, functional |
| EU-01 AC-3 / FN-02 (auto-val) | met | -- | end-user, functional, technical |
| EU-01 AC-4 (pass msg) | met | -- | end-user, functional |
| EU-01 AC-5 / FN-03 (fail msg) | met | -- | end-user, functional |
| TC-01.1 (npx/node) | met | -- | technical |
| TC-01.3 (programmatic val) | met | -- | technical |
| TC-01.4 (human errors) | met | -- | technical |
| TC-01.9 (hook in validation) | met | -- | technical |
