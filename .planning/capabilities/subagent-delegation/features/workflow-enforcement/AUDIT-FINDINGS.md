# Audit: Orchestrator-Reads-Agent-Definition Anti-Pattern

**Date:** 2026-03-07
**Scope:** All workflow files in `get-shit-done/workflows/`
**Rule:** Orchestrators must NOT read agent definition files. Pass `"First, read {agent_path} for your role."` in the subagent prompt instead.

## Findings

### 1. coherence-report.md (line 100)

**Current instruction:**
```
Agent definition: `@agents/gsd-coherence-synthesizer.md`
```

**Problem:** The `@` prefix is an `@file` reference, meaning the orchestrator loads and reads the agent definition into its own context before spawning the subagent. This is the exact anti-pattern -- the orchestrator absorbs the agent's role/goal/constraints, making it more likely to handle the work inline.

**Recommended fix:** Remove the `@` reference. Instead, pass the agent path in the Task prompt:
```
Task(
  prompt="First, read agents/gsd-coherence-synthesizer.md for your role.\n\n{assembled_prompt}",
  model="inherit"
)
```

## Workflows Using Correct Pattern (no action needed)

| Workflow | Lines | Pattern |
|----------|-------|---------|
| review.md | 79-122 | `"First, read {GSD_ROOT}/agents/gsd-review-*.md for your role."` in Task prompt |
| plan.md | 95-130, 223 | `"First, read {GSD_ROOT}/agents/gsd-research-*.md for your role."` in Task prompt |
| doc.md | 88-123, 198 | `"First, read {GSD_ROOT}/agents/gsd-doc-*.md for your role."` in Task prompt |
| gather-synthesize.md | 75, 150 | `"First, read {agent_path} for your role."` in Task prompt template |
| execute-plan.md | 62 | Spawns `subagent_type="gsd-executor"` without reading definition |

## Workflows Not Applicable (no delegation)

change-application.md, discuss-capability.md, discuss-feature.md, execute.md, focus.md, framing-discovery.md, framing-pipeline.md, init-project.md, progress.md, refinement-qa.md, resume-work.md

## Edge Case: landscape-scan.md (line 76-79)

```
3. Read the agent template:
   cat "$HOME/.claude/get-shit-done/templates/gsd-scan-pair.md"
```

**Not an anti-pattern.** This reads a *template* file (prompt template with placeholders), not an agent definition. The template is filled with context and passed to a Task call. No agent role/goal/constraints are absorbed by the orchestrator.

## Summary

| Anti-pattern instances | Correct pattern instances | Not applicable |
|----------------------|--------------------------|----------------|
| 1 (coherence-report.md) | 5 workflows | 11 workflows |
