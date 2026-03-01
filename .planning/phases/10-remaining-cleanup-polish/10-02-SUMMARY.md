---
phase: 10-remaining-cleanup-polish
plan: 02
subsystem: infra
tags: [cleanup, templates, references, v1-removal]

requires:
  - phase: 10-remaining-cleanup-polish
    provides: "10-01 deleted phase command wrappers, clearing way for template/ref cleanup"
provides:
  - "8 stale v1 templates removed (milestone lifecycle + research-project pipeline)"
  - "5 dead v1 reference docs removed (zero v2 callers)"
  - "requirements.md updated to reference discovery brief instead of deleted FEATURES.md"
affects: [10-remaining-cleanup-polish]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - get-shit-done/templates/requirements.md

key-decisions:
  - "Template deletions already handled in 10-01 commit; Task 1 commit captured requirements.md update plus straggling workflow deletions"

patterns-established: []

requirements-completed: [CLN-04, CLN-05]

duration: 3min
completed: 2026-03-01
---

# Phase 10 Plan 02: Delete Stale Templates and Dead References Summary

**Removed 13 dead v1 files (8 templates + 5 reference docs) with zero v2 callers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T15:56:00Z
- **Completed:** 2026-03-01T15:59:00Z
- **Tasks:** 2
- **Files modified:** 14 (13 deleted + 1 updated)

## Accomplishments
- Deleted milestone.md, milestone-archive.md, retrospective.md (v1 milestone lifecycle)
- Deleted entire research-project/ directory (5 files, replaced by gatherer pipeline)
- Deleted 5 reference docs with zero v2 workflow consumers
- Updated requirements.md to use discovery brief guidance instead of deleted FEATURES.md reference

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete stale v1 templates** - `bdd8b50` (chore)
2. **Task 2: Delete dead reference docs** - `81842fe` (chore)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `get-shit-done/templates/requirements.md` - Updated FEATURES.md reference to discovery brief guidance
- `get-shit-done/templates/milestone.md` - Deleted (v1 milestone entry)
- `get-shit-done/templates/milestone-archive.md` - Deleted (v1 milestone archive)
- `get-shit-done/templates/retrospective.md` - Deleted (v1 retrospective)
- `get-shit-done/templates/research-project/` - Deleted entire directory (5 files)
- `get-shit-done/references/planning-config.md` - Deleted (schema in core.cjs)
- `get-shit-done/references/decimal-phase-calculation.md` - Deleted (v1-only concept)
- `get-shit-done/references/git-planning-commit.md` - Deleted (covered by git-integration.md)
- `get-shit-done/references/verification-patterns.md` - Deleted (caller deleted in 10-01)
- `get-shit-done/references/phase-argument-parsing.md` - Deleted (caller deleted in 10-01)

## Decisions Made
- Template deletions were partially captured in 10-01 commit due to prior staging; Task 1 commit focused on requirements.md update and remaining workflow deletions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Template and reference directories cleaned of v1 artifacts
- Ready for remaining cleanup plans (10-03 through 10-08)

---
*Phase: 10-remaining-cleanup-polish*
*Completed: 2026-03-01*
