---
name: gsd:doc-phase
description: Generate documentation for a phase via single doc-writer agent with Q&A review
argument-hint: "[phase]"
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
Run the full documentation pipeline for a phase: spawn doc-writer agent, verify output files, present generated docs to user via Q&A review, commit on approval.

**Flow:** Init -> Context Assembly -> Locate Artifacts -> Spawn Doc Agent -> Verify Output -> Q&A Review -> Commit

Orchestrator role: Bootstrap via init, assemble context, spawn doc agent, verify output, present docs to user via AskUserQuestion, handle approvals, commit approved docs.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/doc-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init doc-phase`.
</context>

<process>
Execute the doc-phase workflow from @~/.claude/get-shit-done/workflows/doc-phase.md end-to-end.
Preserve all workflow gates (single agent spawn, output verification, Q&A review presentation, impact flag presentation, user approval before commit).
</process>
