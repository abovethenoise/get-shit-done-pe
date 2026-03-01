---
phase: 11-automated-testing
plan: 02
subsystem: testing
tags: [cli, smoke-test, gsd-tools, node]

requires:
  - phase: 10-remaining-cleanup
    provides: "Clean CLI routes with dead routes returning error messages"
provides:
  - "CLI route smoke test results proving all 21 routes functional"
  - "Baseline confidence for E2E simulation (plan 03)"
affects: [11-automated-testing, 12-install]

tech-stack:
  added: []
  patterns: [cli-smoke-testing-via-synthetic-fixtures]

key-files:
  created:
    - .planning/phases/11-automated-testing/cli-smoke-results.md
  modified: []

key-decisions:
  - "Routes requiring positional args (plan-feature, execute-feature, feature-op, feature-list) tested with and without args to verify both success and error paths"
  - "feature-op accepts no args without error (returns null fields) -- logged as cosmetic finding, not a blocker"

patterns-established:
  - "Synthetic fixture pattern: empty dir for new-project, scaffolded dir for existing-project"

requirements-completed: [CMD-03]

duration: 4min
completed: 2026-03-01
---

# Phase 11 Plan 02: CLI Route Smoke Tests Summary

**All 21 CLI routes smoke tested against synthetic fixtures -- 19 PASS, 2 WARN (cosmetic arg requirements), 0 FAIL, 0 blockers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T18:29:38Z
- **Completed:** 2026-03-01T18:35:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Smoke tested all 13 live init routes (exit 0, valid JSON)
- Confirmed all 3 dead routes return graceful error messages (not crashes)
- Verified 5 atomic routes (state load, progress, capability-list, feature-list, feature-op)
- Documented argument requirements for routes needing positional args

## Task Commits

Each task was committed atomically:

1. **Task 1: Build synthetic fixture directories and run CLI smoke tests** - `a6d46f0` (test)

## Files Created/Modified
- `.planning/phases/11-automated-testing/cli-smoke-results.md` - Full smoke test results with per-route verdicts, output samples, and findings

## Decisions Made
- Tested routes both with and without required args to capture error handling behavior
- Classified missing-arg errors as cosmetic (clear error messages, expected behavior)
- feature-op's lenient no-arg behavior noted but not flagged as a bug

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added required positional args to routes 10, 11, 12, 21**
- **Found during:** Task 1 (smoke testing)
- **Issue:** Plan's test table listed `init plan-feature`, `init execute-feature`, `init feature-op`, and `feature-list` without required positional arguments
- **Fix:** Re-ran with correct args (`test-cap test-feat` for init routes, `test-cap` for feature-list). Documented both no-arg (error) and with-arg (success) behavior.
- **Files modified:** cli-smoke-results.md
- **Verification:** All routes pass with correct arguments
- **Committed in:** a6d46f0

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to get accurate test results. No scope creep.

## Issues Encountered
None -- all routes behaved as expected once invoked with correct arguments.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI route layer confirmed functional, ready for E2E simulation (plan 03)
- No blockers for proceeding to full pipeline walkthrough

---
*Phase: 11-automated-testing*
*Completed: 2026-03-01*
