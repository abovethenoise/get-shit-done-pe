# Scenario 01: Greenfield New Project

**Goal:** Test the full greenfield init flow -- init project, create capability, create features, test feature-scoped init routes, test slug resolution, trace framing pipeline.
**Date:** 2026-03-02
**Status:** PARTIAL

## Pre-Staging
- Created workspace: `/tmp/gsd-test-workout` with `git init`
- Clean directory, no `.planning/` or existing code

## Steps

### Step 1: Create Workspace
**Command:** `mkdir -p /tmp/gsd-test-workout && cd /tmp/gsd-test-workout && git init`
**Expected result:** Empty git repo created
**Actual result:** `Initialized empty Git repository in /private/tmp/gsd-test-workout/.git/`
**Verdict:** PASS

### Step 2: Test init project route
**Command:** `node gsd-tools.cjs init project --cwd=/tmp/gsd-test-workout`
**Expected result:** Valid JSON with `project_found` field
**Actual result:** `Error: Unknown init workflow: project`. Route does not exist.
**Verdict:** FAIL

**Corrected command:** `node gsd-tools.cjs init new-project --cwd=/tmp/gsd-test-workout`
**Actual result:** Valid JSON returned:
```json
{
  "project_exists": false,
  "has_codebase_map": false,
  "planning_exists": false,
  "has_existing_code": false,
  "is_brownfield": false,
  "has_git": true
}
```
Note: Field is `project_exists`, not `project_found` as plan stated. Also returns `has_git`, `brave_search_available`, model configs.
**Verdict (corrected):** PASS

### Step 3: Simulate init-project.md workflow
**Workflow:** Plan references `init-project.md` -- this file does not exist. Actual workflow is `new-project.md`.
**Simulated user input:** "I want to build a personal workout app -- balanced cardio and strength training, no gym/weights/machines."

Read `new-project.md`: workflow calls `init new-project`, checks brownfield, runs questioning, research, requirements, roadmap creation. Creates `.planning/` structure with `PROJECT.md`, `STATE.md`, `ROADMAP.md`.

**Capability CRUD test:**
- `node gsd-tools.cjs capability-create workout-routines --cwd=/tmp/gsd-test-workout` -> `Error: Unknown command: capability-create`
- `node gsd-tools.cjs capability-list --cwd=/tmp/gsd-test-workout` -> `Error: Unknown command: capability-list`

**Resolution:** No CLI CRUD routes exist for capabilities/features. The v2 model expects workflows (specifically the discuss-capability flow, which itself doesn't exist as a separate file) to create directories manually via mkdir and file writes.

**Manual creation:** Created `.planning/capabilities/workout-routines/` with `CAPABILITY.md`, and feature directories with `FEATURE.md` files via direct filesystem operations.

**Verdict:** FAIL (CRUD routes don't exist). Feature directory structure works once created manually.

### Step 4: Simulate discuss-capability flow
**Workflow:** Plan references `discuss-capability.md` -- this file does not exist. The closest is `discuss-phase.md` which has been updated to call v2 feature routes.
**Simulated user input:** Workout routines with cardio intervals, bodyweight strength, stretching cooldowns.

**Feature creation:**
- `node gsd-tools.cjs feature-create workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout` -> `Error: Unknown command: feature-create`
- `node gsd-tools.cjs feature-list workout-routines --cwd=/tmp/gsd-test-workout` -> `Error: Unknown command: feature-list`

**Resolution:** Created feature directories and FEATURE.md files manually.

**Verification:** Both feature directories exist with FEATURE.md:
- `.planning/capabilities/workout-routines/features/bodyweight-exercises/FEATURE.md`
- `.planning/capabilities/workout-routines/features/cardio-intervals/FEATURE.md`

**Verdict:** FAIL (feature CRUD routes don't exist). Directory structure validates correctly.

### Step 5: Test feature-scoped init routes
**Command 1:** `node gsd-tools.cjs init plan-feature workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout`
**Result:** Valid JSON. `capability_found: true`, `feature_found: true`, `feature_dir: ".planning/capabilities/workout-routines/features/bodyweight-exercises"`, plus model configs, research/plan flags.
**Verdict:** PASS

**Command 2:** `node gsd-tools.cjs init execute-feature workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout`
**Result:** Valid JSON. `capability_found: true`, `feature_found: true`, plans/summaries arrays, milestone info.
**Verdict:** PASS

**Command 3:** `node gsd-tools.cjs init feature-op workout-routines bodyweight-exercises review --cwd=/tmp/gsd-test-workout`
**Result:** Valid JSON. `operation: "review"`, `capability_found: true`, `feature_found: true`.
**Verdict:** PASS

### Step 6: Test slug-resolve
**Command:** `node gsd-tools.cjs slug-resolve "workout" --cwd=/tmp/gsd-test-workout`
**Expected result:** Resolves to workout-routines capability
**Actual result:** `Error: Unknown command: slug-resolve`
**Verdict:** FAIL (route does not exist)

### Step 7: Simulate framing-pipeline trace
**Workflow:** Plan references `framing-pipeline.md` -- this file does not exist.
**Actual state:** No standalone framing-pipeline workflow. The pipeline is embedded in `discuss-phase.md` (stages: discuss -> plan -> execute, with auto-advance). Pipeline stages use:
- `plan-phase.md` (planning, calls `init plan-feature` internally)
- `execute-phase.md` / `execute-plan.md` (execution, calls `init execute-feature`)
- No standalone `review.md` or `doc.md` workflow files found at expected paths

**@file reference check:** The plan references `research-workflow.md` -- does not exist. The `plan-phase.md` has its own research step built in (calls gsd-phase-researcher agent).

**Verdict:** PARTIAL (pipeline works through existing v1-named workflows that call v2 routes, but plan's referenced file paths are all wrong)

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S01-F1 | bug | `init project` route does not exist; correct is `init new-project` | OPEN |
| S01-F2 | bug | `capability-create`, `capability-list` CLI routes do not exist | OPEN |
| S01-F3 | bug | `feature-create`, `feature-list` CLI routes do not exist | OPEN |
| S01-F4 | bug | `slug-resolve` CLI route does not exist | OPEN |
| S01-F5 | friction | 6 v2 workflow files referenced in plan context do not exist (init-project.md, discuss-capability.md, discuss-feature.md, framing-pipeline.md, plan.md, execute.md) | OPEN |
| S01-F6 | friction | `research-workflow.md` does not exist | OPEN |

## Summary

The feature-scoped init routes (`init plan-feature`, `init execute-feature`, `init feature-op`) work correctly and return well-structured JSON with all expected fields. The v2 directory model (`.planning/capabilities/{cap}/features/{feat}/`) is fully functional once created.

However, the v2 CRUD layer (capability-create, feature-create, capability-list, feature-list, slug-resolve) was never implemented as CLI routes. The workflows that would use them (init-project.md, discuss-capability.md, discuss-feature.md, framing-pipeline.md) also don't exist as separate files. The v1 workflow names were retained in Phase 12 and updated to call v2 init routes internally.

The core issue: v2 was designed (in Phase 12) as internal rewrites of v1 workflows, not as new standalone workflows. The plan's CRUD route names appear to be aspirational (from CONTEXT.md design discussions) rather than implemented.

## Artifacts Produced
- `/tmp/gsd-test-workout/.planning/capabilities/workout-routines/CAPABILITY.md`
- `/tmp/gsd-test-workout/.planning/capabilities/workout-routines/features/bodyweight-exercises/FEATURE.md`
- `/tmp/gsd-test-workout/.planning/capabilities/workout-routines/features/cardio-intervals/FEATURE.md`
