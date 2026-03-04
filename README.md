<div align="center">

# GET SHIT DONE — PE

**A product management fork of [GSD by TÂCHES](https://github.com/glittercowboy/get-shit-done).**

Keeps the harness. Replaces the brain.

[![npm version](https://img.shields.io/npm/v/get-shit-done-pe?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-shit-done-pe)
[![npm downloads](https://img.shields.io/npm/dm/get-shit-done-pe?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-shit-done-pe)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

```bash
npx get-shit-done-pe@latest
```

**Works with Claude Code. Mac, Windows, Linux.**

</div>

---

## Changelog

**2.0.1** — Research overhaul: research is now mandatory (no skip gates), all research/review agent spawns use explicit `Task()` blocks instead of ambiguous `@workflow.md` delegation, lens-aware reuse prevents double-research when framing-pipeline hands off to plan.md.

---

## Why This Exists

I don't write code — AI does. I'm a data professional with product vision, domain expertise, and strong opinions about what I'm building. I just don't have the software engineering background to implement it myself.

Claude Code's plan mode was the starting point. It listens, explores, builds a plan. But it doesn't *understand* — it doesn't try to grasp what you're actually building or what your requirements are. It just wants to get stuff done.

That led me to [GSD](https://github.com/glittercowboy/get-shit-done). And at first, it was incredible. The metadata hooks, the CLI, the way it used markdown to structure work — the engineering harness was genuinely great. I could dictate my vision and the system would capture it.

But the thinking model had the same fundamental problem as plan mode: it jumps straight to sequencing. *How should we phase the work?* Not *what should the work be?* It thinks like a project manager — milestones, phases, what can we ship — instead of thinking like a product manager — what are the capabilities, what are the features, what are the requirements that we can actually hold agents accountable to?

I'd find it completing work with no grounding in what the requirements actually were. There was no contract to verify against. No structured way to say "does this actually do what we said it would?"

So I forked it.

**GSD-PE keeps everything that made GSD great** — the markdown structure, the hooks, the CLI commands, the subagent orchestration. But it replaces the project management thinking model with a product management one.

---

## What's Different

### The Lens Shift

| Upstream GSD | GSD-PE |
|---|---|
| Phases and milestones | Capabilities and features |
| "How do we sequence the work?" | "What should the work be?" |
| Requirements are implicit | Three-layer requirement contracts (EU/FN/TC) |
| Discovery happens once, then build | Human-in-the-loop at every stage |
| Review = "does the code work?" | Review = UX + behavioral contracts + tech specs + code quality |
| Fix problems when found | Discuss problems → decide if re-research or re-plan is needed |
| Ship it | Get it right |

### Capabilities and Features, Not Phases

Instead of organizing work into milestones and phases (project management), PE organizes work into **capabilities** (what your product can do) and **features** (what needs to be built to deliver each capability).

A capability has a vision: *this is what the user will be doing and why they need to do it.* That informs the features: *what specifically needs to be built.* Each feature carries structured requirements that travel through the entire pipeline — research, plan, execute, review.

### Three-Layer Requirement Contracts

Every feature defines requirements at three levels:

| Layer | Who It's For | What It Tests |
|---|---|---|
| **EU** — End-User Stories | Product owner | Can the user do what we said they could? |
| **FN** — Functional Behavior | Developers | Does the system behave as specified? |
| **TC** — Technical Constraints | Architects | Are we using the right approach with the right constraints? |

These aren't decorative. They're contracts. When agents execute, they're building against FN and TC specs. When reviewers evaluate, they check all three layers independently — four specialized reviewers plus a synthesizer:

1. **End-user reviewer** — Does the user get what they wanted?
2. **Functional reviewer** — Do the behavioral contracts hold?
3. **Technical reviewer** — Are the specs met?
4. **Quality reviewer** — DRY, KISS, no unjustified complexity?

### Human-in-the-Loop at Every Stage

We're not at the point where we can fully trust agents. PE adds structured touchpoints throughout the pipeline — not just during initial discovery, but at every stage:

```
Discuss capability  →  You confirm scope and boundaries
Discuss feature     →  You lock in implementation preferences
Research            →  System surfaces ambiguities for you to resolve
Plan                →  You validate the approach fits your strategy
Execute             →  Atomic commits, checkpoints for decisions
Review              →  Discuss findings → re-research or re-plan if needed
Document            →  Self-healing docs so the next session has full context
```

The system is proactive about what it doesn't understand. Where are the ambiguities? What assumptions is it making? It enters Q&A mode for you to review and validate before moving forward.

### Focus Groups Instead of Milestones

Project management still exists — but it's lightweight scaffolding, not the main automation mechanism.

**Focus groups** are a simple Q&A: "What capabilities and features do you want to focus on building?" The system analyzes dependencies, detects cross-feature and cross-capability conflicts, and suggests execution order. It might tell you: "You need to build these features first before you can tackle A, B, and C."

Focus groups inform direction. They don't drive the autonomy.

### Four Framing Lenses

Not every piece of work is "build a new thing." PE recognizes four modes, each with its own discovery questions, research priorities, planning approach, and review weights:

| Lens | When | Focus |
|---|---|---|
| `/gsd:new` | Building something new | Full discovery across all requirement layers |
| `/gsd:enhance` | Extending existing functionality | What changes for users, preserving existing patterns |
| `/gsd:refactor` | Restructuring without behavior change | Structural improvements, behavior preservation |
| `/gsd:debug` | Something is broken | Root cause analysis, minimal targeted fix |

---

## How It Works

```
/gsd:init                                  Initialize project (auto-detects existing code)
    ↓
/gsd:discuss-capability <cap>              Define capability scope
/gsd:discuss-feature <cap/feat>            Lock in feature preferences
    ↓
/gsd:focus <cap>                           Sequence features by dependency
    ↓
/gsd:new|enhance|refactor|debug <slug>     Frame the work
    ↓
/gsd:plan <slug>                           6 parallel researchers → synthesizer → planner → checker
    ↓
  (auto-executes)                          Parallel agents, fresh context per plan, atomic commits
    ↓
/gsd:review <feat>                         4 reviewers → synthesizer → discuss → next action
    ↓
  Next feature? → Repeat from framing
  All done? → Next capability
```

Each stage uses multi-agent orchestration: a thin orchestrator spawns specialized agents, collects results, and routes to the next step. Your main context window stays clean — the heavy lifting happens in fresh subagent contexts.

For full command reference, configuration, and usage examples, see the **[User Guide](docs/USER-GUIDE.md)**.

---

## Install

```bash
npx get-shit-done-pe@latest
```

The installer prompts for runtime (Claude Code) and location (global or local).

Verify: `/gsd:status`

Update anytime: `npx get-shit-done-pe@latest`

<details>
<summary><strong>Non-interactive install</strong></summary>

```bash
npx get-shit-done-pe --claude --global    # Install to ~/.claude/
npx get-shit-done-pe --claude --local     # Install to ./.claude/
```

Use `--global` or `--local` to skip the location prompt. Use `--claude` to skip the runtime prompt.

</details>

<details>
<summary><strong>Uninstall</strong></summary>

```bash
npx get-shit-done-pe --claude --global --uninstall
npx get-shit-done-pe --claude --local --uninstall
```

</details>

---

## Attribution

Built on [GSD by TÂCHES](https://github.com/glittercowboy/get-shit-done). The engineering harness — markdown structure, hooks, CLI commands, subagent patterns — comes from that foundation. This fork reimagines the thinking model: capabilities replace phases, three-layer requirements replace implicit specs, and the pipeline is optimized for getting it right over getting it shipped.

**Author:** [abovethenoise](https://github.com/abovethenoise)
**License:** MIT

---

<div align="center">

**Claude Code is powerful. GSD-PE makes it thoughtful.**

</div>
