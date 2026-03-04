---
plan: 01
subsystem: planner
tags: [planner-reference, gsd-planner, return-format, justification, round1-fixes, adr]

# Dependency graph
requires: []
provides:
  - "planner-reference.md Planning Complete block with ### Justification and ### Round 1 Fixes schema"
  - "gsd-planner.md output_format directive to emit both new sections on completion"
affects: [plan-presentation, plan.md step 8.3, plan.md step 8.6]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ADR format (Context/Decision/Consequence) for Round 1 fix entries in planner return"
    - "Grounding requirement: all justification claims must cite REQ IDs, dependency edges, or file paths"

key-files:
  created: []
  modified:
    - get-shit-done/references/planner-reference.md
    - agents/gsd-planner.md

key-decisions:
  - "New sections insert between Plans Created table and Findings — preserves downstream parsing of Findings block"
  - "Prose paragraph placed after the code block (not inside it) to explain generation intent without polluting the template"
  - "gsd-planner.md change is one sentence appended to existing output_format block, not a new section (per plan constraint)"

patterns-established:
  - "Return format extension pattern: add schema to planner-reference.md code block + directive sentence to gsd-planner.md output_format"

requirements-completed: [TC-01, FN-01, FN-02]

# Metrics
duration: 12min
completed: 2026-03-04
---

# Plan Summary: Planner Return Format Extension

**Planner-reference.md Planning Complete block extended with ### Justification (ordering/approach/KISS rationale) and ### Round 1 Fixes (ADR-format entries) schemas; gsd-planner.md directed to emit both on completion.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-04T00:00:00Z
- **Completed:** 2026-03-04T00:12:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `### Justification` section schema (ordering rationale, approach rationale, KISS rationale) to Planning Complete block in planner-reference.md
- Added `### Round 1 Fixes` section schema (ADR format: Context/Decision/Consequence; zero-fix fallback string) to same block
- Added prose paragraph documenting grounding requirement (claims must cite REQ IDs, dependency edges, or file paths)
- Updated gsd-planner.md `output_format` block with one-sentence directive pointing to both new sections and their schema location

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend planner-reference.md Planning Complete return format** - `f064a0d` (docs)
2. **Task 2: Update gsd-planner.md output_format** - `c01e279` (docs)

## Files Created/Modified
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md` — Planning Complete block extended with Justification + Round 1 Fixes sections and explanatory prose (+18 lines, 4.4% growth)
- `/Users/philliphall/get-shit-done-pe/agents/gsd-planner.md` — output_format block appended with one-sentence directive (+2 lines)

## Decisions Made
- Inserted new sections BETWEEN Plans Created and Findings (not after Findings) so the Findings block remains the last structured section before Next Steps — downstream parsers keyed on Findings position are unaffected
- Prose paragraph placed after the closing ``` of the code block, not inside it, to keep the template copy-pasteable without editorial noise
- gsd-planner.md addition is explicitly one sentence (not a new heading/section) per task constraint — keeps the agent definition minimal

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Steps
- planner-reference.md return format contract is now established — plan.md step 8.3 restructure (02-PLAN.md) can parse `### Justification` and `### Round 1 Fixes` from planner return
- gsd-planner agent will emit both sections on next planning run

---
*Completed: 2026-03-04*
