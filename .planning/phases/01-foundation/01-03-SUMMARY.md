---
phase: 01-foundation
plan: 03
subsystem: cli-commands
tags: [capability, feature, lifecycle, cli, flat-verb, state-tracking]

requires:
  - phase: 01-foundation-02
    provides: "Templates (capability.md, feature.md), findCapabilityInternal, findFeatureInternal, generateSlugInternal"
provides:
  - "capability.cjs module (cmdCapabilityCreate, cmdCapabilityList, cmdCapabilityStatus)"
  - "feature.cjs module (cmdFeatureCreate, cmdFeatureList, cmdFeatureStatus)"
  - "fillTemplate() in template.cjs as single source of truth for content generation"
  - "6 flat-verb CLI commands wired in gsd-tools.cjs"
  - "STATE.md current_capability and current_feature tracking"
affects: [02-agents, 03-planning, capability-workflows, feature-workflows]

tech-stack:
  added: []
  patterns: [flat-verb-dispatch, template-delegation, capability-feature-hierarchy]

key-files:
  created:
    - get-shit-done/bin/lib/capability.cjs
    - get-shit-done/bin/lib/feature.cjs
    - tests/capability.test.cjs
    - tests/feature.test.cjs
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/bin/lib/template.cjs
    - get-shit-done/bin/lib/state.cjs

key-decisions:
  - "fillTemplate() is the single content source of truth; capability.cjs and feature.cjs delegate, never hardcode"
  - "Flat-verb dispatch pattern (capability-create not capability create) for autocomplete discoverability"
  - "Partial creation detection: dir exists but no .md file allows re-creation"

patterns-established:
  - "Flat-verb CLI dispatch: top-level switch cases like 'capability-create' in gsd-tools.cjs"
  - "Template delegation: modules call fillTemplate() for content, write to disk themselves"
  - "Req counting by regex: ### EU-\\d+, ### FN-\\d+, ### TC-\\d+ patterns in FEATURE.md"

requirements-completed: [FOUND-01, FOUND-02, FOUND-04, FOUND-05]

duration: 4min
completed: 2026-02-28
---

# Phase 1 Plan 03: Capability & Feature CLI Commands Summary

**Capability and feature lifecycle CLI (create/list/status) with flat-verb dispatch, fillTemplate delegation, and STATE.md current_capability/current_feature tracking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T15:04:44Z
- **Completed:** 2026-02-28T15:08:28Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created capability.cjs and feature.cjs with full lifecycle commands (create, list, status)
- TDD approach: 24 tests written first, all passing after implementation
- Added fillTemplate() to template.cjs as single source of truth for capability/feature content
- Wired 6 flat-verb commands in gsd-tools.cjs (capability-create/list/status, feature-create/list/status)
- Extended STATE.md with Current Focus section tracking current_capability and current_feature

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests** - `689b165` (test)
2. **Task 1 GREEN: Implementation** - `17dd4b6` (feat)
3. **Task 2: Dispatch, templates, state** - `f2a7a15` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/capability.cjs` - Capability lifecycle commands (create, list, status)
- `get-shit-done/bin/lib/feature.cjs` - Feature lifecycle commands (create, list, status) with 3-layer req counting
- `get-shit-done/bin/lib/template.cjs` - Added fillTemplate() and capability/feature cases in cmdTemplateFill
- `get-shit-done/bin/gsd-tools.cjs` - 6 flat-verb dispatch cases for capability and feature commands
- `get-shit-done/bin/lib/state.cjs` - current_capability and current_feature in buildStateFrontmatter
- `tests/capability.test.cjs` - 12 tests for capability create, list, status with error cases
- `tests/feature.test.cjs` - 12 tests for feature create, list, status with error cases
- `.planning/STATE.md` - Added Current Focus section

## Decisions Made
- fillTemplate() returns content string without writing to disk; callers handle I/O (separation of concerns)
- Flat-verb dispatch matches CONTEXT.md locked decision for autocomplete discoverability
- Partial creation detection reuses findCapabilityInternal's `no_capability_file` reason code

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All v2 hierarchy CLI commands operational (capability + feature lifecycle)
- Phase 1 foundation complete: frontmatter parsing, templates, core helpers, and CLI commands all wired
- Pre-existing config-get test failure (1 test) unrelated to this plan

## Self-Check: PASSED

All 8 files verified present. All 3 commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-02-28*
