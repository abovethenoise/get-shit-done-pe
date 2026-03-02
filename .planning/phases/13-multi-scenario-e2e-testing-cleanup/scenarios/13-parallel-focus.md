# Scenario 13: Parallel Focus

**Goal:** Test that multiple focus groups can operate in parallel without collisions. Verify work streams remain isolated and STATE.md maintains integrity.
**Date:** 2026-03-02
**Status:** FAIL

## Pre-Staging

Uses the workout app workspace at `/tmp/gsd-test-workout` from Plan 01.
Persona: "I want to work on bodyweight exercises AND cardio intervals at the same time."
Sequential after S12.

## Steps

### Step 1: Verify focus system supports parallel focuses

**Command/Workflow:** Check for multi-focus support in CLI, workflows, and state
**Expected result:** Mechanism for tracking multiple active focuses
**Actual result:** No focus system exists (confirmed S10-S12). Specifically:
- No `/gsd:focus` command
- No `focus.md` workflow
- STATE.md has single "Current focus" text field (not a list)
- No CLI route for focus management
**Verdict:** FAIL

Cannot test parallel focus because the focus system does not exist, and even the designed "Current focus" field is singular (not a list).

### Step 2: Analyze workspace isolation for parallel features

**Command/Workflow:** Check directory structure for feature isolation
**Expected result:** Features have independent directories
**Actual result:** Features DO have independent directories:
```
.planning/capabilities/workout-routines/features/bodyweight-exercises/FEATURE.md
.planning/capabilities/workout-routines/features/cardio-intervals/FEATURE.md
```
Each feature gets its own directory. This provides natural filesystem-level isolation. Two features being worked in parallel would not overwrite each other's artifacts.
**Verdict:** PASS (partial)

The directory structure supports parallel work at the feature level. The missing piece is the orchestration layer (focus groups) that would track which features are active and route work accordingly.

### Step 3: Test what happens with multiple features active

**Command/Workflow:** Trace progress.md and resume-project.md for multi-feature handling
**Expected result:** Some mechanism to track multiple active features
**Actual result:**
- progress.md: Routes on phase/plan counts. No feature awareness. Does not scan `.planning/capabilities/` for active features.
- resume-project.md: Routes on STATE.md position (phase/plan) and incomplete work (PLAN without SUMMARY). Does not scan features.
- execute-plan.md: Executes plans sequentially within a phase. No feature parallelism.
**Verdict:** FAIL

No workflow supports parallel feature work. The execution model is strictly sequential: one phase, one plan at a time.

### Step 4: Check STATE.md for multi-focus corruption risk

**Command/Workflow:** Analyze STATE.md schema
**Expected result:** Identify if parallel focus tracking could corrupt state
**Actual result:** STATE.md tracks:
- One current phase
- One current plan within that phase
- One status
- One "Current focus" text label
All singular. There is no list or array structure for parallel tracking. Attempting to track multiple focuses would require schema changes to STATE.md.
**Verdict:** N/A

### Step 5: Verify feature directory independence

**Command/Workflow:** Check if features share any state files
**Expected result:** No shared state between features
**Actual result:** Each feature directory contains only FEATURE.md. No shared state files, no cross-references between feature directories. The capability-level CAPABILITY.md lists all features but does not maintain runtime state.
```
.planning/capabilities/workout-routines/
  CAPABILITY.md           # Lists all features (no runtime state)
  features/
    bodyweight-exercises/
      FEATURE.md          # Independent
    cardio-intervals/
      FEATURE.md          # Independent
```
**Verdict:** PASS

Feature directories are isolated. Parallel work would not cause filesystem collisions.

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S13-F1 | bug | Parallel focus not supported -- no multi-focus tracking in STATE.md or any workflow | OPEN |
| S13-F2 | friction | Execution model is strictly sequential (one phase, one plan at a time) -- no parallel feature execution | OPEN |
| S13-F3 | pass | Feature directories are properly isolated -- filesystem supports parallel work even if orchestration doesn't | OPEN |

## Artifacts Produced
- This scenario report

## Assessment

Parallel focus is not supported. The execution model is single-threaded: one phase, one plan, sequential. Feature directories ARE properly isolated at the filesystem level (each feature has its own directory with no shared state), which means the foundation for parallel work exists in the directory structure. What's missing is the orchestration layer:

1. **State tracking**: STATE.md tracks one active thing (phase/plan), not multiple
2. **Routing**: No workflow can suggest or manage parallel feature work
3. **Progress**: No way to show progress across multiple active features
4. **Focus management**: The designed focus.md workflow (12-04) would have handled this, but it doesn't exist

**For triage:** If parallel feature work is important for v2, the focus group system needs: multi-valued state tracking, parallel-aware progress reporting, and a focus management workflow. If sequential execution is acceptable, the existing phase model works fine for the "one thing at a time" pattern.
