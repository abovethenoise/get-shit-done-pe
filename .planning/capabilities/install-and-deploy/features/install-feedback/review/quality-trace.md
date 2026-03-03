# Quality Trace: install-feedback (Re-review after 6 fixes)

**Reviewer posture:** guilty-until-proven-innocent
**Framing:** enhance -- "Does the enhancement avoid bloating existing modules? Are existing patterns respected?"
**Files reviewed:** `bin/install.js` (996 lines), `scripts/validate-install.js` (383 lines), `hooks/gsd-auto-update.js` (109 lines)

---

## Phase 1: Quality Standards

Evaluating Node.js CLI code (post-fix) for:
- DRY compliance across install, validation, and hook layers
- Dead code and unused parameters
- Complexity justification for remaining constructs
- Robustness of error handling and validation coverage
- Idiomatic Node.js patterns

---

## Phase 2: Prior Fix Verification

All six prior findings confirmed resolved:

| Prior # | Issue | Status |
|---------|-------|--------|
| 1 | `readSettings` returns `{ settings, wasCorrupt }` | Fixed (line 132) |
| 2 | Validation reordered after settings write | Fixed (lines 943-948) |
| 3 | Banner PE identity prominent | Fixed (line 48) |
| 4 | Redundant token scan removed | Fixed (no `validateNoUnresolvedTokens` found) |
| 5 | Empty if-branch fixed | Fixed (all `verifyInstalled` calls use negation pattern) |
| 6 | Auto-update error handler uses in-scope cache | Fixed (line 79 uses closure `cache`) |

No regressions introduced by fixes. Line counts dropped from ~1040 to ~996 in install.js, consistent with dead code removal.

---

## Phase 2: Trace Against Code (New/Remaining Findings)

### Finding 1: `getCommitAttribution()` re-reads and re-parses settings.json on every recursive call

**Category:** KISS

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:195` -- `const attribution = getCommitAttribution();` (inside `copyWithPathReplacement`, called recursively per directory)
- `/Users/philliphall/get-shit-done-pe/bin/install.js:665` -- `const attribution = getCommitAttribution();` (in agent copy block, separate call)
- `/Users/philliphall/get-shit-done-pe/bin/install.js:150-158` -- `getCommitAttribution()` calls `readSettings()` which does `fs.readFileSync` + `JSON.parse` each time

- Reasoning: `copyWithPathReplacement` is recursive. Every subdirectory descent triggers a fresh disk read and JSON parse of `settings.json` via `getCommitAttribution()`. The attribution value cannot change during a single install run. This is redundant I/O proportional to directory depth. The function should read once and pass the value through, or cache the result at module scope.

---

### Finding 2: Duplicate non-interactive TTY fallback -- dead code in `promptLocation()`

**Category:** DRY / Dead code

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:894-897` -- inside `promptLocation()`:
  ```js
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    runInstall(true, false);
    return;
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:989-991` -- in main block:
  ```js
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    runInstall(true, false);
  ```
- Reasoning: The main block (line 989) checks `!process.stdin.isTTY` before ever calling `promptLocation()`. When TTY is absent, `runInstall(true, false)` executes at line 991 and `promptLocation()` is never reached. The guard inside `promptLocation()` at lines 894-897 is unreachable dead code. The identical message string and logic appear in both locations.

---

### Finding 3: `verifyInstalled` accepts unused `description` parameter

**Category:** Dead code

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:585` -- `function verifyInstalled(dirPath, description) {`
- Call sites at lines 636, 644, 675, 696 all pass a description string.
- The function body (lines 586-598) never references `description`.
- Reasoning: The parameter is dead weight. Every call site constructs a string argument that is silently discarded. This is likely a remnant from an earlier version where the description was logged.

---

### Finding 4: Agent copy block duplicates `copyWithPathReplacement` logic inline

**Category:** DRY

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:664-674`:
  ```js
  const attribution = getCommitAttribution();
  for (const entry of agentEntries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
      const gsdRootRegex = /\{GSD_ROOT\}\//g;
      content = content.replace(gsdRootRegex, pathPrefix);
      content = processAttribution(content, attribution);
      fs.writeFileSync(path.join(agentsDest, entry.name), content);
    }
  }
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:203-208` (inside `copyWithPathReplacement`):
  ```js
  let content = fs.readFileSync(srcPath, 'utf8');
  const gsdRootRegex = /\{GSD_ROOT\}\//g;
  content = content.replace(gsdRootRegex, pathPrefix);
  content = processAttribution(content, attribution);
  fs.writeFileSync(destPath, content);
  ```
- Reasoning: The agent copy block manually reimplements the same token-replace + attribution pipeline. `copyWithPathReplacement` already handles `.md` files with the same transforms and does a clean install (removes dest first). The agent block also pre-cleans old `gsd-*.md` files (lines 655-660), but `copyWithPathReplacement` already calls `fs.rmSync(destDir, { recursive: true })` which would achieve the same result. If replacement logic ever changes (new tokens, new transforms), both sites must be updated independently. This is a maintenance tax.

---

### Finding 5: `gsd-auto-update.js` missing from validation expected hooks list

**Category:** Robustness

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/scripts/validate-install.js:182`:
  ```js
  const expectedHooks = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js'];
  ```
- `/Users/philliphall/get-shit-done-pe/bin/install.js:689`:
  ```js
  const hookFiles = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
  ```
- Reasoning: The installer copies 4 hook files. The validation script only checks for 3. `gsd-auto-update.js` is installed but never validated. If the auto-update hook fails to copy, no post-install check catches it. The two lists should be in sync.

---

### Finding 6: Unnecessary `return;` at end of `replaceCc`

**Category:** Dead code

**Verdict:** not met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:341` -- `return;`
- Reasoning: This is the last statement in a void function. The function returns implicitly. The explicit `return;` is dead code.

---

### Finding 7: Version comparison in auto-update uses strict string equality

**Category:** Robustness

**Verdict:** not met (suspected)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/hooks/gsd-auto-update.js:63`:
  ```js
  if (cache.currentVersion && latestVersion === cache.currentVersion) {
  ```
- Reasoning: Strict string equality means any pre-release suffix difference (`1.9.3` vs `1.9.3-beta.1`) or cache whitespace would trigger a spurious background `npm install`. Given the hook's contract (silent, no-fail), this is not a crash risk -- just wasted spawns. The hook has no semver dependency, so adding one would increase surface area. This is a known tradeoff, flagged for awareness.

---

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | `getCommitAttribution()` re-reads settings per recursive call | KISS | not met (suspected) |
| 2 | Duplicate non-interactive fallback in `promptLocation()` | DRY / Dead code | not met (proven) |
| 3 | Unused `description` parameter in `verifyInstalled` | Dead code | not met (proven) |
| 4 | Agent copy block duplicates `copyWithPathReplacement` | DRY | not met (suspected) |
| 5 | `gsd-auto-update.js` missing from validation hooks list | Robustness | not met (proven) |
| 6 | Unnecessary `return;` at end of `replaceCc` | Dead code | not met (proven) |
| 7 | Version comparison uses string equality, not semver | Robustness | not met (suspected) |

**Top concerns by impact:**

1. **Finding 5** (proven) -- Validation gap. A hook is deployed but not checked. Straightforward one-line fix to add it to the array.
2. **Finding 2** (proven) -- Dead code path that duplicates logic. The guard in `promptLocation()` can never execute given the main block's pre-check.
3. **Finding 4** (suspected) -- Two independent sites implementing the same file-transform pipeline. Maintenance risk if transforms change.
4. **Finding 1** (suspected) -- Redundant I/O per recursive directory call. Low practical impact (small tree), but the fix is trivial (hoist the call).

Findings 3, 6 are minor cleanup items. Finding 7 is a known tradeoff with low blast radius.
