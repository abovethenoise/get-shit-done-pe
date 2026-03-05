# Functional Trace: refinement-artifact

Reviewer: gsd-review-functional
Lens: new
Date: 2026-03-05

---

## Phase 1: Internalize Requirements

| Req ID | Behavior Spec |
|--------|---------------|
| FN-01 | **Pre-scan snapshot.** Triggered before scan. Reads existing RECOMMENDATIONS.md (or null if first run). Snapshots findings/ directory listing. Returns snapshot for delta computation. |
| FN-02 | **Report generation.** Receives aggregated scan output from landscape-scan. Writes matrix.md, dependency-graph.md, findings/ to .planning/refinement/. RECOMMENDATIONS.md written by coherence-report (not this feature). Overwrites on each run. Returns verified artifact directory. |
| FN-03 | **Delta computation.** Receives pre-scan snapshot + newly written RECOMMENDATIONS.md and findings/. Compares findings (added/resolved/changed by ID), matrix cells, dependency graph rows. First run (null snapshot) skips DELTA.md. Returns DELTA.md written to .planning/refinement/. |
| TC-01 | **Directory management CLI routes.** Routes: refinement-init, refinement-write, refinement-report, refinement-delta. File I/O in gsd-tools.cjs. Checkpoint reuses landscape-scan's scan-checkpoint route. No external deps. |
| TC-02 | **Delta diffing logic.** Semantic diff without external tools. Finding identity by ID (FINDING-001). Matrix diff by cell values. Dependency graph diff by row tuples. All output as markdown tables. |
| EU-01 | **Persistent refinement report.** RECOMMENDATIONS.md, DELTA.md, supporting artifacts in .planning/refinement/. First run: no DELTA.md. |
| EU-02 | **Scan artifact directory structure.** .planning/refinement/ with RECOMMENDATIONS.md, DELTA.md, matrix.md, dependency-graph.md, findings/FINDING-{id}.md, pairs/{A}-{B}.complete. All markdown, standard tables. |

---

## Phase 2: Trace Against Code

### FN-01: Pre-scan snapshot

**Verdict:** met

**Evidence:**
- `refinement.cjs:149-191` -- `cmdRefinementInit` reads existing RECOMMENDATIONS.md via `safeReadFile` (line 159), snapshots findings via `snapshotFindings(findingsDir)` (line 160), snapshots matrix (line 161-168) and dependency graph (line 169-172).
- `refinement.cjs:159` -- `const recommendations = safeReadFile(path.join(refDir, 'RECOMMENDATIONS.md'));` -- returns null when file doesn't exist (first run), matching spec.
- `refinement.cjs:183-188` -- Snapshot serialized as `{ recommendations, findings: [...entries], matrix: [...entries], dependencyGraph: [...entries] }` using `Array.from(map.entries())` for JSON transport.
- `refinement.cjs:174-180` -- After snapshot, existing findings are cleared (snapshot-then-clear pattern) to prevent orphans.
- `refinement.cjs:190` -- `output(snapshot, raw)` returns snapshot to caller.
- Reasoning: All specified inputs (trigger from orchestrator) and outputs (snapshot object with RECOMMENDATIONS.md contents or null, findings listing) are implemented. State transition (read-then-clear) is correct.

**Cross-layer observations:** The snapshot also captures matrix and dependency-graph state, which goes beyond the FN-01 spec (which only mentions RECOMMENDATIONS.md and findings/). This is additive, not a deviation -- it supports FN-03's broader diffing needs.

---

### FN-02: Report generation

**Verdict:** met

**Evidence:**
- `refinement.cjs:260-322` -- `cmdRefinementReport` accepts `--matrix-file`, `--dependency-graph-file`, `--findings-dir` args matching "aggregated scan output."
- `refinement.cjs:278` -- `fs.writeFileSync(path.join(refDir, 'matrix.md'), content, 'utf-8')` -- writes matrix.md to .planning/refinement/.
- `refinement.cjs:288` -- `fs.writeFileSync(path.join(refDir, 'dependency-graph.md'), content, 'utf-8')` -- writes dependency-graph.md.
- `refinement.cjs:298-318` -- Findings: clears existing findings (line 301-304), then copies FINDING-*.md files from source directory to .planning/refinement/findings/.
- `refinement.cjs:266-268` -- Checks `.planning/refinement/` exists, errors if not (requires prior `refinement-init`).
- `refinement.cjs:321` -- Returns `{ written: { matrix, dependencyGraph, findings } }` result object.
- Reasoning: Spec says "RECOMMENDATIONS.md written by coherence-report" -- this command correctly does NOT write RECOMMENDATIONS.md. Matrix, dependency-graph, and findings are written. Overwrite behavior confirmed by the clear-then-copy pattern for findings and direct writeFileSync for others.

**Cross-layer observations:** RECOMMENDATIONS.md can also be written via `cmdRefinementWrite` with `--type recommendations` (line 246-247). This provides a route for coherence-report to write it, consistent with the spec noting it's "managed here."

---

### FN-03: Delta computation

**Verdict:** met

**Evidence:**
- `refinement.cjs:339-446` -- `cmdRefinementDelta` implements full delta computation.
- `refinement.cjs:341-347` -- Receives `--snapshot-file` containing the pre-scan snapshot (FN-01 output).
- `refinement.cjs:349-355` -- Deserializes Maps from `[key, value]` arrays, matching the serialization format from FN-01.
- `refinement.cjs:357-360` -- First-run check: `if (snapshot.recommendations === null && snapshot.findings.size === 0)` returns `{ delta: false, reason: 'first_run' }` and skips DELTA.md. Matches spec: "First run (null snapshot) skips DELTA.md."
- `refinement.cjs:366-377` -- Reads current state of findings, matrix, dependency graph from disk.
- `refinement.cjs:380-382` -- Computes diffs using `diffMaps` for all three artifact types.
- `refinement.cjs:389-409` -- Findings delta: renders added/resolved/changed tables with ID, Type, Severity, Summary columns. Changed findings are diffed field-by-field (line 400-408).
- `refinement.cjs:412-422` -- Matrix changes rendered as markdown table.
- `refinement.cjs:425-435` -- Dependency graph changes rendered as markdown table.
- `refinement.cjs:438` -- `fs.writeFileSync(path.join(refDir, 'DELTA.md'), deltaContent, 'utf-8')` -- writes DELTA.md.
- `refinement.cjs:440-445` -- Returns summary counts.
- Reasoning: All three diff dimensions (findings by ID, matrix by cell, dependency graph by row) are implemented with semantic comparison via `diffMaps`. First-run skip is correct. Output is DELTA.md in .planning/refinement/.

**Cross-layer observations:** The first-run check requires BOTH `recommendations === null` AND `findings.size === 0`. If a previous run left findings but no RECOMMENDATIONS.md (or vice versa), delta would still be computed. This is a reasonable interpretation but slightly differs from the spec's simpler "null snapshot" language.

---

### TC-01: Directory management CLI routes

**Verdict:** met

**Evidence:**
- `gsd-tools.cjs:435-437` -- `refinement-init` route calls `cmdRefinementInit(cwd, raw)`.
- `gsd-tools.cjs:440-442` -- `refinement-write` route calls `cmdRefinementWrite(cwd, args.slice(1), raw)`.
- `gsd-tools.cjs:445-447` -- `refinement-report` route calls `cmdRefinementReport(cwd, args.slice(1), raw)`.
- `gsd-tools.cjs:450-452` -- `refinement-delta` route calls `cmdRefinementDelta(cwd, args.slice(1), raw)`.
- All implementations reside in `refinement.cjs` (lib file), keeping file I/O in the tools layer as specified.
- Checkpoint management: spec says "reuses landscape-scan's scan-checkpoint route" -- `gsd-tools.cjs:428-431` shows `scan-checkpoint` route exists separately in `scan.cjs`, confirming no checkpoint duplication in refinement.cjs.
- No external dependencies: `refinement.cjs:5-7` imports only `fs`, `path`, and internal `core.cjs`.

---

### TC-02: Delta diffing logic

**Verdict:** met

**Evidence:**
- `refinement.cjs:63-83` -- `diffMaps(oldMap, newMap)` computes added/removed/changed using `JSON.stringify` comparison (semantic, not textual line-diff). No external diff tools.
- `refinement.cjs:88-125` -- `snapshotFindings(findingsDir)` keys findings by ID extracted from filename (`FINDING-001.md` -> `FINDING-001`), matching spec's "finding identity by ID."
- `refinement.cjs:130-142` -- `snapshotTable(filePath, keyFn)` parses markdown tables and keys by caller-provided function.
- `refinement.cjs:367-372` -- Matrix keyed by first two columns: `${row[keys[0]]}|${row[keys[1]]}` (cell-value keying).
- `refinement.cjs:373-377` -- Dependency graph keyed by `${row['From']}|${row['To']}` (row-tuple keying).
- `refinement.cjs:327-334` -- `renderDeltaTable` outputs standard markdown pipe-delimited tables.
- `refinement.cjs:384-435` -- All delta output sections use markdown tables (findings added/resolved/changed, matrix changes, dependency graph changes).
- Reasoning: All TC-02 constraints are met -- semantic diffing, ID-based finding identity, cell-value matrix diff, row-tuple graph diff, markdown table output.

---

### EU-01: Persistent refinement report

**Verdict:** met

**Evidence:**
- `refinement.cjs:246-247` -- RECOMMENDATIONS.md writable via `cmdRefinementWrite --type recommendations`.
- `refinement.cjs:244-245` -- DELTA.md writable via `cmdRefinementWrite --type delta` and also via `cmdRefinementDelta` (line 438).
- `refinement.cjs:357-360` -- First run produces no DELTA.md (returns early with `delta: false`).
- `refinement.cjs:278,288,314` -- Supporting artifacts (matrix.md, dependency-graph.md, findings/) written to .planning/refinement/.
- Reasoning: All acceptance criteria met. RECOMMENDATIONS.md is present as a write target, DELTA.md shows deltas from previous run, first run skips DELTA.md.

---

### EU-02: Scan artifact directory structure

**Verdict:** met

**Evidence:**
- `refinement.cjs:150-152` -- `cmdRefinementInit` creates `.planning/refinement/`, `findings/`, `pairs/` directories.
- `refinement.cjs:228-251` -- `cmdRefinementWrite` supports types: matrix (-> matrix.md), dependency-graph (-> dependency-graph.md), finding (-> findings/FINDING-{id}.md), delta (-> DELTA.md), checkpoint (-> pairs/{name}.complete), recommendations (-> RECOMMENDATIONS.md).
- All files are markdown (.md extension) except checkpoint files (.complete, which are empty marker files -- not content artifacts).
- `refinement.cjs:327-334` -- Tables rendered as standard markdown pipe-delimited format.
- `refinement.cjs:15-58` -- `parseMarkdownTable` parses standard pipe-delimited markdown tables (no Mermaid, no JSON in artifact format).
- Reasoning: Directory structure matches spec. All content files are markdown with standard tables.

**Cross-layer observations:** The spec lists "pairs/{A}-{B}.complete" -- the implementation at line 215 writes `pairs/${name}.complete` where name comes from `--name` arg. The naming convention is enforced by the caller, not the code itself. Path traversal is guarded by the `..` check (line 213).

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | refinement.cjs:149-191 -- cmdRefinementInit snapshots RECOMMENDATIONS.md (null on first run) + findings + matrix + graph, serializes as [key,value] arrays |
| FN-02 | met | refinement.cjs:260-322 -- cmdRefinementReport writes matrix.md, dependency-graph.md, findings/ with overwrite semantics; RECOMMENDATIONS.md correctly delegated |
| FN-03 | met | refinement.cjs:339-446 -- cmdRefinementDelta deserializes snapshot, computes semantic diffs via diffMaps, writes DELTA.md; first-run skips correctly |
| TC-01 | met | gsd-tools.cjs:435-452 -- All four routes registered (refinement-init/write/report/delta); checkpoint reuses scan-checkpoint; no external deps |
| TC-02 | met | refinement.cjs:63-83,88-142 -- diffMaps semantic comparison, finding identity by ID, matrix by cell, graph by row tuple, all markdown table output |
| EU-01 | met | refinement.cjs:246,438,357-360 -- RECOMMENDATIONS.md + DELTA.md + supporting artifacts; first run skips DELTA.md |
| EU-02 | met | refinement.cjs:150-152,228-251 -- Directory structure matches spec; all markdown; standard tables |
