---
phase: 1
name: Foundation
gathered: 2026-02-28
status: Ready for planning
---

# Phase 1: Foundation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

The structural backbone exists — directory hierarchy, templates, CLI tooling, YAML parsing, and requirement format are in place so all downstream agents and workflows have stable schemas to read and write. This phase delivers the file system conventions, artifact templates, CLI commands, and REQ ID scheme that every other phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Directory Layout
- Capabilities are flat (no domain grouping) — `.planning/capabilities/auth/`, `.planning/capabilities/feed/`
- Domain grouping was considered and rejected — unnecessary nesting, KISS
- Features live under a `features/` subdirectory within each capability
- Features use slug-only naming (no numbering) — ordering tracked in metadata
- Capability-level artifacts: CAPABILITY.md, RESEARCH.md, PLAN.md
- Feature-level artifacts: FEATURE.md, RESEARCH.md, PLAN.md, REVIEW.md, DECISIONS.md
- Global files (STATE.md, PROJECT.md, REQUIREMENTS.md) stay at `.planning/` root
- No ROADMAP.md — the capability/feature directory structure IS the roadmap, STATE.md handles ordering and status

### Full Directory Structure
```
.planning/
├── STATE.md
├── PROJECT.md
├── REQUIREMENTS.md
└── capabilities/
    └── auth/
        ├── CAPABILITY.md
        ├── RESEARCH.md        ← cross-cutting research
        ├── PLAN.md            ← feature sequencing, dependency graph
        └── features/
            └── login/
                ├── FEATURE.md
                ├── RESEARCH.md
                ├── PLAN.md
                ├── REVIEW.md
                └── DECISIONS.md

.documentation/
└── auth/
    ├── design.md
    ├── features.md
    └── lessons.md
```

### Template Design — CAPABILITY.md
- Goal — one sentence, what this delivers to the user
- Domain Model — shared entities, relationships, vocabulary
- Invariants — rules that apply across ALL features in this capability
- Boundaries — what this owns vs. consumes vs. explicitly doesn't touch
- Architecture Spine — data flow, layer ownership, where logic lives
- Dependencies — cross-capability (consumes/produces)
- Features[] — list + status (planning/building/complete)
- Decisions Log — captured context, tradeoffs, "we chose X because Y"

### 3-Layer Requirement Format
Each feature defines requirements across three layers. Each layer has structured fields (not freeform).

**Layer 1 — End-User (EU-xx):** What the user experiences
- Story: As a [who], I want [what], so that [why]
- Acceptance Criteria: checklist of observable outcomes
- Out of Scope: what this feature explicitly does NOT do

**Layer 2 — Functional (FN-xx):** Contract-style behavior spec
- Receives: inputs, triggers, data the feature consumes
- Returns: outputs, side effects, data the feature produces
- Behavior: rules, logic, edge cases, error conditions

**Layer 3 — Technical (TC-xx):** Implementation context
- Intent: why this approach (not just what)
- Upstream: what feeds into this feature
- Downstream: what consumes this feature's output
- Constraints: hard limits (language, libs, patterns, perf)
- Example: concrete illustration of the spec in action

### Template Design — FEATURE.md
- Trace Table at the TOP — agents read this first
- End-User Requirements (EU layer)
- Functional Requirements (FN layer)
- Technical Specs (TC layer)
- Decisions/Notes section at bottom

### Template Design — REVIEW.md
- Summary: Verdict (PASS/PARTIAL/FAIL/BLOCKED), pass/partial/fail counts
- Per-Requirement Trace: Each REQ gets verdict + multi-dimensional evidence (code, domain, integration) + gap analysis + fix scope + blocking assessment
- Reviewer Notes: Domain reviewer, code reviewer, integration reviewer — captures concerns not tied to specific REQs (pattern issues, invariant breaches, cross-boundary problems)

### Two-Tier Planning
Feature execution order lives in the capability-level PLAN.md, not in filenames or STATE.md.

**Capability PLAN.md** — sequencing:
- Build sequence (ordered list of features)
- Dependency graph (what blocks what)
- Phasing rationale (why this order)

**Feature PLAN.md** — implementation:
- REQ-level tasks and steps
- How to build THIS feature
- References specific EU/FN/TC requirement IDs

### YAML Frontmatter
- ALL .md artifacts get YAML frontmatter — both .planning/ and .documentation/ files
- Machine-readable metadata for consistent parsing and tooling

### CLI Command UX
- Slash commands with `/gsd:` prefix — same pattern as v1
- Flat verb naming: `/gsd:new-capability`, `/gsd:new-feature`, `/gsd:list-capabilities` — better autocomplete discoverability
- Args-first with interactive fallback — pass name/domain via args, prompt only when ambiguous

### REQ ID Scheme
- Capability-scoped: IDs unique within a capability, not globally
- Layer-only prefix: EU-01, FN-03, TC-02 — feature context is implicit from directory location
- Cross-capability references use capability prefix
- Traceability table lives at TOP of FEATURE.md — agents read it first
- CLI-maintained trace updates — centralized logic in gsd-tools.cjs, agents call trace command to report

### Documentation Structure
- One subdirectory per capability in `.documentation/`
- Three files: design.md, features.md, lessons.md
- Purpose: serve future AI agents doing research — token-efficient, mgrep-searchable
- Optimized for the four framings: new, extend, debug, refactor
- Written in parallel where information is available
- YAML frontmatter on all doc files

### Claude's Discretion
- Output formatting per CLI command (structured text vs minimal)
- js-yaml implementation details
- STATE.md internal field structure
- YAML frontmatter field selection per artifact type
- DECISIONS.md entry format

</decisions>

<specifics>
## Specific Ideas

- Review structure inspired by real poker analytics domain: evidence dimensions include code correctness, domain logic correctness, and integration correctness
- DECISIONS.md is append-only — captures decisions from every pipeline stage plus ad-hoc decisions ("Slack at 11pm")
- Documentation optimized for AI consumption: "if we were to roleplay creating a new feature that depended on what we just created, extended a feature, debugged a feature or capability, needed to refactor — the documentation should give future AI developers what they need"
- Code quality reviewer role merges into broader architecture review (DRY/KISS is a lens, not a separate trace) — noted for Phase 4

</specifics>

<deferred>
## Deferred Ideas

- Reviewer role restructuring (3 reviewers: domain, code, integration instead of 4) — Phase 4
- Documentation agent timing and parallel optimization — Phase 5
- Migration commands from v1 artifacts — v2 requirements (MIGR-01, MIGR-02)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-28*
