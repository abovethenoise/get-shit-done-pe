# Functional Trace: install-feedback (post 02-PLAN)

**Reviewer:** functional
**Date:** 2026-03-03
**Files examined:** `bin/install.js`, `scripts/validate-install.js`
**Context:** Re-trace against code after 02-PLAN refactor. Prior trace (pre-02-PLAN) found readSettings() returning `{}` — this trace confirms whether that blocker was resolved along with all other requirements.

---

## Phase 1: Requirements Internalized

| Req | Behavior contract |
|-----|-------------------|
| FN-01 | Silent install: each step records pass/fail internally, no stdout during install steps |
| FN-02 | Auto-validation: validate-install.js runs automatically after install; failure = install failure |
| FN-03 | Banner always; success = single pass line + hint; failure = single fail line + step name; nothing between banner and result |
| TC-01 | install.js output restructured: console.log suppressed during validation, validate-install callable programmatically via options.quiet |
| 02-PLAN must-have | readSettings() returns GSD_BASELINE_SETTINGS (not {}) on missing/corrupt; settingsWasCorrupt flag propagated to finishInstall message; ccWarnings dead code removed |

---

## Phase 2: Trace Against Code

### FN-01: Silent install with result capture

**Verdict:** met

**Evidence:**

- `bin/install.js:651` — `const failures = [];` — per-call internal failure accumulator initialized before any step.
- `bin/install.js:666-668` — `if (!verifyInstalled(gsdDest, 'commands/gsd')) { failures.push('commands/gsd'); }` — step records failure silently; no console call at this site.
- `bin/install.js:674-676` — same pattern for `get-shit-done` step.
- `bin/install.js:705-707` — same pattern for `agents` step.
- `bin/install.js:726-730` — same pattern for `hooks` step.
- `bin/install.js:745-747` — `if (failures.length > 0) { return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' }; }` — first failure captured with step name, returned as structured object.
- `bin/install.js:756-758` — `return { ok: false, step: 'token replacement', reason: ... }` — token validation failure captured identically.
- `bin/install.js:864` — `return { ok: true, settingsPath, settings, statuslineCommand, settingsWasCorrupt };` — success path returns structured result.
- `bin/install.js:866` — `return { ok: false, step: 'settings.json update', reason: e.message };` — settings failure captured.

No `console.log` or `console.error` calls exist within the `install()` function body (lines 634-867). All steps execute without producing output; results flow through return values only.

**Reasoning:** Every install step either pushes to `failures[]` or returns early with `{ ok: false, step, reason }`. No stdout is produced during the install steps. Contract fully met.

---

### FN-02: Auto-validation

**Verdict:** met

**Evidence:**

- `bin/install.js:8` — `const { runValidation } = require('../scripts/validate-install');` — programmatic import present.
- `bin/install.js:992-997` — auto-validation block in `runInstall()`:
  ```js
  let validationResult;
  try {
    validationResult = runValidation({ quiet: true });
  } catch (e) {
    validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
  }
  ```
  Validation runs unconditionally after `install()` returns `ok: true`. Exception path produces a failure result with message.
- `bin/install.js:999-1003` — failure check:
  ```js
  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }
  ```
  Validation failure terminates the process with exit code 1, satisfying "failure = install failure".
- `scripts/validate-install.js:362-366` — return contract: `return { passed: passedChecks, failed: failedChecks, failures: failures }` — `failures[]` populated by `fail()` calls.
- `scripts/validate-install.js:371` — `if (require.main === module)` — guard prevents `process.exit` when called programmatically from install.js.

**Reasoning:** validate-install.js runs automatically on every successful install, returns a structured result, and its failure is folded into the install outcome. The `require.main` guard prevents standalone exit behavior from firing during programmatic call. Contract fully met.

---

### FN-03: Final output

**Verdict:** met

**Evidence:**

- `bin/install.js:86` — `console.log(banner);` — banner prints unconditionally at module load, before any logic branches.
- `bin/install.js:986-988` — install step failure output:
  ```js
  console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);
  process.exit(1);
  ```
  Single line naming step + reason.
- `bin/install.js:999-1002` — validation failure output:
  ```js
  console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
  process.exit(1);
  ```
  Single line; step is "post-install validation", reason is the first failing check name.
- `bin/install.js:884-888` — success output in `finishInstall()`:
  ```js
  let msg = `\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`;
  if (settingsWasCorrupt) {
    msg += `  (settings.json was missing or corrupt — initialized with GSD defaults)\n`;
  }
  console.log(msg);
  ```
  Single pass line + hint. Optional corrupt-settings note appended when relevant.
- `scripts/validate-install.js:30` — `const log = options.quiet ? () => {} : console.log;` — all internal check output suppressed when `quiet: true` is passed. No intermediate output reaches stdout during validation when called from install.js.

**Reasoning:** Banner is unconditional. Install step failures and validation failures each produce exactly one line with step + reason. Success produces one line with hint. No output exists between banner and result in any code path. Contract fully met.

---

### TC-01: install.js output restructuring

**Verdict:** met

**Evidence:**

- `bin/install.js:8` — `const { runValidation } = require('../scripts/validate-install');` — validate-install.js imported as a module, not shelled out.
- `bin/install.js:994` — `validationResult = runValidation({ quiet: true });` — `options.quiet` pattern used directly. No console monkey-patch (`console.log = () => {}` / `finally` restore) exists anywhere in the current file.
- `scripts/validate-install.js:29` — `function runValidation(options = {})` — accepts options object.
- `scripts/validate-install.js:30-31` — `const log = options.quiet ? () => {} : console.log;` / `const logErr = options.quiet ? () => {} : console.error;` — quiet mode implemented internally via no-op function assignment.
- `scripts/validate-install.js:42-55` — `pass()` and `fail()` both call `log(...)` not `console.log`, so they respect quiet mode.
- `scripts/validate-install.js:358-361` — summary output also uses `log(...)`.
- `scripts/validate-install.js:371-382` — standalone block uses real `console.log` directly, preserving visible output when run as a script.

**Reasoning:** The monkey-patch approach from the pre-02-PLAN state no longer exists. Output suppression is clean and internal to validate-install.js via `options.quiet`. The function is callable programmatically with full output control. Contract fully met.

---

### 02-PLAN Must-haves

#### readSettings() returns GSD_BASELINE_SETTINGS on failure

**Verdict:** met

**Evidence:**

- `bin/install.js:18-31` — `GSD_BASELINE_SETTINGS` constant defined at module level with `permissions.deny` array and `hooks.PostToolUse`/`hooks.SessionStart` arrays.
- `bin/install.js:129-141` — `readSettings()` implementation:
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
      return JSON.parse(JSON.stringify(GSD_BASELINE_SETTINGS));
    }
  }
  ```
  Missing file (throws on readFileSync) and corrupt JSON (throws on JSON.parse) both land in the catch block. Return value is a deep copy of `GSD_BASELINE_SETTINGS`, not `{}`.

**Reasoning:** Both failure modes — missing file and unparseable JSON — return the known-good baseline. Deep copy via `JSON.parse(JSON.stringify(...))` prevents mutation of the shared constant. The pre-02-PLAN "not met" finding is resolved.

#### settingsWasCorrupt flag propagated to finishInstall message

**Verdict:** partial

**Evidence:**

- `bin/install.js:783` — `const settingsExistedBefore = fs.existsSync(settingsPath);`
- `bin/install.js:784` — `const settings = cleanupOrphanedHooks(readSettings(settingsPath));`
- `bin/install.js:785` — `const settingsWasCorrupt = !settingsExistedBefore;` — flag set only when file was absent before the call.
- `bin/install.js:864` — `return { ok: true, settingsPath, settings, statuslineCommand, settingsWasCorrupt };` — flag included in success return.
- `bin/install.js:1005-1013` — `finishInstall(..., result.settingsWasCorrupt)` — passed through.
- `bin/install.js:873` — `function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, settingsWasCorrupt)` — received.
- `bin/install.js:884-887` — `if (settingsWasCorrupt) { msg += '...' }` — conditionally appended to success message.

**Reasoning:** The propagation chain is complete and correct for the missing-file case. However `settingsWasCorrupt = !settingsExistedBefore` only detects a missing file. If `settings.json` exists but contains invalid JSON, `readSettings()` falls back to `GSD_BASELINE_SETTINGS` silently, yet `settingsWasCorrupt` remains `false` — the user receives no notice. The spec intent ("missing or corrupt") is half-covered. The missing-file path works as specified; the corrupt-but-present path does not surface the warning.

#### ccWarnings dead code removed

**Verdict:** met

**Evidence:**

- Full read of `bin/install.js` (1040 lines) — no occurrences of `ccWarnings` anywhere in the file.
- `bin/install.js:346` — `replaceCc()` ends with `return;` (void function, no return value).
- `bin/install.js:654` — call site: `replaceCc(targetDir);` — return value not captured, consistent with void.

**Reasoning:** Dead code fully removed. Contract met.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `bin/install.js:651,666,745` — failures[] accumulator, silent per-step push, structured result return; no console.log in install() body |
| FN-02 | met | `bin/install.js:992-1003` — runValidation({ quiet: true }) called unconditionally, failure exits process; `scripts/validate-install.js:371` — require.main guard |
| FN-03 | met | `bin/install.js:86,884,986,999` — banner unconditional, success single line + hint, failure single line + step, no intermediate output |
| TC-01 | met | `bin/install.js:994` — options.quiet replaces monkey-patch; `scripts/validate-install.js:30-31` — quiet via no-op log functions |
| readSettings() baseline | met | `bin/install.js:129-141` — catch returns deep copy of GSD_BASELINE_SETTINGS, not {} |
| settingsWasCorrupt propagation | partial | `bin/install.js:785` — flag computed as `!settingsExistedBefore` only; corrupt-but-present file does not set the flag, user notice is silently omitted in that case |
| ccWarnings removal | met | `bin/install.js` — zero ccWarnings references; replaceCc() returns void |
