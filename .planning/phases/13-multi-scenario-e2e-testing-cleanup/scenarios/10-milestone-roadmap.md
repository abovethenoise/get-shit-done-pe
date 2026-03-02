# Scenario 10: Milestone/Roadmap Sequencing

**Goal:** Test that milestones, roadmap phases, and focus groups create and track sequencing correctly. Validate that STATE.md and ROADMAP.md work together to drive priority order.
**Date:** 2026-03-02
**Status:** FAIL

## Pre-Staging

Used the workout app workspace at `/tmp/gsd-test-workout` from Plan 01. Workspace has:
- `.planning/capabilities/workout-routines/CAPABILITY.md`
- 6 features: bodyweight-exercises, cardio-intervals, stretching-cooldowns, weekly-progress, timer-fix, data-model-refactor
- No STATE.md or ROADMAP.md (not created during init)
- No config.json

## Steps

### Step 1: Identify available CLI routes for state/roadmap management

**Command/Workflow:** `node gsd-tools.cjs` (no args to list commands)
**Expected result:** Routes for state management, roadmap operations, and focus group handling
**Actual result:** Available commands: `state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, init`. No focus-related routes. No roadmap CRUD routes.
**Verdict:** FRICTION

The `state` route returns config + raw state text. It has no subcommands for focus groups or roadmap sequencing.

### Step 2: Test state route on workout workspace

**Command/Workflow:** `node gsd-tools.cjs state --cwd=/tmp/gsd-test-workout`
**Expected result:** State information about the workout app project
**Actual result:** Returns JSON with `state_exists: false`, `roadmap_exists: false`, `config_exists: false`. No STATE.md or ROADMAP.md was created during the init/greenfield flow (S01 confirmed this).
**Verdict:** FAIL

STATE.md and ROADMAP.md are not automatically created during project initialization. The B2 blocker fix (12-03) added these as init steps 3g/3h and 4g/4h, but the actual `init new-project` CLI route does not create them. The template describes these as created "After ROADMAP.md is created (during init)" but init doesn't create them.

### Step 3: Check roadmap template for focus group model

**Command/Workflow:** Read `get-shit-done/templates/roadmap.md`
**Expected result:** v2 focus group model with DAG-based sequencing
**Actual result:** Roadmap template uses v1-style milestone-grouped phases:
- Phase-based sequencing (Phase 1, 2, 3...)
- Milestone grouping (v1.0, v1.1, v2.0)
- No mention of "focus group" anywhere in the template
- Progress table tracks phases, not focus groups
**Verdict:** FAIL

The 12-04 decision "Focus groups replace milestones with lightweight DAG-based sequencing" is not reflected in the template. The template still uses the milestone/phase model.

### Step 4: Check state template for focus tracking

**Command/Workflow:** Read `get-shit-done/templates/state.md`
**Expected result:** Focus group tracking in STATE.md
**Actual result:** STATE.md template has `**Current focus:** [Current phase name]` -- just a text field for the current phase name. No structured focus group tracking, no active/inactive focus management, no focus history.
**Verdict:** FRICTION

"Current focus" in STATE.md is a label, not a focus group management system.

### Step 5: Verify focus.md command and workflow existence

**Command/Workflow:** `ls commands/gsd/focus.md` and `ls get-shit-done/workflows/focus.md`
**Expected result:** Both files exist (per 12-04 summary)
**Actual result:** Neither file exists. Also missing: `commands/gsd/status.md`, `get-shit-done/workflows/capability-orchestrator.md`, slug-resolve CLI route.
**Verdict:** FAIL

12-04 SUMMARY claims these files were created (commits ca46912, 6a85c36) but they are not on disk. This is consistent with S01 findings F2-F5 and the STATE.md decision "[13-01]: v2 workflow files do not exist -- v1 names retained".

### Step 6: Verify resume-work.md uses focus for suggestions

**Command/Workflow:** Read `get-shit-done/workflows/resume-project.md`
**Expected result:** Focus-scoped work suggestions
**Actual result:** resume-project.md routes based on STATE.md phase/plan position, PLAN/SUMMARY counts, and .continue-here files. No focus group awareness. No focus-scoped suggestions.
**Verdict:** FRICTION

### Step 7: Verify progress.md shows focus-scoped progress

**Command/Workflow:** Read `get-shit-done/workflows/progress.md`
**Expected result:** Focus group progress display
**Actual result:** progress.md shows phase-based progress using `roadmap analyze` and `state-snapshot`. Routes to execute/plan based on plan/summary counts. No focus group display. The word "focus" does not appear in the file.
**Verdict:** FRICTION

## Findings

| # | Type | Description | Status |
|---|------|-------------|--------|
| S10-F1 | bug | Focus group system (command, workflow, CLI routes) does not exist on disk despite 12-04 claiming creation | OPEN |
| S10-F2 | bug | STATE.md and ROADMAP.md not created during init (B2 fix incomplete at CLI level) | OPEN |
| S10-F3 | friction | Roadmap template uses milestone/phase model, not focus group model (12-04 decision not reflected in templates) | OPEN |
| S10-F4 | friction | STATE.md "Current focus" is just a text label for the phase name, not a focus tracking system | OPEN |
| S10-F5 | friction | progress.md and resume-project.md have no focus group awareness | OPEN |

## Artifacts Produced
- This scenario report

## Assessment

The milestone/roadmap sequencing system is phase-based only. The v2 focus group model described in 12-04 decisions was designed but not implemented on disk. The existing system tracks progress via phase numbering, plan counts, and milestone groupings -- which works for sequential phase execution but does not support the lightweight DAG-based focus group sequencing that was the 12-04 design intent.

**Root cause:** The 12-04 plan was executed in a simulation context. The SUMMARY claims file creation, but the files were either never written to disk or were subsequently deleted during later cleanup passes.
