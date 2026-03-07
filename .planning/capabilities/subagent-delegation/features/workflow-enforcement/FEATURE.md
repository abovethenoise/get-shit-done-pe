---
type: feature
capability: "subagent-delegation"
status: completed
created: "2026-03-07"
---

# workflow-enforcement

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | done | done | done | done | done | completed |
| FN-01 | done | done | done | done | done | completed |
| FN-02 | done | done | done | done | done | completed |
| FN-03 | done | done | done | done | done | completed |
| TC-01 | done | done | done | done | done | completed |
| TC-02 | done | done | done | done | done | completed |
| TC-03 | done | done | done | done | done | completed |

## End-User Requirements

### EU-01: All workflows delegate consistently via delegation.md

**Story:** As an AI orchestrator agent, I want every workflow to follow delegation.md patterns without inline overrides, so that delegation is consistent, model routing comes from a single source (agent YAML frontmatter), and workflow files are shorter.

**Acceptance Criteria:**

- [ ] All 8 workflows with delegation content reference `delegation.md` via required_reading (landscape-scan.md excluded — zero delegation content per research)
- [ ] No workflow contains redundant inline delegation explanations (model routing rules, parallel spawning instructions, anti-patterns) that duplicate delegation.md
- [ ] No Task() call in any workflow contains an explicit `model=` parameter — model comes from agent YAML frontmatter only
- [ ] delegation.md's own Task() examples drop `model=` params to match the enforcement rule
- [ ] Net line count across all modified files is reduced vs. pre-enforcement baseline

**Out of Scope:**

- Modifying agent YAML frontmatter model assignments (trust current values)
- Changing workflow stage sequencing or intent
- Modifying gather-synthesize.md (context assembly is a separate concern)

## Functional Requirements

### FN-01: Add delegation.md required_reading

**Receives:** 9 workflow files with delegation-related content (doc.md, review.md, framing-pipeline.md, landscape-scan.md, init-project.md, execute.md, execute-plan.md, plan.md, gather-synthesize.md)

**Returns:** Each workflow has `@{GSD_ROOT}/get-shit-done/references/delegation.md` in its required_reading block.

**Behavior:**

- If workflow already has a required_reading block, add delegation.md to it (if not already present)
- If workflow has no required_reading block, add one with delegation.md
- Do not add to workflows that have zero delegation content (e.g. discuss-feature.md, discuss-capability.md, focus.md, etc.)

### FN-02: Strip redundant inline delegation content

**Receives:** Workflow files containing inline delegation explanations that duplicate delegation.md.

**Returns:** Workflow files with redundant content removed. Workflow-specific Task() call templates preserved.

**Behavior:**

- Remove inline explanations of model routing rules (e.g. "sonnet for gatherers, opus for synthesizers")
- Remove inline parallel spawning instructions that restate gather-synthesize shape rules
- Remove inline anti-pattern warnings that duplicate delegation.md
- Preserve workflow-specific Task() call templates (concrete agent paths, dimensions, output paths, prompt structures)
- Preserve workflow-specific constraints (abort thresholds, re-review cycle counts, etc.)
- If a section becomes empty after stripping, remove the section header too

### FN-03: Remove model= from Task() calls

**Receives:** All Task() calls across all workflow files and delegation.md.

**Returns:** Task() calls without explicit `model=` parameter.

**Behavior:**

- Remove `model="sonnet"`, `model="opus"`, `model="inherit"` from every Task() call
- Agent YAML frontmatter `model` field is the sole authority for model routing
- Where a workflow has a `key_constraints` or summary section listing model assignments (e.g. "gsd-doc-explorer (6x sonnet)"), update to reference agent frontmatter instead of hardcoding
- Trust current agent YAML values — do not modify agent files

## Technical Specs

### TC-01: Compliance audit of already-updated workflows

**Intent:** The 4 workflows updated during delegation-patterns (execute.md, execute-plan.md, plan.md, gather-synthesize.md) may have contradictions or gaps vs. delegation.md. Fix inline, no separate audit artifact.

**Upstream:** delegation-patterns feature output (4 updated workflows + delegation.md)

**Downstream:** Same enforcement rules (FN-01, FN-02, FN-03) apply to these 4 workflows.

**Constraints:**

- Check for: missing delegation.md reference, lingering `model=` in Task() calls, redundant inline delegation explanations
- Fix contradictions where workflow Task() `model=` disagrees with agent YAML frontmatter (e.g. doc.md uses `model="inherit"` for gsd-doc-synthesizer which is `model: opus` in YAML)
- No separate audit artifact — fixes applied directly

### TC-02: Net code reduction

**Intent:** Enforcement should reduce total line count, not increase it. Removing redundant explanations and `model=` params offsets any added required_reading lines.

**Upstream:** Current combined line count of all 9 workflow files + delegation.md.

**Downstream:** Reduced line count post-enforcement.

**Constraints:**

- Measure line count before and after across all modified files
- Net result must be fewer lines than baseline
- Do not add new explanatory content — the reference doc handles that

### TC-03: Command file coherence audit

**Intent:** Command/skill files (`.claude/commands/gsd/`) are thin routing layers. Verify they don't interfere with delegation. Folded in from killed skill-enforcement feature.

**Upstream:** 16 command files in `~/.claude/commands/gsd/`

**Downstream:** Commands correctly enable delegation in the workflows they invoke.

**Constraints:**

- Verify `Task` is in `allowed-tools` for every command that invokes a delegation-heavy workflow
- Verify no command contains inline delegation logic or Task() calls
- Verify no command's process instructions contradict delegation.md patterns
- Fix any gaps found; no separate audit artifact

## Decisions

- 2026-03-07: Agent YAML frontmatter is sole authority for model routing — Task() calls must not override with `model=`
- 2026-03-07: delegation.md's own examples updated here (not back-ported to delegation-patterns feature)
- 2026-03-07: gather-synthesize.md stays separate — context assembly is a different concern from delegation
- 2026-03-07: Trust agent YAML model values as-is — no agent file modifications
- 2026-03-07: Audit of 4 already-updated workflows is inline fixes, no separate artifact
- 2026-03-07: Contradictions resolved by trusting agent YAML (e.g. gsd-review-quality is opus per YAML, not sonnet per review.md Task() call)
- 2026-03-07: skill-enforcement killed and folded in as TC-03 — command files are thin routing layers with no delegation logic; audit added here
- 2026-03-07: AUDIT-FINDINGS items 2-7 (CLI .cjs code) rendered moot by FN-03 — removing model= from Task() calls eliminates the code path where CLI model resolution affects delegation. Dead code in init.cjs/core.cjs should be cleaned up separately.
- 2026-03-07: All Task() calls use subagent_type= parameter instead of 'First, read {agent_path}' prompt pattern. subagent_type causes Claude Code to load the agent definition automatically, making explicit agent reads redundant (see delegation.md anti-patterns)
