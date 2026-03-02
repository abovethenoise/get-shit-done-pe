# Scenario 12: Conflicting Focus

**Goal:** Test how GSD handles switching focus from one feature to another. Verify conflict detection, clean state transitions, and no silent corruption.
**Date:** 2026-03-02
**Status:** FAIL

## Pre-Staging

Uses the workout app workspace at `/tmp/gsd-test-workout` from Plan 01.
Persona: "I'm focused on bodyweight exercises but now I want to switch to progress tracking instead."
Sequential after S11.

## Steps

### Step 1: Verify focus system exists

**Command/Workflow:** Check for /gsd:focus command, focus.md workflow, focus-related CLI routes
**Expected result:** Focus system available for testing conflict scenarios
**Actual result:** No focus system exists (confirmed in S10, S11). Specifically:
- `commands/gsd/focus.md` -- does not exist
- `get-shit-done/workflows/focus.md` -- does not exist
- `gsd-tools.cjs` has no focus routes
- STATE.md has no structured focus field
**Verdict:** FAIL

Cannot test conflicting focus because the focus system does not exist.

### Step 2: Analyze what conflict handling WOULD look like

**Command/Workflow:** Read 12-04 SUMMARY for design intent
**Expected result:** Understand designed conflict behavior
**Actual result:** 12-04 SUMMARY describes focus.md workflow as having:
- "Q&A-driven creation with explicit + implicit dependency tracing"
- "Overlap detection against existing groups"
This implies the designed behavior was:
1. User sets focus A
2. User tries to set focus B
3. System detects overlap (if any) between A and B features
4. System asks user to confirm switch or maintain both
**Verdict:** N/A (design analysis only, no implementation to test)

### Step 3: Test STATE.md integrity under manual focus change

**Command/Workflow:** Simulate manual text edits to STATE.md "Current focus" field
**Expected result:** No corruption from changing the text label
**Actual result:** STATE.md "Current focus" is a plain text field in markdown. Changing it from "Phase 13 -- Multi-Scenario E2E Testing" to "bodyweight-exercises" and then to "weekly-progress" would be a simple text replacement. No structural integrity risk because:
- No other system reads this field programmatically
- progress.md and resume-project.md ignore it
- No CLI route validates it
**Verdict:** FRICTION

There is no conflict to detect because "Current focus" is not used by any system. Changing it is a no-op from the system's perspective.

### Step 4: Check for focus state corruption vectors

**Command/Workflow:** Analyze STATE.md schema for corruption risks
**Expected result:** Identify if focus changes could corrupt state
**Actual result:** STATE.md has no focus-specific fields beyond the text label. The structured fields are:
- Frontmatter: gsd_state_version, milestone, status, progress (total_phases, completed_phases, total_plans, completed_plans)
- Body: Current Position (phase/plan/status), Performance Metrics, Decisions, Blockers, Session Continuity
None of these would be affected by focus changes. No corruption risk from nonexistent focus operations.
**Verdict:** N/A

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S12-F1 | bug | Cannot test conflicting focus -- focus system does not exist | OPEN |
| S12-F2 | friction | "Current focus" text field is ignored by all workflows -- changing it has no system effect | OPEN |

## Artifacts Produced
- This scenario report

## Assessment

Conflicting focus testing is blocked by the absence of the focus system. The STATE.md "Current focus" field is purely cosmetic -- it affects human readability of STATE.md but no workflow reads or acts on it. There is zero corruption risk from focus changes because there is nothing to corrupt.

**For triage:** The question is whether GSD v2 needs the focus group system described in 12-04, or whether the phase-based sequential model is sufficient. If focus groups are needed, they must be built from scratch (command, workflow, CLI routes, state tracking, template updates).
