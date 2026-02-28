# Requirements: GSD v2

**Defined:** 2026-02-28
**Core Value:** Every piece of executed work traces back to a specific requirement, and every requirement is verified against the actual code.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Capability/Feature directory structure replaces milestone/phase in .planning/
- [ ] **FOUND-02**: STATE.md tracks current capability, current feature, and cross-feature state
- [x] **FOUND-03**: js-yaml@4.1.1 replaces hand-rolled frontmatter parser for 3-layer requirement nesting
- [ ] **FOUND-04**: CLI commands for capability lifecycle (create, list, status)
- [ ] **FOUND-05**: CLI commands for feature lifecycle (create, list, status)
- [ ] **FOUND-06**: Templates updated for all new artifact types (CAPABILITY.md, FEATURE.md, REVIEW.md, DOCS.md)
- [ ] **FOUND-07**: Existing bloat, dead features, and artifacts that don't fit the new model are removed

### Requirements System

- [ ] **REQS-01**: 3-layer requirement format per feature: end-user (story + acceptance), functional (behavior spec), technical (implementation spec)
- [ ] **REQS-02**: REQ ID scheme namespaced per layer (EU-xx, FN-xx, TC-xx) within each feature
- [ ] **REQS-03**: Zero-orphan-task enforcement — every plan task must reference at least one REQ ID
- [ ] **REQS-04**: Traceability table mapping every REQ ID through plan → execution → review → documentation

### Project Initialization

- [ ] **INIT-01**: New-project mode: Q&A about goals, tech stack opinions, architecture approach → maps out capabilities (stops at capability level)
- [ ] **INIT-02**: Existing-project mode: understands goals + opinions → parallel research discovers existing capabilities/features → Q&A to confirm/adjust → identify new capabilities/features/improvements
- [ ] **INIT-03**: Discuss-capability command builds out features from a mapped capability

### Workflows

- [ ] **WKFL-01**: Four framing commands as entry points: debug, new, enhance, refactor
- [ ] **WKFL-02**: Debug framing discovery: observe current state → compare to expected → hypothesize → root cause → converge to pipeline
- [ ] **WKFL-03**: New framing discovery: explore → brainstorm → converge to pipeline
- [ ] **WKFL-04**: Enhance framing discovery: assess what's working → identify what needs improvement → align → converge to pipeline
- [ ] **WKFL-05**: Refactor framing discovery: reason for change → new goal/mission → understand codebase → explore options → align → converge to pipeline
- [ ] **WKFL-06**: All framings converge to same artifact pipeline: requirements → plan → execute → review → documentation
- [ ] **WKFL-07**: Framing context injection: same agents receive different question sets based on active framing

### Planning

- [ ] **PLAN-01**: Planner drafts plan with tasks referencing REQ IDs across all 3 requirement layers
- [ ] **PLAN-02**: System self-critique challenges draft on: requirement coverage, approach validity, execution feasibility, and surfaces assumptions needing human guidance
- [ ] **PLAN-03**: Self-critique findings presented to user as Q&A — user provides feedback/guidance before finalization
- [ ] **PLAN-04**: Plan finalized only after user confirms — no auto-finalize

### Review

- [ ] **REVW-01**: 4 parallel specialist reviewers: end-user, functional, technical, code quality
- [ ] **REVW-02**: Each reviewer produces trace report: per-requirement verdict (met / partially met / not met / regression)
- [ ] **REVW-03**: End-user reviewer traces against story + acceptance criteria
- [ ] **REVW-04**: Functional reviewer traces against behavior specs
- [ ] **REVW-05**: Technical reviewer traces against implementation specs
- [ ] **REVW-06**: Code quality reviewer traces for DRY, KISS, no over-complexity, no bloat, no obsolete code
- [ ] **REVW-07**: Synthesizer consolidates 4 trace reports, verifies findings, resolves conflicts (priority: user > functional > technical > quality)
- [ ] **REVW-08**: Synthesized recommendations presented to user for decision

### Documentation

- [ ] **DOCS-01**: Reflect-and-write agent reads actual built code after review acceptance
- [ ] **DOCS-02**: .documentation/ directory contains final-state reference docs per capability/feature
- [ ] **DOCS-03**: Documentation optimized for quick lookups and mgrep searches during future research/planning

### Research

- [ ] **RSRCH-01**: Research rooted in first-principles thinking: identify fundamental truths/constraints, challenge assumptions, reason from constraints upward
- [ ] **RSRCH-02**: Research bridges from "what is true" to "how this applies to our specific goals and requirements"
- [ ] **RSRCH-03**: Parallelized gather → synthesize pattern (multiple researchers, one synthesizer)
- [ ] **RSRCH-04**: Research agents use mgrep for efficient codebase/file search
- [ ] **RSRCH-05**: Research agents use Brave Search / WebSearch for domain knowledge and ecosystem patterns
- [ ] **RSRCH-06**: Research agents use Context7 for library-specific documentation lookup

### Agents

- [ ] **AGNT-01**: Agent definitions are goal-driven with artifact awareness (know what files to read/write and how they fit the pipeline)
- [ ] **AGNT-02**: Layered context: core (project + capability) always present, framing-specific context added on top
- [ ] **AGNT-03**: Framing changes the questions agents ask, not the agent definition itself
- [ ] **AGNT-04**: Agent prompts are constrained to prevent scope hallucination and generic output

## v2 Requirements

### Migration

- **MIGR-01**: `gsd migrate` command converts v1 .planning/ artifacts to v2 structure
- **MIGR-02**: Migration guide documenting v1 → v2 artifact mapping

### Enhancements

- **ENH-01**: Framing-aware context injection with examples and anti-patterns per work type
- **ENH-02**: Extended STATE.md fields for cross-feature dependencies and blocked capabilities
- **ENH-03**: Multi-runtime support (Gemini CLI, OpenCode, Codex)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-advance through stages | Removes user from control loop; compounds errors silently |
| Real-time collaboration | Framework is single-user, single-project by design |
| AI-generated test suites in orchestrator | Tests belong in executor domain, not orchestrator |
| Vector database / embeddings for context | STATE.md discipline beats non-deterministic retrieval |
| Backward compatibility with v1 artifacts | Clean break needed for hierarchy redesign |
| Dashboard / progress visualization UI | Terminal-native; /gsd:progress covers this |
| LLM-judged requirement quality scoring | Circular — AI grading its own inputs; structural validation instead |
| Milestones as separate concept | Replaced by capability/feature hierarchy |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| FOUND-07 | Phase 7 | Pending |
| REQS-01 | Phase 1 | Pending |
| REQS-02 | Phase 1 | Pending |
| REQS-03 | Phase 3 | Pending |
| REQS-04 | Phase 3 | Pending |
| INIT-01 | Phase 6 | Pending |
| INIT-02 | Phase 6 | Pending |
| INIT-03 | Phase 6 | Pending |
| WKFL-01 | Phase 6 | Pending |
| WKFL-02 | Phase 6 | Pending |
| WKFL-03 | Phase 6 | Pending |
| WKFL-04 | Phase 6 | Pending |
| WKFL-05 | Phase 6 | Pending |
| WKFL-06 | Phase 6 | Pending |
| WKFL-07 | Phase 6 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 3 | Pending |
| REVW-01 | Phase 4 | Pending |
| REVW-02 | Phase 4 | Pending |
| REVW-03 | Phase 4 | Pending |
| REVW-04 | Phase 4 | Pending |
| REVW-05 | Phase 4 | Pending |
| REVW-06 | Phase 4 | Pending |
| REVW-07 | Phase 4 | Pending |
| REVW-08 | Phase 4 | Pending |
| DOCS-01 | Phase 5 | Pending |
| DOCS-02 | Phase 5 | Pending |
| DOCS-03 | Phase 5 | Pending |
| RSRCH-01 | Phase 2 | Pending |
| RSRCH-02 | Phase 2 | Pending |
| RSRCH-03 | Phase 2 | Pending |
| RSRCH-04 | Phase 2 | Pending |
| RSRCH-05 | Phase 2 | Pending |
| RSRCH-06 | Phase 2 | Pending |
| AGNT-01 | Phase 2 | Pending |
| AGNT-02 | Phase 2 | Pending |
| AGNT-03 | Phase 2 | Pending |
| AGNT-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after roadmap creation*
