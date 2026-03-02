---
phase: 12-workflow-optimization-wiring
plan: 07
subsystem: cli-tooling
tags: [dead-code-removal, v1-cleanup, phase-deletion, code-hygiene]

requires:
  - phase: 12-01
    provides: v2 init calls in execute/plan workflows
  - phase: 12-02
    provides: v2 init calls in review/doc workflows
  - phase: 12-05
    provides: v2 rewritten agents (no phase.cjs callers remain)
  - phase: 12-09
    provides: condensed v2 workflows (no v1 init callers)
provides:
  - phase.cjs deleted (entire v1 phase CRUD module)
  - Dead CLI routes removed from gsd-tools.cjs router
  - Dead init functions removed from init.cjs
  - v1 config defaults removed from core.cjs and config.cjs
  - Dead v1 template files deleted
affects: [cli-tooling, install-pipeline, e2e-testing]

tech-stack:
  added: []
  patterns: [v2-only-router, clean-exports]

key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/lib/core.cjs
    - get-shit-done/bin/lib/config.cjs
    - get-shit-done/bin/lib/state.cjs
  deleted:
    - get-shit-done/bin/lib/phase.cjs
    - get-shit-done/templates/phase-prompt.md
    - get-shit-done/templates/planner-subagent-prompt.md

key-decisions:
  - "phase.cjs fully deleted -- all 8 functions dead after v2 agent rewrites"
  - "cmdInitExecutePhase and cmdInitProgress deleted -- replaced by v2 cmdInitExecuteFeature and cmdInitFeatureProgress"
  - "cmdStateAdvancePlan and cmdStateRecordMetric kept -- still called by v2 execute-plan.md"
  - "roadmap routes kept -- still called by v2 workflows and reference docs"
  - "v1 config defaults (phase_branch_template, milestone_branch_template) removed from core.cjs and config.cjs"
  - "18 dead workflow files and 16 dead command files already removed in earlier phases (not re-counted)"

requirements-completed: [CMD-01]

duration: 9min
completed: 2026-03-02
---

# Phase 12 Plan 07: Dead V1 Code Removal Summary

**Deleted phase.cjs (420 lines), 2 dead init functions (169 lines), dead CLI routes, v1 config defaults, and 2 dead template files (674 lines) -- 1,388 lines total removed**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-02T15:10:35Z
- **Completed:** 2026-03-02T15:19:40Z
- **Tasks:** 2
- **Files modified:** 8 (6 edited, 2 deleted)

## Accomplishments
- Deleted phase.cjs entirely (8 v1 functions, 420 lines)
- Removed 5 dead CLI routes from gsd-tools.cjs (find-phase, phases, phase, phase-plan-index, init execute-phase, init progress)
- Deleted cmdInitExecutePhase and cmdInitProgress from init.cjs (169 lines)
- Removed v1 config defaults (phase_branch_template, milestone_branch_template) from core.cjs and config.cjs
- Deleted 2 dead v1 template files (phase-prompt.md, planner-subagent-prompt.md, 674 lines)
- Updated gsd-tools.cjs header comment to document only v2 routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete dead workflow files, command files, templates, and references** - `47e3fac` (chore)
2. **Task 2: Remove dead CLI routes and lib functions** - `89e3876` (chore)

## Files Created/Modified
- `get-shit-done/bin/lib/phase.cjs` - DELETED (entire v1 phase CRUD module)
- `get-shit-done/templates/phase-prompt.md` - DELETED (v1 plan template)
- `get-shit-done/templates/planner-subagent-prompt.md` - DELETED (v1 planner spawn template)
- `get-shit-done/bin/gsd-tools.cjs` - Removed dead routes, updated header and error messages
- `get-shit-done/bin/lib/init.cjs` - Deleted cmdInitExecutePhase, cmdInitProgress, cleaned imports/exports
- `get-shit-done/bin/lib/core.cjs` - Deleted getArchivedPhaseDirs, removed v1 config defaults
- `get-shit-done/bin/lib/config.cjs` - Removed v1 branch template defaults
- `get-shit-done/bin/lib/state.cjs` - Removed v1 branch template fields from raw output

## Decisions Made
- cmdStateAdvancePlan and cmdStateRecordMetric kept (still called by v2 execute-plan.md and executor-reference.md)
- roadmap routes (get-phase, analyze, update-plan-progress) kept (called by v2 progress.md, execute-plan.md, verifier-reference.md)
- 18 dead workflow files and 16 dead command files were already removed from the git repo in Phase 10; only exist in deployed ~/.claude/ directory
- Dead templates (milestone-archive.md, milestone.md, retrospective.md) already removed in Phase 10
- Dead references (phase-argument-parsing.md, decimal-phase-calculation.md) already removed in Phase 10
- discovery.md kept (updated in Plan 06, not dead)
- execute-plan.md kept (rewritten to v2 in Plan 01, not dead)

## Deviations from Plan

### Scope Adjustment

The plan estimated ~10,500 lines of dead code removal. The actual deletion was ~1,388 lines because:
1. Most dead workflow files (18) and command files (16) were already removed from the git repo in Phase 10
2. milestone.cjs dead functions (cmdMilestoneComplete) already deleted in Phase 10
3. verify.cjs dead functions (cmdVerifyPhaseCompleteness, cmdValidateConsistency) already deleted in Phase 10
4. cmdStateAdvancePlan and cmdStateRecordMetric are NOT dead (still called by v2 execute-plan.md)
5. core.cjs helpers (normalizePhaseName, comparePhaseNum, searchPhaseInDir, findPhaseInternal) still used by roadmap.cjs, template.cjs, and commands.cjs

This is not a failure -- the earlier phases did more cleanup than the research document captured. The plan's line count was based on pre-Phase-10 state.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- gsd-tools.cjs router contains only v2 routes plus still-needed state progression commands
- Clean break achieved for Phase 13 E2E testing
- Remaining v1 artifacts: core.cjs phase helpers (still serving roadmap/template), state.cjs frontmatter v1 fields (serving context-monitor hook)

## Self-Check: PASSED

- phase.cjs: DELETED (verified)
- phase-prompt.md: DELETED (verified)
- planner-subagent-prompt.md: DELETED (verified)
- Commit 47e3fac: FOUND
- Commit 89e3876: FOUND

---
*Phase: 12-workflow-optimization-wiring*
*Completed: 2026-03-02*
