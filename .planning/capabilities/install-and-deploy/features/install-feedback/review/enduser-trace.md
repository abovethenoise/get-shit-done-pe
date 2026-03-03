---
type: review
role: enduser
feature: install-feedback
reviewed: "2026-03-03"
---

# End-User Trace: install-feedback

## Phase 1: Requirements Internalization

**EU-01: Install gives clear pass/fail feedback**

Six acceptance criteria. "Met" means a user running `npx get-shit-done-pe --global` sees:

1. A banner with -PE identity (ASCII art, consistent with existing style)
2. Zero per-step output during the install phase (silence between banner and result)
3. Post-install validation that fires automatically — not opt-in
4. On success: exactly one message confirming success plus a next-step hint
5. On failure: exactly one message identifying which step failed
6. No intermediate output between banner and final result (superset of AC2 — covers validation output too)

---

## Phase 2: Trace Against Code

### EU-01-AC1: Banner displays with -PE identity (ASCII art mirrors existing style)

**Verdict:** not met (proven)

**Evidence:**

- `bin/install.js:46-56` —
  ```js
  const banner = '\n' +
    cyan + '   ██████╗ ███████╗██████╗\n' +
    '  ██╔════╝ ██╔════╝██╔══██╗\n' +
    '  ██║  ███╗███████╗██║  ██║\n' +
    '  ██║   ██║╚════██║██║  ██║\n' +
    '  ╚██████╔╝███████║██████╔╝\n' +
    '   ╚═════╝ ╚══════╝╚═════╝' + reset + '\n' +
    '\n' +
    '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
    '  Product management insight for Claude Code.\n' +
    '  by abovethenoise — built on GSD by TÂCHES.\n';
  ```
- `bin/install.js:86` — `console.log(banner);`

- Reasoning: A banner is present and prints unconditionally. It includes the package name "get-shit-done-pe" and version. However, the acceptance criterion specifies "-PE identity" — the FEATURE.md TC-01 example explicitly shows `Get Shit Done -PE` as the product name in the banner title. The actual banner renders block-art spelling "GSD" (not "-PE"), with "-pe" appearing only in the lowercase tagline `get-shit-done-pe`. The spec example also shows a box-drawing border style (`╔═══╗`), while the implemented banner uses filled-block art characters (`██`). The rendered output does not present "-PE" as a visible product identity marker in the ASCII art itself. The style does not mirror the spec example. The product name appears ambiguously as "GSD" in the art and "get-shit-done-pe" in the subtitle.

---

### EU-01-AC2: Install runs silently (no per-step output during normal operation)

**Verdict:** met (proven)

**Evidence:**

- `bin/install.js:634-868` — The entire `install()` function body contains no `console.log` or `console.error` calls. All steps execute and communicate through return values only.
- `bin/install.js:275` — `// Orphaned hooks cleaned silently` — comment documents intent; no live output.
- `bin/install.js:285` — `// Statusline path updated silently` — same pattern.
- `bin/install.js:726-728` — Hooks success branch: `// hooks installed successfully` — comment only, no output.
- `bin/install.js:776-778` — Cache init failure: `} catch (e) { // Silent — cache init failure must not block install }` — swallowed silently.
- `bin/install.js:879` — `// Statusline configured silently` — no output on statusline write.
- `bin/install.js:864` — `return { ok: true, settingsPath, settings, statuslineCommand, settingsWasCorrupt };` — success communicates through return value.
- Reasoning: `install()` is entirely side-effect-free with respect to stdout. All pass/fail state flows through the structured return value. No intermediate progress is printed.

---

### EU-01-AC3: Post-install validation runs automatically

**Verdict:** met (proven)

**Evidence:**

- `bin/install.js:8` — `const { runValidation } = require('../scripts/validate-install');`
- `bin/install.js:991-1003` —
  ```js
  // Auto-validation (suppress per-check output via quiet option)
  let validationResult;
  try {
    validationResult = runValidation({ quiet: true });
  } catch (e) {
    validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
  }

  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }
  ```
- `scripts/validate-install.js:29-30` — `function runValidation(options = {}) { const log = options.quiet ? () => {} : console.log;`
- `scripts/validate-install.js:362-366` — `module.exports = { runValidation };` — exported for programmatic use.
- Reasoning: `runValidation` is called unconditionally inside `runInstall()` after the copy phase returns `ok: true`. No user flag or action is required. The try/catch at lines 995-997 ensures even an unexpected exception in `runValidation` is converted to a fail result and surfaces as an install failure.

---

### EU-01-AC4: Success shows a single pass message with a next-step hint

**Verdict:** met (proven)

**Evidence:**

- `bin/install.js:884-888` —
  ```js
  let msg = `\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`;
  if (settingsWasCorrupt) {
    msg += `  (settings.json was missing or corrupt — initialized with GSD defaults)\n`;
  }
  console.log(msg);
  ```
- Reasoning: On the success path, `finishInstall()` calls exactly one `console.log` at line 888. The base message is "Installed successfully." (pass confirmation) followed by "Start a new Claude Code session and try /gsd:init" (next-step hint). The conditional `settingsWasCorrupt` line is scoped to an exceptional input condition and is appended within the same `console.log` call — it does not constitute a separate per-step trace. No additional `console.log` calls appear between validation passing and this output.

---

### EU-01-AC5: Failure shows a single fail message naming the specific step that failed

**Verdict:** met (proven)

**Evidence:**

- `bin/install.js:986-989` — File-copy/settings failure path:
  ```js
  if (!result.ok) {
    console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);
    process.exit(1);
  }
  ```
- `bin/install.js:999-1003` — Validation failure path:
  ```js
  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }
  ```
- `bin/install.js:745-747` — Step name sourced from `failures[0]`, which is one of: `'commands/gsd'`, `'get-shit-done'`, `'agents'`, `'hooks'`.
- `bin/install.js:756-758` — Token failure: `step: 'token replacement'`, `reason: 'unresolved {GSD_ROOT} in <file>'`.
- `bin/install.js:865-866` — Settings failure: `step: 'settings.json update'`, `reason: e.message`.
- `scripts/validate-install.js:48-55` — Validation failure entry is a human-readable `msg: detail` string surfaced as `firstFailure`.
- Reasoning: Both failure branches emit exactly one `console.log` call. Each message names the failing step and the specific reason. The format "Install failed: {step} — {reason}" is consistent across both paths. No stack traces are included in normal operation — `e.message` at line 866 is the exception text only.

---

### EU-01-AC6: No intermediate noise between banner and final result

**Verdict:** met (proven)

**Evidence:**

- `bin/install.js:86` — Banner is the first and only output until the result.
- `bin/install.js:634-868` — `install()` produces no stdout (see AC2).
- `bin/install.js:993-994` — `runValidation({ quiet: true })` — the `quiet` option converts all `log()` and `logErr()` calls inside `runValidation` to no-ops at `scripts/validate-install.js:30-31`. The summary block at `scripts/validate-install.js:358-361` also uses `log`, so it is suppressed.
- `bin/install.js:983-1013` — `runInstall()` body: the only stdout calls are the failure exits (lines 987, 1001) and the success message via `finishInstall()` (line 888 via line 1006-1013). No output occurs between them on any path.

**Cross-layer observation:** The interactive path (no `--global`/`--local` flag, TTY present) prints a location-choice prompt via `promptLocation()` at lines 966-978, and a statusline-choice prompt via `handleStatusline()` at lines 919-931, between the banner and the final result. The FEATURE.md "Out of Scope" section states "Interactive prompts during install" — indicating these prompts were explicitly excluded from scope. These prompts existed before this feature and are unchanged. They do not constitute intermediate noise introduced by this work.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 AC-1 (banner with -PE identity) | not met | `bin/install.js:46-56` — ASCII art spells "GSD"; "-PE" does not appear in the rendered art. TC-01 spec example shows `Get Shit Done -PE` box-border style. Style and identity marker diverge from spec. |
| EU-01 AC-2 (silent install) | met | `bin/install.js:634-868` — zero console output in `install()` body; all steps silent. |
| EU-01 AC-3 (auto-validation) | met | `bin/install.js:991-994` — `runValidation({ quiet: true })` called unconditionally post-copy. |
| EU-01 AC-4 (single pass message + hint) | met | `bin/install.js:884-888` — "Installed successfully." + "/gsd:init" hint in one `console.log`. |
| EU-01 AC-5 (single fail message naming step) | met | `bin/install.js:987`, `1001` — "Install failed: {step} — {reason}" on both failure branches. |
| EU-01 AC-6 (no intermediate noise) | met | `bin/install.js:993-994` — `options.quiet` suppresses all validation output; `install()` produces no stdout. |
