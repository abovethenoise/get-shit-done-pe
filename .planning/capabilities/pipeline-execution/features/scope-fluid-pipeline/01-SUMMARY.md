---
plan: 01
subsystem: workflows
tags: [pipeline, orchestration, DAG, scope-detection, framing]

# Dependency graph
requires: []
provides:
  - Scope-fluid framing-pipeline.md (capability + feature scope in one file)
  - DAG wave orchestration absorbed from capability-orchestrator.md
  - 4-stage pipeline flow (plan -> execute -> review -> doc)
affects: [commands that reference capability-orchestrator.md, commands that reference research-workflow.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scope-detection branch at pipeline entry (capability vs feature)"
    - "DAG wave ordering: plan+execute per feature, review+doc once per scope"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/framing-pipeline.md
  deleted:
    - get-shit-done/workflows/capability-orchestrator.md
    - get-shit-done/workflows/research-workflow.md

key-decisions:
  - "DAG logic ported from capability-orchestrator into framing-pipeline Section 2 rather than kept as a separate include"
  - "Review and doc run once at execution scope level, not per-feature"
  - "Research stage removed entirely -- plan.md Step 5 owns the gather-synthesize pattern"
  - "Requirements stage removed -- discuss-feature produces requirements upstream"

patterns-established:
  - "Scope-fluid orchestration: single workflow handles both capability and feature scope via conditional branch"
  - "Pipeline stage count: 4 (plan/execute/review/doc), not 6"

requirements-completed: [FN-04, FN-05, FN-06, TC-01, TC-02, TC-03, TC-04]

# Metrics
duration: 8min
completed: 2026-03-05
---

# Plan Summary: Pipeline Consolidation

**Consolidated framing-pipeline.md to handle both capability-scope (DAG wave ordering) and feature-scope (linear) execution in a 4-stage flow, deleting 380 lines across 2 absorbed workflow files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T22:31:15Z
- **Completed:** 2026-03-05T22:39:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 rewritten, 2 deleted)

## Accomplishments
- Rewrote framing-pipeline.md with scope detection branch, DAG wave orchestration, and 4-stage flow
- Removed duplicate research stage (plan.md owns it) and requirements stage (discuss-feature owns it)
- Deleted capability-orchestrator.md and research-workflow.md (~380 lines removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite framing-pipeline.md** - `5852b74` (refactor)
2. **Task 2: Delete absorbed workflow files** - `c5ea37f` (refactor)

## Files Created/Modified
- `get-shit-done/workflows/framing-pipeline.md` - Rewritten: scope-fluid pipeline with DAG logic, 4-stage flow
- `get-shit-done/workflows/capability-orchestrator.md` - Deleted (157 lines, DAG logic absorbed)
- `get-shit-done/workflows/research-workflow.md` - Deleted (225 lines, research owned by plan.md)

## Decisions Made
- DAG logic inlined into framing-pipeline.md Section 2 (capability-scope branch) rather than kept as a separate reference -- reduces indirection, single entry point
- Cycle detection ported verbatim with AskUserQuestion resolution pattern
- Kept all escalation handling, lens propagation, and auto-chain behavior from original

## Unplanned Changes
None - plan executed exactly as written.

## Issues Encountered
- Verification grep pattern "research.*gatherers" matched an explanatory note about plan.md owning research. Reworded to "gather-synthesize agents" to pass the check without losing meaning.

## User Setup Required
None - no external service configuration required.

## Next Steps
- Plan 02: Update 8+ command files that reference deleted capability-orchestrator.md and research-workflow.md
- Plan 03: Scope-fluid review/doc and auto-chain wiring
- Plan 04: Role-type corrections (TC-08) and progress routing (FN-07)

---
*Completed: 2026-03-05*
