---
type: module-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Module: plan.md

## Purpose: [derived]

Orchestrate feature planning: research (mandatory, lens-aware) then plan generation via gsd-planner, with draft/refine loop (max 3 iterations), CLI validation, optional plan-checker, and user approval. Located at `get-shit-done/workflows/plan.md`.

**Delta (research-overhaul):** Step 5 rewritten from `@research-workflow.md` delegation to 6 explicit `Task()` blocks for gatherers + 1 for synthesizer. Removed `--skip-research` flag and `research_enabled` config gate. Added lens-aware reuse check via RESEARCH.md frontmatter. Added `SECONDARY_LENS` to inputs block.

**Delta (plan-presentation):** Step 8 restructured with 3-layer justification presentation before approval. Step 8.3 now renders justification narrative and Round 1 fix summary unconditionally before the per-finding Q&A loop. Step 8.6 is a new Final Summary (Layer 1 justification + Layer 2 surfaced decisions + Layer 3 conditional ASCII flow diagram + plan summary table). Step 8.7 is a new unconditional Deep-Dive and Approval step with multiSelect AskUserQuestion over 5 named plan areas plus finalize prompt. Plan checker steps renumbered to 8.8 and 8.9. Step 8.9 now groups checker findings by severity (blockers/warnings/info) with justification cross-reference field.

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
  8. Draft/refine loop:
     - 8.1 Receive planner output
     - 8.2 CLI validation
     - 8.3 Surface to user (justification narrative A, Round 1 fixes B, per-finding Q&A loop C)
     - 8.4 Collect feedback
     - 8.5 Re-spawn if needed (routes to 8.6, not 8.7)
     - 8.6 Final summary (3-layer: justification + decisions + conditional ASCII flow + table)
     - 8.7 Deep-dive and approval (multiSelect over 5 named areas, then finalize prompt)
     - 8.8 Plan checker (if enabled)
     - 8.9 Handle checker findings (severity-grouped: blockers/warnings/info batch)
  12. Present final status
- **Task() blocks in Step 5:**
  - 6 gatherers: `gsd-research-domain`, `gsd-research-system`, `gsd-research-intent`, `gsd-research-tech`, `gsd-research-edges`, `gsd-research-prior-art` (model: sonnet)
  - 1 synthesizer: `gsd-research-synthesizer` (model: inherit)
- **Task() block in Step 7:**
  - 1 planner: `gsd-planner` via `general-purpose` subagent_type (model: planner_model from config)
- **Task() block in Step 8.8:**
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
- `agents/gsd-planner.md` -- Planning agent (returns `### Justification` and `### Round 1 Fixes` sections)
- `agents/gsd-plan-checker.md` -- Plan verification agent
- `references/planner-reference.md` -- Planner return format schema (Planning Complete block)
- `references/ui-brand.md` -- UI branding reference and ASCII flow diagram notation (required_reading)

## Constraints: [authored]

- Research is mandatory. No skip gate exists. Failure path offers "provide context" or "abort" only.
- Lens-aware reuse: existing RESEARCH.md is reused only when frontmatter `lens` AND `secondary_lens` match current invocation. Missing frontmatter = stale = re-run.
- One planner per feature. No parallel planner spawns.
- Max 3 iterations of draft/refine loop (8.1-8.5). Deep-dive at 8.7 does not consume iteration budget.
- All 6 gatherers spawn simultaneously (parallel). Synthesizer runs only after all complete.
- Retry: failed gatherers retried once. If >3 fail, abort research.
- Step 8.5 routes to 8.6 (Final Summary) on all-accepted/dismissed path. Deep-dive at 8.7 is unconditional -- both the findings-present and no-findings paths reach 8.7.
- Re-spawn after "I want changes" in finalize prompt must explicitly request justification regeneration.
- Max 3 checker cycles (8.8-8.9 loop).

## WHY: [authored]

**Explicit Task() blocks over @workflow.md delegation (review finding, FN-01):** The prior `@research-workflow.md` delegation was ambiguous -- models could interpret it as "read the file for context" rather than "spawn 6 parallel agents." Explicit Task() blocks with `prompt`, `subagent_type`, `model`, and `description` fields are unambiguous spawn instructions. The DRY cost of duplicating blocks across plan.md and framing-pipeline.md is accepted because ambiguity cost is worse.

**Skip gate removal (review finding, EU-01 / TC-03):** `--skip-research` was model-parsed prose, not CLI-enforced. `research_enabled` was a config gate. Both allowed bypassing research, producing plans grounded in training knowledge rather than codebase facts. Removed entirely -- no "skip" option offered even on failure.

**SECONDARY_LENS added to inputs (review finding, Finding 4):** plan.md references `SECONDARY_LENS` in reuse logic (line 71) and context payload (line 84). It was not declared in the inputs block. Added for input contract completeness. The "or both are absent/null" clause provides graceful handling when undefined.

**Justification before approval (EU-01, FN-03):** The old step 8.3 presented findings then immediately prompted "approve?" Plan approval was a rubber stamp -- the user saw only what was wrong, never why the plan was structured as it is. Surfacing justification narrative and Round 1 fix summary unconditionally before findings turns approval into a judgment call with context.

**Deep-dive unconditional placement (EU-02, review findings 1+4):** Review found that step 8.5 routed directly to 8.7, bypassing 8.6 on both the findings-present and no-findings paths. The deep-dive step would only fire when there were zero findings and no re-spawn (rare). Fix: route 8.5 to 8.6 (Final Summary), then 8.7 (Deep-Dive and Approval) runs unconditionally for every plan regardless of finding count.

**multiSelect flat options for deep-dive (EU-02 AC-2, review finding 2):** The original design used a "Requirement coverage + more..." expansion to fit 6 named areas within AskUserQuestion's 4-option limit. Review found that hidden-behind-expansion is not "named" -- EU-02 AC-2 requires areas to be visible, not merely reachable. Fix: multiSelect AskUserQuestion with 5 flat options. "Self-critique details" is reachable as a secondary offer after initial area selection.

**Severity-grouped checker findings (FN-07):** Old step 8.8 format was unspecified. Blockers presented first (must resolve), warnings second (can override), info items as batch summary (no individual Q&As). Justification cross-reference field is included when the checker finding and a Justification claim share a REQ ID or dependency edge.
