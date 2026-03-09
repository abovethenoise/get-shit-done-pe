---
name: gsd:discuss-feature
description: Explore HOW a specific feature works before implementation
argument-hint: "<feature reference>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Guided exploration of a feature's implementation approach, edge cases, and dependencies. Optional thinking partner between planning and execution.

**How it works:**
1. Resolve fuzzy feature reference to a specific feature within a capability
2. Check status (killed/deferred shows reasoning, offers override)
3. Guided Q&A exploring HOW (implementation, edge cases, dependencies, data flow)
4. Detect backward routing needs (feature reveals capability misconception)
5. Update feature spec (Goal, Flow, Scope, composes[], User-Facing Failures)
6. Can kill or defer features with reasoning

**Output:** Updated feature spec at `.planning/features/{feat}/FEATURE.md`
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/discuss-feature.md
</execution_context>

<context>
Feature reference: $ARGUMENTS (required — accepts fuzzy natural language like "drill timing" or "mistake-grading/auto-classify")

Context resolved in-workflow using `init discuss-feature` and `feature-list` tool calls.
</context>

<process>
1. Initialize via `init discuss-feature`
2. Resolve user's reference via `gsd-tools slug-resolve "$ARGUMENTS" --type feature` (3-tier: exact -> fuzzy -> fall-through)
3. Confirm resolved feature with user (auto-select on unique, present candidates on ambiguous, clarify on no match)
4. Load feature file and parent capability context
5. Check feature status (killed/deferred: show reasoning, offer override)
6. Guided exploration: implementation approach, edge cases, dependencies, data flow
7. Detect backward routing signals (feature reveals capability misconception)
8. Detect kill/defer signals during discussion
9. Update feature notes
10. Present summary and next steps

**Key behaviors:**
- Resolution: uses universal slug-resolve CLI route (3-tier)
- Backward routing: can route to discuss-capability or replan when feature reveals upstream issues
- Kill/defer: persists reasoning in feature file
- Grounded in capability context: references parent capability's exploration notes
</process>

<success_criteria>
- Feature resolved from fuzzy reference
- Status checked before proceeding
- Implementation approach, edge cases, and dependencies explored
- Backward routing detected and handled when needed
- Feature notes updated
- User knows next steps
</success_criteria>
