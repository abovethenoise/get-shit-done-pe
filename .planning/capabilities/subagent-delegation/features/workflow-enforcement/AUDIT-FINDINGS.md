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

## Deferred from delegation-patterns Doc Phase

The following findings were identified during `delegation-patterns` doc review and deferred to this feature:

### 2. init.cjs uses resolveModelInternal for 5/6 agents (bypasses frontmatter)

Lines 427-428, 509-510, 701-702 call `resolveModelInternal()` which ignores agent YAML frontmatter and defaults to sonnet. Only line 426 uses `resolveModelFromFrontmatter()`. Result: planner resolves to sonnet via init despite `model: opus` in frontmatter. **Action:** Migrate all calls to `resolveModelFromFrontmatter` or remove if dead code.

### 3. opus-to-inherit conversion in resolveModelInternal (core.cjs line 305)

`return override === 'opus' ? 'inherit' : override` silently converts opus config overrides to inherit. Contradicts review decision that opus is valid. **Action:** Remove the ternary — return override directly.

### 4. Model resolution precedence undocumented

YAML frontmatter always wins (user decision). Workflows should not pass `model=` in Task() calls that override frontmatter. **Action:** Document precedence in delegation.md. Remove or align Task() model params in workflows.

### 5. resolveModelFromFrontmatter sonnet fallback (core.cjs)

`fm.model || 'sonnet'` fallback contradicts delegation.md "no fallback resolution." **Action:** Evaluate if defensive fallback is needed or if it should warn/error.

### 6. Workflow Task() calls use model="inherit" for opus synthesizers

plan.md, review.md, doc.md pass `model="inherit"` for synthesizers while agent frontmatter says `model: opus`. Works because parent is Opus, but contradicts "use explicit values" convention. **Action:** Align Task() calls with frontmatter values.

### 7. Stale gsd-researcher.md reference in init.cjs line 426

`resolveModelFromFrontmatter(cwd, path.join(cwd, '..', 'agents', 'gsd-researcher.md'))` — file doesn't exist (research split into 6 agents). Silently returns sonnet. **Action:** Remove or update.

## Summary

| Anti-pattern instances | Correct pattern instances | Not applicable |
|----------------------|--------------------------|----------------|
| 1 (coherence-report.md) | 5 workflows | 11 workflows |
| + 6 deferred from delegation-patterns doc phase |
