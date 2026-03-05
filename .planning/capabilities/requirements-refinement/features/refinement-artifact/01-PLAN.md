---
phase: requirements-refinement/refinement-artifact
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/bin/lib/refinement.cjs
  - get-shit-done/bin/gsd-tools.cjs
autonomous: true
requirements:
  - TC-01
  - TC-02
  - FN-01

must_haves:
  truths:
    - "`refinement-init` CLI route creates `.planning/refinement/` directory structure and snapshots existing state"
    - "`refinement-write` CLI route writes named artifact files to the refinement directory"
    - "Markdown table parser correctly extracts row objects from pipe-delimited tables"
    - "diffMaps utility computes added/removed/changed sets from two keyed Maps"
    - "Pre-scan snapshot captures RECOMMENDATIONS.md content and findings/ listing (or null on first run)"
  artifacts:
    - path: "get-shit-done/bin/lib/refinement.cjs"
      provides: "cmdRefinementInit, cmdRefinementWrite, parseMarkdownTable, diffMaps, snapshotFindings, snapshotMatrix, snapshotDependencyGraph exports"
    - path: "get-shit-done/bin/gsd-tools.cjs"
      provides: "refinement-init and refinement-write case entries in main switch"
  key_links:
    - from: "get-shit-done/bin/gsd-tools.cjs"
      to: "get-shit-done/bin/lib/refinement.cjs"
      via: "require('./lib/refinement.cjs') in case blocks"
      pattern: "require.*refinement"
---

<objective>
Create the refinement CLI module with directory management routes, markdown parsing utilities, and delta diffing primitives.

Purpose: Establish the technical foundation (CLI routes + utilities) that FN-02/FN-03 and the orchestrator will call to manage refinement artifacts.
Output: `lib/refinement.cjs` module with 2 CLI commands + 4 utility functions; routes wired into `gsd-tools.cjs`.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md
@.planning/capabilities/requirements-refinement/features/refinement-artifact/RESEARCH.md

<interfaces>
Existing pattern to follow (from `lib/capability.cjs`):
- CJS module: `const fs = require('fs'); const path = require('path');`
- Import core utilities: `const { output, error, safeReadFile } = require('./core.cjs');`
- Export command functions: `module.exports = { cmdRefinementInit, cmdRefinementWrite };`
- Commands terminate via `output(result, raw)` which calls `process.exit(0)`

Route wiring pattern (from `gsd-tools.cjs`):
```
case 'refinement-init': {
  const { cmdRefinementInit } = require('./lib/refinement.cjs');
  cmdRefinementInit(cwd, raw);
  break;
}
```

Key design decisions:
- DELTA.md naming collision: This feature owns DELTA.md. change-application's execution log will use EXECUTION-LOG.md (resolved at spec level, not implementation).
- Finding ID stability: Accept current-run sequential IDs for v1. Delta shows what changed within current pipeline context.
- scan-checkpoint: Checkpoint read/write for pairs/ is a shared utility in this module (~20 lines). No cross-feature dependency.
- `refinement-write` accepts `--type` (matrix|dependency-graph|finding|delta|checkpoint) and `--content-file` path. It is a dumb file writer.
- `refinement-init` creates directory structure, snapshots existing RECOMMENDATIONS.md + findings/ listing, clears stale findings.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create lib/refinement.cjs with CLI commands and utility functions</name>
  <reqs>TC-01, TC-02, FN-01</reqs>
  <files>get-shit-done/bin/lib/refinement.cjs</files>
  <action>
  Create `get-shit-done/bin/lib/refinement.cjs` following the established CJS module pattern.

  **Exported CLI commands:**

  1. `cmdRefinementInit(cwd, raw)` — TC-01, FN-01
     - Create `.planning/refinement/` with subdirectories: `findings/`, `pairs/`
     - Use `fs.mkdirSync(dir, { recursive: true })` for each
     - Snapshot existing state for delta computation:
       - If `.planning/refinement/RECOMMENDATIONS.md` exists: read its full content
       - If `.planning/refinement/findings/` exists: read all `FINDING-*.md` files, sort alphabetically, extract each file's name and first 3 lines (ID + summary) into a Map keyed by finding ID
       - If `.planning/refinement/matrix.md` exists: parse via `parseMarkdownTable` into a Map keyed by capability pair
       - If `.planning/refinement/dependency-graph.md` exists: parse via `parseMarkdownTable` into a Map keyed by `${from}|${to}` composite key
     - If no prior artifacts exist (first run): snapshot is `{ recommendations: null, findings: new Map(), matrix: new Map(), dependencyGraph: new Map() }`
     - Clear findings/ directory (remove all existing FINDING-*.md files to prevent orphans)
     - Output snapshot as JSON (Maps serialized as arrays of `[key, value]` pairs)
     - Path: `.planning/refinement/` relative to cwd

  2. `cmdRefinementWrite(cwd, args, raw)` — TC-01
     - Accepts: `--type <type>` and `--content-file <path>`
     - Valid types: `matrix`, `dependency-graph`, `finding`, `delta`, `checkpoint`, `recommendations`
     - Read content from the file at `--content-file` path
     - Path sanitization: reject any `--content-file` containing `..` segments
     - Write to the correct location:
       - `matrix` -> `.planning/refinement/matrix.md`
       - `dependency-graph` -> `.planning/refinement/dependency-graph.md`
       - `finding` -> `.planning/refinement/findings/FINDING-{id}.md` (extract ID from content frontmatter or first heading)
       - `delta` -> `.planning/refinement/DELTA.md`
       - `checkpoint` -> `.planning/refinement/pairs/{name}.complete` (name from `--name` arg)
       - `recommendations` -> `.planning/refinement/RECOMMENDATIONS.md`
     - Overwrite existing file on each write
     - Output `{ written: true, type, path: relativePath }`

  **Exported utility functions:**

  3. `parseMarkdownTable(content)` — TC-02
     - Parse pipe-delimited markdown table from a string
     - Find header row (first row with `|`), extract column names by splitting on `|` and trimming
     - Skip separator row (contains `---`)
     - Parse each data row into an object keyed by column names
     - Return array of row objects
     - Handle edge cases: empty content returns [], no table found returns []

  4. `diffMaps(oldMap, newMap)` — TC-02
     - Accept two `Map` objects with string keys
     - Return `{ added: [], removed: [], changed: [] }`
     - `added`: keys in newMap not in oldMap (with new value)
     - `removed`: keys in oldMap not in newMap (with old value)
     - `changed`: keys in both where `JSON.stringify(oldValue) !== JSON.stringify(newValue)` (with old + new values)
     - ~30 lines of set operations

  5. `snapshotFindings(findingsDir)` — FN-01 helper
     - Read all `FINDING-*.md` files from findingsDir
     - Sort alphabetically by filename
     - For each: extract finding ID from filename, read content, parse first table row for severity/type/recommendation
     - Return Map keyed by finding ID with `{ severity, type, recommendation, summary }` values

  6. `snapshotTable(filePath)` — FN-01 helper
     - Read file at filePath, parse with `parseMarkdownTable`
     - Return Map keyed by composite key (varies by caller — accepts a `keyFn` parameter)
     - Generic: `snapshotTable(filePath, keyFn)` where keyFn takes a row object and returns the key string

  Export all 6 functions: `module.exports = { cmdRefinementInit, cmdRefinementWrite, parseMarkdownTable, diffMaps, snapshotFindings, snapshotTable };`
  </action>
  <verify>
    <automated>node -e "const r = require('./get-shit-done/bin/lib/refinement.cjs'); const fns = ['cmdRefinementInit','cmdRefinementWrite','parseMarkdownTable','diffMaps','snapshotFindings','snapshotTable']; fns.forEach(f => { if (typeof r[f] !== 'function') throw new Error(f + ' not exported'); }); console.log('All 6 functions exported')"</automated>
  </verify>
  <done>All 6 functions exported from refinement.cjs. parseMarkdownTable correctly parses a sample table. diffMaps correctly computes added/removed/changed from two sample Maps.</done>
</task>

<task type="auto">
  <name>Wire refinement-init and refinement-write routes into gsd-tools.cjs</name>
  <reqs>TC-01</reqs>
  <files>get-shit-done/bin/gsd-tools.cjs</files>
  <action>
  Add two new case entries to the main switch statement in `gsd-tools.cjs`, placed after the existing feature flat-verb commands block (after `feature-status` case, before `default`):

  ```
  // --- Refinement commands ------------------------------------------------
  case 'refinement-init': {
    const { cmdRefinementInit } = require('./lib/refinement.cjs');
    cmdRefinementInit(cwd, raw);
    break;
  }
  case 'refinement-write': {
    const { cmdRefinementWrite } = require('./lib/refinement.cjs');
    cmdRefinementWrite(cwd, args.slice(1), raw);
    break;
  }
  ```

  Also add to the CLI header comment under a new "Refinement:" section:
  ```
   * Refinement:
   *   refinement-init                    Create refinement dir + snapshot existing state
   *   refinement-write --type T --content-file P  Write artifact to refinement dir
  ```
  </action>
  <verify>
    <automated>node get-shit-done/bin/gsd-tools.cjs refinement-init --raw 2>&1 | head -5</automated>
  </verify>
  <done>`refinement-init` route responds (creates directory or outputs snapshot). `refinement-write` route is present in switch statement. Both routes appear in CLI header comment.</done>
</task>

</tasks>

<verification>
1. `node -e "..."` confirms all 6 functions are exported from refinement.cjs
2. `node gsd-tools.cjs refinement-init --raw` creates `.planning/refinement/` directory and outputs snapshot JSON
3. `parseMarkdownTable` tested inline with a sample pipe-delimited table string
4. `diffMaps` tested inline with two sample Maps showing correct added/removed/changed
5. grep confirms both `refinement-init` and `refinement-write` cases exist in gsd-tools.cjs
</verification>

<success_criteria>
- lib/refinement.cjs exists with 2 CLI commands + 4 utility functions
- refinement-init creates `.planning/refinement/` with `findings/` and `pairs/` subdirectories
- refinement-init snapshots existing RECOMMENDATIONS.md, findings, matrix, and dependency-graph (or null on first run)
- refinement-write writes to correct path based on --type argument
- parseMarkdownTable returns array of row objects from pipe-delimited markdown
- diffMaps returns {added, removed, changed} from two Maps
- Both routes wired in gsd-tools.cjs and callable via CLI
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-SUMMARY.md`
</output>
