---
type: doc-report
feature: subagent-delegation/workflow-enforcement
date: 2026-03-07
explorer_manifest:
  inline-clarity: success
  architecture-map: success
  domain-context: success
  agent-context: success
  automation-surface: success
  planning-hygiene: success
---

## Inline Clarity

### Recommendation: Add delegation.md to coherence-report.md required_reading

- **target_file**: get-shit-done/workflows/coherence-report.md
- **what_to_change**: Add `@{GSD_ROOT}/get-shit-done/references/delegation.md` to the existing required_reading block. coherence-report.md spawns Task(subagent_type="gsd-coherence-synthesizer") but lacks the delegation reference all other delegation-active workflows have.
- **why**: Same class of gap as landscape-scan.md (review Finding 1). The workflow-enforcement invariant (FN-01) requires every Task()-containing workflow to include delegation.md in required_reading. This file was outside the original 9-file scope and was missed.
- **priority**: high
- **route**: inline-comment
- **expected_behavior**: `grep -c "delegation.md" get-shit-done/workflows/coherence-report.md` returns 1
- **dedup_note**: This finding appeared in inline-clarity, architecture-map, and agent-context explorers. Consolidated here.

### Recommendation: Rename agent_path to subagent_type in gather-synthesize.md parameters

- **target_file**: get-shit-done/workflows/gather-synthesize.md
- **what_to_change**: Rename `agent_path` to `subagent_type` in both parameter descriptions (lines 15 and 20). Change description from "Path to the agent definition" to "Agent name for subagent_type parameter".
- **why**: The `agent_path` naming contradicts delegation.md's anti-pattern rule that orchestrators must NOT read agent definition files. A reader seeing "pass the path" in gather-synthesize.md and "never touch the path" in delegation.md would see a direct conflict. No workflow actually passes an agent_path -- all use subagent_type directly.
- **priority**: high
- **route**: inline-comment
- **expected_behavior**: `grep -c "agent_path" get-shit-done/workflows/gather-synthesize.md` returns 0 AND `grep -c "subagent_type" get-shit-done/workflows/gather-synthesize.md` returns at least 2

## Architecture Map

### Recommendation: Document two-tier delegation topology

- **target_file**: .docs/architecture.md
- **what_to_change**: Add a section documenting the two-tier delegation hierarchy. Tier 1: workflows that call Task() directly (execute.md, execute-plan.md, plan.md, review.md, doc.md, landscape-scan.md, coherence-report.md). Tier 2: orchestrator workflows that invoke Tier 1 workflows without calling Task() themselves (framing-pipeline.md, init-project.md). Both tiers include delegation.md in required_reading for different reasons.
- **why**: Without this context, a future contributor would reasonably conclude delegation.md in framing-pipeline.md and init-project.md is unnecessary (neither calls Task()). This creates cleanup risk where someone removes an intentional required_reading entry.
- **priority**: medium
- **route**: decision-log (Tier 3 `.docs/architecture.md`)
- **expected_behavior**: `grep -c "orchestrator" .docs/architecture.md` returns >= 1 in a delegation topology section
- **re-route**: Original route was `inline-comment`. Re-routed to Tier 3 `.docs/architecture.md` because this documents a cross-boundary architectural pattern spanning multiple workflow files, not a "why" comment at a single code location.

### Recommendation: Record intentional redundancy in delegation.md required_reading

- **target_file**: .docs/architecture.md
- **what_to_change**: Document as an architectural decision: "Workflows that use gather-synthesize.md also include delegation.md directly in their required_reading. This is intentional redundancy -- gather-synthesize.md defers to delegation.md for operational details, but calling workflows should not depend on transitive required_reading resolution."
- **why**: If someone later removes the "redundant" delegation.md from doc.md or review.md, the direct dependency would be lost. The redundancy is deliberate but unrecorded.
- **priority**: low
- **route**: decision-log (Tier 3 `.docs/architecture.md`)
- **expected_behavior**: `grep -c "transitive" .docs/architecture.md` returns >= 1

## Domain Context

### Recommendation: Record disposition of AUDIT-FINDINGS items 2-7

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md
- **what_to_change**: Add a decision to FEATURE.md Decisions section: "2026-03-07: AUDIT-FINDINGS items 2-7 (CLI .cjs code) rendered moot by FN-03 -- removing model= from Task() calls eliminates the code path where CLI model resolution affects delegation."
- **why**: AUDIT-FINDINGS.md lists 6 deferred items. RESEARCH.md says these are "rendered moot by FN-03" but FEATURE.md Decisions section is silent. Without a recorded disposition, a future developer will see 6 open items with no resolution.
- **priority**: high
- **route**: decision-log (Tier 2 FEATURE.md decisions)
- **expected_behavior**: `grep -c 'AUDIT-FINDINGS items 2-7' .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md` returns 1

### Recommendation: Encode delegation-heavy classification rule

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add a brief note: "Command files that invoke delegation-aware workflows must include `Task` in their `allowed-tools` list. Commands for conversational Q&A or status display (no subagent spawning) should not."
- **why**: The "delegation-heavy" classification (10 commands need Task, 6 don't) exists only in planning artifacts. New commands added later may omit Task from allowed-tools, silently breaking delegation.
- **priority**: medium
- **route**: claude-md (Tier 2 -- scoped rule within the delegation reference)
- **expected_behavior**: `grep -c 'allowed-tools' get-shit-done/references/delegation.md` returns at least 1
- **re-route**: Original route was `inline-comment`. Re-routed to Tier 2 because this is a project-wide rule about command file configuration, not a "why" comment at a specific code location.

### Recommendation: Record subagent_type replaces First-read pattern decision

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md
- **what_to_change**: Add a decision: "2026-03-07: All Task() calls use subagent_type= parameter instead of 'First, read {agent_path}' prompt pattern. subagent_type causes Claude Code to load the agent definition automatically."
- **why**: AUDIT-FINDINGS.md's recommended fix still shows the old pattern which is now explicitly an anti-pattern in delegation.md. Without a recorded decision, someone reading AUDIT-FINDINGS.md would implement the wrong pattern.
- **priority**: high
- **route**: decision-log (Tier 2 FEATURE.md decisions)
- **expected_behavior**: `grep -c 'subagent_type' .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md` returns at least 1

## Agent Context

### Recommendation: Clarify MEMORY.md "no inherit" wording

- **target_file**: /Users/philliphall/.claude/projects/-Users-philliphall-get-shit-done-pe/memory/MEMORY.md
- **what_to_change**: Reword line 5 from `model field in YAML frontmatter is the single source of truth -- no role_type, no inherit` to `model field in YAML frontmatter is the single source of truth (not role_type). Values: sonnet, opus, inherit (we prefer explicit over inherit).`
- **why**: Current wording "no inherit" reads as a prohibition. delegation.md explicitly allows inherit as a valid value. An AI agent reading MEMORY.md could interpret "no inherit" as contradicting delegation.md.
- **priority**: medium
- **route**: claude-md (Tier 2 -- project-scoped auto-memory)
- **expected_behavior**: `grep "inherit" ~/.claude/projects/-Users-philliphall-get-shit-done-pe/memory/MEMORY.md` shows wording acknowledging inherit as valid but not preferred

### Recommendation: Evaluate project-level CLAUDE.md for delegation rule

- **target_file**: /Users/philliphall/get-shit-done-pe/CLAUDE.md
- **what_to_change**: Either create a project-level CLAUDE.md containing the delegation enforcement rule ("agent YAML frontmatter model field is sole authority -- no model= in Task() calls"), or document a decision that this is intentionally omitted (relying on delegation.md via required_reading instead).
- **why**: Without a project-level CLAUDE.md, the delegation enforcement rule is only visible when a workflow's required_reading includes delegation.md. Any new workflow created without required_reading would lack this critical context.
- **priority**: medium
- **route**: claude-md (Tier 1 if created -- would need to stay < 200 lines)
- **expected_behavior**: Either CLAUDE.md exists with delegation rule, or a decision-log entry documents why it is intentionally omitted

## Automation Surface

### Recommendation: Record CLI dead code as known tech debt

- **target_file**: .claude/memory-ledger.md
- **what_to_change**: Create a memory-ledger entry documenting: (1) resolveModelInternal opus-to-inherit conversion at core.cjs:305 is dead code post-FN-03, (2) init.cjs:426 references deleted gsd-researcher.md, (3) init.cjs emits model variables no workflow parses.
- **why**: AUDIT-FINDINGS items 2-7 were declared "rendered moot" without cleanup. The code paths still exist but are unreachable. Without persistent tracking, this dead code becomes invisible tech debt.
- **priority**: medium
- **route**: memory-ledger (Tier 5 -- project-wide solved gotcha)
- **expected_behavior**: `grep -c "resolveModelInternal" .claude/memory-ledger.md` returns >= 1

### Recommendation: Record Task-to-Agent tool rename as platform risk

- **target_file**: .claude/memory-ledger.md
- **what_to_change**: Add a memory-ledger entry: "Claude Code renamed Task tool to Agent in v2.1.63. Task() alias still works. If deprecated, all workflow files and delegation.md need Task( replaced with Agent(. Affects every delegation-active workflow."
- **why**: If the alias is silently deprecated, all GSD delegation breaks with no warning. This is a known platform risk with no current tracking outside RESEARCH.md (a planning artifact that won't be consulted post-feature).
- **priority**: high
- **route**: memory-ledger (Tier 5 -- project-wide platform risk)
- **expected_behavior**: `grep -c "Task.*Agent.*rename" .claude/memory-ledger.md` returns >= 1

## Planning Hygiene

### Recommendation: Update FEATURE.md status to completed

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md
- **what_to_change**: Update frontmatter `status: specified` to `status: completed`. Update each row in the Trace Table to reflect completed status.
- **why**: Both 01-PLAN and 02-PLAN are complete with summaries written. A future agent or human checking feature status will see "specified" and assume no work has been done.
- **priority**: high
- **route**: artifact-cleanup
- **expected_behavior**: `grep 'status:' .planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md` returns `status: completed`

### Recommendation: Annotate AUDIT-FINDINGS items 2-7 as moot

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md
- **what_to_change**: Add status annotation to each of items 2-7: "Status: Rendered moot by FN-03 -- model= removed from all Task() calls, CLI resolution path no longer consumed by workflows."
- **why**: Without status annotations, a future agent will re-investigate these already-resolved items.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: `grep -c 'moot\|resolved\|out.of.scope' .planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md` returns non-zero

### Recommendation: Mark AUDIT-FINDINGS item 1 as resolved

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md
- **what_to_change**: Mark item 1 as resolved with a note pointing to commit 4c62f97. The "recommended fix" code block still shows `model="inherit"` which contradicts FN-03.
- **why**: The recommended fix in item 1 contradicts the pattern the feature established (no model= in Task calls). Leaving it unmarked risks someone following stale guidance.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: AUDIT-FINDINGS.md item 1 is marked resolved with commit reference

### Recommendation: RESEARCH.md baseline stale (informational)

- **target_file**: .planning/capabilities/subagent-delegation/features/workflow-enforcement/RESEARCH.md
- **what_to_change**: No change needed. RESEARCH.md states baseline 2858 lines; 01-SUMMARY corrected to 2619. Expected drift in enhance-lens workflow.
- **why**: Informational only. The SUMMARY already documents the correction.
- **priority**: low
- **route**: artifact-cleanup
- **expected_behavior**: N/A -- informational, no action required
