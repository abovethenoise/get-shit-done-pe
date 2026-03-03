# Technical Trace: cc-replacement (TC-01)

## Phase 1: Requirements Internalized

### TC-01: Replacement integration in install.js

The spec requires a pre-install phase in `bin/install.js` that detects and removes get-shit-done-cc before pe artifacts are copied. Constraints:

1. **macOS + Linux compatible** -- Node.js `fs` + `child_process` only, no platform-specific calls
2. **execSync with error handling** -- all npm commands wrapped in try/catch (execSync throws on non-zero exit)
3. **Idempotent** -- running twice produces identical state; no errors on missing files
4. **settings.json additive merge only** -- never overwrite entire file

Sub-requirements from FN-01/FN-02/FN-03 feed into TC-01:
- FN-01: Best-effort upstream uninstall via npm
- FN-02: Unconditional remnant scan for gsd:* commands, gsd-* agents, get-shit-done/, hooks/dist/
- FN-03: CLAUDE.md delimiter management (GSD-PE:START/END), surgical strip on uninstall

---

## Phase 2: Trace Against Code

### TC-01: Replacement integration in install.js

**Verdict:** met

#### TC-01a: macOS + Linux compatible (Node.js fs + child_process only)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:1-8` -- imports are `fs`, `path`, `os`, `readline`, `child_process.execSync`, and a local script. No platform-specific binaries, no shell-specific syntax.
- `replaceCc()` (lines 276-329) uses only `fs.existsSync`, `fs.readdirSync`, `fs.unlinkSync`, `fs.rmSync`, `path.join`, and `execSync` with plain npm commands.
- `writeClaudeMd()` (lines 336-358) and `stripClaudeMd()` (lines 365-385) use only `fs` and `path`.
- Reasoning: All APIs are cross-platform Node.js stdlib. No `/bin/bash`, no `rm -rf`, no platform conditionals needed.

#### TC-01b: execSync with error handling (all npm calls try/caught)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:279-284`:
  ```js
  try {
    execSync('npm list -g get-shit-done-cc --depth=0', { stdio: 'pipe' });
    ccInstalled = true;
  } catch (e) {
    ccInstalled = false; // exit 1 = not installed
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:287-292`:
  ```js
  if (ccInstalled) {
    try {
      execSync('npm uninstall -g get-shit-done-cc', { stdio: 'pipe' });
    } catch (e) {
      ccWarnings.push('cc uninstall failed — manual cleanup may be needed');
    }
  }
  ```
- Reasoning: Both npm calls are individually wrapped in try/catch. The `{ stdio: 'pipe' }` option prevents stdout/stderr leaking to the terminal. Failure of either call does not throw -- the function continues to the remnant scan unconditionally.

#### TC-01c: Idempotent (running twice produces identical state)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:298` -- `if (fs.existsSync(commandsDir))` guards the commands scan
- `/Users/philliphall/get-shit-done-pe/bin/install.js:307` -- `if (fs.existsSync(agentsDir))` guards the agents scan
- `/Users/philliphall/get-shit-done-pe/bin/install.js:318` -- `if (fs.existsSync(gsdDir))` guards get-shit-done/ removal
- `/Users/philliphall/get-shit-done-pe/bin/install.js:323` -- `if (fs.existsSync(hooksDist))` guards hooks/dist/ removal
- npm detection (line 279-284): on second run, `npm list -g` will exit 1 (already uninstalled), caught by try/catch, `ccInstalled = false`, uninstall skipped.
- `writeClaudeMd()` line 349: `if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx)` -- replaces existing delimited block rather than appending a duplicate.
- Reasoning: Every filesystem operation is guarded by `existsSync`. npm calls are try/caught. CLAUDE.md write detects and replaces existing block. Second run is a no-op for cleanup and an in-place replacement for CLAUDE.md content.

#### TC-01d: settings.json additive merge only

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:764-765`:
  ```js
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = cleanupOrphanedHooks(readSettings(settingsPath));
  ```
- `readSettings()` (lines 114-123) reads existing file or returns `{}`.
- The install function (lines 780-846) only adds hooks if not already present (e.g., line 796-798: `hasAutoUpdateHook` check before push).
- `writeSettings()` is called via `finishInstall()` (line 870) which writes the accumulated settings object.
- `replaceCc()` itself does NOT touch settings.json at all -- it only handles file artifacts.
- Reasoning: settings.json is always read first, modified in-place (add keys, filter orphaned hooks), then written back. No path overwrites the entire file with a fresh object. The `cleanupOrphanedHooks` function filters entries from existing arrays but never replaces the whole structure.

#### TC-01e: replaceCc() called at top of install() before artifact copy

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:636`:
  ```js
  replaceCc(targetDir);
  ```
  This is the first substantive call in `install()`, appearing before `cleanupOrphanedFiles(targetDir)` (line 639) and before any `copyWithPathReplacement` calls (line 647+).
- Reasoning: Matches spec requirement that cc cleanup is a "pre-install phase" before pe artifacts are copied.

#### TC-01f: FN-01 -- Best-effort upstream uninstall

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:280` -- detection via `npm list -g get-shit-done-cc --depth=0`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:289` -- removal via `npm uninstall -g get-shit-done-cc`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:291` -- failure pushes to `ccWarnings`, does not throw

**Spec-vs-reality gap:** The FEATURE.md spec (FN-01) says to use `npx get-shit-done-cc@latest --claude --global --uninstall` for upstream uninstall. The RESEARCH.md (referenced in plan) discovered this approach has a known bug where upstream misdetects global/local when run from $HOME. The plan explicitly chose `npm uninstall -g get-shit-done-cc` instead. The FEATURE.md Decisions section (line 101) still references the npx approach, but the plan and research overrode this. The 01-SUMMARY.md documents this deviation: "Used npm uninstall -g (not upstream npx) per RESEARCH.md". This is a justified deviation -- the spec's suggested approach was known-buggy.

#### TC-01g: FN-02 -- Post-uninstall remnant verification

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:295-326` -- unconditional remnant scan covering:
  - `gsd:*` commands in commands/ (line 300)
  - `gsd-*` agents in agents/ (line 310)
  - `get-shit-done/` directory (line 319)
  - `hooks/dist/` directory (line 325)
- `/Users/philliphall/get-shit-done-pe/bin/install.js:228` -- `'gsd-check-update'` added to `cleanupOrphanedHooks` patterns
- Reasoning: All four safe-to-remove categories from the spec are covered. Scan runs unconditionally (not gated on ccInstalled), matching the spec requirement that upstream uninstall is unreliable.

**Observation:** FN-02 spec says "Report what was cleaned: 'Removed N remnant files from previous install'". The implementation does not log a count of removed remnants. The `replaceCc()` function silently removes files without any console output. This is a minor omission from FN-02 but does not affect TC-01 (which is about integration constraints, not UX messaging).

#### TC-01h: FN-03 -- CLAUDE.md delimiter management

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:18-19`:
  ```js
  const CLAUDE_MD_START = '<!-- GSD-PE:START -->';
  const CLAUDE_MD_END = '<!-- GSD-PE:END -->';
  ```
- `writeClaudeMd()` (lines 336-358): creates new file if absent (line 341), replaces existing delimited block (line 351), or appends new block (line 354). Never overwrites non-delimited content.
- `stripClaudeMd()` (lines 365-385): surgically removes delimited block (line 376-380), returns `{ stripped: false, warned: true }` when no delimiters found (line 384) -- matching spec "warn user, don't touch".
- Wired into install: line 849-850 in `install()`.
- Wired into uninstall: lines 551-557 in `uninstall()`, with user-facing warning message matching spec text.

#### TC-01i: .planning/ never touched

**Evidence:**
- Grep for `.planning` in `/Users/philliphall/get-shit-done-pe/bin/install.js` returns zero matches.
- Reasoning: No code path references or operates on `.planning/` in any form.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 (overall) | met | All four constraints satisfied -- see sub-items below |
| TC-01a: macOS+Linux compat | met | bin/install.js:1-8 -- stdlib only (fs, path, os, child_process) |
| TC-01b: execSync error handling | met | bin/install.js:279-292 -- both npm calls individually try/caught |
| TC-01c: Idempotent | met | bin/install.js:298-326 -- all ops guarded by existsSync; CLAUDE.md replaces existing block |
| TC-01d: settings.json additive | met | bin/install.js:764-765 -- read-modify-write pattern; replaceCc does not touch settings |
| TC-01e: Pre-install ordering | met | bin/install.js:636 -- replaceCc(targetDir) first call in install() |
| TC-01f: FN-01 upstream uninstall | met | bin/install.js:280,289 -- detect + remove with try/catch |
| TC-01g: FN-02 remnant scan | met | bin/install.js:295-326 -- all four safe-to-remove categories, unconditional |
| TC-01h: FN-03 CLAUDE.md delimiters | met | bin/install.js:18-19,336-385 -- write/strip with delimiter management |
| TC-01i: .planning/ untouched | met | grep returns zero matches for .planning in install.js |

### Spec-vs-Reality Gaps

| Gap | Spec Said | Reality | Justification |
|-----|-----------|---------|---------------|
| Upstream uninstall method | `npx get-shit-done-cc@latest --claude --global --uninstall` (FN-01 line 49) | `npm uninstall -g get-shit-done-cc` (bin/install.js:289) | Upstream has known $HOME cwd bug; research finding led plan to use direct npm uninstall instead. Documented in 01-SUMMARY.md decisions. |
| Remnant removal logging | FN-02: "Report what was cleaned: Removed N remnant files" | Silent removal -- no console output from replaceCc() | Minor FN-02 UX gap; does not affect TC-01 technical constraints. May be addressed by future install-feedback feature per 01-SUMMARY.md. |
