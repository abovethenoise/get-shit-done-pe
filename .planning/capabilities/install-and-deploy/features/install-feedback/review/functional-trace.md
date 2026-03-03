# Functional Trace: install-feedback

**Reviewer:** functional
**Date:** 2026-03-03
**Files examined:** `bin/install.js`, `scripts/validate-install.js`

---

## Phase 1: Requirements Internalized

| Req | Behavior |
|-----|----------|
| FN-01 | Silent install: no stdout per step, internal pass/fail per step, on first failure capture step name + error |
| FN-02 | Auto-validation: validate-install.js runs automatically after install, failure counts as install failure |
| FN-03 | Final output: banner always, success = single line + hint, failure = single line naming step + reason, no output between banner and result |
| Must-have | readSettings() on missing/corrupt/unparseable settings.json returns known-good GSD baseline (not {}) |

---

## Phase 2: Trace Against Code

### FN-01: Silent install with result capture

**Verdict:** met

**Evidence:**

- `bin/install.js:633` -- `const failures = [];` -- Internal failure tracking array initialized per install call.
- `bin/install.js:648-649` -- `if (!verifyInstalled(gsdDest, 'commands/gsd')) { failures.push('commands/gsd'); }` -- Each step records pass/fail internally without printing.
- `bin/install.js:572-584` -- `function verifyInstalled(dirPath, description) { ... return false; }` -- Verification returns boolean silently; no console output (original logging removed).
- `bin/install.js:727-729` -- `if (failures.length > 0) { return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' }; }` -- On first failure, step name and reason captured in result object.
- `bin/install.js:738-739` -- `return { ok: false, step: 'token replacement', reason: ... }` -- Token validation failure also captured as result object.
- `bin/install.js:852` -- `return { ok: true, settingsPath, settings, statuslineCommand };` -- Success path returns structured result.
- `bin/install.js:854` -- `return { ok: false, step: 'settings.json update', reason: e.message };` -- Settings step failure captured.

No `console.log` calls exist within the `install()` function body (lines 616-856). All install steps execute silently with result objects.

**Reasoning:** The install function runs all steps without stdout, tracks failures internally per step via `verifyInstalled()` returning booleans, and returns a `{ ok, step, reason }` result object on failure or `{ ok: true, ... }` on success. This matches FN-01.

---

### FN-02: Auto-validation

**Verdict:** met

**Evidence:**

- `bin/install.js:8` -- `const { runValidation } = require('../scripts/validate-install');` -- Programmatic import of validation.
- `bin/install.js:975-988` -- Auto-validation block in `runInstall()`:
  ```javascript
  let validationResult;
  const origLog = console.log;
  const origError = console.error;
  try {
    console.log = () => {};
    console.error = () => {};
    validationResult = runValidation();
  } catch (e) {
    validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
  } finally {
    console.log = origLog;
    console.error = origError;
  }
  ```
- `bin/install.js:990-993` -- Validation failure aborts install:
  ```javascript
  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation -- ${firstFailure}\n`);
    process.exit(1);
  }
  ```
- `scripts/validate-install.js:29` -- `function runValidation(options = {})` -- Exported function returning `{ passed, failed, failures }`.
- `scripts/validate-install.js:366` -- `module.exports = { runValidation };` -- Proper export.
- `scripts/validate-install.js:368` -- `if (require.main === module)` -- Guard prevents `process.exit` when called programmatically.

**Reasoning:** Validation runs automatically after install steps complete. Validation failure is folded into the overall install failure with the first failure reason surfaced. The `require.main === module` guard ensures `process.exit` only fires in standalone mode. Exception path also handled (line 983-984).

---

### FN-03: Final output

**Verdict:** met

**Evidence:**

- `bin/install.js:71` -- `console.log(banner);` -- Banner prints unconditionally at script start (before any install logic).
- `bin/install.js:30-40` -- Banner content includes `-PE` identity:
  ```javascript
  '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
  '  Product management insight for Claude Code.\n' +
  '  by abovethenoise -- built on GSD by TACHES.\n';
  ```
- `bin/install.js:872` -- Success output:
  ```javascript
  console.log(`\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`);
  ```
  Single line + next-step hint, matching spec example.
- `bin/install.js:971` -- Failure output (install step failure):
  ```javascript
  console.log(`\n  Install failed: ${result.step} -- ${result.reason}\n`);
  ```
  Single line naming step + reason.
- `bin/install.js:992` -- Failure output (validation failure):
  ```javascript
  console.log(`\n  Install failed: post-install validation -- ${firstFailure}\n`);
  ```
  Single line naming "post-install validation" as the step + specific check that failed.
- Console suppression during validation (lines 977-987) ensures no output between banner and final result.
- No `console.log` calls exist between `banner` (line 71) and the final result messages in any code path (install steps are silent, validation is suppressed).

**Reasoning:** Banner always prints. Success produces one line with hint. Failure produces one line with step + reason. Console suppression during validation prevents intermediate noise. All three output scenarios match FN-03.

**Cross-layer observation:** The banner uses block ASCII art (lines 31-36) rather than the box-drawing example in TC-01 (the `+=====+` style). The spec example showed `+=====+` box style but this is a presentation detail, not a functional contract. The `-PE` identity and version are present as required.

---

### Must-have: readSettings() returns known-good GSD baseline on corrupt/missing settings.json

**Verdict:** not met (proven)

**Evidence:**

- `bin/install.js:114-123`:
  ```javascript
  function readSettings(settingsPath) {
    if (fs.existsSync(settingsPath)) {
      try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }
  ```
- On missing file: returns `{}` (line 122).
- On corrupt/unparseable file (JSON.parse throws): returns `{}` (line 119).

**Reasoning:** The must-have states readSettings() should return "a known-good GSD baseline -- not `{}`". The implementation returns exactly `{}` in both the missing and corrupt cases. This is explicitly called out in the execution summary (line 93): "readSettings() still returns {} on corrupt settings.json (documented must_have for known-good baseline not addressed in this plan -- requires separate implementation)". The execution team acknowledged this gap but did not implement it.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `bin/install.js:633,648,727` -- failures array + verifyInstalled() + result object return, no console output in install() |
| FN-02 | met | `bin/install.js:975-993` -- runValidation() called, suppressed, failure folded into install result; `scripts/validate-install.js:368` -- require.main guard |
| FN-03 | met | `bin/install.js:71,872,971,992` -- banner unconditional, success single line + hint, failure single line + step + reason, no intermediate output |
| Must-have (readSettings baseline) | not met (proven) | `bin/install.js:119,122` -- returns `{}` on corrupt/missing, spec requires known-good GSD baseline |
