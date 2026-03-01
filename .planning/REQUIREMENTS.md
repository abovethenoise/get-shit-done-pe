# Requirements: GSD v2

**Defined:** 2026-02-28
**Core Value:** Every piece of executed work traces back to a specific requirement, and every requirement is verified against the actual code.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: Capability/Feature directory structure replaces milestone/phase in .planning/
- [x] **FOUND-02**: STATE.md tracks current capability, current feature, and cross-feature state
- [x] **FOUND-03**: js-yaml@4.1.1 replaces hand-rolled frontmatter parser for 3-layer requirement nesting
- [x] **FOUND-04**: CLI commands for capability lifecycle (create, list, status)
- [x] **FOUND-05**: CLI commands for feature lifecycle (create, list, status)
- [x] **FOUND-06**: Templates updated for all new artifact types (CAPABILITY.md, FEATURE.md, REVIEW.md, DOCS.md)
- [x] **FOUND-07**: Existing bloat, dead features, and artifacts that don't fit the new model are removed

### Requirements System

- [x] **REQS-01**: 3-layer requirement format per feature: end-user (story + acceptance), functional (behavior spec), technical (implementation spec)
- [x] **REQS-02**: REQ ID scheme namespaced per layer (EU-xx, FN-xx, TC-xx) within each feature
- [x] **REQS-03**: Zero-orphan-task enforcement — every plan task must reference at least one REQ ID
- [x] **REQS-04**: Traceability table mapping every REQ ID through plan → execution → review → documentation

### Project Initialization

- [x] **INIT-01**: New-project mode: Q&A about goals, tech stack opinions, architecture approach → maps out capabilities (stops at capability level)
- [x] **INIT-02**: Existing-project mode: understands goals + opinions → parallel research discovers existing capabilities/features → Q&A to confirm/adjust → identify new capabilities/features/improvements
- [x] **INIT-03**: Discuss-capability command builds out features from a mapped capability

### Workflows

- [x] **WKFL-01**: Four framing commands as entry points: debug, new, enhance, refactor
- [x] **WKFL-02**: Debug framing discovery: observe current state → compare to expected → hypothesize → root cause → converge to pipeline
- [x] **WKFL-03**: New framing discovery: explore → brainstorm → converge to pipeline
- [x] **WKFL-04**: Enhance framing discovery: assess what's working → identify what needs improvement → align → converge to pipeline
- [x] **WKFL-05**: Refactor framing discovery: reason for change → explore options → converge to pipeline
- [x] **WKFL-06**: All framings converge to same artifact pipeline: requirements → plan → execute → review → documentation
- [x] **WKFL-07**: Framing context injection: same agents receive different question sets based on active framing

### Planning

- [x] **PLAN-01**: Planner drafts plan with tasks referencing REQ IDs across all 3 requirement layers
- [x] **PLAN-02**: System self-critique challenges draft on: requirement coverage, approach validity, execution feasibility, and surfaces assumptions needing human guidance
- [x] **PLAN-03**: Self-critique findings presented to user as Q&A — user provides feedback/guidance before finalization
- [x] **PLAN-04**: Plan finalized only after user confirms — no auto-finalize

### Review

- [x] **REVW-01**: 4 parallel specialist reviewers: end-user, functional, technical, code quality
- [x] **REVW-02**: Each reviewer produces trace report: per-requirement verdict (met / not met / regression)
- [x] **REVW-03**: End-user reviewer traces against story + acceptance criteria
- [x] **REVW-04**: Functional reviewer traces against behavior specs
- [x] **REVW-05**: Technical reviewer traces against implementation specs
- [x] **REVW-06**: Code quality reviewer traces for DRY, KISS, no over-complexity, no bloat, no obsolete code
- [x] **REVW-07**: Synthesizer consolidates 4 trace reports, verifies findings, resolves conflicts (priority: user > functional > technical > quality)
- [x] **REVW-08**: Synthesized recommendations presented to user for decision

### Documentation

- [x] **DOCS-01**: Reflect-and-write agent reads actual built code after review acceptance
- [x] **DOCS-02**: .documentation/ directory contains final-state reference docs per capability/feature
- [x] **DOCS-03**: Documentation optimized for quick lookups and mgrep searches during future research/planning

### Research

- [x] **RSRCH-01**: Research rooted in first-principles thinking: identify fundamental truths/constraints, challenge assumptions, reason from constraints upward
- [x] **RSRCH-02**: Research bridges from "what is true" to "how this applies to our specific goals and requirements"
- [x] **RSRCH-03**: Parallelized gather → synthesize pattern (multiple researchers, one synthesizer)
- [x] **RSRCH-04**: Research agents use mgrep for efficient codebase/file search
- [x] **RSRCH-05**: Research agents use Brave Search / WebSearch for domain knowledge and ecosystem patterns
- [x] **RSRCH-06**: Research agents use Context7 for library-specific documentation lookup

### Agents

- [x] **AGNT-01**: Agent definitions are goal-driven with artifact awareness (know what files to read/write and how they fit the pipeline)
- [x] **AGNT-02**: Layered context: core (project + capability) always present, framing-specific context added on top
- [x] **AGNT-03**: Framing changes the questions agents ask, not the agent definition itself
- [x] **AGNT-04**: Agent prompts are constrained to prevent scope hallucination and generic output

## v2.0 Requirements

Requirements for Install-Ready Launch milestone. Each maps to roadmap phases.

### Install & Deploy

- [ ] **INST-01**: All v2 commands, workflows, agents, templates, references deploy via `npm install -g`
- [ ] **INST-02**: Source files use `{GSD_ROOT}` path references — install.js resolves at install time (no hardcoded absolute paths)
- [ ] **INST-03**: All v2 files follow `gsd-*` prefix convention (commands: `gsd-*.md`, agents: `gsd-*.md`, hooks: `gsd-*.js`)
- [ ] **INST-04**: v2 files placed in correct install.js directories: `commands/gsd/`, `agents/`, `get-shit-done/` (workflows/references/templates)
- [ ] **INST-05**: `install.js` stripped to Claude Code only (remove Codex/Gemini/OpenCode adapters and runtime conversions)
- [ ] **INST-06**: `install.js`: remove patch backup system (`gsd-local-patches/`), manifest (`gsd-file-manifest.json`), changelog/version metadata
- [ ] **INST-07**: Default `config.json` ships with package
- [ ] **INST-08**: Framings directory (anchor questions) deployed via install path

### Command Surface

- [ ] **CMD-01**: 11-command surface works end-to-end: init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review
- [x] **CMD-02**: 26 unused commands removed (phase management, milestone lifecycle, utilities)
- [ ] **CMD-03**: Every surviving command fires without error (full command audit)

### Cleanup

- [x] **CLN-01**: 20 orphaned workflows removed
- [x] **CLN-02**: Orphaned agents removed (gsd-codebase-mapper, etc.)
- [x] **CLN-03**: `gsd-tools.cjs`: full audit — verify all modules, remove dead code, remove v1-only concepts (milestone, phase CLI commands)
- [x] **CLN-04**: Holistic template audit — remove stale templates, update surviving ones for v2 model (capability/feature, not phase)
- [x] **CLN-05**: Holistic reference audit — remove unused references, verify v2 accuracy
- [x] **CLN-06**: Remove orphaned hook: `gsd-check-update.js` (update check dropped per decision)
- [x] **CLN-07**: Remove VERSION, CHANGELOG.md, `package.json` `"type": "commonjs"` enforcement if no longer needed

### Integration

- [x] **INTG-01**: 6 research gatherers wired into framing pipeline (currently orphaned from surviving command chain)
- [x] **INTG-02**: Hooks: keep context monitor + statusline, drop update check, audit remaining hooks for v2 effectiveness
- [x] **INTG-03**: All `@file` references in commands/workflows/agents resolve to files that actually exist post-cleanup

### Directory & Structure

- [x] **DIR-01**: New projects use `.planning/capabilities/` directory structure (no `phases/` directory)
- [x] **DIR-02**: `.documentation/` directory structure deployed: `architecture.md`, `domain.md`, `mapping.md`, `capabilities/`, `decisions/`
- [x] **DIR-03**: All v2 path references use capability/feature model, not phase model

### Validation

- [ ] **VAL-01**: Smoke test: `npm install -g`, run `/init` on fresh repo, verify project setup
- [ ] **VAL-02**: Smoke test: run framing commands (`/debug`, `/new`, `/enhance`, `/refactor`), verify discovery → pipeline flow
- [ ] **VAL-03**: Smoke test: run on existing project, verify `/init` auto-detect works

## Future Requirements

Deferred to post-v2.0. Tracked but not in current roadmap.

### Migration

- **MIGR-01**: `gsd migrate` command converts v1 .planning/ artifacts to v2 structure
- **MIGR-02**: Migration guide documenting v1 → v2 artifact mapping

### Multi-Runtime

- **MRUN-01**: Codex adapter support for install.js
- **MRUN-02**: Gemini adapter support for install.js
- **MRUN-03**: OpenCode adapter support for install.js

### Enhancements

- **ENH-01**: Framing-aware context injection with examples and anti-patterns per work type
- **ENH-02**: Extended STATE.md fields for cross-feature dependencies and blocked capabilities

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-AI-runtime support (Codex/Gemini/OpenCode) | Claude Code only for v2.0, port later |
| New features or capabilities | Deploy what was designed, don't redesign |
| Publishing to npm | Personal tooling first |
| Backward compatibility with v1 GSD artifacts | Clean break |
| User patch backup/reapply system | Removed — overcomplication for personal tooling |
| Auto-advance through stages | Removes user from control loop; compounds errors silently |
| Real-time collaboration | Framework is single-user, single-project by design |
| AI-generated test suites in orchestrator | Tests belong in executor domain, not orchestrator |
| Vector database / embeddings for context | STATE.md discipline beats non-deterministic retrieval |
| Dashboard / progress visualization UI | Terminal-native; /gsd:progress covers this |
| LLM-judged requirement quality scoring | Circular — AI grading its own inputs; structural validation instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| FOUND-07 | Phase 7 | Complete |
| REQS-01 | Phase 1 | Complete |
| REQS-02 | Phase 1 | Complete |
| REQS-03 | Phase 3 | Complete |
| REQS-04 | Phase 3 | Complete |
| INIT-01 | Phase 6 | Complete |
| INIT-02 | Phase 6 | Complete |
| INIT-03 | Phase 6 | Complete |
| WKFL-01 | Phase 6 | Complete |
| WKFL-02 | Phase 6 | Complete |
| WKFL-03 | Phase 6 | Complete |
| WKFL-04 | Phase 6 | Complete |
| WKFL-05 | Phase 6 | Complete |
| WKFL-06 | Phase 6 | Complete |
| WKFL-07 | Phase 6 | Complete |
| PLAN-01 | Phase 3 | Complete |
| PLAN-02 | Phase 3 | Complete |
| PLAN-03 | Phase 3 | Complete |
| PLAN-04 | Phase 3 | Complete |
| REVW-01 | Phase 4 | Complete |
| REVW-02 | Phase 4 | Complete |
| REVW-03 | Phase 4 | Complete |
| REVW-04 | Phase 4 | Complete |
| REVW-05 | Phase 4 | Complete |
| REVW-06 | Phase 4 | Complete |
| REVW-07 | Phase 4 | Complete |
| REVW-08 | Phase 4 | Complete |
| DOCS-01 | Phase 5 | Complete |
| DOCS-02 | Phase 5 | Complete |
| DOCS-03 | Phase 5 | Complete |
| RSRCH-01 | Phase 2 | Complete |
| RSRCH-02 | Phase 2 | Complete |
| RSRCH-03 | Phase 2 | Complete |
| RSRCH-04 | Phase 2 | Complete |
| RSRCH-05 | Phase 2 | Complete |
| RSRCH-06 | Phase 2 | Complete |
| AGNT-01 | Phase 2 | Complete |
| AGNT-02 | Phase 2 | Complete |
| AGNT-03 | Phase 2 | Complete |
| AGNT-04 | Phase 2 | Complete |
| CMD-02 | Phase 8 | Complete |
| CLN-01 | Phase 8 | Complete |
| CLN-02 | Phase 8 | Complete |
| CLN-06 | Phase 8 | Complete |
| CLN-07 | Phase 8 | Complete |
| DIR-01 | Phase 9 | Complete |
| DIR-02 | Phase 9 | Complete |
| DIR-03 | Phase 9 | Complete |
| INTG-01 | Phase 9 | Complete |
| INTG-02 | Phase 9 | Complete |
| CLN-03 | Phase 10 | Complete |
| CLN-04 | Phase 10 | Complete |
| CLN-05 | Phase 10 | Complete |
| INTG-03 | Phase 10 | Complete |
| CMD-03 | Phase 11 | Pending |
| INST-01 | Phase 12 | Pending |
| INST-02 | Phase 12 | Pending |
| INST-03 | Phase 12 | Pending |
| INST-04 | Phase 12 | Pending |
| INST-05 | Phase 12 | Pending |
| INST-06 | Phase 12 | Pending |
| INST-07 | Phase 12 | Pending |
| INST-08 | Phase 12 | Pending |
| CMD-01 | Phase 12 | Pending |
| VAL-01 | Phase 12 | Pending |
| VAL-02 | Phase 12 | Pending |
| VAL-03 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 46 total -- all complete
- v2.0 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-03-01 after v2.0 roadmap rewrite (phases 8-12)*
