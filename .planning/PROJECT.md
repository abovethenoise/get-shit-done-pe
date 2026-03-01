# GSD v2

## What This Is

A refactored meta-prompting orchestration framework for AI coding assistants. Replaces the current GSD's project/milestone/phase hierarchy with a project/capability/feature model. Adds context-sensitive workflows (debug, new, enhance, refactor), 3-layer requirements, iterative self-critiquing plans, 4-parallel code review, and a reflect-and-write documentation step. Built for a data professional who owns strategy and domain — the framework owns engineering execution.

## Core Value

Every piece of executed work traces back to a specific requirement, and every requirement is verified against the actual code — no orphan tasks, no unverified output.

## Current Milestone: v2.0 — Install-Ready Launch

**Goal:** Make all milestone 1 work (phases 1-7) installable, functional, and clean. If you can't `npm install -g` it and run it on a real project, it's useless.

**Target:**
- All v2 artifacts deploy via install.js to ~/.claude/
- 11-command surface works end-to-end (init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review)
- Full pipeline runs: discovery → research → requirements → plan → execute → review → docs
- Holistic legacy cleanup — remove everything the v2 pipeline doesn't use
- Smoke test on a real project (new and existing)

## Requirements

### Validated

<!-- Designed and built in milestone 1 (phases 1-7). Not yet deployed. -->

- ✓ Meta-prompting orchestration: commands (markdown + YAML frontmatter) → workflows → agents — existing
- ✓ gsd-tools CLI for file I/O, state mutation, git, config parsing — existing
- ✓ Markdown-based artifact system (.planning/) — existing
- ✓ STATE.md for persistent project memory across context resets — existing
- ✓ Wave-based parallel execution of independent work — existing
- ✓ Q&A/discussion-driven context gathering — existing
- ✓ Template system for canonical document formats — existing
- ✓ Role-based model resolution (executor→sonnet, judge→opus) — milestone 1
- ✓ Zero runtime dependencies (Node.js stdlib + vendored js-yaml/argparse) — existing
- ✓ Project → Capability → Feature hierarchy — milestone 1 phase 1
- ✓ Four workflow framings (debug/new/enhance/refactor) with lens-specific discovery — milestone 1 phase 6
- ✓ 3-layer requirements (EU/FN/TC) — milestone 1 phase 1
- ✓ 6 parallel research gatherers + synthesizer with gather-synthesize pattern — milestone 1 phase 2
- ✓ Iterative planner with self-critique (2 rounds) + Q&A + validation gate — milestone 1 phase 3
- ✓ 4 parallel code reviewers + synthesizer with evidence-gated verdicts — milestone 1 phase 4
- ✓ Reflect-and-write documentation agent — milestone 1 phase 5
- ✓ Discovery Brief as handoff artifact between discovery and pipeline — milestone 1 phase 6
- ✓ Framing-pipeline with 6 stages and universal escalation protocol — milestone 1 phase 6
- ✓ /init with auto-detect (new/existing) — milestone 1 phase 6
- ✓ discuss-capability/discuss-feature with fuzzy resolution and backward routing — milestone 1 phase 6
- ✓ Full traceability: every plan task maps to specific requirement IDs — milestone 1 phase 3

### Active

<!-- Milestone 2 scope: deploy, clean, integrate, validate. -->

- [ ] All v2 commands, workflows, agents, templates, references deploy via npm install -g
- [ ] Source files use {GSD_ROOT} path references (install.js resolves at install time)
- [ ] 11-command surface: init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review
- [ ] 26 unused commands removed (phase management, milestone lifecycle, utilities)
- [ ] 20 orphaned workflows removed
- [ ] Orphaned agents removed (gsd-codebase-mapper)
- [ ] 6 research gatherers wired into framing pipeline (currently orphaned from surviving command chain)
- [ ] install.js stripped to Claude Code only (remove Codex/Gemini/OpenCode adapters)
- [ ] install.js: remove patch backup system, manifest, changelog/version metadata
- [ ] gsd-tools.cjs: full audit + simplify (verify all modules, remove dead code)
- [ ] Hooks: keep context monitor + statusline, drop update check, audit for v2 effectiveness
- [ ] Default config.json ships with package
- [ ] Framings directory (anchor questions) deployed via install
- [ ] Full command audit — every surviving command fires without error
- [ ] Holistic template audit — remove stale, update for v2 model
- [ ] Holistic reference audit — remove unused, verify v2 accuracy
- [ ] Smoke test: install, run /init on fresh repo, run framing commands, verify pipeline

### Out of Scope

- Multi-AI-runtime support (Codex/Gemini/OpenCode) — Claude Code only for v2.0, port later
- New features or capabilities — deploy what was designed, don't redesign
- Publishing to npm — personal tooling first
- Backward compatibility with v1 GSD artifacts — clean break
- User patch backup/reapply system — removed

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
| Project/Capability/Feature hierarchy | Matches how user thinks about work — capabilities are user-facing, features are building blocks | ✓ Built in milestone 1 |
| 3-layer requirements (EU/FN/TC) | Each layer serves a different reviewer — domain, functional, and technical nuance | ✓ Built in milestone 1 |
| System self-critique (2 rounds max) | Surfacing assumptions prevents silent guessing; hard stop prevents loops | ✓ Built in milestone 1 |
| 4 parallel reviewers + synthesizer | Parallel specialization catches more issues; synthesizer assigns severity with cross-report context | ✓ Built in milestone 1 |
| Framing-aware agents (same agent, different questions) | Lens changes, not the agent — discovery brief carries framing context through pipeline | ✓ Built in milestone 1 |
| Clean break from v1 artifacts | Backward compat would constrain redesign | ✓ Confirmed |
| 11-command surface (not 37) | Phase 6 CONTEXT.md defines the v2 command set — everything else is cruft | ✓ Decided in milestone 2 |
| Claude Code only for v2.0 | Focus on one runtime. Strip Codex/Gemini/OpenCode adapters. | ✓ Decided in milestone 2 |
| Files conform to install.js conventions | Less risk than modifying install.js. v2 files use gsd-* prefix, correct directories. | ✓ Decided in milestone 2 |
| Source uses {GSD_ROOT} paths | install.js resolves at install time. No hardcoded absolute paths in source. | ✓ Decided in milestone 2 |
| Remove patch backup system | Overcomplication for personal tooling | ✓ Decided in milestone 2 |
| Drop update check hook | Noise for personal use. Keep context monitor + statusline. | ✓ Decided in milestone 2 |
| Capability/feature directory only | New projects use .planning/capabilities/. No phases/ directory. | ✓ Decided in milestone 2 |

---
*Last updated: 2026-02-28 after milestone 2 initialization*
