---
type: feature
capability: "pipeline-execution"
status: specified
created: "2026-03-04"
---

# Scope-Aware Pipeline Routing

## Goal

Make lens commands (/gsd:new, /gsd:enhance, /gsd:debug, /gsd:refactor) work at both capability and feature level. Capability-level input triggers feature decomposition via capability-orchestrator. Feature-level input runs as-is (current behavior).

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| EU-02 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| FN-04 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Lens commands work at capability level

**Story:** As a GSD user, I want to run `/gsd:enhance my-capability` and have it fan out to all features in that capability — so I don't have to manually invoke the pipeline per-feature.

**Acceptance Criteria:**

- [ ] `/gsd:new {cap}`, `/gsd:enhance {cap}`, `/gsd:debug {cap}`, `/gsd:refactor {cap}` all accept capability slugs
- [ ] Capability-level invocation routes to capability-orchestrator which fans out to features
- [ ] Feature-level invocation continues to work as-is (no regression)
- [ ] Ambiguous slugs prompt user: "Is this a new capability or a new feature?"

**Out of Scope:**

- Changing capability-orchestrator's internal logic (it already handles per-feature dispatch)

### EU-02: /gsd:new asks capability vs feature for unknown slugs

**Story:** As a GSD user, when I run `/gsd:new something-that-doesnt-exist`, I want to be asked whether this is a new capability or a new feature under an existing capability — so the system doesn't guess wrong.

**Acceptance Criteria:**

- [ ] When slug doesn't match any existing capability or feature, ask: "New capability or new feature under existing capability?"
- [ ] If new capability: route to discuss-capability flow
- [ ] If new feature: ask which capability it belongs to, then route to discuss-feature
- [ ] After discuss-capability completes, ask user: "Continue to pipeline for all features?" or "I'll run them individually"

**Out of Scope:**

- Semantic matching (suggesting "this could go under X capability") — exact/fuzzy slug match only

## Functional Requirements

### FN-01: Slug resolution determines scope

**Receives:** User argument to any lens command (string — could be capability slug, feature slug, or unknown).

**Returns:** Resolution result with `type: capability | feature` plus routing decision.

**Behavior:**

- Use existing `gsd-tools slug-resolve` which already returns `type: capability` or `type: feature`
- If resolved as capability: route to capability-orchestrator with LENS
- If resolved as feature: route to framing-pipeline (current behavior)
- If ambiguous: present candidates via AskUserQuestion
- If no match: for /gsd:new, ask "New capability or new feature?"; for other lenses, error with suggestion to check /gsd:status

### FN-02: Capability-level auto-creates feature stubs

**Receives:** Capability slug where features exist in CAPABILITY.md features table but not on disk.

**Returns:** Feature directories + stub FEATURE.md files created.

**Behavior:**

- Read CAPABILITY.md features table for feature slugs
- For each feature not yet on disk: create `.planning/capabilities/{cap}/features/{feat}/FEATURE.md` from template
- Stubs only — orchestrator handles discovery per feature
- If features table is empty: error, suggest running discuss-capability first

### FN-03: /gsd:new capability flow

**Receives:** Unknown slug via /gsd:new, user confirms "new capability".

**Returns:** Capability created via discuss-capability, user offered auto-fan-out.

**Behavior:**

- Route to discuss-capability flow (creates capability + features table)
- After discuss-capability completes, ask user via AskUserQuestion: "Continue to pipeline for all features?" or "I'll run them individually"
- If continue: invoke capability-orchestrator with LENS=new
- If individual: show next steps and stop

### FN-04: Four lens commands updated with capability routing

**Receives:** Capability or feature slug.

**Returns:** Correct routing to capability-orchestrator or framing-pipeline.

**Behavior:**

- Each of /gsd:new, /gsd:enhance, /gsd:debug, /gsd:refactor adds capability-level branch
- Routing logic: resolve slug → if capability, invoke capability-orchestrator with LENS; if feature, invoke framing-pipeline (existing)
- Pattern is identical across all 4 commands (DRY — shared routing logic or consistent copy)

## Technical Specs

### TC-01: Lens command routing changes

**Intent:** Add capability-level branch to each lens command's slug resolution handler.

**Upstream:** `gsd-tools slug-resolve` already returns `type: capability | feature`.

**Downstream:** capability-orchestrator.md receives CAPABILITY_SLUG + LENS.

**Constraints:**

- All 4 lens commands (commands/gsd/new.md, enhance.md, debug.md, refactor.md) need the same routing update
- Routing is: resolve → check type → branch (capability: orchestrator, feature: framing-pipeline)
- Must not break existing feature-level invocation
- Ambiguity handling: AskUserQuestion with candidates (same pattern as /gsd:doc, /gsd:review)

### TC-02: Feature stub auto-creation

**Intent:** Bootstrap feature directories from CAPABILITY.md features table when features don't exist on disk.

**Upstream:** CAPABILITY.md features table (parsed for slugs).

**Downstream:** Feature directories with stub FEATURE.md files ready for orchestrator.

**Constraints:**

- Use `get-shit-done/templates/feature.md` template for stubs
- Only create if directory doesn't already exist (no overwrite)
- Set status to `exploring` in stub FEATURE.md
- Log each creation: "Created feature stub: {cap}/{feat}"

## Decisions

- Routing is simple: resolve slug type, branch accordingly. No shared routing layer needed — each lens command handles it.
- /gsd:new always asks "capability or feature?" for unknown slugs (no semantic matching)
- Auto-create stubs only, orchestrator handles discovery per feature (no discuss-feature auto-run)
- After discuss-capability in /gsd:new flow, user chooses whether to auto-fan-out or run individually
