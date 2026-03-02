# Scenario 06: Brownfield Init

**Date:** 2026-03-02
**Result:** PASS (with known caveats)

## Goal

Test the brownfield init flow: strip .planning/ and .documentation/ from an existing workout app codebase, re-run init, and verify it detects existing code and triggers the existing-project discovery path.

## Persona

"I have an existing workout app codebase with cardio intervals, bodyweight exercises, and a timer. I want to use GSD to manage it."

## Steps Taken

### 1. Create brownfield workspace

Copied workout app workspace, stripped .planning/ and .documentation/. Added representative source files (package.json, src/index.js, src/routines.js, src/timer.js) since the greenfield workspace only contained GSD scaffolding, not actual code.

Result: Workspace with code but no GSD artifacts.

### 2. Test init project route

**Command:** `node gsd-tools.cjs init project --cwd=/tmp/gsd-test-brownfield`

**Result:** PASS

```json
{
  "detected_mode": "existing",
  "planning_exists": false,
  "code_exists": true,
  "project_exists": false,
  "partial_run": { "has_partial": false },
  "project_context": null,
  "commit_docs": true,
  "has_git": true
}
```

- `detected_mode: "existing"` -- correctly identifies brownfield
- `code_exists: true` -- detected JS files and package.json
- `planning_exists: false` -- correctly sees no .planning directory
- `has_git: true` -- git repo detected

**Caveat:** The `init project` route exists in the local v2 gsd-tools.cjs but NOT in the installed version at `$HOME/.claude/get-shit-done/`. The installed version uses `init new-project` (v1 route name). This is a known finding (F1).

### 3. Trace init-project.md brownfield path

The workflow correctly branches:
- Step 1: `init project` auto-detects mode
- Step 2: `detected_mode: "existing"` routes to Step 4 (Existing-Project Flow)
- Step 4a: Parallel scan via gather-synthesize.md (6 dimensions: Structure, Stack, Data Models, Patterns, Entry Points, Dependencies)
- Step 4b: User validation (independent sections)
- Step 4c: Gap fill (domain context, tech debt)
- Step 4c.5: Design & styling Q&A
- Step 4d: Write PROJECT.md
- Step 4e: Write capability map via capability-create
- Step 4f: Seed .documentation/
- Step 4g: Write ROADMAP.md (v2 focus group template)
- Step 4h: Write STATE.md (v2 state template)

**All @file references resolve:**
- gather-synthesize.md -- FOUND
- templates/project.md -- FOUND
- templates/roadmap.md -- FOUND (v2 format)
- templates/state.md -- FOUND (v2 format)

### 4. Simulate discovery flow

The brownfield path uses gather-synthesize.md with 6 scan dimensions. This is an interactive workflow (spawns gatherer agents, needs synthesizer), so cannot be fully automated in CLI test. However:
- gather-synthesize.md exists and is correctly structured
- The 6 dimensions are defined in init-project.md Step 4a
- Synthesizer output goes to `.planning/init-scan-draft.md`
- After scan, the workflow creates capabilities based on discovered code structure

### 5. Test capability/feature creation

```
capability-create workout-routines -> PASS (created .planning/capabilities/workout-routines/CAPABILITY.md)
feature-create workout-routines bodyweight-exercises -> PASS (created FEATURE.md)
```

Results identical to greenfield. Note: these CRUD routes exist in local v2 gsd-tools.cjs only (F2/F3).

### 6. Verify STATE.md and ROADMAP.md templates

Both templates exist and use v2 format:
- state.md: `gsd_state_version: 2.0`, capabilities/features progress, focus groups
- roadmap.md: focus group tracker, no phases/milestones

These are created as Steps 4g/4h in the brownfield flow. Confirmed per 12-03 decision (B2 blocker resolved).

### 7. Compare brownfield vs greenfield outputs

Same .planning/capabilities/ structure. Key differences:
- Brownfield has source code files; greenfield was pure GSD scaffolding
- Both produce identical capability-create and feature-create results
- Both flows converge to the same output artifact set (PROJECT.md, capabilities, .documentation/, ROADMAP.md, STATE.md)

## Findings

No NEW findings. All caveats are previously documented:
- F1: `init project` route name mismatch (installed vs local) -- already logged
- F2/F3: capability-create/feature-create missing from installed version -- already logged

The brownfield detection logic is correct and well-designed:
- `!code && !planning` -> new
- `code && !project` -> existing
- `project exists` -> ambiguous (asks user)

## Verdict

**PASS** -- The brownfield init flow is correctly designed. The `init project` CLI route correctly detects existing code, the workflow correctly branches to Step 4 (existing-project flow), all referenced files resolve, and the discovery path through gather-synthesize is properly structured. The only gap is that the installed gsd-tools.cjs uses v1 route names (a known finding).

---
*Phase: 13-multi-scenario-e2e-testing-cleanup*
*Completed: 2026-03-02*
