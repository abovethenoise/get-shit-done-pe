# Phase 5: Documentation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

After review acceptance, a documentation agent reads the actual built code and generates reference docs optimized for future lookup — not a rehash of the spec. Gate docs (constraints, glossary, state) and emergent docs (error taxonomy, change protocol, dependencies) are out of scope for this agent — they are human-maintained or grow organically.

</domain>

<decisions>
## Implementation Decisions

### Doc structure & depth
- Two documentation layers: module index (navigation, lightweight) and flow narratives (primary docs, where the value lives)
- Function-level reference stays in the code itself (types, naming)
- Flow narrative template per flow: Trigger → Input → Steps → Output → Side effects
- Each flow gets an ASCII diagram first (visual overview), then structured steps with module ownership, then side effects
- Docs capture "what it does" primarily, with non-obvious "why" decisions as inline rationale (WHY blocks)
- Doc agent scope: post-review only (flow narratives + module index). Gate/emergent docs are separate concerns

### Directory structure
```
.documentation/
  modules/              ← flat, 1:1 with code, AI agent primary lookup
    reader.md
    parser.md
  flows/                ← capability-grouped, cross-module narratives
    hand-import/
      import-flow.md
    planning/
      validate-flow.md
```
Gate (`gate/`) and emergent (`emergent/`) directories exist in the full structure but are not managed by Phase 5's doc agent.

### Heading templates (strict, for grep consistency)
Module docs: `## Module: <exact_code_name>`, `## Purpose:`, `## Exports:`, `## Depends-on:`, `## Constraints:`, `## WHY:` (only if non-obvious)
Flow docs: `## Flow: <capability>/<flow_name>`, `## Trigger:`, `## Input:`, `## Steps:`, `## Output:`, `## Side-effects:`, `## WHY:` (inline per step, only when needed)

### Cross-referencing
- One-way: flows reference modules in Steps. Modules don't link back to flows.
- Flow steps reference modules by name, not individual functions (e.g., "parser → extracts actions" not "parser.parseHand()")

### Input contract
Agent reads three sources to answer different lookup questions:
- **Code** → "what does this do" (module docs, flow steps)
- **Review findings** → "why is it this way" (WHY blocks, rationale)
- **Requirements (FEATURE.md)** → "what was it supposed to do" (intent tracing)

### Discovery scope
1. **Primary (always):** files directly modified in the reviewed change — new modules, modified modules
2. **Impact discovery (one hop):** grep existing flow docs for references to modified modules — flag for review, don't auto-rewrite
3. **Never:** full codebase scan or unrelated modules

### Update strategy
Section-level ownership model:
- `[derived]` sections → regenerated from code + reviews, overwrite freely (Purpose, Exports, Depends-on)
- `[authored]` sections → written with intent, preserve and flag conflicts (Constraints, WHY)
- Agent parses existing doc by heading anchors, regenerates derived sections, preserves authored sections, flags conflicts

### Impact handling
Impacted flow docs (one-hop discovery) are flagged only — not auto-rewritten. Agent outputs a list of affected flow docs with what changed.

### Trigger model
Doc agent triggers automatically after review acceptance — final pipeline stage: execute → review → accept → document.

### Review gate
Agent presents generated docs for user Q&A review (same pattern as plan-phase and review-phase). User approves before commit.

### Self-validation (3-pass)
**Pass 1 — Structural compliance:** required headings present, ownership tags on every section, anchors match canonical format, last-verified timestamp updated. Catches malformed docs that break grep.
**Pass 2 — Referential integrity:** module names match real code artifacts, listed exports actually exist, dependency references resolve, flow step module references match docs/modules/ filenames. Catches hallucinated references.
**Pass 3 — Consistency with gate docs:** domain terms match glossary spellings, no banned patterns from constraints.md in examples, state references match state.md entries. Catches naming drift and constraint violations.

### Claude's Discretion
- ASCII diagram style and complexity per flow
- Exact wording of Purpose and Exports sections
- How to present impact flags to user during Q&A review

</decisions>

<specifics>
## Specific Ideas

- Flow doc example pattern provided by user:
```
## Flow: Hand Import

PT4 DB → reader → parser → transform → DuckDB
           │                   │
           └── validation ─────┘

### Steps
1. reader    → connects to PT4 Postgres, pulls raw hand histories
2. parser    → extracts actions, players, amounts from PT4 schema
3. transform → reshapes into action-level analytical model
4. load      → writes to DuckDB

### Side effects
- validation errors logged to error_queue
- import cursor updated in state table
```
- Module-level granularity in flows: reference modules, not functions
- Ownership tags `[derived]`/`[authored]` per section — not per heading convention but explicit markers

</specifics>

<deferred>
## Deferred Ideas

- Gate docs (constraints, glossary, state inventory) — human-maintained, not part of this agent
- Emergent docs (error taxonomy, change protocol, dependency manifest) — grow with project, not generated by agent
- On-demand doc regeneration command — possible future enhancement

</deferred>

---

*Phase: 05-documentation*
*Context gathered: 2026-02-28*
