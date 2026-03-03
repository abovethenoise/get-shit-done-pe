# Functional Trace: install-feedback

**Reviewer:** functional
**Date:** 2026-03-03
**Files examined:** `bin/install.js` (996 lines), `scripts/validate-install.js` (383 lines), `hooks/gsd-auto-update.js` (109 lines)
**Context:** Re-review after 6 fixes. All previous findings addressed. Code has been refactored since last trace (line numbers shifted, `finishInstall` inlined into `handleStatusline` callback).

---

## Phase 1: Requirements Internalized

| Req | Behavior contract |
|-----|-------------------|
| FN-01 | Silent install: each step records pass/fail internally, no stdout during install steps. On first failure: capture step name + error message. On all-pass: record success. |
| FN-02 | Auto-validation: validate-install.js runs automatically after install steps complete. Validation failure = install failure. Validation success contributes to overall pass. |
| FN-03 | Banner (always): ASCII art with -PE identity, version from package.json. Success: single pass line + next-step hint. Failure: single fail line naming the step. No output between banner and final result. |

---

## Phase 2: Trace Against Code

### FN-01: Silent install with result capture

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:621` -- `const failures = [];`
  Reasoning: The `install()` function (lines 604-826) initializes an internal failure accumulator. No `console.log` or `console.error` calls exist within the `install()` function body. All file operations run silently.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:636-638` -- `if (!verifyInstalled(gsdDest, 'commands/gsd')) { failures.push('commands/gsd'); }`
  Reasoning: Each step records failure by pushing to the array, not printing. Same pattern at lines 644-646 (get-shit-done), 675-677 (agents), 696-698 (hooks).

- `/Users/philliphall/get-shit-done-pe/bin/install.js:713-714` -- `if (failures.length > 0) { return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' }; }`
  Reasoning: On first failure, captures step name (`failures[0]`) and error message as a structured return value.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:822` -- `return { ok: true, settingsPath, settings, statuslineCommand, settingsWasCorrupt };`
  Reasoning: On all-pass, returns structured success object with `ok: true`.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:823-825` -- `catch (e) { return { ok: false, step: 'settings.json update', reason: e.message }; }`
  Reasoning: Settings block errors captured silently with step name and reason via return value.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:124-137` -- `readSettings()` returns `{ settings, wasCorrupt }` with no console output; corrupt/missing files return deep copy of `GSD_BASELINE_SETTINGS` with `wasCorrupt: true`.

**Cross-layer observations:** `replaceCc()` (line 289) uses `execSync` with `stdio: 'pipe'` (lines 293, 302), preventing any stdout leakage. No output leaks found in `install()`.

---

### FN-02: Auto-validation

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:8` -- `const { runValidation } = require('../scripts/validate-install');`
  Reasoning: Validation script imported as a module for programmatic use.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:951-956` -- Validation runs inside the `handleStatusline` callback after `writeSettingsWithStatusline`:
  ```js
  validationResult = runValidation({ quiet: true });
  } catch (e) {
    validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
  }
  ```
  Reasoning: Runs automatically after install steps complete. The `quiet: true` option suppresses validation output. Exception path produces a failure result.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:958-961` -- `if (validationResult.failed > 0) { ... console.log(...); process.exit(1); }`
  Reasoning: Validation failure counts as install failure, exits with code 1.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:964-968` -- Success message only prints after validation passes (falls through the `failed > 0` guard).
  Reasoning: Validation success contributes to the overall pass result.

- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:29-31` -- `const log = options.quiet ? () => {} : console.log; const logErr = options.quiet ? () => {} : console.error;`
  Reasoning: Quiet mode implemented via no-op function assignment, suppressing all internal output.

- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:362-366` -- `return { passed: passedChecks, failed: failedChecks, failures: failures };`
  Reasoning: Returns structured result consumed by `runInstall()`.

- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:371` -- `if (require.main === module)` guard prevents `process.exit` when called programmatically.

---

### FN-03: Final output

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:46-50` -- Banner definition:
  ```js
  const banner = '\n' +
    cyan + '  ╔═══════════════════════════════════════╗\n' +
    '  ║   Get Shit Done ' + reset + '-PE' + cyan + '                    ║\n' +
    '  ║   ' + reset + dim + 'by abovethenoise     v' + pkg.version + reset + cyan + '         ║\n' +
    '  ╚═══════════════════════════════════════╝' + reset + '\n';
  ```
  Reasoning: ASCII art box with `-PE` identity and version from `package.json` (line 38: `const pkg = require('../package.json')`).

- `/Users/philliphall/get-shit-done-pe/bin/install.js:80` -- `console.log(banner);`
  Reasoning: Banner prints unconditionally at module load, before any install logic.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:937` -- `console.log(\`\\n  Install failed: ${result.step} — ${result.reason}\\n\`);`
  Reasoning: Failure from `install()` produces a single fail line naming the step that failed.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:960` -- `console.log(\`\\n  Install failed: post-install validation — ${firstFailure}\\n\`);`
  Reasoning: Validation failure produces a single fail line naming "post-install validation" and the first failure detail.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:964-968` --
  ```js
  let msg = `\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`;
  if (result.settingsWasCorrupt) {
    msg += `  (settings.json was missing or corrupt — initialized with GSD defaults)\n`;
  }
  console.log(msg);
  ```
  Reasoning: Success produces a single pass line ("Installed successfully.") plus a next-step hint ("/gsd:init").

- **No output between banner and result (non-interactive):** Verified by tracing the non-interactive path: `runInstall(isGlobal, false)` calls `install()` (silent per FN-01), then `handleStatusline()` which with `isInteractive=false` and no existing statusline calls callback directly (line 847-849) or skips prompt (line 857-859), then `writeSettingsWithStatusline()` (silent), then `runValidation({ quiet: true })` (silent). The only `console.log` after the banner is the final pass/fail line.

- **Interactive exception:** When `isInteractive=true` and an existing statusline is detected, `handleStatusline` prints a prompt (lines 869-887). The feature's key-files documentation explicitly notes: "Only user-visible output: banner (always), statusline prompt (interactive only), final pass/fail." This is an acknowledged interactive-only exception.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01  | met     | `/Users/philliphall/get-shit-done-pe/bin/install.js:621,636,713,822` -- failures[] tracks steps silently, returns structured {ok, step, reason} or {ok, ...success data}, no console output in install() |
| FN-02  | met     | `/Users/philliphall/get-shit-done-pe/bin/install.js:951-961` -- runValidation({quiet:true}) runs after install, failure exits code 1; `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:371` -- require.main guard |
| FN-03  | met     | `/Users/philliphall/get-shit-done-pe/bin/install.js:46-50,80,937,960,964` -- banner unconditional with -PE + version, success single line + hint, failure single line + step name, no intermediate output |
