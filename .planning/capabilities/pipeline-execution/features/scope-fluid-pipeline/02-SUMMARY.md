---
plan: 02
subsystem: workflows
tags: [progress, routing, focus-groups, pipeline-state]

# Dependency graph
requires:
  - plan: 01
    provides: "Consolidated framing-pipeline.md with scope-detection and 4-stage flow"
provides:
  - "Focus-aware 3-tier routing in progress.md (focus groups -> recent work -> state scan)"
  - "Artifact-based pipeline state detection pattern"
affects: [scope-fluid-pipeline plans 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-tier-fallback-routing, artifact-based-state-detection]

key-files:
  created: []
  modified:
    - get-shit-done/workflows/progress.md

key-decisions:
  - "Parse ROADMAP.md directly for focus groups instead of relying on dead init focus_groups field"
  - "Removed focus_groups from init JSON parsing (dead code per research findings)"
  - "Anti-pattern guards prevent suggesting discussion when planning/execution is the next step"

patterns-established:
  - "Artifact-based pipeline state: FEATURE.md -> PLAN -> SUMMARY -> review/ -> doc-report.md progression detected by file presence"
  - "3-tier routing fallback: focus groups (primary) -> session continuity (fallback) -> state scan (final)"

requirements-completed: [FN-07, EU-03]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Plan Summary: Focus-Aware Progress Routing

**Progress workflow rewritten with 3-tier focus-aware routing: focus groups from ROADMAP.md, recent work from STATE.md session continuity, and state scan fallback -- with parallel-safe detection and anti-pattern guards**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T22:46:18Z
- **Completed:** 2026-03-05T22:51:18Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced guess-based routing table with 3-tier focus-aware routing
- Added artifact-based pipeline state detection (file presence determines stage)
- Added parallel-safe work detection with AskUserQuestion for ambiguous paths
- Added anti-pattern guards preventing unhelpful suggestions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite progress.md with focus-aware 3-tier routing** - `a11cbe8` (refactor)

## Files Created/Modified
- `get-shit-done/workflows/progress.md` - Rewritten route step with 3-tier focus-aware routing, artifact-based state detection, parallel-safe work detection

## Decisions Made
- Bypassed dead `focus_groups` init field per research findings -- parse ROADMAP.md directly instead
- Kept existing initialize/load_context/gather_recent_work/report steps unchanged (plan instruction)
- Anti-pattern guards are explicit NEVER rules in the workflow prose

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Steps
- Plan 03: scope-fluid review/doc command relaxation and auto-chain wiring
- Plan 04: role_type corrections and CLI backward compatibility

---
*Completed: 2026-03-05*
