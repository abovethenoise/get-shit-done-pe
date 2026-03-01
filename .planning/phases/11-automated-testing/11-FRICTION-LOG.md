# Phase 11: Friction Log

**Date:** 2026-03-01
**Scope:** Full v2 pipeline verification — @file scan, CLI smoke tests, E2E pipeline simulation

## Summary

- Total findings: 12
- Blockers: 3
- Friction: 5
- Cosmetic: 4

## Findings

### Blockers

| # | Finding | Source | Location | Impact |
|---|---------|--------|----------|--------|
| B1 | **Pipeline workflows use v1 init routes** — plan.md calls `init plan-phase`, execute.md calls `init execute-phase`, review.md calls `init review-phase`, doc.md calls `init doc-phase`. The framing-pipeline invokes these workflows with capability context, but the workflows call phase-based CLI routes that expect a phase number. The v2 feature-level routes (`init plan-feature`, `init execute-feature`) exist but are NOT wired into the pipeline workflows. | E2E simulation | plan.md:17, execute.md:19, review.md:13, doc.md:13 | **The full v2 pipeline cannot execute.** Discovery → Brief works, but the moment the pipeline tries to plan/execute/review/doc, it will call phase routes with no phase arg and fail. |
| B2 | **No STATE.md or ROADMAP.md creation in v2 flow** — `/gsd:init` creates PROJECT.md + capabilities + .documentation/. The pipeline stages read STATE.md and ROADMAP.md but nothing creates them. In v1 these were created by `/gsd:new-milestone`. In v2 there's no equivalent step. | E2E simulation | init-project.md (absent), framing-pipeline.md:86-87 | Pipeline stages that reference STATE.md will get null paths. State tracking is broken for new v2 projects. |
| B3 | **Feature lifecycle gap** — `/gsd:init` creates capabilities but not features. The pipeline operates at capability level (framing-pipeline gets CAPABILITY_SLUG). But plan-feature and execute-feature routes expect both cap+feat args. There's no clear step where features get created under capabilities, and no workflow that bridges capability-level discovery to feature-level planning/execution. | E2E simulation | framing-pipeline.md, plan-feature/execute-feature routes | The capability→feature decomposition step is missing from the pipeline flow. |

### Friction

| # | Finding | Source | Location | Impact | Recommendation |
|---|---------|--------|----------|--------|----------------|
| F1 | `/gsd:new-project` doesn't exist — should be `/gsd:new` | cross-ref + E2E | commands/gsd/init.md:34 | Users following init after-text hit nonexistent command | Fix now |
| F2 | `/gsd:new-project` ref in init-project.md workflow | cross-ref + E2E | get-shit-done/workflows/init-project.md:362 | Workflow output points to nonexistent command | Fix now |
| F3 | `/gsd:new-project` ref in plan.md error message | cross-ref + E2E | get-shit-done/workflows/plan.md:25 | Error message directs to nonexistent command | Fix now |
| F4 | `/gsd:discuss-phase` in research.md template | cross-ref | get-shit-done/templates/research.md:21 | Template references dead v1 command | Fix now |
| F5 | `init project` returns `has_git: true` for dirs with `.git/` but init-project.md never checks this field — it always runs `commit` which will fail without git | E2E simulation | init-project.md | Minor — Claude would just init git, but the field exists without being consumed | Accept |

### Cosmetic

| # | Finding | Source | Location | Impact | Recommendation |
|---|---------|--------|----------|--------|----------------|
| C1 | `/gsd:verify-work` ref in UAT template | cross-ref | get-shit-done/templates/UAT.md:139 | Template for UAT references dead command | Fix now |
| C2 | `/gsd:verify-work` ref in VALIDATION template | cross-ref | get-shit-done/templates/VALIDATION.md:32 | Template for validation references dead command | Fix now |
| C3 | CMD-01 lists 11 commands but only 9 exist — `plan` and `review` are pipeline-internal | cross-ref | REQUIREMENTS.md CMD-01 | Documentation count mismatch | Accept as-is |
| C4 | `feature-op` route accepts no args silently (returns nulls) instead of erroring | E2E | gsd-tools.cjs feature-op handler | Inconsistent with plan-feature/execute-feature validation | Defer to Phase 12 |

## Auto-Fixes Applied

None — Plan 01 found no renames needed. All 64 @file references resolve correctly.

## @file Reference Scan Summary

- 66 total refs scanned (64 real, 2 false positives)
- 64/64 resolved — **100% resolution rate**
- 0 auto-fixes needed
- 0 unresolved references

## CLI Smoke Test Summary

- 21 routes tested: 19 PASS, 2 WARN, 0 FAIL
- All 13 live init routes return exit 0 + valid JSON
- All 3 dead routes return graceful error messages
- All 5 atomic routes functional

## E2E Simulation Narrative

Simulated a user starting a fresh project ("TaskFlow" — a task management app) and walking through the full v2 pipeline:

1. **`/gsd:init` on empty dir** — `init project` returns `detected_mode: "new"`, correct. Claude would run the init-project.md Q&A flow (goals → tech stack → architecture → write PROJECT.md → create capabilities → seed .documentation/). This works. After-text says "Run `/gsd:new-project`" — **wrong command name** (F1).

2. **Capability creation** — `capability-create task-management` works, produces CAPABILITY.md with template placeholders. Claude fills these in during init Q&A. No friction here.

3. **`/gsd:new task-management`** — `init framing-discovery new task-management` resolves capability correctly, loads anchor questions, returns MVU slots. Discovery Q&A and brief creation would work.

4. **Pipeline handoff** — framing-discovery.md hands off to framing-pipeline.md with CAPABILITY_SLUG. Pipeline reads brief, loads lens metadata, starts Stage 1 (research). Research-workflow.md reads STATE.md — **but STATE.md doesn't exist** (B2). Research would get null state_path but might survive since it's optional.

5. **Stage 2 (requirements)** — Pipeline auto-generates 3-layer requirements at `.planning/capabilities/{slug}/REQUIREMENTS.md`. This step is self-contained and would work.

6. **Stage 3 (plan)** — Pipeline invokes plan.md. plan.md calls `init plan-phase "${PHASE}"` — **but there's no phase** (B1). The pipeline passed capability context, not a phase number. This call fails. **Pipeline breaks here.**

7. **Stage 4-6 (execute, review, doc)** — Same problem. All use phase-based init routes.

8. **Feature gap** — Even if the pipeline worked, it operates at capability level. The v2 model has features under capabilities, and plan-feature/execute-feature routes exist for feature-level work. But there's no step in the pipeline where capabilities get decomposed into features (B3).

**Bottom line:** The plumbing (CLI routes, @file references, JSON shapes) is solid. The wiring between the framing pipeline and the downstream stage workflows is broken — the pipeline speaks v2 (capabilities) but the stage workflows still speak v1 (phases).

## Blocker Analysis

### B1: Pipeline-to-Workflow Init Route Mismatch

```
framing-pipeline.md                    plan.md
    |                                    |
    | invokes with CAPABILITY_SLUG       | calls init plan-phase ${PHASE}
    |-----> @plan.md --------->          | expects phase number, gets nothing
                                         | FAILS
```

**Root cause:** Phase 9 created v2 init routes (plan-feature, execute-feature) but the pipeline stage workflows were not updated to use them. plan.md, execute.md, review.md, doc.md still call v1 phase routes.

**Fix scope:** Each workflow needs a v2 code path that calls the feature-level init route when invoked by the framing pipeline (vs. the phase route when invoked by the v1 skill system).

### B2: Missing STATE.md/ROADMAP.md Bootstrap

**Root cause:** In v1, `/gsd:new-milestone` created these. In v2, `/gsd:init` doesn't create them and no other step does.

**Fix scope:** Either init-project.md creates a seed STATE.md/ROADMAP.md, or the pipeline stages handle null state gracefully.

### B3: Capability → Feature Decomposition Gap

**Root cause:** The v2 model separates capabilities (high-level) from features (buildable units). Discovery operates at capability level. But planning/execution operate at feature level. No workflow bridges the gap.

**Fix scope:** Needs design — either the requirements stage decomposes capabilities into features, or there's an explicit decomposition step.

## Recommendations Summary

| # | Action | Effort | When |
|---|--------|--------|------|
| F1-F3 | Replace `/gsd:new-project` → `/gsd:new` in 3 files | trivial | Fix now |
| F4 | Replace `/gsd:discuss-phase` ref in research.md | trivial | Fix now |
| C1-C2 | Update `/gsd:verify-work` refs in UAT.md and VALIDATION.md | trivial | Fix now |
| C3 | Accept — CMD-01 doc mismatch is cosmetic | none | Accept |
| C4 | Defer — feature-op null validation | trivial | Phase 12 |
| B1-B3 | **Blockers require design decisions before fixing** | significant | Discuss before Phase 12 |
