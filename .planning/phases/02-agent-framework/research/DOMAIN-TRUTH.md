# Domain Truth: Agent Framework First Principles

**Researched:** 2026-02-28
**Dimension:** RSRCH-01 — First-principles analysis
**Confidence:** HIGH (official Anthropic sources + direct SDK docs)

---

## Fundamental Truths

**Truth 1: An agent IS its system prompt.**
An LLM has no persistent identity or memory between invocations. The system prompt is not *configuration* — it IS the agent. Everything the agent knows about its role, goal, constraints, and acceptable behavior is determined entirely by what's in that prompt. A vague prompt produces a vague agent. A goal-focused prompt produces a goal-focused agent. There is no separation between "the agent" and "what it's told to be."

**Truth 2: Context windows are finite and competitive.**
Every token consumed by one piece of information displaces another. The Anthropic context engineering article states this explicitly: context is "the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome." This is not a performance concern — it's a reasoning quality concern. As context grows, model attention degrades ("context rot"). An agent loaded with everything available will reason worse than an agent loaded with only what it needs.

**Truth 3: Agents cannot self-select what they don't know they need.**
An agent can only work with what's in its context. If the orchestrator doesn't provide the capability description, the agent doesn't know it's operating within a capability. If the framing isn't injected, the agent can't ask the right questions for that framing. The corollary: orchestrators must own context decisions, not agents. Agents that try to dynamically gather context they weren't given will either hallucinate or waste turns.

**Truth 4: Goal clarity is the primary anti-drift mechanism.**
Agents receiving a goal ("ensure code meets the functional requirements") derive their own path to success. Agents receiving a checklist ("run linter, check types, review PR") follow the checklist and stop. For multi-step agentic tasks where the path isn't known in advance, goal-framing produces better results because the agent adapts to what it finds. Checklist-framing produces mechanical behavior that breaks at first deviation.

**Truth 5: The description field is the routing layer, not the identity layer.**
Per official Anthropic Agent SDK docs: "Claude uses each subagent's description to decide when to delegate." The `description` field is a classification signal for the orchestrator — it answers "when should I use this agent?" The `prompt`/system prompt answers "what should this agent do when invoked?" These are distinct concerns. Conflating them produces either an agent the orchestrator misroutes, or an agent that doesn't know its actual job.

**Truth 6: Parallel agents prevent anchoring bias.**
When one agent's findings are visible to another before the second agent reaches its own conclusions, the second agent anchors to the first. Parallel execution forces independent analysis. The synthesizer then sees N independent perspectives, not N perspectives polluted by mutual knowledge. This is documented in formal research (PARALLELMUSE, 2025): "aggregating compressed reasoning reports to mitigate the bias of majority-based selection."

**Truth 7: Synthesis is fundamentally different from gathering.**
A gather agent's job is to find and report evidence within its assigned dimension. A synthesizer's job is to weigh competing evidence, identify conflicts, assess implications, and recommend scope. These require different cognitive postures: gathering is investigative, synthesis is judicial. Assigning synthesis to a gather-class agent (same prompt, same approach) degrades quality. This is why the Executor/Judge model split exists.

**Truth 8: Subagent context is isolated by design.**
Per official Anthropic docs: "Subagents receive only this system prompt (plus basic environment details like working directory), not the full Claude Code system prompt." Subagents do not inherit parent context. This is a feature, not a limitation — it prevents context bleed and forces explicit context injection. The implication: every piece of context an agent needs must be deliberately placed there by whoever spawns it.

---

## Goal-Driven vs Task-Driven Analysis

### The Core Distinction

| Dimension | Goal-Driven | Task-Driven |
|-----------|-------------|-------------|
| What's specified | The desired outcome | The steps to take |
| Agent's job | Figure out HOW | Follow the list |
| Handles surprises | Adapts reasoning | Breaks or ignores |
| Output quality | Proportional to finding | Proportional to list completeness |
| Failure mode | Scope drift (manageable) | Missing real issues (silent) |

### Why Goal-Driven is Correct for LLM Agents

LLMs are trained on reasoning chains that move from objectives to methods, not methods to objectives. When given a goal, they ask "what would achieve this?" When given a checklist, they execute the checklist. For research agents, the checklist approach is catastrophic: a researcher executing "look for X, Y, Z" will not report W even if W is the most important finding. A researcher executing "find what matters for first-principles analysis of agent frameworks" will find W.

**Evidence from official Anthropic SDK documentation:**
The recommended `code-reviewer` subagent example uses goal-framed prompts:
```
"You are a senior code reviewer ensuring high standards of code quality and security."
[Goal statement]

"When invoked: Run git diff to see recent changes, Focus on modified files, Begin review immediately"
[Approach guidance — not exhaustive steps, but workflow orientation]
```

The prompt does NOT say: "Check for: naming, DRY, security, tests, performance." It says what success looks like and provides orientation. The agent determines what to inspect.

### Practical Application to GSD Agents

Goal-driven framing for research agents:
- **Bad (task):** "Search for official Anthropic documentation about agent definitions. Search for community patterns. Search for pitfalls."
- **Good (goal):** "Find the fundamental truths about this domain. Your findings will drive architecture decisions — report what is most true and most consequential, with evidence."

Goal-driven framing for the synthesizer:
- **Bad (task):** "Consolidate the 6 research reports into one document."
- **Good (goal):** "Your job is to determine what this phase should actually build. Weigh the evidence, surface conflicts, identify gaps, and recommend scope."

---

## Context Layering Principles

### The Hierarchy

```
Project goals (always present)
    └── Capability context (when within a capability)
            └── Feature context (when on a specific feature)
                    └── Framing context (debug / new / enhance / refactor)
                            └── Agent-specific context (what this agent needs)
```

Each layer ADDS specificity. No layer should repeat information from a parent layer (waste) or contradict it (confusion). An agent working on a specific feature knows the project's goals, the capability's purpose, the feature's requirements, the framing, and its own role — but it does NOT need to know about other capabilities or other features.

### The Minimum Context Principle

From Anthropic's context engineering guidance: "Instead of pre-loading all data, agents maintain lightweight references (file paths, links) and dynamically load relevant context during execution."

Applied to GSD agent definitions:
- Agents should not contain full pipeline descriptions (bloat)
- Agents should not contain information about other agents' roles (irrelevant)
- Agents should contain: their role, their goal, their success criteria, their output format, and the minimum orientation needed to start

The "~1500 tokens per definition" target in the CONTEXT.md is a Goldilocks constraint: small enough to leave context budget for actual work, large enough to be unambiguous about role and goal.

### What Belongs Where

| Context Type | Where It Lives | Injected By |
|--------------|----------------|-------------|
| Project goals | PROJECT.md | Orchestrator at spawn time |
| Capability description | CAPABILITY.md | Orchestrator at spawn time |
| Feature requirements | FEATURE.md | Orchestrator at spawn time |
| Framing-specific questions | Framing context block | Orchestrator based on active framing |
| Agent role + goal | Agent definition (system prompt) | Agent itself (baked in) |
| Prior agent results | Explicitly passed | Orchestrator (synthesizer only) |

The synthesizer is the ONLY agent that receives other agents' outputs as input. Gather agents work blind to each other — by design.

---

## Gather-Synthesize Principles

### Why Parallel Gather Works

**Independence:** Each gather agent investigates from a single dimension without knowing what others found. This prevents the first agent from setting a frame that all subsequent agents conform to.

**Coverage:** Six dimensions (Domain Truth, Existing System, User Intent, Tech Constraints, Edge Cases, Prior Art) partition the epistemic space of "what do we need to know before building X." Any research question maps onto at least one of these dimensions. Running all 6 guarantees no perspective is omitted by routing decision.

**Parsimony:** Each agent returns only findings relevant to its dimension. The synthesizer receives 6 focused reports rather than one sprawling report trying to cover everything.

**Research evidence:** The PARALLELMUSE framework (arxiv 2510.24698, 2025) demonstrates that parallel sub-task processing with independent aggregation outperforms serial information gathering on deep information-seeking tasks. The key mechanism: "condenses reasoning candidates into concise, structured reports that preserve only information relevant to answer derivation."

### Why Synthesis Must be Judicial (Judge Role)

A synthesizer doing synthesis well must:
1. Weigh conflicting evidence between agents (Domain Truth says X, Tech Constraints says not-X)
2. Evaluate relative confidence of findings
3. Determine what conflicts are blocking vs non-blocking
4. Assess gap severity (spike now vs risk-accept vs defer)
5. Recommend scope based on the full picture

This is fundamentally a judgment task, not an execution task. An Executor-class prompt ("summarize the 6 reports") produces an aggregation. A Judge-class prompt ("determine what we should actually build based on these findings") produces a recommendation. The CONTEXT.md is correct to assign synthesis to Opus.

### The 5-Output Synthesis Structure

The synthesis outputs 5 sections — each has a specific consumer:

| Section | Consumer | Why |
|---------|----------|-----|
| Consensus | Planner | Can build on this without reservation |
| Conflicts (P1-P3) | Planner + User | P1 blocks build; must resolve |
| Gaps (confidence × impact) | Planner + User | Determines what needs spike work |
| Constraints Discovered | Planner | Hard limits on solution space |
| Recommended Scope | Planner | Starting point for plan creation |

The annotation test from CONTEXT.md: "if the annotation doesn't alter what the next agent does, it's decoration." Applied to synthesis outputs: every element in every section must change what the planner does or decides. If a finding doesn't change planner behavior, it shouldn't be in the output.

### Completeness Argument for 6 Dimensions

| Dimension | What It Covers | Why It Can't Be Skipped |
|-----------|----------------|------------------------|
| Domain Truth | First principles, fundamental constraints | Prevents building on false premises |
| Existing System | What's already built, what would change | Prevents duplication, finds integration points |
| User Intent | What the requirements actually mean | Prevents building the wrong thing correctly |
| Tech Constraints | Feasibility, API limits, performance bounds | Prevents plans that can't execute |
| Edge Cases | Boundary conditions, failure modes | Surfaces hidden complexity early |
| Prior Art | Ecosystem patterns, existing solutions | Prevents reinventing solved problems |

Any subset of these leaves a blind spot. Skipping "Existing System" → builds duplicate code. Skipping "Edge Cases" → ships brittleness. The "all 6 always run" rule is correct because the cost of a missing dimension compounds downstream.

---

## Scope Constraint Principles

### Positive Framing Over Negative Lists

**Why positive framing works:**
Positive framing ("You are X with goal Y") gives the agent a coherent identity to reason from. When the agent encounters an ambiguous situation, it asks "what would an agent focused on Y do here?" and arrives at correct behavior.

Negative framing ("don't do X, don't do Y, never do Z") requires the agent to maintain a mental exception list. It does not provide reasoning infrastructure for novel situations — it only handles the cases the list explicitly covers. Every situation not in the list reverts to the default (often too broad).

**From Anthropic's context engineering guidance:**
"Be specific enough to guide behavior while remaining flexible." The Goldilocks zone is between over-specified brittle rules and vague guidance that assumes shared understanding. A well-formed goal statement hits this zone by default: it specifies what success looks like without prescribing every step.

**Practical example:**
- Negative: "Don't write code outside the feature scope. Don't modify files not listed. Don't make assumptions about requirements."
- Positive: "Your goal is to ensure the functional requirements are met as specified. You own the verdict on requirement fulfillment — every finding must be traceable to a specific requirement."

The positive version produces an agent that inherently stays scoped because its goal IS the scope.

### Mandatory Citations as Evidence-Gate

Mandatory citations ("every claim must reference specific file paths, code snippets, URLs, or artifacts") serve a structural function: they make hallucination detectable and prevention automatic.

**Mechanism:**
- A claim without a citation cannot be verified
- An unverifiable claim in a research context is useless
- An agent that knows every claim requires a citation will not make claims it cannot support
- Claims that require looking things up (files, URLs) anchor the agent to actual artifacts rather than trained assumptions

This is not primarily about quality control — it's about forcing the agent to do the investigation rather than recall. Research agents that can cite training knowledge without checking it will be stale, imprecise, or wrong. Citations force verification.

### No Quality Gate Between Gather and Synthesize

The decision not to filter gather outputs before synthesis is intentional. A pre-synthesis quality gate would:
1. Require a third type of agent (not just gather or judge)
2. Potentially discard findings the synthesizer would have weighted differently
3. Add latency to a parallel operation

The synthesizer IS the quality gate. It evaluates all 6 reports, notes when a gather agent produced weak findings (a gap in itself), and weights accordingly. Quality control happens at synthesis, not before.

---

## Anthropic/Claude Agent SDK Patterns

### Filesystem-Based Agent Definition Format

Official Anthropic Agent SDK documentation specifies subagents as Markdown files with YAML frontmatter, stored in `.claude/agents/`:

```markdown
---
name: agent-name
description: When Claude should delegate to this subagent (routing signal)
tools: Read, Glob, Grep
model: sonnet
---

You are [role]. When invoked, [goal statement].

[Approach guidance and success criteria]
```

**Key structural insight:** Two distinct fields serve two distinct purposes:
- `description` = routing signal (when should the orchestrator use this agent?)
- System prompt body = identity + goal + approach (what should the agent actually do?)

This matches the CONTEXT.md decision that agents know their "role, goal, and what success looks like."

### Required Frontmatter Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Unique identifier, lowercase + hyphens |
| `description` | Yes | Routing signal — when to delegate |
| `tools` | No | Allowlist; inherits all if omitted |
| `model` | No | `sonnet`, `opus`, `haiku`, `inherit` |
| `disallowedTools` | No | Denylist applied after inheritance |
| `maxTurns` | No | Hard limit on agentic turns |
| `permissionMode` | No | Permission level override |

**Context window note:** Subagents receive ONLY their own system prompt + basic environment (working directory). They do NOT inherit parent context. This confirms the CONTEXT.md principle: "orchestrator decides what context/artifacts to pass — agents don't self-select."

### Model Allocation Pattern (Confirmed by Official SDK)

Anthropic's own example from the subagents documentation:
```typescript
"security-reviewer": {
  model: isStrict ? "opus" : "sonnet"
}
```

The SDK natively supports per-agent model allocation. The GSD Executor/Judge pattern maps directly to the SDK's model field: Executor agents use `sonnet`, Judge agents use `opus`. This is not a GSD-specific invention — Anthropic's own examples show model selection based on task complexity/sensitivity.

### Context Management Pattern

From official context engineering guidance, the "just-in-time" pattern:
- Don't pre-load context; maintain lightweight references and load at runtime
- Agents keep lightweight identifiers (file paths) and pull relevant data when needed
- Avoids context bloat while maintaining access to all potentially-needed information

Applied to GSD: agent definitions contain pointers and instructions, not the full context. The orchestrator injects PROJECT.md, CAPABILITY.md, FEATURE.md at spawn time — not baked into the agent definition.

### Anti-Patterns Identified in Official Documentation

1. **Brittle over-specification:** "Avoid brittle, over-specified logic that reduces flexibility" — Anthropic's context engineering guidance
2. **Context dumping:** Pre-loading all relevant data instead of just-in-time retrieval causes context rot
3. **Nesting subagents:** Subagents cannot spawn other subagents (SDK hard constraint)
4. **Generic descriptions:** Vague descriptions mean the orchestrator misroutes tasks to wrong agents

### Capability-Driven vs Prescriptive Prompting

Anthropic's engineering blog describes their approach as "capability-driven design over prescriptive prompting":
- Provide tools and orientation
- Let the agent determine appropriate methods within constraints
- Verification mechanisms catch output quality rather than prescribing process

This directly supports the GSD goal-driven philosophy.

---

## Confidence Assessment

| Finding | Confidence | Source |
|---------|------------|--------|
| Subagent file format (frontmatter + body) | HIGH | Official Anthropic subagents docs |
| description = routing, prompt = behavior distinction | HIGH | Official Anthropic SDK API reference |
| Subagents receive ONLY own system prompt | HIGH | Official Anthropic subagents docs |
| Model field supports `sonnet`/`opus`/`haiku`/`inherit` | HIGH | Official Anthropic SDK docs |
| Context rot / degraded performance with token growth | HIGH | Anthropic context engineering article |
| Goldilocks zone for system prompts | HIGH | Anthropic context engineering article |
| Parallel agents prevent anchoring bias | MEDIUM | Research paper (arxiv 2510.24698) + logical inference |
| Synthesis as judicial vs execution task | MEDIUM | Logical inference from Executor/Judge pattern; confirmed by Anthropic's LLM-judgment examples |
| Positive framing > negative lists | MEDIUM | Anthropic context engineering guidance + prompt engineering literature |
| Mandatory citations as hallucination prevention | MEDIUM | Logical inference; consistent with citation-forces-verification principle |
| 6 dimensions covering epistemic space | MEDIUM | Logical argument (completeness) + consistent with parallel research patterns |

---

## Sources

**HIGH confidence (official sources):**
- [Agent SDK Overview — Anthropic](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Effective Context Engineering for AI Agents — Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Building Agents with the Claude Agent SDK — Anthropic Engineering](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)

**MEDIUM confidence (research + verified patterns):**
- [PARALLELMUSE: Agentic Parallel Thinking for Deep Information Seeking — arxiv 2510.24698](https://arxiv.org/pdf/2510.24698)
- [W&D: Scaling Parallel Tool Calling for Efficient Deep Research Agents — arxiv 2602.07359](https://arxiv.org/html/2602.07359)
- [Prompting Best Practices — Claude Docs](https://console.anthropic.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

---

*Phase: 02-agent-framework*
*Dimension: RSRCH-01 (Domain Truth)*
*Research completed: 2026-02-28*
