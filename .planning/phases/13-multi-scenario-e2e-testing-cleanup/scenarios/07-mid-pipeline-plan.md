# Scenario 07: Mid-Pipeline Plan Entry

**Date:** 2026-03-02
**Result:** PASS
**Persona:** "I've already discussed the workout app and have requirements. I want to jump straight to planning."

## Setup

Pre-staged workspace at `/tmp/gsd-test-midpipe` with:
- `.planning/PROJECT.md` -- project metadata
- `.planning/STATE.md` -- state file
- `.planning/ROADMAP.md` -- roadmap
- `.planning/capabilities/workout-routines/CAPABILITY.md` -- capability definition
- `.planning/capabilities/workout-routines/features/hiit-workouts/FEATURE.md` -- EU/FN/TC requirements
- `.planning/capabilities/workout-routines/features/hiit-workouts/DISCOVERY-BRIEF.md` -- discovery notes
- `.planning/capabilities/workout-routines/features/hiit-workouts/RESEARCH.md` -- research findings

## Test: init plan-feature

```bash
node gsd-tools.cjs init plan-feature workout-routines hiit-workouts --cwd=/tmp/gsd-test-midpipe
```

### Result

| Field | Expected | Actual | Status |
|-------|----------|--------|--------|
| feature_found | true | true | PASS |
| capability_found | true | true | PASS |
| feature_dir | .planning/capabilities/workout-routines/features/hiit-workouts | .planning/capabilities/workout-routines/features/hiit-workouts | PASS |
| has_research | true | true | PASS |
| has_plans | false | false | PASS |
| planning_exists | true | true | PASS |
| roadmap_exists | true | true | PASS |
| research_path | (populated) | .planning/capabilities/workout-routines/features/hiit-workouts/RESEARCH.md | PASS |

## Workflow Trace: plan.md

| Step | What it does | Requires prior stages? | Status |
|------|-------------|----------------------|--------|
| 1. Initialize | Calls `init plan-feature` | No -- just needs .planning/ to exist | PASS |
| 2. Parse Arguments | Extracts flags | No | PASS |
| 3. Validate Feature | Reads FEATURE.md | Needs FEATURE.md only (not discovery/research) | PASS |
| 4. Load CONTEXT.md | Reads CONTEXT.md if present | Optional -- asks user if missing | PASS |
| 5. Handle Research | Uses existing or spawns research | Optional -- can skip with flag | PASS |
| 6. Check Existing Plans | Scans for *-PLAN.md | No | PASS |
| 7. Spawn Planner | Passes context to planner agent | No prior stage required | PASS |

### Key Finding: Mandatory vs Optional Artifacts

| Artifact | Required by plan.md? | Notes |
|----------|---------------------|-------|
| FEATURE.md | YES (hard error if missing) | Must have EU/FN/TC requirements |
| CAPABILITY.md | NO (not checked) | Used indirectly via capability_dir |
| DISCOVERY-BRIEF.md | NO (never referenced) | Framing-stage artifact only |
| RESEARCH.md | NO (can skip) | Helpful but not mandatory |
| CONTEXT.md | NO (asks user if missing) | From discuss-feature, optional |
| PROJECT.md | NO (not checked by plan.md) | Used by planner for context |
| STATE.md | NO (checked by init route) | planning_exists check only |

## Conclusion

Mid-pipeline plan entry works. Only FEATURE.md with EU/FN/TC requirements is mandatory. All other artifacts are optional/helpful. A user who has manually written FEATURE.md can jump straight to `/gsd:plan` without running discovery, research, or framing stages.

## Findings

No new findings. The plan entry point is clean and accepts pre-staged artifacts correctly.
