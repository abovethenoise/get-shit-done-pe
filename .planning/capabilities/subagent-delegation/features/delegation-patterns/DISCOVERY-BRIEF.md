---
type: discovery-brief
capability: "Subagent Delegation / delegation-patterns"
primary_lens: "enhance"
secondary_lens: ""
completion: "mvu_met"
created: "2026-03-07"
---

# Discovery Brief: delegation-patterns

## Problem Statement

Three separate delegation reference docs (gather-synthesize.md, model-profiles.md, model-profile-resolution.md) create context noise that causes the AI orchestrator to ignore delegation instructions entirely, resulting in 0% Sonnet usage despite correct `model="sonnet"` specifications in workflow files.

## Context

### Existing State

Three reference docs govern delegation today:
- `references/model-profiles.md` — Role-based model map (executor=sonnet, judge=inherit, quick=haiku), v1/v2 resolution, per-agent overrides
- `references/model-profile-resolution.md` — Resolution logic (`resolveModelFromRole()` flow, v1 fallback)
- `workflows/gather-synthesize.md` — Reusable gather-synthesize pattern with context assembly, failure handling, and synthesis phases

Workflows (plan.md, review.md, doc.md, execute.md) inline Task() blocks with `model="sonnet"` and `model="inherit"` but the orchestrator ignores them, handling work inline instead of spawning subagents.

### Relevant Modules

- `get-shit-done/references/model-profiles.md`
- `get-shit-done/references/model-profile-resolution.md`
- `get-shit-done/workflows/gather-synthesize.md`
- `get-shit-done/workflows/plan.md` (6 gatherers + synthesizer + planner + checker)
- `get-shit-done/workflows/review.md` (4 reviewers + synthesizer)
- `get-shit-done/workflows/doc.md` (6 explorers + synthesizer + writers)
- `get-shit-done/workflows/execute.md` (executor + verifier)
- `get-shit-done/workflows/execute-plan.md` (Pattern A/B/C delegation)
- Agent definition files (YAML frontmatter with role_type)

### Prior Exploration

Capability exploration at `.planning/capabilities/subagent-delegation/CAPABILITY.md` — 2026-03-07.

## Specification

### Current Behavior

Three separate documents define delegation patterns:
1. **model-profiles.md** (79 lines) — Role map, v1/v2 tables, overrides, profile switching, design rationale
2. **model-profile-resolution.md** (46 lines) — Resolution flow, v1 fallback, usage example
3. **gather-synthesize.md** (212 lines) — Full pattern with context assembly, spawning, failure handling, synthesis, reuse examples

Workflows contain inline Task() blocks with correct model parameters. Despite this, the AI orchestrator processes everything inline on Opus — 0% Sonnet usage observed.

### Desired Behavior

A single, consolidated delegation reference that an AI agent can follow without confusion. The document should:
- Define the two delegation shapes (gather-synthesize swarm, single delegation)
- Specify model routing rules (executor=sonnet, judge=inherit, quick=haiku)
- Be concise enough to not get lost in context
- Serve as the single source of truth referenced by all workflows

### Delta

Merge 3 docs into 1 authoritative `delegation.md` reference. Eliminate redundancy between model-profiles.md and model-profile-resolution.md. Integrate the model routing into gather-synthesize.md or vice versa. Net result: fewer files, less context noise, clearer behavioral contract.

Key research question: what is the optimal structure and length for an AI agent to reliably follow delegation instructions? This is a research-dependent decision.

### Invariants

1. Workflow intent and stage sequencing unchanged
2. Gather-synthesize pattern (N parallel -> 1 synthesizer) preserved
3. gsd-tools.cjs init routes and CLI contract preserved
4. Agent definition files keep current structure (YAML frontmatter with role_type is modifiable)
5. Codebase size does not increase — consolidation reduces total lines
6. Model routing rules preserved: executor=sonnet, judge=inherit(opus), quick=haiku

## Unknowns

### Assumptions

- Consolidating 3 docs into 1 will reduce context noise enough for the AI to follow delegation instructions
- The `model=` parameter on Task/Agent tool calls is functional (Sonnet 0% is caused by non-delegation, not a broken parameter)
- v1 fallback resolution can be removed or simplified without breaking anything

### Open Questions

- What is the optimal document length/structure for AI agent compliance?
- Should gather-synthesize context assembly (Layers 0-4) live in the consolidated doc or remain workflow-owned?
- Is the v1 model profile fallback (gsd-planner, gsd-executor tables) still needed?
- Should the consolidated doc define both delegation shapes explicitly or just the gather-synthesize pattern (with single delegation as a simpler case)?

## Scope Boundary

### In

- Consolidate model-profiles.md, model-profile-resolution.md, and gather-synthesize.md into a single reference
- Research optimal structure for AI agent compliance
- Remove deprecated v1 content if no longer needed
- Ensure agent YAML frontmatter role_type is consistent across all agent definitions

### Out

- Modifying workflow files to enforce delegation (that's workflow-enforcement feature)
- Modifying skill files (that's skill-enforcement feature)
- Changing CLI tooling behavior (potential enforcement mechanism, explored in workflow-enforcement)

### Follow-ups

- Enforcement mechanism research: explicit wording vs CLI enhancement vs skill loading (workflow-enforcement feature)
- Audit all agent definition files for consistent role_type frontmatter
- Consider whether a "delegation checklist" section in each workflow would improve compliance
