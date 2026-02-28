# Phase 6: Workflows and Commands - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Four framing-aware entry points (/debug, /new, /enhance, /refactor) that each run distinct discovery with different thinking modes, then converge to a shared artifact pipeline (requirements → plan → execute → review → reflect). Plus project initialization (/init) for new and existing projects, and two discussion commands (discuss-capability, discuss-feature) for optional pre-work at different levels.

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

### Pipeline Convergence

- **Handoff artifact**: Structured brief (problem statement, constraints, desired outcome, framing type, secondary lens if applicable)
- **Always full pipeline**: Every run goes through all stages — requirements → plan → execute → review → reflect. No stage skipping.
- **Auto-generate requirements, user reviews**: System drafts from brief, user approves or edits before planning starts.
- **Lens-aware pipeline** — framing shapes behavior at every stage:
  - Plan: risk posture, decomposition strategy, scope of changes
  - Execute: solution approach, aggressiveness, what to preserve vs replace
  - Review: definition of done, validation targets, regression watchpoints
- **Reflect stage**: End of each pipeline run, incrementally updates project model. What changed, what drifted from expectations.

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
  └── decisions/           ← ADRs
  ```
- **Doc freshness via reflect stage**: Pipeline ends with reflect that incrementally updates project model and flags drift.

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

### Claude's Discretion

- Exact anchor question wording per lens
- Adaptive branching logic and question selection
- MVU slot detection and saturation checking
- How lens context metadata is structured in the brief
- Technical implementation of the reflect stage
- Automated scan agent architecture for /init existing-project

</decisions>

<specifics>
## Specific Ideas

- "Fixed skeleton, adaptive muscles" — the mental model for layered discovery
- Cross-framing detection: /new should detect when user is describing something that already exists and pivot to /enhance
- Lens modes have directional metaphors: debug works backward, new works forward, enhance works outward, refactor works underneath
- Init validation sections are independent — confirming tech stack doesn't block confirming architecture
- Capability files grow progressively — sections fill in as the capability moves through the pipeline
- discuss-feature can route backward, not just forward — it's a quality gate, not just a formality

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-workflows-and-commands*
*Context gathered: 2026-02-28*
