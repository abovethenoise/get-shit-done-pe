<purpose>
Reusable gather-synthesize orchestration pattern. Spawns N gatherer agents in parallel, then one synthesizer agent.

Delegation patterns (model routing, shapes, heuristics) are in @{GSD_ROOT}/get-shit-done/references/delegation.md
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<parameters>
The calling workflow provides:

- `gatherers[]` -- Array of:
  - `subagent_type` -- Agent name for the subagent_type parameter
  - `dimension_name` -- Human label for this gatherer's focus
  - `output_path` -- Where the gatherer writes its output

- `synthesizer` -- Object:
  - `subagent_type` -- Agent name for the subagent_type parameter
  - `output_path` -- Where the synthesizer writes its consolidated output

- `context` -- The assembled context payload (Layers 1-4, built in Context Assembly step below)

- `subject` -- What is being analyzed (e.g., "capability: user-auth", "feature: password-reset")

- `target_type` -- "capability" or "feature" (passed to gatherers and synthesizer for type-aware orientation)
</parameters>

<process>

## Step 1: Context Assembly

Build the context payload before spawning any agents. Agents receive context -- they do not fetch it themselves.

**Layer 0: Agent Definition (always)**
Each agent reads its own definition file. Pass via the Task prompt, not injected here.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md` -- Project goals, constraints, tech stack
- `.planning/STATE.md` -- Current position, decisions, blockers
- `.planning/ROADMAP.md` -- Phase structure and dependencies

**Layer 2: Target Context (when scoped)**
Read and include based on target_type:
- Capability: `.planning/capabilities/{capability-slug}/CAPABILITY.md` (contract)
- Feature: `.planning/features/{feature-slug}/FEATURE.md` (goal/flow/composes[])

**Layer 3: Composition Context (feature targets only)**
If target is a feature, read composed capability contracts:
- For each slug in FEATURE.md `composes[]`: read `.planning/capabilities/{slug}/CAPABILITY.md`

**Layer 4: Framing Context (when inside a workflow framing)**
Read and include if the calling workflow uses a framing:
- `get-shit-done/framings/{framing}/{role}-questions.md`

**Context payload format for agent prompts:**

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<target_context>
{contents of CAPABILITY.md contract or FEATURE.md goal/flow/composes[] -- omit block if not applicable}
</target_context>

<composition_context>
{contracts of composed capabilities -- omit block if not a feature target}
</composition_context>

<framing_context>
{contents of {role}-questions.md -- omit block if not applicable}
</framing_context>

<target_type>{capability|feature}</target_type>
```

**Layer 5: Structural Position (when target is scoped)**
Query the graph for the target's structural context:

```bash
DOWNSTREAM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query downstream "$TARGET_SLUG")
```

Include as a new XML block in the context payload:

```
<structural_position>
{For capabilities: number of features composing this cap, their slugs, whether
 contract is load-bearing (1+ composers) or orphaned (0 composers)
 For features: the composed capabilities and their verification status}
</structural_position>
```

Purpose: research agents (especially gsd-research-system and gsd-research-edges)
need to know if a contract is load-bearing. "3 features compose this cap" means
the contract is load-bearing and changes have blast radius. "0 composers" means
the cap may be orphaned or newly created — different risk profile entirely.

**Layer 6: Semantic Matches (when target is scoped)**
Run mgrep against the target's Goal/Contract description.
Include top results as a new XML block in the context payload:

```
<semantic_matches>
{mgrep results — file paths and match descriptions for code
semantically related to the target capability/feature}
</semantic_matches>
```

Purpose: gives research agents (especially gsd-research-system) a semantic
starting point beyond exact-string grep. Agents should use these as leads
for deeper investigation, not as conclusions.

## Steps 2-5: Gather, Failure Handling, Synthesize, Completion

See @{GSD_ROOT}/get-shit-done/references/delegation.md for the gather-synthesize delegation shape, including parallel spawning, retry/abort logic, and synthesizer invocation.

</process>
</output>
