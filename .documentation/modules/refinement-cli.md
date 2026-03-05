---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: refinement.cjs

## Purpose: [derived]

CLI commands and utilities for the refinement artifact lifecycle: directory initialization, artifact writing, scan output aggregation, delta computation, and changeset read/write. Located at `get-shit-done/bin/lib/refinement.cjs`.

Supports the full requirements-refinement pipeline from landscape-scan through change-application.

## Exports: [derived]

### `cmdRefinementInit(cwd, raw)`

Create refinement directory structure and snapshot existing state for later delta comparison.

**Route:** `gsd-tools refinement-init [--raw]`

**Behavior:**
1. mkdir `.planning/refinement/{findings,pairs}`
2. Snapshot existing artifacts (RECOMMENDATIONS.md, findings, matrix, dependency-graph) into Maps
3. Clear existing FINDING-*.md files (prevents orphans from prior run)
4. Return snapshot as JSON

**Output JSON:**
```json
{
  "recommendations": "string | null",
  "findings": [["FINDING-001", { "severity": "", "type": "", "recommendation": "", "summary": "" }]],
  "matrix": [["capA|capB", { ... }]],
  "dependencyGraph": [["From|To", { ... }]]
}
```

### `cmdRefinementWrite(cwd, args, raw)`

Write a named artifact to the refinement directory.

**Route:** `gsd-tools refinement-write --type T --content-file P [--name N]`

**Type routing:**
| Type | Destination |
|------|-------------|
| `matrix` | `.planning/refinement/matrix.md` |
| `dependency-graph` | `.planning/refinement/dependency-graph.md` |
| `finding` | `.planning/refinement/findings/FINDING-{id}.md` (id extracted from content) |
| `delta` | `.planning/refinement/DELTA.md` |
| `recommendations` | `.planning/refinement/RECOMMENDATIONS.md` |
| `checkpoint` | `.planning/refinement/pairs/{name}.complete` (uses --name, no --content-file) |

**Output JSON:** `{ "written": true, "type": "...", "path": "..." }`

### `cmdRefinementReport(cwd, args, raw)`

Write aggregated scan output to `.planning/refinement/`. Accepts optional flags for each artifact type.

**Route:** `gsd-tools refinement-report [--matrix-file P] [--dependency-graph-file P] [--findings-dir P] [--raw]`

**Behavior:** For each provided flag, reads the source and writes to the refinement directory. `--findings-dir` clears existing findings before copying. Requires `.planning/refinement/` to exist (run refinement-init first).

**Output JSON:** `{ "written": { "matrix": bool, "dependencyGraph": bool, "findings": number } }`

### `cmdRefinementDelta(cwd, args, raw)`

Compare pre-scan snapshot to current artifacts and write DELTA.md.

**Route:** `gsd-tools refinement-delta --snapshot-file P [--raw]`

**Behavior:**
1. Load snapshot JSON from --snapshot-file (output of refinement-init)
2. First-run check: if null recommendations AND 0 findings in snapshot, return `{ delta: false, reason: "first_run" }`
3. Read current state (findings, matrix, dependency-graph)
4. Compute diffs via `diffMaps()` for each artifact type
5. Render DELTA.md with sections: Findings (Added/Resolved/Changed), Matrix Changes, Dependency Graph Changes

**Output JSON:**
```json
{
  "delta": true,
  "findings": { "added": 0, "resolved": 0, "changed": 0 },
  "matrix": { "changed": 0 },
  "graph": { "changed": 0 }
}
```

### `cmdChangesetWrite(cwd, args, raw)`

Write CHANGESET.md from JSON input.

**Route:** `gsd-tools changeset-write --content-file P [--checkpoint] [--raw]`

**Input JSON:** `{ "entries": [{ "id", "topic", "type", "capabilities", "action", "reasoning", ... }] }`

**Validation:** Each entry requires id, topic, type, capabilities, action, reasoning. Type must be one of: ACCEPT, MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED.

**Sorting:** By type order (ACCEPT first, USER_INITIATED last), then by severity within type group.

**Output:** CHANGESET.md with frontmatter (`status: partial|complete`, counts), summary table, and per-entry sections.

**Output JSON:** `{ "written": true, "path": "...", "status": "partial|complete", "total": number }`

### `cmdChangesetParse(cwd, raw)`

Parse CHANGESET.md and return JSON for change-application consumption.

**Route:** `gsd-tools changeset-parse [--raw]`

**Guards:** Refuses to parse if `status: partial` in frontmatter (incomplete Q&A session).

**Output JSON:**
```json
{
  "meta": { "date": "", "status": "complete", "source": "", "total": 0, "counts": { ... } },
  "entries": [{ "id": "CS-1", "topic": "", "type": "", "source": "", "capabilities": [], "action": "", "reasoning": "" }]
}
```

### Utility Functions (not CLI-routed)

| Function | Purpose |
|----------|---------|
| `parseMarkdownTable(content)` | Parse pipe-delimited markdown table into array of row objects. Returns `[]` if no table found. |
| `diffMaps(oldMap, newMap)` | Compute added/removed/changed between two Maps. Returns `{ added[], removed[], changed[] }`. |
| `snapshotFindings(findingsDir)` | Read all FINDING-*.md into a Map keyed by finding ID, extracting severity, type, summary, recommendation from frontmatter and body. |
| `snapshotTable(filePath, keyFn)` | Read a file, parse as markdown table, return Map keyed by `keyFn(row)`. Used with `matrixKeyFn` and `graphKeyFn`. |

### Internal Helpers (not exported)

| Function | Purpose |
|----------|---------|
| `guardPath(value, label)` | Validate a path argument exists and contains no `..` segments. |
| `clearFindings(findingsDir)` | Delete all FINDING-*.md files from a directory. |
| `matrixKeyFn(row)` | Key function: first two column values joined by `\|`. |
| `graphKeyFn(row)` | Key function: `From\|To` column values. |
| `renderDeltaTable(heading, columns, rows)` | Render a markdown table with heading. Returns "No changes." for empty rows. |

## Depends-on: [derived]

- `bin/lib/core.cjs` -- `output`, `error`, `safeReadFile` helpers
- `gsd-tools.cjs` -- Route registration (refinement-init, refinement-write, refinement-report, refinement-delta, changeset-write, changeset-parse)
