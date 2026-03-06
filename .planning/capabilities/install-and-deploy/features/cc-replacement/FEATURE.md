---
type: feature
capability: "install-and-deploy"
status: complete
created: "2026-03-03"
---

# cc-replacement

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | specified |
| FN-01 | - | - | - | - | - | specified |
| FN-02 | - | - | - | - | - | specified |
| FN-03 | - | - | - | - | - | specified |
| TC-01 | - | - | - | - | - | specified |

## End-User Requirements

### EU-01: Installing pe completely replaces cc

**Story:** As a user who previously installed get-shit-done-cc, I want installing get-shit-done-pe to completely replace it, so that I don't have conflicting GSD installations.

**Acceptance Criteria:**

- [ ] After pe install, no `get-shit-done-cc` global binary exists
- [ ] No orphaned cc-specific files remain in ~/.claude (commands, agents, hooks, workflows)
- [ ] settings.json hook registrations are pe's, not duplicated with cc's
- [ ] CLAUDE.md content managed by pe uses delimiters for clean future removal
- [ ] .planning/ directory is never touched during replacement

**Out of Scope:**

- Handling non-GSD files in ~/.claude (user-created, other tools)

## Functional Requirements

### FN-01: Best-effort upstream uninstall

**Receives:** Detection of `get-shit-done-cc` global install (check `npm list -g get-shit-done-cc`).

**Returns:** Upstream package removed or warning if removal failed.

**Behavior:**

- Check if `get-shit-done-cc` is globally installed via npm
- If present: attempt `npx get-shit-done-cc@latest --claude --global --uninstall`
- Known bug: upstream misdetects global/local when run from $HOME — must run from a project directory or handle the cwd appropriately
- If uninstall fails: warn user, continue with pe's own cleanup
- If not present: skip, proceed to verification

### FN-02: Post-uninstall remnant verification

**Receives:** State of ~/.claude after upstream uninstall attempt.

**Returns:** Clean ~/.claude with no cc-specific artifacts remaining.

**Behavior:**

- Scan ~/.claude for remnant gsd:* commands and gsd-* agents/hooks
- Safe to remove: `.claude/commands/gsd:*`, `.claude/agents/gsd-*`, `.claude/get-shit-done/`, `.claude/hooks/dist/`
- Never touch: `.planning/`, any non-`gsd-` prefixed files
- Remove remnants found in safe-to-remove list
- Report what was cleaned: "Removed N remnant files from previous install"

### FN-03: CLAUDE.md delimiter management

**Receives:** ~/.claude/CLAUDE.md (may or may not exist, may or may not have delimiters).

**Returns:** CLAUDE.md with pe content wrapped in delimiters.

**Behavior:**

- pe introduces delimiters: `<!-- GSD-PE:START -->` / `<!-- GSD-PE:END -->`
- On install: append pe content between delimiters (or replace existing delimited block)
- On uninstall with delimiters present: surgical strip of delimited content only
- On uninstall without delimiters: warn user "Cannot safely remove GSD content from CLAUDE.md — please remove manually"
- Never overwrite non-delimited user content

## Technical Specs

### TC-01: Replacement integration in install.js

**Intent:** Add cc-detection and cleanup as a pre-install phase in bin/install.js, before pe artifacts are copied.

**Upstream:** npm global package list, ~/.claude filesystem state.

**Downstream:** Clean ~/.claude ready for pe install (feeds into artifact copy, hook registration, settings merge).

**Constraints:**

- Must work on macOS and Linux (Node.js fs + child_process)
- npm commands via `execSync` with error handling (don't crash if npm fails)
- Cleanup must be idempotent — running twice doesn't error on missing files
- settings.json: additive merge only, never overwrite entire file

## Decisions

- Pre-install: run `npx get-shit-done-cc --claude --global --uninstall` to let upstream clean itself
- Safe to remove: `.claude/commands/gsd:*`, `.claude/agents/gsd-*`, `.claude/get-shit-done/`, `.claude/hooks/dist/`
- Surgical edit only: `.claude/settings.json` (merge additive, never overwrite), `.claude/CLAUDE.md` (strip between GSD delimiters only)
- Never touch: `.planning/` (user project state), any non-`gsd-` prefixed files
- Install order: upstream uninstall → verify no gsd:* remnants → install pe → merge settings additively → append to CLAUDE.md with delimiters
- Upstream uninstall is unreliable: known bug misdetects global/local when run from $HOME. pe must verify cleanup with post-uninstall remnant check.
- CLAUDE.md delimiters: pe introduces these (not upstream). pe uninstall must handle both: with delimiters (surgical strip) and without (warn user, don't touch).
- pe should attempt upstream uninstall as best-effort, then do its own verification pass for gsd:*/gsd-* remnants
