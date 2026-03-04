# GSD User Guide

A detailed reference for workflows, commands, and configuration. For quick-start setup, see the [README](../README.md).

---

## Table of Contents

- [How It Works](#how-it-works)
- [Framing Modes](#framing-modes)
- [Workflow Overview](#workflow-overview)
- [Command Reference](#command-reference)
- [Requirements Model](#requirements-model)
- [Focus Groups](#focus-groups)
- [Configuration Reference](#configuration-reference)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## How It Works

GSD is a meta-prompting and context engineering system for Claude Code. It structures work into capabilities (large buckets) and features (shippable units), then runs a pipeline of specialized agents to research, plan, execute, review, and document each feature.

Every piece of work starts with a **framing mode** that shapes how the system approaches the problem. The lens (debug, new, enhance, refactor) affects research questions, planning approach, review priorities, and documentation focus.

### Core Concepts

- **Capability** -- A major area of the product (e.g., Authentication, Payments, Search)
- **Feature** -- A shippable unit within a capability (e.g., JWT Login, Password Reset)
- **Focus Group** -- A set of features sequenced for execution with dependency ordering
- **Discovery Brief** -- The output of a framing command: a structured problem definition
- **Lens** -- The framing mode (debug/new/enhance/refactor) that weights every pipeline stage

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
  /gsd:discuss-capability <cap>      <- Define capability scope
         |
  /gsd:discuss-feature <cap/feat>    <- Lock in feature preferences
         |
  /gsd:focus <cap>                   <- Create focus group (sequence features)
         |
  /gsd:debug|new|enhance|refactor    <- Frame the work (creates Discovery Brief)
         |
  /gsd:plan <slug>                   <- Research + plan + verify
         |                              (execute auto-chains from plan)
  /gsd:review <feat>                 <- Review executed code
         |
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
| **Doc** | Generate documentation from executed work | Documentation focus varies by lens |

### Research Pipeline

```
  /gsd:plan <feat>
         |
         +-- 6 parallel research gatherers:
         |     +-- User intent
         |     +-- Domain truth
         |     +-- Existing system
         |     +-- Tech constraints
         |     +-- Prior art
         |     +-- Edge cases
         |           |
         |     Synthesizer -> RESEARCH.md
         |
         +-- Planner (reads CONTEXT.md, RESEARCH.md, FEATURE.md)
         |           |
         |     Plan Checker (up to 3 iterations)
         |           |
         |     PLAN files
         |
         Done
```

### Execution

Execution is triggered internally after planning completes, or can be continued via `/gsd:progress`. Plans execute in dependency-ordered waves:

```
  Wave 1 (independent plans):
    +-- Executor A (fresh context) -> commit per task
    +-- Executor B (fresh context) -> commit per task

  Wave 2 (depends on Wave 1):
    +-- Executor C (fresh context) -> commit per task
```

After all plans execute, run `/gsd:review` to evaluate the code.

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

### Planning & Review

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:focus <cap>` | Create a focus group: sequence features for execution | After discussing features, before planning |
| `/gsd:plan <slug>` | Research + plan + verify for a feature (or all features in a capability) | Before execution |
| `/gsd:execute <slug>` | Execute plans for a feature or capability | After planning, or to resume interrupted execution |
| `/gsd:review <feat>` | Code review by 4 specialized reviewers + synthesizer | After execution completes |

### Navigation & Status

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:status` | Show capability/feature dashboard with progress | Anytime -- "where am I?" |
| `/gsd:progress` | Check progress and route to next action (execute or plan) | Mid-pipeline -- "what's next?" |
| `/gsd:resume-work` | Restore full context from last session | Starting a new session |

---

## Requirements Model

GSD uses a 3-layer requirements model that structures requirements by audience and detail level. Requirements populate FEATURE.md directly.

### Three Layers

| Layer | Code | Audience | Example |
|-------|------|----------|---------|
| **End-User Stories** | EU | Users | "User can log in with email and password" |
| **Functional Behavior** | FN | Developers | "Login endpoint validates email format and returns JWT" |
| **Technical Constraints** | TC | Architects | "JWT uses RS256 with 15-min expiry, refresh via httpOnly cookie" |

### How They Work

**EU requirements** define what users can do. They're testable from a user's perspective.

**FN requirements** define how the system behaves. They're testable from an API/integration perspective.

**TC requirements** define implementation constraints. They're testable from a code/architecture perspective.

Each feature's FEATURE.md contains all three layers. The lens affects which layer gets the most attention:
- **debug**: TC layer (technical root cause)
- **new**: All three layers equally
- **enhance**: EU + FN layers (what changes for users)
- **refactor**: TC layer (structural improvements)

---

## Focus Groups

Focus groups replace milestones as the sequencing mechanism. They're lightweight, DAG-based, and operate at the feature level.

### What They Are

A focus group is a set of features from one or more capabilities, ordered by their dependencies. Running `/gsd:focus <cap>` analyzes feature dependencies and creates an execution sequence.

### How They Work

```
/gsd:focus Authentication
  |
  Analyzes feature dependencies:
    JWT Setup (no deps)
    Registration (depends on JWT Setup)
    Password Reset (depends on Registration)
  |
  Creates focus group:
    Wave 1: JWT Setup
    Wave 2: Registration
    Wave 3: Password Reset
```

Features within the same wave can be planned and executed in parallel. Features in later waves wait for their dependencies.

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
/gsd:discuss-capability Authentication  # Define capability scope
/gsd:discuss-feature auth/jwt-login     # Lock in preferences
/gsd:focus Authentication               # Create focus group
/clear
/gsd:new auth/jwt-login                 # Frame the work
/clear
/gsd:plan jwt-login                     # Research + plan + verify + execute
/clear
/gsd:review jwt-login                   # Review executed code
/clear
/gsd:plan password-reset                # Next feature in focus group
...
```

### Debug a Problem

```bash
/gsd:debug login-timeout               # Creates discovery brief, frames debugging
/clear
/gsd:plan login-timeout                 # Minimal fix plan + execute
/clear
/gsd:review login-timeout               # Verify the fix
```

### Enhance Existing Feature

```bash
/gsd:enhance search-filters            # Frame the enhancement
/clear
/gsd:plan search-filters               # Plan preserving existing patterns + execute
/clear
/gsd:review search-filters              # Review the enhancement
```

### Existing Codebase

```bash
/gsd:init                               # Auto-detects existing code, maps codebase first
# (normal capability workflow from here)
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

```
.planning/
  PROJECT.md                    # Project vision and context
  REQUIREMENTS.md               # 3-layer requirements (EU/FN/TC) with IDs
  ROADMAP.md                    # Capability/feature breakdown with status
  STATE.md                      # Decisions, blockers, session memory
  config.json                   # Workflow configuration
  research/                     # Domain research from /gsd:init
  codebase/                     # Brownfield codebase mapping (auto-generated)
  capabilities/
    {cap-name}/
      CAPABILITY.md             # Capability definition and scope
      BRIEF.md                  # Discovery Brief from framing (debug/new/enhance/refactor)
      features/
        {feat-name}/
          FEATURE.md            # Feature definition with EU/FN/TC requirements
          CONTEXT.md            # Implementation preferences from /gsd:discuss-feature
          RESEARCH.md           # Ecosystem research findings
          research/             # Individual gatherer outputs (6 files)
          {nn}-PLAN.md          # Executable plans (01-PLAN.md, 02-PLAN.md, ...)
          {nn}-SUMMARY.md       # Execution outcomes per plan
          review/               # Review traces, synthesis, decisions
```
