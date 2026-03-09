<purpose>
Load scan artifacts and project context, detect zero-findings, spawn the coherence synthesis agent, and write RECOMMENDATIONS.md.

Triggered after landscape-scan completes. Produces the recommendations that refinement-qa will discuss with the user.
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<inputs>
None — operates on scan output in `.planning/refinement/` and project context files.
</inputs>

<process>

<step name="validate_scan_artifacts">
Check that landscape-scan output exists:

```bash
test -d .planning/refinement/ || { echo "Error: .planning/refinement/ not found. Run landscape-scan first."; exit 1; }
test -f .planning/refinement/matrix.md || { echo "Error: matrix.md not found. Run landscape-scan first."; exit 1; }
test -d .planning/refinement/findings/ || { echo "Error: findings/ not found. Run landscape-scan first."; exit 1; }
```

Note: `dependency-graph.md` may not exist if scan found zero dependencies — treat as optional.
</step>

<step name="load_scan_artifacts">
Read scan artifacts:

1. Read `.planning/refinement/matrix.md`
2. Read `.planning/refinement/dependency-graph.md` (if exists, else empty string)
3. Use Glob to find all `.planning/refinement/findings/FINDING-*.md`
4. Read each finding file
5. Count findings:
   - If count == 0: set `MODE = "zero-findings"`
   - Else: set `MODE = "normal"`

Log: "Loaded {N} findings, matrix, dependency graph"
</step>

<step name="load_project_context">
Read project context files:

1. Read `.planning/PROJECT.md` (if exists; handle gracefully if missing)
2. Read `.planning/ROADMAP.md`
3. Read `.planning/STATE.md`
4. Run capability-list to get all capabilities:
   ```bash
   CAPS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list)
   ```
   Handle @file: prefix for large output.
5. For each capability slug: read `.planning/capabilities/{slug}/CAPABILITY.md`
6. Check SEQUENCE.md staleness and rebuild if needed:
   ```bash
   STALE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query sequence-stale)
   ```
   If stale: invoke `@{GSD_ROOT}/get-shit-done/workflows/sequence.md` inline.
7. Read `.planning/SEQUENCE.md` (if exists)
8. Determine scope mode:
   ```bash
   FOCUS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state get active-focus)
   ```
   Parse for active focus group name, goal, and feature list.
   Set `SCOPE_MODE` = "focus" if active focus exists, else "project-wide".

Log: "Loaded project context + {N} capability definitions + SEQUENCE.md + scope:{SCOPE_MODE}"
</step>

<step name="semantic_coupling_scan">
For each in-scope capability:
  Run mgrep against the capability's Goal + Contract description.
  Collect capability pairs with high semantic similarity but no graph edge.

Store results for inclusion in agent prompt as `<semantic_coupling>` block.
</step>

<step name="assemble_agent_prompt">
Build the full prompt with XML context blocks:

```
<project_context>
## PROJECT.md
{project_md_content or "Not found — new project without PROJECT.md"}

## ROADMAP.md
{roadmap_content}

## STATE.md
{state_content}
</project_context>

<scan_artifacts>
## Relationship Matrix
{matrix_content}

## Capability Coupling
{dependency_graph_content or "No capability coupling graph produced."}
</scan_artifacts>

<findings>
{for each finding file: full content with --- frontmatter preserved}
{if no findings: "No findings detected."}
</findings>

<capabilities>
{for each capability: ## {slug}\n{capability_md_content}}
</capabilities>

<execution_sequence>
{SEQUENCE.md content or "No SEQUENCE.md available."}
</execution_sequence>

<semantic_coupling>
{For each capability pair with high semantic similarity but no graph edge:
  cap_a, cap_b, shared_surface_description, mgrep_confidence}
</semantic_coupling>

<scope mode="{SCOPE_MODE}">
{if focus: "Focus group: {name}\nGoal: {goal}\nFeatures: {feature_list}\nIn-scope capabilities: {cap_list}"}
{if project-wide: "Project-wide refinement — no focus scope filter."}
</scope>

<mode>{MODE}</mode>
```

This is a single invocation — no staged pipeline within this step.
</step>

<step name="spawn_synthesis_agent">
Spawn the gsd-coherence-synthesizer agent with the assembled prompt.

```
Task(
  prompt="{assembled_prompt}",
  subagent_type="gsd-coherence-synthesizer",
  description="Synthesize coherence recommendations"
)
```

The agent returns RECOMMENDATIONS.md content as its output.

Capture the full agent output. If output is empty: error "Synthesis agent produced no output. Check agent definition."
</step>

<step name="write_recommendations">
Write agent output to `.planning/refinement/RECOMMENDATIONS.md`:

1. Write agent output to a temp file
2. Run:
   ```bash
   node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" refinement-write --type recommendations --content-file {temp_path}
   ```
3. Verify the write succeeded
4. Clean up temp file

If `refinement-write` route fails: fall back to direct write using Write tool. Log warning.
</step>

<step name="completion">
Print summary:

```
-------------------------------------------------------
 GSD > COHERENCE REPORT COMPLETE
-------------------------------------------------------

Findings analyzed: {N}
Mode: {normal | zero-findings}
Output: .planning/refinement/RECOMMENDATIONS.md

Sections generated:
  1. Executive Summary
  2. Root Causes
  3. Systemic Patterns
  4. Goal Alignment
  5. Resolution Sequence
  6. Contradictions
  7. Q&A Agenda

Next: Run refinement-qa to discuss recommendations with the user.
```
</step>

</process>

<success_criteria>
- All scan artifacts loaded (matrix, dependency graph, findings)
- All project context loaded (PROJECT.md, ROADMAP.md, STATE.md, all CAPABILITY.md)
- Zero-findings detected at orchestrator level and passed as mode flag
- Agent receives contents not paths (all context as XML blocks)
- Single agent invocation produces RECOMMENDATIONS.md
- RECOMMENDATIONS.md written to .planning/refinement/
- Q&A agenda in final section consumable by refinement-qa
</success_criteria>
