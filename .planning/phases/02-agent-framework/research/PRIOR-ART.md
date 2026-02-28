# Prior Art: Agent Framework Patterns

**Researched:** 2026-02-28
**Domain:** LLM multi-agent orchestration, agent definition formats, gather→synthesize patterns
**Confidence:** HIGH (primary findings from official Anthropic docs and Claude Code SDK)

---

## Claude Agent SDK

### Official Subagent Definition Format

**Confidence: HIGH** — from official Claude Code docs at `code.claude.com/docs/en/sub-agents`

Subagents are defined as Markdown files with YAML frontmatter. This is the canonical format:

```markdown
---
name: researcher
description: Researches domain for specific questions. Use when deep investigation needed.
tools: Read, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
model: sonnet
---

You are a domain researcher. When invoked, investigate [specific area] and return
structured findings with confidence levels.

[system prompt body continues in plain markdown]
```

**Required frontmatter fields:** `name`, `description`

**All supported frontmatter fields:**

| Field | Purpose | Default |
|-------|---------|---------|
| `name` | Unique ID (lowercase, hyphens) | required |
| `description` | When Claude delegates to this agent | required |
| `tools` | Allowlist of tools | Inherit all |
| `disallowedTools` | Denylist (removed from inherited) | none |
| `model` | `sonnet`, `opus`, `haiku`, or `inherit` | `inherit` |
| `permissionMode` | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` | `default` |
| `maxTurns` | Max agentic turns before stop | unlimited |
| `skills` | Skills to inject into context at startup | none |
| `mcpServers` | MCP servers available to this agent | none |
| `hooks` | Lifecycle hooks (PreToolUse, PostToolUse, Stop) | none |
| `memory` | Persistent memory: `user`, `project`, or `local` | disabled |
| `background` | Always run as background task | false |
| `isolation` | `worktree` for isolated git worktree | none |

**Storage locations by scope (priority order):**

```
--agents CLI flag         → session only (highest priority)
.claude/agents/           → project-scoped
~/.claude/agents/         → user-level (all projects)
plugin's agents/ dir      → plugin-distributed
```

### What the Body Section Controls

The markdown body after the frontmatter becomes the **entire system prompt** for the subagent. Subagents receive ONLY this system prompt plus basic environment details (working directory). They do NOT inherit the parent conversation's system prompt.

**Key architectural fact:** Subagents cannot spawn other subagents. Nesting is blocked by design to prevent infinite recursion. Only the main thread with `claude --agent` can spawn subagents.

### Tool Restriction Patterns

Two approaches for tool control:

```yaml
# Allowlist: only these tools
tools: Read, Grep, Glob, Bash

# Denylist: all inherited tools except these
disallowedTools: Write, Edit
```

To restrict which subagent types can be spawned from a coordinator:

```yaml
# Allowlist of spawneable agent types
tools: Task(worker, researcher), Read, Bash

# Unrestricted spawning
tools: Task, Read, Bash

# No spawning at all (omit Task from tools list)
tools: Read, Bash
```

### System Prompt Modification (SDK API Level)

**Confidence: HIGH** — from `platform.claude.com/docs/en/agent-sdk/modifying-system-prompts`

Four approaches for SDK-level system prompt management:

1. **CLAUDE.md files** — project-level instructions, auto-loaded with `settingSources: ['project']`
2. **Output styles** — saved markdown configs in `~/.claude/output-styles/`
3. **`systemPrompt` with append** — `{type: "preset", preset: "claude_code", append: "..."}`
4. **Custom `systemPrompt` string** — full replacement; loses built-in tool context

**Default SDK behavior:** Minimal system prompt only (essential tool instructions, no Claude Code coding guidelines, no project context). Must opt-in to `claude_code` preset for full feature set.

**CLAUDE.md is NOT auto-loaded** by the `claude_code` preset — must explicitly set `settingSources: ['project']` in code.

---

## Anthropic Multi-Agent Patterns

### Official Orchestrator-Worker Architecture

**Confidence: HIGH** — from `anthropic.com/engineering/multi-agent-research-system`

Anthropic's own research system uses:

```
Lead Agent (Opus) — decomposes queries, develops strategy, spawns subagents
    │
    ├── Subagent 1 (Sonnet) — parallel worker, isolated context window
    ├── Subagent 2 (Sonnet) — parallel worker, isolated context window
    ├── Subagent 3 (Sonnet) — parallel worker, isolated context window
    └── Subagent N (Sonnet) — as needed based on complexity
```

**Empirical findings from Anthropic's deployment:**
- Token usage explains 80% of performance variance
- Opus lead + Sonnet subagents outperformed single-agent Opus by 90.2%
- Complex research: 10+ subagents; simple fact-finding: 1 agent with 3-10 tool calls
- Cut research time by up to 90% for complex queries via parallelization

**Each subagent receives at spawn time:**
- Specific objective
- Output format requirements
- Tool guidance (which tools to use and when)
- Clear task boundaries (what is out of scope)

### Long-Running Agent Pattern

**Confidence: HIGH** — from `anthropic.com/engineering/effective-harnesses-for-long-running-agents`

Two-role architecture for multi-session work:

```
Initializer Agent → sets up environment, creates feature_list.json, commits baseline
Coding Agent      → per-session worker, reads progress artifacts, implements single feature, marks complete
```

State persisted between sessions via:
- `claude-progress.txt` — session logs and completion status
- `feature_list.json` — structured requirements (200+ features for complex apps)
- Git history with descriptive commits
- `init.sh` for reproducible environment setup

**Scope constraint technique:** Feature-by-feature execution prevents one-shot failures. Agents are explicitly constrained to work on single features per session, mark only verified features complete.

### TeammateTool (Hidden Multi-Agent System)

**Confidence: MEDIUM** — from `paddo.dev/blog/claude-code-hidden-swarm/` (reverse engineering of Claude Code binary)

Anthropic built full multi-agent team infrastructure into Claude Code (feature-flagged off). Discovered patterns:
- `spawnTeam`, `requestJoin`, `approveJoin` — team lifecycle management
- `broadcast` — send messages to all agents simultaneously
- `approvePlan`, `rejectPlan` — hierarchical oversight workflow
- State in `~/.claude/teams/{team-name}/messages/{session-id}/`
- Agent identity via env vars: `CLAUDE_CODE_TEAM_NAME`, `CLAUDE_CODE_AGENT_ID`, `CLAUDE_CODE_AGENT_TYPE`

Feature-flagged off due to: cost multiplication, stability risks, safety concerns around multi-agent filesystem access.

---

## Gather→Synthesize Patterns

### Scatter-Gather (AWS Prescriptive Guidance)

**Confidence: HIGH** — from `docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns`

Scatter-gather is the distributed systems foundation for gather→synthesize:

```
1. Coordinator distributes subtasks to N parallel workers
2. Each worker reasons through its portion independently
3. Results written to common storage
4. Aggregator waits for ALL responses (key distinction from fan-out)
5. Aggregation step: merge, compare, synthesize into unified output
```

**Key distinction:** Unlike simple fan-out, scatter-gather is **coordinated** — it expects responses and applies logic to combine/compare/select results. Fan-out fires and forgets; scatter-gather gathers.

**Partial failure handling:** AWS pattern includes traceability, fault tolerance, and "optional result weighting or selection logic" for handling missing results. Synthesizer receives what it gets and applies weighting logic — doesn't fail the whole pipeline.

### MapReduce Analogy

**Confidence: HIGH** — well-established distributed computing pattern

```
Map phase:    N parallel LLM calls, each processes independent subtask
Reduce phase: Single aggregation LLM synthesizes all Map outputs
```

For GSD research: Map = 6 parallel researchers, Reduce = 1 synthesizer.

**Performance data:** Parallel agents with early stopping achieves 1.8x speedup vs sequential. Anthropic's system: up to 90% time reduction for complex queries.

### Fan-Out/Fan-In in Agent Frameworks

**Confidence: HIGH** — from Google ADK docs and multiple framework sources

```python
# Google ADK implementation pattern (conceptual)
ParallelAgent(
    sub_agents=[
        SecurityAuditor(),
        StyleEnforcer(),
        PerformanceAnalyst()
    ]
)
→ SynthesizerAgent(input=all_outputs)
```

**When this pattern applies:** Tasks with no inter-dependencies between workers. Results can be independently generated and later synthesized.

### Partial Failure Handling Approaches

**Confidence: MEDIUM** — from multiple framework sources

| Approach | Behavior | When to Use |
|---------|---------|------------|
| Fail-all | Abort entire gather if any agent fails | High interdependence, all results required |
| Retry-once | Retry failed agent once, then proceed | Default for GSD (matches CONTEXT.md decision) |
| Proceed-with-gap | Synthesizer notes gap, partial results used | Most resilient, requires synthesizer to handle missing dimensions |
| Result-weighting | Weight present results higher, note absent | Complex synthesis with quality scoring |

**GSD decision (from CONTEXT.md):** Retry failed agent once, then proceed with partial results. Synthesizer notes the gap. This matches "proceed-with-gap" with a retry buffer — correct choice for parallel research.

**Synthesizer responsibility under partial failure:** Must explicitly note which research dimension is absent and caveat any findings that would have relied on that dimension.

---

## Agent Definition Formats: Comparison

### Claude Agent SDK (Official)

```markdown
---
name: agent-name
description: When Claude should use this agent. Used for auto-delegation.
tools: Read, Grep, Glob
model: sonnet
---

[System prompt body in plain markdown]
Role, goal, behavior, output format.
```

**Token profile:** Frontmatter ~50-150 tokens. Body is the system prompt — can be any size. Target 1500 tokens per GSD's "goldilocks" target.

**Strengths for GSD:**
- Native to Claude Code — no framework overhead
- Tool restriction built into format
- Model selection per-agent
- Clean markdown body = readable system prompts
- Stored in `.claude/agents/` — project-scoped, version-controllable

**Weaknesses:** No explicit goal/success-criteria fields in frontmatter (must go in body).

### CrewAI (Role/Goal/Backstory Model)

```yaml
researcher:
  role: "{topic} Senior Data Researcher"
  goal: "Uncover cutting-edge developments in {topic}"
  backstory: >
    You're a seasoned researcher with a knack for uncovering the latest
    developments in {topic}. Known for ability to find relevant information.
  tools: [WebSearchTool]
  llm: gpt-4
  verbose: true
```

**Full definition:** 24 configurable parameters including `max_iter`, `max_rpm`, `max_execution_time`, `reasoning`, `memory`, `knowledge_sources`, `system_template`, `prompt_template`, `response_template`.

**Token profile:** Minimal = 3 fields (~200 tokens). Full = 24 parameters, significant overhead.

**Problems for GSD:**
- Role/goal/backstory is narrative — not precision-oriented
- 24 parameters = over-engineering. YAGNI violation.
- YAML in separate config file = context-context disconnect
- Framework lock-in (Python dependency)
- Variable substitution `{topic}` at runtime = fragile

### LangChain/LangGraph (Graph Node Model)

```python
# Agent as graph node — no standalone definition file
AgentNode(
    prompt=system_prompt,
    tools=[search, read],
    model=llm,
    state_schema=TypedDict(...)  # typed state passed through graph
)
```

**Token profile:** System prompt is arbitrary string. Graph structure adds framework overhead.

**Problems for GSD:**
- No standalone definition file — agent is code, not configuration
- Graph state typing creates tight coupling between agents
- Requires LangChain runtime
- "Graph" mental model doesn't match GSD's sequential orchestration

### AutoGen (Conversational Agent Model)

```python
AssistantAgent(
    name="researcher",
    model_client=model_client,
    system_message="You are a math expert.",
    description="A math expert assistant"
)
```

**Token profile:** Minimal (~50 tokens for simple system_message). Full config adds model, tools, memory.

**Strengths:** Simple. Direct. Close to raw API.

**Problems for GSD:**
- No file-based definition format (code-only)
- Conversational model assumes back-and-forth — GSD agents do one-shot work
- Microsoft framework, not Anthropic-native
- No tool restriction syntax equivalent

### Minimal Markdown (GSD v1 Pattern)

GSD v1 uses XML-structured prompts injected at spawn time:

```markdown
<objective>
Investigate issue: {issue_id}
Summary: {issue_summary}
</objective>

<symptoms>
expected: {expected}
actual: {actual}
</symptoms>

<mode>
goal: find_and_fix
</mode>
```

**Token profile:** ~300-600 tokens for spawn prompt. Agent definition itself (~2000-5000 tokens) lives in `~/.claude/agents/`.

**Current GSD agent pattern:** Two-layer separation:
1. Agent definition (`~/.claude/agents/gsd-planner.md`) — role, methodology, tools, output format
2. Spawn prompt (from template) — phase-specific context injected at invocation

**What works:** Clear separation of "what agent knows" (definition) vs "what it needs for this task" (spawn context).

**What needs changing for v2:** Spawn prompts use XML but no formal goal/success structure. Definitions are large (~50KB for planner) — potentially over-specified.

---

## Context Injection Approaches

### Anthropic's Recommended Layer Model

**Confidence: HIGH** — from `anthropic.com/engineering/effective-context-engineering-for-ai-agents`

Anthropic's context engineering framework (published Sept 2025):

> "The smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

**Layer model:**

```
System prompt     → agent role, constraints, output format
Tool definitions  → enable environmental interaction
Examples          → demonstrate expected behavior
Message history   → interaction continuity
External memory   → persistent state across resets
```

**System prompt "Goldilocks zone":**
- Too brittle: Hardcoded logic, maintenance burden
- Too vague: Assumes shared context, produces generic output
- Target: Specificity balanced with flexibility

**Recommended organization with XML/Markdown sections:**
```markdown
## Background Information
[Role and scope]

## Instructions
[How to approach the task]

## Tool Guidance
[When and how to use specific tools]

## Output Description
[What to produce and in what format]
```

**Just-in-time vs pre-loaded context:**
- Pre-loading all context: Fast but risks stale data and irrelevant overload
- Just-in-time retrieval: Slower but agents discover relevant context via tools
- Hybrid (recommended): Load essential context upfront, enable exploration via tools

This directly maps to GSD's decided pattern: orchestrator injects core context at spawn, agents use Grep/Glob/Read for additional discovery.

### Agent Skills (Anthropic's Modular Context System)

**Confidence: HIGH** — from `anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills` (Oct 2025, open standard Dec 2025)

Agent Skills are directories with a `SKILL.md` file:

```
.agents/skills/
└── typescript-conventions/
    ├── SKILL.md          ← entry point (name + description)
    ├── rules/
    │   └── naming.md
    └── references/
        └── examples.md
```

**SKILL.md format:**

```markdown
---
name: typescript-conventions
description: Team TypeScript coding conventions and patterns
---

[Step-by-step guidance...]
```

**Progressive disclosure pattern:**
1. Name + description loaded at startup (lightweight index)
2. Full SKILL.md loaded when task is relevant
3. Bundled files referenced as needed

Skills vs system prompts:
- System prompt: Always present, static, baseline
- Skills: Activated dynamically based on task relevance, composable, shareable

**Applicability to GSD v2:** GSD already uses a skill-like pattern with `.agents/skills/` directories (seen in gsd-phase-researcher agent). The v2 agent framework can formalize this. Research agents that need domain knowledge can load relevant skills at spawn time via the `skills` frontmatter field.

### RAG vs Structured Context Injection

**Confidence: HIGH** — from multiple sources including Anthropic context engineering article

| Approach | When to Use | When to Avoid |
|---------|------------|--------------|
| Vector DB / semantic search | 10,000+ documents, fuzzy matching needed | Small codebases, structured data |
| MCP (external APIs) | Live external data, real-time sources | Static project context |
| Agent Skills | Task-specific best practices, repeatable workflows | One-off context |
| Structured injection at spawn | Project state, capability/feature hierarchy | Large arbitrary documents |
| Just-in-time (grep/glob) | Unknown location, exploratory | Known paths, time-sensitive |

**GSD conclusion from REQUIREMENTS.md Out-of-Scope:** "Vector database / embeddings for context — STATE.md discipline beats non-deterministic retrieval." This aligns with Anthropic's own finding that agentic, deterministic retrieval via grep/glob often outperforms semantic search for codebase navigation.

---

## Model Routing Patterns

### Anthropic's Empirical Finding: Opus Lead + Sonnet Workers

**Confidence: HIGH** — from `anthropic.com/engineering/multi-agent-research-system`

Anthropic tested configurations and found:
- Opus lead + Sonnet subagents: 90.2% better than single-agent Opus alone
- Token usage explains 80% of performance variance
- Smaller models on subagent tasks (where context is scoped) outperform larger models with full context

**Mechanism:** Subagents operate with isolated, scoped context windows. A Sonnet with focused context frequently outperforms an Opus swimming in noise.

This validates GSD's Executor/Judge split — not arbitrary, grounded in Anthropic's measured results.

### Tiered Model Strategy (Industry Pattern)

**Confidence: MEDIUM** — from multiple framework sources, LLM routing research

```
Simple/routine tasks  → Haiku   (fast, cheap, sufficient)
Standard work tasks   → Sonnet  (capable, cost-effective)
Judgment/validation   → Opus    (highest capability, expensive)
```

Cascading router pattern: sequential LLM invocations in order of increasing cost; accept first that passes a quality judge criterion. Research shows 5x cost savings at zero performance degradation when judge is >80% reliable.

**GSD's model allocation (from CONTEXT.md):**

```
Orchestration:  Sonnet (Executor)
Chat/Q&A:       Opus (Judge)
Research:       6x Sonnet (Executor) → Opus (Judge: synthesize)
Plan:           Sonnet (Executor) → Validate (CLI) → Q&A Opus (Judge)
Execute:        Sonnet (Executor) → Review Opus (Judge)
Docs:           Sonnet (Executor) → Review Opus (Judge)
```

This maps cleanly onto Anthropic's empirical findings. Sonnet does the work; Opus validates the judgment. The rule "hardcoded, not configurable" is correct — the routing decision itself should not be a variable that breaks the pipeline.

### Role Declaration in Agent Definitions

The `model` field in Claude Agent SDK frontmatter is the implementation mechanism:

```yaml
# Executor agent
model: sonnet

# Judge agent
model: opus

# Explore/fast agents
model: haiku
```

**Design insight:** Agent definitions should declare model intent (`model: sonnet`) rather than have the orchestrator override at spawn time. This keeps the allocation decision in the definition where it's visible and version-controlled.

---

## Scope Constraint Techniques

### Positive Framing (Constitutional AI Alignment)

**Confidence: HIGH** — from Anthropic Constitutional AI research

From Constitutional AI research (Anthropic, 2022, with 2025 follow-ups): **Positively framed behavior-based principles align more closely with human preferences than negatively framed or trait-based principles.**

The practical finding: "Do X" outperforms "Don't do Y" for constraining model behavior. This is the empirical basis for GSD's CONTEXT.md decision to use positive framing.

**Implementation:** System prompts should specify:
- What the agent IS (role)
- What the agent ACHIEVES (goal)
- What success LOOKS LIKE (criteria)

**Not:** Don't hallucinate, don't exceed scope, don't make things up.

### Mandatory Citations as Constraint Mechanism

**Confidence: MEDIUM** — from GSD v1 pattern and alignment research

Requiring citations (file paths, URLs, code snippets) for every claim serves two purposes:
1. Forces agent to ground claims in evidence
2. Automatically exposes unsupported claims (citation missing = claim suspect)

This is a structural constraint — doesn't rely on the model being told "be accurate." Instead, the output format makes accuracy verifiable.

**Implementation:** Define citation format in system prompt body:
```
Every claim must reference:
- File paths: @src/path/to/file.ts (line N)
- URLs: https://...
- Code snippets: [exact excerpt]
```

### Scope Boundaries via Goal Specification

**Confidence: HIGH** — from Anthropic long-running agent patterns

Scope creep prevention via feature-by-feature execution (from Anthropic's harness research): Agents constrained to "work on single features per session, mark only verified features complete." The constraint is in the goal, not in a prohibition list.

**Applied to GSD research agents:** Each researcher receives ONE specific dimension (Domain Truth, Existing System, etc.). The constraint is the role definition — not "don't research other areas" but "you are the [dimension] researcher, your job is [specific question]."

### Downstream Consumer Awareness

**Confidence: HIGH** — observed pattern in GSD v1 agent definitions

GSD v1 agents document their downstream consumer explicitly:

```markdown
<downstream_consumer>
Your RESEARCH.md is consumed by gsd-planner:

| Section | How Planner Uses It |
|---------|---------------------|
| Standard Stack | Plans use these libraries, not alternatives |
| Common Pitfalls | Verification steps check for these |
```

This is a powerful scope mechanism: agents don't need to know everything, just what the next stage needs. Knowing the consumer shapes what matters and what doesn't.

### Quality Gate Placement

**Insight from GSD CONTEXT.md:** "No quality gate between agents and synthesizer — synthesizer handles quality filtering."

This is correct for parallel research. Per-agent quality gates would:
- Add latency to every agent completion
- Create false blocking on valid but imperfect research
- Duplicate synthesis work

The synthesizer IS the quality gate. It handles gap-noting, conflict resolution, and confidence calibration.

---

## Applicable to GSD

### Claude Agent SDK is the Right Native Format

The Claude Agent SDK's YAML frontmatter + markdown body format is the exact target for GSD v2 agent definitions. Reasons:
- Native to the Claude Code runtime (no framework dependency)
- Tool restriction at definition level (explicit allowlisting)
- Model selection per-agent (the `model` field)
- Version-controllable in `.claude/agents/`
- Body = system prompt, directly edited as markdown
- `description` field drives automatic delegation (orchestrator can invoke by name or Claude auto-delegates)

**For GSD's ~1500 token target:** YAML frontmatter (~100-200 tokens) + body (~1200-1400 tokens) hits the target naturally. Compare to CrewAI full definition (24 parameters + backstory narrative) which bloats easily past 3000 tokens.

### Goal-Driven Agent Design Matches Anthropic's Pattern

Anthropic's subagent design: each subagent receives "specific objectives, output formats, tool guidance, and clear task boundaries." This is exactly GSD's AGNT-01 requirement: "Agent definitions are goal-driven with artifact awareness."

The key alignment:
- Anthropic: "lead agent decomposes queries, describes subtasks to subagents"
- GSD: "orchestrator decides what context/artifacts to pass — agents don't self-select their inputs"

Both place the decomposition and context-selection responsibility on the orchestrator, keeping agents lean.

### 6-Dimension Research Maps to 6-Worker Scatter-Gather

```
Gather phase (6 Sonnet agents in parallel):
Domain Truth → Existing System → User Intent → Tech Constraints → Edge Cases → Prior Art

Synthesize phase (1 Opus agent):
Consensus → Conflicts → Gaps → Constraints Discovered → Recommended Scope
```

This is textbook scatter-gather. The synthesizer waits for all 6 results (with retry-once for failures), then applies logic to merge/compare/select. The 5-section output structure is the aggregation logic.

### Context Injection: Orchestrator-Owned, Spawn-Time

Anthropic's pattern: "Fresh subagents with clean contexts maintain continuity through careful handoffs." GSD's pattern: "Workflow injects context at spawn time — agents stay simple, orchestrator owns context decisions."

These are identical. The mechanism in Claude Agent SDK: orchestrator fills a spawn prompt template and passes it to the subagent. The agent's system prompt (definition) contains role/methodology; the spawn prompt contains phase-specific context.

**Implementation:** Spawn prompts use `<planning_context>`, `<downstream_consumer>`, `<files_to_read>` XML blocks — already proven in GSD v1. Keep this pattern, formalize it.

### Model Allocation: Frontmatter Field

```yaml
# Research agents (Executor)
model: sonnet

# Synthesizer (Judge)
model: opus
```

The `model` field in agent frontmatter makes model allocation explicit and version-controlled. No runtime logic needed. Anthropic's research validates the Sonnet/Opus split empirically.

### Skills for Reusable Context

Agent Skills (`skills` frontmatter field) are the right mechanism for injecting domain-specific knowledge into research agents. If research agents need GSD project conventions injected at startup, define a `gsd-project-context` skill and list it in the agent definition.

---

## Not Applicable / Over-Engineering

### CrewAI's 24-Parameter Agent Definition

**Avoid:** `max_iter`, `max_rpm`, `max_execution_time`, `reasoning`, `knowledge_sources`, `system_template`, `prompt_template`, `response_template`, `embedder`, etc.

Most of these are configurable at framework level because CrewAI doesn't trust the LLM to self-manage. GSD's agents don't need rate limiting or execution timeouts — the Claude runtime handles these. Each extra parameter is a future maintenance burden with no corresponding benefit.

**Keep:** Role, goal, tools, model. Everything else is noise for GSD's use case.

### LangChain's Graph Model

**Avoid:** Graph nodes, typed state passing, edge definitions, graph compilation.

LangGraph is right for stateful workflows with complex routing logic. GSD's research pipeline is simple scatter-gather — N parallel agents, one synthesizer. No graph needed. The "graph" would have 7 nodes and 6 edges, all of which are obvious without a framework.

### AutoGen's Conversational Model

**Avoid:** Multi-turn agent conversations, back-and-forth between agents.

AutoGen assumes agents negotiate via conversation. GSD agents do one-shot work: receive context, do task, return structured output. No negotiation. No conversation.

### RAG / Vector Embeddings for Context

**Avoid:** Vector database, semantic search, embeddings for project context retrieval.

As GSD REQUIREMENTS.md states: "Vector database / embeddings for context — STATE.md discipline beats non-deterministic retrieval." Confirmed by Anthropic's context engineering research: just-in-time retrieval via grep/glob is more reliable for structured codebases than semantic search.

### TeammateTool / Swarm Architecture

**Avoid:** Agent team management with `spawnTeam`, `requestJoin`, `broadcast`, `approvePlan`.

TeammateTool is Anthropic's feature-flagged implementation for fully autonomous multi-agent swarms. GSD's orchestrator is human-in-the-loop. The swarm model is designed for autonomous agents that coordinate without human oversight. Feature-flagged off for good reasons (cost multiplication, safety risks).

### Memory Field in Agent Definitions

**Avoid (for research agents):** The `memory` frontmatter field enables cross-session learning.

Research agents are stateless by design. Each research run should start fresh. Persistent memory would contaminate new research with stale findings from old projects. Only potentially useful for long-lived agents like the GSD orchestrator itself — and even then, STATE.md is the right mechanism.

### Role/Goal/Backstory Narrative

**Avoid:** "You're a seasoned researcher with 10 years of experience who is known for..."

Backstory adds narrative without constraint. CrewAI uses it to shape personality; GSD needs precision. A 3-sentence backstory consumes 100-200 tokens saying nothing actionable. Replace with: a specific goal statement, a defined output format, a success criterion.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Claude Agent SDK format | HIGH | Official `code.claude.com` docs, fetched directly |
| Anthropic multi-agent patterns | HIGH | Official engineering blog, fetched directly |
| Gather→synthesize (scatter-gather) | HIGH | AWS prescriptive guidance, multiple frameworks |
| CrewAI agent format | HIGH | Official `docs.crewai.com`, fetched directly |
| AutoGen minimal format | MEDIUM | Official docs + WebSearch cross-reference |
| LangGraph architecture | MEDIUM | Multiple WebSearch sources, consistent |
| Model routing patterns | MEDIUM | Multiple sources, Anthropic's empirical results HIGH |
| Constitutional AI / positive framing | HIGH | Official Anthropic CAI paper |
| Context engineering layers | HIGH | Anthropic's published framework (Sept 2025) |
| Agent Skills (SKILL.md) | HIGH | Official Anthropic engineering blog |
| Partial failure handling | MEDIUM | Multiple framework sources, no single authoritative reference |

---

## Sources

### Primary (HIGH confidence — official Anthropic documentation)

- [Building Agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) — agent architecture, tool access, context management
- [Create Custom Subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents) — canonical subagent definition format, all frontmatter fields, examples
- [Modifying System Prompts — Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/modifying-system-prompts) — CLAUDE.md, output styles, systemPrompt approaches
- [How Anthropic Built Their Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) — orchestrator-worker patterns, model allocation, performance data
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — initializer/coding agent pattern, scope constraints
- [Effective Context Engineering for AI Agents — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — layered context, Goldilocks zone, hybrid retrieval
- [Equipping Agents for the Real World with Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) — SKILL.md format, progressive disclosure

### Primary (HIGH confidence — official framework docs)

- [CrewAI Agents Documentation](https://docs.crewai.com/en/concepts/agents) — full 24-parameter definition, YAML format
- [AutoGen Agents Tutorial](https://microsoft.github.io/autogen/stable//user-guide/agentchat-user-guide/tutorial/agents.html) — AssistantAgent minimal format

### Secondary (MEDIUM confidence — verified via multiple sources)

- [Parallelization and Scatter-Gather Patterns — AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/parallelization-and-scatter-gather-patterns.html) — fan-out/fan-in implementation, partial failure handling
- [Context Engineering: RAG, MCP, and Agent Skills](https://smartscope.blog/en/blog/context-engineering-overview/) — layer model comparison
- [Claude Code's Hidden Multi-Agent System](https://paddo.dev/blog/claude-code-hidden-swarm/) — TeammateTool reverse engineering
- [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) — positive framing evidence
- [LLM As a Judge — Patronus AI](https://www.patronus.ai/llm-testing/llm-as-a-judge) — judge pattern best practices

### Internal (HIGH confidence — first-party GSD artifacts)

- `/Users/philliphall/.claude/agents/gsd-phase-researcher.md` — current v1 researcher definition
- `/Users/philliphall/.claude/agents/gsd-research-synthesizer.md` — current v1 synthesizer definition
- `/Users/philliphall/.claude/agents/gsd-planner.md` — current v1 planner definition
- `/Users/philliphall/.claude/get-shit-done/templates/planner-subagent-prompt.md` — spawn prompt pattern
- `/Users/philliphall/.claude/get-shit-done/templates/debug-subagent-prompt.md` — XML spawn context pattern
- `/Users/philliphall/.claude/get-shit-done/templates/phase-prompt.md` — plan format with context injection

---

*Researched: 2026-02-28*
*Phase: 02-agent-framework*
*Dimension: Prior Art*
