# Quality Trace: install-feedback

**Reviewer posture:** guilty-until-proven-innocent
**Framing:** enhance -- "Does the enhancement avoid bloating existing modules? Are existing patterns respected?"

## Phase 1: Quality Standards

Evaluating Node.js CLI code for:
- Console suppression pattern: is the complexity earned?
- DRY compliance between `bin/install.js` and `scripts/validate-install.js`
- Result object pattern: does it justify its structure?
- `require.main` guard: idiomatic Node.js usage

## Phase 2: Trace Against Code

### Finding 1: Console suppression is a code smell masking a design gap

**Category:** Unnecessary Abstraction

**Verdict:** not met (suspected)

**Evidence:**
- `bin/install.js:977-988`:
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
- Reasoning: Monkey-patching globals to suppress output is fragile. If `runValidation()` throws before the `finally` block executes due to an uncatchable error (e.g., a native addon crash), console is permanently silenced for the process. More importantly, this pattern exists because `runValidation()` was designed to log directly to console rather than accepting an output strategy. The function already returns a structured result object -- the console.log calls inside it (`pass()`, `fail()`) are presentation logic baked into business logic. A `quiet` option (the `options = {}` parameter on line 29 of validate-install.js is already there but unused) would eliminate the monkey-patch entirely. The complexity is not earned when the simpler solution was already scaffolded.

### Finding 2: Duplicated recursive directory scanning logic (DRY violation)

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `bin/install.js:593-610` -- `validateNoUnresolvedTokens()`:
```js
function validateNoUnresolvedTokens(dirs) {
  const failures = [];
  function scan(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('{GSD_ROOT}')) failures.push(full);
      }
    }
  }
  ...
}
```
- `scripts/validate-install.js:202-215` -- `scanForTokens()`:
```js
function scanForTokens(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanForTokens(full);
      } else if (/\.(md|js|json)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('{GSD_ROOT}')) {
          tokenHits.push(full.replace(configDir, '~/.claude'));
        }
      }
    }
  }
```
- And again at `scripts/validate-install.js:296-309` -- `scanForStale()`, same recursive traversal structure with different match logic.
- Reasoning: Three copies of the same recursive-directory-walk-and-match-file-content pattern across two files. The install.js copy scans the same directories for the same token (`{GSD_ROOT}`) as the validation script. Since `runValidation()` is now called immediately after `install()`, the token check in `install()` (lines 732-740) is redundant -- validation already catches it. This is both a DRY violation and dead-weight code.

### Finding 3: Unused `options` parameter signals incomplete refactor

**Category:** Bloat

**Verdict:** not met (proven)

**Evidence:**
- `scripts/validate-install.js:29`:
```js
function runValidation(options = {}) {
```
- `options` is never read anywhere in the function body. It is never passed by the caller at `bin/install.js:982`.
- Reasoning: This is scaffolding for a `quiet` mode that was never implemented. The parameter's existence creates false expectation -- a reader assumes it does something. Either use it (to solve Finding 1) or remove it.

### Finding 4: Duplicated color constant declarations

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `bin/install.js:11-15`:
```js
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';
```
- `scripts/validate-install.js:23-27`:
```js
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';
```
- Reasoning: Four identical constants duplicated across two files in the same project. Minor on its own, but compounds with Findings 1-2 to show these two files share significant overlapping concerns without any shared module. For a two-file feature this is tolerable but worth noting as a pattern that will not scale.

### Finding 5: require.main guard is idiomatic and correctly applied

**Category:** Idiomatic Excellence

**Verdict:** met

**Evidence:**
- `scripts/validate-install.js:368-380`:
```js
if (require.main === module) {
  const result = runValidation();
  if (result.failed > 0) {
    ...
    process.exit(1);
  } else {
    ...
    process.exit(0);
  }
}
```
- Reasoning: Standard Node.js pattern for dual-use modules. `process.exit()` is correctly confined to the standalone branch, keeping `runValidation()` safe for programmatic use. No finding.

### Finding 6: Result object pattern is clean and justified

**Category:** Structural Parsimony

**Verdict:** met

**Evidence:**
- `bin/install.js:728-729`:
```js
return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };
```
- `bin/install.js:852`:
```js
return { ok: true, settingsPath, settings, statuslineCommand };
```
- Reasoning: Replacing scattered `process.exit(1)` calls with a returned result object is the right pattern. It makes `install()` testable and composable. The dual shape (`ok: true` carries different fields than `ok: false`) is a minor wart but acceptable for a CLI script that is not a public API.

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | Console suppression via monkey-patch | Unnecessary Abstraction | not met (suspected) |
| 2 | Triple-duplicated recursive dir scan | DRY | not met (proven) |
| 3 | Unused `options` parameter | Bloat | not met (proven) |
| 4 | Duplicated color constants | DRY | not met (proven) |
| 5 | require.main guard | Idiomatic | met |
| 6 | Result object pattern | Structural | met |

**Key concern:** Findings 1, 2, and 3 are interconnected. The console suppression (Finding 1) exists because `runValidation()` was not given a quiet mode despite having an `options` parameter scaffolded for exactly that (Finding 3). The token scan duplication (Finding 2) exists because `install()` does not trust the validation it is about to call. These three findings together represent a single design gap: the boundary between install and validation was not cleanly drawn during this feature.
