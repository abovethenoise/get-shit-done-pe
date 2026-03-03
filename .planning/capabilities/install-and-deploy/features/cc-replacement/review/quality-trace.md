# Quality Trace: cc-replacement

## Phase 1: Quality Standards

Evaluating Node.js installer script for: DRY compliance, earned abstractions (4 new functions), dead code, and idiomatic resource management. The cc-replacement feature adds `replaceCc()`, `writeClaudeMd()`, `stripClaudeMd()`, constants `CLAUDE_MD_START`/`CLAUDE_MD_END`, and module-level `ccWarnings` array.

## Phase 2: Trace Against Code

### Finding 1: ccWarnings is dead code with a speculative future

**Category:** Bloat

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:66` -- `const ccWarnings = [];`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:291` -- `ccWarnings.push('cc uninstall failed -- manual cleanup may be needed');`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:328` -- `return { ccWarnings };`
- `/Users/philliphall/get-shit-done-pe/bin/install.js:636` -- `replaceCc(targetDir);` (return value discarded)
- Reasoning: `ccWarnings` is populated but never read. The return value of `replaceCc()` is discarded at the call site. The SUMMARY.md explicitly says it is "stored at module level for future install-feedback feature to surface." This is YAGNI -- speculative infrastructure for a feature that does not exist. The module-level mutable array and the return value are both unused. A warning that nobody sees is not a warning.

---

### Finding 2: Duplicate gsd-check-update cleanup

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:228` -- `'gsd-check-update',  // cc orphan -- removed in pe` (inside `cleanupOrphanedHooks`)
- `/Users/philliphall/get-shit-done-pe/bin/install.js:787-793`:
  ```js
  // Clean up orphaned gsd-check-update hook (deleted predecessor to gsd-auto-update)
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
    if (entry.hooks && Array.isArray(entry.hooks)) {
      return !entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'));
    }
    return true;
  });
  ```
- Reasoning: `cleanupOrphanedHooks(settings)` is called at line 765, which already filters out any hook whose command matches `gsd-check-update` (it is in the `orphanedHookPatterns` array and the generic filter logic at lines 238-253 applies to all event types including SessionStart). The inline filter at lines 787-793 then filters the same `settings.hooks.SessionStart` array for the same pattern a second time. This is redundant -- the hook was already removed.

---

### Finding 3: Triple-implemented gsd-* agent removal

**Category:** DRY

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:307-314` -- `replaceCc()` removes `gsd-*` files from `agents/`:
  ```js
  if (entry.isFile() && entry.name.startsWith('gsd-')) {
    fs.unlinkSync(path.join(agentsDir, entry.name));
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:666-673` -- `install()` removes `gsd-*.md` files from agents before copying new ones:
  ```js
  if (file.startsWith('gsd-') && file.endsWith('.md')) {
    fs.unlinkSync(path.join(agentsDest, file));
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:429-441` -- `uninstall()` removes `gsd-*.md` files from agents.
- Reasoning: During a normal `install()` flow, `replaceCc()` runs first and deletes all `gsd-*` files (broader pattern -- no `.md` suffix filter). Then `install()` at line 666 deletes `gsd-*.md` files from the same directory. The second pass is always a no-op after `replaceCc` because `replaceCc` already removed everything matching `gsd-*`. The three implementations also have subtly different filters (`gsd-*` vs `gsd-*.md`), which is a maintenance hazard -- the broader pattern in `replaceCc` could delete non-agent files that happen to start with `gsd-`.

---

### Finding 4: writeClaudeMd and stripClaudeMd are justified

**Category:** Earned Abstractions

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:336-358` -- `writeClaudeMd()` handles three distinct cases (create, replace, append) with delimiter management.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:365-385` -- `stripClaudeMd()` is the inverse operation, used in `uninstall()` at line 551.
- Reasoning: These two functions are called from different code paths (install vs uninstall), encapsulate non-trivial delimiter logic, and are correctly symmetric. The abstraction is earned.

---

### Finding 5: replaceCc removes get-shit-done/ directory that install() will immediately recreate

**Category:** KISS

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:317-319` -- `replaceCc()` removes `get-shit-done/` directory.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:654-655` -- `install()` copies fresh `get-shit-done/` via `copyWithPathReplacement`.
- `/Users/philliphall/get-shit-done-pe/bin/install.js:174-176` -- `copyWithPathReplacement` already does `fs.rmSync(destDir, { recursive: true })` before copying.
- Reasoning: The removal in `replaceCc` is technically redundant since `copyWithPathReplacement` also removes before copying. However, this is defensible: `replaceCc` is conceptually a "clean slate" operation that should not depend on the behavior of downstream copy functions. The duplication is minimal (one `rmSync` call) and the coupling cost of removing it would be higher than the redundancy cost.

---

### Finding 6: replaceCc function is justified

**Category:** Earned Abstractions

**Verdict:** met

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:276-329` -- `replaceCc()` encapsulates 4 distinct cleanup operations (npm uninstall, commands cleanup, agents cleanup, directory cleanup).
- Reasoning: This is a single-purpose function with a clear lifecycle boundary (run once at install time, before pe artifacts are written). The alternative -- inlining 50 lines of cleanup into `install()` -- would make an already long function worse. The abstraction earns its place.

---

## Summary

| # | Finding | Verdict |
|---|---------|---------|
| 1 | ccWarnings is dead code (YAGNI) | not met |
| 2 | Duplicate gsd-check-update cleanup | not met |
| 3 | Triple-implemented gsd-* agent removal | not met (suspected) |
| 4 | writeClaudeMd / stripClaudeMd justified | met |
| 5 | Redundant get-shit-done/ removal | met (defensible) |
| 6 | replaceCc as abstraction | met |

**Actionable findings: 3 (Findings 1, 2, 3)**
