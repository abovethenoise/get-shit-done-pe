# Phase 12: Research Synthesis

**Date:** 2026-03-01
**Status:** Research complete, ready for planner

## User Decisions from Q&A

1. **Requirements → FEATURE.md directly.** Pipeline populates EU/FN/TC sections in FEATURE.md. No separate REQUIREMENTS.md file. Single source of truth.
2. **install.js cleanup in Phase 12.** INST-05/06 (remove Codex/Gemini/OpenCode adapters, patch backup, manifest) done in this phase, not deferred.
3. **Wire v2 first, then delete v1.** Phase 12 wires all v2 flows first, then final step deletes dead v1 code (~10,500 lines). If something breaks, Phase 13 E2E catches it.

## 6 Research Documents

All written to `.planning/phases/12-workflow-optimization-wiring/`:

1. **RESEARCH-ARCHITECTURE.md** — Complete command/workflow/agent/CLI route inventory with v1/v2 status
2. **RESEARCH-BREAKING-POINTS.md** — Every v1 reference that breaks in v2, B1-B3 detailed analysis with line numbers
3. **RESEARCH-CONSOLIDATION.md** — What's reusable vs new. ~355 lines genuinely new, ~270 lines v1 complexity deleted
4. **RESEARCH-DEAD-CODE.md** — ~10,500 lines deletable. Deletion dependency order: workflows → handlers → core helpers
5. **RESEARCH-INIT-BOOTSTRAP.md** — Init flow gaps, STATE.md v2 format, ROADMAP.md v2 format, convergence checklist
6. **RESEARCH-LIFECYCLE.md** — Directory model, slug resolution design, capability orchestrator spec, focus group command spec

## Key Findings (for planner)

### The Core Problem
CLI layer is v2-ready (`init plan-feature`, `init execute-feature`, `init feature-op`, `init feature-progress` all exist). The workflow files (plan.md, execute.md, review.md, doc.md) still call v1 init routes. The fix is surgical: swap init calls + field names in each workflow.

### What's v2-Ready (no changes needed)
- All 6 research gatherers + synthesizer (path-agnostic)
- All 4 review specialists + synthesizer (path-agnostic)
- gsd-doc-writer.md (orchestrator passes paths)
- research-workflow.md, gather-synthesize.md
- framing-discovery.md (minor path updates only)
- CLI routes: capability-create/list/status, feature-create/list/status, init plan-feature, init execute-feature

### What Needs Rewiring
- **plan.md**: Replace `init plan-phase` → `init plan-feature`, remove PRD/Nyquist/gap-closure/auto-advance sections
- **execute.md**: Replace `init execute-phase` → `init execute-feature`, remove decimal gap-closure/milestone branching
- **execute-plan.md**: Same init swap + feature paths
- **review.md**: Replace dead `init review-phase` → `init feature-op <cap> <feat> review`
- **doc.md**: Replace dead `init doc-phase` → `init feature-op <cap> <feat> doc`
- **framing-pipeline.md**: Add FEATURE_SLUG input, shift output paths from cap to feature level
- **progress.md**: Replace `init progress` (phase scan) → `init feature-progress`
- **resume-work.md**: Update position detection for feature model, focus group support
- **5 agents** (planner, executor, plan-checker, verifier, codebase-mapper): Minor path/terminology updates (~40 lines total)

### What's Genuinely New
- **capability-orchestrator.md** workflow (~150 lines): Loop over framing-pipeline per feature in DAG order
- **focus.md** command + workflow: Focus group creation with Q&A + dependency scan
- **slug-resolve** CLI route: 3-tier resolution (exact → fuzzy → LLM fall-through)
- **Templates**: state.md rewrite (focus groups), roadmap.md rewrite (focus groups), capability.md update (priority + why)
- **init-project.md additions**: STATE.md + ROADMAP.md bootstrap (B2 fix), Capabilities Q&A step, brownfield feature discovery

### Deletion Targets (final step)
- 19 dead workflow files (~4,600 lines)
- 17 dead command files (~500 lines)
- phase.cjs entire file (~870 lines)
- 6 dead init handlers in init.cjs (~480 lines)
- Dead functions in milestone.cjs, verify.cjs, state.cjs, roadmap.cjs (~400 lines)
- Dead core.cjs helpers (~200 lines, after dependents removed)
- Dead templates, references (~1,000 lines)
- install.js INST-05/06 cleanup (~300 lines)
- Dead agents to replace: gsd-phase-researcher, gsd-roadmapper (~2,000 lines)

### Phase 12 Requirement IDs
- **INTG-01**: Research gatherers wired into framing pipeline (already done Phase 9, re-verify)
- **INTG-02**: Hooks audit (already done Phase 9, re-verify)
- **INTG-03**: All @file references resolve (re-verify after changes)
- **CMD-01**: 11-command surface works end-to-end (the primary deliverable)

### Execution Order (recommended for planner)
1. Wire v2 pipeline (plan/execute/review/doc workflow rewrites) — fixes B1
2. Bootstrap STATE.md + ROADMAP.md in init — fixes B2
3. Add capability→feature bridge (capability orchestrator, discuss-capability feature stubs) — fixes B3
4. Create new commands (/gsd:plan, /gsd:review, /gsd:status, /gsd:focus) — CMD-01
5. Slug resolution (3-tier) — enables single entry point
6. Template rewrites (state.md, roadmap.md, capability.md)
7. Agent updates (planner, executor, verifier, plan-checker, codebase-mapper)
8. install.js cleanup (INST-05/06)
9. Dead v1 code deletion (final sweep)
10. @file reference verification (confirm nothing broken)
