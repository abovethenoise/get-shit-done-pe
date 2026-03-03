---
phase: install-and-deploy/install-feedback
plan: 02
type: execute
wave: 1
depends_on:
  - install-and-deploy/install-feedback/01-PLAN.md
files_modified:
  - bin/install.js
  - scripts/validate-install.js
  - README.md
  - package-lock.json
  - hooks/gsd-auto-update.js
autonomous: true
requirements:
  - FN-01
  - FN-02
  - FN-03
  - TC-01

must_haves:
  truths:
    - "readSettings() on missing/corrupt/unparseable settings.json returns a known-good GSD baseline — not {}"
    - "Console suppression uses options.quiet pattern, not monkey-patching"
    - "No dead code: ccWarnings removed or surfaced, unused options param wired"
    - "README.md has zero get-shit-done-cc references"
    - "package-lock.json regenerated and valid"
---

<objective>
Post-review refactor: fix all blocker, major, and actionable minor findings from the 4-feature review synthesis.

Source: review/synthesis.md files in each feature directory.
</objective>

<execution_context>
@/Users/philliphall/.claude/get-shit-done/workflows/execute-plan.md
@/Users/philliphall/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Review synthesis files:
@.planning/capabilities/install-and-deploy/features/install-feedback/review/synthesis.md
@.planning/capabilities/install-and-deploy/features/package-identity/review/synthesis.md
@.planning/capabilities/install-and-deploy/features/cc-replacement/review/synthesis.md
@.planning/capabilities/install-and-deploy/features/auto-latest/review/synthesis.md
</context>

<tasks>

<task type="auto">
  <name>Fix blocker: readSettings() known-good baseline</name>
  <reqs>FN-01, TC-01</reqs>
  <files>bin/install.js</files>
  <action>
  In bin/install.js, find `readSettings()` (around line 114-123). Currently:
  ```js
  function readSettings(settingsPath) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  ```

  Replace with a version that returns a known-good GSD baseline on failure:

  1. Define `GSD_BASELINE_SETTINGS` as a constant near the top of the file (after color constants):
     ```js
     const GSD_BASELINE_SETTINGS = {
       permissions: {
         allow: [],
         deny: [
           "Bash(rm -rf *)",
           "Bash(git push --force*)",
           "Bash(git reset --hard*)"
         ]
       },
       hooks: {
         PostToolUse: [],
         SessionStart: []
       }
     };
     ```
     This is the minimum viable settings structure — hooks arrays exist for install to push into, deny rules prevent destructive operations. Install's own hook registration code will populate the hooks arrays.

  2. Rewrite readSettings:
     ```js
     function readSettings(settingsPath) {
       try {
         const raw = fs.readFileSync(settingsPath, 'utf8');
         const parsed = JSON.parse(raw);
         // Ensure hooks structure exists (partial corruption guard)
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

  3. In the install() function, after calling readSettings(), if the file was missing/corrupt, surface a warning that gets folded into the final output. Add a `settingsWasCorrupt` flag:
     ```js
     const settingsExists = fs.existsSync(settingsPath);
     let settings = readSettings(settingsPath);
     const settingsWasCorrupt = !settingsExists || !fs.existsSync(settingsPath);
     ```
     Then in the success message at finishInstall(), if settingsWasCorrupt was true, append:
     `"  (settings.json was missing or corrupt — initialized with GSD defaults)\n"`

  Do NOT change any other readSettings behavior — just the fallback path.
  </action>
  <verify>
    <automated>node -e "
      const fs = require('fs');
      const src = fs.readFileSync('bin/install.js', 'utf8');
      if (src.includes('return {}')) throw new Error('still returns empty object');
      if (!src.includes('GSD_BASELINE_SETTINGS')) throw new Error('baseline not defined');
      console.log('PASS');
    "</automated>
  </verify>
  <done>readSettings() returns GSD_BASELINE_SETTINGS on corrupt/missing settings.json. Baseline includes hooks arrays and deny rules.</done>
</task>

<task type="auto">
  <name>Fix majors: quiet mode, dead code, README, package-lock</name>
  <reqs>FN-02, FN-03</reqs>
  <files>scripts/validate-install.js, bin/install.js, README.md, hooks/gsd-auto-update.js</files>
  <action>
  **Fix #4 — Console monkey-patch → options.quiet:**

  In scripts/validate-install.js, the `runValidation(options = {})` function already accepts options. Add quiet mode support:

  1. At the top of runValidation(), after existing setup:
     ```js
     const log = options.quiet ? () => {} : console.log;
     const logErr = options.quiet ? () => {} : console.error;
     ```

  2. Replace all `console.log(` calls inside runValidation() with `log(` and all `console.error(` with `logErr(`. Keep the require.main standalone block using real console.log.

  3. In bin/install.js, where runValidation() is called, change to:
     ```js
     validationResult = runValidation({ quiet: true });
     ```
     Remove the console.log/console.error monkey-patch (the temporary replacement with no-ops and finally block restoration). The `{ quiet: true }` option replaces it cleanly.

  **Fix #5 — Remove dead ccWarnings:**

  In bin/install.js:
  - Remove `const ccWarnings = [];` module-level declaration
  - In `replaceCc()`, remove `ccWarnings.push(...)` line — replace with nothing (the try/catch already swallows the error, which is the correct behavior for silent install)
  - Remove `return { ccWarnings };` from replaceCc() — change to `return;` (void)
  - The call site already ignores the return value, so no change needed there

  **Fix #2 — README stale references:**

  Read README.md. Find all occurrences of `get-shit-done-cc` in the file and replace with `get-shit-done-pe`. Find `npx get-shit-done-cc` and replace with `npx get-shit-done-pe`. Find the upstream repo URL `github.com/glittercowboy/get-shit-done` and leave it only where it appears as attribution (the ## Attribution section). In the install commands and other references, replace with the pe repo URL.

  **Fix #3 — package-lock.json:**

  Run `npm install --package-lock-only` to regenerate package-lock.json with the new package name. Verify it exists and references `get-shit-done-pe`.

  **Fix #6 — auto-latest error logging (minor):**

  In hooks/gsd-auto-update.js, after the spawn() call for npm install -g, add a minimal error log to the cache file:
  ```js
  child.on('error', (err) => {
    try {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      cache.lastError = err.message;
      cache.lastErrorTime = new Date().toISOString();
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n');
    } catch (e) { /* silent */ }
  });
  ```
  This satisfies FN-02 "log error to cache/debug file" without adding stdout output.

  **Fix minor — Remove duplicate gsd-check-update cleanup:**

  In bin/install.js, find the inline SessionStart filter that removes `gsd-check-update` entries (the one added by auto-latest, separate from the orphanedHookPatterns). Remove it — the `cleanupOrphanedHooks()` function's orphanedHookPatterns already handles it.

  **Fix minor — Remove dead stdin JSON.parse:**

  In hooks/gsd-auto-update.js, if there's a `JSON.parse(input)` that parses stdin but the result is never used, remove it. Keep the stdin drain (needed for hook protocol) but don't parse if unused.
  </action>
  <verify>
    <automated>node --check bin/install.js && node --check scripts/validate-install.js && node --check hooks/gsd-auto-update.js && echo "ALL SYNTAX OK"</automated>
    <automated>node -e "const {runValidation}=require('./scripts/validate-install'); const r=runValidation({quiet:true}); console.log('passed:',r.passed,'failed:',r.failed)" 2>&1 | grep -v "PASS\|FAIL\|Check" | head -5</automated>
    <automated>grep -c "get-shit-done-cc" README.md || echo "0 stale refs"</automated>
    <automated>grep -c "ccWarnings" bin/install.js || echo "0 ccWarnings refs"</automated>
  </verify>
  <done>
  - runValidation({ quiet: true }) suppresses output without monkey-patching
  - ccWarnings dead code removed
  - README has zero get-shit-done-cc references
  - package-lock.json regenerated
  - Auto-update hook logs errors to cache file
  - Duplicate gsd-check-update cleanup removed
  - Dead stdin JSON.parse removed
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `node bin/install.js --global 2>&1` — banner + single pass/fail line, no intermediate output
2. `node -e "const {runValidation}=require('./scripts/validate-install'); const r=runValidation({quiet:true}); console.log(r.passed, r.failed)"` — prints two integers, no check output
3. `grep -c "get-shit-done-cc" README.md` — must be 0
4. `grep "GSD_BASELINE_SETTINGS" bin/install.js` — must exist
5. `grep "ccWarnings" bin/install.js` — must be 0
6. `node -e "require('./package-lock.json')"` — valid JSON
7. `grep "lastError" hooks/gsd-auto-update.js` — must exist
</verification>

<success_criteria>
- readSettings() returns known-good baseline on corrupt/missing settings.json [BLOCKER FIX]
- Console suppression uses options.quiet, not monkey-patching [MAJOR FIX]
- ccWarnings dead code removed [MAJOR FIX]
- README.md has zero get-shit-done-cc references [MAJOR FIX]
- package-lock.json regenerated [MAJOR FIX]
- Auto-update error logging to cache file [MAJOR FIX]
- Duplicate cleanup code removed [MINOR FIX]
- All syntax checks pass
</success_criteria>

<output>
After completion, create `.planning/capabilities/install-and-deploy/features/install-feedback/02-SUMMARY.md`
</output>
