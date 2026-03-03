---
plan: 01
subsystem: install
tags: [nodejs, cli, validation, install-ux]

# Dependency graph
requires: []
provides:
  - "runValidation() exported from scripts/validate-install.js returning { passed, failed, failures[] }"
  - "Silent install output in bin/install.js: banner + single pass/fail line"
  - "Auto-validation wired into install pipeline"
  - "gsd-askuserquestion-guard.js added to validation expected hooks"
affects: [auto-latest, cc-replacement]

# Tech tracking
tech-stack:
  added: []
  patterns: [require.main === module guard, console.log suppression during programmatic calls, result-object returns instead of process.exit]

key-files:
  modified:
    - scripts/validate-install.js
    - bin/install.js

key-decisions:
  - "Suppress console.log/error during runValidation() call from install.js to achieve silent output, restored via finally block"
  - "verifyInstalled() returns false silently instead of logging errors, since failures are captured in the result object"

patterns-established:
  - "Result object pattern: { ok: boolean, step: string, reason: string } for install step tracking"
  - "require.main === module guard for scripts that need both standalone and programmatic use"

requirements-completed: [EU-01, FN-01, FN-02, FN-03, TC-01]

# Metrics
duration: 12min
completed: 2026-03-03
---

# Plan Summary: Install Feedback

**Silent install with auto-validation: banner + single pass/fail line replaces per-step log noise, validate-install.js now require()-able returning structured results**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-03T13:54:49Z
- **Completed:** 2026-03-03T14:07:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- validate-install.js exports runValidation() returning { passed, failed, failures[] } without killing the calling process
- install.js produces only banner + single pass/fail line with zero intermediate output
- Auto-validation runs after install and folds result into pass/fail
- gsd-askuserquestion-guard.js added to expected hooks validation list

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor validate-install.js to export runValidation()** - `88b7e78` (refactor)
2. **Task 2: Restructure bin/install.js output** - `59d7d3a` (feat)

## Files Created/Modified
- `scripts/validate-install.js` - Wrapped logic in exported runValidation(), added require.main guard, added askuserquestion hook to expected list
- `bin/install.js` - Suppressed per-step logs, added result object returns, wired auto-validation, rewrote finishInstall() success message

## Decisions Made
- Suppressed console.log/error during runValidation() call by temporarily replacing them, restored in finally block. Plan didn't specify this but the must_have "no intermediate output" required it since runValidation() logs per-check results internally.

## Unplanned Changes

**1. Auto-fixed: Console suppression during validation call** -- runValidation() logs per-check output which violated the "no intermediate output" must_have
- **Found during:** Task 2 (Step 3 -- wiring runValidation)
- **Issue:** Calling runValidation() produced ~30 lines of PASS/FAIL output between banner and final result
- **Fix:** Temporarily replace console.log/error with no-ops during the call, restore in finally block
- **Files modified:** bin/install.js
- **Committed in:** 59d7d3a (Task 2 commit)

---

**Unplanned changes:** 1 (console suppression for silent validation)
**Impact on plan:** Necessary to satisfy must_have. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Steps
- readSettings() still returns {} on corrupt settings.json (documented must_have for known-good baseline not addressed in this plan -- requires separate implementation)
- Ready for cc-replacement and auto-latest features to build on this foundation

---
*Completed: 2026-03-03*
