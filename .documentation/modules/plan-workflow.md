---
type: module-doc
built-from-code-at: 2210b16
last-verified: 2026-03-04
---

## Module: plan.md

## Purpose: [derived]

Orchestrate feature planning: research (mandatory, lens-aware) then plan generation via gsd-planner, with draft/refine loop (max 3 iterations), CLI validation, optional plan-checker, and user approval. Located at `get-shit-done/workflows/plan.md`.

**Delta (research-overhaul):** Step 5 rewritten from `@research-workflow.md` delegation to 6 explicit `Task()` blocks for gatherers + 1 for synthesizer. Removed `--skip-research` flag and `research_enabled` config gate. Added lens-aware reuse check via RESEARCH.md frontmatter. Added `SECONDARY_LENS` to inputs block.

## Exports: [derived]

This is a workflow prompt (not executable code). It exposes the following interface to callers:

- **Inputs:** `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS`, `SECONDARY_LENS` (optional), `ANCHOR_QUESTIONS_PATH`
- **Flags:** `--research` (force research), `--skip-verify`
- **CLI init:** `gsd-tools.cjs init plan-feature` -- returns `researcher_model`, `planner_model`, `checker_model`, `plan_checker_enabled`, `feature_dir`, `feature_found`, `has_plans`, `plan_count`, and path variables
- **Steps:**
  1. Initialize (CLI init, parse JSON)
  2. Parse arguments (extract flags)
  3. Validate feature (FEATURE.md must exist)
  4. Load context (capability/feature hierarchy scan)
  5. Handle research (lens-aware reuse check, 6+1 Task() spawns, retry/failure logic)
  6. Check existing plans
  7. Spawn gsd-planner (single Task() block)
  8. Draft/refine loop (planner output, CLI validation, user Q&A, re-spawn, plan-checker)
  12. Present final status
- **Task() blocks in Step 5:**
  - 6 gatherers: `gsd-research-domain`, `gsd-research-system`, `gsd-research-intent`, `gsd-research-tech`, `gsd-research-edges`, `gsd-research-prior-art` (model: sonnet)
  - 1 synthesizer: `gsd-research-synthesizer` (model: inherit)
- **Task() block in Step 7:**
  - 1 planner: `gsd-planner` via `general-purpose` subagent_type (model: planner_model from config)
- **Task() block in Step 8.7:**
  - 1 plan-checker: `gsd-plan-checker` (model: checker_model from config)
- **Outputs:** `{feature_dir}/*-PLAN.md` files, `{feature_dir}/RESEARCH.md`, gatherer findings in `{feature_dir}/research/`

## Depends-on: [derived]

- `gsd-tools.cjs` -- CLI tool for initialization and plan validation
- `agents/gsd-research-domain.md` -- Domain Truth gatherer agent
- `agents/gsd-research-system.md` -- Existing System gatherer agent
- `agents/gsd-research-intent.md` -- User Intent gatherer agent
- `agents/gsd-research-tech.md` -- Tech Constraints gatherer agent
- `agents/gsd-research-edges.md` -- Edge Cases gatherer agent
- `agents/gsd-research-prior-art.md` -- Prior Art gatherer agent
- `agents/gsd-research-synthesizer.md` -- Research synthesizer agent
- `agents/gsd-planner.md` -- Planning agent
- `agents/gsd-plan-checker.md` -- Plan verification agent
- `references/ui-brand.md` -- UI branding reference (required_reading)

## Constraints: [authored]

- Research is mandatory. No skip gate exists. Failure path offers "provide context" or "abort" only.
- Lens-aware reuse: existing RESEARCH.md is reused only when frontmatter `lens` AND `secondary_lens` match current invocation. Missing frontmatter = stale = re-run.
- One planner per feature. No parallel planner spawns.
- Max 3 iterations of draft/refine loop.
- All 6 gatherers spawn simultaneously (parallel). Synthesizer runs only after all complete.
- Retry: failed gatherers retried once. If >3 fail, abort research.

## WHY: [authored]

**Explicit Task() blocks over @workflow.md delegation (review finding, FN-01):** The prior `@research-workflow.md` delegation was ambiguous -- models could interpret it as "read the file for context" rather than "spawn 6 parallel agents." Explicit Task() blocks with `prompt`, `subagent_type`, `model`, and `description` fields are unambiguous spawn instructions. The DRY cost of duplicating blocks across plan.md and framing-pipeline.md is accepted because ambiguity cost is worse.

**Skip gate removal (review finding, EU-01 / TC-03):** `--skip-research` was model-parsed prose, not CLI-enforced. `research_enabled` was a config gate. Both allowed bypassing research, producing plans grounded in training knowledge rather than codebase facts. Removed entirely -- no "skip" option offered even on failure.

**SECONDARY_LENS added to inputs (review finding, Finding 4):** plan.md references `SECONDARY_LENS` in reuse logic (line 71) and context payload (line 84). It was not declared in the inputs block. Added for input contract completeness. The "or both are absent/null" clause provides graceful handling when undefined.
