---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: coherence-report.md

## Purpose: [derived]

Orchestrate the coherence synthesis stage: validate scan artifacts exist, load scan output and project context, assemble a single XML prompt, spawn the gsd-coherence-synthesizer agent, and write RECOMMENDATIONS.md. Located at `get-shit-done/workflows/coherence-report.md`.

Second stage of the requirements-refinement pipeline. Consumes landscape-scan output, produces recommendations consumed by refinement-qa.

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** None (operates on `.planning/refinement/` scan artifacts and project context files)
- **CLI commands invoked:**
  - `gsd-tools capability-list` -- enumerate all capability slugs
  - `gsd-tools refinement-write --type recommendations --content-file {tmp}` -- write RECOMMENDATIONS.md
- **Steps:**
  1. Validate scan artifacts (matrix.md required, dependency-graph.md optional, findings/ required)
  2. Load scan artifacts (matrix, dependency graph, all findings; set MODE)
  3. Load project context (PROJECT.md, ROADMAP.md, STATE.md, all CAPABILITY.md)
  4. Assemble XML prompt (5 blocks: project_context, scan_artifacts, findings, capabilities, mode)
  5. Spawn gsd-coherence-synthesizer (single invocation, returns content directly)
  6. Write RECOMMENDATIONS.md via refinement-write CLI route (fallback: direct Write)
- **Agent delegation:** Single invocation of `agents/gsd-coherence-synthesizer.md`. Agent has `tools: []` -- all context passed inline, not via file paths.
- **Outputs:** `.planning/refinement/RECOMMENDATIONS.md`

## Depends-on: [derived]

- `agents/gsd-coherence-synthesizer.md` -- zero-tool judge agent that produces the 7-section RECOMMENDATIONS.md
- `gsd-tools.cjs` -- CLI tool for capability-list and refinement-write routes
- `bin/lib/refinement.cjs` -- Implementation of refinement-write command

## Constraints: [authored]

- Agent receives content not paths (tools: [] means it cannot read files).
- dependency-graph.md is optional -- scan may produce zero dependencies.
- Zero-findings mode detected at orchestrator level by counting FINDING-*.md files, not by agent judgment.
- Single agent invocation produces all 7 sections; no staged pipeline within this workflow.
