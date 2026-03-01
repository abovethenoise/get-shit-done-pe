---
phase: 09-structure-integration
plan: 01
subsystem: infra
tags: [cleanup, commands, hooks, slash-commands, dead-code]

# Dependency graph
requires:
  - phase: 08-low-risk-cleanup
    provides: "Identified orphaned commands and stale references"
provides:
  - "Clean command surface with only v2 commands"
  - "All workflow/agent references use valid v2 slash-commands"
  - "Context-monitor hook with generic STATE.md save instructions"
affects: [09-structure-integration, 10-prose-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Generic hook messages that don't depend on specific commands"]

key-files:
  created: []
  modified:
    - "get-shit-done/workflows/plan-phase.md"
    - "get-shit-done/workflows/transition.md"
    - "get-shit-done/workflows/progress.md"
    - "get-shit-done/workflows/resume-work.md"
    - "get-shit-done/workflows/execute-plan.md"
    - "get-shit-done/workflows/execute-phase.md"
    - "get-shit-done/workflows/research-phase.md"
    - "agents/gsd-plan-checker.md"
    - "agents/gsd-planner.md"
    - "agents/gsd-phase-researcher.md"
    - "commands/gsd/execute-phase.md"
    - "commands/gsd/plan-phase.md"
    - "commands/gsd/research-phase.md"
    - "hooks/gsd-context-monitor.js"

key-decisions:
  - "Replace /gsd:discuss-phase with /gsd:discuss-capability (closest v2 equivalent for phase-level discussion)"
  - "Replace /gsd:verify-work with /gsd:review-phase (v2 review command)"
  - "Replace /gsd:complete-milestone and /gsd:new-milestone with /gsd:progress and /gsd:new respectively"
  - "Context-monitor hook uses generic STATE.md language instead of command refs for future resilience"

patterns-established:
  - "Hook messages reference STATE.md generically, not specific commands"

requirements-completed: [INTG-02, DIR-03]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 9 Plan 01: Delete Orphaned Commands and Fix Stale References Summary

**Deleted 7 orphaned command files and replaced all stale slash-command references across 13 workflows, agents, and hooks with v2 equivalents**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T13:52:34Z
- **Completed:** 2026-03-01T13:56:04Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Deleted 7 orphaned command files (discuss-phase, help, map-codebase, new-milestone, pause-work, quick, verify-work)
- Replaced all /gsd:discuss-phase references with /gsd:discuss-capability across workflows and agents
- Replaced all /gsd:verify-work references with /gsd:review-phase
- Replaced /gsd:complete-milestone and /gsd:new-milestone with v2 equivalents
- Removed /gsd:add-phase reference from execute-plan milestone route
- Fixed context-monitor hook to use generic STATE.md save language
- Verified statusline hook has zero GSD-model coupling

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete orphaned commands and fix broken slash-command references** - `72681cd` (fix)
2. **Task 2: Fix hooks stale references and verify hook effectiveness** - `4487604` (fix)

## Files Created/Modified
- `commands/gsd/discuss-phase.md` - DELETED
- `commands/gsd/help.md` - DELETED
- `commands/gsd/map-codebase.md` - DELETED
- `commands/gsd/new-milestone.md` - DELETED
- `commands/gsd/pause-work.md` - DELETED
- `commands/gsd/quick.md` - DELETED
- `commands/gsd/verify-work.md` - DELETED
- `get-shit-done/workflows/plan-phase.md` - discuss-phase -> discuss-capability
- `get-shit-done/workflows/transition.md` - discuss-phase -> discuss-capability, complete-milestone -> progress
- `get-shit-done/workflows/progress.md` - discuss-phase, verify-work, complete-milestone, new-milestone replaced
- `get-shit-done/workflows/resume-work.md` - discuss-phase -> discuss-capability
- `get-shit-done/workflows/execute-plan.md` - verify-work, discuss-phase, complete-milestone, add-phase replaced
- `get-shit-done/workflows/execute-phase.md` - verify-work -> review-phase
- `get-shit-done/workflows/research-phase.md` - discuss-phase -> discuss-capability
- `agents/gsd-plan-checker.md` - discuss-phase -> discuss-capability
- `agents/gsd-planner.md` - discuss-phase -> discuss-capability
- `agents/gsd-phase-researcher.md` - discuss-phase -> discuss-capability, verify-work -> review-phase
- `commands/gsd/execute-phase.md` - verify-work -> review-phase
- `commands/gsd/plan-phase.md` - discuss-phase -> discuss-capability
- `commands/gsd/research-phase.md` - discuss-phase -> discuss-capability
- `hooks/gsd-context-monitor.js` - pause-work -> generic STATE.md language

## Decisions Made
- Used /gsd:discuss-capability as the v2 replacement for /gsd:discuss-phase (phase-level discussion maps to capability discussion)
- Used /gsd:review-phase as the v2 replacement for /gsd:verify-work (review command)
- Used /gsd:progress as replacement for /gsd:complete-milestone (progress tracks milestone status)
- Used /gsd:new as replacement for /gsd:new-milestone (new project/milestone command)
- Context-monitor hook messages use generic "update STATE.md" language instead of any specific command reference, making the hook resilient to future command changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed stale refs in command files**
- **Found during:** Task 1 (verification step)
- **Issue:** commands/gsd/research-phase.md, plan-phase.md, and execute-phase.md also contained stale references not listed in the plan
- **Fix:** Updated all three command files with v2 equivalents
- **Files modified:** commands/gsd/research-phase.md, commands/gsd/plan-phase.md, commands/gsd/execute-phase.md
- **Verification:** grep confirms zero stale refs in commands/gsd/
- **Committed in:** 72681cd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (missing critical -- surviving command files had stale refs)
**Impact on plan:** Essential fix. Plan listed files_modified for these commands but didn't enumerate the specific refs in the action steps.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Command surface clean: only v2 commands remain
- All workflow/agent cross-references use valid v2 commands
- Hooks verified working with no stale references
- Ready for Plan 02 (workflow consolidation) and Plan 03 (directory model)

---
*Phase: 09-structure-integration*
*Completed: 2026-03-01*
