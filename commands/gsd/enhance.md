---
name: gsd:enhance
description: Editor mode -- find the seam and extend through it via structured discovery
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
Run editor-mode discovery for enhancing an existing capability or feature. Understands what exists, finds the seam, and plans the extension.

**Thinking mode:** Outward -- from current state to extended state. Pragmatic, surgical. Find the seam, extend through it.

**Flow:** Fuzzy resolve capability -> lens-specific discovery Q&A -> MVU tracking (observed behavior + desired behavior + delta) -> Discovery Brief

**MVU (Minimum Viable Understanding):**
- Observed behavior concretely described (not aspirational)
- Desired behavior clearly distinguishable from current
- The specific delta identified with the seam where modification occurs
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/framing-discovery.md
@~/.claude/get-shit-done/references/framing-lenses.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** enhance
**User reference:** $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init framing-discovery enhance`.
</context>

<process>
Execute the framing-discovery workflow from @~/.claude/get-shit-done/workflows/framing-discovery.md end-to-end.

Pass: LENS=enhance, CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching).

Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback).
</process>
