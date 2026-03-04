---
plan: "02"
subsystem: pipeline-execution
tags: [slug-resolve, capability-orchestrator, framing-discovery, discuss-capability, routing, stub-creation]

# Dependency graph
requires: []
provides:
  - commands/gsd/new.md rewritten with 4-step routing: slug-resolve -> type branch -> stub creation -> orchestrator/framing-discovery
  - Capability-level routing in /gsd:new (was feature-only)
  - Feature stub auto-creation from CAPABILITY.md features table with status patch to exploring
  - Unknown slug disambiguation flow (capability vs feature choice)
  - Post-discuss-capability fan-out offer (pipeline all features vs run individually)
affects: [scope-aware-routing, pipeline-execution, capability-orchestrator, framing-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "slug-resolve type-based branching: resolve -> check type field -> route (capability/feature/ambiguous/no_match)"
    - "capability path: stub creation loop with existence check before feature-create + status patch"
    - "discuss-capability path: fan-out offer before orchestrator; direct resolved path: no offer"

key-files:
  created: []
  modified:
    - commands/gsd/new.md

key-decisions:
  - "Post-creation status patch (planning -> exploring) done inline in workflow prose — no CLI flag added to feature-create (avoids shared infrastructure change, simplest approach)"
  - "Fan-out offer only on discuss-capability path; direct capability resolve goes straight to orchestrator (different intent: one just created features vs one already has them)"
  - "Feature branch explicitly preserves all workflow gates (fuzzy resolution confirmation, MVU tracking, misclassification detection) per original behavior"

patterns-established:
  - "4-step routing pattern: resolve slug -> branch on type -> pre-flight setup -> workflow invocation (mirrors /gsd:execute)"
  - "Stub existence check before feature-create: check disk first, call CLI only for missing stubs, log each creation, skip silently if exists"

requirements-completed: [EU-01, EU-02, FN-01, FN-02, FN-03, FN-04, TC-01, TC-02]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Plan Summary: /gsd:new capability routing, disambiguation, and stub creation

**Rewrote commands/gsd/new.md with 4-step slug-type routing: capability slug triggers CAPABILITY.md feature stub auto-creation + capability-orchestrator; unknown slug asks "new capability or new feature?" and fans out to discuss-capability or framing-discovery respectively**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T22:49:30Z
- **Completed:** 2026-03-04T22:52:14Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- 4-branch routing in Step 2: capability -> orchestrator (via stub creation), feature -> framing-discovery (unchanged), ambiguous -> AskUserQuestion candidates, no_match -> "New capability or new feature?" disambiguation
- Feature stub auto-creation loop (Step 3): parses CAPABILITY.md features table, checks disk existence per feature, calls feature-create CLI for missing stubs, patches status planning->exploring, logs each creation, errors on empty table
- Post-discuss-capability fan-out offer (Step 4): AskUserQuestion before orchestrator if arriving from new-capability path; direct invocation if arriving from resolved-capability path
- Original feature-level behavior fully preserved in the feature branch (all framing-discovery gates intact)

## Task Commits

Each task was committed atomically:

1. **Task 1: update-new-routing-and-disambiguation** - `b5677f1` (feat)

## Files Created/Modified
- `commands/gsd/new.md` - Rewritten with 4-step routing process, updated execution_context (added capability-orchestrator.md and discuss-capability.md), updated objective and success_criteria

## Decisions Made
- Status patch after feature-create done inline in workflow prose (change `status: planning` to `status: exploring`) rather than adding a --status flag to feature-create CLI — avoids modifying shared infrastructure, no code compilation needed since these are markdown prompt files
- Fan-out offer only on discuss-capability path (user just created the capability); resolved-capability path goes direct (features already existed/scoped)

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Steps
- Plan 02 complete for /gsd:new; remaining lens commands (/gsd:enhance, /gsd:debug, /gsd:refactor) need the same capability routing added per FN-04/TC-01 (scope of a separate plan)
- new.md is the reference implementation for the routing pattern the other 3 lens commands will replicate

---
*Completed: 2026-03-04*
