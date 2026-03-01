---
phase: 08-low-risk-cleanup
plan: 02
subsystem: workflows
tags: [cleanup, dead-code-removal, workflow-surface]

# Dependency graph
requires:
  - phase: 08-01
    provides: Dead commands removed, cleaner baseline for workflow scan
provides:
  - 21 orphaned workflows removed from get-shit-done/workflows/
  - Clean 16-workflow surface with only active v2 reference chains
affects: [10-template-and-reference-audit, 12-install-and-validate]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - get-shit-done/workflows/ (21 files deleted)

key-decisions:
  - "Slash-command references (/gsd:discuss-phase, /gsd:verify-work, etc.) in surviving workflows and agents left intact -- Phase 10 audit scope, consistent with 08-01 decision"
  - "7 Phase-10-flagged commands still contain @file refs to deleted workflows -- these commands are dead chains scheduled for Phase 10 cleanup"

patterns-established: []

requirements-completed: [CLN-01]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 8 Plan 02: Delete Orphaned Workflows Summary

**Removed 21 orphaned v1 workflows (dead command backing files, superseded patterns), leaving clean 16-workflow v2 surface**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T12:15:05Z
- **Completed:** 2026-03-01T12:16:43Z
- **Tasks:** 1
- **Files modified:** 21 (deleted)

## Accomplishments
- Deleted all 21 verified-orphaned workflows from get-shit-done/workflows/
- Confirmed zero @file references to deleted workflows in surviving workflows or agents
- All 16 surviving workflows verified intact and untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Dependency trace then delete 21 orphaned workflows** - `246c18c` (chore)

## Files Created/Modified
- `get-shit-done/workflows/add-phase.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/add-tests.md` - Deleted (TDD removed)
- `get-shit-done/workflows/audit-milestone.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/cleanup.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/complete-milestone.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/diagnose-issues.md` - Deleted (dead verify-work chain)
- `get-shit-done/workflows/discuss-phase.md` - Deleted (superseded by discuss-capability/feature)
- `get-shit-done/workflows/help.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/insert-phase.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/list-phase-assumptions.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/map-codebase.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/new-milestone.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/new-project.md` - Deleted (superseded by init-project.md)
- `get-shit-done/workflows/pause-work.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/plan-milestone-gaps.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/quick.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/remove-phase.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/set-profile.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/settings.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/update.md` - Deleted (dead command's workflow)
- `get-shit-done/workflows/verify-work.md` - Deleted (dead command's workflow)

## Decisions Made
- Slash-command text references (`/gsd:discuss-phase`, `/gsd:verify-work`, `/gsd:new-milestone`, `/gsd:map-codebase`) in surviving workflows/agents left intact. These are prose references to slash commands, not @file references to the deleted workflow files. Phase 10 audit scope.
- 7 Phase-10-flagged commands (discuss-phase, help, map-codebase, new-milestone, pause-work, quick, verify-work) retain @file references to now-deleted workflows. These commands are themselves dead chains flagged for Phase 10 resolution per 08-RESEARCH.md.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- get-shit-done/workflows/ is clean with 16 active v2 workflows
- Phase 10 audit will resolve slash-command text references and dead-chain commands
- Ready for Plan 03 (agent deletions)

---
*Phase: 08-low-risk-cleanup*
*Completed: 2026-03-01*
