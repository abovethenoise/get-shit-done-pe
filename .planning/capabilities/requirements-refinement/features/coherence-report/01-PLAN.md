---
phase: requirements-refinement/coherence-report
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agents/gsd-coherence-synthesizer.md
autonomous: true
requirements:
  - TC-01
  - TC-02
  - FN-02
  - FN-03
must_haves:
  truths:
    - "Agent uses role_type: judge (opus-level reasoning for cross-finding synthesis)"
    - "Agent receives all context as XML blocks in the prompt, performs zero file I/O"
    - "Agent outputs RECOMMENDATIONS.md content with fixed 7-section ordering"
    - "Goal alignment uses categorical blocks/risks/irrelevant assessment, not numeric scores"
    - "Q&A agenda is the final section with machine-parseable format (category, topic, resolution, confidence)"
    - "Root cause grouping uses explicit causal clustering, not topic-level semantic similarity"
    - "Zero-findings prompt variant produces clean bill of health without inventing issues"
  artifacts:
    - path: "agents/gsd-coherence-synthesizer.md"
      provides: "Synthesis agent definition with role, goal, input format, output format, and quality constraints"
  key_links:
    - from: "agents/gsd-coherence-synthesizer.md"
      to: ".planning/refinement/findings/FINDING-*.md"
      via: "Receives finding card contents as XML blocks from orchestrator"
      pattern: "<findings>"
    - from: "agents/gsd-coherence-synthesizer.md"
      to: ".planning/refinement/RECOMMENDATIONS.md"
      via: "Agent output is the RECOMMENDATIONS.md content (orchestrator writes to disk)"
      pattern: "RECOMMENDATIONS"
---

<objective>
Create the coherence synthesis agent definition that transforms scan findings + project context into a structured RECOMMENDATIONS.md document.

Purpose: This agent is the reasoning core of the coherence-report feature. It receives all context from the orchestrator (no file I/O), performs causal root-cause grouping, goal alignment assessment, and produces a prioritized resolution sequence with a machine-parseable Q&A agenda.
Output: agents/gsd-coherence-synthesizer.md
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/coherence-report/FEATURE.md
@.planning/capabilities/requirements-refinement/features/coherence-report/RESEARCH.md

<interfaces>
<!-- Existing synthesizer pattern to follow -->
Agent pattern: agents/gsd-research-synthesizer.md and agents/gsd-review-synthesizer.md
- role_type: judge (maps to opus/inherit model)
- Receives structured input from orchestrator
- Outputs consolidated document
- No file I/O in agent

<!-- Input XML blocks (assembled by orchestrator) -->
<project_context> — PROJECT.md goals/requirements, ROADMAP.md priorities, STATE.md position
<scan_artifacts> — matrix.md content, dependency-graph.md content
<findings> — all FINDING-{id}.md card contents (or empty for zero-findings)
<capabilities> — all CAPABILITY.md contents for reference
<zero_findings_mode> — boolean flag, true when findings/ is empty

<!-- Output: RECOMMENDATIONS.md content -->
Fixed section ordering (refinement-qa parsing contract):
1. Executive Summary
2. Root Causes
3. Systemic Patterns
4. Goal Alignment
5. Resolution Sequence
6. Contradictions
7. Q&A Agenda (MUST be final section)

<!-- Finding card schema (from landscape-scan) -->
Fields: id, type (CONFLICT|GAP|OVERLAP|DEPENDS_ON|ASSUMPTION_MISMATCH|ALIGNMENT),
        severity (HIGH|MEDIUM|LOW), confidence (HIGH|MEDIUM|LOW),
        affected_capabilities, doc_sources, summary, recommendation, root_cause (nullable)

<!-- Q&A agenda format contract (shared with refinement-qa) -->
refinement-qa FN-01 will programmatically parse the Q&A agenda section.
Format must be structured markdown, not prose.
Categories: decision | informational | auto-resolve
Confidence: HIGH | MEDIUM | LOW
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create coherence synthesis agent definition</name>
  <reqs>TC-01, TC-02, FN-02, FN-03</reqs>
  <files>agents/gsd-coherence-synthesizer.md</files>
  <action>
  Create `agents/gsd-coherence-synthesizer.md` following the established GSD synthesizer pattern (reference agents/gsd-research-synthesizer.md for structure).

  **1. Frontmatter:**
  ```yaml
  ---
  name: gsd-coherence-synthesizer
  description: Synthesizes landscape scan findings into prioritized recommendations with root cause grouping, goal alignment, and Q&A agenda for refinement
  tools: []
  role_type: judge
  reads: []
  writes: []
  ---
  ```
  Note: tools, reads, writes are empty -- agent receives all context in prompt and outputs text. No file I/O.

  **2. Role section:**
  - You are the coherence synthesizer. You receive landscape scan findings and project context, and produce a structured RECOMMENDATIONS.md document.
  - You do NOT read files, write files, or use any tools. All input is provided in your prompt. Your output IS the RECOMMENDATIONS.md content.

  **3. Goal:**
  Produce a single RECOMMENDATIONS.md that transforms raw scan findings into actionable recommendations: group symptoms into root causes, assess alignment with project goals, prioritize a resolution sequence, surface contradictions, and shape a Q&A agenda for user discussion.

  **4. Input format documentation:**
  Document the XML blocks the agent expects from the orchestrator:
  - `<project_context>` — PROJECT.md, ROADMAP.md, STATE.md content
  - `<scan_artifacts>` — matrix.md and dependency-graph.md content
  - `<findings>` — each FINDING-{id}.md card (may be empty)
  - `<capabilities>` — each CAPABILITY.md for cross-reference
  - `<mode>` — "normal" or "zero-findings"

  **5. Synthesis process (reasoning order, not output order):**
  Per RESEARCH.md conflict resolution: reason about contradictions and resolution ordering BEFORE writing output, then serialize into the fixed section order. This separates reasoning order from output order to mitigate end-of-output hallucination.

  Step 1 — Inventory: List all findings by type and severity. Note any with null root_cause.
  Step 2 — Causal clustering (critical — per RESEARCH.md consensus):
    - For each cluster of 2+ findings: ask "what shared CAUSE would produce these co-occurring symptoms?"
    - NOT topic grouping. Two findings about "auth" that have different causes are different root causes.
    - Use fishbone/5-Whys reasoning: trace each finding back to its deepest cause.
    - Assign ROOT-{NNN} IDs. Each root cause lists its symptom FINDING IDs.
  Step 3 — Contradiction detection (explicit cross-checking per RESEARCH.md):
    - Compare every recommendation pair: does recommendation A conflict with recommendation B?
    - Check for: opposite actions on same target, mutually exclusive resource allocation, incompatible interface assumptions.
    - LLMs systematically under-detect contradictions (~45% recall). Explicitly enumerate comparisons.
  Step 4 — Goal alignment (TC-02):
    - Read PROJECT.md validated requirements list.
    - If no validated requirements exist: SKIP goal alignment entirely. Note "No validated requirements found; prioritizing by severity and dependency impact only."
    - For each root cause, categorize:
      - `blocks`: which validated/active requirements this directly threatens
      - `risks`: which requirements could be affected indirectly
      - `irrelevant`: explicitly out-of-scope areas
    - Categorical only — no numeric scores, no WSJF/RICE.
  Step 5 — Resolution sequence: Priority = severity + goal alignment + downstream dependency impact. Higher priority first.
  Step 6 — Q&A agenda derivation from resolution sequence.

  **6. Output format (fixed section ordering — refinement-qa contract):**

  ```markdown
  # Coherence Recommendations

  ## Executive Summary
  - Finding count by severity (HIGH: N, MEDIUM: N, LOW: N)
  - Key themes (2-4 sentences)
  - Overall project coherence assessment (1 sentence)

  ## Root Causes
  For each root cause:
  ### ROOT-{NNN}: {description}
  **Symptoms:** FINDING-001, FINDING-003, FINDING-007
  **Analysis:** {causal explanation}
  **Recommendation:** {what to do}

  ## Systemic Patterns
  Cross-cutting patterns spanning multiple root causes.
  Each pattern: description + which ROOT-{NNN} IDs it connects.

  ## Goal Alignment
  | Root Cause | Blocks | Risks | Irrelevant |
  |------------|--------|-------|------------|
  | ROOT-001   | REQ-X  | REQ-Y | REQ-Z      |
  (Skip this section entirely if no validated requirements in PROJECT.md)

  ## Resolution Sequence
  Priority-ordered actions. Each references ROOT-{NNN} it addresses.
  | Priority | Action | Addresses | Severity | Goal Impact |
  |----------|--------|-----------|----------|-------------|
  | 1        | ...    | ROOT-001  | HIGH     | blocks REQ-X|

  ## Contradictions
  Cases where recommendations conflict.
  | Conflict | Recommendation A | Recommendation B | Nature |
  |----------|-----------------|-----------------|--------|
  If none found: "No contradictions detected. Note: automated contradiction detection has known recall limitations (~45%). Q&A should probe for additional conflicts."

  ## Q&A Agenda
  | # | Category | Topic | Recommended Resolution | Confidence |
  |---|----------|-------|----------------------|------------|
  | 1 | decision | ... | ... | HIGH |
  | 2 | informational | ... | ... | MEDIUM |
  | 3 | auto-resolve | ... | ... | HIGH |
  ```

  Category definitions:
  - `decision`: requires user choice (contradictions, ambiguous severity, strategic tradeoffs)
  - `informational`: clear fix, no tradeoffs, user should know but doesn't need to decide
  - `auto-resolve`: obvious gaps/missing docs that can be fixed without discussion

  Confidence definitions:
  - `HIGH`: clear single resolution, strong evidence
  - `MEDIUM`: resolution is likely correct but has tradeoffs
  - `LOW`: multiple viable options or insufficient data

  Ambiguous items default to category `decision` (safest).
  Contradictory finding pairs are excluded from resolution sequence and routed to Q&A as `decision` items.

  **7. Zero-findings mode:**
  When `<mode>zero-findings</mode>`:
  - Executive Summary: "No findings detected across N capability pairs."
  - Root Causes: "None — no findings to cluster."
  - Systemic Patterns: "None."
  - Goal Alignment: Project coherence assessment based on capability structure alone.
  - Resolution Sequence: "No actions required."
  - Contradictions: "N/A"
  - Q&A Agenda: Single informational item confirming clean bill of health.
  - Do NOT invent issues. If the scan found nothing, the report says nothing.

  **8. Quality constraints:**
  - Every finding ID referenced must exist in the input
  - Every root cause must reference at least one finding
  - Resolution sequence must reference at least one root cause per action
  - Q&A agenda must include ALL contradiction items as `decision` category
  - Section ordering is immutable (refinement-qa parsing contract)
  </action>
  <verify>
    <automated>test -f agents/gsd-coherence-synthesizer.md && grep -q "role_type: judge" agents/gsd-coherence-synthesizer.md && grep -q "Q&A Agenda" agents/gsd-coherence-synthesizer.md && grep -q "blocks.*risks.*irrelevant" agents/gsd-coherence-synthesizer.md && grep -q "zero-findings" agents/gsd-coherence-synthesizer.md && echo "OK"</automated>
  </verify>
  <done>gsd-coherence-synthesizer.md exists with: role_type judge, zero file I/O, causal clustering instructions (not topic grouping), categorical goal alignment (blocks/risks/irrelevant), fixed 7-section output ordering, machine-parseable Q&A agenda table with category/confidence columns, zero-findings clean-bill-of-health mode, explicit contradiction cross-checking instructions</done>
</task>

</tasks>

<verification>
1. Agent frontmatter has role_type: judge and empty tools/reads/writes arrays
2. Input format documents all 5 XML block types the orchestrator will inject
3. Causal clustering instructions explicitly differentiate from topic grouping (fishbone/5-Whys)
4. Goal alignment uses blocks/risks/irrelevant categories — no numeric scores
5. Goal alignment is skipped when PROJECT.md has no validated requirements
6. Q&A agenda is a markdown table with columns: #, Category, Topic, Recommended Resolution, Confidence
7. Confidence uses HIGH/MEDIUM/LOW vocabulary matching finding severity pattern
8. Zero-findings mode documented with explicit "do NOT invent issues" instruction
9. Contradiction cross-checking is explicit (enumerate comparisons, not rely on spontaneous detection)
10. Section ordering matches: exec summary, root causes, systemic patterns, goal alignment, resolution sequence, contradictions, Q&A agenda
</verification>

<success_criteria>
- Agent definition follows established GSD synthesizer pattern (research-synthesizer, review-synthesizer)
- No file I/O in agent — clean separation (TC-01)
- Categorical goal alignment implemented per TC-02 spec
- Q&A agenda format is machine-parseable with explicit contract for refinement-qa consumption
- Causal root cause grouping explicitly instructed (not left to LLM default topic clustering)
- Zero-findings path produces clean bill of health without hallucinated issues
- Fixed section ordering preserved (refinement-qa parsing dependency)
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/coherence-report/01-SUMMARY.md`
</output>
