---
phase: 06-workflows-and-commands
plan: 02
subsystem: workflows
tags: [framing, discovery, slash-commands, mvu, lens-pivot, fuzzy-resolution]

requires:
  - phase: 06-workflows-and-commands
    provides: Discovery Brief template, anchor questions, framing-lenses.md reference, fillTemplate() discovery-brief case
provides:
  - Shared framing-discovery workflow with fuzzy resolution, MVU tracking, lens pivot, summary playback
  - cmdInitFramingDiscovery init command returning lens context, capability list, MVU slots
  - 4 framing slash commands (/debug, /new, /enhance, /refactor) as discovery entry points
affects: [06-03, 06-05]

tech-stack:
  added: []
  patterns:
    - "Shared workflow pattern: 4 entry-point commands delegate to 1 workflow with lens parameter"
    - "Per-field MVU tracking with named slot state (filled/unfilled per slot)"
    - "Fuzzy capability resolution via substring matching on capability-list output"

key-files:
  created:
    - get-shit-done/workflows/framing-discovery.md
    - commands/gsd/new.md
    - commands/gsd/enhance.md
    - commands/gsd/refactor.md
  modified:
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/gsd-tools.cjs
    - commands/gsd/debug.md

key-decisions:
  - "v1 debug.md replaced entirely with v2 framing entry point -- no backward compatibility needed since v1 was never released"
  - "Fuzzy resolution implemented in workflow markdown using capability-list output, not in gsd-tools -- keeps resolution logic with the orchestrator"
  - "All 4 slash commands share identical structure: frontmatter + lens identifier + delegation to framing-discovery.md"

patterns-established:
  - "Framing command pattern: YAML frontmatter with lens-specific description, execution_context referencing shared workflow, context passing lens identifier"
  - "Init compound command pattern for discovery: returns lens metadata, MVU slots, file paths, and full capability list for workflow-level fuzzy matching"

requirements-completed: [WKFL-01, WKFL-02, WKFL-03, WKFL-04, WKFL-05]

duration: 3min
completed: 2026-02-28
---

# Phase 6 Plan 02: Framing Commands and Discovery Workflow Summary

**Shared framing-discovery workflow with per-field MVU tracking, lens misclassification detection, and 4 entry-point slash commands (/debug, /new, /enhance, /refactor) delegating to the shared engine**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T23:37:43Z
- **Completed:** 2026-02-28T23:40:43Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Shared framing-discovery workflow (9-step flow: init -> fuzzy resolve -> status check -> scaffold brief -> misclassification check -> load questions -> Q&A with MVU tracking -> summary playback -> finalize brief)
- cmdInitFramingDiscovery returning lens, MVU slots, anchor question paths, capability list for fuzzy resolution, capability status, and brief path
- 4 slash commands each passing their lens identifier to the shared workflow (debug=detective, new=architect, enhance=editor, refactor=surgeon)
- v1 debug.md replaced with v2 framing entry point

## Task Commits

Each task was committed atomically:

1. **Task 1: Create framing-discovery workflow and init command** - `547f873` (feat)
2. **Task 2: Create 4 framing slash commands** - `64c221f` (feat)

## Files Created/Modified

- `get-shit-done/workflows/framing-discovery.md` - 9-step shared discovery workflow with fuzzy resolution, MVU tracking, lens pivot, summary playback
- `get-shit-done/bin/lib/init.cjs` - cmdInitFramingDiscovery function returning lens context, capability list, MVU slots, file paths
- `get-shit-done/bin/gsd-tools.cjs` - Dispatcher case for init framing-discovery
- `commands/gsd/debug.md` - v2 detective-mode entry point (replaced v1)
- `commands/gsd/new.md` - Architect-mode entry point
- `commands/gsd/enhance.md` - Editor-mode entry point
- `commands/gsd/refactor.md` - Surgeon-mode entry point

## Decisions Made

- Replaced v1 debug.md entirely rather than extending it. The v2 framing system is architecturally different (shared workflow delegation vs standalone process), so extending was not viable.
- Fuzzy resolution logic lives in the workflow markdown, not in gsd-tools. This follows the RESEARCH.md recommendation that fuzzy resolution is workflow-level using capability-list output, keeping the orchestrator in control of user interaction.
- All 4 slash commands share identical structure with only the lens identifier and description varying. This keeps the commands thin and the workflow as the single source of discovery logic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 framing entry points ready to invoke the discovery workflow
- Discovery workflow ready to produce Discovery Briefs at .planning/capabilities/{slug}/BRIEF.md
- Pipeline convergence (06-03) can wire discovery output to requirements generation
- cmdInitFramingDiscovery provides all context needed for workflow bootstrap

---
*Phase: 06-workflows-and-commands*
*Completed: 2026-02-28*
