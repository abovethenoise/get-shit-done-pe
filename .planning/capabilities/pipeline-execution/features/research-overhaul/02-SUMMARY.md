---
phase: research-overhaul
plan: 02
subsystem: pipeline-execution
tags: [research, framing-pipeline, task-blocks, lens-context]
dependency_graph:
  upstream: [01-PLAN]
  downstream: [03-PLAN, 04-PLAN]
key_files:
  - path: get-shit-done/workflows/framing-pipeline.md
    role: "Rewritten Stage 1 with 6+1 explicit Task() spawns, framing context embedded in each gatherer"
decisions:
  - "Used FEATURE_DIR variable (not output_dir) in all paths to match framing-pipeline's existing variable naming"
  - "Added LENS_METADATA.direction and LENS_METADATA.tone to framing_context payload -- richer than plan.md's payload since framing-pipeline has this metadata available from Section 1"
  - "Kept 'retry once + mark failed' pattern and '>3 failed = MAJOR escalation' matching plan.md Step 5"
metrics:
  tasks: 1
  files_modified: 1
  lines_added: 91
  lines_removed: 24
---

# Plan 02 Summary: Replace framing-pipeline Stage 1 delegation with explicit Task() blocks

Rewrote framing-pipeline.md Section 2 (Stage 1 -- Research) to eliminate the `@research-workflow.md` delegation. The new Stage 1 contains 6 explicit gatherer `Task()` blocks plus a 7th synthesizer `Task()`, matching the pattern established in plan.md Step 5 (Plan 01). The framing context payload is richer than plan.md's because it includes `LENS_METADATA.direction`, `LENS_METADATA.tone`, and `Research focus` fields available from framing-pipeline's Section 1 initialization.

## Task Results

| # | Task | Status | Req |
|---|------|--------|-----|
| 1 | Replace Stage 1 delegation with explicit Task() blocks | Done | FN-02, TC-01, TC-02 |

## What Changed

**Removed from framing-pipeline.md Stage 1:**
- `@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md` delegation
- Parameter passing block (subject, context_paths, output_dir, etc.)
- "The research workflow spawns 6 gatherers in parallel" delegation language

**Added to framing-pipeline.md Stage 1:**
- `mkdir -p` for research directory
- Context payload assembly with core/capability/feature/framing blocks
- 6 parallel gatherer Task() blocks (domain, system, intent, tech, edges, prior-art) with model="sonnet"
- 1 synthesizer Task() block with model="inherit" and frontmatter schema instruction
- Retry logic: failed gatherers retry once, MAJOR escalation if >3 fail
- Validation bash loop checking all 6 output files

**Key link preserved:** Synthesizer writes RESEARCH.md with `lens`/`secondary_lens` frontmatter. When framing-pipeline Stage 3 invokes plan.md, the lens-aware reuse check in plan.md Step 5 reads this frontmatter and skips re-research on match.

## Deviations

None.
