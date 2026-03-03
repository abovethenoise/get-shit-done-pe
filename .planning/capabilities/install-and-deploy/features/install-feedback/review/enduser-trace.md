# End-User Trace Report: install-feedback

## Phase 1: Requirements Internalization

### EU-01: Install gives clear pass/fail feedback

Acceptance criteria:

1. Banner displays with -PE identity (ASCII art mirrors existing style)
2. Install runs silently (no per-step output during normal operation)
3. Post-install validation runs automatically
4. Success shows a single pass message with a next-step hint
5. Failure shows a single fail message naming the specific step that failed
6. No intermediate noise between banner and final result

### Must-haves from plan (additional constraints):

- "Running node bin/install.js --global produces only a banner and a single pass or fail line -- no intermediate output"
- "readSettings() on missing/corrupt/unparseable settings.json returns a known-good GSD baseline -- not {}"

---

## Phase 2: Trace Against Code

### EU-01: Install gives clear pass/fail feedback

---

#### AC-1: Banner displays with -PE identity

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:30-40` -- Banner definition:
  ```js
  const banner = '\n' +
    cyan + '   ...(ASCII art)...' + reset + '\n' +
    '\n' +
    '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
    '  Product management insight for Claude Code.\n' +
    '  by abovethenoise — built on GSD by TACHES.\n';
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:71` -- `console.log(banner);`
- Reasoning: Banner prints ASCII art with "get-shit-done-pe" identity, version from package.json, and attribution. Printed unconditionally before any install logic. Mirrors the existing GSD ASCII block-letter style.

---

#### AC-2: Install runs silently (no per-step output during normal operation)

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:616-856` -- The `install()` function has zero `console.log` calls for successful steps. Old logging was removed. The `verifyInstalled()` function at line 572-585 returns boolean silently (no logging).
- `/Users/philliphall/get-shit-done-pe/bin/install.js:708-709` -- Comment-only marker where logging used to be: `// hooks installed successfully`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:256` -- `// Orphaned hooks cleaned silently`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:265` -- `// Statusline path updated silently`
- Reasoning: All per-step logging has been replaced with silent execution. The `install()` function communicates results via return value (`{ ok, step, reason }` or `{ ok, settingsPath, settings, statuslineCommand }`), not console output.

---

#### AC-3: Post-install validation runs automatically

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:8` -- `const { runValidation } = require('../scripts/validate-install');`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:975-988` -- Auto-validation wired into `runInstall()`:
  ```js
  // Auto-validation (suppress validation's per-check console output)
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
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:29,359-363` -- `runValidation()` exported, returns `{ passed, failed, failures }`.
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:366-368` -- `require.main === module` guard preserves standalone usage.
- Reasoning: Validation runs programmatically after install steps complete. Console output is suppressed during the call, and the result object is used to determine pass/fail.

---

#### AC-4: Success shows a single pass message with a next-step hint

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:872` --
  ```js
  console.log(`\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`);
  ```
- Reasoning: Single pass message ("Installed successfully.") followed by a next-step hint ("Start a new Claude Code session and try /gsd:init"). Matches the spec example in FEATURE.md lines 106-107.

**Cross-layer observation:** The statusline prompt (`handleStatusline`) at line 878-922 can inject interactive output between banner and the success message when an existing statusline is detected and the install is interactive. This is a user-visible prompt, not "noise" per se, but it inserts UI between banner and final result. In non-interactive mode (e.g., `--global` flag), this does not occur -- the callback fires synchronously with `false`. Flagged for awareness; the spec's "out of scope" says "interactive prompts during install" are out of scope, but the statusline prompt predates this feature and was not removed.

---

#### AC-5: Failure shows a single fail message naming the specific step that failed

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:970-973` -- Install step failure:
  ```js
  if (!result.ok) {
    console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);
    process.exit(1);
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:990-993` -- Validation failure:
  ```js
  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:728` -- Example failure return:
  ```js
  return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:739` --
  ```js
  return { ok: false, step: 'token replacement', reason: `unresolved {GSD_ROOT} in ${tokenFailures[0]}` };
  ```
- Reasoning: Failure messages follow the pattern "Install failed: {step} -- {reason}", naming the specific step. Matches the spec example format at FEATURE.md line 116.

---

#### AC-6: No intermediate noise between banner and final result

**Verdict:** met (with caveat)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:71` -- Banner prints.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:616-856` -- `install()` produces no console output.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:977-987` -- Validation console output suppressed via `console.log = () => {}`.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:872` or `971`/`992` -- Final result prints.
- Reasoning: In the non-interactive `--global` path, the output sequence is: banner -> (silence) -> single result line. No intermediate noise. The console suppression during validation (lines 977-987) specifically addresses runValidation()'s internal logging.

**Caveat (cross-layer):** In the interactive path (no `--global`/`--local` flag), the `promptLocation()` function at line 927-962 prints a location choice menu between banner and result. Additionally, `handleStatusline()` at line 878-922 may print a statusline choice prompt. These are interactive prompts that predate this feature. The spec lists "Interactive prompts during install" as "Out of Scope" -- meaning they were not in scope to add, but the existing ones were also not flagged for removal. This is an edge case worth noting but does not violate the acceptance criteria for the non-interactive (CLI flag) path.

---

### Must-have: readSettings() returns known-good GSD baseline on corrupt/missing settings.json

**Verdict:** not met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:114-123` --
  ```js
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
- The execution summary explicitly acknowledges this at line 93: "readSettings() still returns {} on corrupt settings.json (documented must_have for known-good baseline not addressed in this plan -- requires separate implementation)"
- Reasoning: The must-have stated "readSettings() on missing/corrupt/unparseable settings.json returns a known-good GSD baseline -- not {}". The code returns `{}` in both the missing and corrupt cases. This was a stated must-have that was not implemented. The execution summary acknowledges the gap.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 AC-1 (banner with -PE identity) | met | `bin/install.js:30-40` -- ASCII art + "get-shit-done-pe" + version |
| EU-01 AC-2 (silent install) | met | `bin/install.js:616-856` -- zero console.log in install(), result-object returns |
| EU-01 AC-3 (auto-validation) | met | `bin/install.js:975-988` -- runValidation() called programmatically, console suppressed |
| EU-01 AC-4 (single pass message + hint) | met | `bin/install.js:872` -- "Installed successfully." + "/gsd:init" hint |
| EU-01 AC-5 (single fail message naming step) | met | `bin/install.js:971,992` -- "Install failed: {step} -- {reason}" |
| EU-01 AC-6 (no intermediate noise) | met | `bin/install.js:977-987` -- console suppression during validation; install() silent |
| Must-have: readSettings() known-good baseline | not met | `bin/install.js:114-123` -- returns `{}` on corrupt/missing, not a GSD baseline. Acknowledged in 01-SUMMARY.md:93 |
