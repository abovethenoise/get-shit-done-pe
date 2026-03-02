---
phase: 12-workflow-optimization-wiring
plan: 03
subsystem: init
tags: [state, roadmap, capability, templates, bootstrap, focus-groups]

# Dependency graph
requires:
  - phase: 12-01
    provides: v2 plan.md and execute.md rewrites
  - phase: 12-02
    provides: v2 review.md, doc.md, framing-pipeline.md rewrites
provides:
  - v2 init workflow with STATE.md and ROADMAP.md bootstrap
  - v2 state.md template with focus group model
  - v2 roadmap.md template with focus group model
  - Updated capability.md template with Why section and priority features
affects: [init, focus, resume-work, discuss-capability]

# Tech tracking
tech-stack:
  added: []
  patterns: [focus-group-model, per-item-dependency-lines]

key-files:
  created: []
  modified:
    - get-shit-done/workflows/init-project.md
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/templates/state.md
    - get-shit-done/templates/roadmap.md
    - get-shit-done/templates/capability.md

key-decisions:
  - "STATE.md and ROADMAP.md created as final init steps (3g/3h, 4g/4h) after documentation seeded"
  - "Completion message directs to /gsd:discuss-capability, not /gsd:new or /gsd:focus"
  - "Performance Metrics section removed from STATE.md v2 -- too noisy, phase-model specific"
  - "Roadmap v2 drops phases, plan lists, progress table, success criteria -- all live elsewhere"

patterns-established:
  - "Focus group model: STATE.md and ROADMAP.md track focus groups instead of phases"
  - "Per-item dependencies: each roadmap item has -> depends: line instead of phase-level depends"

requirements-completed: [CMD-01]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 12 Plan 03: Init Bootstrap & Template v2 Summary

**STATE.md + ROADMAP.md bootstrap added to /gsd:init; three templates rewritten for v2 focus group model**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T14:44:55Z
- **Completed:** 2026-03-02T14:49:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- B2 blocker resolved: /gsd:init now creates STATE.md and ROADMAP.md for both new and brownfield flows
- Three templates rewritten for v2 focus group model (state.md, roadmap.md, capability.md)
- Design & Styling Q&A step added to both project flows (3c.5, 4c.5)
- Capabilities Q&A step added before capability file creation (3e.0)
- Completion message updated to direct users to /gsd:discuss-capability as primary next step

## Task Commits

Each task was committed atomically:

1. **Task 1: Add STATE.md + ROADMAP.md bootstrap to init-project.md and update init.cjs** - `09d02d8` (feat)
2. **Task 2: Rewrite state.md, roadmap.md, and capability.md templates** - `2b79748` (feat)

## Files Created/Modified
- `get-shit-done/workflows/init-project.md` - Added steps 3c.5, 3e.0, 3g, 3h, 4c.5, 4g, 4h; updated completion message
- `get-shit-done/bin/lib/init.cjs` - Added design_style, roadmap_md, state_md to section arrays
- `get-shit-done/templates/state.md` - Full v2 rewrite: focus groups replace phase tracking
- `get-shit-done/templates/roadmap.md` - Full v2 rewrite: focus groups replace phase/milestone structure
- `get-shit-done/templates/capability.md` - Added name frontmatter, Why section, Priority + Depends-On in Features table

## Decisions Made
- STATE.md and ROADMAP.md created as final init steps (after documentation seeded) to ensure all project context is available when writing them
- Completion message directs to /gsd:discuss-capability (not /gsd:new or /gsd:focus) because features don't exist yet after init
- Performance Metrics section removed from STATE.md v2 -- it was phase-model specific and added noise
- Roadmap v2 drops phases, plan lists, progress table, and success criteria -- these now live in FEATURE.md and /gsd:progress

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Init workflow now produces complete artifact set (PROJECT.md + capabilities + STATE.md + ROADMAP.md)
- Templates ready for consumption by /gsd:focus, /gsd:discuss-capability, and resume-work workflows
- Remaining Phase 12 plans can build on the v2 data model established here

## Self-Check: PASSED

All 5 modified files verified on disk. Both task commits (09d02d8, 2b79748) verified in git log.

---
*Phase: 12-workflow-optimization-wiring*
*Completed: 2026-03-02*
