---
type: module-doc
built-from-code-at: 2210b16
last-verified: 2026-03-04
---

## Module: review.md

## Purpose: [derived]

Orchestrate the full review pipeline for a feature: spawn 4 specialist reviewers in parallel (gather-synthesize pattern), consolidate via synthesizer, present findings one-at-a-time with 5 response options, handle re-review cycles after accepted fixes, auto-advance to doc workflow. Located at `get-shit-done/workflows/review.md`.

**Delta (research-overhaul):** Steps 4, 6, and 9 rewritten from ambiguous gather-synthesize delegation to explicit Task() blocks. Step 4: 4 reviewer Task() blocks. Step 6: 1 synthesizer Task() block. Step 9: re-review uses same Task() pattern for affected reviewers. The `@gather-synthesize.md` required_reading reference is retained as a category-3 context reference.

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS`
- **CLI init:** `gsd-tools.cjs init feature-op` with `review` operation -- returns `feature_dir`, `feature_found`, `has_research`, `has_plans`, `state_path`, `roadmap_path`
- **Steps:**
  1. Initialize (CLI init, mkdir review/)
  2. Context assembly (4 layers: core, capability, feature, framing)
  3. Locate feature artifacts (SUMMARY.md scan, requirement ID extraction)
  4. Spawn 4 reviewers in parallel (explicit Task() blocks)
  5. Failure handling (retry once, abort if >=2 fail)
  6. Synthesize (explicit Task() block)
  7. Parse synthesis (extract findings)
  8. Present findings (Q&A loop with AskUserQuestion)
  9. Re-review loop (affected reviewers only, max 2 cycles)
  10. Log decisions
  11. Completion display
  12. Auto-advance to doc workflow
- **Task() blocks in Step 4:**
  - `gsd-review-enduser` (model: sonnet) -- writes `{feature_dir}/review/enduser-trace.md`
  - `gsd-review-functional` (model: sonnet) -- writes `{feature_dir}/review/functional-trace.md`
  - `gsd-review-technical` (model: sonnet) -- writes `{feature_dir}/review/technical-trace.md`
  - `gsd-universal-quality-reviewer` (model: sonnet) -- writes `{feature_dir}/review/quality-trace.md`
- **Task() block in Step 6:**
  - `gsd-review-synthesizer` (model: inherit) -- writes `{feature_dir}/review/synthesis.md`
- **Conflict priority:** end-user > functional > technical > quality
- **Finding response options:** Accept, Accept+Edit, Research, Defer, Dismiss
- **Outputs:** `{feature_dir}/review/synthesis.md`, `{feature_dir}/review/review-decisions.md`, 4 trace files

## Depends-on: [derived]

- `gsd-tools.cjs` -- CLI tool for initialization
- `agents/gsd-review-enduser.md` -- End-user reviewer agent
- `agents/gsd-review-functional.md` -- Functional reviewer agent
- `agents/gsd-review-technical.md` -- Technical reviewer agent
- `agents/gsd-review-quality.md` -- Quality reviewer agent (subagent_type: `gsd-universal-quality-reviewer`)
- `agents/gsd-review-synthesizer.md` -- Review synthesizer agent
- `workflows/gather-synthesize.md` -- Pattern reference (required_reading, category-3)
- `references/ui-brand.md` -- UI branding reference (required_reading)
- `workflows/doc.md` -- Auto-advance target (Step 12)

## Constraints: [authored]

- Reviewers spawned in parallel (prevents anchoring bias).
- Synthesizer runs only after all reviewers complete (or abort if >=2 fail).
- Q&A happens in review.md via AskUserQuestion -- not inside reviewer agents.
- Max 2 re-review cycles. Re-review is targeted: only affected reviewers + synthesizer.
- Requirements sourced from FEATURE.md (EU/FN/TC), not separate REQUIREMENTS.md.
- Auto-advances to doc workflow when no blockers remain (Step 12).

## WHY: [authored]

**Explicit Task() blocks over delegation (review finding, FN-06):** Same pattern as research overhaul in plan.md and framing-pipeline.md, applied to the review pipeline. The prior approach relied on implicit gather-synthesize delegation. Now 4+1 Task() blocks with explicit `prompt`, `subagent_type`, `model`, `description` fields.

**@gather-synthesize.md retained in required_reading (review finding, Finding 2):** FN-06 prose originally specified removing this reference. The audit table (TC-04) classified it as category-3 (correct context reference). Review synthesis resolved the tension: the reference is retained because review.md reads gather-synthesize for pattern context while owning its own spawn logic. The Task() blocks (the primary FN-06 deliverable) are present.
