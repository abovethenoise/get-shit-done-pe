# Scenario 11: Create Focus

**Goal:** Test that a user can set a focus to guide work priority within the workout app. Verify STATE.md and ROADMAP.md update to reflect the active focus.
**Date:** 2026-03-02
**Status:** FAIL

## Pre-Staging

Uses the workout app workspace at `/tmp/gsd-test-workout` from Plan 01.
Persona: "I want to focus on the bodyweight exercises feature first."

## Steps

### Step 1: Read /gsd:focus command

**Command/Workflow:** `ls commands/gsd/focus.md`
**Expected result:** Focus command file exists with instructions for setting focus
**Actual result:** File does not exist. No `/gsd:focus` command available.
**Verdict:** FAIL

The command that would allow a user to say "I want to focus on bodyweight exercises" does not exist.

### Step 2: Identify how focus could be set

**Command/Workflow:** Survey all CLI routes and commands
**Expected result:** Some mechanism to set/track focus
**Actual result:**
- `gsd-tools.cjs` has no focus-related routes
- No command files reference focus group management
- STATE.md template has `**Current focus:** [Current phase name]` -- manual text, not a managed field
- The `state` CLI route returns raw state text but has no set/update subcommands for focus
**Verdict:** FAIL

There is no programmatic way to set or track focus. The "Current focus" field in STATE.md is manually edited by workflow scripts that do text replacement.

### Step 3: Simulate setting focus via STATE.md text

**Command/Workflow:** Trace what would happen if STATE.md existed with a focus field
**Expected result:** Workflows would use focus to filter/prioritize
**Actual result:**
- progress.md: Does not read or use "Current focus" from STATE.md. Routes based on plan/summary counts.
- resume-project.md: Reads STATE.md for "Current Position" (phase/plan/status) and "Session Continuity". Does not use "Current focus" for routing decisions.
- No workflow file uses "Current focus" to filter capabilities or features.
**Verdict:** FAIL

Even if STATE.md had a "Current focus: bodyweight-exercises" entry, no workflow would use it to scope work suggestions.

### Step 4: Check if focus.md workflow would update STATE.md

**Command/Workflow:** `ls get-shit-done/workflows/focus.md`
**Expected result:** Workflow file that updates STATE.md with active focus
**Actual result:** File does not exist. 12-04 SUMMARY described this workflow as handling "Q&A-driven creation with explicit + implicit dependency tracing and overlap detection" but the file was never written to disk.
**Verdict:** FAIL

### Step 5: Check ROADMAP.md for focus reflection

**Command/Workflow:** Read roadmap template
**Expected result:** Focus group sections in roadmap
**Actual result:** Roadmap template has milestone sections, phase details, and a progress table. No focus group sections. No mechanism for reflecting a user's active focus in the roadmap.
**Verdict:** FAIL

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S11-F1 | bug | /gsd:focus command does not exist -- users cannot set focus | OPEN |
| S11-F2 | bug | focus.md workflow does not exist -- no backend for focus creation | OPEN |
| S11-F3 | friction | No workflow uses "Current focus" from STATE.md for routing or filtering | OPEN |
| S11-F4 | friction | No mechanism to scope progress/resume to a specific feature or capability | OPEN |

## Artifacts Produced
- This scenario report

## Assessment

Focus creation is entirely unimplemented. The user journey "I want to focus on bodyweight exercises" has no entry point, no workflow, and no state tracking beyond a manual text label. This is a design-only feature from 12-04 that was not materialized on disk.

**Impact:** Users cannot prioritize specific features or capabilities. Work is driven entirely by phase/plan sequential execution, which is the v1 model. The v2 focus group model exists only as decisions in STATE.md and descriptions in the 12-04 SUMMARY.
