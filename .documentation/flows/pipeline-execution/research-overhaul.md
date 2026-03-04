---
type: flow-doc
built-from-code-at: 2210b16
last-verified: 2026-03-04
---

## Flow: pipeline-execution/research-overhaul

## Trigger: [derived]

User invokes `/gsd:plan` (direct) or `/gsd:frame` (via framing-pipeline). Either path reaches the research step, which now uses explicit Task() spawns instead of ambiguous `@workflow.md` delegation.

## Input: [derived]

- Feature context: `CAPABILITY_SLUG`, `FEATURE_SLUG`, `FEATURE_DIR`
- Lens context: `LENS` (debug|new|enhance|refactor), `SECONDARY_LENS` (optional)
- Anchor questions path: lens-specific questions file
- Brief path (framing-pipeline path only): Discovery Brief with lens frontmatter

## Steps: [derived]

### Path A: Direct plan invocation (plan.md)

1. **plan-workflow** --> Step 5 checks for existing RESEARCH.md. Reads YAML frontmatter for `lens` and `secondary_lens` fields.
2. **plan-workflow** --> If no RESEARCH.md or lens mismatch: assembles context payload (core, capability, feature, framing), spawns 6 gatherer Task() blocks in parallel.
3. **research-workflow** --> Referenced as documentation for the gatherer dimensions and context layers (not as delegation target).
4. **plan-workflow** --> Waits for all 6 gatherers. Checks output files exist and are non-empty. Retries failed gatherers once. Aborts if >3 fail.
5. **plan-workflow** --> Spawns synthesizer Task() block. Synthesizer reads all gatherer outputs + manifest, writes `RESEARCH.md` with lens frontmatter (`lens`, `secondary_lens`, `subject`, `date`).
6. **plan-workflow** --> If RESEARCH.md exists and lens matches: reuses existing, skips to planning.

### Path B: Framing pipeline invocation (framing-pipeline.md)

1. **framing-pipeline-workflow** --> Stage 1 assembles richer context payload (adds lens direction, tone, research focus from framing-lenses.md).
2. **framing-pipeline-workflow** --> Spawns same 6 gatherer Task() blocks in parallel with enhanced framing_context.
3. **framing-pipeline-workflow** --> Same retry/failure logic as plan.md. Escalation on >3 failures (MAJOR tier).
4. **framing-pipeline-workflow** --> Spawns synthesizer. Same RESEARCH.md output with lens frontmatter.
5. **framing-pipeline-workflow** --> Stage 3 invokes plan.md. plan-workflow Step 5 finds existing RESEARCH.md with matching lens, reuses it (TC-02: double-research prevention).

### Path C: Review pipeline (review.md)

1. **review-workflow** --> Step 4 spawns 4 reviewer Task() blocks in parallel (enduser, functional, technical, quality).
2. **review-workflow** --> Step 5 handles failures (retry once, abort if >=2 fail).
3. **review-workflow** --> Step 6 spawns synthesizer Task() block. Reads 4 trace reports, writes synthesis.md.
4. **review-workflow** --> Step 9 re-review loop: re-spawns only affected reviewers using same Task() pattern.

### Cross-cutting: research-workflow.md reframe

- **research-workflow** --> No longer a delegation target. Documents the research gather-synthesize pattern (gatherer dimensions, context assembly layers, output structure) for callers to reference.

## Output: [derived]

- `{feature_dir}/RESEARCH.md` -- Consolidated research synthesis with YAML frontmatter (`lens`, `secondary_lens`, `subject`, `date`)
- `{feature_dir}/research/{dimension}-findings.md` -- 6 individual gatherer output files
- `{feature_dir}/review/synthesis.md` -- Review synthesis (Path C)
- `{feature_dir}/review/{dimension}-trace.md` -- 4 individual reviewer trace files (Path C)
- `{feature_dir}/review/review-decisions.md` -- Accepted/deferred/dismissed findings (Path C)

## Side-effects: [derived]

- `{feature_dir}/research/` directory created if not exists
- `{feature_dir}/review/` directory created if not exists
- Failed gatherer/reviewer outputs may be partial or missing (documented in manifest/synthesis)

## WHY: [authored]

**Three callers, one pattern (review synthesis, Decisions section):** The `@workflow.md` delegation anti-pattern was identified in 3 category-1 instances: plan.md Step 5, framing-pipeline.md Stage 1, and research-workflow.md Step 5. All three required parallel Task() spawns that the model could not reliably execute when given ambiguous delegation instructions. The fix applied the same explicit Task() block pattern consistently: 6+1 blocks for research (plan.md, framing-pipeline.md) and 4+1 blocks for review (review.md). The DRY cost is accepted because ambiguity cost is worse.

**Lens-aware reuse prevents double-research (review synthesis, TC-02):** When framing-pipeline runs research in Stage 1 then invokes plan.md in Stage 3, plan.md's Step 5 reads the existing RESEARCH.md frontmatter, finds a matching lens tuple, and reuses it. No additional mechanism needed beyond frontmatter comparison.
