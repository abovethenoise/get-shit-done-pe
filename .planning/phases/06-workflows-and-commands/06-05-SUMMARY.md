---
phase: 06-workflows-and-commands
plan: 05
subsystem: workflows
tags: [discuss-capability, discuss-feature, fuzzy-resolution, backward-routing, kill-defer]

requires:
  - phase: 06-workflows-and-commands
    provides: init-project workflow and slash command (06-04)
  - phase: 01-foundation
    provides: capability-list, feature-list, capability data model
provides:
  - "/discuss-capability slash command with fuzzy resolution and cross-capability awareness"
  - "/discuss-feature slash command with backward routing to discuss-capability or replan"
  - "cmdInitDiscussCapability and cmdInitDiscussFeature init functions"
affects: [framing-discovery, planning, requirements]

tech-stack:
  added: []
  patterns: [fuzzy substring resolution at workflow level, backward routing between discussion levels, kill/defer with persisted reasoning]

key-files:
  created:
    - get-shit-done/workflows/discuss-capability.md
    - get-shit-done/workflows/discuss-feature.md
    - commands/gsd/discuss-capability.md
    - commands/gsd/discuss-feature.md
  modified:
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/gsd-tools.cjs

key-decisions:
  - "Fuzzy resolution implemented at workflow level using capability-list/feature-list output, not in gsd-tools"
  - "discuss-feature backward routing offers three options: route to discuss-capability, route to replan, or continue"
  - "Capability file enrichment writes to .documentation/capabilities/ per RESEARCH.md conflict resolution"

patterns-established:
  - "Discussion workflows as optional thinking partners upstream of pipeline stages"
  - "Kill/defer with persisted reasoning in artifact files"
  - "Backward routing pattern: feature-level discussion can escalate to capability-level"

requirements-completed: [INIT-03]

duration: 5min
completed: 2026-02-28
---

# Phase 6 Plan 5: Discussion Commands Summary

**discuss-capability and discuss-feature commands with fuzzy resolution, cross-capability awareness, backward routing, and kill/defer capability**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T23:37:43Z
- **Completed:** 2026-02-28T23:42:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- discuss-capability workflow with fuzzy resolve, status check, guided Q&A, cross-capability awareness, and kill/defer
- discuss-feature workflow with fuzzy resolve, backward routing (to discuss-capability or replan), and feature-level exploration
- Both slash commands with correct frontmatter and workflow references
- cmdInitDiscussCapability and cmdInitDiscussFeature init functions with capability/feature inventory for fuzzy matching

## Task Commits

Each task was committed atomically:

1. **Task 1: Create discuss-capability workflow, slash command, and init functions** - `221f9b7` (feat)
2. **Task 2: Create discuss-feature workflow and slash command with backward routing** - `8751962` (feat)

## Files Created/Modified
- `get-shit-done/workflows/discuss-capability.md` - Workflow: fuzzy resolve, status check, guided WHAT/WHY exploration, cross-capability awareness, kill/defer
- `get-shit-done/workflows/discuss-feature.md` - Workflow: fuzzy resolve, guided HOW exploration, backward routing, kill/defer
- `commands/gsd/discuss-capability.md` - Slash command for /gsd:discuss-capability
- `commands/gsd/discuss-feature.md` - Slash command for /gsd:discuss-feature
- `get-shit-done/bin/lib/init.cjs` - cmdInitDiscussCapability (capability list + doc paths) and cmdInitDiscussFeature (capability+feature lists)
- `get-shit-done/bin/gsd-tools.cjs` - Dispatcher cases for init discuss-capability and init discuss-feature

## Decisions Made
- Fuzzy resolution at workflow level using capability-list/feature-list JSON output (not in gsd-tools per RESEARCH.md constraint that findCapabilityInternal is exact slug only)
- discuss-feature backward routing provides three explicit options (discuss-capability, replan, continue) rather than auto-detecting
- Capability file enrichment targets .documentation/capabilities/ per RESEARCH.md conflict resolution (.planning/capabilities/ is the working artifact store)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both discussion commands ready as optional thinking partners upstream of framing workflows
- discuss-capability enriches capability files that framing commands check before discovery
- discuss-feature feeds into requirements files consumed by the pipeline
- Init functions provide capability/feature inventories for fuzzy matching

---
*Phase: 06-workflows-and-commands*
*Completed: 2026-02-28*
