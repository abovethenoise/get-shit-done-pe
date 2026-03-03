# Functional Trace: cc-replacement

Reviewer: functional-reviewer
Date: 2026-03-03
Source: `bin/install.js`

## Phase 1: Requirements Internalized

| Req | Summary |
|-----|---------|
| FN-01 | Detect cc via `npm list -g`, attempt uninstall, handle failure gracefully (warn + continue) |
| FN-02 | Scan ~/.claude for `gsd:*` commands, `gsd-*` agents, `get-shit-done/`, `hooks/dist/`; remove them; never touch `.planning/` |
| FN-03 | CLAUDE.md delimiters `<!-- GSD-PE:START/END -->`; install appends or replaces block; uninstall strips or warns if no delimiters |

## Phase 2: Trace Against Code

### FN-01: Best-effort upstream uninstall

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:279-284` -- Detection via `execSync('npm list -g get-shit-done-cc --depth=0', { stdio: 'pipe' })` inside try/catch. Exit code 1 (not installed) caught and sets `ccInstalled = false`. Matches spec: "Check if get-shit-done-cc is globally installed via npm."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:287-293` -- Uninstall via `execSync('npm uninstall -g get-shit-done-cc', { stdio: 'pipe' })` inside try/catch. On failure: `ccWarnings.push('cc uninstall failed...')`. Matches spec: "If uninstall fails: warn user, continue with pe's own cleanup."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:287` -- `if (ccInstalled)` gates the uninstall attempt. If not present, skips to remnant scan. Matches spec: "If not present: skip, proceed to verification."

- Deviation from FEATURE.md spec text: Spec says to use `npx get-shit-done-cc@latest --claude --global --uninstall`. Implementation uses `npm uninstall -g get-shit-done-cc`. However, the 01-SUMMARY.md documents this as an intentional deviation based on research: "Used npm uninstall -g (not upstream npx) per RESEARCH.md -- upstream has $HOME cwd bug." The FEATURE.md itself notes this bug at line 50. The behavioral contract (detect, attempt removal, handle failure) is satisfied.

**Cross-layer observations:**

- `ccWarnings` is accumulated at module level (line 66) and returned from `replaceCc` (line 328), but never surfaced to the user during install. The summary notes this is "stored at module level for future install-feedback feature to surface." No spec violation -- FN-01 says "warn user" but the warning is captured, not discarded. However, the user will not actually see it in the current implementation. This is a behavioral gap between spec intent ("warn user") and implementation (silent accumulation).

### FN-02: Post-uninstall remnant verification

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:295-304` -- Scans `commands/` directory for files starting with `gsd:` and removes them. Matches spec: "Scan ~/.claude for remnant gsd:* commands."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:306-314` -- Scans `agents/` directory for files starting with `gsd-` and removes them. Matches spec: "gsd-* agents."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:316-320` -- Removes `get-shit-done/` directory recursively. Matches spec: "get-shit-done/ dir."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:322-326` -- Removes `hooks/dist/` directory recursively. Matches spec: "hooks/dist/."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:295` -- Comment says "run unconditionally" -- remnant scan runs regardless of whether cc was detected. Matches spec: "pe must verify cleanup with post-uninstall remnant check."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:636` -- `replaceCc(targetDir)` is called at the top of `install()`, before artifact copy. Matches spec install order: "upstream uninstall -> verify no gsd:* remnants -> install pe."

- Never touches `.planning/`: The function operates on `configDir` (which is `~/.claude` or explicit config dir). `.planning/` lives in project directories, not in the config dir. No code path in `replaceCc` references `.planning/`. Matches spec: "Never touch: .planning/."

**Cross-layer observations:**

- Spec says "Report what was cleaned: 'Removed N remnant files from previous install'". No such reporting exists in `replaceCc()`. The function silently removes files and returns `{ ccWarnings }`. This is a minor gap -- the spec asks for a count-based report but the implementation is silent.

### FN-03: CLAUDE.md delimiter management

**Verdict:** met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/bin/install.js:18-19` -- `CLAUDE_MD_START = '<!-- GSD-PE:START -->'` and `CLAUDE_MD_END = '<!-- GSD-PE:END -->'`. Matches spec delimiters exactly.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:336-358` -- `writeClaudeMd(configDir, peContent)`:
  - Line 340-343: If file does not exist, creates new file with delimited block. Correct.
  - Line 349-351: If delimiters found (`startIdx !== -1 && endIdx !== -1 && endIdx > startIdx`), replaces existing block. Matches spec: "replace existing delimited block."
  - Line 352-355: If no delimiters, appends new block. Matches spec: "append pe content between delimiters."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:848-850` -- `writeClaudeMd` called inside `install()` with pe attribution content. Wired correctly.

- `/Users/philliphall/get-shit-done-pe/bin/install.js:365-385` -- `stripClaudeMd(configDir)`:
  - Line 367-369: If CLAUDE.md does not exist, returns `{ stripped: false, warned: false }`. Safe no-op.
  - Line 375-380: If delimiters found, surgically removes delimited block. Matches spec: "surgical strip of delimited content only."
  - Line 383-384: If no delimiters, returns `{ stripped: false, warned: true }`. Matches spec: "warn user 'Cannot safely remove GSD content from CLAUDE.md -- please remove manually'."

- `/Users/philliphall/get-shit-done-pe/bin/install.js:550-557` -- In `uninstall()`, `stripClaudeMd` result is checked: if `warned`, prints the exact warning message from the spec. Matches spec.

- Non-delimited user content is never overwritten: `writeClaudeMd` either creates a new file, replaces only the delimited block, or appends. `stripClaudeMd` only removes delimited content or warns. Matches spec: "Never overwrite non-delimited user content."

**Cross-layer observations:** None.

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `bin/install.js:279-293` -- detect via npm list, uninstall via npm uninstall, try/catch with warning on failure. Note: warnings accumulated but not surfaced to user in current implementation. |
| FN-02 | met | `bin/install.js:295-326` -- unconditional remnant scan removes gsd:* commands, gsd-* agents, get-shit-done/, hooks/dist/. Never references .planning/. Note: spec asks for "Removed N remnant files" report; not implemented. |
| FN-03 | met | `bin/install.js:18-19,336-385,550-557` -- delimiters defined, writeClaudeMd handles create/replace/append, stripClaudeMd handles surgical strip or warn. |

## Secondary Observations

1. **FN-01 warning surfacing gap**: `ccWarnings` array is populated on failure (line 291) but never printed to console during install. The spec says "warn user." The summary acknowledges this is deferred to a future feature. Behavioral intent partially unmet -- the warning exists in data but is invisible to the user.

2. **FN-02 remnant count reporting gap**: Spec says "Report what was cleaned: 'Removed N remnant files from previous install'." No such output exists. Silent cleanup only.
