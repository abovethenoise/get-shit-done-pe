# Technical Trace: landscape-scan

## Phase 1: Internalize Requirements

| Req ID | Specification Summary |
|--------|----------------------|
| TC-01 | Three CLI routes (`scan-discover`, `scan-pairs`, `scan-checkpoint`) in gsd-tools.cjs. Pure Node.js file I/O, no external deps. `scan-discover` returns JSON with capabilities, artifact paths, loaded contents, completeness. `scan-pairs` returns ordered pair list. `scan-checkpoint` reads/writes checkpoint flags. |
| TC-02 | Agent file at `agents/gsd-scan-pair.md`. Receives cap pair contents + prior findings + finding card schema. Outputs structured finding cards (markdown + frontmatter). Zero file I/O, sonnet model. |
| TC-03 | Tiered scaling: Small (<=20) full pairwise; Medium (21-50) mgrep pre-filter; Large (50+) cluster by domain/layer. Tier detection automatic based on capability count. |
| EU-01 | Scan reads all cap/feature artifacts, produces relationship matrix, finding cards, dependency graph. Caps with zero spec docs flagged as GAP. |
| EU-02 | Checkpoint per pair, resume skips completed pairs, accumulated findings loaded as prior context. |
| FN-01 | Artifact discovery: resolve paths to CAPABILITY.md, FEATURE.md files, documentation. Load contents. Enumerate all unique pairs (A < B alphabetically). Zero-spec caps emit GAP finding immediately. |
| FN-02 | Per-pair sequential analysis via agent. Agent receives contents not paths. Checkpoint written after each pair. |
| FN-03 | Finding card format with type, severity, confidence, affected_capabilities, doc_sources, summary, recommendation. IDs globally sequential. |
| FN-04 | Post-analysis consolidation: group N symptoms into M root causes. Add `root_cause` field to finding cards. |
| FN-05 | Three-layer output: matrix.md, finding cards (sorted by severity), dependency-graph.md. Written to scan-output/ (per spec) or .planning/refinement/ (per workflow). |

## Phase 2: Trace Against Code

### TC-01: CLI routes for file discovery

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/gsd-tools.cjs:418-432` -- All three routes registered: `scan-discover`, `scan-pairs`, `scan-checkpoint`
- `get-shit-done/bin/lib/scan.cjs:5-8` -- Dependencies are `fs`, `path`, `core.cjs`, `frontmatter.cjs` -- all Node.js built-ins or internal modules, no external deps
- `get-shit-done/bin/lib/scan.cjs:19-100` -- `cmdScanDiscover` returns JSON with `capabilities` array containing `slug`, `artifacts` (with `capability`, `features`, `documentation` sub-objects), and `completeness` field. Matches spec example structure exactly.
- `get-shit-done/bin/lib/scan.cjs:102-130` -- `cmdScanPairs` returns `{ tier, capability_count, pairs, total_pairs }`. Pairs are `{ a, b }` objects with alphabetical ordering enforced by `i < j` loop over sorted slugs.
- `get-shit-done/bin/lib/scan.cjs:132-178` -- `cmdScanCheckpoint` supports `read`, `write`, `list` actions with `--pair` and `--output-dir` args.

**Spec-vs-reality gap:**
- Spec example for `scan-discover` shows only `capabilities` in output. Implementation also returns `gap_findings` array (line 99). This is an extension, not a violation -- the workflow uses `gap_findings` to write GAP finding cards in the discover step (workflow line 39-44). This is a reasonable addition that satisfies FN-01's requirement to "emit a GAP finding card immediately."

**Cross-layer observations:**
- `extractFrontmatter` is imported at line 8 but never used in scan.cjs. Dead import.

---

### TC-02: Per-pair agent definition

**Verdict:** not met (partial -- location mismatch)

**Evidence:**
- Spec states: "Agent file: `agents/gsd-scan-pair.md`"
- Actual location: `get-shit-done/templates/gsd-scan-pair.md`
- No file exists at `agents/gsd-scan-pair.md` or any `agents/` directory under get-shit-done.
- `get-shit-done/templates/gsd-scan-pair.md:1-2` -- `# Per-Pair Capability Coherence Analyzer` -- file content matches spec intent.
- `get-shit-done/templates/gsd-scan-pair.md:9-19` -- Template contains `{{CAPABILITY_A}}`, `{{CAPABILITY_B}}`, `{{PRIOR_FINDINGS}}` placeholders as specified.
- `get-shit-done/templates/gsd-scan-pair.md:22-61` -- Finding card schema is embedded in the template with all required fields: id, type, severity, confidence, affected_capabilities, doc_sources, summary, recommendation.
- `get-shit-done/templates/gsd-scan-pair.md:4` -- `You do NOT perform file I/O.` -- zero file I/O constraint met.
- `get-shit-done/templates/gsd-scan-pair.md:85-91` -- `NO_FINDINGS` sentinel output specified for empty-result pairs.
- `get-shit-done/workflows/landscape-scan.md:78` -- Workflow references `$HOME/.claude/get-shit-done/templates/gsd-scan-pair.md`, consistent with actual location.

**Spec-vs-reality gap:**
- Spec says `agents/gsd-scan-pair.md`. Implemented as `templates/gsd-scan-pair.md`. The `templates/` directory is the established convention for agent templates in this project. The workflow correctly references the actual location. The spec's `agents/` path was written before the file was placed -- the `templates/` location follows existing project conventions.
- Spec mentions "Agent model: sonnet". This is a runtime concern -- the workflow specifies `subagent_type="gsd-executor"` (line 81) but model selection is not hardcoded in the template file itself. Model choice is deferred to the orchestrator/workflow runtime configuration.

---

### TC-03: Tiered scaling strategy

**Verdict:** not met (partial -- small tier only)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:116-119` -- Tier detection implemented:
  ```javascript
  let tier = 'small';
  if (count > 20) {
    tier = 'medium';
    process.stderr.write('Warning: Medium/large tier pair filtering not yet implemented. Falling back to full pairwise.\n');
  }
  ```
- Small tier (<=20 caps, full pairwise): Implemented correctly at lines 122-127. All n(n-1)/2 pairs generated.
- Medium tier (21-50 caps, mgrep pre-filter): **Not implemented.** Falls back to full pairwise with stderr warning.
- Large tier (50+ caps, cluster-based): **Not implemented.** No distinction between medium and large -- both fall back to full pairwise. The code only checks `count > 20` but never checks for `count > 50`.
- Tier is reported in output (line 129) so downstream consumers can see `"tier": "medium"` but will receive unfiltered pairs.

**Spec-vs-reality gap:**
- Medium and large tier strategies are explicitly not implemented, with a deliberate stderr warning. This is a known incomplete implementation, not an oversight. The fallback to full pairwise is safe (over-analyzes rather than under-analyzes) but does not achieve the spec's scaling goals.

---

### EU-01: Cross-capability coherence scan

**Verdict:** met (infrastructure; execution depends on workflow runtime)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:28-31` -- Reads all capability directories from `.planning/capabilities/`
- `get-shit-done/bin/lib/scan.cjs:46-61` -- Loads features from each capability's `features/` directory
- `get-shit-done/bin/lib/scan.cjs:39` -- Loads documentation from `.documentation/capabilities/{slug}.md`
- `get-shit-done/bin/lib/scan.cjs:84-96` -- Capabilities with zero spec docs (completeness `none`) emit GAP findings immediately
- `get-shit-done/workflows/landscape-scan.md:126-166` -- Workflow defines three-layer output assembly: matrix.md, summary.md, dependency-graph.md
- `get-shit-done/templates/gsd-scan-pair.md:44-56` -- Finding types cover: CONFLICT, GAP, OVERLAP, DEPENDS_ON, ASSUMPTION_MISMATCH, ALIGNMENT

**Cross-layer observations:**
- The three-layer output is defined in the workflow (orchestrator logic), not in gsd-tools.cjs. This is correct per the architecture (gsd-tools does I/O, agent does reasoning, orchestrator assembles).

---

### EU-02: Resumable scan

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:149-154` -- Write checkpoint: creates `{pair}.complete` file in pairs directory
- `get-shit-done/bin/lib/scan.cjs:157-161` -- Read checkpoint: checks existence of `.complete` file
- `get-shit-done/bin/lib/scan.cjs:163-173` -- List checkpoints: reads all `.complete` files from pairs directory
- `get-shit-done/workflows/landscape-scan.md:50-58` -- Workflow enumerates pairs, checks completed list, filters remaining. Logs count of total/complete/remaining.
- `get-shit-done/workflows/landscape-scan.md:97-101` -- Checkpoint written after each pair completes.
- `get-shit-done/workflows/landscape-scan.md:72-75` -- Prior findings loaded from existing finding files for accumulated context.

**Spec-vs-reality gap:**
- FN-02/EU-02 spec says checkpoint path format is `scan-output/pairs/{A}-{B}.complete`. Workflow uses `.planning/refinement/pairs/{A}__{B}.complete` (double underscore separator, different base directory). The workflow is internally consistent with this path. The double-underscore separator avoids ambiguity with capability slugs that contain hyphens.

---

### FN-01: Artifact discovery and pair enumeration

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:37-39` -- Resolves CAPABILITY.md, features dir, and documentation paths
- `get-shit-done/bin/lib/scan.cjs:41-42` -- Loads contents via `safeReadFile` (returns null for missing files)
- `get-shit-done/bin/lib/scan.cjs:46-61` -- Iterates feature directories, loads each FEATURE.md content
- `get-shit-done/bin/lib/scan.cjs:63-71` -- Completeness computed: `full` (cap + features), `partial` (cap only), `none` (no cap)
- `get-shit-done/bin/lib/scan.cjs:122-127` -- Pairs enumerated with `i < j` ensuring A < B alphabetically (slugs are sorted at line 113)
- `get-shit-done/bin/lib/scan.cjs:84-96` -- GAP findings emitted for `completeness === 'none'` capabilities

**Spec-vs-reality gap:**
- FN-01 mentions resolving "exploration notes (.documentation/capabilities/*.md), discovery briefs". Implementation loads `.documentation/capabilities/{slug}.md` as `documentation` (line 39). Discovery briefs are not explicitly resolved as a separate artifact type. The implementation treats documentation as a single file per capability rather than multiple artifact subtypes.

---

### FN-02: Per-pair sequential analysis

**Verdict:** met (design verified; execution is workflow-runtime)

**Evidence:**
- `get-shit-done/templates/gsd-scan-pair.md:4` -- `You do NOT perform file I/O. All context is provided below.` -- agent receives contents not paths
- `get-shit-done/templates/gsd-scan-pair.md:9-19` -- Agent receives capability contents via template placeholders
- `get-shit-done/templates/gsd-scan-pair.md:17-19` -- Prior findings placeholder included
- `get-shit-done/workflows/landscape-scan.md:66-103` -- Sequential pair loop with checkpoint after each pair
- `get-shit-done/workflows/landscape-scan.md:94-96` -- Malformed output handling: "malformed output, skipping" + continue

---

### FN-03: Finding card format

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:12-16` -- Schema constants defined:
  ```javascript
  const FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT'];
  const SEVERITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
  const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
  const FINDING_FIELDS = ['id', 'type', 'severity', 'confidence', 'affected_capabilities', 'doc_sources', 'summary', 'recommendation', 'root_cause'];
  ```
- `get-shit-done/templates/gsd-scan-pair.md:25-36` -- Finding card schema in agent template includes all required fields
- `get-shit-done/templates/gsd-scan-pair.md:85` -- `FINDING-XXX` placeholder for orchestrator to assign sequential IDs
- `get-shit-done/bin/lib/scan.cjs:86-96` -- GAP findings produced by discover step follow the same schema (with `FINDING-XXX` placeholder)

**Cross-layer observations:**
- The `root_cause` field is in `FINDING_FIELDS` (line 16) and in the GAP finding structure (line 94: `root_cause: null`), but the agent template schema (gsd-scan-pair.md:25-36) does not include `root_cause` in its card format. This is correct -- root_cause is added during consolidation, not during per-pair analysis.

---

### FN-04: Dedup and consolidation

**Verdict:** met (design verified; execution is workflow-runtime)

**Evidence:**
- `get-shit-done/workflows/landscape-scan.md:106-119` -- Consolidation step defined: load all findings, identify root causes, group N symptoms into M root causes, assign ROOT-{NNN} IDs, update finding files with `root_cause` field
- `get-shit-done/bin/lib/scan.cjs:16` -- `FINDING_FIELDS` includes `root_cause`
- `get-shit-done/bin/lib/scan.cjs:94` -- GAP findings initialize with `root_cause: null`

**Spec-vs-reality gap:**
- FN-04 spec mentions "For 50+ cap projects: global consolidation pass runs after cluster-level dedup." Since TC-03 large tier is not implemented, this specific behavior path does not exist. Single consolidation pass is the only path.

---

### FN-05: Three-layer output aggregation

**Verdict:** met (design verified; execution is workflow-runtime)

**Evidence:**
- `get-shit-done/workflows/landscape-scan.md:126-138` -- Layer 1 (Relationship Matrix): capability x capability grid, highest severity relationship per cell, written to `.planning/refinement/matrix.md`
- `get-shit-done/workflows/landscape-scan.md:140-149` -- Layer 2 (Finding Cards): sorted by severity then type, root causes grouped, written to `.planning/refinement/summary.md`
- `get-shit-done/workflows/landscape-scan.md:151-166` -- Layer 3 (Dependency Graph): explicit, implicit, gap dependencies, written to `.planning/refinement/dependency-graph.md`
- `get-shit-done/workflows/landscape-scan.md:168-202` -- Summary.md structure with metadata, distribution table, root causes table, all findings table

**Spec-vs-reality gap:**
- FN-05 spec references `scan-output/summary.md` as the output path. Workflow uses `.planning/refinement/summary.md`. Consistent within the implementation but differs from the spec's path naming. The `.planning/refinement/` path is used consistently throughout the workflow.
- FN-05 spec Layer 3 shows ASCII arrow format (`A --requires--> B`). Workflow uses markdown table format instead (`| From | To | Type | Evidence |`). The table format is more structured and parseable.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | `scan.cjs:19-178` -- All three CLI routes implemented with correct JSON shapes, pure Node.js |
| TC-02 | not met (partial) | File at `templates/gsd-scan-pair.md` not `agents/gsd-scan-pair.md`; content and interface correct |
| TC-03 | not met (partial) | `scan.cjs:117-119` -- Only small tier implemented; medium/large fall back to full pairwise with warning |
| EU-01 | met | Discovery, GAP flagging, three-layer output all present in scan.cjs + workflow |
| EU-02 | met | `scan.cjs:149-173` -- Checkpoint read/write/list implemented; workflow filters completed pairs |
| FN-01 | met | `scan.cjs:28-96` -- Full artifact discovery, pair enumeration, GAP emission |
| FN-02 | met | Template + workflow define sequential per-pair analysis with contents-only agent |
| FN-03 | met | `scan.cjs:12-16` -- Schema constants match spec; template card format complete |
| FN-04 | met | Workflow consolidation step defined; root_cause field in schema; 50+ cluster dedup N/A (TC-03 gap) |
| FN-05 | met | Workflow defines all three layers; output path `.planning/refinement/` vs spec's `scan-output/` |
