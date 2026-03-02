# Scenario 10: Milestone/Roadmap Sequencing

**Goal:** Test that milestones, roadmap phases, and focus groups create and track sequencing correctly. Validate that STATE.md and ROADMAP.md work together to drive priority order.
**Date:** 2026-03-02
**Retested:** 2026-03-02 -- Against repo source tree (not stale install)
**Status:** PASS

## Retest Notes

Original test ran against stale `~/.claude/` install which had v1 milestone-based templates and workflows. Retest confirms the repo has v2 focus group model throughout: templates, workflows, commands, and CLI routes.

## Pre-Staging

Used `/tmp/gsd-test-workout-v2` workspace from S01 retest.

## Steps

### Step 1: Identify available CLI routes for state/roadmap management
**Command/Workflow:** Grep repo gsd-tools.cjs for available commands
**Expected result:** Routes for state management, roadmap operations, and focus group handling
**Actual result:** Available init workflows: `resume, project, framing-discovery, discuss-capability, discuss-feature, plan-feature, execute-feature, feature-op, feature-progress`. Top-level routes include: `state, state-snapshot, roadmap, slug-resolve, capability-create, capability-list, capability-status, feature-create, feature-list, feature-status, progress`.
**Verdict:** PASS

### Step 2: Test state route on workout workspace
**Command/Workflow:** `node $GSD state --cwd=/tmp/gsd-test-workout-v2`
**Expected result:** State information
**Actual result:** Returns JSON with `state_exists` field. STATE.md not yet created because `init project` returns context -- the `init-project.md` workflow creates STATE.md at steps 3g/3h. This is expected: the CLI route returns context, the workflow (invoked by the user via `/gsd:new`) creates files.
**Verdict:** PASS (correct design -- CLI routes return context, workflows create files)

### Step 3: Check roadmap template for focus group model
**Command/Workflow:** Read repo `get-shit-done/templates/roadmap.md`
**Expected result:** v2 focus group model
**Actual result:** Template uses v2 focus group model:
- "Active Focus Groups" section
- "Completed Focus Groups" section
- "Focus groups replace phases" explicit statement
- "Priority order matters" with dependency-aware ordering
- No phase numbers, no milestone groupings
**Verdict:** PASS

### Step 4: Check state template for focus tracking
**Command/Workflow:** Read repo `get-shit-done/templates/state.md`
**Expected result:** Focus group tracking in STATE.md
**Actual result:** Template has:
- `active_focus: null` in frontmatter
- "Active Focus Groups" section with structured format per group
- "Supports multiple parallel focus groups" explicit statement
- Focus-scoped decisions section
- Resume routing that "points to focus group or capability"
**Verdict:** PASS

### Step 5: Verify focus.md command and workflow existence
**Command/Workflow:** File existence check
**Expected result:** Both files exist
**Actual result:**
- `commands/gsd/focus.md` -- EXISTS (1519 bytes). Defines `/gsd:focus` with argument-hint, allowed-tools, delegates to `workflows/focus.md`.
- `get-shit-done/workflows/focus.md` -- EXISTS (6567 bytes, 199 lines). 9-step process: initialize via `init feature-progress`, Q&A goal, Q&A scope with slug-resolve, dependency trace (explicit + implicit), DAG construction with cycle detection, overlap detection against existing groups, priority ordering in waves, ROADMAP.md write, STATE.md update.
**Verdict:** PASS

### Step 6: Verify progress.md uses focus for suggestions
**Command/Workflow:** Read repo `get-shit-done/workflows/progress.md`
**Expected result:** Focus-scoped work suggestions
**Actual result:** progress.md:
- Calls `init feature-progress` for capability/feature overview
- Parses `focus_groups` and `active_features` from init JSON
- Has "Focus Groups" display section
- Routes based on feature pipeline state including "All features in focus group complete -> suggest next focus group"
- Shows capability/feature tree with pipeline stages
**Verdict:** PASS

### Step 7: Verify resume-work.md uses focus for suggestions
**Command/Workflow:** Read repo `get-shit-done/workflows/resume-work.md`
**Expected result:** Focus-scoped resume
**Actual result:** resume-work.md:
- Scans `.planning/capabilities/*/features/*/` for incomplete work
- Displays "Focus Group: {group_name}" in resume banner
- Handles "Multiple active focus groups" case (asks which to resume)
- Shows feature-level status
**Verdict:** PASS

### Step 8: Verify init-project.md creates STATE.md and ROADMAP.md
**Command/Workflow:** Read repo `get-shit-done/workflows/init-project.md`
**Expected result:** Init workflow includes STATE.md and ROADMAP.md creation
**Actual result:** init-project.md includes:
- Steps 3g/3h (new project): Write ROADMAP.md and STATE.md using v2 templates
- Steps 4g/4h (existing project): Same for brownfield flow
- Success criteria: "Both flows create STATE.md and ROADMAP.md"
**Verdict:** PASS

## Findings (updated)

| # | Type | Description | Status |
|---|------|-------------|--------|
| S10-F1 | RETESTED | Focus group system exists in repo (command + workflow + CLI routes) | RECLASSIFIED: false positive |
| S10-F2 | RETESTED | init-project.md workflow creates STATE.md and ROADMAP.md at steps 3g/3h/4g/4h | RECLASSIFIED: false positive |
| S10-F3 | RETESTED | Roadmap template uses v2 focus group model | RECLASSIFIED: false positive |
| S10-F4 | RETESTED | State template has structured focus tracking (active_focus, Active Focus Groups section) | RECLASSIFIED: false positive |
| S10-F5 | RETESTED | progress.md and resume-work.md have full focus group awareness | RECLASSIFIED: false positive |

## Artifacts Produced
- This updated scenario report

## Assessment

All milestone/roadmap sequencing features are implemented in the repo source tree. The v2 focus group model replaces milestones throughout: templates, workflows, commands, and CLI routes. STATE.md and ROADMAP.md creation is properly wired into the init workflow. Progress and resume workflows route based on focus groups and feature pipeline state.

**Original FAIL verdict was caused by testing against stale v1 install.** Retest against repo: PASS.
