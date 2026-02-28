# Architecture Research

**Domain:** AI coding assistant meta-prompting orchestration framework
**Researched:** 2026-02-28
**Confidence:** HIGH (design patterns derived from current ecosystem; GSD v1 internals from direct codebase inspection)

---

## Standard Architecture

### System Overview

The v2 architecture preserves the existing layered pattern — commands → workflows → agents → CLI — and adds three orthogonal concerns that cut across all layers: the capability/feature hierarchy (in `.planning/`), 3-layer requirement traceability (in feature documents), and framing-awareness (in commands and agents).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER ENTRY LAYER                                 │
│  /gsd:new feature    /gsd:debug capability    /gsd:enhance feature       │
│  /gsd:refactor capability    /gsd:review feature                         │
│              (slash commands — markdown + YAML frontmatter)              │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │  loads @workflow + passes framing + arguments
┌─────────────────────▼───────────────────────────────────────────────────┐
│                        WORKFLOW LAYER                                    │
│  new-feature.md    debug.md    enhance-feature.md    refactor.md         │
│  review-feature.md    document-feature.md                               │
│              (step-by-step procedures, framing-aware front door)        │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Framing-Specific Discovery          Universal Pipeline           │   │
│  │  ──────────────────────────          ─────────────────────────   │   │
│  │  debug:    observe → hypothesize     requirements → plan →        │   │
│  │  new:      explore → brainstorm      execute → review →           │   │
│  │  enhance:  assess working/broken     document                     │   │
│  │  refactor: reason → options          (same artifact flow)         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────────┘
       │              │              │              │
       │ Task spawn   │ Task spawn   │ Task spawn   │ Task spawn
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐ ┌──────▼───────────────────┐
│  RESEARCHER │ │  PLANNER   │ │ EXECUTOR │ │  REVIEW + DOC AGENTS      │
│  (gather +  │ │  (draft +  │ │  (build  │ │  reviewer-user.md         │
│  synthesize)│ │  critique) │ │  to plan)│ │  reviewer-functional.md   │
│             │ │            │ │          │ │  reviewer-technical.md    │
│             │ │            │ │          │ │  reviewer-quality.md      │
│             │ │            │ │          │ │  review-synthesizer.md    │
│             │ │            │ │          │ │  documentor.md            │
└──────┬──────┘ └─────┬──────┘ └────┬─────┘ └──────┬───────────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                      │ node gsd-tools.cjs <command>
┌─────────────────────▼───────────────────────────────────────────────────┐
│                         CLI UTILITY LAYER                                │
│  gsd-tools.cjs — file I/O, state, capability CRUD, feature CRUD,        │
│  frontmatter parsing, git, model resolution, requirement ID generation  │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ reads/writes
┌─────────────────────▼───────────────────────────────────────────────────┐
│                    PROJECT PLANNING LAYER (.planning/)                   │
│  PROJECT.md    STATE.md    config.json                                  │
│  capabilities/                                                          │
│    01-auth/                                                             │
│      CAPABILITY.md    (goals + context, always in agent context)        │
│      features/                                                          │
│        01-01-login/                                                     │
│          FEATURE.md   (3-layer requirements: user/functional/technical) │
│          PLAN.md      (tasks with REQ ID references)                    │
│          SUMMARY.md   (outcome record, presence = done)                 │
│          REVIEW.md    (4-reviewer traces + synthesis)                   │
│          DOCS.md      (final-state reference documentation)             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Slash commands | Entry point; encode framing (debug/new/enhance/refactor); pass args to workflow | Workflows (via `@` reference), user |
| Workflows | Orchestrate the full pipeline; framing-aware discovery steps; spawn agents via Task tool; gate on state | Agents (Task spawns), gsd-tools CLI (Bash calls), .planning/ files |
| Agents | Specialist personas; each handles one concern; receive full context via Task prompt | gsd-tools CLI (Bash calls), .planning/ files |
| gsd-tools CLI | All stateful operations: CRUD for capabilities/features, frontmatter, git, model resolution, req ID allocation | .planning/ files, git, Node.js stdlib |
| .planning/ files | Persistent state; artifact store; source of truth for all agent context | Read by all layers; written by CLI and agents |
| Templates | Canonical document formats; define the schema for FEATURE.md, PLAN.md, REVIEW.md, DOCS.md | Agents and workflows reference on creation |
| References | Shared behavioral rules injected into agent context | Commands, workflows, agents |

---

## Recommended Project Structure

### Framework Installation Structure (unchanged from v1)

```
~/.claude/
  commands/gsd/              # Slash commands (entry points)
    new-feature.md
    debug.md
    enhance-feature.md
    refactor.md
    review-feature.md
    ...
  agents/                    # Specialist agent personas
    gsd-planner.md
    gsd-executor.md
    gsd-researcher.md        # Renamed from gsd-phase-researcher
    gsd-synthesizer.md       # Renamed from gsd-research-synthesizer
    gsd-reviewer-user.md     # NEW
    gsd-reviewer-functional.md  # NEW
    gsd-reviewer-technical.md   # NEW
    gsd-reviewer-quality.md     # NEW
    gsd-review-synthesizer.md   # NEW (distinct from research synthesizer)
    gsd-documentor.md           # NEW
    gsd-plan-checker.md         # Carry forward
  get-shit-done/
    workflows/               # Step-by-step procedures
      new-feature.md
      debug.md
      enhance-feature.md
      refactor.md
      review-feature.md
      document-feature.md
      ...
    bin/
      gsd-tools.cjs          # CLI entry point
      lib/                   # Modules (state, frontmatter, git, config, etc.)
    templates/
      capability.md          # NEW
      feature.md             # NEW — 3-layer requirements schema
      plan.md                # Modified — req ID traceability fields
      summary.md             # Carry forward
      review.md              # NEW — 4-reviewer + synthesis schema
      docs.md                # NEW
      state.md               # Modified — capability/feature position fields
      project.md             # Carry forward
    references/              # Behavioral rules (carry forward)
```

### Per-Project .planning/ Structure

```
.planning/
  PROJECT.md                 # Project goals, constraints, key decisions
  STATE.md                   # Current position in capability/feature space
  config.json                # Model profiles, parallelization flags
  capabilities/
    01-auth/
      CAPABILITY.md          # Goals, context, acceptance — always in agent context
      features/
        01-01-login/
          FEATURE.md         # 3-layer requirements (user story, functional, technical)
          PLAN.md            # Executable tasks referencing REQ IDs
          SUMMARY.md         # Outcome record (presence = done)
          REVIEW.md          # 4 reviewer traces + synthesizer recommendation
          DOCS.md            # Final-state reference documentation
        01-02-session/
          FEATURE.md
          ...
    02-payments/
      CAPABILITY.md
      features/
        ...
  research/                  # Research artifacts (carry forward)
  codebase/                  # Codebase map (carry forward)
  todos/                     # Captured ideas (carry forward)
```

### Structure Rationale

- **capabilities/:** The unit of "a user-facing ability." A CAPABILITY.md is always loaded into agent context alongside the feature being worked on, providing invariant goals and constraints. This replaces phases/ and removes the numeric-only hierarchy.
- **features/01-01-login/:** Numeric prefix preserves sortability and wave ordering. Directory-per-feature (not flat files) because a feature generates 5 artifacts (FEATURE, PLAN, SUMMARY, REVIEW, DOCS) that must stay co-located.
- **FEATURE.md replaces REQUIREMENTS.md:** Requirements live at the feature level, not the project level. Project-level requirements belong in PROJECT.md as goals.
- **REVIEW.md co-located with PLAN.md:** Reviewers trace back to the feature's own requirements, not a global doc. Co-location makes the trace path unambiguous.
- **DOCS.md at feature level:** Documentation reflects exactly what was built in the feature, then a capability-level rollup can aggregate. Avoids documentation drift from a separate docs/ root.

---

## Data Flow

### Full Artifact Cascade

```
CAPABILITY.md  (goals + context — set once, always in context)
      │
      ▼
FEATURE.md  (3-layer requirements — written during discovery)
      │
      │  Layer 1: End-user story + acceptance criteria (REQ-EU-01, REQ-EU-02...)
      │  Layer 2: Functional behavior spec (REQ-FN-01, REQ-FN-02...)
      │  Layer 3: Technical implementation spec (REQ-TC-01, REQ-TC-02...)
      │
      ▼
PLAN.md  (tasks, each citing REQ IDs — no orphan tasks allowed)
      │
      │  frontmatter: wave, depends_on, files_modified, req_ids_covered
      │
      ▼
EXECUTION  (code changes committed, SUMMARY.md written)
      │
      │  SUMMARY.md frontmatter: provides, requires, key-files, req-ids-completed
      │
      ▼
REVIEW.md  (4 parallel reviewer traces → synthesizer recommendation)
      │
      │  Each reviewer traces: "REQ X → was it satisfied? evidence..."
      │  Synthesizer: verify findings, resolve conflicts, final recommendation
      │
      ▼
DOCS.md  (reflect on what was built, write final-state reference)
      │
      │  Generated from SUMMARY.md + code inspection, not from FEATURE.md
      │  Captures what actually exists, not what was intended
```

### Framing-Specific Discovery Flow

The framing changes the questions asked during discovery. Once discovery produces FEATURE.md requirements, the pipeline is identical regardless of framing.

```
Command: /gsd:debug capability-name
  └─> workflow: debug.md
        │
        ├─ DISCOVERY (framing-specific):
        │   observe symptoms → hypothesize root cause → confirm root cause
        │   writes: FEATURE.md with "bug fix" requirements (what correct behavior is)
        │
        └─ PIPELINE (universal):
            FEATURE.md → PLAN.md → EXECUTE → REVIEW.md → DOCS.md

Command: /gsd:new feature-name
  └─> workflow: new-feature.md
        │
        ├─ DISCOVERY (framing-specific):
        │   explore problem space → brainstorm approach → confirm with user
        │   writes: FEATURE.md with "new behavior" requirements
        │
        └─> PIPELINE (universal)

Command: /gsd:enhance feature-name
  └─> workflow: enhance-feature.md
        │
        ├─ DISCOVERY (framing-specific):
        │   read existing FEATURE.md → assess what works/broken → scope delta
        │   writes: FEATURE.md update (or new FEATURE.md for the delta)
        │
        └─> PIPELINE (universal)

Command: /gsd:refactor capability-name
  └─> workflow: refactor.md
        │
        ├─ DISCOVERY (framing-specific):
        │   state reason for change → explore options → validate no behavior change
        │   writes: FEATURE.md with "structural change only" requirements
        │
        └─> PIPELINE (universal)
```

### Layered Agent Context

Context injected per Task spawn is layered: core is always present, framing-specific content added on top. This avoids building separate agent personas per framing (YAGNI).

```
Agent Task Prompt = [core context] + [framing context] + [task instruction]

Core context (always):
  - PROJECT.md (goals, constraints, decisions)
  - CAPABILITY.md (parent capability context)
  - STATE.md (current position)

Framing context (added when relevant):
  - debug:    symptom log, reproduction steps
  - enhance:  existing FEATURE.md + what is/isn't working
  - refactor: existing code structure, reason for change
  - new:      research findings if available

Task instruction:
  - Agent-specific (planner gets FEATURE.md; reviewer gets PLAN.md + SUMMARY.md + code diff)
```

### Parallel Review Flow

```
PLAN.md + SUMMARY.md + code diff
      │
      ├─ Task spawn: gsd-reviewer-user.md    ─┐
      ├─ Task spawn: gsd-reviewer-functional.md ├─ parallel, isolated
      ├─ Task spawn: gsd-reviewer-technical.md  │  each traces back to REQ IDs
      └─ Task spawn: gsd-reviewer-quality.md  ─┘
                                               │
                                               │  all return reviewer trace reports
                                               ▼
                                    gsd-review-synthesizer.md
                                               │
                                    ├─ verify non-overlapping findings
                                    ├─ resolve conflicts (re-examine if needed)
                                    └─ write REVIEW.md with final recommendation
```

---

## Architectural Patterns

### Pattern 1: Framing as a Front Door, Not a Separate System

**What:** A single canonical pipeline (requirements → plan → execute → review → docs) is entered through four framing-specific discovery workflows. The discovery step's only output is a FEATURE.md. Once that file exists, the pipeline is identical regardless of how it was entered.

**When to use:** Any time there is a natural intake variation that converges to the same work unit. The alternative — building separate agents or completely separate workflows per framing — creates 4x the maintenance surface for identical downstream work.

**Trade-offs:**
- Pro: DRY. Changes to PLAN.md schema, review process, or docs format apply once.
- Pro: Predictable — user always knows the artifact stack will be FEATURE/PLAN/SUMMARY/REVIEW/DOCS.
- Con: Discovery steps must be well-bounded; if "debug" discovery bleeds into plan creation, the convergence point becomes fuzzy.

```
# Framing encodes as command argument, not separate command namespace

# Good:
/gsd:debug auth-login         → debug.md workflow → FEATURE.md → pipeline
/gsd:new auth-session         → new-feature.md workflow → FEATURE.md → pipeline
/gsd:enhance auth-login       → enhance-feature.md workflow → FEATURE.md → pipeline
/gsd:refactor auth            → refactor.md workflow → FEATURE.md → pipeline

# Bad (don't do this):
/gsd:debug-plan-phase
/gsd:new-plan-phase
# Each duplicates the plan step instead of converging to a shared pipeline
```

### Pattern 2: Core-Always + Framing-Specific Context Layering

**What:** Agent Task spawns receive a structured context injection. A core block (project, capability, state) is always present. A framing block (symptom logs, existing feature file, etc.) is appended conditionally by the workflow before spawning.

**When to use:** Whenever the same agent persona needs slightly different situational awareness depending on how work was initiated. Avoids building duplicate agents.

**Trade-offs:**
- Pro: One agent definition per role, not one per framing. Fewer files to maintain.
- Pro: Agents remain coherent — they know their role; the context tells them the situation.
- Con: Workflows must correctly assemble context before spawn. If a workflow forgets to inject framing context, the agent operates blind. Mitigation: workflow templates include explicit context injection steps.

```
# Workflow assembles context before spawning planner:
context = read_project_md() +
          read_capability_md(current_capability) +
          read_state_md() +
          if framing == "enhance": read_feature_md(existing_feature)
          if framing == "debug":   read_symptom_log()

Task(gsd-planner, prompt=context + planner_instructions)
```

### Pattern 3: Requirement IDs as the Traceability Spine

**What:** Every requirement in FEATURE.md has a namespaced ID (`REQ-EU-01`, `REQ-FN-02`, `REQ-TC-03`). Every task in PLAN.md frontmatter lists the `req_ids_covered` it satisfies. Every reviewer trace in REVIEW.md maps findings back to specific IDs. SUMMARY.md frontmatter records `req-ids-completed` after execution.

**When to use:** Always. The entire point of GSD v2 is that nothing executes without tracing back to a stated requirement.

**Trade-offs:**
- Pro: No orphan tasks. If a task can't name a REQ ID, it shouldn't exist.
- Pro: Review becomes audit, not guesswork. Reviewer asks: "does this code satisfy REQ-FN-02 as written?"
- Pro: Gaps are visible at plan-check time before execution.
- Con: Requires discipline at requirement-writing time. Vague requirements produce vague IDs that reviewers can't trace against. Mitigation: requirement templates enforce specific, testable language per layer.

```
# FEATURE.md excerpt:
## End-User Requirements
- **REQ-EU-01**: User can log in with email and password and land on dashboard
- **REQ-EU-02**: User sees clear error if credentials are wrong

## Functional Requirements
- **REQ-FN-01**: POST /auth/login accepts {email, password}, returns {token, user}
- **REQ-FN-02**: Returns 401 with message "Invalid credentials" on failure

## Technical Requirements
- **REQ-TC-01**: Passwords compared via bcrypt.compare(), never plaintext
- **REQ-TC-02**: JWT signed with RS256, 24h expiry

# PLAN.md frontmatter excerpt:
req_ids_covered: [REQ-EU-01, REQ-EU-02, REQ-FN-01, REQ-FN-02, REQ-TC-01, REQ-TC-02]

# REVIEW.md trace excerpt (reviewer-technical):
REQ-TC-01: PASS — bcrypt.compare() used in auth.service.ts:47
REQ-TC-02: FAIL — HS256 used, not RS256 as specified
```

### Pattern 4: Parallel Reviewers with Isolated Contexts

**What:** Four reviewers fire simultaneously, each with a copy of the same inputs (PLAN.md, SUMMARY.md, code diff, FEATURE.md). Isolation is intentional — reviewers must not influence each other. A synthesizer receives all four reports after they complete.

**When to use:** Any review step. The pattern from the ecosystem (Hamy's 9-agent review, the 15-expert panel) confirms that isolated parallel review catches more issues than a single reviewer attempting all dimensions simultaneously.

**Trade-offs:**
- Pro: Each reviewer depth is unconstrained by "I already said enough about this code."
- Pro: Findings from one reviewer don't bias others.
- Pro: Conflicts between reviewers surface real ambiguity — the synthesizer must resolve it.
- Con: 4x the token cost of a single review. Mitigation: scoped to the feature, not the whole codebase.

```
Reviewer domains:
  gsd-reviewer-user       → traces end-user requirements (REQ-EU-*)
                            asks: "does this build what the user story describes?"
  gsd-reviewer-functional → traces functional requirements (REQ-FN-*)
                            asks: "does the API contract match the spec?"
  gsd-reviewer-technical  → traces technical requirements (REQ-TC-*)
                            asks: "do the implementation choices match constraints?"
  gsd-reviewer-quality    → DRY/KISS/YAGNI, no bloat, complexity, duplication
                            asks: "is this the simplest thing that could work?"

gsd-review-synthesizer:
  receives: 4 reviewer trace reports
  verifies: non-duplicate findings (same finding named by 2 reviewers = 1 issue)
  resolves: conflicts (re-examines evidence when reviewers disagree)
  outputs:  REVIEW.md with final recommendation + prioritized issue list
```

---

## Anti-Patterns

### Anti-Pattern 1: Separate Command Namespaces Per Framing

**What people do:** Build `/gsd:debug-plan`, `/gsd:new-plan`, `/gsd:refactor-plan` as entirely separate commands with separate workflows that each re-implement the plan → execute → review → docs pipeline.

**Why it's wrong:** 4x maintenance surface. A change to how REVIEW.md is written requires 4 edits instead of 1. The pipeline is identical after discovery — there is no reason to duplicate it.

**Do this instead:** Framing is an argument to a shared command namespace. `/gsd:debug`, `/gsd:new`, `/gsd:enhance`, `/gsd:refactor` all converge to the same pipeline via distinct discovery workflows.

### Anti-Pattern 2: Global Requirements.md Instead of Feature-Level FEATURE.md

**What people do:** Maintain a single `REQUIREMENTS.md` at the project root that lists all requirements for all features. Reference these from PLAN.md with pointers like "see REQUIREMENTS.md line 47."

**Why it's wrong:** The file becomes a monolith. Reviewers must jump between it and the feature they're reviewing. Requirements for unrelated features pollute the context window. Requirements go stale as features evolve without a clean ownership boundary.

**Do this instead:** Each feature owns its requirements in `features/NN-name/FEATURE.md`. A CAPABILITY.md provides the goals/constraints that apply to all features under it. No cross-feature requirement references at review time.

### Anti-Pattern 3: Agent Proliferation by Framing

**What people do:** Build `gsd-debug-planner.md`, `gsd-new-planner.md`, `gsd-refactor-planner.md` — separate agent definitions for each framing of the same role.

**Why it's wrong:** The framing changes the context, not the agent's competency. A planner creates plans from requirements regardless of whether those requirements came from a bug investigation or a new feature brainstorm. Separate agent files violate DRY and make behavioral updates require N edits.

**Do this instead:** One `gsd-planner.md`. Framing context is injected by the workflow before the Task spawn. The agent prompt includes a "current framing" block that adjusts the questions the planner should ask, without changing the agent definition.

### Anti-Pattern 4: Deep Nesting of Task Spawns

**What people do:** Orchestrator spawns planner → planner spawns researcher → researcher spawns sub-researchers → each sub-researcher spawns file readers.

**Why it's wrong:** Context isolation means each level must re-propagate all context from scratch. The deeper the nest, the more re-propagation and the higher the chance of dropped context. Claude Code documentation (Task tool article) explicitly recommends against unnecessary nesting.

**Do this instead:** Keep the hierarchy flat: orchestrating workflow spawns specialist agents directly. Researchers fire in parallel from the workflow, not from a planner agent. Planner receives synthesized research output, not raw sub-agent chains.

---

## Build Order Implications

The architecture has hard dependency ordering. Build lower layers before upper layers; build shared infrastructure before specialized consumers.

```
Layer 0 (foundation — no dependencies):
  gsd-tools.cjs capability/feature CRUD commands
  CAPABILITY.md + FEATURE.md templates
  PLAN.md template updates (req_ids_covered field)
  REVIEW.md + DOCS.md templates

Layer 1 (depends on Layer 0):
  gsd-planner updated for 3-layer requirements + REQ ID traceability
  gsd-executor (minimal changes — reads PLAN.md, writes SUMMARY.md)
  gsd-plan-checker updated to validate REQ ID coverage

Layer 2 (depends on Layer 1):
  gsd-reviewer-user, gsd-reviewer-functional, gsd-reviewer-technical, gsd-reviewer-quality
  gsd-review-synthesizer
  gsd-documentor

Layer 3 (depends on Layer 2 — full pipeline assembled):
  Framing-specific discovery workflows (debug.md, new-feature.md, enhance.md, refactor.md)
  Review workflow (review-feature.md)
  Document workflow (document-feature.md)

Layer 4 (depends on Layer 3 — entry points):
  Slash commands updated with framing encoding
  STATE.md updates for capability/feature position fields
  Full end-to-end integration testing
```

**Critical path:** Layer 0 is the longest — template schema decisions propagate to every agent and workflow. Get FEATURE.md (3-layer requirements schema) and REVIEW.md (reviewer trace schema) right before building anything that reads them.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Command → Workflow | `@` file reference in `<execution_context>` block | Workflow loaded into orchestrator context at slash command invocation |
| Workflow → Agent | `Task(agent_file, prompt=assembled_context)` | Context assembled by workflow before spawn; agents are context-blind otherwise |
| Workflow → CLI | `node gsd-tools.cjs <command>` via Bash tool | Returns JSON or `@file:/path` for large payloads |
| Agent → CLI | `node gsd-tools.cjs <command>` via Bash tool | Same as workflow; agents have full Bash access |
| CLI → .planning/ | Direct file read/write via Node.js `fs` | No intermediate layer; plain files, no DB |
| Agent → .planning/ | Direct file read via Read tool | Agents read planning files directly; write via CLI commands or direct Write tool |

### Key Invariants

1. **Capability context is always loaded.** Any workflow operating on a feature must load CAPABILITY.md before spawning agents. Agents must not operate in isolation from their parent capability's goals.

2. **REQ IDs are allocated by CLI, not invented by agents.** `gsd-tools.cjs alloc-req-id [feature-dir] [layer]` returns the next sequential ID. This prevents ID collisions across parallel agents writing FEATURE.md sections.

3. **REVIEW.md is written by the synthesizer, not the reviewers.** Each reviewer returns a trace report to the orchestrating workflow. The workflow passes all four reports to the synthesizer. Only the synthesizer writes REVIEW.md. This enforces single-writer semantics on the review artifact.

4. **DOCS.md is generated from what was built, not from FEATURE.md.** The documentor reads SUMMARY.md, the committed code, and REVIEW.md (which includes what passed/failed). It does not reflect requirements back as documentation — that's documentation theater.

---

## Sources

- GSD v1 codebase: `/Users/philliphall/get-shit-done-pe/.planning/codebase/ARCHITECTURE.md` — direct inspection (HIGH confidence)
- GSD v1 PROJECT.md: `/Users/philliphall/get-shit-done-pe/.planning/PROJECT.md` — direct inspection (HIGH confidence)
- Amazon Kiro spec file structure (requirements.md / design.md / tasks.md): https://kiro.dev/docs/specs/ (MEDIUM confidence — authoritative but may evolve)
- Spec-driven development patterns (Thoughtworks Technology Radar): https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices (MEDIUM confidence)
- Claude Code Task tool architecture and context isolation: https://dev.to/bhaidar/the-task-tool-claude-codes-agent-orchestration-system-4bf2 (MEDIUM confidence)
- Slash commands vs subagents / context layering economics: https://jxnl.co/writing/2025/08/29/context-engineering-slash-commands-subagents/ (MEDIUM confidence)
- Parallel code review subagent pattern (9-agent structure + synthesis): https://hamy.xyz/blog/2026-02_code-reviews-claude-subagents (MEDIUM confidence — very recent, single source)
- Spec-driven development with Claude Code (artifact flow): https://alexop.dev/posts/spec-driven-development-claude-code-in-action/ (MEDIUM confidence)
- Hierarchical AI orchestration patterns: https://blog.n8n.io/ai-agent-orchestration-frameworks/ (LOW confidence — general, not GSD-specific)
- Task nesting anti-pattern: https://dev.to/bhaidar/the-task-tool-claude-codes-agent-orchestration-system-4bf2 (MEDIUM confidence)

---

*Architecture research for: GSD v2 — AI orchestration framework evolution*
*Researched: 2026-02-28*
