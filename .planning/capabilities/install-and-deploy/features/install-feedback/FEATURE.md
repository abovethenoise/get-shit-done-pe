---
type: feature
capability: "install-and-deploy"
status: specified
created: "2026-03-03"
---

# install-feedback

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | specified |
| FN-01 | - | - | - | - | - | specified |
| FN-02 | - | - | - | - | - | specified |
| FN-03 | - | - | - | - | - | specified |
| TC-01 | - | - | - | - | - | specified |

## End-User Requirements

### EU-01: Install gives clear pass/fail feedback

**Story:** As a user installing get-shit-done-pe, I want to see a clear success or failure result, so that I know immediately whether the install worked without digging through logs.

**Acceptance Criteria:**

- [ ] Banner displays with -PE identity (ASCII art mirrors existing style)
- [ ] Install runs silently (no per-step output during normal operation)
- [ ] Post-install validation runs automatically
- [ ] Success shows a single pass message with a next-step hint
- [ ] Failure shows a single fail message naming the specific step that failed
- [ ] No intermediate noise between banner and final result

**Out of Scope:**

- Verbose/debug mode (can be added later if needed)
- Interactive prompts during install

## Functional Requirements

### FN-01: Silent install with result capture

**Receives:** Install steps executing (token replacement, file copy, hook registration, settings merge).

**Returns:** An internal pass/fail record per step, with failure detail captured for the final message.

**Behavior:**

- Each install step runs without printing to stdout
- Each step records its own pass/fail status internally
- On first failure: capture step name + error message, continue or abort (implementation decision)
- On all-pass: record success

### FN-02: Auto-validation

**Receives:** Completed install steps (all passed or partial failure).

**Returns:** Validation result folded into the overall pass/fail.

**Behavior:**

- Run `scripts/validate-install.js` automatically after install steps complete
- Validation failure counts as install failure (user sees which validation check failed)
- Validation success contributes to the overall pass result

### FN-03: Final output

**Receives:** Internal pass/fail record from install steps + validation.

**Returns:** Terminal output to the user.

**Behavior:**

- **Banner** (always): ASCII art with -PE identity, version from package.json
- **Success**: Single pass line (e.g., "Installed successfully") + next-step hint (e.g., "Start a new Claude Code session and try /gsd:init")
- **Failure**: Single fail line naming the step that failed (e.g., "Install failed: hook registration — settings.json not writable")
- No output between banner and final result

## Technical Specs

### TC-01: install.js output restructuring

**Intent:** Replace current per-step logging with silent execution + single final message. Minimal change to install logic — this is an output/UX concern, not a logic rewrite.

**Upstream:** All install steps in bin/install.js (token replacement, file copy, hook registration, settings merge, validation).

**Downstream:** Terminal output seen by the user. No other consumers.

**Constraints:**

- Must work in both `npx get-shit-done-pe --global` and `node bin/install.js --global` contexts
- Banner ASCII art needs -PE addition (coordinate with package-identity feature for banner content)
- console.log calls in install steps need suppression or redirection
- validate-install.js must be callable programmatically (not just as standalone script)
- Error messages must be human-readable (no stack traces in normal output)

**Example:**

```
  ╔═══════════════════════════════════════╗
  ║   Get Shit Done -PE                   ║
  ║   by abovethenoise     v2.1.0         ║
  ╚═══════════════════════════════════════╝

  Installed successfully.
  Start a new Claude Code session and try /gsd:init
```

```
  ╔═══════════════════════════════════════╗
  ║   Get Shit Done -PE                   ║
  ║   by abovethenoise     v2.1.0         ║
  ╚═══════════════════════════════════════╝

  Install failed: hook registration — settings.json not writable
```

## Decisions

- UX model: silent install, clear pass/fail at end (not step-by-step checklist or progress bar)
- Failure detail: show which step failed + reason (not just "install failed")
- Validation: auto-runs as part of install, result folded into pass/fail
- Banner: keep existing ASCII art style, add -PE identity
- Success includes next-step hint pointing to first action (/gsd:init)
- No --verbose flag in initial implementation (can add later if needed)
