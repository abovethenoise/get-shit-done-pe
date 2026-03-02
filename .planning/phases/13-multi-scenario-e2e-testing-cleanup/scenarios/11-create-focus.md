# Scenario 11: Create Focus

**Goal:** Test that a user can set a focus to guide work priority within the workout app. Verify STATE.md and ROADMAP.md update to reflect the active focus.
**Date:** 2026-03-02
**Retested:** 2026-03-02 -- Against repo source tree (not stale install)
**Status:** PASS

## Retest Notes

Original test ran against stale `~/.claude/` install which lacked the focus command and workflow entirely. Retest confirms both exist in the repo with full implementation.

## Pre-Staging

Uses the workout app workspace from S01 retest.
Persona: "I want to focus on the bodyweight exercises feature first."

## Steps

### Step 1: Read /gsd:focus command
**Command/Workflow:** `cat commands/gsd/focus.md`
**Expected result:** Focus command file exists with instructions for setting focus
**Actual result:** File exists (1519 bytes). Defines:
- `name: gsd:focus`
- `description: Create a focus group -- bundle capabilities/features for a sprint with dependency ordering`
- `argument-hint: "[focus group name]"`
- Delegates to `@~/.claude/get-shit-done/workflows/focus.md`
- Success criteria: focus group created, dependencies traced, overlap detected, ROADMAP.md and STATE.md updated
**Verdict:** PASS

### Step 2: Identify how focus is set
**Command/Workflow:** Read `get-shit-done/workflows/focus.md`
**Expected result:** Programmatic mechanism to set/track focus
**Actual result:** Full 9-step workflow (199 lines):
1. **Initialize:** Call `init feature-progress` for capability/feature overview, read ROADMAP.md for existing focus groups
2. **Q&A Goal:** Ask user for focus group name and one-sentence goal
3. **Q&A Scope:** Ask user to list capabilities/features, resolve each via `slug-resolve`
4. **Dependency Trace:** Explicit deps from CAPABILITY.md/FEATURE.md + implicit deps from shared file paths
5. **DAG Construction:** Topological sort into waves, cycle detection with user resolution
6. **Overlap Detection:** Compare against existing active focus groups, offer merge/parallel/remove
7. **Priority Ordering:** Present wave-based order, allow user adjustments within wave constraints
8. **Write ROADMAP.md:** Add focus group section with goal, priority order, and status checkboxes
9. **Update STATE.md:** Add to Active Focus Groups section, set active_focus
**Verdict:** PASS

### Step 3: Verify workflows use focus for routing
**Command/Workflow:** Read progress.md and resume-work.md from repo
**Expected result:** Workflows use focus to filter/prioritize
**Actual result:**
- **progress.md:** Routes on `focus_groups` and `active_features` from `init feature-progress`. Has focus group status display. Routes "All features in focus group complete" to suggest next focus group.
- **resume-work.md:** Displays "Focus Group: {group_name}" in resume banner. Scans feature directories for incomplete work. Handles "Multiple active focus groups" by asking which to resume.
**Verdict:** PASS

### Step 4: Verify focus.md workflow updates STATE.md
**Command/Workflow:** Read step 8 of focus.md workflow
**Expected result:** Workflow updates STATE.md with active focus
**Actual result:** Step 8 explicitly:
- If first focus group: add `## Active Focus Groups` section
- Add entry for new focus group with name and current item
- Commit: `docs: create focus group '${FOCUS_GROUP_NAME}' --files .planning/ROADMAP.md .planning/STATE.md`
**Verdict:** PASS

### Step 5: Check ROADMAP.md template for focus reflection
**Command/Workflow:** Read repo `templates/roadmap.md`
**Expected result:** Focus group sections in roadmap
**Actual result:** Template has:
- "Active Focus Groups" section (empty on init, populated by `/gsd:focus`)
- "Completed Focus Groups" section
- Focus group format: `### Focus: {group-name}` with goal, priority order, status checkboxes
- "Focus groups replace phases" explicit statement
**Verdict:** PASS

## Findings (updated)

| # | Type | Description | Status |
|---|------|-------------|--------|
| S11-F1 | RETESTED | /gsd:focus command exists in repo with full definition | RECLASSIFIED: false positive |
| S11-F2 | RETESTED | focus.md workflow exists (199 lines, 9-step process) with full implementation | RECLASSIFIED: false positive |
| S11-F3 | RETESTED | progress.md and resume-work.md both route on focus groups | RECLASSIFIED: false positive |
| S11-F4 | RETESTED | Feature/capability scoping available in progress and resume workflows | RECLASSIFIED: false positive |

## Artifacts Produced
- This updated scenario report

## Assessment

Focus creation is fully implemented in the repo. The user journey "I want to focus on bodyweight exercises" has a clear entry point (`/gsd:focus`), a full workflow (Q&A -> slug-resolve -> dependency trace -> DAG -> overlap detection -> write), and state tracking (ROADMAP.md focus groups + STATE.md active focus). Progress and resume workflows are focus-aware.

**Original FAIL verdict was caused by testing against stale v1 install.** Retest against repo: PASS.
