# Functional Trace: coherence-report

## Phase 1: Internalize Requirements

| Req ID | Behavior Specification |
|--------|----------------------|
| EU-01 | RECOMMENDATIONS.md contains root causes w/ finding IDs, systemic patterns, resolution sequence aligned to goals, contradictions surfaced, zero-findings = clean bill of health, shapes Q&A agenda for refinement-qa |
| FN-01 | Read PROJECT.md, ROADMAP.md, STATE.md; read all scan artifacts (matrix.md, dependency-graph.md, findings/); load all CAPABILITY.md files; bundle as structured input |
| FN-02 | Single Claude invocation produces RECOMMENDATIONS.md with 7 sections; zero findings = clean bill of health |
| FN-03 | Q&A agenda derived from resolution sequence; categories: decision/informational/auto-resolve; each item: topic, recommended resolution, confidence |
| TC-01 | Agent file gsd-coherence-synthesizer.md; zero tools; judge role; receives contents not paths |
| TC-02 | Goal alignment categorical (blocks/risks/irrelevant); skip if no validated requirements |

---

## Phase 2: Trace Against Code

### FN-01: Context loading

**Verdict:** met

**Evidence:**

- `workflows/coherence-report.md:18-24` -- `validate_scan_artifacts` step checks `.planning/refinement/`, `matrix.md`, and `findings/` exist via bash tests. Dependency-graph explicitly noted as optional: "dependency-graph.md may not exist if scan found zero dependencies -- treat as optional."

- `workflows/coherence-report.md:30-41` -- `load_scan_artifacts` step reads `matrix.md`, `dependency-graph.md` (if exists), globs `FINDING-*.md`, reads each finding, and counts findings to set MODE.

- `workflows/coherence-report.md:47-56` -- `load_project_context` step reads `PROJECT.md` (graceful if missing), `ROADMAP.md`, `STATE.md`, runs `capability-list` tool, reads each `CAPABILITY.md`.

- `workflows/coherence-report.md:59-94` -- `assemble_agent_prompt` step bundles all loaded content into XML blocks: `<project_context>`, `<scan_artifacts>`, `<findings>`, `<capabilities>`, `<mode>`. All content is passed inline, not as paths.

- Reasoning: Every item from the FN-01 spec is addressed -- PROJECT.md, ROADMAP.md, STATE.md, matrix.md, dependency-graph.md (optional), findings/, all CAPABILITY.md files, and structured bundling.

### FN-02: Single-pass synthesis

**Verdict:** met

**Evidence:**

- `workflows/coherence-report.md:97-105` -- `spawn_synthesis_agent` step: "Spawn the gsd-coherence-synthesizer agent with the assembled prompt." Single invocation, agent returns RECOMMENDATIONS.md content.

- `agents/gsd-coherence-synthesizer.md:62-104` -- Output format section defines all 7 required sections in fixed order: Executive Summary, Root Causes, Systemic Patterns, Goal Alignment, Resolution Sequence, Contradictions, Q&A Agenda.

- `agents/gsd-coherence-synthesizer.md:120-128` -- Zero-findings mode explicitly defined: Executive Summary says "No findings detected," Root Causes "None," etc. Includes "Do NOT invent issues."

- `workflows/coherence-report.md:107-119` -- `write_recommendations` step writes output to `.planning/refinement/RECOMMENDATIONS.md` via `refinement-write` tool, with fallback to direct Write.

- Reasoning: Single invocation contract is maintained. All 7 sections specified in FN-02 are present in the agent output format. Zero-findings path produces clean bill of health. Output is written to the correct location.

### FN-03: Q&A agenda shaping

**Verdict:** met

**Evidence:**

- `agents/gsd-coherence-synthesizer.md:58` -- Step 6 of synthesis process: "Q&A Agenda: Derive from resolution sequence."

- `agents/gsd-coherence-synthesizer.md:98-103` -- Q&A Agenda table format includes columns: #, Category, Topic, Recommended Resolution, Confidence. Categories are `decision`, `informational`, `auto-resolve`.

- `agents/gsd-coherence-synthesizer.md:106-114` -- Category definitions match spec: `decision` = user choice needed, `informational` = clear fix, `auto-resolve` = obvious gaps. Confidence levels: HIGH/MEDIUM/LOW.

- `agents/gsd-coherence-synthesizer.md:116` -- "Ambiguous items default to category `decision` (safest). Contradictory finding pairs are excluded from resolution sequence and routed to Q&A as `decision` items."

- Reasoning: All three FN-03 sub-requirements are met: derived from resolution sequence, three categories present, each item has topic + recommended resolution + confidence.

### TC-01: Synthesis agent

**Verdict:** met

**Evidence:**

- `agents/gsd-coherence-synthesizer.md:1-8` -- Frontmatter: `name: gsd-coherence-synthesizer`, `tools: []`, `role_type: judge`.

- `agents/gsd-coherence-synthesizer.md:12` -- "You do NOT read files, write files, or use any tools. All input is provided in your prompt. Your output IS the RECOMMENDATIONS.md content."

- `workflows/coherence-report.md:59-94` -- Orchestrator assembles all content as XML blocks with inline content, not paths. Agent receives `<project_context>`, `<scan_artifacts>`, `<findings>`, `<capabilities>`, `<mode>`.

- Reasoning: Agent file exists at specified path, tools array is empty, role is judge, and the orchestrator passes contents (not paths) as confirmed by the XML assembly step.

### TC-02: Goal alignment categorical

**Verdict:** met

**Evidence:**

- `agents/gsd-coherence-synthesizer.md:49-54` -- Step 4 (Goal Alignment): "If no validated requirements exist: SKIP goal alignment entirely." Categories: `blocks`, `risks`, `irrelevant`.

- `agents/gsd-coherence-synthesizer.md:54` -- "Categorical only -- no numeric scores, no WSJF/RICE."

- `agents/gsd-coherence-synthesizer.md:85-87` -- Output format for Goal Alignment section: table with columns Root Cause, Blocks, Risks, Irrelevant. "(Skip this section entirely if no validated requirements in PROJECT.md)"

- Reasoning: Both constraints are met -- categorical assessment (blocks/risks/irrelevant) without numeric scoring, and explicit skip behavior when no validated requirements exist.

### EU-01: Synthesized coherence recommendations

**Verdict:** met

**Evidence:**

- Root causes with finding IDs: `agents/gsd-coherence-synthesizer.md:73-77` -- ROOT-{NNN} format with "Symptoms: FINDING-001, FINDING-003, FINDING-007"
- Systemic patterns: `agents/gsd-coherence-synthesizer.md:79-81` -- "Cross-cutting patterns spanning multiple root causes."
- Resolution sequence: `agents/gsd-coherence-synthesizer.md:89-92` -- Priority-ordered table with Action, Addresses (ROOT-xxx), Severity, Goal Impact.
- Contradictions: `agents/gsd-coherence-synthesizer.md:94-96` -- Contradiction table; if none: explicit note about detection limitations.
- Zero-findings: `agents/gsd-coherence-synthesizer.md:120-128` -- Clean bill of health mode fully specified.
- Q&A shaping: `agents/gsd-coherence-synthesizer.md:98-103` -- Structured agenda as final section, consumable by refinement-qa.

- Reasoning: All 6 acceptance criteria from EU-01 are addressed across the two artifacts.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | agents/gsd-coherence-synthesizer.md:73-128 -- all 6 acceptance criteria covered |
| FN-01 | met | workflows/coherence-report.md:30-94 -- reads all specified context, bundles as XML |
| FN-02 | met | workflows/coherence-report.md:97-105 + agents/gsd-coherence-synthesizer.md:62-104 -- single invocation, 7 sections, zero-findings mode |
| FN-03 | met | agents/gsd-coherence-synthesizer.md:98-116 -- 3 categories, derived from resolution sequence, topic+resolution+confidence |
| TC-01 | met | agents/gsd-coherence-synthesizer.md:1-8 -- tools: [], role_type: judge, receives contents not paths |
| TC-02 | met | agents/gsd-coherence-synthesizer.md:49-54,85-87 -- categorical blocks/risks/irrelevant, skip if no validated reqs |
