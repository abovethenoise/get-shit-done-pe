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

**Layer 2: Capability Context (when scoped to a capability)**
Read and include if the subject is within a specific capability:
- `.planning/capabilities/{capability-slug}/CAPABILITY.md`

**Layer 3: Feature Context (when scoped to a feature)**
Read and include if the subject is a specific feature:
- `.planning/capabilities/{capability-slug}/features/{feature-slug}/FEATURE.md`
- `.planning/REQUIREMENTS.md` -- Relevant requirement IDs for this feature

**Layer 4: Framing Context (when inside a workflow framing)**
Read and include if the calling workflow uses a framing:
- `get-shit-done/framings/{framing}/{role}-questions.md`

**Context payload format for agent prompts:**

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<capability_context>
{contents of CAPABILITY.md -- omit block if not applicable}
</capability_context>

<feature_context>
{contents of FEATURE.md + relevant requirements -- omit block if not applicable}
</feature_context>

<framing_context>
{contents of {role}-questions.md -- omit block if not applicable}
</framing_context>
```

## Steps 2-5: Gather, Failure Handling, Synthesize, Completion

See @{GSD_ROOT}/get-shit-done/references/delegation.md for the gather-synthesize delegation shape, including parallel spawning, retry/abort logic, and synthesizer invocation.

</process>
