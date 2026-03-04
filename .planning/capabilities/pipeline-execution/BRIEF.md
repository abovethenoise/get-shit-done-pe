---
type: discovery-brief
capability: "pipeline-execution"
primary_lens: "enhance"
secondary_lens: "debug"
completion: "mvu_met"
created: "2026-03-04"
---

# Discovery Brief: pipeline-execution

## Problem Statement

The plan workflow's research step uses ambiguous delegation that causes the model to skip or shortcut the 6-gatherer parallel spawn, has unnecessary skip gates, and uses a binary research-reuse check that ignores whether existing research covers the current lens.

## Context

### Existing State

- `plan.md` Step 5 uses "Invoke @research-workflow.md" while Step 7 uses explicit `Task()` pseudo-code for the planner
- `framing-pipeline.md` Stage 1 also calls research-workflow.md (same pattern, likely same issue)
- Research has `--skip-research`, `research_enabled`, and `has_research` gates
- The model admitted the indirection caused it to take shortcuts — delegating to primary-collaborator or spawning only one agent instead of orchestrating the 6 parallel gatherers
- Binary `has_research` check doesn't account for lens changes (e.g., existing research from /new doesn't cover /enhance needs)

### Relevant Modules

- `get-shit-done/workflows/plan.md` — primary fix target (Step 5 research delegation + skip gates)
- `get-shit-done/workflows/framing-pipeline.md` — secondary fix target (Stage 1 research call)
- `get-shit-done/workflows/research-workflow.md` — stays as-is unless research says otherwise
- `get-shit-done/workflows/gather-synthesize.md` — stays as-is (invariant)
- All other `workflows/*.md` files — audit targets for same anti-pattern

### Prior Exploration

User transcript from previous session documenting the failure mode: model self-diagnosed that "Invoke @workflow.md" indirection is ambiguous — could mean "delegate" or "read and execute yourself." Step 7's explicit `Task()` block left no room for misinterpretation; Step 5's indirection did.

## Specification (Enhance)

### Current Behavior

1. plan.md Step 5 says "Invoke @research-workflow.md with params" — one level of indirection
2. plan.md has three research gates: `--skip-research` flag, `research_enabled` config, `has_research` binary check
3. Other workflow callers likely use the same "Invoke @" pattern
4. The model reads "Invoke" as ambiguous — delegates instead of orchestrating
5. `has_research` is a binary file-existence check that doesn't consider lens context

### Desired Behavior

1. All research callers use an unambiguous delegation pattern that results in the model actually spawning the 6 gatherers in parallel
2. Research is mandatory — no skip gates exist
3. Research reuse is lens-aware — existing research is evaluated against current lens needs, not just file existence
4. All workflows audited for similar ambiguous delegation patterns and fixed

### Delta

| Change | What |
|--------|------|
| Remove skip gates | `--skip-research` and `research_enabled` gates removed entirely |
| Smarter research reuse | Replace binary `has_research` check with lens-aware logic. Approach TBD by research — options include: (a) single Q&A asking user, (b) automatic lens comparison, (c) hybrid |
| Fix ambiguous delegation | Workflows that call research don't result in actual gatherer spawns — the delegation pattern must be unambiguous enough that the model orchestrates correctly. `Task()` pseudo-code is the leading hypothesis but needs validation. |
| Audit all workflows | Scan all `workflows/*.md` for similar ambiguous delegation patterns; fix all instances found |

### Invariants

1. research-workflow.md content/structure unchanged (unless research shows it should change)
2. gather-synthesize.md pattern unchanged
3. 6 gatherer agent definitions unchanged
4. Planner step (Step 7 in plan.md) unchanged
5. RESEARCH.md output format unchanged

## Unknowns

### Assumptions

- framing-pipeline.md has the same indirection issue (needs verification during research)
- The "Invoke @" pattern is the root cause across all affected workflows
- Explicit `Task()` pseudo-code will fix the ambiguity (hypothesis, not confirmed)

### Open Questions

- What is the right delegation pattern? `Task()` pseudo-code is the leading hypothesis. Research should validate.
- How many other workflows use ambiguous delegation?
- Should research-workflow.md be restructured, or is fixing the calling pattern sufficient?
- What's the right lens-aware research reuse logic? User prompt? Automatic comparison? Hybrid?

## Scope Boundary

### In

- Remove research skip gates from plan.md
- Replace ambiguous delegation with unambiguous pattern in plan.md
- Fix all other research-workflow.md callers
- Implement lens-aware research reuse logic
- Codebase-wide audit of all workflows for the same anti-pattern
- Fix all instances found

### Out

- Changing the 6 gatherer agent definitions or behavior
- Changing gather-synthesize.md pattern
- Changing RESEARCH.md output format
- Adding new gatherer types

### Follow-ups

- Consider whether research-workflow.md should become pure reference documentation if callers now have explicit spawn instructions
- Evaluate if any other instruction patterns besides "Invoke @" cause similar model shortcutting
- Consider if the same issue exists in non-workflow files (agent definitions, skill definitions)
