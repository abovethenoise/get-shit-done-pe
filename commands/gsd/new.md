---
name: gsd:new
description: Architect mode -- define problem space before solutioning through structured discovery
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
Run architect-mode discovery for a new capability or feature. Defines the problem space before solutioning through exploratory but disciplined questioning.

**Thinking mode:** Forward -- from problem to shape. Exploratory but disciplined. Define before designing.

**Flow:** Fuzzy resolve capability -> lens-specific discovery Q&A -> MVU tracking (problem + who + done criteria + constraints) -> Discovery Brief

**MVU (Minimum Viable Understanding):**
- The problem or goal stated in one sentence with audience identified
- Who experiences this problem (specific, not "users")
- A list of scenarios or examples that illustrate the problem or goal
- At least one observable, testable done criterion
- Non-negotiable constraints identified (or explicitly unconstrained)
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** new
**User reference:** $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init framing-discovery new`.
</context>

<process>
Execute the framing-discovery workflow from @{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md end-to-end.

Pass: LENS=new, CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching).

Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback).
</process>
