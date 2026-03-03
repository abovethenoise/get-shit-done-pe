---
reviewer: technical
plan: 02
date: 2026-03-03
---

# Technical Trace: install-feedback (TC-01)

Code state: post-02-PLAN.md refactor (current HEAD)

---

## Phase 1: Requirements Internalized

TC-01 decomposes into five implementation constraints per the spec:

1. **Console.log suppression in install steps** — install() must not emit per-step output; suppression of validate-install.js output must not use monkey-patching
2. **validate-install.js callable programmatically** — require()-able, returns structured result, no process.exit() side effect when required
3. **Error messages human-readable** — "Install failed: {step} -- {reason}" format; no raw stack traces
4. **Works in both npx and node bin/install.js contexts** — no hardcoded invocation context assumptions
5. **readSettings() known-good baseline** — returns GSD baseline (not {}) on missing/corrupt settings.json (must_have from 02-PLAN.md)

Additional implementation constraints from 02-PLAN.md must_haves:
- Console suppression uses options.quiet pattern (not monkey-patching)
- No dead code: ccWarnings removed
- validate-install.js log/logErr pattern wired throughout

---

## Phase 2: Trace Against Code

### TC-01.1: Works in both npx and node contexts

**Verdict:** met (proven)

**Evidence:**
- `bin/install.js:1` — `#!/usr/bin/env node` shebang enables direct invocation as `node bin/install.js`
- `bin/install.js:8` — `const { runValidation } = require('../scripts/validate-install');` uses a relative path that resolves identically whether launched via `npx` (package bin entry) or `node bin/install.js` directly, because `__dirname` is always `<package_root>/bin/`
- `bin/install.js:635` — `const src = path.join(__dirname, '..');` locates source files via `__dirname`, not `process.cwd()` or any context-sensitive mechanism
- Reasoning: No code path branches on invocation context. All path resolution uses `__dirname` or `os.homedir()`. Both npx and direct node invocation set `__dirname` to the same directory.

---

### TC-01.2: Console.log suppression (options.quiet, not monkey-patch)

**Verdict:** met (proven)

**Evidence:**

Suppression mechanism in validate-install.js:
- `scripts/validate-install.js:30` — `const log = options.quiet ? () => {} : console.log;`
- `scripts/validate-install.js:31` — `const logErr = options.quiet ? () => {} : console.error;`
- `scripts/validate-install.js:45` — `log(`  ${green}PASS${reset} ${msg}`);` — pass output uses `log`
- `scripts/validate-install.js:53-54` — `log(`  ${red}FAIL${reset} ${msg}`);` and `if (detail) log(...)` — fail output uses `log`
- `scripts/validate-install.js:60,195,233,261,288,336,358-361` — all section headers and summary lines use `log(`, not `console.log(`
- `scripts/validate-install.js:371-382` — the `require.main === module` standalone block uses bare `console.log`, which is correct; this block only executes on direct invocation, not when required

Call site in install.js:
- `bin/install.js:994` — `validationResult = runValidation({ quiet: true });`
- No console monkey-patching exists anywhere in the current code (the prior implementation described in the old trace at lines 976-988 has been removed in the 02-PLAN.md refactor)

install() function itself:
- `bin/install.js:634-867` — zero `console.log` calls inside `install()`. Comments `// hooks installed successfully` (line 727), `// Statusline configured silently` (line 879), `// Orphaned hooks cleaned silently` (line 275) confirm intentional suppression
- `bin/install.js:884-888` — `finishInstall()` emits one success message via `console.log(msg)`
- `bin/install.js:987` — failure is reported via `console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);`

Reasoning: The options.quiet pattern is implemented correctly throughout runValidation(). The monkey-patch approach (replacing console.log with no-ops in a try/finally) that existed before the 02-PLAN.md refactor is gone. The call site passes `{ quiet: true }`, satisfying the must_have constraint.

---

### TC-01.3: validate-install.js callable programmatically

**Verdict:** met (proven)

**Evidence:**
- `scripts/validate-install.js:29` — `function runValidation(options = {}) {` — all logic wrapped in an exported function with an options parameter
- `scripts/validate-install.js:362-367` — return shape:
  ```js
  return {
    passed: passedChecks,
    failed: failedChecks,
    failures: failures
  };
  ```
- `scripts/validate-install.js:369` — `module.exports = { runValidation };`
- `scripts/validate-install.js:371` — `if (require.main === module) {` gates all `process.exit()` calls; when required from install.js, this block never executes
- `bin/install.js:8` — `const { runValidation } = require('../scripts/validate-install');` — confirms programmatic consumption
- `bin/install.js:999-1000` — call site accesses `validationResult.failed` and `validationResult.failures[0]`, both present in the return shape

Reasoning: No process.exit() side effect occurs when required. Return shape matches spec interface exactly.

---

### TC-01.4: Error messages human-readable (no stack traces)

**Verdict:** met (proven)

**Evidence:**
- `bin/install.js:746` — `return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };` — literal string reason
- `bin/install.js:757` — `return { ok: false, step: 'token replacement', reason: `unresolved {GSD_ROOT} in ${tokenFailures[0]}` };` — interpolated path, no stack
- `bin/install.js:866` — `return { ok: false, step: 'settings.json update', reason: e.message };` — uses e.message (single-line string), not e.stack
- `bin/install.js:987` — display format: `console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);`
- `bin/install.js:1001` — validation failure display: `console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);`
- `bin/install.js:996` — catch wrapping runValidation: `validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };` — e.message used, not e.stack

Reasoning: All error paths use e.message or literal strings. No e.stack reference exists in bin/install.js. Output format is "Install failed: {step} — {reason}" throughout.

---

### TC-01.5: Result object pattern { ok, step, reason }

**Verdict:** met (proven)

**Evidence:**
- `bin/install.js:746` — `return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };`
- `bin/install.js:757` — `return { ok: false, step: 'token replacement', reason: ... };`
- `bin/install.js:864` — `return { ok: true, settingsPath, settings, statuslineCommand, settingsWasCorrupt };` — success path
- `bin/install.js:866` — `return { ok: false, step: 'settings.json update', reason: e.message };`
- `bin/install.js:986` — call site checks `if (!result.ok)`

Reasoning: All four return sites in install() use `ok` (boolean). Failure returns include `step` (string) and `reason` (string). Success extends with additional fields needed by finishInstall(). Call site correctly reads result.ok, result.step, result.reason.

---

### TC-01.6: readSettings() returns known-good baseline on corrupt/missing settings.json

**Verdict:** met (proven), with a documented detection gap

**Evidence:**
- `bin/install.js:18-31` — `GSD_BASELINE_SETTINGS` constant defined with permissions.deny rules and pre-initialized hooks arrays:
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
- `bin/install.js:129-142` — `readSettings()` catch branch: `return JSON.parse(JSON.stringify(GSD_BASELINE_SETTINGS));` — deep clone prevents mutation of the constant
- `bin/install.js:134-137` — partial corruption guard: if parsed JSON lacks hooks structure, it is initialized before return
- `bin/install.js:140` — comment `// Missing or corrupt — return known-good baseline, not {}` — explicit removal of prior `return {}` behavior
- `bin/install.js:783-785` — corrupt detection: `const settingsExistedBefore = fs.existsSync(settingsPath);` and `const settingsWasCorrupt = !settingsExistedBefore;`
- `bin/install.js:884-887` — user warning in finishInstall(): `if (settingsWasCorrupt) { msg += `  (settings.json was missing or corrupt — initialized with GSD defaults)\n`; }`

**Spec-vs-reality gap:** `settingsWasCorrupt` is set to `!settingsExistedBefore` (line 785), which only detects file-not-found. When a file exists but contains corrupt JSON, readSettings() silently returns the baseline (correct behavior), but `settingsWasCorrupt` remains false and the user receives no warning. The spec says "missing or corrupt" should produce the warning. The corrupt-but-existing case is handled silently.

---

### TC-01.7: child.on('error') handler in gsd-auto-update.js

**Verdict:** met (proven)

**Evidence:**
- `hooks/gsd-auto-update.js:77-84` — error handler registered on the spawned child process:
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
- `hooks/gsd-auto-update.js:85` — `child.unref()` is called after the error handler registration, ensuring the handler is attached before detach
- `hooks/gsd-auto-update.js:8` — contract comment: `// NEVER prints to stdout or stderr` — the error handler writes only to the cache file

Reasoning: The handler writes lastError and lastErrorTime to the cache file. This satisfies the FN-02 requirement "log error to cache/debug file" without producing stdout or stderr output. The inner try/catch prevents the handler itself from throwing.

---

### TC-01.8: Dead code removal (ccWarnings)

**Verdict:** met (proven)

**Evidence:**
- `bin/install.js:294-347` — `replaceCc()` function body contains no `ccWarnings` array, no push calls, ends with `return;` at line 346 (void return)
- No occurrences of `ccWarnings` exist anywhere in bin/install.js

Reasoning: The 02-PLAN.md task explicitly required removing `const ccWarnings = []`, `ccWarnings.push(...)`, and the return object. All three are absent from the current code. The call site at line 654 (`replaceCc(targetDir)`) discards the return value (now void), which is consistent.

---

### TC-01.9: log/logErr pattern throughout validate-install.js

**Verdict:** met (proven)

**Evidence:**
- `scripts/validate-install.js:30-31` — log and logErr defined from options.quiet
- All output inside runValidation() uses `log(` — verified across:
  - Line 45 (pass), 53-54 (fail), 60 (check 1 header), 91 (pass path), 195 (check 2 header), 225-227 (token hits), 233 (check 3 header), 261 (check 4 header), 288 (check 5 header), 323-330 (stale reference warnings), 336 (check 6 header), 358-361 (summary lines)
- No bare `console.log` calls inside `runValidation()` body
- `scripts/validate-install.js:374-381` — the require.main block correctly uses bare `console.log` (direct invocation only path)

Reasoning: When `{ quiet: true }` is passed, `log` becomes a no-op and all validation output is suppressed. The standalone invocation path is exempt and uses real console.log, which is correct.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01.1 (npx + node contexts) | met | `bin/install.js:1,8,635` — shebang, relative require, `__dirname` path resolution |
| TC-01.2 (console suppression via options.quiet) | met | `scripts/validate-install.js:30-31` — log/logErr; `bin/install.js:994` — `runValidation({ quiet: true })`; no monkey-patch |
| TC-01.3 (validate-install.js programmatic) | met | `scripts/validate-install.js:29,362-369,371` — exported function, structured return, require.main guard |
| TC-01.4 (human-readable errors) | met | `bin/install.js:987,1001` — "Install failed: {step} — {reason}"; e.message used throughout, no e.stack |
| TC-01.5 (result object { ok, step, reason }) | met | `bin/install.js:746,757,864,866` — all return sites use ok/step/reason shape |
| TC-01.6 (readSettings known-good baseline) | met | `bin/install.js:18-31,129-142` — GSD_BASELINE_SETTINGS constant; catch returns deep clone; gap: corrupt-but-existing file does not set settingsWasCorrupt |
| TC-01.7 (child.on('error') in auto-update) | met | `hooks/gsd-auto-update.js:77-84` — writes lastError/lastErrorTime to cache; no stdout/stderr |
| TC-01.8 (ccWarnings dead code removed) | met | `bin/install.js:294-347` — replaceCc() is void; no ccWarnings anywhere in file |
| TC-01.9 (log/logErr pattern complete) | met | `scripts/validate-install.js:30-31` — defined; all in-function output uses log; require.main block exempt |

**Overall: 9/9 sub-requirements met.**

**Documented gap:** TC-01.6 — `settingsWasCorrupt` detection at `bin/install.js:785` only fires on file-not-found, not on corrupt JSON parse failure. The user warning "settings.json was missing or corrupt" is suppressed when the file exists but contains invalid JSON.
