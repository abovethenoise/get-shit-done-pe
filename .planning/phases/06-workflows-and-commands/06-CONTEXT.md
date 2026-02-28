# Phase 6: Workflows and Commands - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Four framing-aware entry points (/debug, /new, /enhance, /refactor) that each run distinct discovery with different thinking modes, then converge to a shared artifact pipeline (requirements → plan → execute → review → docs/reflect). Plus project initialization (/init) for new and existing projects, two discussion commands (discuss-capability, discuss-feature) for optional pre-work at different levels, and supporting commands (status, resume, plan, review) to wire everything together. Full v2 command surface: 11 commands.

</domain>

<decisions>
## Implementation Decisions

### Framing Discovery (Lens System)

- **Layered approach**: Fixed skeleton (3-5 anchor questions per lens) + adaptive muscles (branch based on answers)
- **Each lens has a distinct thinking mode**, not just different questions:
  - `/debug` — detective mode: narrow search space, eliminate hypotheses. Flow: symptom → reproduction → isolation → root cause. Convergent tone.
  - `/new` — architect mode: define problem space before solutioning. Flow: why → what → constraints → boundaries → shape. Exploratory but disciplined.
  - `/enhance` — editor mode: understand what exists, find the seam, extend. Flow: current state → gap → impact → fit. Pragmatic, surgical.
  - `/refactor` — surgeon mode: understand load-bearing walls before moving. Flow: current design → pressure points → target design → migration path. Risk-aware.
- **Skip/fast-track**: Available as a Q&A option or command argument. User provides rich context upfront → system can converge quickly.
- **Minimum Viable Understanding (MVU)** per lens — completion conditions are lens-specific, not universal:
  - `/debug`: symptom, reproduction path, at least one falsifiable hypothesis
  - `/new`: the problem, who it's for, what done looks like, key constraints
  - `/enhance`: current behavior, desired behavior, the delta
  - `/refactor`: current design, target design, what breaks during transition
- **Three exit signals**: MVU met (system proposes proceed), user override (flags missing, proceeds with explicit assumptions), diminishing returns (circling detected)
- **Always summarize before transitioning** — playback captures misunderstandings and prompts "wait, I forgot..."

### Lens Misclassification

- **Both upfront validation and mid-discovery pivot**: Light check at start + anchor questions can reveal misfit → offer to switch lens
- **Cross-framing detection**: e.g., /new pivoting to /enhance when user describes overlapping existing capability

### Compound Work

- **Primary + secondary lens model**: One lens leads, the other informs. "This is primarily /enhance with a /refactor component." Single run, layered context.

### Discovery Brief (Handoff Artifact)

Discovery produces a structured brief — the contract between discovery and the rest of the pipeline:

```
Discovery Brief
├── Meta
│   ├── capability: (name / reference to capability file)
│   ├── primary_lens: debug | new | enhance | refactor
│   ├── secondary_lens: (optional, for compound work)
│   ├── completion: mvu_met | user_override | gaps_flagged
│   └── timestamp
│
├── Problem Statement
│   └── One sentence. If you can't, discovery isn't done.
│
├── Context
│   ├── existing_state: (what exists today, skip for /new)
│   ├── relevant_modules: (references to .documentation)
│   └── prior_exploration: (link to discuss notes if they exist)
│
├── Specification (shape varies by lens)
│   ├── /debug: symptom, reproduction_path, hypothesis, evidence
│   ├── /new: capability_definition, boundaries, constraints, success_criteria
│   ├── /enhance: current_behavior, desired_behavior, delta, invariants
│   └── /refactor: current_design, target_design, migration_risk, behavioral_invariants
│
├── Unknowns & Assumptions
│   ├── assumptions: (things treated as true but unverified)
│   └── open_questions: (things that couldn't be resolved)
│
└── Scope Boundary
    ├── in: (what this work covers)
    ├── out: (what's explicitly deferred)
    └── follow_ups: (surfaced during discovery, tracked for later)
```

### Pipeline Convergence

- **Always full pipeline**: Every run goes through all stages — research → requirements → plan → execute → review → docs/reflect. No stage skipping.
- **Research agents still run**: After discovery produces the brief, Phase 2's research agents investigate technical feasibility. Research agents are lens-aware — they receive lens metadata and adjust focus (e.g., /debug research prioritizes reproduction environment; /refactor prioritizes dependency mapping).
- **Auto-generate requirements, user reviews**: System drafts 3-layer requirements (end-user, functional, technical) from brief. All 3 layers always present, but weight varies by lens (/debug has thin EU and rich TC; /new has rich EU and thin TC).
- **Lens-aware pipeline** — framing shapes behavior at every stage:
  - Plan: risk posture, decomposition strategy, scope of changes
  - Execute: solution approach, aggressiveness, what to preserve vs replace
  - Review: definition of done, validation targets, regression watchpoints
- **Review receives three inputs**:
  1. Requirements (the contract) — "Did we build what was specified?"
  2. Lens metadata (the disposition) — "Are we reviewing this the right way?"
  3. Brief (the intent) — "Does this actually solve the original problem?" Catches spec-complete but problem-incomplete work.
- **Reflect = Phase 5's doc agent**: Documentation generation after review acceptance is the reflect mechanism. Doc agent also handles capability status advancement (exploring → specified → in-progress → complete). Not a new stage — it's Phase 5 wired as the final pipeline step.

### Plan-to-Execute Handoff

- **Plan format carries forward from Phase 3**: 5-field task structure (REQs, Artifact, Inputs, Done, Title) with wave ordering and YAML frontmatter.
- **Execution orchestration carries forward**: Wave-based parallelization from Phase 3. Tasks in same wave run in parallel, waves run sequentially.

### Universal Escalation Protocol (Backward Flow)

Every pipeline stage can push back upstream when it detects a problem:

```
Stage detects upstream problem
    ├── Minor: flag it, continue, reflect captures it
    ├── Moderate: pause, surface to user, propose amendment
    └── Major: halt, recommend returning to specific stage
```

- **Universal protocol**: Same 3-tier severity model at every stage. What constitutes minor/moderate/major may differ per stage, but the mechanism is consistent.
- **Major issue handling**: Propose and confirm. Pipeline recommends: "I suggest returning to discovery because X." User confirms, then auto-restarts from that stage.

### Project Initialization (/init)

- **Single command, auto-detects mode**: Codebase exists → existing flow. Nothing there → new flow. Ambiguous → ask one question.
- **New-project**: Deep upfront discovery (goals, opinions, constraints, architecture approach) → maps capabilities from rich context
- **Existing-project** — three phases:
  1. Automated scan: structure, tech stack, entry points, dependency graph, data models, patterns → System Understanding Draft
  2. User validation: "Here's what I found. Correct me." Flag low-confidence areas. Targeted intent questions. Independent sections (confirming stack doesn't depend on confirming architecture)
  3. Gap fill: What scan couldn't determine. Domain-specific context. Known tech debt.
- **Output**: PROJECT.md + capability map + relevant .documentation/ files
- **Incremental writes**: Each phase writes output as it goes, not all-at-once. State persisted. Re-running /init detects partial run and offers resume.

### Documentation Structure

- **Domain context separate from code context**, stored in `.documentation/`:
  ```
  .documentation/
  ├── architecture.md      ← code context (modules, flows, patterns)
  ├── domain.md            ← domain context (concepts, taxonomy)
  ├── mapping.md           ← domain concept → code location links
  ├── capabilities/        ← per-capability lifecycle files
  └── decisions/           ← ADRs
  ```
- **Doc freshness via reflect stage**: Phase 5's doc agent runs as final pipeline step, incrementally updates project model and flags drift.

### discuss-capability

- **Role**: Sets the WHAT and WHY. Upstream of lens workflows. Optional and repeatable.
- **Trigger**: User-initiated, or potentially asked during project init.
- **Output**: Enriches capability file in `.documentation/capabilities/` — flat markdown:
  ```markdown
  # Drill Generation
  status: exploring

  ## Exploration
  Core idea: auto-generate drills from mistake patterns
  Open questions: what triggers a drill? per-session or cumulative?
  Suggested lens: /new

  ## Brief
  (empty)

  ## Requirements
  (empty)
  ```
- **Can kill ideas**: discuss-capability can conclude "don't build this" — mark as killed/deferred with reasoning. Not just refinement.
- **Cross-capability awareness**: Intuits cross-cutting concerns from the capability map and naturally raises them. No separate command needed.

### discuss-feature

- **Role**: Same as discuss-capability, one level down. Thinking about HOW a specific feature works.
- **Position in flow**: Between plan (which decomposes into features) and execute. Optional per feature.
- **Output**: Eventually feeds into 3 requirements files (end-user, functional, technical).
- **Can kill/defer features**: Same power as capability-level. Can route backward to replan or even back to discuss-capability if the feature reveals the capability was misconceived.
- **Backward routing**: Usually → implementation clarity → execute. Sometimes → "this doesn't make sense" → back to plan or discuss-capability.

### Command Inventory (11 commands)

| Command | Role | Input |
|---------|------|-------|
| `/init` | Project setup (new or existing) | Auto-detects mode |
| `/debug` | Lens: detective mode | Fuzzy capability/feature reference |
| `/new` | Lens: architect mode | Fuzzy capability/feature reference |
| `/enhance` | Lens: editor mode | Fuzzy capability/feature reference |
| `/refactor` | Lens: surgeon mode | Fuzzy capability/feature reference |
| `/discuss-capability` | Explore WHAT and WHY | Fuzzy capability reference |
| `/discuss-feature` | Explore HOW a feature works | Fuzzy feature reference |
| `/status` | Project-wide dashboard | None |
| `/resume` | Pick up interrupted pipeline | None (detects state) |
| `/plan` | Explicit plan stage trigger | Approved requirements |
| `/review` | Manual review trigger | Completed work |

### Fuzzy Resolution

- All commands accept natural language: `/debug the drill timing thing`, `/enhance mistake grading`, `/discuss spaced repetition approach`
- System resolves to capability/feature from project model
- Multiple matches: present top 3, user picks
- No match: ask user to clarify or create new

### Claude's Discretion

- Exact anchor question wording per lens
- Adaptive branching logic and question selection
- MVU slot detection and saturation checking
- Technical implementation of the reflect stage integration
- Automated scan agent architecture for /init existing-project
- Escalation severity thresholds per stage

</decisions>

<specifics>
## Specific Ideas

- "Fixed skeleton, adaptive muscles" — the mental model for layered discovery
- Cross-framing detection: /new should detect when user is describing something that already exists and pivot to /enhance
- Lens modes have directional metaphors: debug works backward, new works forward, enhance works outward, refactor works underneath
- Init validation sections are independent — confirming tech stack doesn't block confirming architecture
- Capability files grow progressively — sections fill in as the capability moves through the pipeline
- discuss-feature can route backward, not just forward — it's a quality gate, not just a formality
- Review checks the brief (intent) not just requirements (contract) — catches "built exactly what was specified but doesn't solve the problem"
- Every stage can push back: minor (flag + continue), moderate (pause + propose), major (halt + recommend upstream return)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-workflows-and-commands*
*Context gathered: 2026-02-28*
