<purpose>
Reusable gather-synthesize orchestration pattern. Spawns N gatherer agents in parallel, then one synthesizer agent. Used by research (6 gatherers), review (4 gatherers), and any other workflow needing parallel analysis followed by consolidation.
</purpose>

<parameters>
The calling workflow provides:

- `gatherers[]` — Array of:
  - `agent_path` — Path to the gatherer agent definition (e.g., `get-shit-done/agents/gsd-research-domain-truth.md`)
  - `dimension_name` — Human label for this gatherer's focus (e.g., "Domain Truth", "Edge Cases")
  - `output_path` — Where the gatherer writes its output (e.g., `.planning/capabilities/{cap}/{feat}/research/domain-truth.md`)

- `synthesizer` — Object:
  - `agent_path` — Path to the synthesizer agent definition (e.g., `get-shit-done/agents/gsd-research-synthesizer.md`)
  - `output_path` — Where the synthesizer writes its consolidated output

- `context` — The assembled context payload (Layers 1-4, built in Context Assembly step below)

- `subject` — What is being analyzed: capability name, feature name, or phase name (e.g., "capability: user-auth", "feature: password-reset")
</parameters>

<process>

## Step 1: Context Assembly

Build the context payload before spawning any agents. Agents receive context — they do not fetch it themselves.

**Layer 0: Agent Definition (always)**
Each agent reads its own definition file. This is passed via the Task prompt, not injected here.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md` — Project goals, constraints, tech stack
- `.planning/STATE.md` — Current position, decisions, blockers
- `.planning/ROADMAP.md` — Phase structure and dependencies

**Layer 2: Capability Context (when scoped to a capability)**
Read and include if the subject is within a specific capability:
- `.planning/capabilities/{capability-slug}/CAPABILITY.md` — Capability goals and boundaries

**Layer 3: Feature Context (when scoped to a feature)**
Read and include if the subject is a specific feature:
- `.planning/capabilities/{capability-slug}/features/{feature-slug}/FEATURE.md` — Feature specification
- `.planning/REQUIREMENTS.md` — Relevant requirement IDs for this feature

**Layer 4: Framing Context (when inside a workflow framing)**
Read and include if the calling workflow uses a framing (debug, new, enhance, refactor):
- `get-shit-done/framings/{framing}/{role}-questions.md` — Dimension-specific question sets for this framing

**Context payload format for agent prompts:**

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<capability_context>
{contents of CAPABILITY.md — omit block if not applicable}
</capability_context>

<feature_context>
{contents of FEATURE.md + relevant requirements — omit block if not applicable}
</feature_context>

<framing_context>
{contents of {role}-questions.md — omit block if not applicable}
</framing_context>
```

## Step 2: Gather Phase — Parallel Agent Spawning

Construct one Task prompt per gatherer using this template:

```
First, read {agent_path} for your role and goal.

<subject>
{subject}
</subject>

{context_payload}

<task_context>
Dimension: {dimension_name}
Write your complete analysis to: {output_path}
</task_context>
```

Spawn ALL gatherers simultaneously using parallel Task calls. Do not wait for one to finish before spawning the next.

Wait for ALL gatherers to complete before proceeding to Step 3.

## Step 3: Failure Handling

After all gatherers complete, check each output:

```bash
# For each gatherer output_path:
test -f {output_path} && test -s {output_path}
# -s = non-empty
```

**For each gatherer:**

- If output exists and is non-empty: status = `"success"`
- If output is missing or empty: retry that specific gatherer ONCE using the same prompt

**After retry:**

- If output now exists and is non-empty: status = `"success"`
- If still missing or empty: status = `"failed"`

**Build manifest:**

```
manifest:
  {dimension_name_1}: success
  {dimension_name_2}: success
  {dimension_name_3}: failed
  ...
```

**Abort threshold:**

Count failed gatherers. If `failed_count / total_gatherers > 0.50` (more than 50% failed):
- Do NOT proceed to synthesis
- Surface a structured error:

```
## GATHER PHASE FAILED

Subject: {subject}
Failed: {failed_count}/{total_gatherers} gatherers

Failed dimensions:
- {dimension_name}: {reason if known}
- ...

Cause: Too many gatherers failed to produce output.
Action: Investigate agent definitions and context assembly before retrying.
```

If 50% or fewer failed: proceed to synthesis with partial results.

## Step 4: Synthesize Phase

Construct the synthesizer prompt:

```
First, read {synthesizer.agent_path} for your role and goal.

<subject>
{subject}
</subject>

{context_payload}

<task_context>
Gather phase complete. Synthesize the following gatherer outputs into a consolidated analysis.

Gatherer outputs to read:
{list each gatherer output_path with its dimension_name and status from manifest}

Manifest:
{manifest}

Note: If any gatherer has status "failed", its dimension is missing from the analysis. Document the gap in your synthesis — do not fabricate content for missing dimensions.

Write your complete synthesis to: {synthesizer.output_path}
</task_context>
```

Spawn the synthesizer as a single agent (not parallel). Wait for it to complete.

## Step 5: Completion

Return to the calling workflow:

- **Synthesizer output path:** `{synthesizer.output_path}` — the consolidated result
- **Manifest:** Which gatherers succeeded and which failed
- **Summary:** `{success_count}/{total_gatherers} gatherers succeeded`

The calling workflow decides what to do with partial results (e.g., proceed, flag for human review, retry).

</process>

<key_constraints>
- This is a workflow pattern, not executable code. AI orchestrators follow these steps; they are not compiled or interpreted.
- The pattern is framing-agnostic: framing changes the Layer 4 context and the gatherer agent definitions, not this pattern itself.
- No quality gate between gatherers and synthesizer — synthesizer handles quality filtering. Thin pipe is intentional.
- Gatherers are goal-driven: they know their role and success criteria. Orchestrator controls what context they receive.
- Model allocation follows the Executor/Judge pattern: gatherers use Sonnet (Executor), synthesizer uses inherit/Opus (Judge).
</key_constraints>

<reuse_examples>
This pattern applies wherever parallel analysis and consolidation are needed:

**Research (Phase 2):**
- Gatherers: Domain Truth, Existing System, User Intent, Tech Constraints, Edge Cases, Prior Art (6 agents)
- Synthesizer: Research synthesizer
- Framing: None (or framing-specific question sets in Layer 4)

**Review (Phase 4):**
- Gatherers: Correctness, Completeness, Security, Performance (4 agents)
- Synthesizer: Review synthesizer
- Framing: `get-shit-done/framings/{new|enhance|debug|refactor}/reviewer-questions.md`

**Any future workflow needing parallel analysis + consolidation:**
- Define gatherer agents with appropriate dimensions
- Define synthesizer agent
- Call this pattern with the gatherers array and context
</reuse_examples>
