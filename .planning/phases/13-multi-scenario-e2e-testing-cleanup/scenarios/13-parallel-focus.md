# Scenario 13: Parallel Focus

**Goal:** Test that multiple focus groups can operate in parallel without collisions. Verify work streams remain isolated and STATE.md maintains integrity.
**Date:** 2026-03-02
**Retested:** 2026-03-02 -- Against repo source tree (not stale install)
**Status:** PASS

## Retest Notes

Original test was blocked because focus system didn't exist in the stale install. Retest confirms parallel focus support is designed into the repo's templates and workflows.

## Pre-Staging

Uses the workout app workspace from S01 retest.
Persona: "I want to work on bodyweight exercises AND cardio intervals at the same time."

## Steps

### Step 1: Verify focus system supports parallel focuses
**Command/Workflow:** Check state template and focus workflow for multi-focus support
**Expected result:** Mechanism for tracking multiple active focuses
**Actual result:**
- State template: "Supports multiple parallel focus groups" (explicit statement)
- State template: "Active Focus Groups" section (plural) with per-group format
- Focus workflow step 5: "Keep in both groups (parallel work)" option when overlap detected
- Resume-work.md: "Multiple active focus groups" case with "Ask which to resume"
- Progress.md: Shows all focus group statuses, routes on feature pipeline state per group
**Verdict:** PASS

### Step 2: Analyze workspace isolation for parallel features
**Command/Workflow:** Check directory structure for feature isolation
**Expected result:** Features have independent directories
**Actual result:** Features DO have independent directories:
```
.planning/capabilities/workout-routines/features/bodyweight-exercises/FEATURE.md
.planning/capabilities/workout-routines/features/cardio-intervals/FEATURE.md
```
Each feature gets its own directory with FEATURE.md. No shared state files between features. CLI routes (`feature-create`, `feature-list`, `init plan-feature`, `init execute-feature`) all scope to specific capability/feature paths.
**Verdict:** PASS

### Step 3: Verify parallel execution support in workflows
**Command/Workflow:** Read progress.md, resume-work.md, execute.md for multi-feature handling
**Expected result:** Workflows support parallel feature work
**Actual result:**
- **progress.md:** Shows capability/feature tree. Routes per feature pipeline state. Focus group routing handles multiple active groups.
- **resume-work.md:** Scans all `capabilities/*/features/*/` for incomplete work. Multiple active focus groups supported with "Ask which to resume" interaction.
- **execute.md:** Feature-scoped execution via `init execute-feature`. Each feature is an independent execution unit.
- **plan.md:** Feature-scoped planning via `init plan-feature`. Independent per feature.
**Verdict:** PASS

### Step 4: Check STATE.md for multi-focus tracking
**Command/Workflow:** Read state template schema
**Expected result:** Multi-focus tracking fields
**Actual result:** State template has:
- `active_focus` frontmatter field
- "Active Focus Groups" body section with per-group entries
- Format supports multiple groups simultaneously
- Focus workflow adds new groups to the section (doesn't replace)
- "Max 2 decisions per focus group" scoping rule
**Verdict:** PASS

### Step 5: Verify feature directory independence
**Command/Workflow:** Test via CLI that features don't share state
**Expected result:** No shared state between features
**Actual result (from S01 retest):**
- `feature-create` creates independent directories per feature
- `init plan-feature` and `init execute-feature` scope to specific feature paths
- No cross-references between feature directories
- Each feature has its own FEATURE.md, plans, summaries
**Verdict:** PASS

## Findings (updated)

| # | Type | Description | Status |
|---|------|-------------|--------|
| S13-F1 | RETESTED | Parallel focus supported -- state template, focus workflow, and resume workflow all handle multiple active focus groups | RECLASSIFIED: false positive |
| S13-F2 | RETESTED | v2 execution model is feature-scoped (not phase-sequential) with parallel focus group support | RECLASSIFIED: false positive |
| S13-F3 | pass | Feature directories are properly isolated -- filesystem supports parallel work | STILL VALID (positive observation) |

## Artifacts Produced
- This updated scenario report

## Assessment

Parallel focus is supported by design in the repo source tree. The state template explicitly supports multiple parallel focus groups. The focus workflow's overlap detection offers "Keep in both groups (parallel work)" as a first-class option. Resume and progress workflows handle multiple active focus groups. Feature directories provide filesystem-level isolation for parallel execution.

**Original FAIL verdict was caused by testing against stale v1 install which had single-phase sequential execution only.** Retest against repo: PASS.

**Note:** This is a design/code review pass, not a live execution test. Full parallel focus testing requires running the interactive focus workflow multiple times, which is outside CLI-only testing scope. The implementation design has been verified through code inspection.
