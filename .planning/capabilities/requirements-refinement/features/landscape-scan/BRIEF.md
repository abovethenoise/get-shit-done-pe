---
type: discovery-brief
capability: "requirements-refinement/landscape-scan"
primary_lens: "new"
secondary_lens: ""
completion: "mvu_met"
created: "2026-03-05"
---

# Discovery Brief: landscape-scan

## Problem Statement

GSD projects lack a mechanism to analyze cross-capability relationships, conflicts, and dependency gaps — capabilities are discussed in isolation, and misalignments only surface during implementation.

## Context

### Existing State

No cross-capability analysis exists. discuss-capability has lightweight cross-capability awareness (scans for overlaps during per-cap exploration) but does not perform systematic pairwise analysis or produce structured findings.

### Relevant Modules

- `.planning/capabilities/*/CAPABILITY.md` — capability definitions, feature tables, dependencies
- `.documentation/capabilities/*.md` — exploration notes, briefs, requirements
- `.planning/capabilities/*/features/*/FEATURE.md` — feature stubs and specs
- `gsd-tools.cjs capability-list` — existing capability listing CLI

### Prior Exploration

Explored during requirements-refinement capability discussion (2026-03-05). User defined three-layer output model and tiered scaling approach.

## Specification

### Capability Definition

Reads all capability and feature artifacts across the project, performs pairwise semantic analysis using Claude, and produces a three-layer output: relationship matrix, finding cards, and dependency graph.

### Boundaries

**In scope:**
- Reading all artifact types (CAPABILITY.md, FEATURE.md, exploration notes, briefs, requirements)
- Pairwise capability analysis via Claude reasoning
- Three-layer output generation (relationship matrix, finding cards, dependency graph)
- Tiered scaling strategy (small/medium/large projects)
- mgrep pre-filtering for medium/large projects

**Out of scope:**
- Q&A with the user (that's refinement-qa)
- Applying changes to artifacts (that's change-application)
- Persisting the report across runs (that's refinement-artifact)

### Constraints

- **No external ML dependencies** — Claude reasoning only for semantic analysis
- **mgrep for pre-filtering** at scale, not for the analysis itself
- **Tiered approach:**
  - Small (<20 caps): full pairwise scan
  - Medium (20-50): mgrep pre-filter to top-K pairs per capability
  - Large (50+): cluster by domain/layer, scan within clusters + boundaries

### Success Criteria

1. Produces a **relationship matrix** showing relationship type (DEPENDS_ON, CONFLICT, GAP, etc.) and confidence for each capability pair
2. Produces **finding cards** with type, severity, affected capabilities, doc sources (file:line), summary, and recommendation
3. Produces a **dependency graph** distinguishing explicit vs implicit vs gap dependencies
4. Scales without sending every pair to Claude for projects with 20+ capabilities

## Unknowns

### Assumptions

- All capability/feature artifacts follow standard GSD file formats (parseable frontmatter + markdown sections)
- Claude can reliably identify semantic conflicts and dependency relationships from spec text alone
- Relationship types can be categorized into a fixed taxonomy (DEPENDS_ON, CONFLICT, GAP, OVERLAP, etc.)

### Open Questions

- What is the exact taxonomy of relationship types? (DEPENDS_ON, CONFLICT, GAP, OVERLAP — any others?)
- How should confidence scores be calibrated? Numeric (0-1) or categorical (HIGH/MEDIUM/LOW)?
- Should feature-level pairwise analysis also be performed, or only capability-level?

## Scope Boundary

### In

- Read all cap/feature artifacts
- Pairwise Claude analysis of capability pairs
- Three-layer structured output
- Scale-tier detection and filtering

### Out

- User interaction / Q&A (refinement-qa feature)
- Applying changes to files (change-application feature)
- Report persistence across runs (refinement-artifact feature)
- Feature-to-feature pairwise analysis (potential follow-up)

### Follow-ups

- Feature-level cross-analysis (within and across capabilities)
- Historical diff between refinement runs ("what changed since last scan")
- Integration with focus group creation (auto-suggest focus groups from clusters)
