# Coding Conventions

**Analysis Date:** 2026-02-28

## Language & Module System

All source is CommonJS (`.cjs`) Node.js. No TypeScript, no ESM. Every file begins with `'use strict'`
is NOT used — the `.cjs` extension handles mode. Module system: `require()` / `module.exports` throughout.

**No linting or formatting tooling is configured.** No `.eslintrc`, `.prettierrc`, or `biome.json` exist.
Style is enforced by convention only, visible from reading the source.

## File Naming Patterns

**Source modules:**
- `get-shit-done/bin/lib/<domain>.cjs` — one file per domain (e.g., `phase.cjs`, `state.cjs`, `core.cjs`)
- `get-shit-done/bin/gsd-tools.cjs` — single CLI entry point (router only, no logic)

**Test files:**
- `tests/<domain>.test.cjs` — mirrors source module name exactly
- `tests/helpers.cjs` — shared test utilities (no `.test.` in name)

**Script files:**
- `scripts/<purpose>.cjs` or `scripts/<purpose>.js` — build/runner scripts

## Naming Conventions

**Functions:**
- Exported CLI command handlers: `cmdVerbNoun` camelCase — e.g., `cmdPhasesList`, `cmdStateLoad`, `cmdVerifySummary`
- Internal helpers: camelCase without `cmd` prefix — e.g., `findPhaseInternal`, `normalizePhaseName`, `comparePhaseNum`
- Functions that are internal-only use the `Internal` suffix: `findPhaseInternal`, `resolveModelInternal`, `generateSlugInternal`

**Variables:**
- camelCase throughout
- Destructuring is preferred at import: `const { escapeRegex, normalizePhaseName } = require('./core.cjs')`

**Constants:**
- SCREAMING_SNAKE_CASE for module-level constants: `MODEL_PROFILES`, `FRONTMATTER_SCHEMAS`, `TOOLS_PATH`

**Object keys in results:**
- snake_case throughout all JSON output objects — e.g., `phase_number`, `commit_docs`, `model_profile`

## Module Organization Pattern

Each lib module follows this structure:
1. JSDoc module comment at top: `/** ModuleName — Purpose */`
2. `require()` imports grouped: Node builtins first, then local modules
3. Functions grouped with visual section dividers
4. Single `module.exports` at the bottom listing all exported symbols

Section dividers use this style:
```js
// ─── Section Name ─────────────────────────────────────────────────────────────
```

## Import Organization

**Order observed:**
1. Node built-ins: `fs`, `path`, `os`, `child_process`
2. Local lib modules: `./core.cjs`, `./frontmatter.cjs`, `./state.cjs`

No third-party npm dependencies in lib code. All external dependencies are dev-only (`c8`, `esbuild`).

## Code Style

**Indentation:** 2 spaces.

**Strings:** Single quotes for code, double quotes allowed in template strings and JSON output.

**Semicolons:** Present throughout — standard semicolon style.

**Arrow functions:** Used for inline callbacks and array methods. Named `function` declarations for all exported/command functions.

**Ternary operator:** Used extensively, including chained ternaries for model resolution and branch name logic.

**Nullish coalescing (`??`):** Used for config defaults — e.g., `config.model_profile ?? 'balanced'`.

**Optional chaining (`?.`):** Used for safe property access on nullable objects — e.g., `phaseInfo?.directory`, `config.model_overrides?.[agentType]`.

## Error Handling

**Strategy:** Fail-fast via two centralized helpers from `core.cjs`:

```js
function output(result, raw, rawValue) {
  // JSON to stdout, then process.exit(0)
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```

**Pattern — guard then call error():**
```js
function cmdFoo(cwd, phase, raw) {
  if (!phase) {
    error('phase required');
  }
  // ... happy path
  output(result, raw, rawValue);
}
```

**Filesystem operations:** Wrapped in silent try/catch returning null or empty values. Never throw from lib functions:
```js
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
```

**Catch blocks:** Empty catches are used deliberately for "does not exist" checks (filesystem presence, git queries). Pattern: `catch {}` with no binding.

**No exceptions propagated to caller.** All errors go to `process.stderr` + `process.exit(1)` or return null/empty defaults.

## Output Pattern

Every command produces JSON to stdout via `output()`:
```js
output(result, raw, rawValue);
// raw=true → writes rawValue as plain string
// raw=false → writes JSON.stringify(result, null, 2)
// If JSON > 50KB → writes to tmpfile and outputs "@file:/path"
```

## Comments

**Module doc:** Single JSDoc block at file top — `/** ModuleName — Purpose */`

**Section headers:** ASCII line dividers `// ─── Name ──` to delimit logical groups within a file.

**Inline comments:** Used sparingly for non-obvious logic, regex patterns, and known quirks/bugs.

**Regression tracking:** Bug comments reference ticket IDs inline:
```js
// Bug: loadConfig previously omitted model_overrides from return value
```
```js
// REG-04: The split(',') on line 53 does NOT respect quotes.
```

## Function Design

**Single responsibility:** Each `cmd*` function handles exactly one CLI command. Shared logic extracted to `core.cjs`.

**Parameters:** `(cwd, ...args, raw)` — `cwd` always first, `raw` (boolean for raw output mode) always last.

**Return values:** Functions do not return values. They call `output()` or `error()` which `process.exit()`.

**Internal helpers:** Return plain values (strings, objects, null). Do not call `output()`/`error()`.

## Module Exports

All exports listed explicitly at the bottom of each file:
```js
module.exports = {
  cmdPhasesList,
  cmdPhaseFind,
  // ...
};
```

No barrel files. Modules are imported directly by `gsd-tools.cjs` which acts as the single router.

---

*Convention analysis: 2026-02-28*
