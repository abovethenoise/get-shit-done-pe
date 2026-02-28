# GSD v2

## What This Is

A refactored meta-prompting orchestration framework for AI coding assistants. Replaces the current GSD's project/milestone/phase hierarchy with a project/capability/feature model. Adds context-sensitive workflows (debug, new, enhance, refactor), 3-layer requirements, iterative self-critiquing plans, 4-parallel code review, and a reflect-and-write documentation step. Built for a data professional who owns strategy and domain — the framework owns engineering execution.

## Core Value

Every piece of executed work traces back to a specific requirement, and every requirement is verified against the actual code — no orphan tasks, no unverified output.

## Requirements

### Validated

<!-- Carried forward from existing GSD — proven patterns that survive. -->

- ✓ Meta-prompting orchestration: commands (markdown + YAML frontmatter) → workflows → agents — existing
- ✓ gsd-tools CLI for file I/O, state mutation, git, config parsing — existing
- ✓ Markdown-based artifact system (.planning/) — existing
- ✓ STATE.md for persistent project memory across context resets — existing
- ✓ Wave-based parallel execution of independent work — existing
- ✓ Q&A/discussion-driven context gathering — existing
- ✓ Template system for canonical document formats — existing
- ✓ Model profile resolution (quality/balanced/budget) — existing
- ✓ Zero runtime dependencies (Node.js stdlib only) — existing

### Active

<!-- New capabilities and structural changes for v2. -->

- [ ] Project → Capability → Feature hierarchy replacing project → milestone → phase
- [ ] Four workflow framings: debug, new, enhance, refactor — each with distinct discovery steps converging to same artifact pipeline
- [ ] 3-layer requirements: end-user (story + acceptance), functional (behavior spec), technical (implementation spec)
- [ ] First-principles research: challenge assumptions + reason from constraints upward, parallelized gather → synthesize
- [ ] Iterative planning with system self-critique: research → draft → self-critique (coverage, approach validity, feasibility, surface assumptions) → present to user
- [ ] 4 parallel code reviewers with trace reports: end-user, functional, technical, code quality (DRY/KISS/no bloat)
- [ ] Review synthesis: consolidate 4 reviewer traces → verify findings → present recommendations to user
- [ ] Reflect-and-write documentation step: .documentation/ directory with final-state reference docs generated from actual built code
- [ ] Full traceability: every plan task maps to specific requirement IDs, no orphan tasks allowed
- [ ] Layered agent context: core (project + capability) always present, framing-specific context added on top
- [ ] Goal-driven agent definitions with artifact awareness — framing changes the questions agents ask, not the agent itself
- [ ] Command structure encodes framing: `debug capability`, `new feature`, `refactor capability`, `enhance feature`

### Out of Scope

- Milestones — replaced by capability/feature hierarchy, no separate milestone concept
- Auto-advance — dropped; user controls progression
- Roadmap as separate artifact — replaced by capability/feature breakdown within project
- Multi-AI-runtime support in v2 scope — focus on Claude Code first, port later
- Backward compatibility with v1 GSD artifacts — clean break

## Context

**Existing codebase:** GSD v1 at `get-shit-done-pe/` — Node.js CLI (gsd-tools.cjs), markdown commands/workflows/agents/templates/references. Zero runtime deps, ~1.22.0.

**Brownfield considerations:**
- The layered architecture (commands → workflows → agents → CLI) is proven and carries forward
- gsd-tools.cjs modules (state, frontmatter, git, config) are reusable with modification
- Agent definition pattern (markdown + YAML frontmatter + XML sections) carries forward
- Template and reference patterns carry forward

**What changes structurally:**
- Phase directories (`.planning/phases/NN-name/`) → capability/feature directories
- ROADMAP.md → capability/feature breakdown (structure TBD during research)
- PLAN.md frontmatter needs requirement traceability fields for all 3 layers
- Agent prompts need framing-aware question sets
- New agents: 4 code reviewers + review synthesizer + documentation reflector
- Existing agents (planner, executor, verifier, researcher) need framing-aware refactoring

**Cascade flow (how artifacts ensure execution success):**

```
CAPABILITY (goals + context)
    │
    ▼
FEATURE REQUIREMENTS (3 layers)
    end-user story + acceptance
    functional behavior spec
    technical implementation spec
    │
    ▼
PLAN (tasks reference specific REQ IDs)
    │
    ▼
EXECUTION (builds to plan)
    │
    ▼
REVIEW (4 parallel traces back to requirements → synthesize → recommend)
    │
    ▼
DOCUMENTATION (reflect on what was built, write final-state reference)
```

**Workflow framings — different front doors, same pipeline:**

```
debug:    observe → hypothesize → root cause ──┐
new:      explore → brainstorm ─────────────────┤
enhance:  assess working/broken ────────────────┼──→ requirements → plan → execute → review → docs
refactor: reason for change → explore options ──┘
```

## Constraints

- **Stack**: Node.js (CommonJS), zero runtime deps — same as v1
- **Runtime**: Claude Code as primary target (slash commands, Task tool, agent spawning)
- **User profile**: Data professional, SQL/analytics expert — framework handles all engineering decisions
- **Principles**: DRY, KISS, YAGNI — no abstraction without justification, no complexity for complexity's sake
- **Research tooling**: Must know how to use mgrep skill for efficiency; web research when domain/use-case knowledge is insufficient

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Project/Capability/Feature hierarchy | Current milestone/phase model doesn't match how work is actually scoped — capabilities are user-facing abilities, features are building blocks | — Pending |
| 3-layer requirements | Single-format requirements miss domain, functional, and technical nuance — each layer serves a different reviewer | — Pending |
| System self-critique before presenting plans | Current GSD assumes research → plan is sufficient; surfacing assumptions and asking for guidance prevents silent guessing | — Pending |
| 4 parallel reviewers vs single verifier | One verifier can't trace end-user experience AND code quality simultaneously — parallel specialization catches more issues | — Pending |
| Framing-aware agents (same agent, different questions) | Building separate agents per framing would be redundant — the lens changes, not the agent | — Pending |
| Clean break from v1 artifacts | Trying to maintain backward compat would constrain the hierarchy redesign | — Pending |
| Refactor vs rewrite: TBD | Need research to determine — layered architecture carries forward but structural changes are significant | — Pending |

---
*Last updated: 2026-02-28 after initialization*
