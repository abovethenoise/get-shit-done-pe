---
type: module-doc
built-from-code-at: 2210b16
last-verified: 2026-03-04
---

## Module: framing-pipeline.md

## Purpose: [derived]

Orchestrate the 6 post-discovery pipeline stages for any framing lens at feature level: research, requirements, plan, execute, review, doc. Invoked by framing-discovery.md after brief finalization. All four lens framings converge here. Located at `get-shit-done/workflows/framing-pipeline.md`.

**Delta (research-overhaul):** Stage 1 (Research) rewritten from `@research-workflow.md` delegation to 6 explicit `Task()` blocks for gatherers + 1 for synthesizer. Richer framing context than plan.md (includes lens direction, tone, and research focus).

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** `BRIEF_PATH`, `LENS`, `SECONDARY_LENS` (optional), `CAPABILITY_SLUG`, `CAPABILITY_NAME`, `FEATURE_SLUG`, `FEATURE_DIR`
- **Stages:**
  1. Initialize (read brief frontmatter, extract lens metadata, read anchor questions)
  2. Stage 1 -- Research (6+1 Task() spawns with lens-aware focus)
  3. Stage 2 -- Requirements generation (lens-weighted 3-layer EU/FN/TC)
  4. Stage 3 -- Plan (delegates to plan.md with framing context)
  5. Stage 4 -- Execute (delegates to execute.md with framing context)
  6. Stage 5 -- Review (delegates to review.md with 3-input model)
  7. Stage 6 -- Doc (delegates to doc.md)
  8. Escalation handling (3-tier: minor/moderate/major)
  9. Pipeline completion
- **Task() blocks in Stage 1:**
  - 6 gatherers: `gsd-research-domain`, `gsd-research-system`, `gsd-research-intent`, `gsd-research-tech`, `gsd-research-edges`, `gsd-research-prior-art` (model: sonnet)
  - 1 synthesizer: `gsd-research-synthesizer` (model: inherit)
- **Stage 1 context payload includes:** core_context, capability_context, feature_context, framing_context (lens, secondary_lens, direction, tone, research focus, brief path, anchor questions)
- **Lens-aware research focus:**
  - debug: reproduction environment, error paths, dependency versions
  - new: domain modeling, architectural options, prior art
  - enhance: existing module boundaries, integration points, test coverage
  - refactor: dependency mapping, consumer contracts, migration precedents
- **Outputs:** RESEARCH.md with lens frontmatter, gatherer findings in `{FEATURE_DIR}/research/`, then downstream artifacts from stages 2-6

## Depends-on: [derived]

- `agents/gsd-research-domain.md` -- Domain Truth gatherer agent
- `agents/gsd-research-system.md` -- Existing System gatherer agent
- `agents/gsd-research-intent.md` -- User Intent gatherer agent
- `agents/gsd-research-tech.md` -- Tech Constraints gatherer agent
- `agents/gsd-research-edges.md` -- Edge Cases gatherer agent
- `agents/gsd-research-prior-art.md` -- Prior Art gatherer agent
- `agents/gsd-research-synthesizer.md` -- Research synthesizer agent
- `references/framing-lenses.md` -- Lens behavioral specifications (required_reading)
- `references/escalation-protocol.md` -- Escalation tier handling (required_reading)
- `references/ui-brand.md` -- UI branding reference (required_reading)
- `workflows/plan.md` -- Stage 3 sequential handoff
- `workflows/execute.md` -- Stage 4 sequential handoff
- `workflows/review.md` -- Stage 5 sequential handoff
- `workflows/doc.md` -- Stage 6 sequential handoff

## Constraints: [authored]

- All 6 stages run in sequence. No stage skipping.
- Orchestrator passes PATHS not content. Each stage reads files in its own context.
- Maximum 1 backward reset per pipeline run (escalation budget).
- Execute -> Review auto-chains. Review -> Doc auto-chains when clean.
- Major escalations use propose-and-confirm. No auto-return.
- Research output goes to feature directory, not capability directory.
- Requirements populate FEATURE.md directly (no separate REQUIREMENTS.md).

## WHY: [authored]

**Explicit Task() blocks in Stage 1 (review finding, FN-02):** Same rationale as plan.md -- `@research-workflow.md` delegation was ambiguous for parallel spawning. Stage 1 now contains the same 6+1 Task() block pattern. The framing_context payload is richer here (includes lens direction, tone, focus from framing-lenses.md) because framing-pipeline has more lens metadata available than plan.md's direct invocation path.
