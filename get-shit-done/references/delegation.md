# Delegation Reference

Consolidated delegation patterns for AI orchestrators. Covers model routing, delegation shapes, and heuristics.

<model_routing>

## Model Routing

Each agent's YAML frontmatter has a `model` field. Claude Code reads this directly at spawn time.

| model | Used by |
|-------|---------|
| sonnet | Gatherers, executors, doc writers, reviewers, checkers, verifiers |
| opus | Synthesizers, planner, quality reviewer |

- `opus` for judgment/synthesis/planning roles that require critical thinking.
- `sonnet` for execution/gathering roles that are parallelizable and scoped.
- `inherit` is also valid (gets parent session's model) but we use explicit values.
- Orchestrator (main thread) runs at user session level (Opus). Do not spawn the orchestrator as a subagent.

### Resolution

1. Read agent frontmatter `model` field -- Claude Code applies this automatically.
2. All agents must have a `model` field. No fallback resolution.

</model_routing>

<gather_synthesize>

## Gather-Synthesize Shape

Spawn N gatherers in parallel, wait for all, synthesize results into one output.

### Flow

1. Assemble context payload (see `gather-synthesize.md` for context layers).
2. Spawn N gatherers in parallel.
3. Wait for all gatherers to complete.
4. Retry failed gatherers once.
5. If >50% failed: abort. Do not synthesize.
6. Spawn 1 synthesizer with gatherer outputs.
7. Return synthesized output + manifest to calling workflow.

### Task Call Example

```
# Gatherer (spawn N in parallel)
Task(
  prompt="First, read {agent_path} for your role.\n\n<subject>{subject}</subject>\n\n{context}\n\n<task_context>Dimension: {dimension}\nWrite to: {output_path}</task_context>"
)

# Synthesizer (spawn 1 after gather completes)
Task(
  prompt="First, read {synth_agent_path} for your role.\n\n<subject>{subject}</subject>\n\n{context}\n\n<task_context>Synthesize gatherer outputs:\n{manifest}\nWrite to: {synth_output_path}</task_context>"
)
```

### Users

| Workflow | Gatherers | Synthesizer |
|----------|-----------|-------------|
| research | 6 (domain, system, intent, tech, edges, prior art) | 1 research synthesizer |
| review | 4 (enduser, functional, technical, quality) | 1 review synthesizer |
| doc | 6 explorers (inline, arch, domain, agent, automation, hygiene) | 1 doc synthesizer |

### Constraints

- Flat delegation only -- subagents cannot spawn subagents.
- Pass file PATHS to agents, not file content.
- Model routing per agent frontmatter.
- No quality gate between gather and synthesize -- synthesizer handles filtering.

</gather_synthesize>

<single_delegation>

## Single Delegation Shape

Spawn 1 subagent for a scoped task, wait for completion, process the result.

### Flow

1. Construct prompt with agent path, task description, and context paths.
2. Spawn 1 subagent via Task tool with model from agent frontmatter.
3. Wait for completion.
4. Process result (commit, verify, report).

### Task Call Example

```
Task(
  prompt="First, read {agent_path} for your role.\n\nThen read these files for context:\n- {plan_path}\n- {feature_path}\n\nExecute all tasks in the plan."
)
```

### Users

| Workflow | Agent |
|----------|-------|
| execute-plan | gsd-executor |
| review (verification) | gsd-verifier |
| plan (validation) | gsd-plan-checker |

</single_delegation>

<when_to_delegate>

## When to Delegate

**Delegate when:**
- Work is parallel and independent (multiple analyses, multiple reviews).
- Task is scoped with clear inputs/outputs (execute a plan, verify an artifact).
- Work is mechanical and does not require orchestration judgment (gather facts, run checks).

**Do NOT delegate when:**
- User is asking a question or having a conversation.
- Task requires synthesis or judgment across multiple inputs (this is the orchestrator's job).
- Task requires orchestration decisions (sequencing, retry logic, routing).
- The orchestrator already has the answer in context.

</when_to_delegate>

<anti_patterns>

## Anti-Patterns

### Orchestrator reads agent definitions

Orchestrators MUST NOT read agent definition files. Agent definitions are for the subagent, not the orchestrator. Include `First, read {agent_path} for your role.` in the subagent's prompt. If the orchestrator reads agent definitions, it absorbs enough context to handle the task inline -- defeating delegation.

**Wrong:** Orchestrator reads `agents/gsd-executor.md`, then spawns a Task.
**Right:** Orchestrator spawns Task with prompt containing `First, read agents/gsd-executor.md for your role.`

### Content passing between agents

Do not pass content between agents -- pass file PATHS. Each agent reads files in its own context window. Passing content inflates the orchestrator's context and risks truncation.

**Wrong:** Orchestrator reads PLAN.md, includes full text in subagent prompt.
**Right:** Subagent prompt says `Read /path/to/PLAN.md for your instructions.`

### Inline handling instead of delegation

If a workflow specifies delegation but the orchestrator handles the work inline, delegation is defeated. The orchestrator must spawn the subagent even when it "knows" the answer. Delegation is about cost (Sonnet vs Opus) and context isolation, not capability.

</anti_patterns>
