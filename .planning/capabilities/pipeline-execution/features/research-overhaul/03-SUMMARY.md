---
feature: pipeline-execution/research-overhaul
plan: 03
subsystem: workflows
tags: [audit, documentation, anti-pattern]
requires: []
provides: ["workflow-audit-classification", "research-workflow-reference-docs"]
affects: ["research-workflow.md", "FEATURE.md"]
tech-stack: [markdown]
key-files:
  - path: ".planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md"
    role: "Audit classification table with 22 @workflow.md instances categorized"
  - path: "get-shit-done/workflows/research-workflow.md"
    role: "Reframed as reference documentation -- no imperative delegation language"
key-decisions:
  - "research-workflow.md Step 5 @gather-synthesize.md delegation classified as category-1 and reframed (not just plan.md/framing-pipeline.md)"
  - "init-project.md gather-synthesize reference classified as category-2 (descriptive language, not bare delegation)"
  - "22 total instances found across 8 files; 8 workflow files had zero @workflow.md references"
requirements-completed: [FN-05, FN-07, TC-04]
duration: ~5min
completed: "2026-03-04"
---

# Plan 03 Summary

Full @workflow.md delegation audit across 16 workflow files with classification table, plus research-workflow.md reframed from orchestration workflow to reference documentation.

## Task Results

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Grep all workflows, classify each @workflow.md instance | Done | 47bd69e |
| 2 | Reframe research-workflow.md as reference documentation | Done | cd6c816 |

## What Was Built

**Task 1 -- Audit:** Scanned all 16 workflow files. Found 22 @workflow.md references across 8 files. Classified each:
- 3 category-1 (parallel spawn bugs): plan.md:60, framing-pipeline.md:86, research-workflow.md:152. All have assigned fixes (Plans 01, 02, 03).
- 7 category-2 (sequential handoffs): framing-pipeline stages 3-6, capability-orchestrator, framing-discovery, review.md auto-advance, init-project.md.
- 12+ category-3 (correct usage): required_reading blocks and Task() prompt context refs.

Full classification table with line numbers and dispositions written to FEATURE.md Decisions section.

**Task 2 -- Reframe:** research-workflow.md updated:
- Purpose: "reference documentation for the research gather-synthesize pattern"
- Step 5: descriptive "When callers spawn..." replaces imperative "Delegate to @gather-synthesize.md"
- Step 7: "Output Structure" replaces "Return to Caller"
- key_constraints: documents reference role

## Deviations

- research-workflow.md Step 5 `@gather-synthesize.md` was classified as category-1 (not listed in plan's known instances). The plan's Task 2 already covered this fix, so no additional inline fix was needed -- the reframe eliminated the delegation.
- Plans 01 and 02 have not been executed yet (no SUMMARY files exist). Audit documents plan.md:60 and framing-pipeline.md:86 as category-1 with "FIX in Plan 01/02" disposition rather than "FIXED by Plan 01/02".

## Next

Ready for Plan 04 (review.md Task() block conversion).
