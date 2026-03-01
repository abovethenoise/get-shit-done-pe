<purpose>
Standalone research orchestration workflow. Spawns 6 specialist research gatherers in parallel via the gather-synthesize pattern, then consolidates via the research synthesizer agent. Produces a single RESEARCH.md consumed by the planner.

Callers: framing-pipeline.md (Stage 1), plan.md (Step 5).

Separation of concerns: callers determine WHAT to research (subject, scope, framing). This workflow determines HOW to research (6 gatherers + synthesis via gather-synthesize pattern).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/workflows/gather-synthesize.md
</required_reading>

<inputs>
The calling workflow provides these as context:

- `subject`: What is being researched (capability name, feature name, phase description, or freeform topic)
- `context_paths`: Paths to core context files. Always includes:
  - `project_path`: .planning/PROJECT.md
  - `state_path`: .planning/STATE.md
  - `roadmap_path`: .planning/ROADMAP.md
  - `requirements_path`: .planning/REQUIREMENTS.md (if exists)
- `output_dir`: Directory where RESEARCH.md and intermediate gatherer outputs are written
- `capability_path` (optional): Path to CAPABILITY.md if scoped to a capability
- `feature_path` (optional): Path to FEATURE.md if scoped to a feature
- `framing_context` (optional): Object with framing metadata when invoked from framing-pipeline:
  - `brief_path`: Path to Discovery Brief
  - `lens`: Primary lens (debug | new | enhance | refactor)
  - `secondary_lens`: Secondary lens (optional)
  - `direction`: Lens direction (backward | forward | outward | underneath)
  - `focus`: Lens-specific research focus
</inputs>

<process>

## 1. Initialize

Create output directory for gatherer outputs:

```bash
mkdir -p "${OUTPUT_DIR}/research"
```

Display banner:
```
-------------------------------------------------------
 GSD > RESEARCH WORKFLOW
-------------------------------------------------------

Subject: {subject}
Output: {output_dir}/RESEARCH.md
Gatherers: 6 (Domain, System, Intent, Tech, Edges, Prior Art)
```

## 2. Context Assembly

Build context payload following gather-synthesize.md Layers 1-4.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md` (from context_paths.project_path)
- `.planning/STATE.md` (from context_paths.state_path)
- `.planning/ROADMAP.md` (from context_paths.roadmap_path)

**Layer 2: Capability Context (when capability_path provided)**
Read and include:
- CAPABILITY.md at `capability_path`

**Layer 3: Feature Context (when feature_path provided)**
Read and include:
- FEATURE.md at `feature_path`
- REQUIREMENTS.md at `context_paths.requirements_path` (if exists)

**Layer 4: Framing Context (when framing_context provided)**
Read and include framing metadata:
- Brief at `framing_context.brief_path`
- Lens-specific research focus from `framing_context.focus`

Assemble payload:

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
{framing metadata: brief content, lens, direction, focus -- omit block if not applicable}
</framing_context>
```

## 3. Define Gatherers

Define the 6 research gatherers following gather-synthesize.md parameters:

```
gatherers:
  - agent_path: agents/gsd-research-domain.md
    dimension_name: "Domain Truth"
    output_path: {output_dir}/research/domain-truth-findings.md

  - agent_path: agents/gsd-research-system.md
    dimension_name: "Existing System"
    output_path: {output_dir}/research/existing-system-findings.md

  - agent_path: agents/gsd-research-intent.md
    dimension_name: "User Intent"
    output_path: {output_dir}/research/user-intent-findings.md

  - agent_path: agents/gsd-research-tech.md
    dimension_name: "Tech Constraints"
    output_path: {output_dir}/research/tech-constraints-findings.md

  - agent_path: agents/gsd-research-edges.md
    dimension_name: "Edge Cases"
    output_path: {output_dir}/research/edge-cases-findings.md

  - agent_path: agents/gsd-research-prior-art.md
    dimension_name: "Prior Art"
    output_path: {output_dir}/research/prior-art-findings.md
```

## 4. Define Synthesizer

```
synthesizer:
  agent_path: agents/gsd-research-synthesizer.md
  output_path: {output_dir}/RESEARCH.md
```

## 5. Invoke Gather-Synthesize

Delegate to the gather-synthesize pattern:

```
@~/.claude/get-shit-done/workflows/gather-synthesize.md
```

Pass:
- `gatherers[]` -- the 6 gatherers defined above
- `synthesizer` -- the synthesizer defined above
- `context` -- the assembled context payload from step 2
- `subject` -- the subject from inputs

The gather-synthesize workflow handles:
1. Spawning all 6 gatherers in parallel as Task calls
2. Failure handling with one retry per failed gatherer
3. Building the manifest (success/failed per dimension)
4. Aborting if > 50% fail (3+ of 6)
5. Spawning the synthesizer with all outputs + manifest
6. Returning the synthesis output path + manifest

Wait for gather-synthesize to complete.

## 6. Handle Result

**If gather-synthesize aborted (too many failures):**

Display error:
```
-------------------------------------------------------
 GSD > RESEARCH FAILED
-------------------------------------------------------

Subject: {subject}
Failed: {failed_count}/6 gatherers
Cause: Too many gatherers failed to produce output.

Failed dimensions:
- {dimension}: {reason}

Action: Check agent definitions and context. Re-run research via the planning workflow.
```

Return failure to caller.

**If gather-synthesize succeeded (with or without partial failures):**

Verify synthesis output exists:
```bash
test -f "${OUTPUT_DIR}/RESEARCH.md" && test -s "${OUTPUT_DIR}/RESEARCH.md"
```

If missing: error -- synthesis failed despite successful gather phase.

Display completion:
```
-------------------------------------------------------
 GSD > RESEARCH COMPLETE
-------------------------------------------------------

Subject: {subject}
Gatherers: {success_count}/6 succeeded
Output: {output_dir}/RESEARCH.md

Gatherer results:
  Domain Truth:     [OK | FAILED]
  Existing System:  [OK | FAILED]
  User Intent:      [OK | FAILED]
  Tech Constraints: [OK | FAILED]
  Edge Cases:       [OK | FAILED]
  Prior Art:        [OK | FAILED]
```

## 7. Return to Caller

Return to the calling workflow:

- `research_path`: `{output_dir}/RESEARCH.md` -- the consolidated research document
- `manifest`: Which gatherers succeeded and which failed
- `summary`: `{success_count}/6 gatherers succeeded`
- `status`: "complete" | "partial" (if any failures) | "failed" (if aborted)

The calling workflow decides what to do with partial results.

</process>

<key_constraints>
- This workflow follows the gather-synthesize pattern from gather-synthesize.md exactly -- it does not reinvent parallel spawning or failure handling.
- All 6 gatherers always run regardless of framing type. The framing context shapes what each gatherer focuses on, but no gatherers are skipped.
- Gatherers use role_type executor (Sonnet). Synthesizer uses role_type judge (Opus via inherit). This follows the Executor/Judge pattern from model-profiles.md.
- The orchestrator passes PATHS not content. Each gatherer reads its own agent definition and context files in its fresh context window.
- Intermediate gatherer outputs are written to {output_dir}/research/ subdirectory. Final synthesis is written to {output_dir}/RESEARCH.md.
- This workflow is framing-agnostic: framing changes the Layer 4 context, not the workflow mechanics.
- The synthesizer handles quality filtering (50-word threshold, cross-referencing). This workflow handles orchestration only.
</key_constraints>
