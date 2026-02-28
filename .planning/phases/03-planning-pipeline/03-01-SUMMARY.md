---
phase: 03-planning-pipeline
plan: 01
subsystem: cli
tags: [validation, traceability, plan-validate, requirements]

requires:
  - phase: 01-foundation
    provides: "frontmatter.cjs (extractFrontmatter), core.cjs (output, error, safeReadFile), gsd-tools.cjs dispatch pattern"
provides:
  - "plan-validate.cjs: 4-rule plan validation engine (orphan, phantom, cross-layer, uncovered)"
  - "gsd-tools plan-validate CLI command"
  - "FEATURE.md template with 7-column trace table"
affects: [03-planning-pipeline, planner-agent, review-pipeline]

tech-stack:
  added: []
  patterns: ["flat-verb dispatch (plan-validate)", "structured error/warning validation output"]

key-files:
  created: ["get-shit-done/bin/lib/plan-validate.cjs"]
  modified: ["get-shit-done/bin/gsd-tools.cjs", "get-shit-done/templates/feature.md"]

key-decisions:
  - "Validator is pure reporting — no blocking or finalization logic (that lives in workflow Plan 03-02)"
  - "Cross-layer check only applies to EU/FN/TC prefix IDs; project-level IDs (PLAN-xx, REQS-xx) are exempt"
  - "Uncovered REQs are warnings (not errors) — coverage gaps surface in self-critique, not hard blocks"

patterns-established:
  - "Validation rule output format: { type, task, plan, req, message } for errors and warnings"
  - "REQ ID extraction regex: /^\|\s*([A-Z]+-\d+)\s*\|/gm from markdown tables"

requirements-completed: [REQS-03, REQS-04]

duration: 2min
completed: 2026-02-28
---

# Phase 3 Plan 1: Plan Validation Engine Summary

**4-rule plan validation CLI (orphan task, phantom reference, cross-layer mixing, uncovered REQ) with updated FEATURE.md trace table**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T19:15:13Z
- **Completed:** 2026-02-28T19:17:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- plan-validate.cjs with 4 deterministic validation rules and structured JSON output
- CLI dispatch wired as flat-verb `plan-validate` command in gsd-tools.cjs
- FEATURE.md template updated to 7-column trace table matching CONTEXT.md spec

## Task Commits

Each task was committed atomically:

1. **Task 1: Create plan-validate.cjs with 4-rule validation engine** - `423b2ba` (feat)
2. **Task 2: Wire plan validate into gsd-tools dispatch + update FEATURE.md template** - `084ee5c` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/plan-validate.cjs` - 4-rule validation engine (orphan, phantom, cross-layer, uncovered)
- `get-shit-done/bin/gsd-tools.cjs` - Added plan-validate dispatch case and require
- `get-shit-done/templates/feature.md` - Updated trace table to 7-column layout

## Decisions Made
- Validator is pure reporting tool — does not block or finalize. Workflow logic (Plan 03-02) owns that.
- Cross-layer check exempts project-level IDs (PLAN-xx, REQS-xx) since they don't belong to EU/FN/TC layers.
- Uncovered REQs are warnings, not errors — per CONTEXT.md: "Errors block finalization. Warnings surface in self-critique."

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- plan-validate ready for integration into planner agent self-critique loop (Plan 03-02)
- Validation output format designed for programmatic consumption by the planner workflow

---
*Phase: 03-planning-pipeline*
*Completed: 2026-02-28*
