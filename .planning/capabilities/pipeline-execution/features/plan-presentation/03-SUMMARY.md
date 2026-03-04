---
plan: 03
subsystem: workflow
tags: [plan-presentation, step8, justification, deep-dive, checker-format]

# Dependency graph
requires:
  - plan: 01
    provides: planner-reference.md Justification + Round 1 Fixes return format contracts
  - plan: 02
    provides: ui-brand.md ASCII flow diagram notation and complexity gate
provides:
  - plan.md step 8 restructured with 3-layer justification presentation before approval
  - Unconditional deep-dive step (8.6) with named plan areas
  - Full 3-layer summary step (8.7) with conditional ASCII flow diagram
  - Explicit severity-grouped checker findings format (step 8.9)
affects: [plan workflow, planner-reference, plan-checker, gsd-planner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Present justification before findings: narrative A/B/C structure in step 8.3"
    - "Unconditional deep-dive: runs regardless of finding count, 4-option AskUserQuestion with expansion"
    - "3-layer final summary: Layer 1 justification + Layer 2 decisions + Layer 3 conditional ASCII flow"
    - "Checker severity grouping: blockers first, warnings second, info as batch"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/plan.md

key-decisions:
  - "Deep-dive uses 4-option AskUserQuestion (tool max): third option 'Requirement coverage + more...' expands to reveal Assumptions/Self-critique/No-deep-dive as a second AskUserQuestion call"
  - "Token growth ceiling hit at 63 lines (18.75% over); trimmed prose in 8.3, 8.6, and 8.7 to reach 50 lines (14.9%) while preserving all structural instructions"
  - "Tasks 1 and 2 combined into single commit: both modify the same file and changes cannot be staged independently without unstable intermediate state"

patterns-established:
  - "AskUserQuestion expansion pattern: use '+ more...' suffix on option 3 when >4 options needed across two sequential calls"

requirements-completed: [EU-01, EU-02, FN-03, FN-04, FN-05, FN-06, FN-07, TC-02]

# Metrics
duration: 20min
completed: 2026-03-04
---

# Plan Summary: Step 8 Justification Presentation Restructure

**plan.md step 8 reordered to surface justification narrative + Round 1 fixes before findings, with unconditional deep-dive step, full 3-layer approval summary, and explicit severity-grouped checker format**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 2 (committed as 1 atomic change to same file)
- **Files modified:** 1

## Accomplishments

- Step 8.3 restructured with A/B/C order: justification narrative always renders first, Round 1 fix summary always renders second, per-finding Q&A loop runs only when findings exist (output contract to 8.4/8.5 preserved)
- New step 8.6 Deep-Dive inserted between findings resolution and finalize: unconditional, 4-option AskUserQuestion with "Requirement coverage + more..." expansion for the 6-area requirement
- Old step 8.6 replaced with step 8.7 Final Summary and Approval: Layer 1 (justification), Layer 2 (surfaced decisions), Layer 3 (conditional ASCII flow for 2+ waves or 3+ plans), plan summary table, finalize AskUserQuestion with explicit "justification regeneration" re-spawn instruction
- Step 8.8 Plan Checker and step 8.9 Handle Checker Findings: renumbered and 8.9 now explicitly groups findings by severity (blockers/warnings/info) with justification cross-reference field
- Token growth: 386 lines vs original 336 = 50 lines net = 14.9% (within 15% ceiling)

## Task Commits

1. **Task 1+2: restructure step 8.3, add deep-dive 8.6, replace 8.7, explicit 8.9** - `01aeec3` (feat)

## Files Created/Modified

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` - Step 8 restructured with 3-layer presentation, unconditional deep-dive, severity-grouped checker format; steps 8.6-8.9 renumbered

## Decisions Made

- **Deep-dive 6-area problem:** AskUserQuestion has a max of 4 options. Solution: third option "Requirement coverage + more..." signals expansion — selecting it re-offers "Assumptions made", "Self-critique details", "No deep-dive needed" as a second AskUserQuestion. This preserves all 6 named areas (EU-02 AC) without violating the tool constraint.
- **Single commit for two tasks:** Both tasks modify only `plan.md`. The file was not in a stable intermediate state between tasks 1 and 2 (task 1 leaves step 8.7+ as old unnumbered content; task 2 completes the restructure). Combined into one commit labeled `[task 1/2]` covering the full restructure.
- **Token trim strategy:** Compressed 8.3.A bullet list to inline parenthetical, collapsed 8.3.B to single line, merged two sentences in 8.6 loop instructions, inlined 8.7 Layer 1 to single line, inlined plan summary table header, removed "After all layers" intro sentence — all structural instructions preserved.

## Unplanned Changes

**1. Auto-fixed: Token growth exceeded ceiling mid-edit** — first pass landed at 399 lines (18.75% growth); trimmed prose without losing any structural instruction to reach 386 lines (14.9%).
- **Found during:** Task 2 token growth check
- **Issue:** New content for deep-dive + 3-layer summary + checker format added 63 lines; ceiling is 50
- **Fix:** Compressed verbose prose in 8.3.A, 8.3.B, 8.6 loop instructions, 8.7 Layer 1, 8.7 table header
- **Files modified:** get-shit-done/workflows/plan.md
- **Committed in:** 01aeec3 (task commit)

---

**Unplanned changes:** 1 (token trim to meet ceiling)
**Impact on plan:** Required, within spec. All structural instructions intact.

## Issues Encountered

None — edits applied cleanly with no conflicts.

## User Setup Required

None - no external service configuration required.

## Next Steps

- Plans 01, 02, 03 for plan-presentation are complete. The full 3-layer justification pipeline is now wired end-to-end: planner-reference.md exports Justification + Round 1 Fixes (Plan 01), ui-brand.md defines ASCII flow notation (Plan 02), plan.md step 8 consumes both and presents them to the user (Plan 03).
- No blockers.

---
*Completed: 2026-03-04*
