---
name: gsd:review-phase
description: Run 4 parallel reviewers and synthesize findings for a phase
argument-hint: "[phase] [--skip-quality]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---
<objective>
Run the full review pipeline for a phase: 4 specialist reviewers in parallel, synthesizer consolidation, user Q&A with 5 response options, and re-review cycling.

**Flow:** Init -> Context Assembly -> Spawn 4 Reviewers (parallel) -> Synthesize -> Present Findings -> Re-review Loop -> Done

Orchestrator role: Bootstrap via init, assemble context, spawn reviewer and synthesizer agents, present findings to user via AskUserQuestion, handle re-review cycles.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/review-phase.md
@~/.claude/get-shit-done/workflows/gather-synthesize.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--skip-quality` -- Skip the code quality reviewer (run 3 reviewers instead of 4)

Context files are resolved inside the workflow via `gsd-tools init review-phase`.
</context>

<process>
Execute the review-phase workflow from @~/.claude/get-shit-done/workflows/review-phase.md end-to-end.
Preserve all workflow gates (parallel reviewer spawning, failure threshold, synthesis, Q&A presentation, re-review cycling).
</process>
