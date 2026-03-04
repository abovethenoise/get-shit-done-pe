---
phase: research-overhaul
plan: 01
subsystem: pipeline-execution
tags: [research, plan-workflow, task-blocks, lens-reuse]
dependency_graph:
  upstream: []
  downstream: [02-PLAN, 03-PLAN, 04-PLAN]
key_files:
  - path: get-shit-done/workflows/plan.md
    role: "Rewritten Step 5 with 6+1 explicit Task() spawns, lens-aware reuse, mandatory research"
decisions:
  - "Kept 'Do NOT offer skip research' instruction in failure path -- this is an anti-skip directive, not a skip gate"
  - "10 total Task() blocks in plan.md (7 research + 3 existing) exceeds the >= 9 verification threshold"
metrics:
  tasks: 2
  files_modified: 1
  lines_added: ~108
  lines_removed: ~4
---

# Plan 01 Summary: Replace plan.md research delegation with explicit Task() blocks

Rewrote plan.md Step 5 to eliminate the ambiguous `@research-workflow.md` delegation that caused the model to shortcut gatherer spawning. The new Step 5 contains 6 explicit `Task()` blocks (one per gatherer dimension) plus a 7th for the synthesizer, matching the pattern already established in Step 7.

## Task Results

| # | Task | Status | Req |
|---|------|--------|-----|
| 1 | Remove skip gates and --skip-research from Steps 1-2 | Done | TC-03 |
| 2 | Replace Step 5 with explicit Task() blocks + lens-aware reuse | Done | FN-01, FN-03, FN-04, TC-01, TC-02 |

## What Changed

**Removed from plan.md:**
- `research_enabled` and `has_research` from Step 1 parse list
- `--skip-research` flag from Step 2
- Entire old Step 5 (delegation to @research-workflow.md, skip gates, "skip research" failure option)

**Added to plan.md Step 5:**
- Lens-aware reuse check: reads RESEARCH.md YAML frontmatter, compares lens tuple (primary + secondary), reuses on match
- 6 parallel gatherer Task() blocks (domain, system, intent, tech, edges, prior-art) with model="sonnet"
- 1 synthesizer Task() block with model="inherit" and frontmatter schema instruction (lens/secondary_lens/subject/date)
- Retry logic: failed gatherers retry once, abort if >3 fail
- Failure path: "provide context" or "abort" only -- no skip option

## Deviations

None.
