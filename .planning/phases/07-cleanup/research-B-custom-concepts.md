# Research B: Custom v1 Concepts Inventory

**Researched:** 2026-02-28
**Researcher:** Researcher B (Custom v1 Concepts)
**Scope:** All custom agent definitions, workflows, commands, references, and templates in the user's project-level customizations that constitute "v1" concepts

---

## Methodology

Examined the following locations:
- `~/.claude/agents/` — installed agents (GSD framework + user overrides)
- `~/.claude/commands/gsd/` — installed slash commands
- `~/.claude/CLAUDE.md` — global user instructions
- `/Users/philliphall/get-shit-done-pe/agents/` — v2 agent definitions being developed
- `/Users/philliphall/get-shit-done-pe/commands/gsd/` — v2 commands being developed
- `/Users/philliphall/get-shit-done-pe/get-shit-done/` — v2 workflows, references, templates
- `/Users/philliphall/get-shit-done-pe/.planning/` — project planning artifacts (REQUIREMENTS.md, ROADMAP.md)

**Key insight on installed vs in-development:** The `~/.claude/agents/` directory contains the INSTALLED GSD framework agents (not custom v1 agents). The custom v1 concepts are almost entirely in the *project repo itself* (`get-shit-done-pe/`), since this IS the project building v2. The v2 artifacts in the repo represent fully-designed but not-yet-installed v1 concepts.

---

## Part 1: Installed Layer (~/.claude/)

### 1.1 Agents — Installed (`~/.claude/agents/`)

All 11 agents in this directory are GSD framework agents, not custom v1 concepts. The only non-GSD agent is:

| Name | Type | Purpose | v1 Domain | GSD Equivalent |
|------|------|---------|-----------|----------------|
| `primary-collaborator` | agent | Daily collaborator for poker-companion project; applies 7-step collaboration protocol with project-specific hard rules (DuckDB, SQLMesh, Svelte 5, etc.) | Unmapped — project-specific | None — this is a project domain agent, not a pipeline agent |

**Notes on primary-collaborator:**
- Model: Opus (pinned)
- Memory: user scope (persistent across sessions via `~/.claude/agent-memory/primary-collaborator/`)
- Contains 17 project hard rules (DDL, DuckDB singleton, SQLMesh patterns, etc.)
- Contains Read-Before-Doing map for different task types
- Contains "North Star" (magic moment) for product direction
- Contains pinned stack versions (DuckDB 1.4.3, SQLMesh 0.228.5, Python 3.12, Svelte 5, etc.)
- **Orphan concept:** No GSD equivalent. This is a project domain agent that should remain in `~/.claude/agents/`.

### 1.2 Commands — Installed (`~/.claude/commands/gsd/`)

The installed commands are all GSD commands. Commands present in user install but absent from GSD framework workflows:

| Command | Type | Purpose | v1 Domain | GSD Equivalent | Status |
|---------|------|---------|-----------|----------------|--------|
| `debug.md` | command | Orchestrator for gsd-debugger agent; gathers symptoms, spawns subagent, handles checkpoints | Code Review (debugging aspect) | `gsd:debug` exists — this IS the GSD debug command | Framework command |
| `resume-work.md` | command | Restore session context; delegates to resume-project workflow | GSD infrastructure | `resume-project.md` workflow exists | Framework command pointing to GSD workflow |
| `reapply-patches.md` | command | Merges local GSD modifications back after an update | GSD maintenance | None — update tooling only | Infrastructure command |
| `join-discord.md` | command | Displays Discord invite link | GSD meta | None | Trivial meta command |
| `new-project.md.bak` | command backup | Older version of new-project command with inline process (not delegating to workflow) | GSD pipeline | `new-project.md` (current) | Dead artifact — superseded by workflow delegation |

**Commands in GSD framework workflows NOT in installed commands:**

| Missing | Notes |
|---------|-------|
| `diagnose-issues` | GSD workflow exists but no command entry point installed |
| `discovery-phase` | GSD workflow exists but no command entry point installed |
| `execute-plan` | GSD workflow exists but no command entry point |
| `resume-project` | GSD workflow exists; user has `resume-work.md` pointing to it |
| `transition` | GSD workflow exists but no command |
| `verify-phase` | GSD workflow exists but no command |

### 1.3 Global Instructions (`~/.claude/CLAUDE.md`)

| Name | Type | Purpose | v1 Domain | GSD Equivalent |
|------|------|---------|-----------|----------------|
| Global user preferences | instruction | Establishes user identity (data professional, not software engineer), division of responsibility, communication style (ASCII data flow diagrams, concise), engineering principles (DRY/KISS/YAGNI), preferred stack defaults (DuckDB/SQLMesh/Python+Polars/Electron/Svelte 5) | Foundation for all agent behavior | None — consumed by all agents as system-level context |

---

## Part 2: v1 Concepts in Project Repo (`get-shit-done-pe/`)

This is where all six known concept domains live. These are the v2 designs that have been built but are not yet installed in `~/.claude/`.

### 2.1 Framing/Lens Taxonomy

**Status: Fully designed and built in v2. Orphan concept relative to current GSD install.**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `framing-lenses.md` | `get-shit-done/references/framing-lenses.md` | reference | Authoritative spec for 4 discovery lenses: Debug (detective/backward), New (architect/forward), Enhance (editor/outward), Refactor (surgeon/underneath). Defines MVU slots, exit signals, cross-framing detection, compound work, and summary playback rules. | Framing/lens taxonomy | ORPHAN — no GSD equivalent |
| `framing-discovery.md` | `get-shit-done/workflows/framing-discovery.md` | workflow | Executes lens-specific discovery: fuzzy capability resolution, anchor question Q&A with per-field MVU tracking, lens misclassification detection, pivot handling, mandatory summary playback, Discovery Brief artifact production | Framing/lens taxonomy | ORPHAN — no GSD equivalent |
| `framing-pipeline.md` | `get-shit-done/workflows/framing-pipeline.md` | workflow | Routes from completed Discovery Brief into the standard artifact pipeline (requirements → plan → execute → review → documentation) with framing context injection | Framing/lens taxonomy | Partial: GSD has `plan-phase`, `execute-phase`, `verify-work` but no framing injection layer |
| `framings/debug/anchor-questions.md` | `get-shit-done/framings/debug/anchor-questions.md` | reference | Anchor questions specific to Debug (detective) framing | Framing/lens taxonomy | ORPHAN |
| `framings/new/anchor-questions.md` | `get-shit-done/framings/new/anchor-questions.md` | reference | Anchor questions specific to New (architect) framing | Framing/lens taxonomy | ORPHAN |
| `framings/enhance/anchor-questions.md` | `get-shit-done/framings/enhance/anchor-questions.md` | reference | Anchor questions specific to Enhance (editor) framing | Framing/lens taxonomy | ORPHAN |
| `framings/refactor/anchor-questions.md` | `get-shit-done/framings/refactor/anchor-questions.md` | reference | Anchor questions specific to Refactor (surgeon) framing | Framing/lens taxonomy | ORPHAN |
| `commands/gsd/debug.md` (v2) | `commands/gsd/debug.md` | command | Entry point for Debug lens framing discovery | Framing/lens taxonomy | GSD has `gsd:debug` but it's a debugging tool, not a framing entry point |
| `commands/gsd/new.md` | `commands/gsd/new.md` | command | Entry point: Architect mode (define problem space before solutioning) | Framing/lens taxonomy | ORPHAN |
| `commands/gsd/enhance.md` | `commands/gsd/enhance.md` | command | Entry point: Editor mode (find the seam and extend) | Framing/lens taxonomy | ORPHAN |
| `commands/gsd/refactor.md` | `commands/gsd/refactor.md` | command | Entry point: Surgeon mode (understand load-bearing walls before restructuring) | Framing/lens taxonomy | ORPHAN |
| `templates/discovery.md` | `get-shit-done/templates/discovery.md` | template | Discovery Brief artifact template with lens-variant Specification sections | Framing/lens taxonomy | ORPHAN |
| `templates/discovery-brief.md` | `get-shit-done/templates/discovery-brief.md` | template | Shorter/alternate Discovery Brief template | Framing/lens taxonomy | ORPHAN |
| `escalation-protocol.md` | `get-shit-done/references/escalation-protocol.md` | reference | Rules for when to escalate decisions out of the pipeline to user | Framing/lens taxonomy | Partial: GSD has deviation rules and checkpoint protocols |

**Summary — Framing/Lens Taxonomy:**
- 4 framing lenses: Debug (detective), New (architect), Enhance (editor), Refactor (surgeon)
- Each lens has: entry command, anchor questions, MVU slot definitions, exit signals
- Cross-framing detection prevents wrong-lens work
- Compound work model handles mixed-lens work
- Discovery Brief is the output artifact that enters the pipeline
- GSD has NO equivalent framing layer — its pipeline starts at plan, not discovery

---

### 2.2 Research — 6-Agent Synthesis vs 4-Generic

**Status: Fully designed and built in v2. Replaces GSD's 4 generic project-researcher agents.**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `gsd-research-domain` | `agents/gsd-research-domain.md` | agent | Answers "What are the fundamental truths, constraints, and first principles of this problem space?" — produces `domain-truth-findings.md` | Research (6-agent synthesis) | Partial: GSD `gsd-project-researcher` covers ecosystem but not first-principles domain truth |
| `gsd-research-intent` | `agents/gsd-research-intent.md` | agent | Answers "What does the user actually want, and what are the acceptance criteria that matter most?" — produces `user-intent-findings.md` | Research (6-agent synthesis) | ORPHAN — no GSD equivalent for user-intent dimension |
| `gsd-research-system` | `agents/gsd-research-system.md` | agent | Answers "What exists in the current codebase that is relevant — what works, what constrains, what can be reused?" — produces `existing-system-findings.md` | Research (6-agent synthesis) | Partial: GSD `gsd-codebase-mapper` covers this |
| `gsd-research-prior-art` | `agents/gsd-research-prior-art.md` | agent | Answers "How have others solved this? What ecosystem patterns, libraries, and proven approaches exist?" — produces `prior-art-findings.md` | Research (6-agent synthesis) | Partial: GSD `gsd-project-researcher` ecosystem mode covers this |
| `gsd-research-tech` | `agents/gsd-research-tech.md` | agent | Answers "What are the technical limits, dependencies, compatibility issues, and feasibility boundaries?" — produces `tech-constraints-findings.md` | Research (6-agent synthesis) | Partial: GSD `gsd-project-researcher` feasibility mode covers this |
| `gsd-research-edges` | `agents/gsd-research-edges.md` | agent | Answers "What can go wrong, what are the boundary conditions, and what are the failure modes?" — produces `edge-cases-findings.md` | Research (6-agent synthesis) | ORPHAN — no GSD equivalent for edge-case dimension |
| `gsd-research-synthesizer` (v2) | `agents/gsd-research-synthesizer.md` | agent | Consolidates 6 gatherer outputs into single research synthesis | Research (6-agent synthesis) | GSD has `gsd-research-synthesizer` but consolidates 4 outputs (STACK/FEATURES/ARCHITECTURE/PITFALLS), not 6 first-principles dimensions |
| `gather-synthesize.md` | `get-shit-done/workflows/gather-synthesize.md` | workflow | Reusable orchestration primitive: spawns N gatherer agents in parallel then one synthesizer; parameterized, used by research (6 gatherers) and review (4 gatherers) | Research (6-agent synthesis) | ORPHAN — GSD has no reusable gather-synthesize primitive |

**Key structural difference:** GSD research = 4 parallel agents answering domain-specific questions (stack, features, architecture, pitfalls). v1 research = 6 parallel agents answering epistemological questions (what is true, what does user want, what exists, how have others solved it, what are limits, what can go wrong). v1 approach is problem-type-agnostic and reused across the entire pipeline (same pattern for review).

---

### 2.3 Discovery/Discussion — Lens-Aware vs discuss-phase

**Status: v1 has lens-aware discovery. GSD has discuss-phase (non-lens-aware).**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `discuss-capability.md` | `commands/gsd/discuss-capability.md` | command | Explore WHAT and WHY for a capability before committing to a framing lens | Discovery/discussion | Partial: GSD `discuss-phase` but not capability-level |
| `discuss-feature.md` | `commands/gsd/discuss-feature.md` | command | Explore HOW a specific feature works before implementation | Discovery/discussion | Partial: GSD `discuss-phase` but not feature-level |
| `discuss-capability.md` (workflow) | `get-shit-done/workflows/discuss-capability.md` | workflow | Full workflow for capability-level discussion with lens-awareness and hierarchy navigation | Discovery/discussion | ORPHAN |
| `discuss-feature.md` (workflow) | `get-shit-done/workflows/discuss-feature.md` | workflow | Full workflow for feature-level discussion | Discovery/discussion | ORPHAN |
| `init.md` | `commands/gsd/init.md` | command | Unified entry point: auto-detects new or existing codebase, routes to appropriate setup flow | Discovery/discussion | Partial: GSD `new-project.md` + brownfield detection |
| `init-project.md` | `get-shit-done/workflows/init-project.md` | workflow | Unified project initialization workflow backing the `gsd:init` command | Discovery/discussion | Partial: GSD `new-project.md` workflow |

**Key structural difference:** GSD `discuss-phase` is a single command that gathers context for ONE phase. v1 discovery is lens-typed (4 lenses), hierarchy-aware (capability vs feature vs phase), and produces a structured Discovery Brief artifact that feeds the pipeline.

---

### 2.4 Requirements — 3 Abstraction Levels vs Flat

**Status: Fully designed and implemented in Phase 1 (foundation). Core v1 concept.**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `templates/feature.md` | `get-shit-done/templates/feature.md` | template | FEATURE.md template containing all 3 requirement layers: EU-xx (user story + acceptance criteria), FN-xx (functional behavior spec), TC-xx (technical implementation spec) | Requirements (3-layer) | ORPHAN — GSD REQUIREMENTS.md is flat with REQ-IDs only |
| `templates/capability.md` | `get-shit-done/templates/capability.md` | template | CAPABILITY.md template: capability-level container with goals, boundaries, and feature list | Requirements (3-layer) | ORPHAN — GSD has no capability hierarchy level |
| `templates/requirements.md` | `get-shit-done/templates/requirements.md` | template | v2 requirements template supporting 3-layer format | Requirements (3-layer) | GSD has `requirements.md` template but single-layer |

**The 3 layers:**
- **EU-xx (End-User):** User story ("As a [role], I want to [action]") + acceptance criteria (observable conditions for "done")
- **FN-xx (Functional):** Behavior specification — how the system behaves from a functional/product perspective
- **TC-xx (Technical):** Implementation specification — how the system is built technically

**Hierarchy:** Project → Capability → Feature → Requirements (3 layers)

GSD equivalent: Project → Phase → flat REQ-IDs (no layers, no capability/feature hierarchy)

**Also:** The `gsd plan-validate` CLI command (REQS-03) enforces zero-orphan-task rule — every plan task must reference at least one REQ ID across the 3 layers. GSD has no equivalent enforcement.

---

### 2.5 Code Review — 4-Reviewer+Judge vs UAT+Debug

**Status: Fully designed and built (Phase 4). 4 parallel specialists + synthesizer as judge.**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `gsd-review-enduser` | `agents/gsd-review-enduser.md` | agent | Traces executed work against EU-xx (user stories + acceptance criteria). Verdict: met/not-met/regression. No fix proposals. | Code Review (4-reviewer) | Partial: GSD `gsd-verifier` checks against goal, not per-requirement layer |
| `gsd-review-functional` | `agents/gsd-review-functional.md` | agent | Traces executed work against FN-xx (functional behavior specs). Verdict: met/not-met/regression. | Code Review (4-reviewer) | ORPHAN — no GSD equivalent |
| `gsd-review-technical` | `agents/gsd-review-technical.md` | agent | Traces executed work against TC-xx (technical implementation specs). Verdict: met/not-met/regression. | Code Review (4-reviewer) | ORPHAN — no GSD equivalent |
| `gsd-review-quality` | `agents/gsd-review-quality.md` | agent | Traces for DRY/KISS/no-bloat/no-over-complexity/no-obsolete-code. Not requirement-layer bound. | Code Review (4-reviewer) | Partial: GSD anti-pattern detection in `gsd-verifier` |
| `gsd-review-synthesizer` | `agents/gsd-review-synthesizer.md` | agent | Consolidates 4 trace reports; assigns severity (blocker/major/minor); spot-checks citations (reads actual file:line); resolves conflicts with priority ordering (user > functional > technical > quality); presents to user | Code Review (4-reviewer+judge) | ORPHAN — GSD has no review synthesizer/judge |
| `review-phase.md` | `commands/gsd/review-phase.md` | command | Entry point: runs 4 parallel reviewers then synthesizer | Code Review | ORPHAN — GSD has no `/gsd:review-phase` |
| `review-phase.md` (workflow) | `get-shit-done/workflows/review-phase.md` | workflow | Orchestration: spawns 4 reviewer agents in parallel via gather-synthesize, collects trace reports, spawns synthesizer, presents consolidated findings | Code Review | ORPHAN — GSD `verify-work` is not a code review workflow |
| `templates/review.md` | `get-shit-done/templates/review.md` | template | Review trace report template for each reviewer agent | Code Review | ORPHAN |

**Key structural difference:**
- GSD verification: single `gsd-verifier` agent checks goal achievement after execution (pass/fail with gaps)
- v1 review: 4 specialists each trace against their requirement layer independently, synthesizer assigns severity and resolves conflicts, findings presented to user with priority ordering
- v1 review explicitly distinguishes between met/not-met/regression (regression = worked before, broke now)
- v1 review fires AFTER execution, BEFORE documentation; GSD verification fires AFTER execution (similar timing, very different mechanism)

---

### 2.6 Documentation — Taxonomy+Ownership vs GSD Artifacts

**Status: Fully designed and built (Phase 5). Reflect-and-write pattern with ownership tagging.**

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `gsd-doc-writer` | `agents/gsd-doc-writer.md` | agent | Reads actual built code + review findings + feature requirements → generates module docs + flow docs with 3-pass self-validation; uses [derived]/[authored] ownership tags on every section | Documentation | ORPHAN — GSD has no dedicated documentation agent |
| `doc-phase.md` | `commands/gsd/doc-phase.md` | command | Entry point: generates documentation for a phase | Documentation | ORPHAN — GSD has no `/gsd:doc-phase` |
| `doc-phase.md` (workflow) | `get-shit-done/workflows/doc-phase.md` | workflow | Single doc-writer agent with Q&A review; reads executed code, review synthesis, and requirements to produce module + flow reference docs | Documentation | ORPHAN |
| `templates/docs.md` | `get-shit-done/templates/docs.md` | template | DOCS.md artifact template for per-feature documentation | Documentation | ORPHAN — GSD SUMMARY.md captures execution results, not reference documentation |
| `.documentation/gate/` | `.documentation/gate/constraints.md`, `state.md`, `glossary.md` | references | Authoritative gate documents: constraints (hard rules for documentation), state (current docs inventory), glossary (shared vocabulary) | Documentation | ORPHAN |

**Key structural differences:**
- GSD produces SUMMARY.md (execution record) and VERIFICATION.md (verification record) — retrospective artifacts
- v1 produces `.documentation/` directory with reference docs optimized for future lookup (module docs, flow docs)
- v1 doc-writer reads ACTUAL CODE, not plans — "reflect and write" (document what was built, not what was planned)
- v1 uses [derived]/[authored] ownership tags so readers know which sections came from code analysis vs human authorship
- v1 has gate documents that constrain documentation quality and establish shared vocabulary

---

## Part 3: Supporting Infrastructure (v1-Specific)

### 3.1 Project Hierarchy (Capability/Feature)

GSD uses: Project → Milestone → Phase → Plan → Task

v1 uses: Project → Capability → Feature → (pipeline stages)

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `templates/capability.md` | `get-shit-done/templates/capability.md` | template | Container for related features with goals, boundaries, feature index | Foundation | ORPHAN — GSD has no capability level |
| `templates/feature.md` | `get-shit-done/templates/feature.md` | template | Feature unit with 3-layer requirements, implementation status, review traceability | Foundation | Partial: GSD Phase is analogous but lacks requirement layers |
| Capability CLI commands | `bin/gsd-tools.cjs` (implemented) | CLI | `gsd capability create`, `gsd feature create`, `gsd capability list`, etc. | Foundation | GSD has phase/plan management CLI but not capability/feature |

### 3.2 Planning — Self-Critique Loop

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| v2 planner with self-critique | `agents/gsd-planner.md` (v2 version) | agent | After drafting plan, self-critiques on: requirement coverage gaps, approach validity, execution feasibility, assumptions needing human guidance. Max 2 rounds, hard stop. Presents findings as Q&A before finalization. | Planning | Partial: GSD `gsd-plan-checker` verifies plan but it's a separate agent, not self-critique by the planner |
| `plan-phase.md` (v2 workflow) | `get-shit-done/workflows/plan-phase.md` | workflow | Includes Q&A loop and validation gate — plan not finalized until user confirms | Planning | Partial: GSD `plan-phase.md` workflow has plan-checker but not user-confirmation gate |
| `gsd plan-validate` CLI | `bin/gsd-tools.cjs` | CLI | Enforces zero-orphan-task rule — every task must reference a REQ ID | Planning | ORPHAN — GSD has no task-level REQ ID enforcement |

### 3.3 Gather-Synthesize as Reusable Primitive

| Name | Location | Type | Purpose | v1 Domain | GSD Equivalent |
|------|----------|------|---------|-----------|----------------|
| `gather-synthesize.md` | `get-shit-done/workflows/gather-synthesize.md` | workflow | Parameterized orchestration: N parallel gatherers + 1 synthesizer. Used by research (6 gatherers) and review (4 gatherers). Defines 4 context layers: core, capability, feature, framing-specific. | Research + Review | ORPHAN — GSD launches parallel agents inline per workflow, no reusable primitive |

---

## Part 4: Orphan Concepts Summary

These are v1 concepts with **no GSD equivalent**:

| Concept | Location | What It Does | Why No GSD Equivalent |
|---------|----------|-------------|----------------------|
| **Framing lens taxonomy** | `references/framing-lenses.md` + framings/ | 4 typed discovery modes (debug/new/enhance/refactor) with MVU slots, exit signals, cross-framing detection | GSD starts at plan; has no typed discovery layer |
| **Discovery Brief artifact** | `templates/discovery.md` | Structured output of framing discovery that enters the pipeline | GSD has CONTEXT.md but it's non-typed and less structured |
| **6-agent research pattern** | `agents/gsd-research-{domain,intent,system,prior-art,tech,edges}.md` | Parallel epistemic research (what is true / user intent / existing system / how others solved / tech constraints / edge cases) | GSD uses 4 domain-specific researchers (stack/features/architecture/pitfalls) |
| **User-intent research dimension** | `agents/gsd-research-intent.md` | "What does the user actually want?" as a standalone research question | GSD research does not explicitly model user intent as a research dimension |
| **Edge-cases research dimension** | `agents/gsd-research-edges.md` | "What can go wrong? What are failure modes and boundary conditions?" | GSD PITFALLS.md is closest but is domain-scoped, not feature-scoped |
| **Gather-synthesize primitive** | `get-shit-done/workflows/gather-synthesize.md` | Reusable N-gatherer + 1-synthesizer orchestration with 4-layer context assembly | GSD orchestrates parallel agents inline, no reusable primitive |
| **4-parallel code review** | `agents/gsd-review-{enduser,functional,technical,quality}.md` | Per-requirement-layer specialist reviewers producing trace reports with met/not-met/regression verdicts | GSD verifier checks goal achievement, not per-layer requirement tracing |
| **Review synthesizer/judge** | `agents/gsd-review-synthesizer.md` | Consolidates 4 trace reports, assigns severity, spot-checks citations, resolves reviewer conflicts via priority ordering | No GSD equivalent |
| **Documentation agent** | `agents/gsd-doc-writer.md` | Reflect-and-write: reads actual built code to generate reference docs with ownership tagging | GSD produces execution/verification records, not reference documentation |
| **doc-phase workflow** | `workflows/doc-phase.md` | Dedicated documentation generation stage in the pipeline | No GSD equivalent |
| **Capability hierarchy level** | `templates/capability.md` + CLI | Project → Capability → Feature containment (above phase level) | GSD has Project → Milestone → Phase (milestone is closest but different semantics) |
| **3-layer requirements** | `templates/feature.md` (EU-xx/FN-xx/TC-xx) | Requirement layers: end-user story, functional behavior spec, technical implementation spec | GSD has single-layer REQ-IDs (no semantic layering) |
| **Zero-orphan-task enforcement** | `gsd plan-validate` CLI | Every task must reference at least one REQ ID | GSD plan-checker verifies task completeness but not REQ ID traceability |
| **[derived]/[authored] ownership tagging** | doc-writer + docs template | Every doc section tagged as derived from code analysis vs human-authored | No GSD equivalent |
| **Gate documents** | `.documentation/gate/` | Authoritative constraints, state, and glossary for documentation domain | No GSD equivalent |
| **Framing context injection** | framing-pipeline.md | Same pipeline agents receive different question sets based on active framing | GSD agents are framing-unaware |

---

## Part 5: Partial Overlaps (GSD Has Something, v1 Has Better)

| v1 Concept | GSD Equivalent | What v1 Does Better |
|------------|----------------|---------------------|
| 6-agent research (prior-art + domain) | `gsd-project-researcher` (4 agents: stack/features/architecture/pitfalls) | v1 research is problem-type-agnostic and first-principles-grounded; GSD research is domain-scoped and template-driven |
| Framing discovery | `discuss-phase` | v1 is typed (4 lens modes), produces structured artifact, detects lens mismatch; GSD is open-ended discussion |
| Review layer | `gsd-verifier` | v1 traces per-requirement-layer with met/not-met/regression; GSD checks goal achievement pass/fail |
| Self-critiquing planner | `gsd-plan-checker` (separate agent) | v1 planner critiques itself, presents to user before finalizing; GSD checker is external and automated |
| System research | `gsd-codebase-mapper` | v1 research-system is feature-scoped and research-phase integrated; GSD mapper is standalone |
| Capability/Feature hierarchy | GSD Phase | v1 has explicit goal/boundary semantics + 3-layer requirements at feature level; GSD phase is a flat execution unit |

---

## Part 6: Dead v1 Concepts (Superseded Within v1)

| Concept | Evidence | Verdict |
|---------|----------|---------|
| `new-project.md.bak` in `~/.claude/commands/gsd/` | Older inline version of new-project; current version delegates to workflow | Dead — remove |
| Hand-rolled frontmatter parser in `gsd-tools.cjs` | FOUND-03 marks complete: replaced with js-yaml@4.1.1 | Dead code in the binary — may still exist pending cleanup |

---

## Part 7: GSD Framework Concepts with No v1 Equivalent

These GSD capabilities are not reflected anywhere in the v1 custom concepts. They are GSD-native and should be preserved:

| GSD Concept | Location | Notes |
|-------------|----------|-------|
| Session management (STATE.md discipline) | GSD framework | v1 extends STATE.md but doesn't replace session management |
| `gsd-codebase-mapper` (4 focus areas) | `agents/gsd-codebase-mapper.md` | Valuable standalone capability; v1 has research-system for research phase only |
| `gsd-plan-checker` | `agents/gsd-plan-checker.md` | External plan validation; v1 has self-critique PLUS external checker (complementary) |
| Nyquist validation | `gsd-plan-checker.md` Dimension 8 | No v1 equivalent; testing infrastructure validation |
| Milestone audit + integration checker | `workflows/audit-milestone.md` + `agents/gsd-integration-checker.md` | v1 doesn't have a milestone-level audit concept |
| `gsd-debugger` (scientific method debugging) | `agents/gsd-debugger.md` | v1's debug framing is discovery-only; GSD debugger is full investigation tool |
| `add-tests`, `add-todo`, `check-todos`, `health` | GSD workflows | Utility commands with no v1 equivalents |
| Brownfield detection in `new-project` | GSD `new-project.md.bak` | v1 `init-project.md` workflow also has brownfield detection — both have it |
| Model profile resolution | `references/model-profile-resolution.md` | v1 has `core.cjs` ROLE_MODEL_MAP — different mechanism, same problem |
| TDD execution pattern | `references/tdd.md` | v1 has no explicit TDD mode |
| Checkpoint protocol (human-verify/decision/human-action) | `agents/gsd-executor.md` | v1 doesn't formalize checkpoint types this way |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Orphan v1 concepts (no GSD equivalent) | 15 |
| Partial overlaps (v1 superior) | 6 |
| GSD-native concepts (no v1 equivalent) | 10+ |
| Dead v1 artifacts | 2 |
| Installed custom agents (non-GSD) | 1 (primary-collaborator) |

---

## Cross-Reference to Known 6 Concept Domains

| Domain (from CONTEXT.md) | v1 Location | GSD Equivalent | Verdict Hint |
|--------------------------|-------------|----------------|--------------|
| **Framing/lens taxonomy** | `references/framing-lenses.md`, `framings/*/`, 4 framing commands | None | v1 wins — GSD has nothing here |
| **Research (6-agent synthesis)** | `agents/gsd-research-{domain,intent,system,prior-art,tech,edges}.md` + `gather-synthesize.md` | GSD `gsd-project-researcher` (4 agents) | Hybridize — different questions, complementary dimensions |
| **Discovery/discussion (lens-aware)** | `workflows/discuss-capability.md`, `framing-discovery.md` | GSD `discuss-phase` | v1 wins on structure, GSD wins on simplicity — hybridize |
| **Requirements (3-layer)** | `templates/feature.md` (EU-xx/FN-xx/TC-xx) | GSD flat REQ-IDs | v1 wins — 3-layer is strictly more expressive |
| **Code review (4-reviewer+judge)** | `agents/gsd-review-*` + `workflows/review-phase.md` | GSD `gsd-verifier` (goal-backward) | Both valuable — different stages (review=quality, verify=goal-achievement) |
| **Documentation (taxonomy+ownership)** | `agents/gsd-doc-writer.md`, `workflows/doc-phase.md`, `.documentation/gate/` | None | v1 wins — GSD produces execution records, not reference docs |

---

*Inventory completed: 2026-02-28*
*Sources: Direct file inspection of ~/.claude/, ~/.claude/agents/, ~/.claude/commands/gsd/, and get-shit-done-pe/ project directory*
