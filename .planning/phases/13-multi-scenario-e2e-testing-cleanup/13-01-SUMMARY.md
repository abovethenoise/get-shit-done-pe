---
phase: 13-multi-scenario-e2e-testing-cleanup
plan: 01
subsystem: testing
tags: [e2e, cli-routes, capability-model, feature-model, init-routes]

# Dependency graph
requires:
  - phase: 12-workflow-optimization-wiring
    provides: "v2 feature-scoped init routes and workflow rewrites"
provides:
  - "Scenario 01 report: greenfield new project flow tested"
  - "Scenario 02 report: single feature pipeline entry tested"
  - "13-FINDINGS.md initialized with 11 findings"
  - "Workout app workspace at /tmp/gsd-test-workout with 3 features"
affects: [13-02, 13-03, 13-04, 13-05, 13-06]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Scenario execution: pre-stage -> trace -> verify -> report -> fix/log"]

key-files:
  created:
    - ".planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/01-greenfield-new.md"
    - ".planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/02-single-feature.md"
    - ".planning/phases/13-multi-scenario-e2e-testing-cleanup/13-FINDINGS.md"
  modified: []

key-decisions:
  - "v2 CRUD routes (capability-create, feature-create, etc.) do not exist -- documented as findings, not fixed inline"
  - "v2 workflow files (init-project.md, discuss-capability.md, etc.) do not exist -- v1 names retained with v2 internals"
  - "Orphaned v2 init routes (plan-feature, execute-feature, feature-op) exist but no workflow calls them"

patterns-established:
  - "E2E scenario testing: test CLI route, log finding, document in structured report"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 13 Plan 01: Foundation Scenarios Summary

**S01 greenfield and S02 single-feature tested -- 3 of 7 init routes work, 5 CRUD routes missing, 6 v2 workflow files missing, v2 pipeline not wired**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T16:07:36Z
- **Completed:** 2026-03-02T16:13:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Tested all referenced CLI routes: `init new-project`, `init plan-feature`, `init execute-feature`, `init feature-op` return valid JSON
- Discovered 11 findings: 7 bugs (missing routes/workflows), 4 friction items
- Confirmed v2 directory model works (capabilities/features) but v2 pipeline is not wired (no workflow calls feature init routes)
- Established workout app workspace with 3 features for subsequent scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: S01 Greenfield new project** - `7bcbc37` (test)
2. **Task 2: S02 Single feature pipeline** - `a21007c` (test)

## Files Created/Modified
- `.planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/01-greenfield-new.md` - S01 scenario report (PARTIAL verdict)
- `.planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/02-single-feature.md` - S02 scenario report (PARTIAL verdict)
- `.planning/phases/13-multi-scenario-e2e-testing-cleanup/13-FINDINGS.md` - Central findings log (11 findings)

## Decisions Made
- Documented missing CRUD routes and workflow files as findings rather than implementing them inline (architectural scope -- Rule 4 territory)
- Used manual mkdir + file write to create capability/feature directories since CRUD routes don't exist
- Tested actual correct routes alongside planned (incorrect) routes to document the gap

## Deviations from Plan

### Plan Referenced Nonexistent Routes and Files

The plan referenced 5 CLI routes and 6 workflow files that do not exist:

**Missing CLI routes:** `capability-create`, `feature-create`, `capability-list`, `feature-list`, `slug-resolve`

**Missing workflow files:** `init-project.md`, `discuss-capability.md`, `discuss-feature.md`, `framing-pipeline.md`, `plan.md`, `execute.md`

These appear to be aspirational names from Phase 12 design discussions that were never implemented. The actual codebase retains v1 workflow names (`new-project.md`, `discuss-phase.md`, `plan-phase.md`) with v2 init routes added to gsd-tools.cjs but not called by any workflow.

**Impact on plan:** Adapted by testing actual routes and documenting the gaps. All findings logged to 13-FINDINGS.md for triage.

## Issues Encountered
- None beyond the planned-vs-actual route/workflow name mismatches documented above

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Workout app workspace ready at `/tmp/gsd-test-workout` with 3 features for Plans 02-05
- 13-FINDINGS.md established for ongoing finding accumulation
- Key blocker for remaining scenarios: the v2 pipeline (discuss-capability -> plan -> execute using feature routes) is not wired. Scenarios 3-9 will encounter the same issue.

---
*Phase: 13-multi-scenario-e2e-testing-cleanup*
*Completed: 2026-03-02*
