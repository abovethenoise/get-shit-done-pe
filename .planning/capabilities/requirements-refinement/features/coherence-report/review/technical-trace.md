# Technical Trace: coherence-report

## Phase 1: Internalize Requirements

| Req ID | Technical Specification |
|--------|----------------------|
| TC-01 | Synthesis agent at `agents/gsd-coherence-synthesizer.md`. role_type: judge, tools/reads/writes empty. Receives all context as contents (XML blocks), not paths. Orchestrator handles all file I/O. |
| TC-02 | Goal alignment uses categorical `blocks/risks/irrelevant` (no numeric scores). Skip entirely if no validated requirements in PROJECT.md. |
| FN-01 | Load scan artifacts (matrix.md, dependency-graph.md, findings/*.md) + project context (PROJECT.md, ROADMAP.md, STATE.md, all CAPABILITY.md). |
| FN-02 | Single Claude invocation produces full RECOMMENDATIONS.md with fixed 7-section ordering. Written to `.planning/refinement/`. |
| FN-03 | Q&A agenda as final section with machine-parseable table: #, Category, Topic, Recommended Resolution, Confidence. Categories: decision/informational/auto-resolve. |
| EU-01 | User gets synthesized recommendations with root causes, systemic patterns, goal alignment, resolution sequence, contradictions, Q&A agenda. |

---

## Phase 2: Trace Against Code

### TC-01: Synthesis agent

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:4-7` -- `tools: []`, `role_type: judge`, `reads: []`, `writes: []`
  - Reasoning: Frontmatter declares zero tools/reads/writes exactly as specified. role_type is judge for opus-level reasoning.
- `agents/gsd-coherence-synthesizer.md:12` -- `You do NOT read files, write files, or use any tools. All input is provided in your prompt.`
  - Reasoning: Explicit instruction reinforces zero file I/O contract.
- `agents/gsd-coherence-synthesizer.md:22-28` -- Input format documents all 5 XML blocks: `<project_context>`, `<scan_artifacts>`, `<findings>`, `<capabilities>`, `<mode>`
  - Reasoning: Agent expects contents via XML, not file paths. Matches TC-01 constraint.
- `get-shit-done/workflows/coherence-report.md:63-91` -- Orchestrator assembles all 5 XML blocks with file contents inline.
  - Reasoning: Orchestrator does the file I/O, passes contents to agent. Clean separation confirmed.
- `get-shit-done/workflows/coherence-report.md:100` -- `Agent definition: @agents/gsd-coherence-synthesizer.md`
  - Reasoning: Correct agent reference. File exists at specified path.

**Spec-vs-reality gap:** Plan 01 interface section (01-PLAN.md:67) named the mode tag `<zero_findings_mode>` (boolean). Implementation uses `<mode>` with string values "normal" or "zero-findings". Both agent and orchestrator are consistent with each other; the plan was refined during execution. No functional impact.

### TC-02: Goal alignment scoring

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:50-53` -- `blocks: which validated/active requirements this directly threatens`, `risks: which requirements could be affected indirectly`, `irrelevant: explicitly out-of-scope areas`
  - Reasoning: All three categorical levels present exactly as specified.
- `agents/gsd-coherence-synthesizer.md:54` -- `Categorical only -- no numeric scores, no WSJF/RICE.`
  - Reasoning: Explicit exclusion of numeric scoring matches TC-02 constraint.
- `agents/gsd-coherence-synthesizer.md:49` -- `If no validated requirements exist: SKIP goal alignment entirely. Note "No validated requirements found; prioritizing by severity and dependency impact only."`
  - Reasoning: Skip-on-missing behavior matches TC-02 spec for new projects.
- `agents/gsd-coherence-synthesizer.md:82-87` -- Goal Alignment table in output format uses `| Root Cause | Blocks | Risks | Irrelevant |` columns with skip instruction: `(Skip this section entirely if no validated requirements in PROJECT.md)`
  - Reasoning: Output format enforces the categorical structure.

**Spec-vs-reality gap:** None.

### FN-01: Context loading

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/coherence-report.md:17-24` -- Validates scan artifact prerequisites: `.planning/refinement/` dir, `matrix.md`, `findings/` subdir. Treats `dependency-graph.md` as optional.
  - Reasoning: Matches FN-01 precondition checks. Optional dependency-graph handling matches spec note about zero-dependency scans.
- `get-shit-done/workflows/coherence-report.md:30-38` -- Reads matrix.md, dependency-graph.md (if exists), globs findings, counts findings for mode detection.
  - Reasoning: All scan artifacts loaded per FN-01.
- `get-shit-done/workflows/coherence-report.md:44-55` -- Reads PROJECT.md (graceful if missing), ROADMAP.md, STATE.md. Runs `capability-list` and reads each CAPABILITY.md. Handles `@file:` prefix.
  - Reasoning: All project context loaded per FN-01. Graceful PROJECT.md handling supports new projects.

**Spec-vs-reality gap:** None.

### FN-02: Single-pass synthesis

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/coherence-report.md:59-94` -- Single `assemble_agent_prompt` step builds one prompt. Comment: "This is a single invocation -- no staged pipeline within this step."
  - Reasoning: Single-pass constraint explicitly enforced.
- `get-shit-done/workflows/coherence-report.md:97-104` -- `spawn_synthesis_agent` step spawns one agent invocation. Captures output. Errors if empty.
  - Reasoning: One agent call, not a multi-step pipeline.
- `agents/gsd-coherence-synthesizer.md:62-104` -- Output format defines fixed 7-section ordering: Executive Summary, Root Causes, Systemic Patterns, Goal Alignment, Resolution Sequence, Contradictions, Q&A Agenda.
  - Reasoning: All 7 sections present in correct order. Section ordering labeled as "immutable (refinement-qa parsing contract)."
- `get-shit-done/workflows/coherence-report.md:107-119` -- Writes output via `refinement-write --type recommendations`. Falls back to direct write if route fails.
  - Reasoning: Output path `.planning/refinement/RECOMMENDATIONS.md` matches spec.
- `get-shit-done/bin/lib/refinement.cjs:246-247` -- `case 'recommendations': destPath = path.join(refDir, 'RECOMMENDATIONS.md');`
  - Reasoning: CLI route exists and writes to correct location.

**Spec-vs-reality gap:** None.

### FN-03: Q&A agenda shaping

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:98-104` -- Q&A Agenda table: `| # | Category | Topic | Recommended Resolution | Confidence |` with example rows using `decision`, `informational`, `auto-resolve` categories and `HIGH`/`MEDIUM` confidence levels.
  - Reasoning: Machine-parseable table format with all required columns matches FN-03 spec.
- `agents/gsd-coherence-synthesizer.md:107-109` -- Category definitions: `decision` (user choice), `informational` (clear fix), `auto-resolve` (obvious gaps).
  - Reasoning: Three categories match FN-03 spec exactly.
- `agents/gsd-coherence-synthesizer.md:112-114` -- Confidence definitions: HIGH/MEDIUM/LOW with clear criteria.
  - Reasoning: Confidence vocabulary matches spec.
- `agents/gsd-coherence-synthesizer.md:116` -- `Ambiguous items default to category decision (safest). Contradictory finding pairs are excluded from resolution sequence and routed to Q&A as decision items.`
  - Reasoning: Safety defaults and contradiction routing match FN-03 behavior spec.
- `agents/gsd-coherence-synthesizer.md:136` -- `Section ordering is immutable (refinement-qa parsing contract)`
  - Reasoning: Q&A Agenda is the 7th and final section, enabling refinement-qa to parse it reliably.

**Spec-vs-reality gap:** None.

### EU-01: Synthesized coherence recommendations

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:73-77` -- Root Causes section uses `ROOT-{NNN}` IDs with `**Symptoms:** FINDING-001, FINDING-003...` pointers.
  - Reasoning: Root causes grouped with finding card ID pointers per EU-01 AC.
- `agents/gsd-coherence-synthesizer.md:79-81` -- Systemic Patterns section: "Cross-cutting patterns spanning multiple root causes. Each pattern: description + which ROOT-{NNN} IDs it connects."
  - Reasoning: Systemic patterns identified across findings, not just individual issues.
- `agents/gsd-coherence-synthesizer.md:88-92` -- Resolution Sequence with priority ordering by severity + goal impact.
  - Reasoning: Findings prioritized into resolution sequence aligned to project goals.
- `agents/gsd-coherence-synthesizer.md:93-96` -- Contradictions section with explicit table format.
  - Reasoning: Contradictions between recommendations explicitly surfaced.
- `agents/gsd-coherence-synthesizer.md:120-128` -- Zero-findings mode produces clean bill of health. Explicit instruction: "Do NOT invent issues."
  - Reasoning: Zero-findings case handled per EU-01 AC.
- `get-shit-done/workflows/coherence-report.md:142` -- `Next: Run refinement-qa to discuss recommendations with the user.`
  - Reasoning: RECOMMENDATIONS.md positioned as primary input to refinement-qa.

**Cross-layer observations:** The causal clustering instructions (agent lines 35-41) explicitly differentiate from topic grouping using fishbone/5-Whys reasoning. This is a quality-of-reasoning concern that cannot be verified statically but the instructions are present and specific.

**Spec-vs-reality gap:** None.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | `agents/gsd-coherence-synthesizer.md:4-7` -- tools: [], role_type: judge, reads/writes: []. Orchestrator assembles XML blocks at `workflows/coherence-report.md:63-91`. |
| TC-02 | met | `agents/gsd-coherence-synthesizer.md:50-54` -- blocks/risks/irrelevant categories, no numeric scores, skip when no validated requirements. |
| FN-01 | met | `workflows/coherence-report.md:17-55` -- loads all scan artifacts + project context including capability-list + graceful PROJECT.md handling. |
| FN-02 | met | `workflows/coherence-report.md:59-119` -- single agent invocation, 7-section output, writes via refinement-write route (confirmed at `refinement.cjs:246`). |
| FN-03 | met | `agents/gsd-coherence-synthesizer.md:98-116` -- Q&A table with #/Category/Topic/Resolution/Confidence columns, 3 category types, 3 confidence levels. |
| EU-01 | met | All 7 RECOMMENDATIONS.md sections specified, zero-findings mode at agent line 120-128, refinement-qa pointed to at orchestrator line 142. |

### Spec-vs-Reality Gaps

| Gap | Location | Explanation |
|-----|----------|-------------|
| Mode tag naming | 01-PLAN.md:67 vs agent:28 / orchestrator:91 | Plan interface said `<zero_findings_mode>` (boolean), implementation uses `<mode>` with "normal"/"zero-findings" strings. Agent and orchestrator are consistent with each other. String enum is cleaner than boolean for extensibility. No functional impact. |
