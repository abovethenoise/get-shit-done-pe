---
plan: 02
subsystem: ui
tags: [ui-brand, ascii-flow, conventions, wave-diagrams]

# Dependency graph
requires: []
provides:
  - Canonical ASCII flow diagram notation in ui-brand.md ([Plan-NN: objective] --> style)
  - Complexity gate rule (2+ waves OR 3+ plans triggers diagram render)
  - Omit rule for trivially simple plans (1 wave, 1-2 plans)
  - Anti-pattern entry for forcing diagrams on simple plans
affects:
  - plan.md step 8.6 (wave flow diagram rendering)
  - any future GSD output stage using flow diagrams

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ASCII flow notation: [Plan-NN: objective] --> [Plan-NN: objective] with parenthetical multi-dependency convergence"

key-files:
  created: []
  modified:
    - get-shit-done/references/ui-brand.md

key-decisions:
  - "Inserted section BEFORE Anti-Patterns, maintaining section ordering logic (reference sections, then guard-rails)"
  - "21 lines added (within 15% / 24-line Goldilocks ceiling from 161-line baseline)"
  - "No box-drawing characters in the notation example itself — consistent with the rule being documented"

patterns-established:
  - "Complexity gate pattern: always document the gate condition alongside the visual convention so callers self-regulate"

requirements-completed: [TC-03, FN-06]

# Metrics
duration: 8min
completed: 2026-03-04
---

# Plan Summary: ASCII Flow Diagram Convention

**ASCII flow diagram notation ([Plan-NN: objective] -->) added to ui-brand.md with complexity gate (2+ waves OR 3+ plans) and trivially-simple omit rule, giving plan.md step 8.6 a canonical reference.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- New `## ASCII Flow Diagrams` section in ui-brand.md at line 152, before Anti-Patterns
- Complexity gate documented: render only when 2+ waves OR 3+ plans
- Omit rule documented: skip for trivially simple plans (1 wave, 1-2 plans)
- Multi-dependency convergence notation: `(after Plan-XX + Plan-YY)` parenthetical
- Anti-pattern entry added: "Flow diagrams on trivially simple plans (1 wave, ≤2 plans)"

## Task Commits

1. **Task 1: Add ASCII Flow Diagrams section to ui-brand.md** - `3ea2287` (feat)

## Files Created/Modified
- `get-shit-done/references/ui-brand.md` - Added ASCII Flow Diagrams section (lines 152-171) and anti-pattern entry (line 180)

## Decisions Made
- Section inserted before Anti-Patterns (second-to-last), matching the plan's specified insertion point and natural document flow (content patterns first, then guard-rails last)
- Used exact notation from plan spec without modification — it already satisfies the no-box-drawing constraint and renders correctly in monospace

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Steps
- ui-brand.md convention is ready for plan.md step 8.6 to reference via @-link
- 03-PLAN.md (plan.md workflow restructure) can now reference this convention when implementing the conditional wave flow diagram in step 8.6

---
*Completed: 2026-03-04*
