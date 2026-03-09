# Architecture

## System Overview

GSD-PE is a Claude Code plugin that structures AI-assisted development through capability contracts and feature composition. It replaces ad-hoc prompting with a pipeline: discover → plan → execute → review → doc.

## Core Architecture

```
User (slash commands)
  ↓
Commands (commands/gsd/*.md) — route to workflows
  ↓
Workflows (get-shit-done/workflows/*.md) — orchestrate agents
  ↓
Agents (agents/gsd-*.md) — specialized reasoning
  ↓
CLI Tools (get-shit-done/bin/gsd-tools.cjs) — state, CRUD, graph, git
  ↓
.planning/ — persistent state (PROJECT.md, STATE.md, capabilities, features, plans)
```

## Module Boundaries

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| CLI Tooling | State ops, CRUD, graph queries, git commits | `get-shit-done/bin/lib/*.cjs` |
| Workflows | Pipeline orchestration, agent coordination | `get-shit-done/workflows/*.md` |
| Agents | Specialized research/planning/execution/review | `agents/gsd-*.md` |
| Hooks | Context monitoring, statusline, auto-update | `hooks/gsd-*.js` |
| Installer | File copy, hook registration, CLAUDE.md blocks | `bin/install.js` |

## Delegation Model

**Flat delegation only** — principled constraint for clarity and cost control.

Two shapes:
1. **Gather-synthesize (N→1):** Spawn N parallel agents → wait → synthesize into 1 output
2. **Single (1→1):** Spawn 1 agent for scoped task → process result

Model routing: Opus for judgment/synthesis/planning, Sonnet for execution/gathering.

## Data Flow

```
Capability contracts (YAML frontmatter)
  ↓ composes[]
Feature composition (DAG edges)
  ↓ topological sort
Execution waves (parallel batches)
  ↓ per-task
Atomic commits (git)
  ↓ aggregation
State updates (STATE.md, ROADMAP.md)
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Capabilities decoupled from features | Primitives vs orchestration — different lifecycles |
| DAG from composes[] | Non-linear co-dependencies require graph, not lists |
| Flat delegation | Context isolation, cost control, auditable |
| Markdown-first | Human-readable, version-controlled, no compilation |
| Zero production deps (except js-yaml) | Minimal attack surface, simple distribution |
