---
phase: requirements-refinement/refinement-artifact
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - get-shit-done/bin/lib/refinement.cjs
  - get-shit-done/bin/gsd-tools.cjs
autonomous: true
requirements:
  - FN-02
  - FN-03
  - EU-01
  - EU-02

must_haves:
  truths:
    - "After a full refinement pipeline run, `.planning/refinement/` contains matrix.md, dependency-graph.md, and findings/ with individual finding cards"
    - "DELTA.md is produced on second+ runs showing added/resolved/changed findings, matrix diffs, and dependency graph diffs"
    - "First run produces no DELTA.md (no previous state to diff)"
    - "All output files are markdown tables (no Mermaid, no JSON)"
    - "Orphaned finding files from previous runs are cleaned before new findings are written"
  artifacts:
    - path: "get-shit-done/bin/lib/refinement.cjs"
      provides: "cmdRefinementReport and cmdRefinementDelta exports added to existing module"
    - path: "get-shit-done/bin/gsd-tools.cjs"
      provides: "refinement-report and refinement-delta case entries in main switch"
  key_links:
    - from: "cmdRefinementDelta"
      to: "diffMaps"
      via: "function call with snapshot Maps vs current-state Maps"
      pattern: "diffMaps\\(.*snapshot"
    - from: "cmdRefinementDelta"
      to: "snapshotFindings"
      via: "re-reads findings/ after write to get current state for diffing"
      pattern: "snapshotFindings"
    - from: "cmdRefinementReport"
      to: "cmdRefinementWrite"
      via: "delegates actual file writes to the write route"
      pattern: "cmdRefinementWrite|refinement-write"
---

<objective>
Add report generation and delta computation commands to the refinement module, completing the artifact lifecycle.

Purpose: Enable the refinement orchestrator to (a) persist all scan outputs to `.planning/refinement/` and (b) compute semantic diffs between refinement runs.
Output: Two new exported commands in `lib/refinement.cjs` + route wiring in `gsd-tools.cjs`.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md
@.planning/capabilities/requirements-refinement/features/refinement-artifact/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/refinement-artifact/01-SUMMARY.md

<interfaces>
From Plan 01 (already built):
- `parseMarkdownTable(content)` -> array of row objects
- `diffMaps(oldMap, newMap)` -> `{ added: [], removed: [], changed: [] }`
- `snapshotFindings(findingsDir)` -> Map keyed by finding ID
- `snapshotTable(filePath, keyFn)` -> Map keyed by composite key
- `cmdRefinementInit` outputs snapshot JSON with `{ recommendations, findings, matrix, dependencyGraph }` where Maps are serialized as `[key, value]` arrays
- `cmdRefinementWrite` writes artifacts by type

Directory structure (EU-02):
```
.planning/refinement/
  RECOMMENDATIONS.md      (written by coherence-report, NOT this feature)
  DELTA.md                (written by this feature's FN-03)
  matrix.md               (written by this feature's FN-02)
  dependency-graph.md     (written by this feature's FN-02)
  findings/FINDING-{id}.md  (written by this feature's FN-02)
  pairs/{A}-{B}.complete  (written by landscape-scan via refinement-write)
```

DELTA.md format (FN-03):
```markdown
# Refinement Delta

*Compared to previous run*

## Findings

### Added
| ID | Type | Severity | Summary |
|...

### Resolved
| ID | Type | Severity | Summary |
|...

### Changed
| ID | Field | Previous | Current |
|...

## Matrix Changes
| Pair | Previous | Current |
|...

## Dependency Graph Changes
| Change | From | To | Previous | Current |
|...
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add report generation command to refinement.cjs</name>
  <reqs>FN-02, EU-02</reqs>
  <files>get-shit-done/bin/lib/refinement.cjs, get-shit-done/bin/gsd-tools.cjs</files>
  <action>
  Add `cmdRefinementReport(cwd, args, raw)` to `lib/refinement.cjs`.

  **Purpose:** Receive aggregated scan output and write all artifacts to `.planning/refinement/`.

  **Accepts args:**
  - `--matrix-file <path>` — path to matrix.md content file
  - `--dependency-graph-file <path>` — path to dependency-graph.md content file
  - `--findings-dir <path>` — path to directory containing FINDING-*.md files to copy

  **Behavior:**
  1. Validate that `.planning/refinement/` exists (error if not — refinement-init must run first)
  2. If `--matrix-file` provided: read file, write to `.planning/refinement/matrix.md`
  3. If `--dependency-graph-file` provided: read file, write to `.planning/refinement/dependency-graph.md`
  4. If `--findings-dir` provided:
     - Clear existing `.planning/refinement/findings/` (remove all FINDING-*.md to prevent orphans per research constraint)
     - Read all FINDING-*.md from the source directory
     - Copy each to `.planning/refinement/findings/`
     - Sort by filename for deterministic output
  5. Output `{ written: { matrix: bool, dependencyGraph: bool, findings: count } }`

  **Key constraints:**
  - RECOMMENDATIONS.md is NOT written by this command (coherence-report owns it)
  - All files are overwritten on each run (current state, not cumulative)
  - Path sanitization on all input paths (reject `..` segments)

  Add to module.exports.

  Also wire new route in `gsd-tools.cjs`:
  ```
  case 'refinement-report': {
    const { cmdRefinementReport } = require('./lib/refinement.cjs');
    cmdRefinementReport(cwd, args.slice(1), raw);
    break;
  }
  ```
  And add to CLI header comment.
  </action>
  <verify>
    <automated>node -e "const r = require('./get-shit-done/bin/lib/refinement.cjs'); if (typeof r.cmdRefinementReport !== 'function') throw new Error('cmdRefinementReport not exported'); console.log('OK')"</automated>
  </verify>
  <done>cmdRefinementReport exported, writes matrix.md + dependency-graph.md + finding cards to `.planning/refinement/`, clears stale findings before writing new ones. Route wired in gsd-tools.cjs.</done>
</task>

<task type="auto">
  <name>Add delta computation command to refinement.cjs</name>
  <reqs>FN-03, EU-01</reqs>
  <files>get-shit-done/bin/lib/refinement.cjs, get-shit-done/bin/gsd-tools.cjs</files>
  <action>
  Add `cmdRefinementDelta(cwd, args, raw)` to `lib/refinement.cjs`.

  **Purpose:** Compare pre-scan snapshot (from refinement-init) to current post-scan artifacts and write DELTA.md.

  **Accepts args:**
  - `--snapshot-file <path>` — path to JSON file containing the snapshot from refinement-init (the serialized output)

  **Behavior:**
  1. Read snapshot JSON from `--snapshot-file`. Deserialize Maps from `[key, value]` arrays back into Map objects.
  2. If snapshot has `recommendations: null` AND `findings` Map is empty (first run): output `{ delta: false, reason: 'first_run' }` and return without writing DELTA.md.
  3. Read current state:
     - `snapshotFindings('.planning/refinement/findings/')` for current findings Map
     - `snapshotTable('.planning/refinement/matrix.md', row => row['Cap A'] + '|' + row['Cap B'])` for current matrix Map (adjust key function to match actual column names)
     - `snapshotTable('.planning/refinement/dependency-graph.md', row => row['From'] + '|' + row['To'])` for current dependency graph Map
  4. Compute diffs using `diffMaps`:
     - `findingsDiff = diffMaps(snapshot.findings, currentFindings)`
     - `matrixDiff = diffMaps(snapshot.matrix, currentMatrix)`
     - `graphDiff = diffMaps(snapshot.dependencyGraph, currentGraph)`
  5. Render DELTA.md:
     - Header: `# Refinement Delta\n\n*Compared to previous run*\n`
     - Section `## Findings` with subsections:
       - `### Added` — markdown table: ID | Type | Severity | Summary
       - `### Resolved` — markdown table: ID | Type | Severity | Summary
       - `### Changed` — markdown table: ID | Field | Previous | Current
     - Section `## Matrix Changes` — markdown table: Pair | Previous | Current
     - Section `## Dependency Graph Changes` — markdown table: Change | From | To | Previous | Current
     - If a section has no changes, write "No changes." under its heading
  6. Write DELTA.md to `.planning/refinement/DELTA.md`
  7. Output `{ delta: true, findings: { added: N, resolved: N, changed: N }, matrix: { changed: N }, graph: { changed: N } }`

  **Rendering helper** (internal, not exported):
  - `renderDeltaSection(title, diff, columnsFn)` — takes diff result and a function that maps each entry to table columns. Returns markdown string with heading + table.

  Add to module.exports.

  Wire route in `gsd-tools.cjs`:
  ```
  case 'refinement-delta': {
    const { cmdRefinementDelta } = require('./lib/refinement.cjs');
    cmdRefinementDelta(cwd, args.slice(1), raw);
    break;
  }
  ```
  Add to CLI header comment under "Refinement:" section.
  </action>
  <verify>
    <automated>node -e "const r = require('./get-shit-done/bin/lib/refinement.cjs'); if (typeof r.cmdRefinementDelta !== 'function') throw new Error('cmdRefinementDelta not exported'); console.log('OK')"</automated>
  </verify>
  <done>cmdRefinementDelta exported. On first run (null snapshot), skips DELTA.md. On subsequent runs, produces DELTA.md with findings added/resolved/changed, matrix changes, and dependency graph changes as markdown tables. Route wired in gsd-tools.cjs.</done>
</task>

</tasks>

<verification>
1. All 8 functions exported from refinement.cjs (original 6 + cmdRefinementReport + cmdRefinementDelta)
2. `refinement-report`, `refinement-delta` routes present in gsd-tools.cjs switch
3. Integration test: run refinement-init (first run, null snapshot) -> refinement-report (write sample artifacts) -> refinement-delta with null snapshot -> confirms no DELTA.md written
4. Integration test: run refinement-init (with artifacts from step 3 existing) -> refinement-report (write modified artifacts) -> refinement-delta with snapshot -> confirms DELTA.md written with correct diff sections
5. All output files are markdown (no JSON, no Mermaid)
6. Stale finding files are cleaned before new findings written
</verification>

<success_criteria>
- cmdRefinementReport writes matrix.md, dependency-graph.md, and finding cards to `.planning/refinement/`
- cmdRefinementReport clears stale findings/ before writing new ones (no orphans)
- cmdRefinementDelta skips DELTA.md on first run (null snapshot)
- cmdRefinementDelta produces DELTA.md with findings/matrix/graph diff sections on subsequent runs
- All diff output uses markdown tables
- Directory structure matches EU-02 spec exactly
- 4 CLI routes total wired in gsd-tools.cjs: refinement-init, refinement-write, refinement-report, refinement-delta
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/refinement-artifact/02-SUMMARY.md`
</output>
