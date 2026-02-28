---
phase: 06-workflows-and-commands
plan: 01
subsystem: workflows
tags: [discovery-brief, framing, lenses, templates, anchor-questions]

requires:
  - phase: 01-foundation
    provides: fillTemplate() pattern, template file convention, capability data model
provides:
  - Discovery Brief template with 4 lens-specific Specification variants
  - fillTemplate() discovery-brief type for scaffolding briefs
  - 4 framing anchor question files (debug/new/enhance/refactor)
  - framing-lenses.md authoritative lens reference with MVU, exit signals, cross-framing rules
affects: [06-02, 06-03, 06-04, 06-05]

tech-stack:
  added: []
  patterns:
    - "Lens-specific template variants via HTML comment blocks"
    - "Anchor question files with purpose annotations and branching hints"

key-files:
  created:
    - get-shit-done/templates/discovery-brief.md
    - get-shit-done/framings/debug/anchor-questions.md
    - get-shit-done/framings/new/anchor-questions.md
    - get-shit-done/framings/enhance/anchor-questions.md
    - get-shit-done/framings/refactor/anchor-questions.md
    - get-shit-done/references/framing-lenses.md
  modified:
    - get-shit-done/bin/lib/template.cjs

key-decisions:
  - "Discovery Brief Specification uses HTML comment blocks for lens variants -- all 4 variants present in template, workflow uncomments the active one"
  - "Anchor questions use 5 per lens (top of 3-5 range) with branching hints for adaptive follow-up"
  - "Brief scaffolding path is .planning/capabilities/{slug}/BRIEF.md via cmdTemplateFill"

patterns-established:
  - "Anchor question format: title, purpose, branching hints per question"
  - "Lens reference as single source of truth for MVU slots, exit signals, cross-framing rules"

requirements-completed: [WKFL-01, WKFL-02, WKFL-03, WKFL-04, WKFL-05, WKFL-07]

duration: 3min
completed: 2026-02-28
---

# Phase 6 Plan 01: Foundation Artifacts Summary

**Discovery Brief template with 4 lens-specific Specification variants, 5 anchor questions per framing with branching hints, and framing-lenses.md reference defining MVU slots, exit signals, and cross-framing detection rules**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T23:31:32Z
- **Completed:** 2026-02-28T23:34:31Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Discovery Brief template with all 6 schema sections and 4 lens-specific Specification variants
- fillTemplate() extended with discovery-brief type and cmdTemplateFill CLI case writing to .planning/capabilities/{slug}/BRIEF.md
- 4 anchor question files (5 questions each) embodying detective/architect/editor/surgeon thinking modes
- framing-lenses.md reference covering MVU completion criteria, exit signals, cross-framing detection, compound work precedence, and brief reset behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Discovery Brief template and extend fillTemplate()** - `bed6a39` (feat)
2. **Task 2: Create framing anchor questions and lens reference document** - `8984a15` (feat)

## Files Created/Modified

- `get-shit-done/templates/discovery-brief.md` - Discovery Brief template with YAML frontmatter and all schema sections
- `get-shit-done/bin/lib/template.cjs` - Extended with discovery-brief fillTemplate() case and cmdTemplateFill CLI case
- `get-shit-done/framings/debug/anchor-questions.md` - Detective-mode questions (symptom -> root cause)
- `get-shit-done/framings/new/anchor-questions.md` - Architect-mode questions (why -> shape)
- `get-shit-done/framings/enhance/anchor-questions.md` - Editor-mode questions (current state -> fit)
- `get-shit-done/framings/refactor/anchor-questions.md` - Surgeon-mode questions (current design -> migration path)
- `get-shit-done/references/framing-lenses.md` - Authoritative lens behavioral specification

## Decisions Made

- Discovery Brief Specification section uses HTML comment blocks for all 4 lens variants in the template. Workflows uncomment the active variant based on primary_lens. This keeps the template as a single file rather than 4 separate templates.
- Used 5 anchor questions per lens (top of the 3-5 range specified in CONTEXT.md). Each question has purpose annotations and adaptive branching hints for the "fixed skeleton + adaptive muscles" pattern.
- Brief scaffolding writes to `.planning/capabilities/{slug}/BRIEF.md` per RESEARCH.md canonical path recommendation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All foundation artifacts in place for framing workflow plans (06-02 through 06-05)
- fillTemplate() ready to scaffold briefs from any framing workflow
- Anchor questions ready for gather-synthesize Layer 4 injection
- framing-lenses.md provides the behavioral spec all downstream workflows reference

---
*Phase: 06-workflows-and-commands*
*Completed: 2026-02-28*
