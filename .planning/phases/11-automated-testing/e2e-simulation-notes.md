# E2E Simulation Notes (Full Pipeline Trace)

**Date:** 2026-03-01
**Synthetic project:** /tmp/gsd-e2e-* (TaskFlow — task management app)
**Method:** Claude role-playing as user, reading each workflow to understand what Claude-as-agent would do at each step, running CLI routes against synthetic fixtures, tracing data flow through the full pipeline.

## What I Did

Started with an empty git repo. Traced the full user journey:

1. `/gsd:init` → read init-project.md → CLI auto-detection → Q&A flow → PROJECT.md + capabilities + .documentation/
2. `/gsd:new task-management` → read framing-discovery.md → CLI fuzzy resolution → discovery Q&A → Discovery Brief
3. Pipeline handoff → read framing-pipeline.md → Stage 1 research → Stage 2 requirements → Stage 3 plan → **BREAKS**

## Step-by-Step Trace

### /gsd:init (works)
- `init project --cwd=<empty>` → `detected_mode: "new"` ✓
- init-project.md directs Claude to run deep Q&A (goals, tech stack, architecture)
- Write PROJECT.md from template
- `capability-create task-management` → creates `.planning/capabilities/task-management/CAPABILITY.md` with template ✓
- Seed `.documentation/` (architecture.md, domain.md, mapping.md, decisions/) ✓
- After-text says "Run `/gsd:new-project`" → **WRONG** — should be `/gsd:new`
- **No STATE.md created. No ROADMAP.md created.**

### /gsd:new task-management (works through discovery, breaks at pipeline)
- `init framing-discovery new task-management` → resolves capability correctly ✓
- Anchor questions loaded, MVU slots (problem, who, done_criteria, constraints) present ✓
- Claude would run Q&A, track MVU, produce Discovery Brief at `.planning/capabilities/task-management/BRIEF.md`
- Summary playback, user confirms brief ✓
- Hands off to framing-pipeline.md with CAPABILITY_SLUG, LENS, BRIEF_PATH ✓

### Pipeline Stage 1: Research (probably works with degradation)
- framing-pipeline.md passes `state_path: .planning/STATE.md` → **doesn't exist**
- research-workflow.md reads STATE.md as optional context → would get null, continue
- 6 gatherers spawn, each reads codebase + brief → would work
- Output: RESEARCH.md at capability dir ✓ (probably)

### Pipeline Stage 2: Requirements (works)
- Auto-generate 3-layer requirements from brief
- Writes to `.planning/capabilities/task-management/REQUIREMENTS.md`
- Lens-weighted (new lens: rich EU, medium FN, thin TC)
- Self-contained, no external init route needed ✓

### Pipeline Stage 3: Plan (BREAKS)
- framing-pipeline.md says: "Invoke plan.md"
- plan.md Step 1 runs: `init plan-phase "${PHASE}"`
- **PHASE is undefined.** Pipeline passed CAPABILITY_SLUG, not a phase number.
- CLI route `init plan-phase` expects a phase number → will error or return garbage
- **Pipeline halts.**

### Pipeline Stages 4-6 (would break same way)
- execute.md: `init execute-phase "${PHASE_ARG}"` — same problem
- review.md: `init review-phase "${PHASE}"` — same problem (also a DEAD route that returns error)
- doc.md: `init doc-phase "${PHASE}"` — same problem (also a DEAD route)

## Key Architectural Finding

The v2 system has TWO parallel routing systems:

```
V1 (phase-based):
  /gsd:plan-phase 11 → plan.md → init plan-phase "11" → phase dir → plans

V2 (capability/feature-based):
  /gsd:new cap → discovery → brief → framing-pipeline → plan.md → init plan-phase ??? → BREAKS
                                                                    init plan-feature cap feat → WORKS (but not wired)
```

The v2 CLI routes exist (`init plan-feature`, `init execute-feature`) and return correct JSON. But the pipeline workflow files still call the v1 phase routes. The bridge is missing.

## Cleanup
- `/tmp/gsd-e2e-*` removed after simulation
