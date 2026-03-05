---
phase: requirements-refinement/coherence-report
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - get-shit-done/workflows/coherence-report.md
autonomous: true
requirements:
  - EU-01
  - FN-01
  - FN-02
  - FN-03
must_haves:
  truths:
    - "Orchestrator loads all scan artifacts (matrix.md, dependency-graph.md, findings/*.md) and project context (PROJECT.md, ROADMAP.md, STATE.md, all CAPABILITY.md files)"
    - "Zero-findings case detected by orchestrator (empty findings/) and passed to agent as mode flag"
    - "Agent spawned with all context as XML blocks — no file paths passed to agent"
    - "RECOMMENDATIONS.md written to .planning/refinement/ via refinement-write --type recommendations"
    - "RECOMMENDATIONS.md contains Q&A agenda as final section consumable by refinement-qa"
  artifacts:
    - path: "get-shit-done/workflows/coherence-report.md"
      provides: "Orchestrator workflow: context loading, zero-findings detection, agent spawn, output write"
  key_links:
    - from: "get-shit-done/workflows/coherence-report.md"
      to: "agents/gsd-coherence-synthesizer.md"
      via: "Spawns agent with assembled XML context blocks"
      pattern: "gsd-coherence-synthesizer"
    - from: "get-shit-done/workflows/coherence-report.md"
      to: "get-shit-done/bin/gsd-tools.cjs"
      via: "Bash calls to refinement-write --type recommendations"
      pattern: "refinement-write.*recommendations"
    - from: "get-shit-done/workflows/coherence-report.md"
      to: ".planning/refinement/"
      via: "Reads matrix.md, dependency-graph.md, findings/ for context assembly"
      pattern: ".planning/refinement"
---

<objective>
Create the orchestrator workflow that loads scan artifacts and project context, detects zero-findings, spawns the coherence synthesis agent, and writes RECOMMENDATIONS.md.

Purpose: This workflow is the glue between landscape-scan output and the synthesis agent. It handles all file I/O so the agent can focus on reasoning. It is triggered by the refinement orchestrator after landscape-scan completes.
Output: get-shit-done/workflows/coherence-report.md
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/coherence-report/FEATURE.md
@.planning/capabilities/requirements-refinement/features/coherence-report/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/coherence-report/01-SUMMARY.md

<interfaces>
<!-- Agent created in Plan 01 -->
Agent: agents/gsd-coherence-synthesizer.md
- role_type: judge
- Receives: 5 XML blocks (project_context, scan_artifacts, findings, capabilities, mode)
- Outputs: RECOMMENDATIONS.md content as text

<!-- CLI routes available from refinement-artifact (Wave 1 sibling) -->
refinement-write --type recommendations --content-file <path>  -> writes RECOMMENDATIONS.md to .planning/refinement/

<!-- Scan artifacts directory (written by landscape-scan) -->
.planning/refinement/
  matrix.md
  dependency-graph.md
  findings/FINDING-{NNN}.md  (zero or more)

<!-- Project context files -->
.planning/PROJECT.md (goals, requirements)
.planning/ROADMAP.md (current priorities)
.planning/STATE.md (current position)
.planning/capabilities/*/CAPABILITY.md (all capability definitions)

<!-- Existing utility patterns from GSD codebase -->
safeReadFile(path) -> content or null
Bash: node gsd-tools.cjs capability-list -> { capabilities: [...] }
Glob: .planning/refinement/findings/FINDING-*.md -> list of finding files
50KB Bash buffer limit: output() uses @file: prefix for large payloads

<!-- Downstream consumer -->
refinement-qa reads RECOMMENDATIONS.md, specifically the Q&A Agenda final section
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create coherence-report orchestrator workflow</name>
  <reqs>EU-01, FN-01, FN-02, FN-03</reqs>
  <files>get-shit-done/workflows/coherence-report.md</files>
  <action>
  Create `get-shit-done/workflows/coherence-report.md` as a Claude Code workflow (.md file with structured instructions). Follow the pattern established by landscape-scan.md (orchestrator that loads context, spawns agent, writes output).

  **Workflow structure:**

  **Step 1: Validate scan artifacts exist (FN-01 precondition)**
  - Check `.planning/refinement/` directory exists
  - Check `matrix.md` exists in that directory
  - Check `findings/` subdirectory exists
  - If any missing: abort with clear error message: "Scan artifacts not found. Run landscape-scan first."
  - Note: dependency-graph.md may not exist if scan found zero dependencies — treat as optional

  **Step 2: Load scan artifacts (FN-01)**
  - Read `.planning/refinement/matrix.md`
  - Read `.planning/refinement/dependency-graph.md` (if exists, else empty string)
  - Use Glob to find all `.planning/refinement/findings/FINDING-*.md`
  - Read each finding file
  - Count findings. If count == 0: set `mode = "zero-findings"`, else `mode = "normal"`
  - Log: "Loaded {N} findings, matrix, dependency graph"

  **Step 3: Load project context (FN-01)**
  - Read `.planning/PROJECT.md` (if exists; new projects may not have this yet — handle gracefully)
  - Read `.planning/ROADMAP.md`
  - Read `.planning/STATE.md`
  - Run `node gsd-tools.cjs capability-list` to get list of capabilities
  - For each capability: read `.planning/capabilities/{slug}/CAPABILITY.md`
  - Handle @file: prefix on capability-list output (50KB buffer limit)
  - Log: "Loaded project context + {N} capability definitions"

  **Step 4: Assemble agent prompt (TC-01 — contents not paths)**
  - Build prompt with XML blocks:
    ```
    <project_context>
    ## PROJECT.md
    {project_md_content}

    ## ROADMAP.md
    {roadmap_content}

    ## STATE.md
    {state_content}
    </project_context>

    <scan_artifacts>
    ## Relationship Matrix
    {matrix_content}

    ## Dependency Graph
    {dependency_graph_content}
    </scan_artifacts>

    <findings>
    {for each finding file: full content with --- frontmatter preserved}
    </findings>

    <capabilities>
    {for each capability: ## {slug}\n{capability_md_content}}
    </capabilities>

    <mode>{mode}</mode>
    ```
  - This is the single invocation per FN-02. No staged pipeline within this step.

  **Step 5: Spawn synthesis agent**
  - Spawn gsd-coherence-synthesizer agent (from Plan 01) with the assembled prompt
  - The agent returns RECOMMENDATIONS.md content as its output
  - Capture the full agent output

  **Step 6: Write RECOMMENDATIONS.md (via refinement-write)**
  - Write agent output to a temp file
  - Run: `node gsd-tools.cjs refinement-write --type recommendations --content-file {temp_path}`
  - Verify the write succeeded
  - Clean up temp file
  - If refinement-write route is not yet available (Wave 1 not executed): fall back to direct write to `.planning/refinement/RECOMMENDATIONS.md` using Write tool. Log warning: "refinement-write route not available, writing directly."

  **Step 7: Completion message**
  - Print summary:
    - Findings analyzed: {N}
    - Root causes identified: {count from RECOMMENDATIONS.md}
    - Contradictions found: {count}
    - Q&A agenda items: {count}
    - Mode: {normal | zero-findings}
  - Point to: `.planning/refinement/RECOMMENDATIONS.md`
  - Note: "Run refinement-qa to discuss recommendations with the user"

  **Error handling:**
  - Missing scan artifacts: abort with actionable message (Step 1)
  - Empty PROJECT.md: proceed without goal alignment (agent handles this per TC-02)
  - Agent returns empty output: error "Synthesis agent produced no output. Check agent definition."
  - refinement-write fails: fall back to direct write (Step 6)
  </action>
  <verify>
    <automated>test -f get-shit-done/workflows/coherence-report.md && grep -q "gsd-coherence-synthesizer" get-shit-done/workflows/coherence-report.md && grep -q "refinement-write" get-shit-done/workflows/coherence-report.md && grep -q "zero-findings" get-shit-done/workflows/coherence-report.md && grep -q "matrix.md" get-shit-done/workflows/coherence-report.md && echo "OK"</automated>
  </verify>
  <done>coherence-report.md workflow exists with: scan artifact validation, context loading (all findings + matrix + dependency-graph + project files + capabilities), zero-findings detection, XML block assembly, single agent spawn, RECOMMENDATIONS.md write via refinement-write (with direct-write fallback), completion summary</done>
</task>

</tasks>

<verification>
1. Workflow loads all scan artifacts listed in FN-01 (matrix.md, dependency-graph.md, findings/*.md)
2. Workflow loads all project context listed in FN-01 (PROJECT.md, ROADMAP.md, STATE.md, all CAPABILITY.md)
3. Zero-findings detected by orchestrator (empty findings/) and passed as mode flag to agent
4. Agent receives contents not paths (TC-01 — all context as XML blocks)
5. Single agent invocation (FN-02 — no staged pipeline)
6. Output written via refinement-write --type recommendations (with fallback)
7. Workflow references gsd-coherence-synthesizer agent
8. Error handling covers: missing scan artifacts, empty PROJECT.md, empty agent output
9. Completion message points to RECOMMENDATIONS.md and suggests refinement-qa as next step
</verification>

<success_criteria>
- Orchestrator loads complete context bundle per FN-01 spec
- Zero-findings case handled at orchestrator level (prompt modification, not agent guesswork)
- Agent receives all context as XML blocks, performs zero file I/O (TC-01)
- Single agent invocation produces full RECOMMENDATIONS.md (FN-02)
- RECOMMENDATIONS.md written to .planning/refinement/ via refinement-write
- Q&A agenda in RECOMMENDATIONS.md is consumable by refinement-qa (FN-03)
- Missing scan artifacts produce actionable error message
- Completion message directs user to refinement-qa as next step
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/coherence-report/02-SUMMARY.md`
</output>
