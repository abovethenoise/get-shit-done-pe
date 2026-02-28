# Tech Constraints: Phase 2 Implementation Limits

**Researched:** 2026-02-28
**Dimension:** Technical feasibility, limits, and constraints affecting Phase 2 implementation
**Confidence:** HIGH (sourced from existing codebase, live workflow files, and observed runtime behavior)

---

## Claude Code Agent Spawning

### How Task Tool Works

The Task tool is the sole mechanism for spawning subagents in Claude Code. It is synchronous from the orchestrator's perspective — the orchestrator blocks until the agent completes.

**Parameters (verified from workflow files):**

```
Task(
  prompt="...",           // required — full agent instructions
  subagent_type="...",    // required — agent name (matches ~/.claude/agents/*.md filename without .md)
  model="...",            // required — one of: "sonnet", "haiku", "inherit"
  description="..."       // optional — shown in UI
)
```

**`subagent_type` resolution:**
- Value matches the `name:` field in the agent's YAML frontmatter
- File must exist at `~/.claude/agents/{subagent_type}.md` OR the project's `.claude/agents/` directory
- `"general-purpose"` is a valid built-in type — used in new-project.md when no custom agent is available

**`model` parameter values (confirmed from model-profiles.md):**
- `"sonnet"` — Claude Sonnet
- `"haiku"` — Claude Haiku
- `"inherit"` — uses the parent session's model (Opus in practice)
- `"opus"` is NOT passed directly — it resolves to a specific version that may be blocked by org policies; use `"inherit"` instead

**Parallel spawning:** Multiple Task calls can be made simultaneously. The orchestrator spawns all agents in the current call, then waits for all to complete before proceeding. This is how 4-6 parallel agents work in new-project.md and execute-phase.md.

**Confirmed from execute-phase.md (line 99-137):**
```
Task(
  subagent_type="gsd-executor",
  model="{executor_model}",
  prompt="..."
)
```

### Limits on Parallel Spawning

**Observed in production:**
- execute-phase.md spawns N plans in parallel within a wave (N is unbounded in theory)
- new-project.md spawns exactly 4 researchers in parallel
- Phase 2 plan calls for 6 parallel gatherers — this is consistent with existing patterns

**Known constraint:** Claude Code has a "classifyHandoffIfNeeded is not defined" runtime bug that fires after agent completion. This does not indicate agent failure. Verification by SUMMARY.md existence is the correct success check. (Source: execute-phase.md failure_handling section.)

**No documented hard cap** on parallel Task count from official sources. However, context bleed is not a concern — each spawned agent gets a fresh 200k context window.

### How Agents Return Results

Agents return results by:
1. Writing files to disk (primary mechanism — SUMMARY.md, research outputs)
2. Printing a structured completion message as the final output (secondary — for orchestrator status checks)

The orchestrator does NOT receive the agent's full output in its context. It reads the agent's return message and checks files on disk. This is confirmed by execute-phase.md:

> "Pass paths only — executors read files themselves with their fresh 200k context. This keeps orchestrator context lean (~10-15%)."

For the gather-synthesize pattern: gatherers write output files, synthesizer reads those files. The orchestrator only needs to verify file existence and check for the completion marker.

---

## Context Window Budget

### Per-Agent Window

- Each spawned agent gets a **fresh 200k token context window** (confirmed from execute-phase.md context_efficiency section)
- Orchestrator targets **~10-15% of its own context** for coordination overhead — keeps it lean so it can run many waves

### Token Math for Agent Definitions

Target per CONTEXT.md: ~1500 tokens per agent definition.

Token estimation for a typical agent .md file:
- YAML frontmatter (~10 fields): ~100-150 tokens
- Body text (~400-500 words, 50-80 lines): ~600-800 tokens
- Code/structured sections: ~200-400 tokens
- **Total: ~900-1350 tokens** — fits within target

The synthesizer is allowed up to ~2000 tokens (per plan 02-01) due to its more complex output contract.

### @file Reference Resolution

In Claude Code, `@/path/to/file` in a prompt causes the orchestrator to inline the file contents at spawn time. The agent receives the content, not the path reference.

**Implication:** When the prompt includes `@path/to/agent.md`, the full agent definition gets injected into the prompt. This is a different pattern than `subagent_type` — the latter loads the agent as a system persona, not as prompt content.

In the current GSD v1 pattern, agents are loaded via both methods:
- `subagent_type="gsd-executor"` — agent definition loaded as system role
- `@~/.claude/get-shit-done/workflows/execute-plan.md` — workflow injected as prompt content

For v2 gather-synthesize pattern: gatherers need their agent file loaded as `subagent_type`. The context payload (layers 1-4) is injected into the prompt as `<files_to_read>` blocks.

### Overhead of Spawning an Agent

Estimated context overhead for spawning:
- System prompt (Claude Code runtime): ~1-3k tokens (unobservable, estimated)
- Tool definitions (Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, Context7 MCP): ~2-4k tokens
- Agent definition (subagent_type loading): ~1-2k tokens (the .md file)
- Prompt content: variable (context payload)

**Conservative estimate:** ~5-10k tokens of fixed overhead before any context injection. With a 200k window, this leaves ~190k for actual work.

For the 6-gatherer pattern with ~1500 token definitions + core context (~5-10k) + task-specific context (~2-5k): each gatherer uses roughly 15-20k tokens, leaving ~175-180k for tool calls and reasoning. This is well within limits.

---

## Model Selection

### Available Models for Subagents

**Confirmed from model-profiles.md and task invocations:**

| Model Value | Actual Model | Use Case |
|-------------|-------------|----------|
| `"sonnet"` | Claude Sonnet (latest) | Executors — do the work |
| `"haiku"` | Claude Haiku (latest) | High-volume, simple tasks |
| `"inherit"` | Parent session's model (Opus) | Judges — validate, synthesize |

**CRITICAL:** `"opus"` is not a valid direct value. It maps to a specific version that organizational policies may block. `"inherit"` is the correct way to get Opus behavior.

### Executor/Judge Model Mapping (v2 pattern)

From CONTEXT.md locked decisions:
```
role_type: executor → model: "sonnet"
role_type: judge    → model: "inherit"  (Opus in parent session)
```

This mapping is implemented as `ROLE_MODEL_MAP` in core.cjs (Plan 02-03 deliverable):
```javascript
const ROLE_MODEL_MAP = {
  executor: 'sonnet',
  judge: 'inherit',
};
```

The `resolveModelFromRole(cwd, agentPath)` function reads agent frontmatter to get `role_type`, then maps it. Falls back to v1 `resolveModelInternal()` for agents without `role_type`.

### Per-Agent Model Specification

The `model` parameter is passed per-Task call. The orchestrator resolves it before spawning:

1. Call `resolveModelFromRole(cwd, agentPath)` — reads agent's frontmatter `role_type`
2. If agent is v2 (has `role_type`) → use ROLE_MODEL_MAP
3. If agent is v1 (no `role_type`) → fall through to `resolveModelInternal()` with profile table

**Applied to Phase 2 agents:**
- 6x research gatherers (`role_type: executor`) → all spawn with `model: "sonnet"`
- 1x research synthesizer (`role_type: judge`) → spawns with `model: "inherit"` (Opus)

---

## Tool Access

### Tools Available to Subagents

Tools are declared in the agent's YAML frontmatter `tools:` field. This is a declaration/documentation field — Claude Code enforces tool access based on the session and agent configuration.

**Tools currently used by GSD agents (from agent .md files):**
- `Read` — File reading (always included)
- `Write` — File writing
- `Edit` — File editing (targeted diffs)
- `Bash` — Shell command execution
- `Grep` — Content search (built-in tool, superior to `grep` in Bash)
- `Glob` — Pattern file matching
- `WebSearch` — Built-in web search
- `WebFetch` — URL content fetching
- `mcp__context7__*` — Context7 MCP tools (resolve-library-id, query-docs)

**For research gatherers (RSRCH-04, RSRCH-05, RSRCH-06):**
```
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
```
All tools needed — mgrep (Grep) for codebase, WebSearch for domain knowledge, Context7 for library docs.

**For synthesizer (read-focused):**
```
tools: Read, Write, Bash, Grep, Glob
```
No web search needed — synthesizer reads gatherer outputs, does not research.

### Tool Access Restrictions

There is **no per-agent tool restriction mechanism** observable in the codebase. The `tools:` frontmatter field is declarative/documentary, not enforced by Claude Code's runtime.

Practical restriction is done through agent instructions ("You use X tool for Y purpose") rather than hard access controls.

### mgrep as a Skill

`mgrep` is NOT a tool in the Claude Code sense. It is referenced in requirements as a project skill (RSRCH-04). Looking at the skill pattern in GSD:

- Skills live in `.agents/skills/` directory
- Each skill has a `SKILL.md` (index) and `rules/*.md` files
- Skills are loaded by agents via `<project_context>` instructions, not as registered tools

**Confirmed from executor agent:** "Check `.agents/skills/` directory if it exists: List available skills, read SKILL.md for each skill."

The Grep tool (built-in) is the actual implementation vehicle for mgrep-like search. The skill provides usage patterns and conventions, not a different executable. Gatherers would use the built-in `Grep` tool following any mgrep conventions defined in `.agents/skills/`.

---

## File System Layout

### Where v2 Agent Definitions Live

**Current v1 layout (confirmed from codebase):**
```
~/.claude/agents/          # Global — available to all projects
  gsd-executor.md
  gsd-planner.md
  gsd-research-synthesizer.md
  ... (11 files total)
```

**v2 layout for new research agents (from plan 02-01 `files_modified`):**
```
{project_root}/agents/     # Project-local agents
  gsd-research-domain.md
  gsd-research-system.md
  gsd-research-intent.md
  gsd-research-tech.md
  gsd-research-edges.md
  gsd-research-prior-art.md
  gsd-research-synthesizer.md  # REPLACES v1 global version
```

**Key observation:** Plan 02-01 places new agent files at `agents/` in the project root (relative paths in `files_modified`), not in `~/.claude/agents/`. This means v2 agents are project-local to this get-shit-done-pe repo, which is the development environment.

When the tool ships, the final agent files will presumably move to `~/.claude/agents/` as part of the GSD installation. During development, project-local overrides the global.

### Agent Definition Loading Mechanism

Claude Code agent loading priority (inferred from patterns, MEDIUM confidence):
1. Project-local `.claude/agents/` directory (NOT `agents/` at root)
2. Global `~/.claude/agents/` directory

**Issue:** The plan places agents at `agents/` (project root), not `.claude/agents/`. Two possibilities:
1. Claude Code checks both `agents/` and `.claude/agents/` — needs verification
2. The intent is that these files eventually ship to `~/.claude/agents/` as part of GSD installation

Looking at how v1 agents are referenced in the workflow: `subagent_type="gsd-executor"` resolves to `~/.claude/agents/gsd-executor.md`. For v2 agents to be spawnable, they must be in a location Claude Code searches.

**Safest interpretation:** During Phase 2 development, agents written to `agents/` are the source-of-truth definition files for this project's codebase. They will be tested via the `gather-synthesize.md` workflow which will reference them by path using the "First, read {agent_path}" pattern rather than `subagent_type`.

### @file References vs subagent_type

Two distinct loading patterns exist in current GSD code:

**Pattern A: subagent_type (role loading)**
```
Task(
  subagent_type="gsd-executor",
  prompt="..."
)
```
Agent is loaded as a system role by Claude Code. Works only if agent is in `~/.claude/agents/` or project `.claude/agents/`.

**Pattern B: First-read instruction (prompt injection)**
```
Task(
  subagent_type="general-purpose",
  prompt="First, read /Users/philliphall/.claude/agents/gsd-project-researcher.md for your role and instructions.
  ..."
)
```
Agent definition is injected via Read tool at runtime. Works regardless of agent file location. Used in new-project.md for research agents.

**Phase 2 implication:** The gather-synthesize.md workflow should use Pattern B for spawning agents, since new v2 agents live in `agents/` (project-local, not `~/.claude/agents/`). The orchestrator passes the agent path in the prompt: `"First, read {agent_path} for your role."` — exactly matching the existing pattern in new-project.md.

---

## Parallel Execution Constraints

### Spawning 6 Agents in Parallel

The pattern is: issue all 6 Task calls in a single response, Claude Code runs them concurrently, orchestrator waits for all to complete.

**Confirmed viable:** new-project.md spawns 4 in parallel. Going to 6 is a quantitative, not qualitative, change. No known limit preventing this.

**Each gatherer:**
- Gets fresh 200k context window
- Writes output to a specific file path (e.g., `research-domain.md`, `research-tech.md`)
- Returns a completion marker string

### How Orchestrator Collects Results from 6 Parallel Agents

The orchestrator does NOT receive agent output directly. Collection pattern:

1. After all 6 Task calls complete (Claude Code signals completion)
2. Orchestrator checks each expected output file exists and is non-empty
3. Orchestrator builds a manifest: `{agent_name: "success" | "failed"}` based on file presence
4. Orchestrator passes output file paths + manifest to synthesizer in its prompt

This is precisely the pattern described in Plan 02-02 for the gather-synthesize workflow.

**File path convention for research outputs (inferred from plan structure):**
```
.planning/phases/{phase}/{capability-or-feature}/
  research-domain.md
  research-system.md
  research-intent.md
  research-tech.md
  research-edges.md
  research-prior-art.md
  research-synthesis.md     # synthesizer output
```

### Failure Handling

Per CONTEXT.md locked decision:
> "Failure handling: retry failed agent once, then proceed with partial results; synthesizer notes the gap"

**Implementation pattern (from plan 02-02):**
1. After initial gather: check each output path exists
2. If missing: retry that specific gatherer once (same Task call, same parameters)
3. If still missing after retry: mark as `"failed"` in manifest
4. Continue with synthesizer — pass manifest alongside available outputs
5. Synthesizer output explicitly notes which dimensions had gaps

**Orchestrator failure check:**
```bash
# Check if output file exists and is non-empty
[ -s "$output_path" ] && echo "success" || echo "failed"
```

### What Happens When One of 6 Agents Fails

The critical design decision (from CONTEXT.md): **no quality gate between gatherers and synthesizer**. The synthesizer is the quality filter.

If agent X fails:
- Manifest marks it as `"failed"`
- Synthesizer receives 5 outputs + manifest noting 1 gap
- Synthesizer's "Gaps" section documents the missing dimension
- Synthesizer recommends: spike / risk-accept / defer based on confidence x impact

**The synthesizer MUST receive the manifest** so it knows whether a dimension is genuinely absent vs the gatherer produced no findings. This is a structural requirement, not optional.

### Synthesizer Access to All 6 Outputs

The synthesizer prompt includes:
1. Its agent definition (via first-read pattern)
2. Core context (same as gatherers)
3. Explicit list of all 6 output file paths
4. Manifest (success/failed status per gatherer)

The synthesizer then uses the `Read` tool to load each output file. It does NOT receive them inline — that would bloat the prompt. This is consistent with the "pass paths, not content" principle observed throughout GSD.

---

## YAML Frontmatter Parsing

### js-yaml Availability

`js-yaml@4.1.1` was installed in Phase 1 (FOUND-03). It is available in `get-shit-done/bin/` via `bin/package.json`.

**Confirmed from frontmatter.cjs:**
```javascript
const yaml = require('js-yaml');
```

This is the Phase 1 deliverable — the hand-rolled parser was replaced with js-yaml.

### Parsing Agent YAML Frontmatter

The existing `extractFrontmatter(content)` function in `frontmatter.cjs` can parse any markdown file with YAML frontmatter:

```javascript
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  const yamlStr = match[1];
  try {
    const result = yaml.load(yamlStr, { schema: yaml.FAILSAFE_SCHEMA });
    if (result == null || typeof result !== 'object') return {};
    return result;
  } catch (err) {
    process.stderr.write(`Warning: YAML parse error: ${err.message}\n`);
    return {};
  }
}
```

**FAILSAFE_SCHEMA behavior:** All values remain as strings. This means:
- `role_type: executor` → `fm.role_type === "executor"` (string comparison)
- `reads: [core-context, capability-context]` → parsed as array of strings
- Boolean-looking values (`true`, `false`) → stay as strings under FAILSAFE_SCHEMA

**Impact for Plan 02-03:** `resolveModelFromRole()` must use string comparison:
```javascript
const roleType = fm.role_type;  // "executor" or "judge" as strings
```

### Required Fields for v2 Agent Frontmatter

From plan 02-01 schema:
```yaml
---
name: gsd-{role}           # string
description: ...           # string
tools: ...                 # string (comma-separated) OR list
color: blue                # string
role_type: executor|judge  # NEW in v2 — read by resolveModelFromRole()
reads: [...]               # list of strings
writes: [...]              # list of strings
---
```

The `tools:` field in agent frontmatter may be either a YAML inline sequence or a comma-separated string — existing agents use comma-separated strings (e.g., `tools: Read, Write, Bash`). Under FAILSAFE_SCHEMA, this stays as a string and Claude Code parses it internally.

The `reads:` and `writes:` fields with bracket notation (`[core-context, capability-context]`) will parse as YAML sequences under FAILSAFE_SCHEMA. `fm.reads` will be an array `["core-context", "capability-context"]`.

---

## Hard Constraints (Cannot Change)

1. **CommonJS only** — `get-shit-done/bin/lib/` uses `.cjs` with `require()`. No ESM.

2. **Model values** — Only `"sonnet"`, `"haiku"`, `"inherit"` valid in Task `model` parameter. Never pass `"opus"` directly.

3. **`"inherit"` for Judge role** — Opus-tier behavior must use `"inherit"` to avoid version policy conflicts.

4. **Backward compatibility** — v1 agents without `role_type` must continue working via `resolveModelInternal()` fallback. Cannot break existing agent resolution.

5. **FAILSAFE_SCHEMA** — `extractFrontmatter()` uses `yaml.FAILSAFE_SCHEMA` which returns all values as strings. String comparison is required for `role_type` checks.

6. **File-based result collection** — Orchestrator cannot receive agent output directly in context. Results must come via files on disk.

7. **Agent spawning pattern** — New agents at `agents/` (project root) cannot use `subagent_type` for direct loading. Must use "First, read {agent_path}" injection pattern.

8. **No quality gate between gatherers and synthesizer** — CONTEXT.md locked decision. Synthesizer is the sole quality filter.

9. **No step-by-step execution logic in agent definitions** — Per CONTEXT.md: agents are goal-only definitions, not execution scripts. No "Step 1... Step 2..." in agent bodies.

10. **Context provided by orchestrator, not fetched by agent** — AGNT-02: agents receive context at spawn, don't self-select inputs. No "read STATE.md" instructions in agent definitions.

---

## Soft Constraints (Can Work Around)

1. **~1500 token target per definition** — The synthesizer is allowed up to ~2000 tokens. If a gatherer's output contract genuinely requires more, the target can flex slightly (up to ~2000 tokens maximum).
   - Workaround: Trim explanatory prose, keep role/goal/success/scope/citation sections tight.

2. **Agent file location** — Current plan puts agents at `agents/` root, not `~/.claude/agents/`. This affects `subagent_type` resolution.
   - Workaround: Use "First, read {absolute_path}" injection pattern consistently in gather-synthesize workflow. This works regardless of file location.

3. **6 parallel agents vs unknown Claude Code limit** — No documented hard cap observed, but unknown limits may exist.
   - Workaround: If parallel spawning of 6 fails, fall back to 3+3 in two sub-batches. The gather-synthesize workflow should be designed to handle partial batch execution.

4. **Manifest format** — No standardized manifest schema exists in v1. This needs to be defined.
   - Workaround: Simple JSON object `{agent_name: "success" | "failed" | "partial"}` written to a manifest file alongside research outputs.

5. **Tool declaration in `tools:` field** — Whether Claude Code actually restricts tool access based on `tools:` frontmatter field is unconfirmed.
   - Workaround: Treat `tools:` as documentation. Actual access is governed by session config. Write the field correctly as convention regardless.

6. **Context7 MCP availability** — Assumes Context7 MCP server is configured. If not available, `mcp__context7__*` calls will fail silently or return errors.
   - Workaround: Gatherer agents should degrade gracefully — "Context7 unavailable, using official docs / WebSearch instead."

---

## Confidence Assessment

| Area | Confidence | Sources | Notes |
|------|------------|---------|-------|
| Task tool parameters | HIGH | execute-phase.md, research-phase.md, new-project.md (live code) | Directly observed in production workflows |
| Model values | HIGH | model-profiles.md (explicit note on `inherit` vs `opus`), resolve logic in core.cjs | Well-documented |
| Context window (200k per agent) | HIGH | execute-phase.md `context_efficiency` section, explicit statement | Directly stated |
| Parallel agent limit (6+) | MEDIUM | New-project.md shows 4 in parallel, no documented cap | 6 is untested, consistent with pattern |
| @file vs subagent_type loading | HIGH | new-project.md uses "First, read" pattern for project-researcher agents | Directly observed |
| Tool access enforcement | LOW | `tools:` field exists in agent frontmatter, enforcement unconfirmed | No official Anthropic docs found on this |
| mgrep as skill pattern | HIGH | Executor/phase-researcher agents explicitly describe `.agents/skills/` loading | Directly in agent definitions |
| js-yaml availability | HIGH | frontmatter.cjs has `require('js-yaml')` — Phase 1 deliverable complete | Verified in codebase |
| FAILSAFE_SCHEMA string behavior | HIGH | frontmatter.cjs source code + Phase 1 research doc | All values as strings confirmed |
| Agent file loading path | MEDIUM | Claude Code documentation not directly available; inferred from patterns | "First, read" workaround makes this moot |

---

## Sources

- `/Users/philliphall/.claude/get-shit-done/workflows/execute-phase.md` — Task tool parameters, parallel spawning, failure handling, context efficiency
- `/Users/philliphall/.claude/get-shit-done/workflows/new-project.md` — 4-agent parallel research, "First, read" injection pattern, subagent_type="general-purpose"
- `/Users/philliphall/.claude/get-shit-done/workflows/research-phase.md` — Single researcher spawn pattern
- `/Users/philliphall/.claude/get-shit-done/references/model-profiles.md` — Model values, `inherit` vs `opus`, profile philosophy
- `/Users/philliphall/.claude/agents/gsd-executor.md` — Tool list, project_context skill loading
- `/Users/philliphall/.claude/agents/gsd-phase-researcher.md` — Context7 tool flow, tool priority
- `/Users/philliphall/.claude/agents/gsd-research-synthesizer.md` — v1 synthesizer structure
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` — js-yaml usage, FAILSAFE_SCHEMA, extractFrontmatter API
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` — MODEL_PROFILES, resolveModelInternal pattern
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/02-CONTEXT.md` — Locked decisions
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/02-01-PLAN.md` — Agent definition schema
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/02-02-PLAN.md` — Gather-synthesize workflow spec
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/02-03-PLAN.md` — resolveModelFromRole spec
- `/Users/philliphall/get-shit-done-pe/.planning/phases/01-foundation/01-RESEARCH.md` — Phase 1 findings (js-yaml migration, FAILSAFE_SCHEMA behavior)
