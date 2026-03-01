<purpose>
Research how to implement a phase. Thin wrapper that delegates to research-workflow.md for the actual 6-gatherer research pipeline.

Standalone research command. For most workflows, use `/gsd:plan-phase` which integrates research automatically.
</purpose>

<process>

## Step 0: Resolve Context

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
```

Extract from init JSON: `phase_dir`, `padded_phase`, `phase_number`, `phase_name`, `state_path`, `requirements_path`, `context_path`, `has_research`, `commit_docs`.

## Step 1: Normalize and Validate Phase

@~/.claude/get-shit-done/references/phase-argument-parsing.md

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
```

If `found` is false: Error and exit.

## Step 2: Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

If exists: Offer update/view/skip options.

## Step 3: Determine Output Directory

Set `output_dir` to the phase directory: `${phase_dir}`

## Step 4: Delegate to Research Workflow

Invoke the research workflow with assembled parameters:

```
@~/.claude/get-shit-done/workflows/research-workflow.md
```

Pass:
- `subject`: "Phase {phase_number}: {phase_name}" (from PHASE_INFO)
- `context_paths`:
  - `project_path`: .planning/PROJECT.md
  - `state_path`: {state_path}
  - `roadmap_path`: .planning/ROADMAP.md
  - `requirements_path`: {requirements_path}
- `output_dir`: {phase_dir}
- `capability_path`: null (phase-scoped, not capability-scoped)
- `feature_path`: null (phase-scoped, not feature-scoped)
- `framing_context`: null (standalone invocation, no framing)

The research workflow handles:
1. Spawning 6 gatherers in parallel via gather-synthesize
2. Consolidating via research synthesizer
3. Writing RESEARCH.md to {output_dir}/RESEARCH.md

Wait for completion.

## Step 5: Handle Return

- `status: "complete"` or `status: "partial"` -- Display summary, offer: Plan/Dig deeper/Review/Done
- `status: "failed"` -- Show failures, offer: Add context/Retry/Manual

</process>
