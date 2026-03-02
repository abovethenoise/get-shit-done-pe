---
phase: 06-workflows-and-commands
plan: 03
subsystem: workflows
tags: [framing-pipeline, escalation, lens-aware, pipeline-convergence, requirements-generation]

requires:
  - phase: 06-workflows-and-commands
    provides: framing-discovery workflow, 4 slash commands, init framing-discovery, anchor questions, framing-lenses.md
provides:
  - Post-discovery pipeline orchestration (6 stages with lens-aware context injection)
  - Universal 3-tier escalation protocol with per-stage severity rubric
  - Discovery-to-pipeline handoff step in framing-discovery workflow
affects: [06-04, 06-05]

tech-stack:
  added: []
  patterns:
    - "Pipeline passes paths not content -- each stage reads files with fresh context"
    - "3-input review model: requirements (contract) + lens metadata (disposition) + brief (intent)"
    - "Universal escalation: 3-tier severity at every stage boundary with 1 backward reset budget"

key-files:
  created:
    - get-shit-done/workflows/framing-pipeline.md
    - get-shit-done/references/escalation-protocol.md
  modified:
    - get-shit-done/workflows/framing-discovery.md

key-decisions:
  - "Requirements generation always produces all 3 layers (EU/FN/TC) with lens-specific weighting -- debug has thin EU rich TC, new has rich EU thin TC"
  - "Maximum 1 backward reset per pipeline run, then hard stop -- prevents infinite escalation loops"
  - "Major issues use propose-and-confirm pattern -- pipeline never auto-returns to upstream stage"

patterns-established:
  - "Lens-aware pipeline: same stages, different behavior shaped by lens metadata at each stage"
  - "Escalation signal format: [ESCALATION: {tier}] markers in stage output for orchestrator routing"

requirements-completed: [WKFL-06, WKFL-07]

duration: 3min
completed: 2026-02-28
---

# Phase 6 Plan 03: Pipeline Convergence Summary

**Post-discovery pipeline orchestrating 6 stages (research -> requirements -> plan -> execute -> review -> reflect) with lens-aware context injection and universal 3-tier escalation protocol**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T23:45:34Z
- **Completed:** 2026-02-28T23:48:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- framing-pipeline.md with 6 sequential stages, each receiving brief path + lens metadata as context
- Requirements generation step with lens-specific 3-layer weighting (EU/FN/TC distribution varies per lens)
- Review stage explicitly passes 3 inputs: requirements (contract), lens metadata (disposition), brief (intent)
- escalation-protocol.md with 3-tier model, 2-3 examples per tier per stage, loop termination rules
- framing-discovery.md updated with Step 10 pipeline handoff to framing-pipeline.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Create framing-pipeline workflow and update discovery handoff** - `38fb7a4` (feat)
2. **Task 2: Create escalation protocol reference document** - `117a29f` (feat)

## Files Created/Modified

- `get-shit-done/workflows/framing-pipeline.md` - 6-stage pipeline orchestration with lens-aware context injection, 3-input review, escalation handling
- `get-shit-done/references/escalation-protocol.md` - 3-tier escalation model with per-stage severity examples and loop termination rules
- `get-shit-done/workflows/framing-discovery.md` - Added Step 10 pipeline handoff passing brief path, lens, and capability context

## Decisions Made

- Requirements generation always produces all 3 layers (EU/FN/TC). Weight varies by lens: debug prioritizes technical depth, new prioritizes user stories, enhance balances functional contracts, refactor prioritizes structural migration detail.
- Maximum 1 backward reset per pipeline run. After exhaustion, user must choose: accept amendment, override, or stop pipeline. Prevents infinite escalation loops.
- Major issues use propose-and-confirm pattern. The pipeline never auto-returns to an upstream stage -- user must explicitly confirm the backward return. This avoids wasting time when the user has context that resolves the issue.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full discovery-to-documentation pipeline wired end-to-end
- Any framing command can now produce a brief and flow through all 6 stages
- Escalation protocol provides safety net at every stage boundary
- 06-04 (project initialization) and 06-05 (discussion commands) can reference the pipeline

## Self-Check: PASSED

- FOUND: get-shit-done/workflows/framing-pipeline.md
- FOUND: get-shit-done/references/escalation-protocol.md
- FOUND: get-shit-done/workflows/framing-discovery.md (modified)
- FOUND: .planning/phases/06-workflows-and-commands/06-03-SUMMARY.md
- FOUND: commit 38fb7a4 (Task 1)
- FOUND: commit 117a29f (Task 2)
- FOUND: commit 525b789 (metadata)

---
*Phase: 06-workflows-and-commands*
*Completed: 2026-02-28*
