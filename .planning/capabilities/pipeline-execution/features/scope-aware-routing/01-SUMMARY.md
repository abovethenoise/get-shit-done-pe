---
plan: "01"
subsystem: pipeline-execution
tags: [slug-resolve, routing, capability-orchestrator, framing-discovery, lens-commands]

# Dependency graph
requires: []
provides:
  - 3-step slug-resolve routing pattern in enhance.md, debug.md, refactor.md
  - capability branch: slug type=capability -> capability-orchestrator with LENS
  - feature branch: slug type=feature -> framing-discovery (preserved from original)
  - ambiguous branch: AskUserQuestion with candidate list
  - no_match branch: error + /gsd:status suggestion (no create-new offer)
affects: [scope-aware-routing plan 02, any future lens commands added to GSD]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline routing per-command (no shared abstraction), slug-resolve -> type check -> branch]

key-files:
  created: []
  modified:
    - commands/gsd/enhance.md
    - commands/gsd/debug.md
    - commands/gsd/refactor.md

key-decisions:
  - "no_match for lens commands errors + suggests /gsd:status, does NOT offer create-new (unlike execute.md)"
  - "capability-orchestrator.md added to execution_context alongside framing-discovery.md in all 3 commands"
  - "Routing replaces the <process> block entirely rather than prepending to it"

patterns-established:
  - "Lens command routing pattern: 3-step (slug-resolve / handle-result / workflow-invocation) mirrors execute.md"
  - "no_match behavior is lens-specific: new->create flow, enhance/debug/refactor->error+status"

requirements-completed: [EU-01, FN-01, FN-04, TC-01]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Plan Summary: Routing branch for enhance, debug, refactor

**3-step slug-resolve routing added to enhance.md, debug.md, refactor.md -- capability slugs fan out via capability-orchestrator, feature slugs route to framing-discovery as before**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T22:47:08Z
- **Completed:** 2026-03-04T22:49:16Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- All three lens commands now resolve slugs via gsd-tools slug-resolve before dispatching
- Capability-level input routes to capability-orchestrator with the correct LENS value, enabling fan-out across all features in DAG wave order
- Feature-level input preserves the existing framing-discovery delegation with all workflow gates intact
- Ambiguous slugs present candidates via AskUserQuestion; no_match errors and suggests /gsd:status (no create-new offer, consistent with RESEARCH.md AC-09)

## Task Commits

Each task was committed atomically:

1. **Task 1: update-enhance-routing** - `b610399` (feat)
2. **Task 2: update-debug-routing** - `d0db6ae` (feat)
3. **Task 3: update-refactor-routing** - `243fcbd` (feat)

## Files Created/Modified
- `commands/gsd/enhance.md` - Replaced single-line process block with 3-step routing; added capability-orchestrator to execution_context
- `commands/gsd/debug.md` - Same pattern with LENS=debug
- `commands/gsd/refactor.md` - Same pattern with LENS=refactor

## Decisions Made
- no_match for enhance/debug/refactor stops with error + /gsd:status suggestion rather than offering create-new (execute.md's behavior). This matches RESEARCH.md consensus finding on lens-specific no_match behavior.
- Routing replaces the `<process>` block wholesale (not prepended) -- cleaner than inserting a preamble before the old delegation line.

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Steps
- Plan 01 delivers routing for enhance/debug/refactor. Plan 02 (if exists) covers /gsd:new disambiguation and fan-out offer.
- All 3 commands are now capability-aware and can orchestrate multi-feature lens runs.

---
*Completed: 2026-03-04*
