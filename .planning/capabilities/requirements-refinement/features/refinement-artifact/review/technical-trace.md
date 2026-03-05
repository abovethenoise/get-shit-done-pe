# Technical Trace: refinement-artifact

## Phase 1: Internalize Requirements

| Req ID | Technical Specification |
|--------|------------------------|
| TC-01 | CLI routes in gsd-tools.cjs: `refinement-init` (create dir + snapshot), `refinement-write` (write named artifact). Also `refinement-report` (bulk write) and `refinement-delta` (diff + write DELTA.md). Checkpoint reuses landscape-scan's `scan-checkpoint` route. No external deps. |
| TC-02 | Semantic diff (not textual). Finding identity by ID. Matrix diff by cell values. Dependency graph by row tuples. All output markdown tables. |
| EU-01 | RECOMMENDATIONS.md, DELTA.md, supporting artifacts in `.planning/refinement/`. First run: no DELTA.md. |
| EU-02 | Directory structure: `.planning/refinement/` with RECOMMENDATIONS.md, DELTA.md, matrix.md, dependency-graph.md, findings/FINDING-{id}.md, pairs/{A}-{B}.complete. All markdown, standard tables. |
| FN-01 | Pre-scan snapshot: read + store existing RECOMMENDATIONS.md (or null), snapshot findings/ directory. |
| FN-02 | Report generation: write matrix.md, dependency-graph.md, findings/ to `.planning/refinement/`. Overwrite on each run. |
| FN-03 | Delta computation: semantic diff of findings (added/resolved/changed), matrix, dependency graph. Write DELTA.md. Skip on first run. |

## Phase 2: Trace Against Code

### TC-01: Directory management CLI routes

**Verdict:** met

**Evidence:**

- `get-shit-done/bin/gsd-tools.cjs:435-437` -- `case 'refinement-init': { const { cmdRefinementInit } = require('./lib/refinement.cjs'); cmdRefinementInit(cwd, raw); break; }`
  Route `refinement-init` registered.

- `get-shit-done/bin/gsd-tools.cjs:440-443` -- `case 'refinement-write': { const { cmdRefinementWrite } = require('./lib/refinement.cjs'); cmdRefinementWrite(cwd, args.slice(1), raw); break; }`
  Route `refinement-write` registered.

- `get-shit-done/bin/gsd-tools.cjs:444-448` -- `case 'refinement-report'` route registered.

- `get-shit-done/bin/gsd-tools.cjs:449-453` -- `case 'refinement-delta'` route registered.

- `get-shit-done/bin/gsd-tools.cjs:454-458` -- `case 'changeset-write'` route registered (bonus, not in spec but extends capability).

- `get-shit-done/bin/gsd-tools.cjs:459-463` -- `case 'changeset-parse'` route registered (bonus).

- `get-shit-done/bin/lib/refinement.cjs:149-191` -- `cmdRefinementInit` creates `findingsDir` and `pairsDir` with `recursive: true`, snapshots existing state, clears stale findings. Meets the "creates dir + snapshots" requirement.

- `get-shit-done/bin/lib/refinement.cjs:196-255` -- `cmdRefinementWrite` writes artifacts by `--type` flag (matrix, dependency-graph, finding, delta, checkpoint, recommendations). Meets the "writes named artifact" requirement.

- Checkpoint reuse: Spec says "Checkpoint management reuses landscape-scan's `scan-checkpoint` route." The `scan-checkpoint` route (`gsd-tools.cjs:428-432`, `scan.cjs:132-183`) is independently available and writes to the same `pairs/` directory (default output-dir is `.planning/refinement`). Additionally, `refinement-write --type checkpoint` provides a second path to write checkpoint files (`refinement.cjs:210-218`). Both paths work and target the same directory. The scan-checkpoint route is preserved and reusable.

- No external dependencies: `refinement.cjs` requires only `fs`, `path`, and `./core.cjs`. Met.

**Spec-vs-reality gap:** The spec mentions only `refinement-init` and `refinement-write` as routes, plus `refinement-report` and `refinement-delta`. Implementation adds `changeset-write` and `changeset-parse` as additional routes. These are additive (support downstream change-application feature) and do not violate the spec.

---

### TC-02: Delta diffing logic

**Verdict:** met

**Evidence:**

- Semantic diff, not textual: `refinement.cjs:63-83` -- `diffMaps(oldMap, newMap)` computes added/removed/changed using Map key identity and `JSON.stringify` deep comparison. This is semantic (comparing structured data by identity keys), not textual (no raw text diff).

- Finding identity by ID: `refinement.cjs:88-125` -- `snapshotFindings` keys the Map by finding ID (e.g., `FINDING-001`), extracted from filename via `file.replace('.md', '')`. Identity is by ID as specified.

- Matrix diff by cell values: `refinement.cjs:161-168` and `refinement.cjs:367-373` -- Matrix is snapshotted via `snapshotTable` with a key function using first two columns (`${row[keys[0]]}|${row[keys[1]]}`). Diff via `diffMaps` compares full row objects per cell pair. Meets "cell values" comparison.

- Dependency graph by row tuples: `refinement.cjs:169-172` and `refinement.cjs:374-378` -- Graph keyed by `${row['From']}|${row['To']}` tuple. Diff via `diffMaps` compares all row fields. Meets "row tuples" constraint.

- All output markdown tables: `refinement.cjs:327-334` -- `renderDeltaTable` renders pipe-delimited markdown tables. Used at lines 390-435 for all delta sections (findings added/resolved/changed, matrix changes, dependency graph changes). Non-table sections use "No changes." text. All structured diff output is markdown tables.

**Spec-vs-reality gap:** None.

---

### EU-01: Persistent refinement report

**Verdict:** met

**Evidence:**

- RECOMMENDATIONS.md managed: `refinement.cjs:245-246` -- `case 'recommendations': destPath = path.join(refDir, 'RECOMMENDATIONS.md')`. Can be written via `refinement-write --type recommendations`.

- DELTA.md: `refinement.cjs:438` -- `fs.writeFileSync(path.join(refDir, 'DELTA.md'), deltaContent, 'utf-8')`. Written by `cmdRefinementDelta`.

- Supporting artifacts in `.planning/refinement/`: `refinement.cjs:229-240` -- matrix.md, dependency-graph.md, findings/ all written under `refDir` which is `path.join(cwd, '.planning', 'refinement')`.

- First run no DELTA.md: `refinement.cjs:358-360` -- `if (snapshot.recommendations === null && snapshot.findings.size === 0) { output({ delta: false, reason: 'first_run' }, raw); return; }`. On first run, delta is skipped and DELTA.md is not written.

**Spec-vs-reality gap:** None.

---

### EU-02: Scan artifact directory structure

**Verdict:** met

**Evidence:**

- Directory structure created: `refinement.cjs:150-152` -- `cmdRefinementInit` creates `.planning/refinement/`, `findings/`, and `pairs/` directories.

- File paths match spec:
  - RECOMMENDATIONS.md: `refinement.cjs:246` -- `path.join(refDir, 'RECOMMENDATIONS.md')`
  - DELTA.md: `refinement.cjs:438` -- `path.join(refDir, 'DELTA.md')`
  - matrix.md: `refinement.cjs:230` -- `path.join(refDir, 'matrix.md')`
  - dependency-graph.md: `refinement.cjs:232` -- `path.join(refDir, 'dependency-graph.md')`
  - findings/FINDING-{id}.md: `refinement.cjs:239` -- `path.join(refDir, 'findings', '${id}.md')`
  - pairs/{A}-{B}.complete: `refinement.cjs:215` -- `path.join(pairsDir, '${name}.complete')`

- All markdown: All written files use `.md` extension. No JSON or Mermaid output files.

- Standard markdown tables: `parseMarkdownTable` at lines 15-58 handles pipe-delimited tables. All generated tables use pipe-delimited format (`renderDeltaTable` at line 327).

**Spec-vs-reality gap:** None.

---

### FN-01: Pre-scan snapshot

**Verdict:** met

**Evidence:**

- RECOMMENDATIONS.md read: `refinement.cjs:159` -- `const recommendations = safeReadFile(path.join(refDir, 'RECOMMENDATIONS.md'))`. Returns file content or null if missing.

- Findings snapshot: `refinement.cjs:160` -- `const findings = snapshotFindings(findingsDir)`. Reads all `FINDING-*.md` files, extracts frontmatter (severity, type) and sections (summary, recommendation), stores in Map keyed by finding ID.

- Matrix snapshot: `refinement.cjs:161-168` -- `snapshotTable` reads matrix.md into Map.

- Dependency graph snapshot: `refinement.cjs:169-172` -- `snapshotTable` reads dependency-graph.md into Map.

- Serialization for transport: `refinement.cjs:182-188` -- Maps serialized as `Array.from(map.entries())` (i.e., `[key, value]` arrays) for JSON output.

- Stale findings cleared after snapshot: `refinement.cjs:174-180` -- Existing FINDING-*.md files are deleted after snapshot is taken (snapshot-then-clear pattern).

**Spec-vs-reality gap:** Spec says "store in memory." Implementation stores as JSON output (returned to caller). This is architecturally equivalent -- the orchestrator receives the snapshot and passes it back to `refinement-delta` via `--snapshot-file`. This is the correct CLI-based approach vs. in-process memory.

---

### FN-02: Report generation

**Verdict:** met

**Evidence:**

- `refinement.cjs:260-322` -- `cmdRefinementReport` accepts `--matrix-file`, `--dependency-graph-file`, `--findings-dir` flags and writes each to `.planning/refinement/`.

- Matrix write: `refinement.cjs:273-279` -- Reads source, writes to `path.join(refDir, 'matrix.md')`.

- Dependency graph write: `refinement.cjs:282-289` -- Reads source, writes to `path.join(refDir, 'dependency-graph.md')`.

- Findings write: `refinement.cjs:292-318` -- Clears existing findings first (`refinement.cjs:300-304`), then copies FINDING-*.md files from source directory. Overwrite semantics met.

- Path sanitization: `refinement.cjs:275,285,295` -- All paths checked for `..` segments.

**Spec-vs-reality gap:** None.

---

### FN-03: Delta computation

**Verdict:** met

**Evidence:**

- Semantic diff of findings: `refinement.cjs:380` -- `diffMaps(snapshot.findings, currentFindings)` produces `{added, removed, changed}`.

- Added/resolved/changed categories: `refinement.cjs:389-409` -- Added findings rendered as "Added" table, removed as "Resolved" table, changed findings decomposed field-by-field into "Changed" table. Matches spec's "Added: findings in current but not in previous", "Resolved: findings in previous but not in current", "Changed: same ID but different severity, type, or recommendation."

- Matrix diff: `refinement.cjs:381,412-422` -- `diffMaps(snapshot.matrix, currentMatrix)` with rendering of new/removed/changed relationships.

- Dependency graph diff: `refinement.cjs:382,425-435` -- `diffMaps(snapshot.dependencyGraph, currentGraph)` with added/removed/changed rows.

- First-run skip: `refinement.cjs:358-360` -- `if (snapshot.recommendations === null && snapshot.findings.size === 0)` returns `{ delta: false, reason: 'first_run' }` without writing DELTA.md.

- DELTA.md written: `refinement.cjs:438` -- Written to `.planning/refinement/DELTA.md`.

- All diff output markdown tables: Confirmed via `renderDeltaTable` usage at lines 390-435.

**Spec-vs-reality gap:** None.

**Cross-layer observations:** The first-run detection checks both `recommendations === null` AND `findings.size === 0`. If a project had no RECOMMENDATIONS.md but had leftover findings from a manual process, delta would still be computed. This seems intentionally conservative (only skip delta when truly no prior state exists).

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | `gsd-tools.cjs:435-463` -- All four spec'd routes registered plus two additive changeset routes. `refinement.cjs:149-255` -- Init creates dirs + snapshots; write handles all artifact types. Checkpoint reuse via scan-checkpoint preserved. |
| TC-02 | met | `refinement.cjs:63-83` -- `diffMaps` does semantic comparison by Map key identity. Finding keyed by ID, matrix by first-two-columns, graph by From/To tuple. Output via `renderDeltaTable` produces markdown tables. |
| EU-01 | met | `refinement.cjs:246,438,358-360` -- RECOMMENDATIONS.md writable, DELTA.md written by delta command, first-run skips DELTA.md. |
| EU-02 | met | `refinement.cjs:150-152,230,232,239,215,246,438` -- All specified files at specified paths under `.planning/refinement/`. All markdown, pipe-delimited tables. |
| FN-01 | met | `refinement.cjs:159-190` -- Snapshots RECOMMENDATIONS.md (or null), findings Map, matrix Map, graph Map. Serializes as [key,value] arrays for JSON transport. |
| FN-02 | met | `refinement.cjs:260-322` -- `cmdRefinementReport` bulk-writes matrix, graph, findings with overwrite semantics and path sanitization. |
| FN-03 | met | `refinement.cjs:339-446` -- `cmdRefinementDelta` deserializes snapshot, computes semantic diffs via `diffMaps`, renders markdown tables, writes DELTA.md. First-run detection skips delta. |
