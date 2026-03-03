---
name: gsd:refactor
description: Surgeon mode -- understand load-bearing walls before restructuring via structured discovery
argument-hint: "[capability or feature reference]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
Run surgeon-mode discovery for refactoring an existing capability or feature. Understands load-bearing walls before proposing structural changes.

**Thinking mode:** Underneath -- restructure without changing external behavior. Risk-aware. Understand load-bearing walls before moving them.

**Flow:** Fuzzy resolve capability -> lens-specific discovery Q&A -> MVU tracking (current design + target design + breakage) -> Discovery Brief

**MVU (Minimum Viable Understanding):**
- Current design with load-bearing walls and organic growth areas identified
- Target design with specific structural changes named (not just "cleaner")
- What breaks during transition: consumers, contracts, data migrations, test coverage gaps
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** refactor
**User reference:** $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init framing-discovery refactor`.
</context>

<process>
Execute the framing-discovery workflow from @{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md end-to-end.

Pass: LENS=refactor, CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching).

Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback).
</process>
