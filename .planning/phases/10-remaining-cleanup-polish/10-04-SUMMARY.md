---
phase: 10-remaining-cleanup-polish
plan: 04
subsystem: cli-tooling
tags: [gsd-tools, dead-code, cleanup]

requires:
  - phase: 10-01
    provides: dead v1 phase commands already removed
provides:
  - lean gsd-tools.cjs router with only live routes
  - lib modules containing only live handler functions
affects: [future-cli-work, install-packaging]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/bin/lib/commands.cjs
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/lib/state.cjs
    - get-shit-done/bin/lib/milestone.cjs
    - get-shit-done/bin/lib/verify.cjs
    - get-shit-done/bin/lib/template.cjs
    - get-shit-done/bin/lib/frontmatter.cjs
    - get-shit-done/bin/lib/phase.cjs

key-decisions:
  - "Kept FRONTMATTER_SCHEMAS constant even though cmdFrontmatterValidate removed -- still useful as documentation"
  - "Kept spliceFrontmatter export since it is used by state.cjs syncStateFrontmatter"

patterns-established: []

requirements-completed: [CLN-03]

duration: 9min
completed: 2026-03-01
---

# Phase 10 Plan 04: Remove Dead CLI Routes and Handler Functions Summary

**Removed 29 dead CLI routes from gsd-tools.cjs and 29 dead handler functions from 8 lib modules, deleting ~1750 lines of dead code**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-01T16:00:54Z
- **Completed:** 2026-03-01T16:10:15Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed 29+ dead routes from gsd-tools.cjs router (resolve-model, verify-summary, template select, frontmatter set/merge/validate, verify plan-structure/phase-completeness/references/commits, generate-slug, current-timestamp, verify-path-exists, config-ensure-section, history-digest, websearch, scaffold, validate consistency, phase add/insert/remove/next-decimal, milestone complete, init new-project/new-milestone/quick/verify-work/milestone-op/map-codebase, state resolve-blocker)
- Removed 29 dead handler functions across 8 lib modules
- Cleaned up unused require() imports (milestone.cjs no longer imports extractFrontmatter/writeStateMd; phase.cjs no longer imports generateSlugInternal)
- Net deletion of ~1750 lines of dead code

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead routes from gsd-tools.cjs router** - `9d02605` (feat)
2. **Task 2: Remove dead handler functions from lib modules** - `4530d4f` (feat)

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.cjs` - Router stripped to only live routes
- `get-shit-done/bin/lib/commands.cjs` - Removed 7 functions (cmdGenerateSlug, cmdCurrentTimestamp, cmdVerifyPathExists, cmdHistoryDigest, cmdResolveModel, cmdWebsearch, cmdScaffold)
- `get-shit-done/bin/lib/init.cjs` - Removed 6 functions (cmdInitNewProject, cmdInitNewMilestone, cmdInitQuick, cmdInitVerifyWork, cmdInitMilestoneOp, cmdInitMapCodebase)
- `get-shit-done/bin/lib/state.cjs` - Removed cmdStateResolveBlocker
- `get-shit-done/bin/lib/milestone.cjs` - Removed cmdMilestoneComplete and unused imports
- `get-shit-done/bin/lib/verify.cjs` - Removed 6 functions (cmdVerifySummary, cmdVerifyPlanStructure, cmdVerifyPhaseCompleteness, cmdVerifyReferences, cmdVerifyCommits, cmdValidateConsistency)
- `get-shit-done/bin/lib/template.cjs` - Removed cmdTemplateSelect
- `get-shit-done/bin/lib/frontmatter.cjs` - Removed cmdFrontmatterSet, cmdFrontmatterMerge, cmdFrontmatterValidate
- `get-shit-done/bin/lib/phase.cjs` - Removed cmdPhaseAdd, cmdPhaseInsert, cmdPhaseRemove, cmdPhaseNextDecimal

## Decisions Made
- Kept FRONTMATTER_SCHEMAS constant despite removing cmdFrontmatterValidate -- still serves as documentation reference
- Kept spliceFrontmatter and reconstructFrontmatter exports since they are used by state.cjs internally
- Accepted linter's removal of init phase-op/review-phase/doc-phase routes since their backing functions were already deleted in plan 10-01

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- gsd-tools.cjs is now lean with only live v2 routes
- Ready for further cleanup (dead code in core.cjs helpers, dead exports)

---
*Phase: 10-remaining-cleanup-polish*
*Completed: 2026-03-01*
