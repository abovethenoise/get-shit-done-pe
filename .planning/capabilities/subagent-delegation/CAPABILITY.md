---
type: capability
name: "Subagent Delegation"
status: exploring
created: "2026-03-07"
---

# subagent-delegation

## Goal

Universal delegation patterns ensuring Sonnet handles executors/gatherers and Opus handles orchestration/judgment — consistently across all GSD entry points.

## Why

Sonnet usage is 0% despite workflows being designed for subagent delegation. The primary agent runs everything on Opus inline, ignoring delegation instructions. No consistent delegation standard exists across entry points (framing, plan, execute, review, doc). This wastes cost, reduces parallelism, and defeats the gather-synthesize architecture.

## Domain Model

| Entity | Description | Relationships |
|--------|-------------|---------------|
| Delegation Pattern | A reusable shape for subagent work (gather-synthesize or single delegation) | Referenced by workflows and skills |
| Model Route | Rule mapping task type to model tier (Sonnet for execution/gathering, Opus for judgment) | Consumed by delegation patterns |
| Orchestrator | The primary Opus agent that coordinates work | Spawns subagents via Agent tool |
| Subagent | A Sonnet-tier agent spawned for scoped, parallelizable work | Created by orchestrator |

## Invariants

1. Executors and gatherers always run on Sonnet via the Agent tool.
2. Orchestration, synthesis, judgment, and user-facing Q&A always run on Opus (primary agent).
3. Delegation patterns are identical regardless of entry point (framing vs manual).
4. Codebase size does not increase — enforcement replaces existing delegation code, not adds to it.

## Boundaries

### Owns

- Reference doc defining delegation patterns, model routing rules, when-to-delegate heuristics
- Audit and enforcement of delegation across all workflows and skills

### Consumes

- Workflow files from pipeline-execution, framing-and-discovery, documentation-generation
- Skill files from command-surface

### Does Not Touch

- Workflow intent or stage sequencing (only how work within stages gets delegated)
- CLI tooling (gsd-tools.cjs)
- Planning artifacts structure

## Architecture Spine

```
[Reference Doc: delegation-patterns.md]
        |
        v
[Workflow files] -- read patterns --> [Agent tool calls with model routing]
[Skill files]    -- read patterns --> [Agent tool calls with model routing]
```

## Dependencies

| Direction | Capability | What | Notes |
|-----------|------------|------|-------|
| Consumes  | pipeline-execution | Workflow files (plan, execute, review, doc) | Modifies delegation within them |
| Consumes  | framing-and-discovery | Discovery workflow files | Modifies delegation within them |
| Consumes  | documentation-generation | Doc workflow files | Modifies delegation within them |
| Consumes  | command-surface | Skill files | Modifies delegation within them |

## Features

Features are listed in priority order. Higher priority features are listed first.

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| delegation-patterns | P1 | none | in-progress |
| workflow-enforcement | P1 | delegation-patterns | exploring |
| skill-enforcement | P2 | delegation-patterns | killed (folded into workflow-enforcement) |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-07 | Use Claude Code Agent tool only | Must align with official Anthropic patterns | No custom subagent infra; constrained to Agent tool capabilities |
| 2026-03-07 | This cap modifies other completed capabilities' workflows | Delegation is cross-cutting; tracking changes per-capability would fragment the work | Completed capabilities get modified without reopening them |
| 2026-03-07 | Codebase size must not increase | Enforcement replaces existing code, flags simplification opportunities | May require consolidating redundant delegation logic |
| 2026-03-07 | Suggested lens: enhance | Improving existing delegation behavior, not building from scratch | Could argue refactor, but the external behavior (delegation) changes, not just structure |
