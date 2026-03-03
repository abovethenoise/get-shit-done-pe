# Technical Trace: install-feedback (TC-01)

## Phase 1: Requirements Internalized

### TC-01: install.js output restructuring

The spec decomposes into five constraints:

1. **npx and node contexts** -- Must work in both `npx get-shit-done-pe --global` and `node bin/install.js --global`
2. **console.log suppression** -- Per-step logging replaced with silent execution
3. **validate-install.js callable programmatically** -- `require()`-able, returns structured result, no `process.exit()` side effect
4. **Error messages human-readable** -- No stack traces in normal output; step name + reason format

Additionally, the plan's must_haves specify:
- `readSettings()` on corrupt/missing settings.json should return a known-good GSD baseline (not `{}`)
- Result object pattern: `{ ok: boolean, step: string, reason: string }`
- runValidation() return shape: `{ passed: number, failed: number, failures: string[] }`

---

## Phase 2: Trace Against Code

### TC-01.1: Works in both npx and node contexts

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:1` -- `#!/usr/bin/env node` shebang present, enabling direct execution
- `/Users/philliphall/get-shit-done-pe/bin/install.js:8` -- `const { runValidation } = require('../scripts/validate-install');` uses relative require, which resolves correctly whether invoked via `npx` (which runs the package's bin entry) or `node bin/install.js` directly
- The file uses `__dirname` at line 617 (`const src = path.join(__dirname, '..');`) for locating source files, which is context-independent
- Reasoning: Both invocation contexts resolve `__dirname` to the same `bin/` directory. The relative `require('../scripts/validate-install')` works identically in both. No hardcoded paths or context-specific logic.

---

### TC-01.2: console.log suppression (silent install)

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:71` -- `console.log(banner);` prints the banner once at startup (before any install logic)
- `/Users/philliphall/get-shit-done-pe/bin/install.js:616-856` -- The `install()` function contains zero `console.log` calls. All per-step output has been removed. Comments like `// hooks installed successfully` (line 709) and `// Statusline path updated silently` (line 265) confirm intentional suppression.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:572-585` -- `verifyInstalled()` returns `false` silently (no console.error), matching the plan requirement
- `/Users/philliphall/get-shit-done-pe/bin/install.js:976-988` -- During `runValidation()` call, console.log and console.error are temporarily replaced with no-ops and restored in a `finally` block:
  ```js
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
- `/Users/philliphall/get-shit-done-pe/bin/install.js:872` -- `finishInstall()` emits exactly one success line: `console.log('\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n');`
- Reasoning: Between the banner (line 71) and the final pass/fail line (line 872 or 971), no console output is produced during a normal install. The console suppression during validation is the unplanned-but-necessary addition documented in the summary.

---

### TC-01.3: validate-install.js callable programmatically

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:29` -- `function runValidation(options = {}) {` wraps all logic in an exported function
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:359-363` -- Returns structured result:
  ```js
  return {
    passed: passedChecks,
    failed: failedChecks,
    failures: failures
  };
  ```
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:366` -- `module.exports = { runValidation };` exports the function
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:368-380` -- `require.main === module` guard preserves standalone use with `process.exit()` only when run directly:
  ```js
  if (require.main === module) {
    const result = runValidation();
    if (result.failed > 0) {
      // ...
      process.exit(1);
    } else {
      // ...
      process.exit(0);
    }
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:8` -- `const { runValidation } = require('../scripts/validate-install');` consumes it programmatically
- Reasoning: The `process.exit()` calls are gated behind `require.main === module`, so `require()`-ing the file from install.js does not terminate the parent process. The return shape matches the spec interface exactly.

---

### TC-01.4: Error messages human-readable

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:728` -- `return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:739` -- `return { ok: false, step: 'token replacement', reason: \`unresolved {GSD_ROOT} in ${tokenFailures[0]}\` };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:854` -- `return { ok: false, step: 'settings.json update', reason: e.message };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:971` -- Failure output format: `console.log(\`\n  Install failed: ${result.step} — ${result.reason}\n\`);`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:992` -- Validation failure output: `console.log(\`\n  Install failed: post-install validation — ${firstFailure}\n\`);`
- Reasoning: All error paths produce "Install failed: {step} -- {reason}" format with human-readable strings. No raw stack traces are exposed. The `e.message` in the settings catch block could theoretically contain a verbose Node.js error, but it will be a single-line message string, not a stack trace.

---

### TC-01.5: Result object pattern

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:728` -- `return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:739` -- `return { ok: false, step: 'token replacement', reason: ... };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:852` -- `return { ok: true, settingsPath, settings, statuslineCommand };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:854` -- `return { ok: false, step: 'settings.json update', reason: e.message };`
- Reasoning: The result object uses `ok` (boolean), `step` (string), `reason` (string) as specified. The success path extends the object with additional properties needed by `finishInstall()`.

**Spec-vs-reality gap:** The plan's key_links section specifies the pattern as `{ failed: false } or { failed: true, step, reason }` but the actual implementation uses `{ ok: true }` / `{ ok: false, step, reason }`. The plan's `<interfaces>` section correctly specifies `ok: boolean`. The key_links metadata was inconsistent with the interfaces block, but the implementation follows the interfaces block, which is the normative reference.

---

### TC-01.6: readSettings() known-good baseline on corrupt settings

**Verdict:** not met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:114-123`:
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
- The plan's must_haves state: "readSettings() on missing/corrupt/unparseable settings.json returns a known-good GSD baseline (minimum required hooks, permissions, deny rules for a working pe install) -- not {} which leaves a broken install that silently fails."
- Reasoning: `readSettings()` still returns `{}` on corrupt JSON. This is explicitly called out in the execution summary's "Next Steps" section: "readSettings() still returns {} on corrupt settings.json (documented must_have for known-good baseline not addressed in this plan -- requires separate implementation)."

**Spec-vs-reality gap:** The execution summary acknowledges this was not implemented and defers it to a separate plan. The must_have was overly broad for the scope of this feature -- it touches install logic correctness (settings recovery), not install output/UX which is the stated intent of TC-01. The implementation chose to leave existing behavior unchanged for safety.

---

### TC-01.7: Banner ASCII art with -PE identity

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:30-40`:
  ```js
  const banner = '\n' +
    cyan + '   [ASCII GSD art]\n' +
    // ...
    '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
    '  Product management insight for Claude Code.\n' +
    '  by abovethenoise — built on GSD by TACHES.\n';
  ```
- Reasoning: The banner includes "get-shit-done-pe", the version from package.json, and the -PE identity. It does not use the boxed format shown in the FEATURE.md example (which used double-line box characters), but the spec example was labeled "Example" not "exact format." The banner uses ASCII block art instead of box-drawing characters.

**Cross-layer observations:** The banner format diverges from the FEATURE.md example (which showed a clean box with "Get Shit Done -PE" and "by abovethenoise v2.1.0"). The actual banner uses large ASCII block letters for "GSD" with descriptive text below. This is a stylistic choice, not a spec violation -- the example was illustrative.

---

### TC-01.8: Auto-validation wired into install pipeline

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:975-994` -- In `runInstall()`, after `install()` succeeds, `runValidation()` is called and its result checked:
  ```js
  validationResult = runValidation();
  // ...
  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }
  ```
- Reasoning: Validation failure is treated as install failure, with the first failure message surfaced to the user. This matches FN-02 ("Validation failure counts as install failure") and folds into the single pass/fail output.

---

### TC-01.9: gsd-askuserquestion-guard.js in expected hooks

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:179`:
  ```js
  const expectedHooks = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js'];
  ```
- Reasoning: The hook was added to the validation expected list as specified in the plan.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01.1 (npx + node contexts) | met | `bin/install.js:1,8,617` -- shebang, relative require, `__dirname` usage |
| TC-01.2 (console.log suppression) | met | `bin/install.js:976-988` -- console replaced with no-ops during validation; zero logs in install() |
| TC-01.3 (validate-install.js programmatic) | met | `scripts/validate-install.js:29,366,368` -- exported function, module.exports, require.main guard |
| TC-01.4 (human-readable errors) | met | `bin/install.js:971,992` -- "Install failed: {step} -- {reason}" format |
| TC-01.5 (result object pattern) | met | `bin/install.js:728,739,852,854` -- `{ ok, step, reason }` shape |
| TC-01.6 (readSettings known-good baseline) | not met | `bin/install.js:114-123` -- still returns `{}` on corrupt JSON; deferred per execution summary |
| TC-01.7 (banner with -PE identity) | met | `bin/install.js:30-40` -- includes "get-shit-done-pe" and version |
| TC-01.8 (auto-validation in pipeline) | met | `bin/install.js:975-994` -- runValidation() called, failure folds into pass/fail |
| TC-01.9 (askuserquestion hook in validation) | met | `scripts/validate-install.js:179` -- added to expectedHooks array |

**Overall: 8/9 sub-requirements met. 1 not met (readSettings baseline -- acknowledged deferral).**
