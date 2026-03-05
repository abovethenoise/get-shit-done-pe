---
phase: requirements-refinement/landscape-scan
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - get-shit-done/workflows/landscape-scan.md
  - get-shit-done/templates/gsd-scan-pair.md
autonomous: true
requirements:
  - EU-01
  - EU-02
  - FN-02
  - FN-03
  - FN-04
  - FN-05
  - TC-02
must_haves:
  truths:
    - "Orchestrator workflow drives the full scan loop: discover -> pairs -> sequential analysis -> consolidation -> three-layer output"
    - "Per-pair agent receives capability contents + prior findings and outputs structured finding cards"
    - "Completed pairs are skipped on resume via checkpoint read"
    - "Consolidation pass groups N symptoms into M root causes"
    - "Three-layer output (relationship matrix, finding cards, dependency graph) written to .planning/refinement/"
  artifacts:
    - path: "get-shit-done/workflows/landscape-scan.md"
      provides: "Orchestrator workflow driving sequential pair analysis with checkpoint/resume"
    - path: "get-shit-done/templates/gsd-scan-pair.md"
      provides: "Per-pair analysis agent prompt template with finding card schema"
  key_links:
    - from: "get-shit-done/workflows/landscape-scan.md"
      to: "get-shit-done/bin/gsd-tools.cjs"
      via: "Bash calls to scan-discover, scan-pairs, scan-checkpoint"
      pattern: "gsd-tools.cjs scan-"
    - from: "get-shit-done/workflows/landscape-scan.md"
      to: "get-shit-done/templates/gsd-scan-pair.md"
      via: "Agent spawn per pair with injected context"
      pattern: "gsd-scan-pair"
    - from: "get-shit-done/workflows/landscape-scan.md"
      to: ".planning/refinement/"
      via: "Writes summary.md, matrix.md, dependency-graph.md, findings/"
      pattern: ".planning/refinement"
---

<objective>
Create the orchestrator workflow and per-pair agent that drive the landscape scan: sequential pair analysis with checkpoint/resume, finding consolidation, and three-layer output assembly.

Purpose: This is the user-facing scan pipeline. It consumes the CLI routes from Plan 01, spawns the per-pair agent for each capability combination, and produces the three-layer output that coherence-report (downstream feature) reads.
Output: landscape-scan.md workflow + gsd-scan-pair.md agent template
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/landscape-scan/FEATURE.md
@.planning/capabilities/requirements-refinement/features/landscape-scan/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/landscape-scan/01-SUMMARY.md

<interfaces>
<!-- CLI routes available from Plan 01 -->
scan-discover -> { capabilities: [{slug, artifacts: {capability, features, documentation}, completeness}], gap_findings: [...] }
scan-pairs -> { tier, capability_count, pairs: [{a, b}], total_pairs }
scan-checkpoint --pair A__B --action read -> { completed: true/false }
scan-checkpoint --pair A__B --action write -> creates marker file
scan-checkpoint --action list -> { completed_pairs: [...] }

<!-- Output directory (resolved spec conflict) -->
Base: .planning/refinement/
Files: summary.md, matrix.md, dependency-graph.md, findings/FINDING-{NNN}.md, pairs/{A}__{B}.complete

<!-- Finding card schema (from scan.cjs) -->
Fields: id, type (CONFLICT|GAP|OVERLAP|DEPENDS_ON|ASSUMPTION_MISMATCH|ALIGNMENT), severity (HIGH|MEDIUM|LOW), confidence (HIGH|MEDIUM|LOW), affected_capabilities (with direction), doc_sources (file:line), summary, recommendation, root_cause (nullable, set during consolidation)

<!-- Context management (from RESEARCH.md consensus) -->
Prior findings grow linearly. For <=20 caps (190 max pairs), include all prior finding SUMMARIES (not full cards) as context to later pairs. If total prior context exceeds ~100KB, summarize to most recent 20 findings + all HIGH severity.

<!-- Coherence-report consumer contract -->
coherence-report reads: .planning/refinement/matrix.md, .planning/refinement/findings/FINDING-*.md, .planning/refinement/dependency-graph.md
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create per-pair analysis agent template</name>
  <reqs>TC-02, FN-02, FN-03</reqs>
  <files>get-shit-done/templates/gsd-scan-pair.md</files>
  <action>
  Create the agent prompt template for per-pair capability analysis. This agent:

  1. **Role section:**
     - You are a capability coherence analyzer. You receive two capabilities' complete documentation and produce structured finding cards.
     - You do NOT perform file I/O. All context is provided in the prompt. All output is structured text.

  2. **Input format (XML blocks injected by orchestrator):**
     - `<capability_a>` -- slug, all artifact contents (CAPABILITY.md, FEATURE.md files, documentation)
     - `<capability_b>` -- same structure
     - `<prior_findings>` -- summaries of findings from earlier pairs (may be empty for first pair)
     - `<finding_schema>` -- the finding card field definitions and type taxonomy

  3. **Analysis instructions:**
     - Analyze for each finding type explicitly (LLMs won't surface conflicts spontaneously per RESEARCH.md):
       - CONFLICT: Do these capabilities define contradictory behavior, overlapping ownership, or incompatible interfaces?
       - GAP: Is there a capability that should exist between these two but doesn't? Is there an undocumented dependency?
       - OVERLAP: Do these capabilities duplicate functionality or own the same artifacts?
       - DEPENDS_ON: Does one capability implicitly depend on the other without documenting it?
       - ASSUMPTION_MISMATCH: Do they assume different things about shared concepts?
       - ALIGNMENT: Does either capability drift from stated project goals?
     - Reference prior findings if this pair reveals another symptom of an existing root cause
     - Symmetric analysis: analyze A->B and B->A directions explicitly

  4. **Output format:**
     - Zero or more finding cards, each as a markdown section with YAML frontmatter:
       ```
       ---
       id: FINDING-{NNN}
       type: CONFLICT
       severity: HIGH
       confidence: HIGH
       affected_capabilities: [cap-a (producer), cap-b (consumer)]
       doc_sources:
         - path: ".planning/capabilities/cap-a/CAPABILITY.md"
           line: 42
       ---
       ## Summary
       Plain language description of the finding.
       ## Recommendation
       Actionable suggestion.
       ```
     - If no findings: output `NO_FINDINGS` token
     - Finding IDs are assigned by the orchestrator (agent outputs placeholder `FINDING-XXX`)

  5. **Model directive:** Use sonnet-class model (reasoning sufficient, faster for iteration).
  </action>
  <verify>
    <automated>test -f get-shit-done/templates/gsd-scan-pair.md && grep -q "CONFLICT" get-shit-done/templates/gsd-scan-pair.md && echo "OK"</automated>
  </verify>
  <done>gsd-scan-pair.md exists with complete analysis instructions, input/output format, and all 6 finding types enumerated</done>
</task>

<task type="auto">
  <name>Create landscape-scan orchestrator workflow</name>
  <reqs>EU-01, EU-02, FN-02, FN-04, FN-05</reqs>
  <files>get-shit-done/workflows/landscape-scan.md</files>
  <action>
  Create the orchestrator workflow that drives the full scan pipeline. Structure as a Claude Code workflow (.md) with these stages:

  **Stage 1: Discovery**
  - Run `node gsd-tools.cjs scan-discover` to get all capabilities with contents
  - Handle @file: prefix for large output (read the tmpfile path)
  - If gap_findings returned, write each as FINDING-{NNN}.md to .planning/refinement/findings/
  - Create .planning/refinement/ directory structure if it doesn't exist (refinement/, refinement/findings/, refinement/pairs/)

  **Stage 2: Pair Enumeration + Resume Check**
  - Run `node gsd-tools.cjs scan-pairs` to get ordered pair list
  - Run `node gsd-tools.cjs scan-checkpoint --action list` to get completed pairs
  - Filter out already-completed pairs
  - Initialize finding ID counter from highest existing FINDING-{NNN}.md + 1 (for resume continuity)
  - Log: "{N} pairs total, {M} already complete, {P} remaining"

  **Stage 3: Sequential Pair Analysis**
  - For each remaining pair (A, B):
    - Extract capability A and B contents from discovery output
    - Build prior findings context: load summaries of all findings so far (from disk). If total > ~100KB, include only HIGH severity + most recent 20.
    - Spawn gsd-scan-pair agent (using Task tool or inline prompt) with:
      - capability_a contents
      - capability_b contents
      - prior_findings summaries
      - finding_schema
    - Parse agent output:
      - If NO_FINDINGS: log and continue
      - Otherwise: extract finding cards, assign sequential IDs (FINDING-{NNN}), write each to .planning/refinement/findings/FINDING-{NNN}.md
    - If agent returns malformed output: log warning, skip pair, continue (don't halt scan)
    - Write checkpoint: `node gsd-tools.cjs scan-checkpoint --pair {A}__{B} --action write`
    - Log progress: "Pair {i}/{total}: {A} x {B} -> {N} findings"

  **Stage 4: Consolidation (FN-04)**
  - Load all finding cards from .planning/refinement/findings/
  - If zero findings total: skip consolidation, note in summary
  - If findings exist: run a consolidation prompt that:
    - Groups N symptoms into M root causes (M <= N)
    - For each root cause: assign a ROOT-{NNN} ID, list symptom FINDING IDs
    - Update each finding card file to add `root_cause: ROOT-{NNN}` to frontmatter
  - For projects with 50+ caps: note that a global cross-cluster consolidation pass would run here (not implemented, YAGNI)

  **Stage 5: Three-Layer Output Assembly (FN-05)**
  - **Layer 1 -- Relationship Matrix (matrix.md):**
    - Build capability x capability grid
    - Each cell: relationship type from findings (DEPENDS_ON, CONFLICT, GAP, OVERLAP, NONE) + confidence
    - Diagonal: `--`
    - Write to .planning/refinement/matrix.md

  - **Layer 2 -- Finding Cards:**
    - Already written as individual files in Stage 3
    - In summary.md, list all findings sorted by severity (HIGH first), then type
    - Root causes grouped with their symptoms

  - **Layer 3 -- Dependency Graph (dependency-graph.md):**
    - Explicit dependencies: from CAPABILITY.md `Dependencies` tables
    - Implicit dependencies: DEPENDS_ON findings discovered during analysis
    - Gap dependencies: GAP findings where a dependency should exist but doesn't
    - Format: `A --requires--> B`, `A --triggers--> B (implicit)`, `A --triggers--> B (GAP -- no spec exists)`
    - Write to .planning/refinement/dependency-graph.md

  - **Summary (summary.md):**
    - Scan metadata: date, capability count, pair count, tier, duration
    - Pointers to matrix.md, dependency-graph.md, findings/
    - Finding summary table: type counts, severity distribution
    - Write to .planning/refinement/summary.md

  **Completion message:**
  - Print scan summary stats
  - List HIGH severity findings
  - Point to .planning/refinement/summary.md for full results
  - Note: "Run coherence-report to generate recommendations from these findings"
  </action>
  <verify>
    <automated>test -f get-shit-done/workflows/landscape-scan.md && grep -q "scan-discover" get-shit-done/workflows/landscape-scan.md && grep -q "scan-checkpoint" get-shit-done/workflows/landscape-scan.md && echo "OK"</automated>
  </verify>
  <done>landscape-scan.md workflow exists with all 5 stages; references scan-discover, scan-pairs, scan-checkpoint CLI routes; writes output to .planning/refinement/ directory structure; handles checkpoint/resume flow</done>
</task>

</tasks>

<verification>
1. Workflow references all three scan-* CLI routes from Plan 01
2. Agent template covers all 6 finding types with explicit analysis prompts
3. Output writes to .planning/refinement/ (matching coherence-report consumer contract)
4. Checkpoint/resume logic: completed pairs are skipped, finding ID counter resumes from highest existing
5. Consolidation pass groups symptoms into root causes
6. Three-layer output: matrix.md, findings/FINDING-*.md, dependency-graph.md all specified
7. Malformed agent output handled gracefully (log + skip, not halt)
</verification>

<success_criteria>
- Orchestrator workflow covers the full pipeline: discover -> pairs -> analyze -> consolidate -> assemble
- Per-pair agent receives contents (not paths), outputs structured finding cards
- Checkpoint/resume enables interrupted scans to continue
- Three-layer output satisfies coherence-report's consumer contract
- Context management prevents unbounded growth of prior findings
- All 6 finding types explicitly prompted in agent (not left to LLM initiative)
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/landscape-scan/02-SUMMARY.md`
</output>
