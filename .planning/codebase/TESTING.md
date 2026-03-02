# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:** Node.js built-in test runner (`node:test`) — no Jest, no Vitest, no Mocha.
- Available since Node 18. Used via `--test` flag.
- Config: none — runner is invoked directly in `scripts/run-tests.cjs`

**Assertion Library:** Node.js built-in `node:assert` (strict mode assertions).

**Coverage:** `c8` v11 — requires Node 20+. Configured inline in `package.json` scripts.

**Run Commands:**
```bash
npm test                # Run all tests (Node 18 compatible, no coverage)
npm run test:coverage   # Run with coverage (Node 20+ only, 70% line threshold)
```

Coverage target: 70% lines, scoped to `get-shit-done/bin/lib/*.cjs`, excluding `tests/**`.

## Test File Organization

**Location:** All tests live in `/tests/` at project root. Co-location not used.

**Naming:**
- `tests/<module>.test.cjs` — mirrors the source file name
- `tests/helpers.cjs` — shared utilities (no `.test.` suffix)

**One-to-one mapping:**
```
get-shit-done/bin/lib/core.cjs          → tests/core.test.cjs
get-shit-done/bin/lib/phase.cjs         → tests/phase.test.cjs
get-shit-done/bin/lib/state.cjs         → tests/state.test.cjs
get-shit-done/bin/lib/frontmatter.cjs   → tests/frontmatter.test.cjs
get-shit-done/bin/lib/verify.cjs        → tests/verify.test.cjs
get-shit-done/bin/lib/milestone.cjs     → tests/milestone.test.cjs
get-shit-done/bin/lib/roadmap.cjs       → tests/roadmap.test.cjs
get-shit-done/bin/lib/commands.cjs      → tests/commands.test.cjs
get-shit-done/bin/lib/config.cjs        → tests/config.test.cjs
get-shit-done/bin/lib/init.cjs          → tests/init.test.cjs
```

Additional tests not 1:1 with a lib file:
- `tests/dispatcher.test.cjs` — CLI argument routing tests
- `tests/verify-health.test.cjs` — `validate health` command tests
- `tests/frontmatter-cli.test.cjs` — CLI-level frontmatter command tests
- `tests/codex-config.test.cjs` — Codex-specific config behavior

## Test Structure

**Standard suite pattern:**
```js
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('command-name command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('description of expected behavior', () => {
    // arrange: write files to tmpDir
    // act: run command via runGsdTools()
    // assert: parse JSON output, use assert.*
  });
});
```

**Section headers in test files** use the same ASCII divider style as source:
```js
// ─── describe block name ──────────────────────────────────────────────────────
```

**Multiple describe blocks per file** — one per command or logical group. No nesting beyond two levels (`describe` → `test` or `describe` → `describe` → `test`).

## Two Test Categories

### 1. Unit tests (pure function tests)

Used for functions in `core.cjs` and `frontmatter.cjs` that have no side effects.
No temp directories required. Import functions directly and assert on return values.

```js
// From tests/core.test.cjs
const { normalizePhaseName, comparePhaseNum } = require('../get-shit-done/bin/lib/core.cjs');

test('pads single digit', () => {
  assert.strictEqual(normalizePhaseName('1'), '01');
});
```

### 2. CLI integration tests (subprocess tests)

Used for all `cmd*` functions, run through `gsd-tools.cjs` via `runGsdTools()`.
Require temp directory setup. Parse JSON output from stdout.

```js
// From tests/state.test.cjs
test('extracts basic fields from STATE.md', () => {
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'STATE.md'),
    `# Project State\n\n**Current Phase:** 03\n...`
  );

  const result = runGsdTools('state-snapshot', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.current_phase, '03', 'current phase extracted');
});
```

## Mocking

**Framework:** None. No mocking library used.

**Strategy:** Real filesystem via temp directories. All I/O tests use `fs.mkdtempSync()` to create isolated project trees, then `fs.rmSync()` on cleanup.

```js
// Pattern: create real files, run real command, assert real output
fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), content);
const result = runGsdTools('roadmap get-phase 1', tmpDir);
```

**What is NOT mocked:**
- Filesystem operations (all real)
- `process.cwd()` (overridden via `--cwd` flag or `createTempProject()`)
- Git operations — tests that need git use `createTempGitProject()` which runs real `git init`

**What bypasses mocking entirely:**
- Pure function tests import the module directly — no subprocess, no filesystem

## Fixtures and Factories

**Test helpers in `tests/helpers.cjs`:**

```js
// Creates temp dir with .planning/phases/ structure
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Creates temp dir with initialized git repo + initial commit
function createTempGitProject() {
  // ... runs git init, git config, initial commit
  return tmpDir;
}

// Removes temp dir
function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Runs gsd-tools.cjs and captures stdout/stderr
function runGsdTools(args, cwd) {
  // Supports string (shell-interpreted) or array (execFileSync, safe for special chars)
  // Returns { success: bool, output: string, error: string }
}
```

**Inline fixtures:** Content strings built inline inside each test. No separate fixture files. Multi-line content uses template literals or `[...].join('\n')`:

```js
// From tests/verify.test.cjs
function validPlanContent({ wave = 1, dependsOn = '[]', autonomous = 'true', extraTasks = '' } = {}) {
  return [
    '---',
    'phase: 01-test',
    'plan: 01',
    `wave: ${wave}`,
    // ...
  ].join('\n');
}
```

Local helper functions defined within a `describe` block scope:
```js
describe('loadConfig', () => {
  function writeConfig(obj) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify(obj, null, 2)
    );
  }
  // tests use writeConfig(...)
});
```

## Coverage

**Requirements:** 70% line coverage enforced via `npm run test:coverage`.
- Tool: `c8` v11
- Scope: `get-shit-done/bin/lib/*.cjs` only
- Excluded: `tests/**`

**View Coverage:**
```bash
npm run test:coverage
```

CI runs coverage on Node 20 and 22. Node 18 runs tests without coverage (c8 v11 requires Node 20+).

## CI Configuration

**File:** `.github/workflows/test.yml`

**Matrix:**
- OS: `ubuntu-latest`, `macos-latest`, `windows-latest`
- Node: `18`, `20`, `22`
- Fail-fast: `true`

Cross-platform shell: `shell: bash` set explicitly so glob expansion works on Windows.

## Regression Test Pattern

Known bugs are documented and tested explicitly with regression IDs:

```js
// Bug: loadConfig previously omitted model_overrides from return value
test('returns model_overrides when present (REG-01)', () => {
  writeConfig({ model_overrides: { 'gsd-executor': 'opus' } });
  const config = loadConfig(tmpDir);
  assert.deepStrictEqual(config.model_overrides, { 'gsd-executor': 'opus' });
});
```

Known unfixed bugs are also tested to document current (broken) behavior:
```js
test('handles quoted commas in inline arrays — REG-04 known limitation', () => {
  // REG-04: The split(',') on line 53 does NOT respect quotes.
  // This test documents the CURRENT (buggy) behavior.
  assert.ok(result.key.length > 2, 'REG-04: split produces more items than intended');
});
```

## Assertion Patterns

**Preferred assertions:**
```js
assert.strictEqual(result.phase_number, '01');      // primitive equality
assert.deepStrictEqual(output.directories, [...]);  // object/array equality
assert.ok(result.success, `Command failed: ${result.error}`);  // truthiness with failure message
assert.ok(fs.existsSync(path.join(...)));           // file existence
```

**Assertion messages:** Always provided for `assert.ok()` calls to surface context on failure.
`assert.strictEqual` and `assert.deepStrictEqual` use an optional trailing string for context.

**Success check pattern for CLI tests:**
```js
const result = runGsdTools('command args', tmpDir);
assert.ok(result.success, `Command failed: ${result.error}`);
const output = JSON.parse(result.output);
// then assert on output fields
```

---

*Testing analysis: 2026-02-28*
