---
phase: research-overhaul
plan: 04
subsystem: workflows
tags: [review, task-blocks, anti-pattern-fix]
dependency_graph:
  depends_on: [03-PLAN]
  feeds_into: []
key_files:
  - path: get-shit-done/workflows/review.md
    role: "Review pipeline orchestrator with explicit Task() spawn blocks"
decisions:
  - "@gather-synthesize.md retained in required_reading as category-3 context reference (correct usage)"
  - "Quality reviewer subagent_type set to gsd-universal-quality-reviewer (matches registration, not file name)"
  - "Synthesizer uses model=inherit (judge role), reviewers use model=sonnet (executor role)"
metrics:
  task_count: 1
  files_modified: 1
  task_blocks_added: 5
---

# Plan 04 Summary: Explicit Task() Blocks in review.md

Replaced ambiguous prose delegation in review.md with 5 explicit Task() pseudo-code blocks (4 reviewers + 1 synthesizer), eliminating the same anti-pattern fixed in plan.md and framing-pipeline.md.

## Task Results

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add explicit Task() blocks to review.md Steps 4, 6, and 9 | done | 382d3c5 |

## What Changed

**Step 4** -- Replaced "Define gatherers: ... Spawn ALL 4 simultaneously" with structured context assembly block + 4 parallel Task() calls (enduser, functional, technical, quality). Each specifies prompt, subagent_type, model, description.

**Step 6** -- Replaced one-line synthesizer prose with explicit Task() block including reviewer manifest with per-dimension status, conflict priority, and gap handling for failed reviewers.

**Step 9** -- Updated re-review loop to reference "same Task() blocks from Step 4" and "Step 6 Task() block" instead of vague re-spawn language.

**Untouched** -- Steps 1-3 (init, context, artifacts), 5 (failure handling), 7-8 (parse/Q&A), 10-12 (log, completion, auto-advance), required_reading, key_constraints.

## Deviations

None.
