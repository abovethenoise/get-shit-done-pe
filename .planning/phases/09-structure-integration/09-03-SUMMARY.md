---
phase: 09-structure-integration
plan: 03
subsystem: toolchain
tags: [v2-init, state, pipeline-invariants, agent-contracts, capability-feature]

# Dependency graph
requires:
  - phase: 09-structure-integration
    plan: 01
    provides: "Clean command surface with v2 commands"
  - phase: 09-structure-integration
    plan: 02
    provides: "Research gatherers wired into pipeline"
provides:
  - "v2 init functions for capability/feature pipeline operations"
  - "v2 STATE.md field support (active_capability, active_feature, pipeline_position, last_agent_summary)"
  - "Pipeline invariants reference document (10 invariants)"
  - "Formal reads/writes + artifact_contract declarations on 4 original pipeline agents"
affects: [10-prose-audit, 11-automated-testing, 12-install]

# Tech tracking
tech-stack:
  added: []
  patterns: ["v2 init functions alongside v1 (bootstrap trap pattern)", "artifact_contract sections in agent .md files"]

key-files:
  created:
    - "get-shit-done/references/pipeline-invariants.md"
  modified:
    - "get-shit-done/bin/lib/init.cjs"
    - "get-shit-done/bin/lib/state.cjs"
    - "get-shit-done/bin/gsd-tools.cjs"
    - "agents/gsd-executor.md"
    - "agents/gsd-planner.md"
    - "agents/gsd-plan-checker.md"
    - "agents/gsd-verifier.md"

key-decisions:
  - "v2 init functions use findCapabilityInternal/findFeatureInternal from core.cjs (already existed in project repo)"
  - "Active capability/Active feature fields added alongside existing Current capability/Current feature (both supported)"
  - "Pipeline invariants doc uses What/Why/Where/Verify format per plan spec"
  - "artifact_contract sections added after role section in each agent"

patterns-established:
  - "v2 functions coexist with v1 -- no replacements, only additions"
  - "Agent artifact contracts make pipeline chain visible and verifiable"

requirements-completed: [DIR-01, DIR-02, DIR-03]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 9 Plan 03: v2 Init/State Functions, Pipeline Invariants, and Agent Contracts Summary

**v2 capability/feature init functions added alongside v1, state.cjs supports v2 STATE.md fields, pipeline invariants formally documented, and 4 original agents declare formal artifact contracts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T14:02:04Z
- **Completed:** 2026-03-01T14:10:04Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added 4 v2 init functions (cmdInitPlanFeature, cmdInitExecuteFeature, cmdInitFeatureOp, cmdInitFeatureProgress) to init.cjs alongside all v1 functions
- Registered 4 new CLI routes (plan-feature, execute-feature, feature-op, feature-progress) in gsd-tools.cjs
- Added v2 field extraction to state.cjs: Active capability, Active feature, Pipeline position, Last agent summary in buildStateFrontmatter, cmdStateSnapshot, cmdStateAdvancePlan
- Updated cmdStateUpdateProgress to count plans/summaries from capabilities/*/features/*/ alongside phases/
- Created pipeline-invariants.md with all 10 invariants (What/Why/Where/Verify format, ~175 lines)
- Added reads/writes frontmatter and artifact_contract sections to gsd-executor, gsd-planner, gsd-plan-checker, gsd-verifier
- Verified DIR-01 (init-project creates capabilities/ not phases/) and DIR-02 (.documentation/ structure) via research doc findings

## Task Commits

Each task was committed atomically:

1. **Task 1: Add v2 init functions and state.cjs v2 fields** - `b9dc2a3` (feat)
2. **Task 2: Create pipeline invariants doc and add agent artifact contracts** - `92c0e4c` (feat)

## Files Created/Modified

- `get-shit-done/bin/lib/init.cjs` - 4 new v2 init functions, import findCapabilityInternal/findFeatureInternal
- `get-shit-done/bin/lib/state.cjs` - v2 field extraction in buildStateFrontmatter, cmdStateSnapshot, cmdStateAdvancePlan; v2 capability counting in cmdStateUpdateProgress
- `get-shit-done/bin/gsd-tools.cjs` - 4 new CLI routes for v2 init commands
- `get-shit-done/references/pipeline-invariants.md` - NEW: 10 pipeline invariants with What/Why/Where/Verify + quick reference table
- `agents/gsd-executor.md` - reads/writes frontmatter + artifact_contract section
- `agents/gsd-planner.md` - reads/writes frontmatter + artifact_contract section
- `agents/gsd-plan-checker.md` - reads/writes frontmatter + artifact_contract section
- `agents/gsd-verifier.md` - reads/writes frontmatter + artifact_contract section

## Decisions Made

- v2 init functions use the existing `findCapabilityInternal` and `findFeatureInternal` helpers from core.cjs (project repo already had these from earlier Phase 2 work)
- Added `Active capability` / `Active feature` field extraction alongside existing `Current capability` / `Current feature` -- both naming conventions are supported for backward compatibility
- Pipeline invariants document kept concise (~175 lines) as a quick-reference, with implementation file paths from the pipeline research

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Project repo core.cjs already had findCapabilityInternal/findFeatureInternal**
- **Found during:** Task 1 (Step 3 verification)
- **Issue:** Plan said these functions "already exist" in the installed copy at ~/.claude/get-shit-done -- they did not exist there, but DID exist in the project repo copy at get-shit-done-pe/get-shit-done/bin/lib/core.cjs
- **Fix:** Used the project repo copies (which are the correct target for this plan) -- no changes needed to core.cjs
- **Impact:** None -- the project repo was the correct working copy all along

**2. [Rule 3 - Blocking] Project repo files significantly diverged from installed copies**
- **Found during:** Task 1 (initial edit attempt)
- **Issue:** Initially edited ~/.claude/get-shit-done/ files instead of get-shit-done-pe/ project repo files. The project repo has more evolved code (cmdInitProject, cmdInitFramingDiscovery, capability.cjs, etc.)
- **Fix:** Reverted installed copy changes, applied all edits to project repo copies
- **Impact:** No wasted work -- caught before commit

---

**Total deviations:** 2 auto-fixed (blocking -- target file identification)
**Impact on plan:** None. Correct files identified and modified.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness

- v2 init functions ready for use by capability/feature workflows
- state.cjs handles both v1 phase fields and v2 capability/feature fields
- Pipeline invariants formally documented for reference during future phases
- Agent artifact contracts make the pipeline chain visible for Phase 10 prose audit
- All v1 functions remain intact -- bootstrap trap fully respected

## Self-Check: PASSED

- All 8 files verified on disk
- Both task commits verified: b9dc2a3, 92c0e4c
- Syntax check passes for all .cjs files
- All 4 agents have reads/writes frontmatter and artifact_contract sections
- Pipeline invariants doc has 10 invariant sections

---
*Phase: 09-structure-integration*
*Completed: 2026-03-01*
