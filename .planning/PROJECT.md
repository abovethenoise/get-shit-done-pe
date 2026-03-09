# GSD-PE (Get Shit Done — Product Edition)

## What This Is

A context engineering and coding harness plugin for Claude Code. GSD-PE replaces ad-hoc AI-assisted development with structured workflows: capability contracts define primitives, features compose them via DAG-based sequencing, and multi-agent pipelines handle research, planning, execution, review, and documentation. Published as an npm package (`get-shit-done-pe`).

## Core Value

Structured thinking produces better software — capabilities define what exists, features define how it's used, and the graph ensures nothing ships without its dependencies.

## Requirements

### Validated

- Capability/feature decoupled model with YAML frontmatter contracts
- Graph-based sequencing from composes[] edges (topological sort → waves)
- Multi-agent delegation: gather-synthesize (N→1), single (1→1), flat only
- Model routing: Opus for judgment/synthesis, Sonnet for execution/gathering
- 17 slash commands covering full lifecycle (init → discuss → plan → execute → review → doc)
- 4 hooks: statusline, context-monitor, auto-update, AskUserQuestion guard
- 5-tier documentation hierarchy
- 3-tier error escalation with backward reset budget
- Atomic commits per task
- Session resumption via STATE.md + CONTINUE-HERE.md
- npm installer with global/local/uninstall modes

### Active

- [ ] Dogfood GSD-PE on itself to validate v3.0.0 workflows
- [ ] Discover refinement/enhancement needs through self-use

### Out of Scope

- GUI/web interface — this is a CLI plugin, not a standalone app
- External service integrations (databases, cloud APIs) — local-only by design
- Nested agent delegation — flat delegation is a principled constraint

## Context

Forked from a phase/milestone-based project (GSD by TÂCHES). Evolution path: phases → capabilities+features (hierarchical) → decoupled model (capabilities=primitives, features=composition). Graph sequencing added to handle non-linear co-dependencies.

Just completed major cleanup for v3.0.0: removed all legacy phase/milestone/roadmap code, added multi-focus support, activated mgrep/Context7/WebSearch across pipeline, added graph layer for sequence/coupling/waves.

## Constraints

- **Runtime:** Node.js >= 16.7.0, CommonJS (.cjs) + ES modules (.js)
- **Dependencies:** Minimal — js-yaml (runtime), c8 + esbuild (dev only)
- **Platform:** Claude Code extension system (hooks, commands, agents)
- **Testing:** Node native test runner, 70% line coverage threshold
- **Delegation:** Flat only — no nested agent spawning (principled, not workaround)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Decouple capabilities from features | Capabilities are primitives; features are orchestration of primitives | ✓ Good |
| DAG from composes[] edges | Non-linear co-dependencies require graph, not sequential planning | ✓ Good |
| Flat delegation (no nesting) | Clarity, cost control, context isolation | ✓ Good |
| Markdown-first orchestration | Workflows as markdown = auditable, modifiable, no compilation | ✓ Good |
| YAML frontmatter for metadata | Machine-readable metadata on human-readable documents | ✓ Good |
| Zero production dependencies | Only js-yaml at runtime; everything else is Node stdlib | ✓ Good |

---
*Last updated: 2026-03-09 after /gsd:init brownfield scan*
