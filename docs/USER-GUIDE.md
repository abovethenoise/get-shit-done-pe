# GSD User Guide

A detailed reference for workflows, commands, and configuration. For quick-start setup, see the [README](../README.md).

---

## Table of Contents

- [How It Works](#how-it-works)
- [Recommended Workflow](#recommended-workflow)
- [Focus Groups and Refinement](#focus-groups-and-refinement)
- [Framing Modes](#framing-modes)
- [Pipeline Stages](#pipeline-stages)
- [Dependency Graph](#dependency-graph)
- [Command Reference](#command-reference)
- [Requirements Model](#requirements-model)
- [External Tool Integration](#external-tool-integration)
- [Configuration Reference](#configuration-reference)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## How It Works

GSD is a meta-prompting and context engineering system for Claude Code. It structures work into capabilities (primitives with formal contracts) and features (shippable units that compose capabilities), then runs a pipeline of specialized agents to research, plan, execute, review, and document the work.

### Core Concepts

- **Capability** -- A primitive with a formal contract: Receives, Returns, Rules (e.g., Authentication, Payments, Search)
- **Feature** -- A shippable unit that composes one or more capabilities via `composes[]` frontmatter (e.g., JWT Login, Password Reset)
- **composes[]** -- The edge model. Features declare which capabilities they need. This creates a dependency graph.
- **Dependency Graph** -- A DAG built from composes[] edges. Powers sequence ordering, wave computation, blast radius analysis, and readiness checks.
- **Focus Group** -- A bundle of capabilities and features sequenced for execution using graph-driven wave ordering. The primary unit for planning and executing work at scale.
- **Refinement** -- Cross-capability coherence audit that finds gaps, overlaps, and conflicts between capabilities defined in isolation.
- **Discovery Brief** -- The output of a framing command: a structured problem definition
- **Lens** -- The framing mode (debug/new/enhance/refactor) that weights every pipeline stage
- **Contract** -- A capability's Receives/Returns/Rules sections. Used for readiness validation and upstream-gaps detection.

---

## Recommended Workflow

This is the workflow GSD is designed around. The phases are flexible -- you can move between them as your understanding evolves -- but the sequence matters.

### Phase 1: Define the Problem Space

```
/gsd:init                                  Initialize project (auto-detects existing code)
    ↓
/gsd:discuss-capability <cap>              Define capability scope + contract
/gsd:discuss-feature <feat>                Lock in feature preferences + composes[]
    ↓
(repeat until you've spec'd enough to start building)
```

Start by initializing the project, then discuss capabilities and features. You don't need to spec everything upfront -- define enough of the initial work to start building, then continue speccing in parallel with development.

Each `/gsd:discuss-capability` session captures the capability's contract (Receives/Returns/Rules). Each `/gsd:discuss-feature` captures the feature's goal, flow, and which capabilities it composes. These become the requirements that agents are held accountable to through the entire pipeline.

**Key insight:** You can run multiple Claude Code sessions. One session focused on planning and execution while another continues speccing out additional capabilities and features.

### Phase 2: Refine Before You Build

```
/gsd:refine                                Cross-capability coherence audit
```

**This is the most important step for complex projects.** When you define capabilities in isolation, there's no guarantee they fit together. Contracts may conflict. Features may assume something a capability doesn't provide. Dependencies may be missing.

`/gsd:refine` steps back and audits the entire project for coherence:
- **Gaps**: Missing dependencies that only surface during implementation
- **Overlaps**: Redundant features across capabilities that do the same thing differently
- **Conflicts**: Scope misalignment where one capability assumes something another doesn't provide

You can have perfectly written capability contracts that still produce broken implementations if they contradict each other. Refinement catches this *before* you waste agent cycles on plans built on a shaky foundation.

**When to refine:**
- After defining 3+ capabilities (more surface area = more potential conflicts)
- Before creating your first focus group
- After major scope changes or new capability additions
- Whenever focus creation or planning flags structural issues (the system will tell you)

### Phase 3: Focus, Plan, Execute

```
/gsd:sequence                              Build dependency graph → SEQUENCE.md
/gsd:focus                                 Create focus group (graph-driven wave ordering)
    ↓
/gsd:plan <focus-slug>                     Cross-cutting research → wave-ordered plans
    ↓
/gsd:execute <focus-slug>                  Wave execution → review → doc
```

Focus groups are how you go from spec'd requirements to running code. Bundle the capabilities and features you want to build into a focus group, and the system handles dependency ordering, cross-cutting research, coordinated planning, and wave execution.

**The refinement gates are automatic.** If focus creation detects too many undeclared capability signals, it routes you to `/gsd:refine` before planning. If focus planning discovers cross-cutting coherence issues, it halts and routes to `/gsd:refine`. After refinement resolves the issues, you return to planning with clean inputs. This isn't optional -- it's a hard gate that prevents agents from building on a contradictory foundation.

### The Full Picture

```
Phase 1                    Phase 2              Phase 3
─────────────────          ──────────           ─────────────────────
discuss-capability ──┐                          sequence
discuss-capability   ├──→  /gsd:refine  ──→     focus
discuss-feature      │                            ↓
discuss-feature   ───┘                          plan <focus>
                                                  ↓
(continue speccing                              execute <focus>
 in parallel) ─────────→  /gsd:refine  ──→       ↓
                                                focus (next group)
```

### Working With Individual Items

Focus groups are the recommended path for complex projects, but you can also work at the item level:

```
/gsd:new|enhance|refactor|debug <slug>     Frame the work (creates Discovery Brief)
    ↓
/gsd:plan <slug>                           Research + plan (capability or feature)
    ↓
/gsd:execute <slug>                        Execute plans
    ↓
/gsd:review <slug>                         4 reviewers → synthesizer → remediate
    ↓
/gsd:doc <slug>                            6 doc explorers → synthesizer → writers
```

This is useful for one-off fixes (`/gsd:debug`), small enhancements, or when you want fine-grained control over individual items.

---

## Focus Groups and Refinement

Focus groups and refinement work together. Focus groups organize *what* you build; refinement ensures *what you defined* is coherent before you build it.

### Why Refinement Matters

When you discuss capabilities in isolation, each one makes sense on its own. But capabilities interact:

| Problem | Example | What Happens Without Refinement |
|---------|---------|--------------------------------|
| **Contract conflict** | Auth returns `{ token: JWT }`, Session expects `{ session_id: UUID }` | Executor builds both, reviewer catches the mismatch, you re-plan |
| **Missing dependency** | Search feature assumes a caching capability that nobody defined | Planner makes assumptions, executor builds something fragile |
| **Scope overlap** | Auth and User-Management both handle password hashing | Two implementations of the same thing, eventual inconsistency |
| **Implicit coupling** | Payments and Notifications both assume a queue but define it differently | Integration fails at the seam nobody specified |

Refinement catches these *before* planning. Agents plan against contracts -- if the contracts contradict each other, the plans will too. Fixing this at the planning stage costs agent cycles. Fixing it at the specification stage costs minutes of Q&A.

### The Refinement Pipeline

```
/gsd:refine
    |
    +-- landscape-scan
    |     Discover all capabilities, enumerate pairs,
    |     analyze each pair for coherence issues.
    |     Output: matrix, findings, dependency graph
    |
    +-- coherence-report
    |     Synthesize findings into root causes,
    |     goal alignment, resolution sequence.
    |     Output: RECOMMENDATIONS.md
    |
    +-- refinement-qa
    |     Walk you through every recommendation.
    |     Accept, reject, modify, or flag for research.
    |     Output: CHANGESET.md
    |
    +-- change-application
    |     Apply confirmed changes to capability/feature files.
    |     Creates via CLI, edits via direct markdown changes.
    |     Output: EXECUTION-LOG.md
    |
    +-- delta (if prior run exists)
          Compare current state to previous run.
          Output: DELTA.md
```

All artifacts live in `.planning/refinement/`. Key behaviors:

- **Repeatable**: Run at any point. Each run snapshots prior state for delta computation.
- **Nothing happens without approval**: Every recommendation goes through Q&A. Auto-resolvable items are batched, but you still confirm.
- **Checkpoint resumable**: If interrupted, re-running picks up where it left off.
- **Focus-aware**: When an active focus group exists, refinement scopes to its capabilities and routes back to the focus group on completion.

### Creating Focus Groups

```
/gsd:focus
    |
    1. Check SEQUENCE.md staleness (rebuild if needed)
    2. Q&A: name, goal, scope (mixed caps + features)
    3. Query graph for unified wave ordering
    4. mgrep semantic gap scan:
         Shared semantic surface WITHOUT composes[] overlap
         → surface as "possible undeclared capability"
    5. Upstream contract validation:
         upstream-gaps per item → surface status + contract gaps
    6. Overlap detection against existing focus groups
    7. Priority ordering (wave constraints + user preference)
    |
    Creates .planning/focus/{slug}/FOCUS.md
```

**Refinement gate:** If the gap scan finds 3+ undeclared capability signals, the focus group is created but the system routes to `/gsd:refine` instead of `/gsd:plan`. The capability structure has gaps that will produce unreliable plans. Refine first, then return to planning.

### Focus-Level Planning

```
/gsd:plan <focus-slug>
    |
    1. Read FOCUS.md, compute live wave plan
    2. Load all specs in scope (CAPABILITY.md + FEATURE.md)
    3. User focus Q&A (simplicity / correctness / speed / custom)
    4. Cross-cutting research:
    |     6 gatherers see ALL specs simultaneously
    |     Targets: shared contracts, coordination points,
    |     integration boundaries, sequencing risks
    |     → RESEARCH.md
    |
    5. Per-item planning (wave order):
    |     Each planner receives item spec + RESEARCH.md
    |     + prior-wave plans for dependency context
    |     → PLAN.md per item
    |
    6. Validate all plans
    7. Post-planning recommendations:
    |     Surface ambiguous or critical-path items
    |     that may benefit from deeper research
    |
    7b. Coherence gate:
    |     If cross-cutting issues found → HALT
    |     Route to /gsd:refine, then return
    |
    8. Single approval gate for all plans
    9. Update FOCUS.md status → planned
```

**Why cross-cutting research matters:** When planning items individually, each planner only sees its own spec. Focus-level planning gives every planner visibility into shared contracts, coordination points, and integration boundaries across the entire scope. This produces plans that work together, not just plans that work in isolation.

**Post-planning recommendations** err on the side of caution. If there's any ambiguity on a critical-path item (wave 1 or items blocking later waves), the system recommends deeper research. These are recommendations, not blockers -- you decide which to pursue.

### Focus-Level Execution

```
/gsd:execute <focus-slug>
    |
    1. Recompute waves (handles spec changes since planning)
    |     If wave plan drifted → surface diff before continuing
    |     Resume from current_wave (skip items with SUMMARY.md)
    |
    2. Execute waves (sequential across, parallel within):
    |     Wave 1: Executor A ─┐
    |             Executor B ─┤→ all complete → checkpoint
    |     Wave 2: Executor C ─┘→ all complete → checkpoint
    |     (Continue / Pause / Abort at each checkpoint)
    |
    3. Single review pass (all items in scope):
    |     4 reviewers → synthesizer → Q&A
    |
    4. Single doc pass (all items in scope):
    |     6 explorers → synthesizer → writers
    |
    5. FOCUS.md status → complete
```

**Wave checkpoints** let you pause mid-execution, inspect results, and resume later. The system tracks which wave you're on and which items have completed. `/gsd:resume-work` or `/gsd:execute {focus}` picks up where you left off.

**Single review + doc** means reviewers see the full scope of changes together. A capability contract change that ripples across three features gets reviewed holistically, not three separate times with partial context.

### The Safety Net

The refinement gates form a safety net throughout the focus lifecycle:

```
/gsd:focus
    ↓
    3+ undeclared signals? ──→ /gsd:refine ──→ return to /gsd:plan
    ↓
/gsd:plan <focus>
    ↓
    coherence issues? ──→ /gsd:refine ──→ return to /gsd:plan
    ↓
/gsd:execute <focus>
    ↓
    (execution proceeds with clean inputs)
```

These gates are not optional. The system won't let you plan on a contradictory foundation or execute on an ambiguous plan. This is by design -- the cost of refining is minutes of Q&A; the cost of building on bad specs is hours of debugging and re-planning.

---

## Framing Modes

Every individual work item begins with one of four framing modes. The mode shapes the entire pipeline -- research questions, planning approach, review priorities, documentation focus.

### Debug

```
/gsd:debug <slug>
```

**When:** Something is broken and you need to find and fix it.

**Lens effect:** Research focuses on root cause analysis. Planning creates minimal, targeted fix plans. Review checks the fix is complete without introducing new complexity. Documentation captures what broke, why, and the fix.

### New

```
/gsd:new <slug>
```

**When:** Building something that doesn't exist yet.

**Lens effect:** Research explores ecosystem patterns and prior art. Planning creates feature-complete plans with proper structure. Review checks that abstractions are earned and the new code is as simple as possible. Documentation covers architecture and usage.

### Enhance

```
/gsd:enhance <slug>
```

**When:** Improving or extending existing functionality.

**Lens effect:** Research focuses on the existing implementation and extension points. Planning avoids bloating existing modules. Review checks that existing patterns are respected. Documentation captures what changed and why.

### Refactor

```
/gsd:refactor <slug>
```

**When:** Restructuring code without changing behavior.

**Lens effect:** Research identifies structural problems and target patterns. Planning creates behavior-preserving transformations. Review checks that the refactored structure is actually simpler. Documentation covers before/after and rationale.

Each framing command creates a **BRIEF.md** (at the capability level) that anchors all subsequent work.

---

## Pipeline Stages

Each feature passes through a pipeline. The framing lens weights every stage differently:

| Stage | What Happens | Lens Influence |
|-------|-------------|----------------|
| **Discuss** | Capture user decisions, lock preferences | Shapes what questions are asked |
| **Research** | 6 parallel gatherers + synthesizer | Anchor questions vary by lens |
| **Plan** | Break feature into executable tasks | Task granularity and verification approach |
| **Execute** | Run tasks in parallel waves, commit atomically | Deviation rules and auto-fix behavior |
| **Review** | 4 specialized reviewers + synthesizer | Review priorities weighted by lens |
| **Doc** | 6 doc explorers + synthesizer + N writers | Documentation focus varies by lens |

### Research Pipeline

```
  /gsd:plan <feat>
         |
         +-- Context assembly (6 layers):
         |     structural position (graph downstream)
         |     semantic matches (mgrep)
         |     capability contracts + research findings
         |
         +-- 6 parallel research gatherers:
         |     +-- User intent
         |     +-- Domain truth
         |     +-- Existing system   (+ semantic match leads)
         |     +-- Tech constraints  (+ structural position context)
         |     +-- Prior art
         |     +-- Edge cases        (+ structural position context)
         |           |
         |     Each gatherer has: Context7, WebSearch, WebFetch
         |           |
         |     Synthesizer -> RESEARCH.md
         |
         +-- Planner (reads CONTEXT.md, RESEARCH.md, FEATURE.md)
         |     + downstream consumer context (blast radius)
         |     + semantic scope scan (mgrep)
         |     + Context7 for method signatures
         |           |
         |     Plan Checker (up to 3 iterations)
         |           |
         |     PLAN files
         |
         Done
```

### Review Pipeline

```
  4 parallel reviewers:
    +-- End-user (Goal + User-Facing Failures)
    +-- Functional (Flow + Context handoffs)
    +-- Technical (Capability contracts + downstream + Context7)
    +-- Quality (DRY/KISS/complexity)
          |
    Synthesizer -> findings + remediation
          |
    Human checkpoint (if issues found)
```

### Doc Pipeline

```
  6 parallel doc explorers:
    +-- Inline clarity
    +-- Architecture map
    +-- Domain context
    +-- Agent context
    +-- Automation surface
    +-- Planning hygiene
          |
    Synthesizer -> doc-report.md
          |
    Human checkpoint (approve/reject per recommendation)
          |
    N parallel writers (grouped by route):
      +-- code-comments
      +-- claude-md
      +-- docs
      +-- cleanup
          |
    Verification (expected_behavior assertions)
```

### Brownfield Workflow (Existing Codebase)

`/gsd:init` auto-detects existing code and runs codebase mapping before project questions:

```
  /gsd:init
         |
         +-- Detects existing code
         +-- Maps codebase (parallel agents):
         |     +-- Stack      -> codebase/STACK.md
         |     +-- Architecture -> codebase/ARCHITECTURE.md
         |     +-- Conventions -> codebase/CONVENTIONS.md
         |     +-- Concerns   -> codebase/CONCERNS.md
         |
         +-- Project questions focus on what you're ADDING
```

---

## Dependency Graph

GSD builds a directed acyclic graph (DAG) from `composes[]` frontmatter edges. Features are nodes that point to capability nodes via "composes" edges. This graph powers sequencing, readiness checks, and impact analysis across the pipeline.

### How It Works

```
Feature: checkout-flow                 Feature: order-history
  composes: [payments, inventory]        composes: [payments, reporting]
       |           |                          |           |
       v           v                          v           v
  cap:payments  cap:inventory            cap:payments  cap:reporting
```

The graph engine answers nine types of queries:

| Query | What It Returns | Used By |
|-------|----------------|---------|
| **sequence** | Executable features, blocked features, parallel branches, critical path, orphans | `/gsd:sequence`, progress routing |
| **coupling** | Features sharing a composed capability (change one, affect all) | Coherence report |
| **waves** `--scope <csv>` | Wave 1 (ready), blocked (waiting), coordinate flags (shared caps in wave) | Progress routing |
| **focus-waves** `--scope <csv>` | Mixed cap+feature wave ordering with transitive upstream expansion | Focus groups, focus planning |
| **downstream** `<cap-slug>` | Features that compose this capability (blast radius) | Planner, reviewer, research agents |
| **upstream** `<slug>` | Capabilities this node depends on + status + contract completeness | Readiness validation |
| **upstream-gaps** `<slug>` | Only the upstream caps with status or contract gaps | Progress routing, focus validation, refine scope |
| **route-check** `[--scope <csv>]` | Complexity (simple/complex), signals, topologically sorted work chain, suggested scope | `/gsd:progress` Tier 2 routing |
| **execute-preflight** `<slug>` | Ready/not-ready with reason (no_plan, stale_plan, upstream_gaps) and route | `/gsd:execute`, `execute-plan.md` pre-flight |

### Focus-Waves: Mixed Scope Ordering

The `focus-waves` query handles mixed cap+feature scope -- the key enabling query for focus groups:

1. Accepts a CSV of capability and feature slugs
2. Expands scope: for each feature, follows composes[] transitively to include required upstream capabilities
3. Assigns stage per item (exploring/planning/executing/complete)
4. Filters out complete items
5. Topological sort + BFS depth layering into waves (items with no in-scope dependencies = wave 1)

This means capabilities appear in earlier waves than the features that compose them. A focus group with `[auth, jwt-login, password-reset]` might produce:

```
Wave 1: cap:auth (no deps)
Wave 2: feat:jwt-login (composes auth), feat:password-reset (composes auth)
```

### Sequence Output

`/gsd:sequence` generates `.planning/SEQUENCE.md` with six sections:

1. **What Can Execute Now** -- features whose composed capabilities are all verified/complete
2. **Blocked** -- features waiting on unverified capabilities
3. **Parallel Branches** -- independent feature groups (no shared capabilities)
4. **Coordinate Points** -- capabilities shared by 2+ features (change here affects multiple)
5. **Critical Path** -- blocking capabilities sorted by how many features they unblock
6. **Orphans** -- capabilities composed by nothing, features with empty composes[]

### Contract Completeness

A capability's contract has three required sections: `### Receives`, `### Returns`, `### Rules`. The `upstream-gaps` query checks both status readiness (verified/complete) and contract completeness independently -- a capability can be "verified" but still have a thin contract that will trip up planners.

### Route-Check: Complexity-Aware Routing

The `route-check` query classifies project state and produces an ordered work chain:

```
Simple (all true)              Complex (any one triggers)
─────────────────              ────────────────────────────
1 executable path              2+ disjoint branches sharing a cap
0-2 unready upstream caps      3+ unready upstream caps (transitive)
No shared cap contention       2+ features competing for same
                                 unverified cap
Any depth if linear            Depth 3+ AND branches > 1
```

**Simple projects** get a topologically sorted chain -- step 1 is the next action, each subsequent step follows in dependency order. **Complex projects** get signal explanations and a suggested scope for `/gsd:focus`.

### Execute Pre-Flight

Before execution starts, `execute-preflight` validates three conditions:

| Check | Failure | Route |
|-------|---------|-------|
| Plan exists | `no_plan` | `/gsd:plan <slug>` |
| Plan newer than spec | `stale_plan` | `/gsd:plan <slug>` (or override) |
| Upstream caps ready + contract complete | `upstream_gaps` | `/gsd:plan <slug>` |

Pre-flight runs in both `/gsd:execute` (before workflow invocation) and `execute-plan.md` (before loading plan). Stale plans offer an override option -- the other failures block execution.

---

## Command Reference

### Initialization

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:init` | Initialize project: questions, research, requirements, roadmap. Auto-detects brownfield codebases. | Start of a new project |

### Capability & Feature Discussion

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:discuss-capability <cap>` | Define capability scope and boundaries | Before planning features in a capability |
| `/gsd:discuss-feature <feat>` | Capture implementation decisions for a feature | Before planning, to shape how it gets built |

### Coherence & Refinement

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:refine` | Project-level coherence audit: scan, synthesize, Q&A, apply changes | After defining multiple capabilities, before focus groups, or when the system flags structural issues |

### Sequencing & Focus

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:sequence` | Build dependency graph from composes[] → SEQUENCE.md | After defining capabilities/features, before focus groups |
| `/gsd:focus` | Create a focus group: graph-driven wave ordering + gap detection | After sequencing and refining, before planning |

### Planning & Execution

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:plan <slug>` | Plan a focus group (cross-cutting research + wave-ordered plans), capability (all features), or single feature | Before execution |
| `/gsd:execute <slug>` | Execute plans for a focus group (wave execution + review + doc), capability, or feature | After planning |
| `/gsd:review <slug>` | Code review by 4 specialized reviewers + synthesizer | Auto-chains from focus execute, or run standalone |
| `/gsd:doc <slug>` | Generate documentation via 6 explorers + synthesizer + writers | Auto-chains from review, or run standalone |

### Framing (Individual Items)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:debug <slug>` | Frame a debugging workflow | Something is broken |
| `/gsd:new <slug>` | Frame new feature development | Building something new |
| `/gsd:enhance <slug>` | Frame an enhancement to existing code | Improving existing functionality |
| `/gsd:refactor <slug>` | Frame a refactoring effort | Restructuring without behavior change |

### Navigation & Status

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:status` | Show capability/feature dashboard with progress | Anytime -- "where am I?" |
| `/gsd:progress` | Check progress and route to next action (execute or plan) | Mid-pipeline -- "what's next?" |
| `/gsd:resume-work` | Restore full context from last session | Starting a new session |

---

## Requirements Model

GSD uses a two-level requirements model: **capability contracts** define primitives, **feature specifications** define how those primitives compose into user-facing behavior.

### Capability Contracts

Every capability defines a formal contract in CAPABILITY.md with three required sections:

| Section | What It Defines | Example |
|---------|----------------|---------|
| **Receives** | What inputs this capability accepts | `{ email: string, password: string }` |
| **Returns** | What outputs this capability produces | `{ token: JWT, refresh: httpOnly cookie }` |
| **Rules** | Invariants and constraints governing behavior | "Token expires after 15 minutes, RS256 signing" |

Contract completeness is checked by `upstream-gaps` -- a feature composing a capability with missing contract sections gets flagged before planning.

### Feature Specifications

Every feature defines its specification in FEATURE.md:

| Section | What It Defines | Example |
|---------|----------------|---------|
| **Goal** | One verifiable sentence -- what the user gets | "User can log in with email and password" |
| **Flow** | Ordered capability invocations with branches | "1. auth: validate → 2. session: create → On failure: show error" |
| **composes[]** | Which capabilities this feature orchestrates | `[auth, session-management]` |
| **User-Facing Failures** | What the user sees when a composed capability fails | "auth timeout → 'Service unavailable, try again'" |
| **Context** | Data handoffs between composed capabilities | "auth returns JWT → session stores in httpOnly cookie" |

### How Review Maps to Requirements

Four specialized reviewers each check from a different perspective:

| Reviewer | Traces Against | From |
|----------|---------------|------|
| **End-user** | Goal + User-Facing Failures | FEATURE.md |
| **Functional** | Flow + Context (handoff contracts) | FEATURE.md |
| **Technical** | Composed capability contracts (Receives/Returns/Rules) | CAPABILITY.md |
| **Quality** | DRY, KISS, complexity, dependencies | Code |

The framing lens affects which reviewer's findings carry the most weight:
- **debug**: Technical reviewer (root cause in capability contracts)
- **new**: All four equally
- **enhance**: End-user + Functional (what changes for users)
- **refactor**: Technical + Quality (structural improvements)

---

## External Tool Integration

GSD agents use external tools for live information beyond the codebase:

| Tool | What It Does | When To Use |
|------|-------------|-------------|
| **Context7** | Retrieves current library documentation (APIs, signatures, deprecation status) | Any library API question -- authoritative and version-specific |
| **WebSearch** | Searches current community knowledge (bugs, workarounds, patterns) | Known issues, ecosystem sentiment, breaking changes |
| **WebFetch** | Fetches specific URLs (changelogs, RFCs, issue threads) | When you have a URL from search results or doc links |
| **mgrep** | Semantic code search via MixedBread embeddings | Gap detection, scope validation, call site discovery |

### Where Each Tool Is Used

| Agent/Workflow | Context7 | WebSearch | WebFetch | mgrep |
|---------------|----------|-----------|----------|-------|
| Research agents (all 6) | Library APIs | Ecosystem patterns | Specific URLs | via `<semantic_matches>` context |
| Planner | Method signatures | -- | -- | via `<semantic_scope>` context |
| Executor | API verification | Error diagnosis | Error discussions | -- |
| Verifier | Contract vs library behavior | -- | -- | -- |
| Review (technical) | Constraint verification | Known issues | -- | via `<semantic_call_sites>` context |
| Focus workflow | -- | -- | -- | Undeclared capability detection |
| Coherence report | -- | -- | -- | Semantic coupling scan |
| Plan workflow | -- | -- | -- | Scope validation |
| Review workflow | -- | -- | -- | Call site discovery |

**Note:** mgrep is a skill (main conversation only). Agents receive mgrep results via XML context blocks assembled by orchestrating workflows -- they interpret results, they don't invoke mgrep directly.

---

## Configuration Reference

GSD stores project settings in `.planning/config.json`. Configure during `/gsd:init` or update later.

### Core Settings

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `mode` | `interactive`, `yolo` | `interactive` | `yolo` auto-approves decisions |
| `depth` | `quick`, `standard`, `comprehensive` | `standard` | Planning thoroughness |

### Workflow Toggles

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `workflow.research` | `true`, `false` | `true` | Domain investigation before planning. **Note:** As of 2.0.1, research is always mandatory in the workflow -- this config field is retained but no longer gates research execution. |
| `workflow.plan_check` | `true`, `false` | `true` | Plan verification loop (up to 3 iterations) |
| `workflow.verifier` | `true`, `false` | `true` | Post-execution verification |

### Planning Settings

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `planning.commit_docs` | `true`, `false` | `true` | Whether `.planning/` files are committed to git |
| `planning.search_gitignored` | `true`, `false` | `false` | Include `.planning/` in broad searches |

### Parallelization

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `parallelization.enabled` | `true`, `false` | `true` | Parallel plan execution |
| `parallelization.plan_level` | `true`, `false` | `true` | Run independent plans in parallel |
| `parallelization.task_level` | `true`, `false` | `false` | Run tasks within a plan in parallel |
| `parallelization.skip_checkpoints` | `true`, `false` | `true` | Skip human checkpoints between waves |
| `parallelization.max_concurrent_agents` | 1-5 | 3 | Max parallel executors |
| `parallelization.min_plans_for_parallel` | 1-10 | 2 | Minimum plans needed to trigger parallel mode |

### Gates

| Setting | Default | What it Controls |
|---------|---------|------------------|
| `gates.confirm_project` | `true` | Confirm PROJECT.md before proceeding |
| `gates.confirm_roadmap` | `true` | Confirm ROADMAP.md before proceeding |
| `gates.confirm_breakdown` | `true` | Confirm feature breakdown before planning |
| `gates.confirm_plan` | `true` | Confirm plans before execution |
| `gates.execute_next_plan` | `true` | Confirm before executing each plan |
| `gates.issues_review` | `true` | Pause for human review when issues found |

### Safety

| Setting | Default | What it Controls |
|---------|---------|------------------|
| `safety.always_confirm_destructive` | `true` | Require confirmation for destructive operations |
| `safety.always_confirm_external_services` | `true` | Require confirmation for external service calls |

---

## Usage Examples

### Complex Project (Recommended)

```bash
# Phase 1: Define the problem space
/gsd:init                              # Answer questions, configure, approve roadmap
/clear
/gsd:discuss-capability Authentication  # Define capability scope + contract
/gsd:discuss-capability Payments
/gsd:discuss-feature jwt-login          # Lock in preferences + composes[]
/gsd:discuss-feature checkout-flow
/clear

# Phase 2: Refine before you build
/gsd:refine                             # Scan all capabilities for coherence issues
                                        # Walk through findings in Q&A
                                        # Apply confirmed changes
/clear

# Phase 3: Focus, plan, execute
/gsd:sequence                          # Build dependency graph -> SEQUENCE.md
/gsd:focus                              # Create focus group — Q&A for name, goal, scope
/clear
/gsd:plan auth-sprint                   # Cross-cutting research → wave-ordered plans
/clear
/gsd:execute auth-sprint                # Wave execution → review → doc
/clear

# Continue with next focus group
/gsd:focus                              # New focus group for next batch of work
```

### Simple Project (Individual Items)

```bash
/gsd:init
/clear
/gsd:discuss-capability Search
/gsd:discuss-feature search-filters
/clear
/gsd:new search-filters                # Frame the work
/clear
/gsd:plan search-filters               # Research + plan
/gsd:execute search-filters            # Execute + review + doc
```

### Debug a Problem

```bash
/gsd:debug login-timeout               # Creates discovery brief, frames debugging
/clear
/gsd:plan login-timeout                 # Minimal fix plan
/gsd:execute login-timeout              # Execute + review + doc
```

### Parallel Sessions

```bash
# Session 1: Planning and execution
/gsd:execute auth-sprint                # Execute the current focus group

# Session 2 (separate terminal): Continue speccing
/gsd:discuss-capability Notifications   # Define new capabilities
/gsd:discuss-feature email-alerts       # Define new features
/gsd:refine                             # Refine the expanded scope
```

### Resuming After a Break

```bash
/gsd:resume-work                        # Full context restoration + next action routing
# or
/gsd:status                             # Quick dashboard view
```

---

## Troubleshooting

### "Project already initialized"

You ran `/gsd:init` but `.planning/PROJECT.md` already exists. Delete `.planning/` to start over.

### Context Degradation During Long Sessions

Clear your context window between major commands: `/clear` in Claude Code. Every subagent gets a fresh context. If quality drops, clear and use `/gsd:resume-work` or `/gsd:status`.

### Plans Seem Wrong or Misaligned

Run `/gsd:discuss-feature` before planning. Most plan quality issues come from Claude making assumptions that CONTEXT.md would have prevented. For focus groups, run `/gsd:refine` first -- contradicting capability contracts produce contradicting plans.

### Execution Fails or Produces Stubs

Plans should have 2-3 tasks maximum. If tasks are too large, they exceed what a single context window can produce reliably. Re-plan with smaller scope.

### Refinement Routes You Away From Planning

This is intentional. The system detected structural issues that will produce unreliable plans. Run `/gsd:refine`, resolve the findings, then return to `/gsd:plan`. The cost of refining is minutes; the cost of building on bad specs is hours.

### Lost Track of Where You Are

Run `/gsd:status`. It reads all state files and tells you where you are and what to do next. For focus groups, it shows wave progress and the current item.

### Working on a Sensitive/Private Project

Set `commit_docs: false` during `/gsd:init`. Add `.planning/` to your `.gitignore`. Planning artifacts stay local.

---

## Project File Structure

Capabilities and features live in separate top-level directories. Features reference capabilities via `composes[]` frontmatter -- they are not nested.

```
.planning/
  PROJECT.md                    # Project vision and context
  ROADMAP.md                    # Capability/feature breakdown with status
  STATE.md                      # Decisions, blockers, session memory
  SEQUENCE.md                   # Dependency graph output (generated by /gsd:sequence)
  config.json                   # Workflow configuration
  research/                     # Domain research from /gsd:init
  codebase/                     # Brownfield codebase mapping (auto-generated)
  refinement/                   # Coherence audit output from /gsd:refine
    RECOMMENDATIONS.md          # Synthesized findings with Q&A agenda
    CHANGESET.md                # User decisions from Q&A
    EXECUTION-LOG.md            # Change application results
    DELTA.md                    # Diff from previous refinement run
    matrix.md                   # Capability × capability relationship grid
    dependency-graph.md         # Cross-capability dependency table
    findings/FINDING-{NNN}.md   # Individual coherence finding cards
    pairs/{A}__{B}.complete     # Checkpoint markers for resume
  focus/                        # Focus groups
    {focus-slug}/
      FOCUS.md                  # Frontmatter: name, goal, scope[], current_wave, status
      RESEARCH.md               # Cross-cutting research from focus-level planning
      review/                   # Focus-scoped review traces and synthesis
      doc-report.md             # Focus-scoped doc recommendations
  capabilities/                 # Primitives with formal contracts
    {cap-name}/
      CAPABILITY.md             # Contract: Receives, Returns, Rules, Failure Behavior
      BRIEF.md                  # Discovery Brief from framing
  features/                     # Shippable units that compose capabilities
    {feat-name}/
      FEATURE.md                # Goal, Flow, composes[], User-Facing Failures, Context
      CONTEXT.md                # Implementation preferences from /gsd:discuss-feature
      RESEARCH.md               # Ecosystem research findings
      research/                 # Individual gatherer outputs (6 files)
      {nn}-PLAN.md              # Executable plans (01-PLAN.md, 02-PLAN.md, ...)
      {nn}-SUMMARY.md           # Execution outcomes per plan
      doc-report.md             # Doc recommendations (retained after commit)
      review/                   # Review traces, synthesis, decisions (ephemeral)
```
