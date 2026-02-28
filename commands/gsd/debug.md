---
name: gsd:debug
description: Detective mode -- narrow from symptom to root cause through structured discovery
argument-hint: "[capability or feature reference]"
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
Run detective-mode discovery for a capability or feature. Narrows from symptom to root cause through convergent questioning.

**Thinking mode:** Backward -- from symptom to root cause. Convergent tone. Narrow the search space, eliminate hypotheses.

**Flow:** Fuzzy resolve capability -> lens-specific discovery Q&A -> MVU tracking (symptom + reproduction + hypothesis) -> Discovery Brief

**MVU (Minimum Viable Understanding):**
- Symptom documented without interpretation
- Reproduction path established
- At least one falsifiable hypothesis about root cause
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/framing-discovery.md
@~/.claude/get-shit-done/references/framing-lenses.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** debug
**User reference:** $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init framing-discovery debug`.
</context>

<process>
Execute the framing-discovery workflow from @~/.claude/get-shit-done/workflows/framing-discovery.md end-to-end.

Pass: LENS=debug, CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching).

Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback).
</process>
