---
type: discovery-brief
capability: "pipeline-execution"
primary_lens: "refactor"
secondary_lens: "debug"
completion: "mvu_met"
created: "2026-03-05"
---

# Discovery Brief: pipeline-execution (refactor)

## Problem Statement

Review, doc, and progress stages are hard-coded to feature scope. The pipeline should be scope-fluid: review and doc match whatever was executed — one feature or an entire capability. Currently, running a capability means N redundant review/doc cycles instead of one holistic pass. Progress doesn't understand focus groups. Execute doesn't reliably chain to review. The refactor consolidates without adding lines of code.

## Context

### Existing State

- framing-pipeline.md hard-codes review + doc to run once per feature
- Capability execution = N features x (4 reviewers + 1 synthesizer + 5 explorers + 1 synthesizer)
- Scope-locked synthesizers can't detect cross-feature state conflicts or interface violations
- No code-review vs doc-review ground-truth distinction
- Progress guesses next action from feature state, no focus group awareness
- Execute -> review auto-chain exists in spec but doesn't reliably fire
- Minor review findings get lost in prose, no structured backlog

### Relevant Modules

- `workflows/framing-pipeline.md` — hard-coded feature scope for review/doc (restructure target)
- `workflows/review.md` — scope-locked review (scope-fluid target)
- `workflows/doc.md` — scope-locked doc (scope-fluid target)
- `workflows/execute.md` — auto-chain to review (debug target)
- `workflows/progress-workflow.md` — routing logic (rewrite target)
- `agents/gsd-review-*` — 4 reviewer agents (input expansion, not restructure)
- `agents/gsd-doc-writer` — explorer/synthesizer agent (input expansion, not restructure)
- `agents/gsd-review-synthesizer` — consolidation agent (aggregator framing change)

### Prior Exploration

Previous enhance-lens brief (2026-03-04) covered plan-presentation and doc-writer overhaul. This refactor supersedes doc-writer-overhaul and scope-aware-routing features with a consolidation approach.

## Specification (Refactor)

### Current Design

```
capability-orchestrator.md:
  for each feature in DAG wave order:
    framing-pipeline.md (hard-coded to feature scope):
      research -> requirements -> plan -> execute -> review -> doc
                                                       |         |
                                                  4 reviewers  5 explorers
                                                  1 synthesizer 1 synthesizer
                                                  (locked to feature)

progress-workflow.md:
  read feature state -> branching guess -> suggest action
  no focus awareness, no parallel-safe detection
  suggests "add feature" when should suggest "plan"
```

**Load-bearing walls (preserve):**
- 4-reviewer domain split: enduser, functional, technical, quality
- 5-explorer doc split: code-comments, module-flow, standards, config, friction
- Gather -> synthesize pattern
- Re-review loop with max 2 cycles
- Lens propagation through all stages
- Escalation protocol at stage boundaries

**Organic growth (restructure):**
- Feature-locked scoping was expedient (pipeline built feature-first)
- Progress routing bolted on after focus groups existed
- Execute -> review chain has a wiring bug

### Target Design

**Core concept: execution scope is fluid.** If you execute a feature, review/doc scope is that feature. If you execute a capability (multiple features), review/doc scope is the full capability. The pipeline detects and adapts.

```
Pipeline (scope-fluid):
  research -> requirements -> plan -> execute  (per unit within execution scope)
  THEN once for the entire execution scope:
    review (4 reviewers, 1 synthesizer) -> doc (5 explorers, 1 synthesizer)

Auto-chain model:
  Execute --auto--> Review --human--> [fix if needed] --auto--> Doc --human--> [write if approved]
  Human enters at: findings Q&A (review), approval Q&A (doc).
```

**Code review (spec = ground truth):**
- enduser reviewer: "do EU requirements pass?" (across full execution scope)
- functional reviewer: "do FN contracts hold?" (across full execution scope)
- technical reviewer: "are TC specs implemented?" (across full execution scope)
- quality reviewer: "cross-scope state, interface violations, conflicting assumptions, spec coverage gaps"

**Code aggregator looks for:** cross-scope state conflicts, interface contract violations, conflicting assumptions, spec coverage gaps in implementation

**Doc review (code = ground truth):**
- code-comments explorer: "do comments reflect actual code?"
- module-flow explorer: "is architecture documentation accurate?"
- standards explorer: "is terminology consistent?"
- config explorer: "is CLAUDE.md current?"
- friction explorer: "are there orphaned docs?"

**Doc aggregator looks for:** terminology inconsistency, orphaned docs, update priority order

**Review fix loop (at execution scope):**
- Findings -> user Q&A -> accepted findings -> executor re-runs targeted fixes -> re-review (max 2 cycles)

**Doc write loop (at execution scope):**
- Recommendations -> user Q&A -> approved recommendations -> doc writer agents execute the writes

**Minor findings -> auto-extract to tech-debt backlog file**

**Progress (focus-aware):**
- Read active focus groups + recent completions
- Understand next step per focus
- Detect parallel-safe work across focuses
- If ambiguous -> ask user which focus to advance
- If clear -> present concrete commands
- Never suggest "add feature" when planning is the next step

### Migration Risk

| What Breaks | Mitigation |
|---|---|
| framing-pipeline scope assumption | Replace hard-coded feature scope with execution-scope detection |
| review.md input model | Agents are generic — pass execution-scope artifact list instead of single-feature list |
| doc.md input model | Same — execution-scope artifact list |
| Re-review feedback loop | Operates at execution scope; targeted fixes still address specific plans/features within scope |
| progress-workflow routing logic | Focus-aware rewrite replaces guess-based routing |
| Execute -> review chain | Debug the wiring (conditional path exits early) |

### Behavioral Invariants

1. Every requirement still gets traced by a reviewer (scope doesn't change traceability)
2. Every reviewer domain (enduser, functional, technical, quality) operates independently
3. Re-review loop: max 2 cycles, at execution scope
4. User still approves/defers/dismisses each finding
5. Doc explorers still cover all 5 focus areas
6. Doc writers still execute approved writes
7. Lens propagation still shapes review + doc behavior
8. Escalation protocol still applies at stage boundaries
9. Execute -> review -> doc auto-chains (human only at findings Q&A and doc approval)

## Unknowns

### Assumptions

- Reviewer agents can handle multi-feature artifact lists without context overflow
- Scope-fluid review doesn't degrade per-requirement traceability
- Focus group data in ROADMAP.md is sufficient for progress routing
- Execute -> review chain failure is a conditional bug, not a design gap

### Open Questions

- What is the exact wiring bug preventing execute -> review auto-chain?
- Does the tech-debt backlog file need a schema or is it freeform markdown?
- Should progress live in pipeline-execution or command-surface?

## Scope Boundary

### In

- Scope-fluid review (matches execution scope, not hard-coded to feature)
- Scope-fluid doc (matches execution scope)
- Code-review vs doc-review ground-truth distinction in aggregators
- Tech-debt backlog auto-extraction from minor findings
- Progress focus-aware routing rewrite
- Execute -> review auto-chain fix
- Re-review and doc-write loops at execution scope
- Auto-chain: execute -> review -> doc with human only at Q&A gates

### Out

- Research stage (unchanged)
- Requirements stage (unchanged)
- Plan stage (unchanged)
- Execute stage internals (unchanged, only the handoff)
- Adding lines of code — this is consolidation

### Follow-ups

- Whether doc-review should be a separate stage vs part of the doc stage
- Whether progress should live in pipeline-execution or command-surface
- Plan presentation overhaul (from prior enhance brief, not in this refactor scope)
