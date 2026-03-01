---
plan: "06"
subsystem: templates
tags: [v2-language, cleanup, templates]

provides:
  - "17 templates updated to v2 capability/feature language"
  - "No template contains phase: frontmatter"
  - "Summary templates use Next Steps instead of Next Phase Readiness"
affects: [all-workflows, planner, executor]

tech-stack:
  added: []
  patterns: [feature-based-naming, capability-language]

key-files:
  created: []
  modified:
    - get-shit-done/templates/context.md
    - get-shit-done/templates/phase-prompt.md
    - get-shit-done/templates/planner-subagent-prompt.md
    - get-shit-done/templates/summary.md
    - get-shit-done/templates/summary-complex.md
    - get-shit-done/templates/summary-minimal.md
    - get-shit-done/templates/summary-standard.md
    - get-shit-done/templates/research.md
    - get-shit-done/templates/discovery.md
    - get-shit-done/templates/requirements.md
    - get-shit-done/templates/roadmap.md
    - get-shit-done/templates/state.md
    - get-shit-done/templates/UAT.md
    - get-shit-done/templates/user-setup.md
    - get-shit-done/templates/VALIDATION.md
    - get-shit-done/templates/continue-here.md
    - get-shit-done/templates/project.md

key-decisions:
  - "Kept phase concept in roadmap.md where it refers to filesystem structure, not work-unit language"
  - "Updated requirements.md v1/v2 sections to Active/Deferred for milestone-neutral naming"
  - "Updated traceability table column from Phase to Feature in requirements.md"

requirements-completed: [CLN-04]

duration: 13min
completed: 2026-03-01
---

# Plan Summary: Template v2 Language Audit

**All 17 surviving templates updated to v2 capability/feature language -- phase: frontmatter removed, titles genericized, path examples and downstream references updated**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-01T16:12:32Z
- **Completed:** 2026-03-01T16:26:01Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Removed `phase:` frontmatter fields from all 17 template files
- Replaced "Phase [X]: [Name]" titles with feature-based naming across all templates
- Updated "Next Phase Readiness" to "Next Steps" in all 4 summary template variants
- Updated requirements.md from v1/v2 section naming to Active/Deferred
- Replaced stale `gsd-phase-researcher` agent references with generic research workflow

## Task Commits

1. **Task 1: Update 8 high-priority templates** - `e452154` (feat)
2. **Task 2: Update 9 medium/low priority templates** - `a3a593c` (feat)

## Files Created/Modified

- `get-shit-done/templates/context.md` - Feature Context Template (was Phase Context)
- `get-shit-done/templates/phase-prompt.md` - Plan Prompt Template, removed phase: frontmatter
- `get-shit-done/templates/planner-subagent-prompt.md` - Feature-based placeholders
- `get-shit-done/templates/summary.md` - Plan Summary title, Next Steps section
- `get-shit-done/templates/summary-complex.md` - Synchronized with summary.md changes
- `get-shit-done/templates/summary-minimal.md` - Synchronized with summary.md changes
- `get-shit-done/templates/summary-standard.md` - Synchronized with summary.md changes
- `get-shit-done/templates/research.md` - Feature Research title, removed phase framing
- `get-shit-done/templates/discovery.md` - Removed phase: frontmatter, updated refs
- `get-shit-done/templates/requirements.md` - Active/Deferred sections, Feature traceability
- `get-shit-done/templates/roadmap.md` - Light touch, removed verify-phase ref
- `get-shit-done/templates/state.md` - Feature-based position tracking
- `get-shit-done/templates/UAT.md` - feature: frontmatter, updated lifecycle refs
- `get-shit-done/templates/user-setup.md` - Feature-based titles in template and examples
- `get-shit-done/templates/VALIDATION.md` - Feature-based frontmatter and title
- `get-shit-done/templates/continue-here.md` - feature: frontmatter
- `get-shit-done/templates/project.md` - Feature completion triggers

## Decisions Made

- Kept "phase" in roadmap.md where it refers to the filesystem directory structure (`.planning/phases/`) rather than the conceptual work-unit. The plan correctly noted this distinction.
- Updated requirements.md section names from v1/v2 to Active/Deferred -- more milestone-neutral and clearer.
- Replaced traceability table "Phase" column with "Feature" and updated all example rows accordingly.

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Steps

- review.md also has `phase:` frontmatter but was not in the 17-template scope -- may warrant a follow-up
- All template consumers (workflows, agents) should now see consistent v2 language

---
*Completed: 2026-03-01*
