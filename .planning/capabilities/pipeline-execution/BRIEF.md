---
type: discovery-brief
capability: "pipeline-execution"
primary_lens: "enhance"
secondary_lens: ""
completion: "mvu_met"
created: "2026-03-04"
---

# Discovery Brief: pipeline-execution

## Problem Statement

The pipeline's plan-to-user presentation layer gives flat table summaries without justification or interactive discussion, and the doc-writer stage lacks a standalone entry point (`/gsd:doc`) and doesn't follow the gather->synthesize pattern used by research.

## Context

### Existing State

- Plan checkpoint shows flat tables + "approve?" with no justification of ordering, approach, or requirement coverage
- Self-critique fixes are mentioned opaquely ("fixed 4 issues") without showing what changed or why
- Q&A gate is skipped when no "unresolved findings" — user never gets interactive deep-dive opportunity
- Doc-writer is a single-agent writer, no parallel exploration, no standalone entry point
- Doc-writer only covers code comments and .documentation updates

### Relevant Modules

- `get-shit-done/workflows/plan.md` — plan checkpoint presentation (primary fix target)
- `get-shit-done/workflows/doc.md` — doc-writer workflow (restructure target)
- `get-shit-done/agents/gsd-doc-writer` — doc-writer agent definition
- `get-shit-done/references/ui-brand.md` — visual patterns for output

### Prior Exploration

Real-world example: planner acknowledged 4 self-fixes, skipped Q&A ("No unresolved findings"), presented flat tables, asked for blanket approval. No rationale for plan ordering, approach decisions, or key tradeoffs visible to user.

## Specification (Enhance)

### Current Behavior

1. Plan checkpoint presents flat tables (wave/plan/objective, REQ traceability) with "approve?" prompt
2. Self-critique mentions fix count but not content — user sees "fixed 4 issues" with no detail
3. Q&A step is skipped when plan-checker finds no "unresolved findings"
4. No justification for plan ordering, approach simplicity, or requirement coverage strategy
5. Doc-writer is a single agent that writes documentation directly — no parallel exploration
6. Doc-writer has no standalone entry point — only runs as part of the pipeline
7. Doc-writer scope limited to code comments and .documentation directory

### Desired Behavior

1. **Plan presentation with 3 layers:**
   - **Justification narrative** — why this order, why these tasks, why this approach meets requirements with minimal complexity per engineering principles
   - **Surfaced decisions** — each self-critique fix shown with what/why rationale; research ambiguities flagged for user input
   - **Interactive deep-dive** — AskUserQuestion with key plan areas as choices before final approval (always offered, never skipped)
2. **Visual plan output** — ASCII/markdown flows to illustrate plan architecture alongside tables
3. **Doc-writer restructured to gather->synthesize:**
   - Parallel explorers by focus area (like research gatherers)
   - Synthesizer produces documentation recommendations
4. **Doc-writer recommendations cover:** code comment updates, .documentation updates, new standards or decisions, relevant project or sub CLAUDE.md fixes, hooks or skills that could reduce friction
5. **`/gsd:doc` skill** — standalone entry point for doc-writer so it can be invoked outside the pipeline

### Delta

| Change | Seam |
|--------|------|
| Justification narrative | Plan checkpoint step — add narrative block before tables |
| Surfaced decisions | Plan checkpoint step — show self-critique detail, flag research ambiguities |
| Interactive Q&A | Plan checkpoint step — always offer AskUserQuestion with key areas, never skip |
| Visual flows | Plan checkpoint step — add ASCII/markdown architecture illustration |
| Doc-writer gather->synthesize | doc.md workflow — restructure from single-agent to parallel explorers + synthesizer |
| `/gsd:doc` skill | New skill entry point invoking doc-writer workflow standalone |
| Expanded doc scope | Doc-writer focus areas — add standards, decisions, CLAUDE.md, hooks/skills |

### Invariants

1. PLAN.md artifact format unchanged
2. Plan-checker validation logic unchanged
3. Planner agent planning logic unchanged
4. Other pipeline stages unaffected (spot-check recommended)

## Unknowns

### Assumptions

- Justification narrative can be generated from data already available at checkpoint time (planner output, checker results, research findings)
- Doc-writer focus areas map cleanly to parallel explorer agents
- Existing gather->synthesize pattern from research is reusable for doc-writer

### Open Questions

- Exact format of justification narrative — research should propose
- How many doc-writer explorer agents and what focus areas specifically
- Whether doc-writer needs its own synthesizer agent or reuses existing pattern
- What's the right scope for `/gsd:doc` — just the doc-writer stage, or the full doc workflow?

## Scope Boundary

### In

- Plan presentation overhaul (3 layers + visual flows)
- Doc-writer gather->synthesize restructure
- `/gsd:doc` standalone skill entry point
- Expanded doc-writer recommendation scope

### Out

- Changing PLAN.md artifact format
- Changing planner planning logic
- Changing plan-checker validation logic
- Adding new pipeline stages

### Follow-ups

- Consider if review stage presentation needs similar justification treatment
- Consider if execute stage's progress output could benefit from richer presentation
- Evaluate whether other pipeline stages need standalone entry points
