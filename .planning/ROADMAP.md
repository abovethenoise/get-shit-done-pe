# Roadmap: GSD v2

## Overview

GSD v2 replaces the milestone/phase hierarchy with project/capability/feature, adds 3-layer requirements, 4-parallel code review, self-critiquing plans, and framing-aware workflows. The build follows a strict dependency chain: foundation infrastructure and schemas first (everything reads templates), then agent definitions (workflows spawn agents), then the pipeline stages in order (plan, review, document), then workflows and commands that orchestrate it all.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Directory structure, templates, CLI commands, YAML migration, and requirement schema
- [ ] **Phase 2: Agent Framework** - Goal-driven agent definitions with layered context and research agents
- [ ] **Phase 3: Planning Pipeline** - Planner with self-critique, traceability enforcement, and plan finalization loop
- [ ] **Phase 4: Review Layer** - 4 parallel specialist reviewers and review synthesizer
- [ ] **Phase 5: Documentation** - Reflect-and-write documentation agent generating reference docs from built code
- [ ] **Phase 6: Workflows and Commands** - Framing-aware workflows, discovery phases, initialization commands, and end-to-end integration
- [ ] **Phase 7: Cleanup** - Audit v1 artifacts, remove dead code/features, trim anything the new model doesn't need

## Phase Details

### Phase 1: Foundation
**Goal**: The structural backbone exists -- directory hierarchy, templates, CLI tooling, and requirement format are in place so all downstream agents and workflows have stable schemas to read and write
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, REQS-01, REQS-02
**Success Criteria** (what must be TRUE):
  1. Running `gsd capability create` and `gsd feature create` produces the correct directory structure under `.planning/capabilities/`
  2. FEATURE.md template contains all 3 requirement layers (end-user story + acceptance, functional behavior spec, technical implementation spec) with proper REQ ID namespacing (EU-xx, FN-xx, TC-xx)
  3. STATE.md tracks current capability and current feature position fields
  4. `js-yaml` parses and serializes 3-layer nested requirement YAML without data loss, and the old hand-rolled parser is removed
  5. All new templates (CAPABILITY.md, FEATURE.md, REVIEW.md, DOCS.md) exist and match the canonical schemas
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — js-yaml migration: replace hand-rolled frontmatter parser with js-yaml@4.1.1
- [ ] 01-02-PLAN.md — Templates and core helpers: create CAPABILITY/FEATURE/REVIEW/DOCS templates, add findCapabilityInternal/findFeatureInternal
- [ ] 01-03-PLAN.md — CLI commands and state: capability/feature lifecycle commands, gsd-tools dispatch, STATE.md extensions

### Phase 2: Agent Framework
**Goal**: Agent definitions follow a consistent goal-driven pattern with layered context injection, and research agents can gather and synthesize information using available tools
**Depends on**: Phase 1
**Requirements**: AGNT-01, AGNT-02, AGNT-03, AGNT-04, RSRCH-01, RSRCH-02, RSRCH-03, RSRCH-04, RSRCH-05, RSRCH-06
**Success Criteria** (what must be TRUE):
  1. Every agent definition specifies its goal, the artifacts it reads, and the artifacts it writes -- no ambient knowledge assumptions
  2. Agents receive core context (project + capability) automatically, with framing-specific context layered on top without modifying the agent definition itself
  3. Agent prompts include explicit scope constraints that prevent scope hallucination and generic output
  4. Research agents can be spawned in parallel (gather pattern) with a synthesizer that consolidates findings into a single summary
  5. Research agents use mgrep for codebase search and web search tools for domain knowledge
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Planning Pipeline
**Goal**: The planner produces plans where every task traces to specific requirement IDs, self-critiques its own draft, and presents findings for user decision before finalizing
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, REQS-03, REQS-04
**Success Criteria** (what must be TRUE):
  1. Every task in a generated plan references at least one REQ ID from the 3-layer requirement set -- orphan tasks are rejected
  2. After drafting, the planner self-critiques on coverage gaps, approach validity, feasibility concerns, and surfaces assumptions needing human guidance (maximum 2 rounds, then hard stop)
  3. Self-critique findings are presented to the user as Q&A -- plan is not finalized until user confirms
  4. A traceability table exists mapping every REQ ID through plan, execution, review, and documentation stages
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Review Layer
**Goal**: Executed work is reviewed by 4 specialist agents in parallel, each tracing against their requirement layer, with a synthesizer that adjudicates conflicts and presents consolidated recommendations
**Depends on**: Phase 3
**Requirements**: REVW-01, REVW-02, REVW-03, REVW-04, REVW-05, REVW-06, REVW-07, REVW-08
**Success Criteria** (what must be TRUE):
  1. 4 reviewers run in parallel without context leakage: end-user traces against story + acceptance, functional traces against behavior specs, technical traces against implementation specs, code quality traces for DRY/KISS/bloat
  2. Each reviewer produces a structured trace report with per-requirement verdicts (met / partially met / not met / regression) and finding severity (blocker / major / minor)
  3. The synthesizer consolidates 4 reports using explicit priority ordering (user > functional > technical > quality), includes a mandatory conflicts section, and presents recommendations to the user
  4. User reviews synthesized recommendations before any findings are acted on
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Documentation
**Goal**: After review acceptance, a documentation agent reads the actual built code and generates reference docs optimized for future lookup -- not a rehash of the spec
**Depends on**: Phase 4
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. The documentation agent reads actual source files (real file paths, function names, data flows) after review is accepted -- not from memory or spec
  2. Generated docs live in `.documentation/` organized per capability/feature, with a `built-from-code-at:` git SHA timestamp for staleness detection
  3. Documentation is structured for quick lookups and mgrep searches (clear headings, consistent naming, searchable function/module references)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Workflows and Commands
**Goal**: The full pipeline is orchestrated end-to-end through framing-aware workflows (debug/new/enhance/refactor) that share a common artifact pipeline, plus initialization commands that set up new and existing projects
**Depends on**: Phase 5
**Requirements**: WKFL-01, WKFL-02, WKFL-03, WKFL-04, WKFL-05, WKFL-06, WKFL-07, INIT-01, INIT-02, INIT-03
**Success Criteria** (what must be TRUE):
  1. Four framing commands (debug, new, enhance, refactor) each run a distinct discovery phase with framing-specific questions, then all converge to the same pipeline: requirements, plan, execute, review, documentation
  2. Framing context is injected at the workflow level -- the same agent definitions serve all framings with different question sets
  3. New-project initialization gathers goals/opinions via Q&A and maps out capabilities; existing-project initialization discovers capabilities via parallel research then confirms with user
  4. `discuss-capability` builds out features from a mapped capability through guided conversation
  5. A full end-to-end test passes: one capability, one feature, through discovery, requirements, planning, execution, review, and documentation
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Cleanup
**Goal**: Audit everything remaining from v1 — identify what the new model relies on, what's dead weight, and remove anything that doesn't serve a v2 dependency
**Depends on**: Phase 6
**Requirements**: FOUND-07
**Success Criteria** (what must be TRUE):
  1. Every v1 command, workflow, agent, template, and reference file is inventoried against v2 usage
  2. Files not referenced by any v2 capability, feature, or workflow are identified and removed
  3. CLI commands from gsd-tools.cjs that serve only v1 concepts (milestone, phase) are removed or refactored
  4. No dead code, obsolete templates, or orphan references remain
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Planned | - |
| 2. Agent Framework | 0/3 | Not started | - |
| 3. Planning Pipeline | 0/2 | Not started | - |
| 4. Review Layer | 0/2 | Not started | - |
| 5. Documentation | 0/1 | Not started | - |
| 6. Workflows and Commands | 0/3 | Not started | - |
| 7. Cleanup | 0/1 | Not started | - |
