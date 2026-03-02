---
name: gsd:focus
description: Create a focus group -- bundle capabilities/features for a sprint with dependency ordering
argument-hint: "[focus group name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create a focus group via guided Q&A. Focus groups are the v2 replacement for milestones -- lightweight sequencing with dependency tracing and overlap detection.

**Flow:** Q&A (goal, scope) -> slug-resolve each item -> dependency trace (explicit + implicit) -> overlap detection against existing groups -> priority ordering -> write to ROADMAP.md + STATE.md
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/focus.md
</execution_context>

<context>
**User reference:** $ARGUMENTS (optional -- focus group name, or empty for Q&A prompt)

Context loaded via `gsd-tools init feature-progress` for capability/feature overview.
</context>

<process>
Invoke the focus.md workflow end-to-end:

```
@~/.claude/get-shit-done/workflows/focus.md
```

Pass: FOCUS_GROUP_NAME from $ARGUMENTS (if provided).

The workflow handles all Q&A, dependency tracing, overlap detection, and ROADMAP.md/STATE.md updates.
</process>

<success_criteria>
- Focus group created with name, goal, and scoped items
- Dependencies traced (explicit from CAPABILITY.md + implicit from shared file paths)
- Overlap with existing focus groups detected and resolved
- ROADMAP.md updated with focus group section
- STATE.md updated with active focus reference
</success_criteria>
