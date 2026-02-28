# Existing System: GSD v1 Agent Analysis

**Researched:** 2026-02-28
**Confidence:** HIGH — direct source inspection of all v1 agent files

---

## V1 Agent Inventory

| Agent | Est. Tokens | Frontmatter Fields | Key Sections |
|-------|-------------|-------------------|--------------|
| gsd-phase-researcher | ~4,800 | name, description, tools, color | role, project_context, upstream_input, downstream_consumer, philosophy, tool_strategy, source_hierarchy, verification_protocol, output_format, execution_flow, structured_returns, success_criteria |
| gsd-research-synthesizer | ~1,800 | name, description, tools, color | role, downstream_consumer, execution_flow, output_format, structured_returns, success_criteria |
| gsd-project-researcher | ~4,600 | name, description, tools, color | role, philosophy, research_modes, tool_strategy, verification_protocol, output_formats (5 templates), execution_flow, structured_returns, success_criteria |
| gsd-executor | ~5,200 | name, description, tools, color | role, project_context, execution_flow, deviation_rules, authentication_gates, auto_mode_detection, checkpoint_protocol, checkpoint_return_format, continuation_handling, tdd_execution, task_commit_protocol, summary_creation, self_check, state_updates, final_commit, completion_format, success_criteria |
| gsd-planner | ~6,000+ | name, description, tools, color | role, project_context, (persisted output — see note) |
| gsd-plan-checker | ~5,100 | name, description, tools, color | role, project_context, upstream_input, core_principle, verification_dimensions (8), verification_process (10 steps), examples, issue_structure, structured_returns, anti_patterns, success_criteria |
| gsd-verifier | ~4,700 | name, description, tools, color | role, project_context, core_principle, verification_process (10 steps), output, critical_rules, stub_detection_patterns, success_criteria |
| gsd-codebase-mapper | ~5,300 | name, description, tools, color | role, why_this_matters, philosophy, process (4 steps), templates (7 templates), forbidden_files, critical_rules, success_criteria |
| gsd-debugger | ~9,400 | name, description, tools, color | role, philosophy, hypothesis_testing, investigation_techniques, verification_patterns, research_vs_reasoning, debug_file_protocol, execution_flow, checkpoint_behavior, structured_returns, modes, success_criteria |
| gsd-integration-checker | ~3,100 | name, description, tools, color | role, core_principle, inputs, verification_process (6 steps), output, critical_rules, success_criteria |
| gsd-roadmapper | ~5,000 | name, description, tools, color | role, downstream_consumer, philosophy, goal_backward_phases, phase_identification, coverage_validation, output_formats (3 formats), execution_flow (9 steps), structured_returns, anti_patterns, success_criteria |

**Note on gsd-planner:** The actual file content was persisted to disk due to size (49.5KB preview). Based on preview + structure, estimated ~6,000+ tokens. It is the largest agent in the system.

**Note on gsd-debugger:** At ~9,400 tokens it is by far the largest. The philosophy section alone includes multiple tables, an extensive hypothesis_testing section, six investigation_techniques, and full verification_patterns — much of which is encyclopedic rather than role-defining.

**Token range summary:**
- Smallest: gsd-research-synthesizer (~1,800)
- Largest: gsd-debugger (~9,400)
- Most agents: 4,000–5,500 tokens
- Target for v2: ~1,500 tokens per agent

---

## V1 Workflow Patterns

### How Agents Are Spawned

v1 uses the `Task()` call pattern from workflow files (.md) with two dispatch styles:

**Style A — Role file + prompt (most agents):**
```
Task(
  prompt="First, read /Users/philliphall/.claude/agents/gsd-phase-researcher.md for your role...\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{researcher_model}",
  description="..."
)
```
The agent definition is NOT pre-loaded — the agent is instructed to read it at start. This means the agent's first action is always a Read tool call consuming context before any real work begins.

**Style B — Named subagent type (synthesizer, plan-checker):**
```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="..."
)
```
The agent definition is loaded by the subagent_type resolution. The definition IS the agent.

**Implication:** v1 has two inconsistent spawn patterns. Style A creates bloated prompts (agent def + task context both inline). Style B is cleaner but not used uniformly.

### Context Injection

Context passed to agents via `<files_to_read>` block in the prompt. Agents are instructed:
> "If the prompt contains a `<files_to_read>` block, you MUST use the Read tool to load every file listed there before performing any other actions."

This pattern works, but is entirely orchestrator-driven. The agent has no awareness of what artifacts it should be reading — it reads whatever the orchestrator tells it. There is no agent-side artifact declaration.

**Files typically injected:**
- STATE.md (project history, decisions)
- ROADMAP.md (phase goals, requirements)
- REQUIREMENTS.md (requirement IDs and specs)
- CONTEXT.md (user decisions from discuss-phase)
- RESEARCH.md (technical research for phase)
- PLAN.md (plans to verify/execute)

### Model Selection

Model selection is fully orchestrator-owned via `gsd-tools.cjs init` command:

```bash
INIT=$(node gsd-tools.cjs init plan-phase "$PHASE")
# Returns: researcher_model, planner_model, checker_model, etc.
```

The `resolveModelInternal()` function in core.cjs maps agent types to models based on `model_profile` config (quality/balanced/budget). Example:
```javascript
MODEL_PROFILES = {
  'gsd-planner':              { quality: 'opus', balanced: 'opus',   budget: 'sonnet' },
  'gsd-phase-researcher':     { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'gsd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  ...
}
```

**Key observation:** v1 treats model selection as a configuration concern (user's quality/cost preference). v2 reframes it as a role concern — Executor (Sonnet) vs. Judge (Opus). The v1 "balanced" profile puts the planner on Opus, which is closer to the v2 Judge pattern for planning.

### Research Flow in V1

**Project-level research (new-project):**
```
4x gsd-project-researcher (parallel, Sonnet)
  → Stack / Features / Architecture / Pitfalls
      → gsd-research-synthesizer (Sonnet/Opus)
          → SUMMARY.md
```

Each researcher is given one dimension (Stack, Features, Architecture, Pitfalls) and writes directly to `.planning/research/`. The synthesizer reads all 4 outputs and commits everything.

**Phase-level research (plan-phase):**
```
gsd-phase-researcher (single agent, Sonnet)
  → RESEARCH.md
```

Only one researcher. The synthesis step is missing entirely — the planner consumes raw researcher output directly.

**V2 design changes this to:**
```
6x dimension-specific researchers (parallel, Sonnet = Executor)
  → Domain Truth / Existing System / User Intent / Tech Constraints / Edge Cases / Prior Art
      → synthesizer (Opus = Judge)
          → Consensus / Conflicts / Gaps / Constraints / Recommended Scope
```

---

## Phase 1 Foundation Available

### frontmatter.cjs

Location: `/Users/philliphall/.claude/get-shit-done/bin/lib/frontmatter.cjs`

**What it provides:**
- `extractFrontmatter(content)` — Parse YAML frontmatter from markdown files
- `reconstructFrontmatter(obj)` — Serialize object back to YAML
- `spliceFrontmatter(content, newObj)` — Update frontmatter in-place without touching body
- `parseMustHavesBlock(content, blockName)` — Parse nested must_haves structures (truths/artifacts/key_links)
- `cmdFrontmatterGet/Set/Merge/Validate` — CLI CRUD operations
- `FRONTMATTER_SCHEMAS` — Schema definitions for plan, summary, verification types

**Relevance to Phase 2:** Agent definition files use YAML frontmatter (`name`, `description`, `tools`, `color`). The frontmatter library can parse and validate agent definition files programmatically. Phase 2 may use this to build agent validation tooling or to generate agent definitions from templates.

### core.cjs

Location: `/Users/philliphall/.claude/get-shit-done/bin/lib/core.cjs`

**What it provides:**
- `MODEL_PROFILES` — Agent-to-model mapping table (quality/balanced/budget profiles)
- `resolveModelInternal(cwd, agentType)` — Resolve model for agent given current config
- `findPhaseInternal(cwd, phase)` — Find phase directory by number
- `getRoadmapPhaseInternal(cwd, phaseNum)` — Extract phase info from ROADMAP.md
- `loadConfig(cwd)` — Load and normalize `.planning/config.json`
- Various git, path, and slug utilities

**Relevance to Phase 2:**
- `MODEL_PROFILES` will need a new entry for the v2 Executor/Judge model allocation pattern
- `resolveModelInternal` will need updating for the new allocation approach
- The agent type naming convention (e.g., `gsd-phase-researcher`) is used as keys in MODEL_PROFILES — v2 agent types will need entries here

### Templates

Location: `/Users/philliphall/.claude/get-shit-done/templates/`

Available:
- `research-project/` — STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md templates (used by gsd-project-researcher)
- `summary.md`, `summary-minimal.md`, `summary-complex.md` — Plan summary templates
- `roadmap.md`, `state.md`, `requirements.md` — Project artifact templates
- `phase-prompt.md`, `planner-subagent-prompt.md` — Agent prompt scaffolds
- `context.md`, `discovery.md` — Discussion/discovery templates

**Relevance to Phase 2:** Phase 2 will define v2 agent definition templates. The existing templates show the expected markdown structure conventions. The `phase-prompt.md` and `planner-subagent-prompt.md` templates show how prompts are structured for subagent spawn calls — useful reference for understanding the expected format even if v2 replaces the content.

### CLI Infrastructure (gsd-tools.cjs)

The `init` command provides rich context to orchestrators before any agent spawning:
- Phase directory locations, file paths
- Model assignments per agent role
- Workflow flags (research enabled, plan_checker enabled, etc.)
- Project state

Phase 2 needs to extend `init` or add new commands to support the v2 6-dimension gather pattern and model allocation pattern.

---

## V1 Problems to Fix

### Problem 1: Agent Definitions Are Bloated (3-9x Over Target)

**Evidence:** v1 agents range from ~1,800 to ~9,400 tokens. Target is ~1,500 tokens.

Inflation sources (from inspecting gsd-executor, gsd-planner, gsd-debugger):
- **Full output format templates embedded in definition** — gsd-executor embeds the SUMMARY.md template, PLAN.md frontmatter schema, and commit format specifications. These belong in reference files, not the agent definition.
- **Process documentation embedded as training** — gsd-debugger contains 3 full pages on hypothesis testing methodology (tables, examples, code snippets). This is educational content, not role-defining instructions.
- **Tool strategy repeated across agents** — The full Context7 usage pattern and Brave Search instructions appear verbatim in gsd-phase-researcher, gsd-project-researcher, and would appear in other agents too. This is cross-cutting content that should live in a shared reference.
- **`<project_context>` block copied to every agent** — Instructions to read CLAUDE.md and .agents/skills/ directory appear identically in gsd-phase-researcher, gsd-executor, gsd-plan-checker, gsd-verifier, gsd-codebase-mapper. This is boilerplate that should be part of context injection, not per-agent definition.

**Consequence:** Large definitions consume context budget before any real work begins, especially when combined with `<files_to_read>` content.

### Problem 2: No Artifact Awareness — Agents Don't Declare What They Read/Write

**Evidence:** Agent definitions contain `tools` (Read, Write, Bash) but no declaration of which specific files they read or produce.

The file paths are decided by the orchestrator at spawn time and passed in `<files_to_read>`. This is entirely reactive — an agent cannot know what it should read/write unless the orchestrator explicitly tells it.

**Consequence (per AGNT-01 requirement):** An agent swapped into a different workflow position has no idea what inputs it needs or what it should produce. The orchestrator must carry all artifact routing logic. This creates tight coupling between workflow files and agent definitions.

**What v2 needs:** Agent definitions should declare their artifact role — "I read X, I write Y" — even if the orchestrator overrides specific paths. This is "artifact awareness" per AGNT-01.

### Problem 3: Model Allocation Is Preference-Based, Not Role-Based

**Evidence:** `MODEL_PROFILES` in core.cjs maps agents to quality/balanced/budget tiers. Example: `gsd-planner: { quality: 'opus', balanced: 'opus', budget: 'sonnet' }`.

This means the planner always runs on Opus at quality/balanced tiers — a reasonable heuristic but not principle-driven. There is no concept of whether an agent is doing work (Executor) vs. evaluating work (Judge).

**Consequence:** Cost and quality are not predictably managed. A researcher (Executor) might run on Opus unnecessarily; a synthesizer (Judge) might run on Sonnet when judgment quality matters.

**What v2 needs:** Per 02-CONTEXT.md, agents declare their role (Executor or Judge). Model is determined by role. This is a design decision, not a user preference.

### Problem 4: Research Is 4-Dimension Not 6-Dimension

**Evidence:** `new-project.md` spawns exactly 4 researchers: Stack, Features, Architecture, Pitfalls. There is no existing researcher for: Domain Truth (first-principles), Existing System (codebase analysis), User Intent (requirement interpretation), Tech Constraints, or Edge Cases.

`plan-phase.md` spawns 1 researcher: gsd-phase-researcher. There is no parallel gather pattern at all for phase-level research.

**Consequence:** Per RSRCH-01 through RSRCH-06, v2 requires 6 dimensions with dedicated first-principles thinking (RSRCH-01), codebase analysis, and tech constraints dimensions. None of these exist in v1.

### Problem 5: Context Injection Is Ad-Hoc — No Layering Discipline

**Evidence:** Each workflow (new-project.md, plan-phase.md, execute-phase.md) assembles its own `<files_to_read>` list with slightly different files depending on what it "knows" matters for that step. There is no systematic layering logic.

Per 02-CONTEXT.md, v2 requires a defined hierarchy:
```
project goals (always) → capability details (within capability) → feature details (on specific feature)
```

**Consequence (per AGNT-02):** Ad-hoc injection means some agents get too much context (bloated) or the wrong context (wrong layer). The orchestrator makes these decisions inconsistently across workflows.

### Problem 6: Framing Is Not Separated From Agent Definitions

**Evidence:** v1 has no framing-based context injection. The framing commands (debug, new, enhance, refactor) referenced in REQUIREMENTS.md (WKFL-01 through WKFL-07) do not exist in v1.

The `discover-phase.md` workflow exists but it's a discussion-focused workflow for a single phase, not a framing system that changes the question sets across the full pipeline.

**Consequence (per AGNT-03):** v1 agents always ask the same questions regardless of work type. A "refactor" and a "new feature" get identical research, planning, and review regardless of what's appropriate for each.

### Problem 7: No Scope Hallucination Prevention

**Evidence:** Agent definitions end with a `<success_criteria>` checklist, but there is no structural mechanism preventing an agent from going beyond its defined scope.

The gsd-executor's `deviation_rules` section is the closest analog — it explicitly defines when the executor should auto-fix, auto-add, or stop and ask. But other agents (researchers, planner, verifier) rely on descriptive instructions ("don't do X") rather than structural constraints.

**Consequence (per AGNT-04):** Agents produce generic output or hallucinate scope. The plan-phase workflow's revision loop (max 3 iterations) exists partly because the planner can produce plans that don't actually address phase goals — suggesting the agent's scope constraints aren't preventing this.

---

## Reusable Patterns

### Pattern 1: CRITICAL Mandatory Initial Read

```markdown
**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<files_to_read>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions.
```

This pattern appears in every v1 agent. It works — the `<files_to_read>` block is a reliable context injection mechanism. v2 should preserve this pattern.

### Pattern 2: Structured Return Formats

Every agent returns a machine-parseable structured result with a clear header:
```markdown
## RESEARCH COMPLETE
## VERIFICATION PASSED
## ISSUES FOUND
## PLAN COMPLETE
## CHECKPOINT REACHED
```

The orchestrator pattern-matches on these headers to determine routing. This is a clean separation between agent output and orchestrator logic. v2 should preserve this pattern and standardize the headers.

### Pattern 3: Downstream Consumer Declaration

Several agents document who consumes their output and how:
```markdown
<downstream_consumer>
Your RESEARCH.md is consumed by `gsd-planner`:
| Section | How Planner Uses It |
```

This is the closest v1 gets to artifact awareness. It's documentation rather than machine-readable, but it establishes the right mental model. v2 should formalize this into the artifact awareness declaration (AGNT-01).

### Pattern 4: Goal-Backward Verification

The `gsd-verifier` and `gsd-plan-checker` both use goal-backward methodology:
> "Start from what the phase SHOULD deliver, verify it actually exists and works."

This is a strong pattern that eliminates the common problem of "all tasks complete but goal not achieved." v2 should carry this pattern into review agents (Phase 4).

### Pattern 5: Confidence Levels with Source Hierarchy

```
HIGH: Context7, official docs
MEDIUM: WebSearch verified with official source
LOW: WebSearch only, single source
```

This pattern in research agents is well-designed. It forces explicit uncertainty tracking. v2 research agents should preserve this.

### Pattern 6: Deviation Rules (Auto-fix vs Ask)

gsd-executor's 4 deviation rules (auto-fix bugs, auto-add missing critical functionality, auto-fix blocking issues, ask about architectural changes) are a clean decision tree for handling unexpected work. This pattern is proven and should inform v2 executor agents (Phase 3).

### Pattern 7: YAML Frontmatter as Structured Metadata

PLAN.md files use YAML frontmatter for machine-readable metadata:
```yaml
---
phase: 02
plan: 01
type: standard
wave: 1
depends_on: []
requirements: [AGNT-01, AGNT-02]
must_haves:
  truths: [...]
  artifacts: [...]
  key_links: [...]
---
```

This pattern powers `gsd-tools.cjs verify artifacts` and `verify key-links` commands. v2 agent definition files should also use YAML frontmatter for machine-readable role and artifact declarations.

### Pattern 8: Commit Discipline — Never Commit Without Instruction

Nearly every agent includes: "**DO NOT commit.** Leave committing to the orchestrator." This single-committer pattern prevents race conditions and ensures orchestrators control the git log. v2 should preserve this.

---

## Replacement Needed

### Replace: Monolithic Embedded Output Templates

**What v1 does:** Agent definitions embed full output format templates inline. gsd-executor embeds the SUMMARY.md template; gsd-codebase-mapper embeds 7 document templates (700+ lines).

**Why it fails:** Templates change independently of agent logic. When output format evolves, every agent definition must be updated. Token cost is paid for content that is used rarely or never in most runs.

**v2 replacement:** Move output format templates to `/Users/philliphall/.claude/get-shit-done/templates/`. Agent definitions reference them: "Write using template at X." The frontmatter.cjs infrastructure already supports this pattern.

### Replace: Shared Boilerplate Embedded Per-Agent

**What v1 does:** `<project_context>`, tool_strategy, and verification_protocol sections are copy-pasted across agents with minor variations.

**Why it fails:** When the Brave Search tool path changes, 5+ agent files need updating. Context7 usage pattern embedded in multiple agents becomes stale simultaneously.

**v2 replacement:** Extract shared sections to reference files injected at spawn time by the orchestrator. The orchestrator already knows which files to inject (this is the layered context pattern from AGNT-02).

### Replace: 4-Dimension Project Research

**What v1 does:** gsd-project-researcher handles one of 4 dimensions (Stack, Features, Architecture, Pitfalls).

**Why it fails:** Missing dimensions: Domain Truth (first-principles constraints), Existing System (what's already built), User Intent (what the requirements actually mean), Tech Constraints (feasibility boundaries), Edge Cases (failure modes).

**v2 replacement:** 6 dimension-specific agents as defined in 02-CONTEXT.md, each with a focused question set. gsd-project-researcher becomes the base template for these 6 specialists.

### Replace: Single Phase Researcher

**What v1 does:** gsd-phase-researcher is a single agent that answers "what do I need to know to plan this phase?"

**Why it fails:** Single-threaded, one dimension (general research). Misses codebase context (no existing system dimension), misses first-principles thinking (no domain truth dimension), misses constraint discovery (no tech constraints dimension).

**v2 replacement:** The same 6-dimension gather pattern applies to phase-level research. The synthesizer produces the Consensus/Conflicts/Gaps/Constraints/Recommended Scope output.

### Replace: Ad-Hoc Model Assignment

**What v1 does:** MODEL_PROFILES assigns agents to quality/balanced/budget tiers based on engineering judgment (planner = Opus, synthesizer = Sonnet, etc.).

**Why it fails:** No principled basis. The judgment is often correct but for the wrong reasons. The system can't reason about "why is this agent on Opus?"

**v2 replacement:** Agent definitions declare `role: executor | judge`. Executors run on Sonnet. Judges run on Opus. MODEL_PROFILES is replaced with a two-entry dispatch table. Orchestrators query the agent's declared role, not a model profile.

### Replace: Implicit Scope Constraints

**What v1 does:** Scope is enforced through descriptive text: "You are NOT the executor or verifier" (gsd-plan-checker). This relies on the model obeying natural language prohibitions.

**Why it fails:** Language models are susceptible to scope drift, especially under long context. A descriptive constraint like "don't do X" in a 5,000 token definition competes with implicit learned behaviors and in-context examples that may push in a different direction.

**v2 replacement:** Positive framing — define exactly what success looks like (role, goal, success criteria), not what failure looks like. The CONTEXT.md pattern already demonstrates this: "Locked Decisions" (what to do) is more effective than "Deferred Ideas" (what not to do), and agents honor it more reliably.

---

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| Token counts | MEDIUM | Manual word count × 1.3 estimate; not exact tokenizer |
| Spawn patterns (Style A vs B) | HIGH | Direct inspection of new-project.md and plan-phase.md workflow files |
| Model allocation is config-based | HIGH | Direct inspection of MODEL_PROFILES in core.cjs |
| Research is 4-dimension not 6 | HIGH | Direct count of Task() spawns in new-project.md |
| No artifact awareness in definitions | HIGH | Inspected all 11 agent definitions — none declare reads/writes |
| Shared boilerplate exists | HIGH | project_context section verified in 5 agents by inspection |
| frontmatter.cjs is usable for v2 | HIGH | Complete code read; API is clean and stable |
| core.cjs MODEL_PROFILES needs update | HIGH | Direct inspection confirms v1 schema; v2 Executor/Judge not representable |
| Goal-backward pattern is proven | HIGH | Used in both gsd-verifier and gsd-plan-checker with consistent methodology |
| Framing system absent | HIGH | No framing commands found in workflows/; WKFL-* requirements all Pending |

---

## Implications for Phase 2

### What Phase 2 Must Build

Based on this analysis, Phase 2 must produce:

1. **Agent definition format/template** — ~1,500 token target, goal-driven (role + goal + success criteria), artifact awareness (reads/writes declared), model role (executor/judge)

2. **6 research agent definitions** (v2 gather agents):
   - Domain Truth researcher — first-principles
   - Existing System researcher — codebase analysis
   - User Intent researcher — requirement interpretation
   - Tech Constraints researcher — feasibility
   - Edge Cases researcher — failure modes
   - Prior Art researcher — ecosystem patterns

3. **Research synthesizer (v2)** — produces Consensus/Conflicts/Gaps/Constraints/Recommended Scope

4. **Model allocation implementation** — update core.cjs MODEL_PROFILES or add new executor/judge dispatch; v2 agent frontmatter should include `role` field

5. **Framing question sets** — context injected based on active framing (debug/new/enhance/refactor); these change what questions agents ask, not the agent definition itself

### What Phase 2 Can Skip

- Planner agent (Phase 3)
- Executor agent (Phase 3 — gsd-executor is already reasonably good; needs trimming)
- Reviewer agents (Phase 4)
- Documentation agent (Phase 5)
- Workflow commands (Phase 6)

### Key Design Tension

v1's `<files_to_read>` orchestrator-driven injection works. v2's "agents declare artifacts" is an addition, not a replacement. The tension is: how much does the agent definition declare vs. how much does the orchestrator inject?

CONTEXT.md's decision: "Orchestrator decides what context/artifacts to pass — agents don't self-select their inputs." This means artifact awareness in the definition is documentation/validation (what the agent expects), not enforcement. The orchestrator still provides the actual paths. This is the right call — it keeps agents simple and orchestrators in control.
