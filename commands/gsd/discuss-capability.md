---
name: gsd:discuss-capability
description: Explore WHAT and WHY for a capability before committing to a framing lens
argument-hint: "<capability reference>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Guided exploration of a capability's core idea, boundaries, and suggested lens. Optional thinking partner that sits upstream of framing workflows.

**How it works:**
1. Resolve fuzzy capability reference to a specific capability
2. Check status (killed/deferred shows reasoning, offers override)
3. Guided Q&A exploring WHAT (core idea, boundaries) and WHY (problem, value)
4. Surface cross-capability concerns from the capability map
5. Update capability file with exploration notes and suggested lens
6. Can kill or defer ideas with reasoning

**Output:** Updated capability file in `.documentation/capabilities/` with status, exploration notes, and suggested lens
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/discuss-capability.md
</execution_context>

<context>
Capability reference: $ARGUMENTS (required — accepts fuzzy natural language like "the drill timing thing")

Context resolved in-workflow using `init discuss-capability` and `capability-list` tool calls.
</context>

<process>
1. Initialize via `init discuss-capability`
2. Fuzzy-resolve user's reference to a capability (substring match on capability-list output)
3. Confirm resolved capability with user (auto-select on unique, top-3 on multiple, clarify on none)
4. Load capability file, check status (killed/deferred: show reasoning, offer override)
5. Scan capability map for cross-cutting concerns
6. Guided exploration: core idea, why it matters, boundaries, open questions, suggested lens
7. Detect kill/defer signals during discussion
8. Update capability file (status, exploration section, suggested lens)
9. Present summary and next steps

**Key behaviors:**
- Fuzzy resolution: substring/slug matching, not semantic search
- Cross-capability awareness: raise overlaps naturally during discussion
- Kill/defer: persists reasoning in capability file
- Repeatable: can re-explore any capability at any time
</process>

<success_criteria>
- Capability resolved from fuzzy reference
- Status checked before proceeding
- Core idea, boundaries, and suggested lens captured
- Cross-capability concerns surfaced
- Capability file updated
- User knows next steps
</success_criteria>
