---
phase: 12-workflow-optimization-wiring
plan: 02
subsystem: workflows
tags: [review, doc, framing-pipeline, feature-model, v2-wiring, lens-framing]

# Dependency graph
requires:
  - phase: 10-remaining-cleanup
    provides: dead v1 init routes return errors (init review-phase, init doc-phase)
  - phase: 09-structure-integration
    provides: init feature-op route, 6 research gatherers wired via research-workflow
provides:
  - v2 feature-scoped review workflow (review.md)
  - v2 feature-scoped documentation workflow (doc.md)
  - v2 feature-level pipeline orchestrator (framing-pipeline.md)
  - Dynamic framing context injection in all 4 review agents + doc-writer
  - LENS + ANCHOR_QUESTIONS_PATH propagation to all 6 pipeline stages
affects: [13-e2e-testing, 14-install-validate, plan.md, execute.md]

# Tech tracking
tech-stack:
  added: []
  patterns: [feature-op init route for all pipeline stages, FEATURE.md as single requirements source, auto-chain execute->review->doc]

key-files:
  created: []
  modified:
    - get-shit-done/workflows/review.md
    - get-shit-done/workflows/doc.md
    - get-shit-done/workflows/framing-pipeline.md
    - agents/gsd-review-enduser.md
    - agents/gsd-review-functional.md
    - agents/gsd-review-technical.md
    - agents/gsd-review-quality.md
    - agents/gsd-doc-writer.md

key-decisions:
  - "Requirements sourced from FEATURE.md (3-layer EU/FN/TC), not separate REQUIREMENTS.md"
  - "Review traces written to feature_dir/review/, scoped to feature not phase"
  - "Synthesizer conflict resolution priority: end-user > functional > technical > quality"
  - "Static framing injection slots replaced with dynamic framing context sections"
  - "Execute->Review->Doc auto-chains with human checkpoints only for issues"

patterns-established:
  - "init feature-op: standard init route for all pipeline stage workflows"
  - "LENS propagation: every stage receives lens + anchor questions for framing-aware behavior"
  - "3-layer requirement awareness: EU/FN/TC tracing from FEATURE.md through review to doc"

requirements-completed: [INTG-01, CMD-01]

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 12 Plan 02: Pipeline Stage Wiring Summary

**review.md, doc.md, and framing-pipeline.md rewritten from v1 phase model to v2 feature model with lens-aware framing propagation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T14:34:06Z
- **Completed:** 2026-03-02T14:41:06Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- review.md and doc.md call init feature-op (working v2 route) instead of dead v1 routes
- framing-pipeline.md operates at feature level with FEATURE_SLUG as primary identifier
- All 4 review agents + doc-writer get dynamic framing context instead of static HTML slots
- Doc-writer gains 3-layer requirement awareness (EU/FN/TC + quality) for WHY block extraction
- gsd-review-quality.md duplicate content (52 lines) removed
- LENS and ANCHOR_QUESTIONS_PATH propagated to all 6 pipeline stages

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite review.md and doc.md for v2 feature model** - `ca13176` (feat)
2. **Task 2: Update framing-pipeline.md for feature-level targeting** - `3482b4b` (feat)

## Files Created/Modified
- `get-shit-done/workflows/review.md` - v2 feature-scoped review orchestrator
- `get-shit-done/workflows/doc.md` - v2 feature-scoped documentation orchestrator
- `get-shit-done/workflows/framing-pipeline.md` - v2 feature-level 6-stage pipeline
- `agents/gsd-review-enduser.md` - Dynamic framing context for end-user review focus
- `agents/gsd-review-functional.md` - Dynamic framing context for functional review focus
- `agents/gsd-review-technical.md` - Dynamic framing context for technical review focus
- `agents/gsd-review-quality.md` - Dynamic framing context + duplicate content removed
- `agents/gsd-doc-writer.md` - Dynamic framing context + 3-layer requirement awareness

## Decisions Made
- Requirements sourced from FEATURE.md (3-layer EU/FN/TC) per CONTEXT.md locked decision
- Synthesizer conflict resolution follows priority: end-user > functional > technical > quality
- Static HTML framing slots deleted from agents, replaced with dynamic sections that receive orchestrator-provided framing_context
- Execute->Review and Review->Doc auto-chain without user intervention (human checkpoints only for issues/doc approval)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The entire pipeline (research -> requirements -> plan -> execute -> review -> doc) now speaks v2 feature paths end-to-end
- plan.md and execute.md still need v2 rewiring (covered by Plan 01)
- Ready for Phase 13 E2E testing after remaining Plan 01 wiring

---
*Phase: 12-workflow-optimization-wiring*
*Completed: 2026-03-02*
