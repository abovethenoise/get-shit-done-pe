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

**3.0.2** — Execution-aware routing: new `route-check` graph query provides complexity-aware progress routing with topological ordering — classifies project state as simple (linear chain) or complex (branching, shared cap contention, deep dependencies, cycles) with actionable signals. New `execute-preflight` query catches missing plans, stale plans, and upstream gaps before execution starts — integrated into both `/gsd:execute` command and `execute-plan.md` workflow. Progress routing (`/gsd:progress`) Tier 2/3 replaced with single graph-aware `route-check` that outputs ordered work chains or suggests `/gsd:focus` for complex projects. Templates default to `exploring` status and capabilities include `depends_on: []`. Plan workflow adds sequence check with upstream readiness routing. Focus groups validate upstream gaps for scoped capabilities (not just features). Discussion workflows write `depends_on` from dependency tables.

**3.0.0** — Architecture overhaul: capabilities and features decoupled into independent directories (`.planning/capabilities/` and `.planning/features/`). Capabilities are now primitives with formal contracts (Receives/Returns/Rules); features compose capabilities via `composes[]` frontmatter edges. New dependency graph layer builds a DAG from composes[] and powers sequence, coupling, waves, downstream (blast radius), upstream (readiness), and upstream-gaps (contract completeness) queries. New `/gsd:sequence` command generates SEQUENCE.md with executable/blocked ordering, parallel branches, coordinate points, critical path, and orphan detection. Focus groups now use graph-driven wave ordering with mgrep semantic gap detection for undeclared capabilities. External tool activation across the full pipeline: Context7 for live library docs (research agents, planner, executor, verifier, review-technical), WebSearch/WebFetch for ecosystem knowledge (research agents, executor, review-technical), mgrep semantic search for gap detection in focus, plan, review, and coherence workflows. Upstream-gaps checks integrated into progress routing, focus scope validation, and refine scope expansion. Downstream consumer awareness added to planner (contract-preserving tasks) and reviewer (blast radius context).

**2.0.4** — Subagent delegation overhaul: consolidated 4 scattered delegation docs into a single `delegation.md` reference (model routing, delegation shapes, heuristics, anti-patterns). All workflow command files audited and updated to use `subagent_type` parameter in `Task()` calls instead of reading agent definitions for model info. Removed redundant agent-file reads from orchestrators, dead model-routing code from CLI layer. Slug resolution upgraded from substring matching to BM25 scoring with hyphen-normalized fuzzy matching.

**2.0.3** — Requirements refinement + pipeline overhaul: new `/gsd:refine` command runs a 5-stage coherence audit across all capabilities (landscape scan, coherence synthesis, interactive Q&A, change application, delta computation). Pipeline consolidated into a single scope-fluid orchestrator (`framing-pipeline.md`) — capability scope fans out plan+execute per feature in DAG wave order, then runs review+doc once for the full scope; feature scope runs linearly. Execute→review→doc auto-chains with no user gates between stages (human checkpoints only at review findings Q&A and doc approval). Progress routing rewritten with focus-aware 3-tier routing. Doc pipeline split into three purpose-built agents: gsd-doc-explorer (6x sonnet, one per focus area), gsd-doc-synthesizer (1x inherit, route validation + deduplication), gsd-doc-writer (Nx sonnet, parallel by route group) with post-write verification via expected_behavior assertions. New doc-tiers reference for 5-tier documentation hierarchy.

**2.0.2** — Pipeline execution improvements: plan presentation restructured with 3-layer justification before approval + unconditional deep-dive; doc writer overhauled to gather-synthesize pattern (5 parallel focus-area explorers + synthesizer) with standalone `/gsd:doc` skill; all 4 lens commands now accept capability slugs and route to framing-pipeline for fan-out, `/gsd:new` adds unknown-slug disambiguation and feature stub auto-creation.

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
| Requirements are implicit | Capability contracts (Receives/Returns/Rules) + feature composition (composes[]) |
| Discovery happens once, then build | Human-in-the-loop at every stage |
| Review = "does the code work?" | Review = UX + behavioral contracts + tech specs + code quality |
| Fix problems when found | Discuss problems → decide if re-research or re-plan is needed |
| Ship it | Get it right |

### Capabilities and Features, Not Phases

Instead of organizing work into milestones and phases (project management), PE organizes work into **capabilities** (primitives with formal contracts) and **features** (shippable units that compose capabilities).

**Capabilities** are the building blocks. Each defines a contract: what it Receives, what it Returns, and what Rules govern its behavior. They live independently in `.planning/capabilities/`.

**Features** declare which capabilities they need via `composes[]` frontmatter. A feature composing `[auth, database]` can't execute until both capabilities are verified. Features live independently in `.planning/features/`.

This composition model creates a dependency graph. The system uses it to compute execution order (waves), detect blast radius (downstream), check readiness (upstream), and find contract gaps — all automatically.

Each feature carries structured requirements that travel through the entire pipeline — research, plan, execute, review.

### Contract-Based Verification

Capabilities define contracts: what they Receive, what they Return, and what Rules govern behavior. Features define a Goal (verifiable sentence), a Flow (capability sequence with branches), and a composes[] list of which capabilities they orchestrate.

These aren't decorative. When agents execute, they're building against capability contracts. When reviewers evaluate, four specialized reviewers check from different perspectives:

1. **End-user reviewer** — Does the Goal hold? Do User-Facing Failures match?
2. **Functional reviewer** — Does the Flow execute correctly? Are handoff contracts honored?
3. **Technical reviewer** — Are composed capability contracts (Receives/Returns/Rules) satisfied?
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

**Focus groups** are a simple Q&A: "What capabilities and features do you want to focus on building?" The system queries the dependency graph for wave ordering, runs mgrep semantic search to detect undeclared capability signals, validates upstream contract completeness, and checks for overlap with existing groups. It might tell you: "You need to build these features first before you can tackle A, B, and C" — and it knows *why*, because it's reading the composes[] graph.

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
/gsd:discuss-capability <cap>              Define capability scope + contract
/gsd:discuss-feature <cap/feat>            Lock in feature preferences + composes[]
    ↓
/gsd:refine                                (Optional) Cross-capability coherence audit
    ↓
/gsd:sequence                              Build dependency graph → SEQUENCE.md
/gsd:focus <cap>                           Create focus group (graph-driven wave ordering)
    ↓
/gsd:new|enhance|refactor|debug <slug>     Frame the work
    ↓
/gsd:plan <slug>                           6 parallel researchers → synthesizer → planner → checker
    ↓
  (auto-executes)                          Parallel agents, fresh context per plan, atomic commits
    ↓
  (auto-reviews)                           4 reviewers → synthesizer → discuss → remediate
    ↓
  (auto-documents)                         6 doc explorers → synthesizer → approval → writers
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

Built on [GSD by TÂCHES](https://github.com/glittercowboy/get-shit-done). The engineering harness — markdown structure, hooks, CLI commands, subagent patterns — comes from that foundation. This fork reimagines the thinking model: capabilities with formal contracts replace phases, features compose capabilities via dependency graphs, and the pipeline is optimized for getting it right over getting it shipped.

**Author:** [abovethenoise](https://github.com/abovethenoise)
**License:** MIT

---

<div align="center">

**Claude Code is powerful. GSD-PE makes it thoughtful.**

</div>
