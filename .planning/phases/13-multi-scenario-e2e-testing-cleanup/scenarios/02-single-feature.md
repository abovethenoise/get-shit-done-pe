# Scenario 02: Single Feature Pipeline

**Goal:** Test that a single feature can enter the pipeline without requiring a full capability discussion. Verify feature isolation.
**Date:** 2026-03-02
**Status:** PARTIAL

## Pre-Staging
- Used workspace from S01: `/tmp/gsd-test-workout`
- Existing capabilities: `workout-routines` with features `bodyweight-exercises`, `cardio-intervals`
- Persona: "I just want to build the stretching-cooldown feature. I know what I want."

## Steps

### Step 1: Create a standalone feature
**Command:** `node gsd-tools.cjs feature-create workout-routines stretching-cooldowns --cwd=/tmp/gsd-test-workout`
**Expected result:** Feature directory created via CLI
**Actual result:** `Error: Unknown command: feature-create` -- same as S01-F3
**Resolution:** Created directory manually: `mkdir -p .planning/capabilities/workout-routines/features/stretching-cooldowns`
**Verdict:** FAIL (CLI route missing, manual creation works)

### Step 2: Populate FEATURE.md with workout-domain requirements
**Action:** Wrote FEATURE.md with realistic requirements:
- EU-01: User can select a stretching routine after workout
- FN-01: System generates cooldown sequence based on workout type
- TC-01: Cooldown data stored in JSON format
**Result:** File created at `.planning/capabilities/workout-routines/features/stretching-cooldowns/FEATURE.md`
**Verdict:** PASS

### Step 3: Test feature-scoped init routes for the new feature
**Command:** `node gsd-tools.cjs init plan-feature workout-routines stretching-cooldowns --cwd=/tmp/gsd-test-workout`
**Result:** Valid JSON:
```json
{
  "capability_found": true,
  "feature_found": true,
  "feature_slug": "stretching-cooldowns",
  "feature_dir": ".planning/capabilities/workout-routines/features/stretching-cooldowns",
  "has_research": false,
  "has_plans": false,
  "plan_count": 0
}
```
`feature_found: true` and correct `feature_dir` path confirmed.
**Verdict:** PASS

### Step 4: Simulate plan.md workflow trace
**Workflow:** Plan references `plan.md` -- does not exist. Actual workflow is `plan-phase.md`.
**Key finding:** `plan-phase.md` calls `init plan-phase "$PHASE"` (v1 phase route), NOT `init plan-feature` (v2 feature route). The workflow:
- Expects `PHASE` as input (a phase number), not `CAPABILITY_SLUG` and `FEATURE_SLUG`
- Reads `phase_dir`, `phase_number`, `phase_name` from init JSON
- Does NOT reference FEATURE.md or feature directories
- No `CAPABILITY_SLUG` or `FEATURE_SLUG` inputs exist in the workflow

**Conclusion:** The plan workflow has NOT been rewritten for the v2 feature model. It still operates on phases. The v2 init routes (`init plan-feature`) exist but are orphaned -- nothing calls them.
**Verdict:** FAIL (workflow not wired to v2 feature model)

### Step 5: Simulate discuss-feature.md flow
**Workflow:** `discuss-feature.md` does not exist. The only discuss workflow is `discuss-phase.md`.
**Trace:** `discuss-phase.md` uses "feature" and "capability" as conceptual terms in its questioning guidance, but does not:
- Call any v2 feature init routes
- Create feature directories
- Read FEATURE.md files
- Accept capability/feature slugs as inputs

It operates entirely in the v1 phase model: takes a phase number, runs discuss -> plan -> execute pipeline using `init plan-phase` and `init execute-phase`.
**Verdict:** FAIL (workflow does not exist)

### Step 6: Verify feature isolation
**Test:** Created `stretching-cooldowns` feature; verified `bodyweight-exercises` and `cardio-intervals` unchanged.
**Result:** All 3 features exist independently:
```
bodyweight-exercises/
cardio-intervals/
stretching-cooldowns/
```
Each has its own FEATURE.md. Creating one does not affect others.

**Init route isolation:** `init plan-feature workout-routines stretching-cooldowns` returns only stretching-cooldowns data. `init plan-feature workout-routines bodyweight-exercises` returns only bodyweight-exercises data. No cross-contamination.
**Verdict:** PASS

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S02-F1 | bug | `plan-phase.md` workflow calls `init plan-phase` (v1), not `init plan-feature` (v2). Feature pipeline is not wired. | OPEN |
| S02-F2 | bug | `discuss-feature.md` workflow does not exist. No separate feature discussion flow. | OPEN |
| S02-F3 | bug | No workflow file calls `init plan-feature`, `init execute-feature`, or `init feature-op`. These routes are orphaned. | OPEN |
| S02-F4 | friction | Single-feature pipeline entry requires manual directory creation (no CRUD routes) and has no workflow path to reach planning without going through the phase model. | OPEN |

## Summary

Feature isolation works perfectly at the directory and init-route level. The v2 data model (capabilities/features) and the v2 init routes are functional. However, the v2 pipeline is NOT wired end-to-end:

1. **Init routes exist** (`init plan-feature`, `init execute-feature`, `init feature-op`) and return correct JSON
2. **No workflow calls them** -- all workflows still use v1 phase routes (`init plan-phase`, `init execute-phase`)
3. **No CRUD layer** -- capabilities and features must be created manually
4. **No feature-specific workflows** -- `discuss-feature.md`, `plan.md`, `execute.md` don't exist

The Phase 12 STATE.md claims "Pure v2 rewrite of plan.md, execute.md, execute-plan.md -- all call feature-scoped init routes" but the actual workflow files (`plan-phase.md`, `execute-phase.md`, `execute-plan.md`) still call v1 phase init routes.

## Artifacts Produced
- `/tmp/gsd-test-workout/.planning/capabilities/workout-routines/features/stretching-cooldowns/FEATURE.md`
