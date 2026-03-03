# GSD (Get Shit Done)

## What This Is

A meta-prompting orchestration framework for Claude Code. Installs as a global npm package and gives Claude Code users a structured, traceable workflow system: slash commands trigger workflows that spawn specialized agents across a project/capability/feature hierarchy. Every piece of executed work traces back to a requirement; every requirement gets verified against actual code.

Built for a data professional who owns strategy and domain — the framework owns all engineering execution.

## Core Value

Every executed task traces to a specific requirement, and every requirement is verified against actual code — no orphan tasks, no unverified output.

## Brand & Design Standards

**Reference:** `get-shit-done/references/ui-brand.md`

Key rules:
- Stage banners: `GSD ► {STAGE}` with `━━━` borders
- Checkpoint boxes: 62-char `╔══╗` format
- Status symbols: ✓ ✗ ◆ ○ ⚡ ⚠
- Next Up block at every major completion (with copy-paste command)
- No random emoji (`🚀`, `✨`, etc.)
- `GSD >` prefix in stage banners (also used in code block banners as plain text)

**Goal for users:** Every output is predictable and scannable. No surprise formatting.

## Requirements

### Validated

<!-- Milestone 2 complete — all of v2.0 is shipped and installable -->

- ✓ Meta-prompting orchestration: commands → workflows → agents → CLI — v2.0
- ✓ Project/Capability/Feature hierarchy replacing phase model — v2.0
- ✓ Four workflow framings (debug/new/enhance/refactor) with lens-specific discovery — v2.0
- ✓ 3-layer requirements (EU/FN/TC) with full traceability — v2.0
- ✓ 6 parallel research gatherers + synthesizer — v2.0
- ✓ Iterative planner with self-critique (2 rounds) + validation gate — v2.0
- ✓ 4 parallel code reviewers + synthesizer — v2.0
- ✓ Reflect-and-write documentation agent — v2.0
- ✓ gsd-tools CLI (50+ routes, zero runtime deps) — v2.0
- ✓ install.js deploys all artifacts via npm install -g — v2.0
- ✓ {GSD_ROOT} token replacement at install time — v2.0
- ✓ Context monitor + statusline hooks — v2.0
- ✓ STATE.md for persistent session memory — v2.0
- ✓ Gather-synthesize reusable orchestration pattern — v2.0
- ✓ focus and progress commands (functional, beyond 11-command spec) — v2.0

### Active

<!-- Post-launch improvements discovered in v2.0 usage -->

- [ ] Install flow is too technical — needs clearer language for non-developers
- [ ] Post-Q&A next steps poorly scoped — after discussing a capability/feature, suggests creating one with the same name
- [ ] AskUserQuestion hallucinates (returns empty) on first call in a session — investigate hook-based warm-up fix
- [ ] PROJECT.md from /init lacks brand/style guidelines section — developers need look & feel context
- [ ] Init output doesn't map clearly to .documentation/ structure

### Out of Scope

- Multi-AI-runtime support (Codex/Gemini/OpenCode) — Claude Code only for v2.x
- Backward compatibility with v1 GSD phase-based artifacts — clean break
- Publishing to npm as public package — personal tooling first
- User patch backup/reapply system — removed in v2.0

## Context

**Current state:** GSD v2.0 is fully built and installed. The 14-phase milestone 2 project is complete. The .planning/ directory contains legacy phase-based artifacts (phases 1-14); these are the historical record of building v2. Going forward, work uses the capability/feature model that v2 itself provides.

**What was just shipped:**
- 13 slash commands (11 in spec + focus + progress)
- 17 specialized agents (5 execution, 7 research, 5 review)
- 16 workflows
- install.js that deploys cleanly to ~/.claude/

**Tech notes:**
- Zero runtime dependencies — Node.js stdlib + vendored js-yaml 4.1.1 + argparse
- All markdown artifacts use {GSD_ROOT} tokens (resolved at install time)
- 14 library modules in get-shit-done/bin/lib/*.cjs
- 13 test suites with 70% line coverage gate
- `state.cjs` is the central hub — all STATE.md mutations route through it

**Known architectural decisions (from milestone 2):**
- Capability/feature directory model (no phases in v2 projects)
- Framing-pipeline reused per feature via capability-orchestrator
- 3-tier slug resolution (exact → fuzzy → fall-through) on all capability/feature refs
- Focus groups replace milestones for sprint-level sequencing
- Plan/execute/review are mid-pipeline entry points — no forced sequential start
- All commits: atomic per task, `{type}({scope}): {desc}` format

## Constraints

- **Stack:** Node.js (CommonJS), zero runtime deps — maintained from v1
- **Runtime target:** Claude Code exclusively (v2.0+)
- **User profile:** Data professional, SQL/analytics background — framework owns all engineering decisions
- **Principles:** DRY, KISS, YAGNI — no abstraction without justification
- **Install method:** `npm install -g` copying to `~/.claude/`
- **Research tooling:** mgrep skill for all searches (overrides built-in WebSearch/Grep)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Project/Capability/Feature hierarchy | Matches how user thinks about work | ✓ Built in milestone 1 |
| 3-layer requirements (EU/FN/TC) | Each layer serves a different reviewer | ✓ Built in milestone 1 |
| Framing-aware agents (same agent, different questions) | Lens changes, not the agent | ✓ Built in milestone 1 |
| Clean break from v1 artifacts | Backward compat would constrain redesign | ✓ Confirmed |
| Claude Code only for v2.0 | Focus on one runtime | ✓ Confirmed |
| {GSD_ROOT} token paths | install.js resolves at install time, no hardcoded paths | ✓ Confirmed |
| Remove patch backup system | Overcomplication for personal tooling | ✓ Confirmed |
| Drop update check hook | Noise for personal use | ✓ Confirmed |
| Focus groups replace milestones | Lightweight DAG-based sequencing | ✓ v2.0 |
| Capability orchestrator reuses framing-pipeline | Not a custom pipeline per capability | ✓ v2.0 |
| 13 commands (not 11) | focus + progress proved useful, kept | ✓ v2.0 |

---
*Last updated: 2026-03-03 after /init migration to capability model*
