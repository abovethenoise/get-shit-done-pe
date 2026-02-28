---
phase: 02-agent-framework
plan: "02"
subsystem: agent-framework
tags: [gather-synthesize, orchestration, parallel-agents, framing, context-layering]

requires:
  - phase: 02-agent-framework/02-01
    provides: agent definition patterns and context layering architecture that gather-synthesize builds on

provides:
  - Reusable gather-synthesize orchestration pattern (gather-synthesize.md)
  - Framing directory skeleton (debug, new, enhance, refactor)
  - 5-layer context assembly protocol
  - Failure handling spec: retry-once, manifest tracking, abort-if->50%-fail

affects:
  - 02-agent-framework (research agents use this pattern for 6-gatherer + 1-synthesizer flow)
  - 04-review (review phase reuses same pattern with different gatherers)
  - Any workflow needing parallel analysis + consolidation

tech-stack:
  added: []
  patterns:
    - "Gather-synthesize: spawn N agents in parallel, retry failures once, synthesize with partial-result tolerance"
    - "Context layering: Layer 0 (agent def) through Layer 4 (framing) injected at spawn time"
    - "Executor/Judge model split: gatherers=Sonnet, synthesizer=inherit/Opus"
    - "Framing convention: get-shit-done/framings/{framing}/{role}-questions.md"

key-files:
  created:
    - get-shit-done/workflows/gather-synthesize.md
    - get-shit-done/framings/debug/.gitkeep
    - get-shit-done/framings/new/.gitkeep
    - get-shit-done/framings/enhance/.gitkeep
    - get-shit-done/framings/refactor/.gitkeep
  modified: []

key-decisions:
  - "Gather-synthesize is a workflow pattern, not code — AI orchestrators follow it, it is not compiled"
  - "No quality gate between gatherers and synthesizer — synthesizer handles quality filtering (thin pipe)"
  - "Abort threshold fixed at >50% gatherer failures — symmetric with retry-once policy"
  - "Framing changes Layer 4 context and agent definitions, not the orchestration pattern itself"

patterns-established:
  - "Context assembly pattern: build payload before spawning, agents receive context not fetch it"
  - "Manifest pattern: track success/failed/partial per dimension before synthesis"
  - "Framing directory convention: framings/{framing}/{role}-questions.md"

requirements-completed: [AGNT-02, AGNT-03, RSRCH-03]

duration: 1min
completed: 2026-02-28
---

# Phase 2 Plan 02: Gather-Synthesize Workflow Summary

**Parameterized gather-synthesize orchestration pattern with 5-layer context assembly, retry-once failure handling, and framing directory skeleton for N-parallel-agent workflows**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T15:13:58Z
- **Completed:** 2026-02-28T15:15:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Gather-synthesize workflow fully documents the reusable parallelization primitive (parameterized for research, review, and any future parallel-analysis workflow)
- 5-layer context assembly protocol (Layer 0 agent def through Layer 4 framing) with explicit payload format for agent prompts
- Failure handling with retry-once, manifest tracking per dimension, and >50% abort threshold
- Framing directory skeleton (debug, new, enhance, refactor) establishing the location convention for Phase 6 content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gather-synthesize workflow** - `15124b0` (feat)
2. **Task 2: Create framing directory skeleton** - `e21ef3f` (chore)

## Files Created/Modified

- `get-shit-done/workflows/gather-synthesize.md` — Full gather-synthesize orchestration pattern: parameters, context assembly, parallel gather, failure handling, synthesis, completion
- `get-shit-done/framings/debug/.gitkeep` — Debug framing directory placeholder
- `get-shit-done/framings/new/.gitkeep` — New framing directory placeholder
- `get-shit-done/framings/enhance/.gitkeep` — Enhance framing directory placeholder
- `get-shit-done/framings/refactor/.gitkeep` — Refactor framing directory placeholder

## Decisions Made

- Workflow is framing-agnostic: framing changes Layer 4 context and agent definitions, the orchestration steps stay identical
- No quality gate between gatherers and synthesizer — thin pipe is intentional per CONTEXT.md
- Abort threshold set at >50% (more than half) to match the retry-once policy symmetrically

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gather-synthesize workflow ready for research agents (02-03) to reference when documenting how research orchestration works
- Framing directories ready for Phase 6 content (researcher-questions.md, reviewer-questions.md per framing)
- Any workflow can now reference gather-synthesize.md as the standard parallel-agent pattern

---
*Phase: 02-agent-framework*
*Completed: 2026-02-28*

## Self-Check: PASSED

- FOUND: get-shit-done/workflows/gather-synthesize.md
- FOUND: get-shit-done/framings/debug/.gitkeep
- FOUND: get-shit-done/framings/new/.gitkeep
- FOUND: get-shit-done/framings/enhance/.gitkeep
- FOUND: get-shit-done/framings/refactor/.gitkeep
- FOUND: commit 15124b0 (feat: gather-synthesize workflow)
- FOUND: commit e21ef3f (chore: framing directory skeleton)
