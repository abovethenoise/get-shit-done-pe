# GSD User Guide

A detailed reference for workflows, commands, and configuration. For quick-start setup, see the [README](../README.md).

---

## Table of Contents

- [How It Works](#how-it-works)
- [Framing Modes](#framing-modes)
- [Workflow Overview](#workflow-overview)
- [Dependency Graph](#dependency-graph)
- [Command Reference](#command-reference)
- [Requirements Model](#requirements-model)
- [Focus Groups](#focus-groups)
- [External Tool Integration](#external-tool-integration)
- [Configuration Reference](#configuration-reference)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## How It Works

GSD is a meta-prompting and context engineering system for Claude Code. It structures work into capabilities (large buckets) and features (shippable units), then runs a pipeline of specialized agents to research, plan, execute, review, and document each feature.

Every piece of work starts with a **framing mode** that shapes how the system approaches the problem. The lens (debug, new, enhance, refactor) affects research questions, planning approach, review priorities, and documentation focus.

### Core Concepts

- **Capability** -- A primitive with a formal contract: Receives, Returns, Rules (e.g., Authentication, Payments, Search)
- **Feature** -- A shippable unit that composes one or more capabilities via `composes[]` frontmatter (e.g., JWT Login, Password Reset)
- **composes[]** -- The edge model. Features declare which capabilities they need. This creates a dependency graph.
- **Dependency Graph** -- A DAG built from composes[] edges. Powers sequence ordering, wave computation, blast radius analysis, and readiness checks.
- **Focus Group** -- A set of features sequenced for execution using graph-driven wave ordering
- **Discovery Brief** -- The output of a framing command: a structured problem definition
- **Lens** -- The framing mode (debug/new/enhance/refactor) that weights every pipeline stage
- **Contract** -- A capability's Receives/Returns/Rules sections. Used for readiness validation and upstream-gaps detection.

---

## Framing Modes

Every GSD workflow begins with one of four framing modes. The mode you choose shapes the entire pipeline -- from what questions are asked during research to what reviewers prioritize.

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

## Workflow Overview

### Capability-Based Lifecycle

```
  /gsd:init                          <- Initialize project
         |
  /gsd:discuss-capability <cap>      <- Define capability scope + contract
         |
  /gsd:discuss-feature <cap/feat>    <- Lock in preferences + composes[]
         |
  /gsd:refine                        <- (Optional) Cross-capability coherence audit
         |
  /gsd:sequence                      <- Build dependency graph -> SEQUENCE.md
  /gsd:focus <cap>                   <- Create focus group (graph-driven wave ordering)
         |
  /gsd:debug|new|enhance|refactor    <- Frame the work (creates Discovery Brief)
         |
  /gsd:plan <slug>                   <- Research + plan + verify
         |                              (auto-chains: execute -> review -> doc)
  Next feature?  ---> Repeat from framing
         |
  All features done ---> Next capability
```

### Pipeline Stages

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

### Execution

Execution auto-chains from planning. Plans execute in dependency-ordered waves:

```
  Wave 1 (independent plans):
    +-- Executor A (fresh context) -> commit per task
    +-- Executor B (fresh context) -> commit per task

  Wave 2 (depends on Wave 1):
    +-- Executor C (fresh context) -> commit per task
```

After execution completes, review auto-chains (no user gate).

### Review Pipeline

```
  (auto-chained from execute)
         |
         +-- Context assembly:
         |     downstream blast radius (graph)
         |     semantic call sites (mgrep)
         |
         +-- 4 parallel reviewers:
         |     +-- End-user (EU requirements)
         |     +-- Functional (FN requirements)
         |     +-- Technical (TC + downstream + Context7 + WebSearch)
         |     +-- Quality (DRY/KISS/complexity)
         |           |
         |     Synthesizer -> findings + remediation
         |           |
         |     Human checkpoint (if issues found)
         |
         Done -> auto-chains to Doc
```

### Doc Pipeline

```
  (auto-chained from review)
         |
         +-- 6 parallel doc explorers:
         |     +-- Inline clarity
         |     +-- Architecture map
         |     +-- Domain context
         |     +-- Agent context
         |     +-- Automation surface
         |     +-- Planning hygiene
         |           |
         |     Synthesizer -> doc-report.md
         |           |
         |     Human checkpoint (approve/reject per recommendation)
         |           |
         |     N parallel writers (grouped by route):
         |       +-- code-comments
         |       +-- claude-md
         |       +-- docs
         |       +-- cleanup
         |           |
         |     Verification (expected_behavior assertions)
         |
         Done
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

The graph engine answers six types of queries:

| Query | What It Returns | Used By |
|-------|----------------|---------|
| **sequence** | Executable features, blocked features, parallel branches, critical path, orphans | `/gsd:sequence`, progress routing |
| **coupling** | Features sharing a composed capability (change one, affect all) | Coherence report |
| **waves** `--scope <csv>` | Wave 1 (ready), blocked (waiting), coordinate flags (shared caps in wave) | Focus groups, progress routing |
| **downstream** `<cap-slug>` | Features that compose this capability (blast radius) | Planner, reviewer, research agents |
| **upstream** `<feat-slug>` | Capabilities this feature depends on + status + contract completeness | Readiness validation |
| **upstream-gaps** `<feat-slug>` | Only the upstream caps with status or contract gaps | Progress routing, focus validation, refine scope |

### Sequence Output

`/gsd:sequence` generates `.planning/SEQUENCE.md` with six sections:

1. **What Can Execute Now** -- features whose composed capabilities are all verified/complete
2. **Blocked** -- features waiting on unverified capabilities
3. **Parallel Branches** -- independent feature groups (no shared capabilities)
4. **Coordinate Points** -- capabilities shared by 2+ features (change here affects multiple)
5. **Critical Path** -- blocking capabilities sorted by how many features they unblock
6. **Orphans** -- capabilities composed by nothing, features with empty composes[]

### Contract Completeness

A capability's contract has three required sections: `### Receives`, `### Returns`, `### Rules`. The `upstream-gaps` query checks both status readiness (verified/complete) and contract completeness independently — a capability can be "verified" but still have a thin contract that will trip up planners.

---

## Command Reference

### Initialization

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:init` | Initialize project: questions, research, requirements, roadmap. Auto-detects brownfield codebases. | Start of a new project |

### Framing (Start Here)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:debug <slug>` | Frame a debugging workflow | Something is broken |
| `/gsd:new <slug>` | Frame new feature development | Building something new |
| `/gsd:enhance <slug>` | Frame an enhancement to existing code | Improving existing functionality |
| `/gsd:refactor <slug>` | Frame a refactoring effort | Restructuring without behavior change |

### Capability & Feature Discussion

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:discuss-capability <cap>` | Define capability scope and boundaries | Before planning features in a capability |
| `/gsd:discuss-feature <cap/feat>` | Capture implementation decisions for a feature | Before planning, to shape how it gets built |

### Sequencing & Focus

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:sequence` | Build dependency graph from composes[] → SEQUENCE.md | After defining capabilities/features, before focus groups |
| `/gsd:focus <cap>` | Create a focus group: graph-driven wave ordering + mgrep gap scan | After sequencing, before planning |

### Planning & Review

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:plan <slug>` | Research + plan + verify for a feature (or all features in a capability) | Before execution |
| `/gsd:execute <slug>` | Execute plans for a feature or capability | After planning, or to resume interrupted execution |
| `/gsd:review <feat>` | Code review by 4 specialized reviewers + synthesizer | Auto-chains from execute, or run standalone |
| `/gsd:doc <slug>` | Generate documentation via 6 explorers + synthesizer + writers | Auto-chains from review, or run standalone |

### Coherence & Refinement

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:refine` | Project-level coherence audit: scan, synthesize, Q&A, apply changes | After defining multiple capabilities, before or during implementation |

### Navigation & Status

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:status` | Show capability/feature dashboard with progress | Anytime -- "where am I?" |
| `/gsd:progress` | Check progress and route to next action (execute or plan) | Mid-pipeline -- "what's next?" |
| `/gsd:resume-work` | Restore full context from last session | Starting a new session |

---

## Requirements Refinement

After brainstorming capabilities and features in isolation, there's no guarantee they fit together. `/gsd:refine` steps back and audits the entire project for coherence — gaps, overlaps, conflicts, and misaligned dependencies across all capabilities.

### Why It Matters

Individual `/gsd:discuss-capability` sessions lack cross-project awareness. Without refinement, you accumulate:
- Redundant features across capabilities that do the same thing differently
- Missing dependencies that only surface during implementation
- Scope misalignment where one capability assumes something another doesn't provide

### Pipeline

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

### What It Produces

All artifacts live in `.planning/refinement/`:

| Artifact | What It Contains |
|----------|-----------------|
| `matrix.md` | Capability × capability relationship grid (type + severity) |
| `findings/FINDING-{NNN}.md` | Individual coherence finding cards with type, severity, root cause |
| `dependency-graph.md` | Explicit, implicit, and gap dependencies between capabilities |
| `RECOMMENDATIONS.md` | Root causes, systemic patterns, goal alignment, resolution sequence, Q&A agenda |
| `CHANGESET.md` | Your decisions from Q&A (accept/reject/modify/research per finding) |
| `EXECUTION-LOG.md` | What was applied, skipped, or failed |
| `DELTA.md` | What changed since the last refinement run |

### Key Behaviors

- **Repeatable**: Run at any point — not gated to a specific lifecycle stage. Each run snapshots prior state for delta computation.
- **Nothing happens without your approval**: Every recommendation goes through Q&A. Auto-resolvable items are batched for efficiency, but you still confirm.
- **Checkpoint resumable**: Pair analysis checkpoints per completed pair. If interrupted, re-running picks up where it left off.
- **Skip-not-halt**: A malformed finding from one capability pair doesn't crash the scan. It's logged and skipped.

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

Contract completeness is checked by `upstream-gaps` — a feature composing a capability with missing contract sections gets flagged before planning.

### Feature Specifications

Every feature defines its specification in FEATURE.md:

| Section | What It Defines | Example |
|---------|----------------|---------|
| **Goal** | One verifiable sentence — what the user gets | "User can log in with email and password" |
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

## Focus Groups

Focus groups are the sequencing mechanism. They use the dependency graph for wave ordering and mgrep for gap detection.

### What They Are

A focus group is a set of features from one or more capabilities, ordered by the dependency graph. Running `/gsd:focus <cap>` queries graph waves, validates upstream readiness, and creates an execution sequence.

### How They Work

```
/gsd:focus Authentication
  |
  1. Check SEQUENCE.md staleness (rebuild if needed)
  2. Q&A: name, goal, scope
  3. Query graph waves for dependency ordering
  4. mgrep semantic gap scan:
       Shared semantic surface WITHOUT composes[] overlap
       → surface as "possible undeclared capability"
  5. Upstream contract validation:
       upstream-gaps per feature → surface status + contract gaps
  6. Overlap detection against existing focus groups
  7. Priority ordering (wave constraints + user preference)
  |
  Creates focus group:
    Wave 1: JWT Setup (all deps verified, contract complete)
    Wave 2: Registration (depends on JWT Setup)
    Wave 3: Password Reset (depends on Registration)
```

Features within the same wave can be planned and executed in parallel. Features in later waves wait for their dependencies.

### Gap Detection

Focus creation runs two types of gap detection:

- **mgrep semantic scan**: Finds features with shared behavioral surface area but no `composes[]` overlap — signals a possible undeclared capability
- **upstream-gaps check**: For each feature, verifies composed capabilities are both status-ready (verified/complete) AND contract-complete (Receives/Returns/Rules sections present)

---

## External Tool Integration

GSD agents use three external tools for live information beyond the codebase:

| Tool | What It Does | When To Use |
|------|-------------|-------------|
| **Context7** | Retrieves current library documentation (APIs, signatures, deprecation status) | Any library API question — authoritative and version-specific |
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

**Note:** mgrep is a skill (main conversation only). Agents receive mgrep results via XML context blocks assembled by orchestrating workflows — they interpret results, they don't invoke mgrep directly.

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
| `workflow.research` | `true`, `false` | `true` | Domain investigation before planning. **Note:** As of 2.0.1, research is always mandatory in the workflow — this config field is retained but no longer gates research execution. |
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

### New Project (Full Cycle)

```bash
/gsd:init                              # Answer questions, configure, approve roadmap
/clear
/gsd:discuss-capability Authentication  # Define capability scope + contract
/gsd:discuss-feature jwt-login          # Lock in preferences + composes[]
/clear
/gsd:sequence                          # Build dependency graph -> SEQUENCE.md
/gsd:focus Authentication               # Create focus group (graph-driven ordering)
/clear
/gsd:new jwt-login                     # Frame the work
/clear
/gsd:plan jwt-login                     # Research + plan + execute + review + doc
/clear
/gsd:plan password-reset                # Next feature in focus group
...
```

### Debug a Problem

```bash
/gsd:debug login-timeout               # Creates discovery brief, frames debugging
/clear
/gsd:plan login-timeout                 # Minimal fix plan + execute + review + doc
```

### Enhance Existing Feature

```bash
/gsd:enhance search-filters            # Frame the enhancement
/clear
/gsd:plan search-filters               # Plan + execute + review + doc
```

### Existing Codebase

```bash
/gsd:init                               # Auto-detects existing code, maps codebase first
# (normal capability workflow from here)
```

### Refine After Brainstorming

```bash
/gsd:discuss-capability Authentication  # Define capabilities in isolation
/gsd:discuss-capability Payments
/gsd:discuss-capability Notifications
/clear
/gsd:refine                             # Scan all 3 for coherence issues
                                        # Walk through findings in Q&A
                                        # Apply confirmed changes
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

Run `/gsd:discuss-feature` before planning. Most plan quality issues come from Claude making assumptions that CONTEXT.md would have prevented.

### Execution Fails or Produces Stubs

Plans should have 2-3 tasks maximum. If tasks are too large, they exceed what a single context window can produce reliably. Re-plan with smaller scope.

### Lost Track of Where You Are

Run `/gsd:status`. It reads all state files and tells you where you are and what to do next.

### Working on a Sensitive/Private Project

Set `commit_docs: false` during `/gsd:init`. Add `.planning/` to your `.gitignore`. Planning artifacts stay local.

---

## Project File Structure

Capabilities and features live in separate top-level directories. Features reference capabilities via `composes[]` frontmatter — they are not nested.

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
