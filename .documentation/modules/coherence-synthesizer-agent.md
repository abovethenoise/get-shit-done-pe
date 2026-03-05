---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: gsd-coherence-synthesizer.md

## Purpose: [derived]

Zero-tool judge agent that transforms raw landscape scan findings into a structured RECOMMENDATIONS.md document. Performs causal clustering, contradiction detection, goal alignment, and Q&A agenda generation. Located at `agents/gsd-coherence-synthesizer.md`.

Receives all input as inline content in the prompt. Produces output as direct text (no file I/O).

## Exports: [derived]

This is an agent definition. It exposes the following interface:

- **Role type:** `judge`
- **Tools:** `[]` (zero tools -- receives content, not paths)
- **Reads:** `[]` (all content provided by orchestrator)
- **Writes:** `[]` (output captured by orchestrator)
- **Input format:** 5 XML blocks provided by the coherence-report orchestrator:
  - `<project_context>` -- PROJECT.md, ROADMAP.md, STATE.md
  - `<scan_artifacts>` -- matrix.md, dependency-graph.md
  - `<findings>` -- all FINDING-{NNN}.md contents (or "No findings detected.")
  - `<capabilities>` -- all CAPABILITY.md contents
  - `<mode>` -- "normal" or "zero-findings"
- **Output format:** 7 fixed sections in immutable order (parsing contract with refinement-qa):
  1. Executive Summary -- finding counts by severity, key themes, coherence assessment
  2. Root Causes -- ROOT-{NNN} clusters with symptoms, analysis, recommendation
  3. Systemic Patterns -- cross-cutting patterns spanning multiple root causes
  4. Goal Alignment -- table mapping root causes to blocks/risks/irrelevant requirements (skipped if no validated requirements)
  5. Resolution Sequence -- prioritized action table (severity + goal alignment + dependency impact)
  6. Contradictions -- conflicting recommendation pairs (explicit recall note: ~45% baseline)
  7. Q&A Agenda -- categorized items (decision/informational/auto-resolve) with confidence levels

## Depends-on: [derived]

- `get-shit-done/workflows/coherence-report.md` -- orchestrator that spawns this agent and provides input

## Constraints: [authored]

- Section ordering is immutable -- refinement-qa parses the Q&A Agenda table by heading anchor.
- Every finding ID referenced must exist in input; every root cause must reference at least one finding.
- Contradictory finding pairs excluded from resolution sequence, routed to Q&A as `decision` category.
- Ambiguous items default to `decision` category (safest -- ensures user review).
- Zero-findings mode: agent must not invent issues; produces minimal report confirming clean coherence.
- Goal alignment skipped entirely when no validated requirements exist in PROJECT.md.
- No numeric scoring (WSJF/RICE) -- categorical assessment only (blocks/risks/irrelevant).
