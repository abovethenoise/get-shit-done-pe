---
phase: install-and-deploy/install-feedback
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/validate-install.js
  - bin/install.js
autonomous: true
requirements:
  - EU-01
  - FN-01
  - FN-02
  - FN-03
  - TC-01

must_haves:
  truths:
    - "Running node bin/install.js --global produces only a banner and a single pass or fail line — no intermediate output"
    - "A failed step produces a line naming the step that failed and the reason (e.g., 'Install failed: hook registration — settings.json not writable')"
    - "Validation runs automatically after install steps and its result folds into the pass/fail"
    - "scripts/validate-install.js can be require()'d without killing the calling process"
  artifacts:
    - path: "scripts/validate-install.js"
      provides: "Exported runValidation() function returning { passed, failed, failures[] }; standalone use preserved via require.main guard"
    - path: "bin/install.js"
      provides: "Silent install with phase tracking, programmatic validation call, and single final output line"
  key_links:
    - from: "bin/install.js install()"
      to: "scripts/validate-install.js runValidation()"
      via: "require('../scripts/validate-install')"
      pattern: "const { runValidation } = require"
    - from: "install() phase tracking"
      to: "finishInstall() final message"
      via: "{ failed: false } or { failed: true, step, reason } result object"
      pattern: "result\\.step"
---

<objective>
Restructure install.js output and make validate-install.js programmatically callable.

Purpose: Users currently see a stream of per-step log noise during install. After this plan, they see only a banner and a single pass/fail line — matching the FN-03 output spec.
Output: Modified validate-install.js (exportable) and modified bin/install.js (silent + final-line output).
</objective>

<execution_context>
@/Users/philliphall/.claude/get-shit-done/workflows/execute-plan.md
@/Users/philliphall/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/install-and-deploy/features/install-feedback/FEATURE.md
@.planning/capabilities/install-and-deploy/RESEARCH.md

<interfaces>
<!-- Task 1 output contract consumed by Task 2 -->
runValidation() return shape:
{
  passed: number,   // count of passed checks
  failed: number,   // count of failed checks
  failures: string[] // human-readable failure messages e.g. "Missing hook: hooks/gsd-context-monitor.js"
}

<!-- install() result object shape (Task 2 internal) -->
Each install step catches its own error and populates:
{
  ok: boolean,
  step: string,   // e.g. "hook registration", "commands/gsd"
  reason: string  // e.g. "settings.json not writable"
}
On first failure install() returns early with { ok: false, step, reason }.
On all-pass returns { ok: true }.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Refactor validate-install.js to export runValidation() and add missing hook check</name>
  <reqs>FN-02, TC-01</reqs>
  <files>scripts/validate-install.js</files>
  <action>
  The current file calls process.exit() at top level, which kills any parent process that require()'s it. Refactor so all logic lives inside an exported function.

  1. Wrap the entire body (everything after the constants block) in `function runValidation(options = {}) { ... }`.
     - `options` is reserved for future use; ignore for now.
     - Keep the configDir resolution logic inside the function.

  2. Remove both `process.exit()` calls at the bottom summary block. Replace with:
     ```js
     return {
       passed: passedChecks,
       failed: failedChecks,
       failures: failures   // already-populated array of failure strings
     };
     ```

  3. Add `require.main === module` guard at the bottom for standalone use:
     ```js
     module.exports = { runValidation };

     if (require.main === module) {
       const result = runValidation();
       if (result.failed > 0) {
         console.log(`\n  VALIDATION FAILED\n`);
         for (const f of result.failures) {
           console.log(`  - ${f}`);
         }
         process.exit(1);
       } else {
         console.log(`\n  ALL CHECKS PASSED\n`);
         process.exit(0);
       }
     }
     ```
     The standalone console.log output already exists in the file; keep it inside this block.

  4. In the Check 1 hooks section (around line 178), add `gsd-askuserquestion-guard.js` to the expectedHooks array:
     ```js
     const expectedHooks = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js'];
     ```

  5. Do NOT move or delete any check logic, pass/fail counters, or console.log calls inside the checks — those stay intact so standalone mode still produces readable output. The only structural change is wrapping in a function and replacing the final process.exit() calls with a return value.

  Keep all color constants (green, red, yellow, dim, reset) inside the function scope or at module level — either works, as long as the file parses cleanly.
  </action>
  <verify>
    <automated>node -e "const { runValidation } = require('./scripts/validate-install.js'); console.log(typeof runValidation);"</automated>
    <automated>node scripts/validate-install.js || true</automated>
  </verify>
  <done>
  `node -e "const { runValidation } = require('./scripts/validate-install.js'); const r = runValidation(); console.log(r.passed, r.failed);"` prints two integers without killing the process.
  `node scripts/validate-install.js` still runs standalone and exits 0 or 1.
  </done>
</task>

<task type="auto">
  <name>Restructure bin/install.js output: suppress per-step logs, add phase tracking, emit banner + single final line</name>
  <reqs>EU-01, FN-01, FN-03</reqs>
  <files>bin/install.js</files>
  <action>
  The install() function currently has ~8 console.log call sites that print per-step progress. All must be silenced. After all steps + validation, a single pass or fail line is printed.

  ### Step 1 — Suppress per-step console.log inside install()

  In install() (starting around line 483), remove or comment out these console.log / console.error calls:
  - Line ~499: `console.log(`  Installing for ${cyan}Claude Code${reset}...`)` — REMOVE
  - Line ~594: `console.error(`  ${yellow}Installation incomplete!...`)` — REMOVE (replace with return, see Step 2)
  - Line ~606: `console.error(`  ${yellow}Installation failed!...`)` — REMOVE (replace with return, see Step 2)
  - The `verifyInstalled()` helper calls `console.error(...)` on failure — change those to silent `return false` (the caller already captures the failure in `failures[]`).

  Also remove the informational console.log inside handleStatusline() for the "Skipping statusline" case (line ~714):
  - `console.log(`  ${yellow}⚠${reset} Skipping statusline...`)` — REMOVE
  - `console.log(`    Use ${cyan}--force-statusline${reset}...`)` — REMOVE

  ### Step 2 — Add phase-name tracking to install()

  Change install() to return a result object instead of calling process.exit(). The function already returns `{ settingsPath, settings, statuslineCommand }` on success. Extend this:

  a. Replace the two early-exit blocks (failures.length > 0 and tokenFailures.length > 0) with returns:
     ```js
     if (failures.length > 0) {
       return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };
     }
     // ...
     if (tokenFailures.length > 0) {
       return { ok: false, step: 'token replacement', reason: `unresolved {GSD_ROOT} in ${tokenFailures[0]}` };
     }
     ```

  b. Wrap each major install step in try/catch and return on error:
     Wrap the settings write (writeSettings call) in a try/catch:
     ```js
     try {
       // existing settings mutation + write
     } catch (e) {
       return { ok: false, step: 'settings.json update', reason: e.message };
     }
     ```

  c. Change the success return at the end of install() to include `ok: true`:
     ```js
     return { ok: true, settingsPath, settings, statuslineCommand };
     ```

  ### Step 3 — Wire runValidation() as the auto-validation step

  At the top of install.js, add the require after the existing requires:
  ```js
  const { runValidation } = require('../scripts/validate-install');
  ```

  In runInstall(), after calling install() and before calling finishInstall(), check the install result and call runValidation():
  ```js
  function runInstall(isGlobal, isInteractive) {
    const result = install(isGlobal);

    if (!result.ok) {
      console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);
      process.exit(1);
    }

    // Auto-validation
    let validationResult;
    try {
      validationResult = runValidation();
    } catch (e) {
      validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
    }

    if (validationResult.failed > 0) {
      const firstFailure = validationResult.failures[0] || 'unknown check failed';
      console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
      process.exit(1);
    }

    handleStatusline(result.settings, isInteractive, (shouldInstallStatusline) => {
      finishInstall(
        result.settingsPath,
        result.settings,
        result.statuslineCommand,
        shouldInstallStatusline
      );
    });
  }
  ```

  ### Step 4 — Rewrite finishInstall() to emit the success line

  Replace the current console.log in finishInstall() with the spec output:
  ```js
  console.log(`\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`);
  ```
  Remove the Discord community line and the "Done!" formatting — per FN-03 the success output is exactly:
  - success line
  - next-step hint

  ### Step 5 — Banner stays, but moves to print once at the top

  The banner is already printed at line 64 (`console.log(banner)`). Leave it there. The banner prints before any install logic runs, satisfying FN-03 "banner always first."

  Do NOT change the uninstall() function — it has its own output flow and is out of scope for this feature.
  Do NOT change the promptLocation() or interactive flow console.log calls — those are out of scope.
  Do NOT add a --verbose flag — explicitly out of scope per FEATURE.md.
  </action>
  <verify>
    <automated>node bin/install.js --global 2>&1 | head -30</automated>
    <automated>node -e "const { runValidation } = require('./scripts/validate-install'); const r = runValidation(); process.exit(r.failed > 0 ? 1 : 0);"</automated>
  </verify>
  <done>
  `node bin/install.js --global` outputs: banner, blank line, then exactly "Installed successfully." and "/gsd:init" hint — with no per-step lines between banner and final result.
  If install is re-run immediately (idempotent), same clean output is produced.
  </done>
</task>

</tasks>

<verification>
Run both tasks in sequence (Task 1 must complete before Task 2, since Task 2 require()'s the refactored validator).

1. After Task 1: `node -e "const {runValidation}=require('./scripts/validate-install'); const r=runValidation(); console.log('passed:',r.passed,'failed:',r.failed);"` — must print two integers, process must not exit early.
2. After Task 2: `node bin/install.js --global 2>&1` — output must match:
   - Line 1+: banner ASCII art
   - Final lines: "Installed successfully." + next-step hint
   - No lines starting with "Installing for", "✓", "PASS", "FAIL" between banner and final line.
3. `node scripts/validate-install.js` must still work standalone (exit 0 on a valid install, exit 1 on failures).
</verification>

<success_criteria>
- validate-install.js exports runValidation() and can be require()'d without process.exit side-effect [TC-01, FN-02]
- gsd-askuserquestion-guard.js is in the expected hooks list in validate-install.js [FN-02]
- install.js prints banner, then silence, then exactly one pass/fail line [EU-01, FN-01, FN-03]
- Pass line: "Installed successfully." + next-step hint [FN-03]
- Fail line: "Install failed: {step} — {reason}" [FN-03, EU-01]
- Validation runs automatically and folds into pass/fail [FN-02]
</success_criteria>

<output>
After completion, create `.planning/capabilities/install-and-deploy/features/install-feedback/01-SUMMARY.md`
</output>
