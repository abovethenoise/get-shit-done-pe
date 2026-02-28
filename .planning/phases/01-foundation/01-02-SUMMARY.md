---
phase: 01-foundation
plan: 02
subsystem: templates
tags: [capability, feature, review, docs, templates, core-helpers, directory-lookup]

requires:
  - phase: 01-foundation-01
    provides: "frontmatter parsing with js-yaml"
provides:
  - "CAPABILITY.md template (8 sections, type discriminator)"
  - "FEATURE.md template (3-layer EU/FN/TC requirements, trace table)"
  - "REVIEW.md template (per-requirement trace, multi-dimensional evidence)"
  - "DOCS.md template (3-file output structure)"
  - "findCapabilityInternal helper in core.cjs"
  - "findFeatureInternal helper in core.cjs"
  - "Hardened generateSlugInternal (slash rejection, empty-after-sanitization)"
affects: [01-foundation-03, capability-commands, feature-commands, review-agent, docs-agent]

tech-stack:
  added: []
  patterns: [type-discriminator-frontmatter, partial-creation-detection, parent-validation-before-child-lookup]

key-files:
  created:
    - get-shit-done/templates/capability.md
    - get-shit-done/templates/feature.md
    - get-shit-done/templates/review.md
    - get-shit-done/templates/docs.md
  modified:
    - get-shit-done/bin/lib/core.cjs
    - tests/core.test.cjs

key-decisions:
  - "Templates use YAML frontmatter type discriminator (Kubernetes kind pattern)"
  - "findCapabilityInternal detects partial creation (dir exists but no CAPABILITY.md)"
  - "generateSlugInternal returns empty string (not null) for slash-containing and unicode-only input"

patterns-established:
  - "Type discriminator: all artifact templates have type field in frontmatter for machine identification"
  - "Directory lookup pattern: check dir exists AND required .md file exists (partial creation detection)"
  - "Parent validation: findFeatureInternal validates capability exists before looking up feature"

requirements-completed: [FOUND-01, FOUND-06, REQS-01, REQS-02]

duration: 4min
completed: 2026-02-28
---

# Phase 1 Plan 02: Templates & Core Helpers Summary

**Four v2 artifact templates (CAPABILITY, FEATURE, REVIEW, DOCS) with type-discriminator frontmatter, plus findCapabilityInternal/findFeatureInternal directory lookup helpers in core.cjs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T14:58:59Z
- **Completed:** 2026-02-28T15:02:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created all four v2 artifact templates matching CONTEXT.md locked decisions
- FEATURE.md template enforces 3-layer requirement format (EU-xx, FN-xx, TC-xx) with trace table at top
- Added findCapabilityInternal and findFeatureInternal to core.cjs with partial-creation detection
- Hardened generateSlugInternal to reject slash injection and handle unicode-to-empty edge case

## Task Commits

Each task was committed atomically:

1. **Task 1: Create v2 artifact templates** - `bcc356c` (feat)
2. **Task 2 RED: Failing tests** - `1097ec1` (test)
3. **Task 2 GREEN: Implementation** - `3de0d37` (feat)

## Files Created/Modified
- `get-shit-done/templates/capability.md` - CAPABILITY.md template with 8 sections (goal, domain model, invariants, boundaries, architecture spine, dependencies, features, decisions)
- `get-shit-done/templates/feature.md` - FEATURE.md template with trace table at top, EU/FN/TC requirement layers, decisions at bottom
- `get-shit-done/templates/review.md` - REVIEW.md template with verdict summary, per-requirement trace with multi-dimensional evidence, reviewer notes
- `get-shit-done/templates/docs.md` - Documentation template defining 3-file output (design.md, features.md, lessons.md) targeting .documentation/{capability}/
- `get-shit-done/bin/lib/core.cjs` - Added findCapabilityInternal, findFeatureInternal, hardened generateSlugInternal
- `tests/core.test.cjs` - Added 17 new tests for capability/feature lookup and slug hardening

## Decisions Made
- Templates use YAML frontmatter `type` discriminator (Kubernetes `kind` pattern) for machine identification
- findCapabilityInternal detects partial creation: directory exists but CAPABILITY.md missing returns `{ found: false, reason: 'no_capability_file' }`
- generateSlugInternal returns empty string (not null) for slash-containing and unicode-only input, allowing callers to distinguish "no input" (null) from "bad input" (empty string)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four templates ready for consumption by CLI commands (Plan 03: capability.cjs, feature.cjs)
- findCapabilityInternal and findFeatureInternal ready as primitives for Plan 03
- Pre-existing config-get test failure (1 test) is unrelated to this plan's changes

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-02-28*
