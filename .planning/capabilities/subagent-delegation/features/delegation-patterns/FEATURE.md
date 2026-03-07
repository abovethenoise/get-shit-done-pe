---
type: feature
capability: "subagent-delegation"
status: exploring
created: "2026-03-07"
---

# delegation-patterns

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: AI agents follow delegation instructions reliably

**Story:** As an AI orchestrator agent, I want a single, clear delegation reference, so that I correctly route executor/gatherer work to Sonnet and keep judgment/synthesis work on Opus.

**Acceptance Criteria:**

- [ ] A single `delegation.md` reference doc exists in `get-shit-done/references/`
- [ ] The doc defines model routing rules, delegation shapes, and when-to-delegate heuristics
- [ ] The 3 source docs (model-profiles.md, model-profile-resolution.md, gather-synthesize.md) are replaced by the consolidated doc
- [ ] Total line count of the consolidated doc is less than the combined 337 lines of the 3 source docs

**Out of Scope:**

- Modifying workflow files to reference the new doc (workflow-enforcement feature)
- Changing CLI tooling behavior

## Functional Requirements

### FN-01: Model routing rules

**Receives:** Agent role_type from YAML frontmatter (executor | judge | quick)

**Returns:** Model assignment (sonnet | inherit | haiku)

**Behavior:**

- executor role_type -> model="sonnet"
- judge role_type -> model="inherit" (gets Opus from parent session)
- quick role_type -> model="haiku"
- No role_type -> fallback to v1 resolution (if retained) or error
- "opus" is never a valid model parameter value; use "inherit" instead

### FN-02: Gather-synthesize delegation shape

**Receives:** Gatherer array (agent paths, dimensions, output paths) + synthesizer config + context payload

**Returns:** Synthesized output at synthesizer.output_path

**Behavior:**

- Spawn N gatherers in parallel via Agent/Task tool with model="sonnet"
- Wait for all to complete
- Retry failed gatherers once; abort if >50% fail
- Spawn 1 synthesizer with model="inherit" after gather phase
- Gatherers receive context (paths, not content); synthesizer reads gatherer outputs
- Used by: research (6 gatherers), review (4 gatherers), doc (6 explorers)

### FN-03: Single delegation shape

**Receives:** Scoped task description + agent definition path + context

**Returns:** Task output (code changes, verification results, etc.)

**Behavior:**

- Spawn 1 subagent via Agent/Task tool with model per role_type
- Used for: plan execution (gsd-executor), verification (gsd-verifier), plan checking (gsd-plan-checker)
- Orchestrator waits for completion, then processes result
- Distinct from gather-synthesize: no parallel phase, no synthesis phase

## Technical Specs

### TC-01: Net line reduction

**Intent:** Fewer reference docs = less context noise = higher AI compliance with delegation instructions.

**Upstream:** 3 existing docs totaling ~337 lines.

**Downstream:** All workflows that currently reference any of the 3 source docs.

**Constraints:**

- Consolidated doc must be strictly fewer lines than 337
- No information loss for active (v2) patterns
- v1 deprecated content removed if no active consumers

### TC-02: Agent frontmatter consistency

**Intent:** All agent definition files must have `role_type` in YAML frontmatter for v2 resolution.

**Upstream:** Agent .md files in `.claude/agents/`

**Downstream:** Model resolution logic in delegation.md

**Constraints:**

- Audit all agent files for role_type presence
- Add role_type where missing
- Remove v1 fallback path if all agents have role_type

## Decisions

- 2026-03-07: Consolidate 3 docs into 1 `delegation.md` — reduces context noise for AI agents
- 2026-03-07: Optimal structure/length is a research question — research phase will investigate what makes AI agents reliably follow delegation
