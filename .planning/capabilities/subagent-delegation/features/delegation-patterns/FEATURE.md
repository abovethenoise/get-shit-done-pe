---
type: feature
capability: "subagent-delegation"
status: in-progress
created: "2026-03-07"
---

# delegation-patterns

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | x | x | x | x | - | complete |
| FN-01 | x | x | x | x | - | complete |
| FN-02 | x | x | x | x | - | complete |
| FN-03 | x | x | x | x | - | complete |
| TC-01 | x | x | x | x | - | complete |
| TC-02 | x | x | x | x | - | complete |

## End-User Requirements

### EU-01: AI agents follow delegation instructions reliably

**Story:** As an AI orchestrator agent, I want a single, clear delegation reference, so that I correctly route executor/gatherer work to Sonnet and keep judgment/synthesis work on Opus.

**Acceptance Criteria:**

- [ ] A single `delegation.md` reference doc exists in `get-shit-done/references/`
- [ ] The doc defines model routing rules, delegation shapes, and when-to-delegate heuristics
- [ ] Delegation content from the 3 source docs (model-profiles.md, model-profile-resolution.md, gather-synthesize.md) is consolidated into the new doc; context assembly content retained in gather-synthesize.md
- [ ] Total line count of the consolidated doc is less than the combined 337 lines of the 3 source docs

**Out of Scope:**

- Modifying workflow files to reference the new doc (workflow-enforcement feature)
- Changing CLI tooling behavior

## Functional Requirements

### FN-01: Model routing rules

**Receives:** Agent model field from YAML frontmatter (sonnet | opus | haiku)

**Returns:** Model assignment (sonnet | opus | haiku)

**Behavior:**

- executor agents -> model="sonnet"
- judge/synthesizer agents -> model="opus"
- quick agents -> model="haiku"
- Claude Code reads `model` from agent frontmatter natively at spawn time
- No intermediate resolution function needed; frontmatter is the single source of truth

### FN-02: Gather-synthesize delegation shape

**Receives:** Gatherer array (agent paths, dimensions, output paths) + synthesizer config + context payload

**Returns:** Synthesized output at synthesizer.output_path

**Behavior:**

- Spawn N gatherers in parallel via Agent/Task tool with model="sonnet"
- Wait for all to complete
- Retry failed gatherers once; abort if >50% fail
- Spawn 1 synthesizer with model="opus" after gather phase
- Gatherers receive context (paths, not content); synthesizer reads gatherer outputs
- Used by: research (6 gatherers), review (4 gatherers), doc (6 explorers)

### FN-03: Single delegation shape

**Receives:** Scoped task description + agent definition path + context

**Returns:** Task output (code changes, verification results, etc.)

**Behavior:**

- Spawn 1 subagent via Agent/Task tool with model per agent frontmatter
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

**Intent:** All agent definition files must have `model` in YAML frontmatter for direct model routing.

**Upstream:** Agent .md files in `.claude/agents/`

**Downstream:** Claude Code reads `model` field natively at spawn time.

**Constraints:**

- Audit all agent files for `model` presence
- Add `model` where missing
- `role_type` is not needed — `model` field is the direct authority

## Decisions

- 2026-03-07: Consolidate 3 docs into 1 `delegation.md` — reduces context noise for AI agents
- 2026-03-07: Optimal structure/length is a research question — research phase will investigate what makes AI agents reliably follow delegation
