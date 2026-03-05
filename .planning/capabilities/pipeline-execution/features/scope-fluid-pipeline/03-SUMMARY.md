---
plan: 03
subsystem: workflows
tags: [pipeline, auto-chain, remediation, scope-fluid, review, doc]

# Dependency graph
requires:
  - plan: 01
    provides: "Consolidated framing-pipeline.md with scope-detection and 4-stage flow"
provides:
  - "Scope-fluid review command (accepts capability or feature scope)"
  - "Scope-fluid artifact collection in review.md and doc.md workflows"
  - "Auto-chain wiring: execute->review->doc without user gates"
  - "Remediation loop: accepted findings -> plan -> execute -> re-review (max 2 cycles)"
  - "Context exhaustion fallback at stage transitions"
affects: [scope-fluid-pipeline plan 04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scope-fluid artifact collection: single workflow handles both feature and capability scope via conditional branch"
    - "Ground truth framing: spec for code review, code for documentation"
    - "Remediation loop with counter-based max cycles"
    - "Context exhaustion fallback with concrete next-command presentation"

key-files:
  created: []
  modified:
    - commands/gsd/review.md
    - get-shit-done/workflows/review.md
    - get-shit-done/workflows/doc.md
    - get-shit-done/workflows/execute.md
    - get-shit-done/workflows/framing-pipeline.md

key-decisions:
  - "Review command mirrors doc command pattern for capability-level invocation (iterate features, pass null FEATURE_SLUG)"
  - "Ground truth split: spec is ground truth for review (verify against requirements), code is ground truth for doc (document what was built)"
  - "Remediation loop is automatic within pipeline but human gate at review Q&A is preserved"
  - "Context exhaustion presents specific /gsd:* commands rather than generic 'continue' messages"

patterns-established:
  - "Scope-fluid artifact collection: determine scope from FEATURE_SLUG presence, branch collection logic"
  - "Auto-chain with NO user gate: explicit language at each transition point"
  - "Remediation as pipeline sub-loop: reuse existing planner/executor, counter-capped re-review"

requirements-completed: [FN-01, FN-02, FN-03, FN-08, TC-05, EU-01, EU-02]

# Metrics
duration: 7min
completed: 2026-03-05
---

# Plan Summary: Auto-Chain Wiring and Scope-Fluid Review/Doc

**Wired scope-fluid review/doc (capability + feature scope), execute->review->doc auto-chain with NO user gates at transitions, and remediation loop (max 2 cycles) with context exhaustion fallback**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-05T22:56:34Z
- **Completed:** 2026-03-05T23:03:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Review command now accepts both capability and feature scope (removed --type feature constraint)
- Review.md and doc.md workflows handle multi-feature artifact lists for capability scope
- Execute.md returns cleanly for pipeline chaining instead of terminating
- Framing-pipeline.md auto-chains execute->review->doc with explicit NO user gate language
- Remediation loop added: accepted review findings -> planner -> executor -> re-review (max 2 cycles)
- Context exhaustion fallback presents concrete next commands at each stage transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Scope-fluid review command and review/doc artifact handling** - `affeb0c` (feat)
2. **Task 2: Auto-chain wiring and remediation loop** - `38756bd` (feat)

## Files Created/Modified
- `commands/gsd/review.md` - Scope-fluid: accepts both capability and feature scope, capability-level invocation path added
- `get-shit-done/workflows/review.md` - Scope-fluid artifact collection, ground truth framing (spec), cross-scope detection in quality reviewer
- `get-shit-done/workflows/doc.md` - Scope-fluid artifact collection, ground truth framing (code), doc aggregator framing
- `get-shit-done/workflows/execute.md` - Clean return for pipeline chaining, removed terminal "workflow ends" language
- `get-shit-done/workflows/framing-pipeline.md` - Auto-chain wiring, remediation loop (Section 5a), context exhaustion fallback

## Decisions Made
- Review command mirrors the existing doc command pattern for capability scope handling (consistency)
- Ground truth split: spec for review, code for doc (different stages verify against different sources of truth)
- Remediation is automatic within pipeline -- only the review Q&A itself is a human gate
- Context exhaustion presents specific commands (e.g., `/gsd:review cap/feat`) not generic messages

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Steps
- Plan 04: Role-type corrections (TC-08) and CLI backward compatibility (EU-04, FN-09)

---
*Completed: 2026-03-05*
