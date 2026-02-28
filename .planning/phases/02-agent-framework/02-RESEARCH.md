---
phase: 2
type: research
status: complete
researched: 2026-02-28
method: parallel-6-agent-synthesis
agents: domain-truth, existing-system, user-intent, tech-constraints, edge-cases, prior-art
---

# Phase 2: Agent Framework — Research

## Executive Summary

Phase 2 establishes the agent definition pattern used by ALL agents in GSD v2 and builds the first concrete agents using that pattern: the 6 research gatherers and 1 synthesizer. The framework must deliver three things: (1) a consistent definition format where every agent declares goal, inputs, outputs, and role type (executor/judge); (2) a context layering system where the orchestrator injects project/capability/framing context at spawn time without touching agent definitions; (3) a reusable gather→synthesize primitive that runs 6 parallel agents and consolidates results. Only research agents are fully built here — planner, reviewer, executor, and documenter agents come in Phases 3-5 using this pattern.

## User Constraints

### From CONTEXT.md — Locked Decisions

- Clean break from v1 agent definitions — new from scratch, no backward compatibility
- Target ~1500 tokens per agent definition — goldilocks sizing
- Definition format is Claude's discretion, grounded in Anthropic guidance
- Goal-driven agents: know role, goal, success criteria — orchestrator owns context/artifact decisions
- Workflow injects context at spawn time — agents stay simple
- Core context hierarchy: project goals (always) → capability details (when scoped) → feature details (when on a feature)
- 6 research dimensions always run (domain truth, existing system, user intent, tech constraints, edge cases, prior art)
- All research agents have access to all tools (mgrep, web search, Context7)
- Synthesize phase outputs 5 sections: consensus, conflicts (P1-P3), gaps (confidence x impact matrix), constraints discovered, recommended scope
- Gather→synthesize is a reusable framework primitive (review and planning reuse it)
- Failure handling: retry once, proceed with partial results, synthesizer notes gap
- Executor/Judge model allocation: Executor = Sonnet (does work), Judge = Opus (validates/synthesizes)
- Hardcoded mapping, not configurable
- Scope constraints use positive framing (role, goal, success criteria) not negative lists
- Mandatory citations: every claim references file paths, code snippets, URLs, or artifacts
- No quality gate between gatherers and synthesizer — synthesizer handles filtering

### Claude's Discretion

- Agent definition file format (markdown vs YAML vs other)
- Whether definitions are standalone or composable
- Framing-specific question set organization
- Internal structure of the gather→synthesize primitive

### Deferred (Out of Scope)

- Planner agent specifics → Phase 3
- Reviewer agent specifics → Phase 4
- Documentation agent specifics → Phase 5
- Implementation/executor agent definitions → Phase 3+

## Key Findings

### 1. Agent Definition Format — Markdown with YAML Frontmatter

**Recommendation:** Markdown with YAML frontmatter. This is the Anthropic-endorsed format for Claude Code subagents.

**Evidence:**
- Claude Code docs specify agent files as `.md` with YAML frontmatter containing `name`, `description`, `tools`, and optional `color`
- The `--agents` CLI flag accepts JSON with `description`, `prompt`, `tools`, `model`, `skills`, `maxTurns` — the file-based equivalent maps 1:1
- v1 GSD already uses this pattern (11 agents in `agents/` directory)
- Claude Code agent discovery scans `~/.claude/agents/` and `.claude/agents/` for `.md` files automatically

**v2 frontmatter schema (new fields beyond Anthropic baseline):**

```yaml
---
name: gsd-{role}
description: {when to use, goal, what it produces}
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: {color}
role_type: executor | judge           # NEW — Sonnet or Opus allocation
reads: [list of artifact types]       # NEW — declares input expectations
writes: [list of artifact types]      # NEW — declares output expectations
---
```

The `role_type`, `reads`, `writes` fields are GSD-specific metadata. Claude Code ignores unknown frontmatter keys, so these are safe to add. The orchestrator parses them for model resolution and context injection.

**Token budget:** ~1500 tokens maps to roughly 400-500 words / 50-80 lines of markdown content (excluding frontmatter). This is achievable — the agent body contains: role statement, goal, success criteria, input/output contract, scope constraints, and tool usage guidance. No execution flow details (those belong in the workflow).

### 2. v1 Agent Problems to Fix

Analysis of existing v1 agents reveals patterns to avoid:

| Problem | Example | v2 Fix |
|---------|---------|--------|
| Bloated definitions | gsd-planner.md is 42KB | ~1500 token target, move execution flow to workflows |
| Embedded execution steps | Agents contain step-by-step `<execution_flow>` | Workflow owns execution; agent owns identity + constraints |
| Ambient knowledge assumptions | gsd-executor reads STATE.md because it "knows" to | `reads:` frontmatter declares inputs; orchestrator passes them |
| Duplicate project context blocks | Every agent has identical `<project_context>` section | Core context injected by orchestrator at spawn time |
| Negative scope constraints | "Do NOT do X" lists | Positive framing: "Your goal is Y. Success means Z." |
| No model role declaration | Model decided externally via config lookup | `role_type: executor|judge` in frontmatter |

**Key structural change:** v1 agents are self-contained programs (they know what to read, how to execute, what to write). v2 agents are identity documents (they know who they are, what they're good at, and what success looks like). The orchestrator/workflow owns the execution flow.

### 3. Context Layering Architecture

The orchestrator builds a context payload at spawn time from 3 layers:

```
Layer 0: Agent Definition (always — the .md file itself)
    ↓
Layer 1: Core Context (always — project goals, constraints, stack)
    ↓
Layer 2: Capability Context (when working on a capability)
    ↓
Layer 3: Feature Context (when working on a feature)
    ↓
Layer 4: Framing Context (when inside a workflow framing)
```

**Implementation approach — prompt assembly at spawn time:**

The workflow constructs the Task prompt by concatenating:
1. `"First, read {agent_path} for your role."` — loads agent identity
2. `<core_context>` block — injected by workflow from PROJECT.md/STATE.md
3. `<capability_context>` block — CAPABILITY.md content (if scoped)
4. `<feature_context>` block — FEATURE.md + REQUIREMENTS (if scoped)
5. `<framing_context>` block — framing-specific question sets (if in a workflow)
6. `<task_context>` block — specific inputs for this task (files to read, output location)

**This means agent .md files never contain context-gathering logic.** They receive context, they don't fetch it. The `reads:` frontmatter declares what they expect; the workflow ensures it's provided.

**Framing-specific context (AGNT-03):** Framing question sets live as separate files (one per framing per agent role), loaded by the workflow when a framing is active. Agent definitions reference no framing — they respond to whatever questions they receive.

Recommended location: `get-shit-done/framings/{framing}/{role}-questions.md`

```
get-shit-done/framings/
├── debug/
│   ├── researcher-questions.md
│   ├── planner-questions.md
│   └── reviewer-questions.md
├── new/
│   ├── researcher-questions.md
│   └── ...
├── enhance/
└── refactor/
```

This keeps framing concerns separate from agent definitions (AGNT-03) and from workflows. The workflow reads the appropriate question set file and injects it into the agent prompt.

### 4. Research Agent Design — 6 Gatherers + 1 Synthesizer

**6 Gatherer Agents (all `role_type: executor` → Sonnet):**

| Agent | File | Goal |
|-------|------|------|
| Domain Truth | `gsd-research-domain.md` | First-principles: what are the fundamental truths/constraints of this problem space? |
| Existing System | `gsd-research-system.md` | Codebase analysis: what exists, what works, what constrains? |
| User Intent | `gsd-research-intent.md` | Requirement interpretation: what does the user actually want? |
| Tech Constraints | `gsd-research-tech.md` | Technical feasibility: what are the limits, dependencies, compatibility issues? |
| Edge Cases | `gsd-research-edges.md` | Boundary conditions: what can go wrong, what are the failure modes? |
| Prior Art | `gsd-research-prior-art.md` | Ecosystem patterns: how have others solved this? What patterns exist? |

**1 Synthesizer Agent (`role_type: judge` → Opus):**

| Agent | File | Goal |
|-------|------|------|
| Research Synthesizer | `gsd-research-synthesizer.md` | Consolidate 6 research outputs into 5 sections: consensus, conflicts, gaps, constraints, recommended scope |

**Each gatherer definition contains:**
- Role statement (1 sentence)
- Goal (1 sentence — the specific question this dimension answers)
- Success criteria (3-4 bullets — what makes a good research output for this dimension)
- Scope constraint (positive framing — "You investigate X" not "Don't investigate Y")
- Citation requirement (every claim must reference specific evidence)
- Tool usage guidance (when to use mgrep vs web search vs Context7)

**Synthesizer definition contains:**
- Role statement
- Goal (consolidate, don't add new research)
- 5-section output format specification
- Conflict resolution rules (P1-P3 priority)
- Gap assessment framework (confidence x impact)
- Quality filtering responsibility (flag low-confidence claims)

### 5. Gather→Synthesize as Framework Primitive

This pattern is used by:
- **Research** (Phase 2): 6 gatherers → 1 synthesizer → RESEARCH.md
- **Review** (Phase 4): 4 reviewers → 1 synthesizer → REVIEW.md
- Potentially **Planning** validation

**Primitive structure:**

```
gather_synthesize(
  gatherers: [{agent, prompt_template, output_path}],
  synthesizer: {agent, output_path},
  context: {core + capability + feature + framing},
  failure_policy: retry_once_then_partial
)
```

**Implementation approach:** This is a workflow pattern, not a code abstraction. The workflow template contains:

1. Build context payload (layers 1-4)
2. For each gatherer: construct Task prompt = agent path + context + dimension-specific question + output path
3. Spawn all gatherers in parallel via Task tool
4. Collect results (check each output file exists)
5. For any missing output: retry that gatherer once
6. If still missing: note gap, proceed
7. Spawn synthesizer with: agent path + all gatherer output paths + context
8. Synthesizer writes consolidated output

**Where this lives:** A workflow file, e.g., `get-shit-done/workflows/gather-synthesize.md`, that other workflows include/reference. Not a CLI command — it's an orchestration pattern described in markdown that the AI runtime follows.

### 6. Executor/Judge Model Allocation

**From CONTEXT.md (locked):**

```
Executor = Sonnet — does work (gathering, planning, executing, documenting)
Judge = Opus — validates, synthesizes, reviews, handles Q&A
Hardcoded, not configurable
```

**Implementation in v2 MODEL_PROFILES:**

The v1 MODEL_PROFILES table maps agent names to profile tiers (quality/balanced/budget). v2 replaces this with role-based resolution:

```javascript
// v2 approach — role_type drives model selection
const ROLE_MODEL_MAP = {
  executor: 'sonnet',
  judge: 'inherit',    // inherit = use session's opus
};
```

The orchestrator reads `role_type` from agent frontmatter and resolves the model. No per-agent table needed — the role IS the mapping.

**v2 agent role assignments:**

| Agent | Role Type | Model | Rationale |
|-------|-----------|-------|-----------|
| 6x research gatherers | executor | Sonnet | Information gathering, not judgment |
| Research synthesizer | judge | Opus | Consolidation requires judgment |
| Orchestrator | executor | Sonnet | Follows workflow steps |
| Chat/Q&A | judge | Opus | User-facing judgment calls |
| Planner (Phase 3) | executor | Sonnet | Follows research → produces plan |
| Plan validator (Phase 3) | judge | Opus | Validates plan quality |
| Executor (Phase 3) | executor | Sonnet | Implements plan |
| 4x reviewers (Phase 4) | judge | Opus | Requirement trace = judgment |
| Review synthesizer (Phase 4) | judge | Opus | Consolidation = judgment |
| Documentation writer (Phase 5) | executor | Sonnet | Produces docs from code |
| Documentation reviewer (Phase 5) | judge | Opus | Validates doc quality |

**Note:** The existing v1 `resolveModelInternal()` in `core.cjs` reads from the per-agent `MODEL_PROFILES` table. For v2, this function needs modification to read `role_type` from the agent's frontmatter YAML and apply `ROLE_MODEL_MAP`. The v1 table stays for backward compatibility during the bootstrap period.

### 7. Scope Constraints — Positive Framing Pattern

**User decision (locked):** Constraints through positive framing, not "don't do X" lists.

**Pattern:**

```markdown
## Scope

You are the [role name].
Your goal is: [one sentence goal].
Success means: [3-4 measurable criteria].
You receive: [what the orchestrator gives you].
You produce: [what you write/return].
```

This replaces v1's negative constraint sections like:
```markdown
<!-- v1 anti-pattern -->
- Do NOT explore alternatives to locked decisions
- Do NOT produce code
- Do NOT modify files outside your scope
```

**Evidence this works:** Anthropic's own agent patterns use positive framing. The `description` field in agent definitions tells Claude *when* to use the agent, not when *not* to use it. Goal-oriented prompts produce more focused output than prohibition lists.

**Mandatory citations (AGNT-04):** Add to every agent's scope section:
```markdown
Every claim must cite its source: file path, code snippet, URL, or artifact reference. Unsourced claims are treated as unverified.
```

### 8. File Inventory — What Phase 2 Creates/Modifies

**New Agent Files (CREATE):**

| File | Size Target | Role Type |
|------|-------------|-----------|
| `agents/gsd-research-domain.md` | ~1500 tokens | executor |
| `agents/gsd-research-system.md` | ~1500 tokens | executor |
| `agents/gsd-research-intent.md` | ~1500 tokens | executor |
| `agents/gsd-research-tech.md` | ~1500 tokens | executor |
| `agents/gsd-research-edges.md` | ~1500 tokens | executor |
| `agents/gsd-research-prior-art.md` | ~1500 tokens | executor |
| `agents/gsd-research-synthesizer.md` | ~1500 tokens | judge |

**Workflow Files (CREATE):**

| File | Purpose |
|------|---------|
| `get-shit-done/workflows/gather-synthesize.md` | Reusable gather→synthesize orchestration pattern |

**CLI Modifications (MODIFY):**

| File | Change |
|------|--------|
| `get-shit-done/bin/lib/core.cjs` | Add `ROLE_MODEL_MAP`, add `resolveModelFromRole()` function, read `role_type` from agent frontmatter |
| `get-shit-done/references/model-profiles.md` | Document executor/judge model allocation pattern |

**Framing Question Sets (CREATE — structure only, content in Phase 6):**

| File | Purpose |
|------|---------|
| `get-shit-done/framings/` directory | Skeleton structure for framing question sets |

**Files NOT Touched:** All Phase 1 outputs (capability.cjs, feature.cjs, templates, etc.), existing v1 workflows, existing v1 agent files (they remain for backward compat).

### 9. Resolved Conflicts

| Conflict | Resolution | Rationale |
|----------|-----------|-----------|
| v1 MODEL_PROFILES table vs v2 role-based resolution | Both coexist — v2 adds `resolveModelFromRole()` alongside v1 `resolveModelInternal()` | Bootstrap trap: v1 must keep working. v2 agents use new function; v1 agents use old function. Phase 7 cleanup removes v1 table. |
| Agent definition location (project vs user scope) | User scope (`~/.claude/agents/`) via installer, same as v1 | GSD agents are framework-level, not project-specific. The installer copies them. |
| Question set location (in agent vs separate) | Separate files under `get-shit-done/framings/` | AGNT-03 requires framing changes questions, not agent definition. Separate files achieve this cleanly. |
| Synthesizer output sections — annotations on consensus | No annotations on consensus or constraints discovered | User decision: annotation test says "if the annotation doesn't alter what the next agent does, it's decoration" |

### 10. Closed Gaps

| Gap | Resolution |
|-----|-----------|
| How does orchestrator know which model to use for a v2 agent? | Reads `role_type` from agent frontmatter YAML → maps via `ROLE_MODEL_MAP` |
| How do research agents access mgrep? | mgrep is a Claude Code skill — agents declare `Grep` in tools, the skill `mgrep` is loaded via skills mechanism. Research prompts include guidance on when mgrep is preferred over Grep. |
| How does the synthesizer know which gatherers failed? | Orchestrator passes a manifest: `{agent_name: "success"|"failed"|"partial"}` in the synthesizer prompt |
| What happens if all 6 gatherers fail? | Synthesizer produces a gap-only document noting complete failure. Pipeline continues — planner handles with reduced context. |
| How are v2 agents distinguished from v1 agents during bootstrap? | v2 agents have `role_type` in frontmatter. `resolveModelFromRole()` checks for this field. If absent, falls through to v1 `resolveModelInternal()`. |
| Gather→synthesize reuse: how does review (Phase 4) use the same pattern? | The workflow `gather-synthesize.md` is parameterized: gatherer count, agent paths, output paths, and context are all injected by the calling workflow. Same pattern, different agents. |

### 11. Edge Cases

**Must handle in Phase 2:**
- Agent frontmatter missing `role_type` → fall through to v1 model resolution (backward compat)
- Gatherer produces empty output file → treat as failure, retry once
- Gatherer produces output but writes to wrong path → synthesizer checks expected paths, marks as missing
- All gatherers return identical findings → synthesizer deduplicates into consensus (not 6 copies)
- Synthesizer receives conflicting findings → applies P1-P3 priority ranking from CONTEXT.md
- Agent definition exceeds 1500 token target → allowed for synthesizer (more complex contract); gatherers must stay within budget
- Context payload too large for Task prompt → orchestrator uses `<files_to_read>` block with file paths instead of inlining content

**Defer:**
- Framing question set content (Phase 6 — only directory structure in Phase 2)
- Agent definition versioning/migration
- Multi-runtime agent format differences (Gemini, OpenCode, Codex)

### 12. Implementation Wave Structure

```
Wave 1 (no dependencies):
├── Agent definition format: create all 7 research agent .md files
├── Gather→synthesize workflow: create get-shit-done/workflows/gather-synthesize.md
└── Framing directory structure: create get-shit-done/framings/ skeleton

Wave 2 (depends on Wave 1):
├── Model resolution: add resolveModelFromRole() to core.cjs
├── Model profiles reference: update model-profiles.md
└── Tests: agent frontmatter parsing, role resolution
```

---

*Phase: 02-agent-framework*
*Research completed: 2026-02-28 via parallel 6-agent synthesis*
