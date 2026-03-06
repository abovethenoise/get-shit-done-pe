---
plan: 04
subsystem: workflows
tags: [pipeline, cleanup, role-type, backward-compat, verification]

# Dependency graph
requires:
  - plan: 01
    provides: "Consolidated framing-pipeline.md (deleted capability-orchestrator.md and research-workflow.md)"
  - plan: 02
    provides: "Focus-aware progress routing"
  - plan: 03
    provides: "Scope-fluid review/doc, auto-chain wiring"
provides:
  - "Zero orphaned references to deleted workflows across all live source files"
  - "Correct role_type on all 18 agents matching actual model assignments"
  - "CLI smoke test verification (all routes exit 0)"
  - "TC-06 net line count verification (-332 lines)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "role_type alignment: executors (do work) -> sonnet, judges (synthesize/decide) -> inherit/Opus"

key-files:
  created: []
  modified:
    - commands/gsd/new.md
    - commands/gsd/enhance.md
    - commands/gsd/debug.md
    - commands/gsd/refactor.md
    - commands/gsd/plan.md
    - commands/gsd/execute.md
    - commands/gsd/doc.md
    - agents/gsd-review-enduser.md
    - agents/gsd-review-functional.md
    - agents/gsd-review-technical.md
    - agents/gsd-review-quality.md
    - agents/gsd-planner.md
    - get-shit-done/workflows/plan.md
    - get-shit-done/templates/codebase/structure.md

key-decisions:
  - "gsd-planner role_type changed from executor to judge -- intentionally moves planner to Opus via ROLE_MODEL_MAP (judge -> inherit)"
  - "4 reviewer agents changed from judge to executor -- they do work (read code, produce traces), should run on sonnet"
  - "gsd-review-synthesizer left as judge -- synthesizers decide/consolidate, correct as-is"

patterns-established:
  - "Agent role_type must match ROLE_MODEL_MAP in core.cjs: executor->sonnet, judge->inherit(Opus), quick->haiku"

requirements-completed: [FN-09, TC-06, TC-07, TC-08, EU-04]

# Metrics
duration: 12min
completed: 2026-03-05
---

# Plan Summary: Reference Cleanup and Verification

**Eliminated all orphaned references to deleted workflows (capability-orchestrator, research-workflow), corrected 5 agent role_type mismatches, and verified TC-06 net line reduction of 332 lines across 22 modified files**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-05T23:43:00Z
- **Completed:** 2026-03-05T23:55:00Z
- **Tasks:** 2 (1 code change, 1 verification-only)
- **Files modified:** 14

## Accomplishments
- Replaced all capability-orchestrator.md references with framing-pipeline.md in 7 command files
- Replaced all research-workflow.md references in plan.md workflow and structure.md template
- Fixed 5 agent role_type values: 4 reviewers (judge->executor), planner (executor->judge)
- Verified all 18 agents align with ROLE_MODEL_MAP
- CLI smoke tests pass (slug-resolve, state-snapshot, capability-list, feature-list, roadmap analyze, etc.)
- All @file references resolve to existing files
- TC-06 verified: -332 net line reduction

## Task Commits

Each task was committed atomically:

1. **Task 1: Update deleted workflow refs + fix agent role_type** - `abcaac4` (fix)
2. **Task 2: CLI smoke test + @file scan + net line count** - verification only, no code changes

## Files Created/Modified
- `commands/gsd/new.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/enhance.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/debug.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/refactor.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/plan.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/execute.md` - capability-orchestrator -> framing-pipeline
- `commands/gsd/doc.md` - capability-orchestrator -> framing-pipeline (in success_criteria)
- `agents/gsd-review-enduser.md` - role_type: judge -> executor
- `agents/gsd-review-functional.md` - role_type: judge -> executor
- `agents/gsd-review-technical.md` - role_type: judge -> executor
- `agents/gsd-review-quality.md` - role_type: judge -> executor
- `agents/gsd-planner.md` - role_type: executor -> judge
- `get-shit-done/workflows/plan.md` - research-workflow + capability-orchestrator refs removed
- `get-shit-done/templates/codebase/structure.md` - research-workflow.md -> framing-pipeline.md, plan.md

## Decisions Made
- gsd-planner intentionally moved to judge (Opus) -- planner synthesizes research and makes architectural decisions
- 4 reviewer agents moved to executor (sonnet) -- they do work (read code, produce trace reports)
- gsd-review-synthesizer left untouched at judge -- correct for its consolidation role

## Net Line Count (TC-06)

| File | Before | After | Delta |
|------|--------|-------|-------|
| framing-pipeline.md | 494 | 448 | -46 |
| capability-orchestrator.md | 156 | 0 (deleted) | -156 |
| research-workflow.md | 224 | 0 (deleted) | -224 |
| progress.md | 154 | 197 | +43 |
| review.md (workflow) | 193 | 207 | +14 |
| doc.md (workflow) | 204 | 220 | +16 |
| execute.md (workflow) | 216 | 218 | +2 |
| plan.md (workflow) | 390 | 390 | 0 |
| structure.md (template) | 285 | 285 | 0 |
| review.md (command) | 73 | 92 | +19 |
| new.md (command) | 141 | 141 | 0 |
| enhance.md (command) | 81 | 81 | 0 |
| debug.md (command) | 81 | 81 | 0 |
| refactor.md (command) | 81 | 81 | 0 |
| plan.md (command) | 89 | 89 | 0 |
| execute.md (command) | 90 | 90 | 0 |
| doc.md (command) | 134 | 134 | 0 |
| gsd-review-enduser.md | 80 | 80 | 0 |
| gsd-review-functional.md | 80 | 80 | 0 |
| gsd-review-technical.md | 82 | 82 | 0 |
| gsd-review-quality.md | 63 | 63 | 0 |
| gsd-planner.md | 74 | 74 | 0 |
| **TOTAL** | **3465** | **3133** | **-332** |

## Unplanned Changes

None - plan executed exactly as written.

## Issues Encountered

- `scan-discover` CLI route returns `@file:` temp path reference instead of inline JSON -- pre-existing behavior for large payloads, not a regression

## User Setup Required

None - no external service configuration required.

## Next Steps
- All 4 plans for scope-fluid-pipeline feature are complete
- Ready for review workflow (`/gsd:review scope-fluid-pipeline`)
- All requirements covered: EU-01 through EU-04, FN-01 through FN-09, TC-01 through TC-08

---
*Completed: 2026-03-05*
