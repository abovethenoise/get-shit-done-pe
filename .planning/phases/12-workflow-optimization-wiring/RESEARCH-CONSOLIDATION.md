# Phase 12: Consolidation Research

**Researched:** 2026-03-01
**Focus:** What can be reused, merged, or simplified when wiring v2 feature model
**Lens:** Consolidation — minimum new code, maximum reuse

---

## Phase → Feature Workflow Adaptation Map

### Current State: What exists

The current workflow stack is:

```
commands/gsd/           → user-facing slash commands (14 files)
get-shit-done/workflows/ → orchestration logic (14 files)
agents/                 → specialist agents (15 files)
get-shit-done/templates/ → artifact templates
get-shit-done/bin/lib/  → CLI modules (14 .cjs files)
```

The framing pipeline already runs at capability level. The CONTEXT.md decision is to move it to feature level. This is the delta.

### Pipeline Stage Reuse Analysis

| Stage | Current Target | v2 Target | Reuse |
|-------|---------------|-----------|-------|
| framing-discovery.md | capability | feature | **Adapt path resolution only** |
| framing-pipeline.md | capability | feature | **Adapt paths + banner text** |
| research-workflow.md | capability/phase | feature | **Direct reuse — already accepts feature_path param** |
| plan.md | phase (via init plan-phase) | feature | **Rewrite init call only** |
| execute.md | phase (via init execute-phase) | feature | **Rewrite init call only** |
| review.md | phase (via init review-phase) | feature | **Rewrite init call only** |
| doc.md | phase (via init doc-phase) | feature | **Rewrite init call only** |
| resume-work.md | phase model | feature/focus group model | **Moderate rewrite** |
| gather-synthesize.md | agnostic | agnostic | **Direct reuse — zero changes** |

**Key finding:** All workflow files use a hardcoded `init <operation>-phase` CLI call as their first step. This single change point (the init call + JSON parsing) is where "phase" becomes "feature" in each workflow. The orchestration logic, agent spawning, escalation handling, and Q&A loops are untouched.

### What Changes in Each Workflow

**framing-discovery.md**
- Step 1: `init framing-discovery` already accepts capability slug. In v2, it also accepts feature slug. The slug resolution in Step 2 adds feature matching (3-tier: exact → wildcard → LLM). Everything else identical.
- Step 4: Brief path changes from `capabilities/{cap}/BRIEF.md` to `capabilities/{cap}/features/{feat}/BRIEF.md`
- Step 10: Pass FEATURE_SLUG in addition to CAPABILITY_SLUG to framing-pipeline

**framing-pipeline.md**
- Inputs block: add FEATURE_SLUG, FEATURE_NAME
- All `{output_dir}` and `{requirements_path}` paths shift from capability dir to feature dir
- Banner text: show "Feature: {cap}/{feat}" instead of "Capability: {cap}"
- Research: pass `feature_path` (currently passed as null for capability-level research)
- Otherwise identical — all 6 stages, escalation protocol, completion banner unchanged

**plan.md**
- Replace `init plan-phase "${PHASE}"` with `init plan-feature "${CAP}" "${FEAT}"`
- Replace ROADMAP.md phase goal lookup with FEATURE.md requirements read
- Remove `--gaps`, `--skip-research`, `--prd` flag handling (feature model does not use these)
- Remove Nyquist validation section (not applicable to feature model per config.json)
- Self-critique loop, planner spawn, plan-checker spawn, revision loop: identical

**execute.md**
- Replace `init execute-phase "${PHASE_ARG}"` with `init execute-feature "${CAP}" "${FEAT}"`
- Replace `phase-plan-index` with `feature-plan-index`
- Remove `close_parent_artifacts` step (decimal phase gap closure — not applicable to features)
- Remove `update_roadmap` (phase complete command) — replace with feature status update
- Wave execution, checkpoint handling, spot-check logic, classifyHandoffIfNeeded workaround: identical

**review.md**
- Replace `init review-phase` with `init review-feature`
- Context assembly already handles `capability_paths` and `feature_paths` — this becomes the normal path
- Reviewer spawn, synthesis, Q&A findings loop: identical

**doc.md**
- Replace `init doc-phase` with `init doc-feature`
- Documentation paths already point to `.documentation/` by capability/feature — no path changes needed
- Agent spawn, Q&A loop, commit logic: identical

**resume-work.md**
- Current: reads STATE.md, finds current phase, offers phase-level actions
- v2: reads STATE.md, finds active focus group, finds active capability + feature within focus
- Incomplete work detection: scan `features/*/PLAN.md` without matching `SUMMARY.md`
- Routing: instead of `/gsd:execute {phase}`, route to `/gsd:execute {cap/feat}`
- "Multiple focus groups" — ask which to pick up (new, but simple Q&A)
- Core structure (load → detect incomplete → present status → route) is identical

**Verdict:** The workflow adaptation is predominantly path/init-call surgery, not logic rewrites.

---

## CLI Route Consolidation Opportunities

### Current init routes (in init.cjs)

| Route | Purpose | v2 Status |
|-------|---------|-----------|
| `init execute-phase` | Phase execution context | Keep — phase model still used internally during transition |
| `init resume` | Resume context | Keep, update output schema |
| `init project` | New/existing detection | Keep as-is |
| `init framing-discovery` | Framing context | Keep — already feature-aware |
| `init progress` | Phase-based progress | Replace with focus-group-aware version |
| `init review-phase` | Review context | New route: `init review-feature` needed |
| `init doc-phase` | Doc context | New route: `init doc-feature` needed |
| `init plan-phase` | **DELETED** (Phase 10) | Gone |

### New routes needed

1. **`init execute-feature <cap> <feat>`** — mirrors `execute-phase` but scoped to feature directory
2. **`init review-feature <cap> <feat>`** — mirrors `review-phase` but reads FEATURE.md instead of roadmap
3. **`init doc-feature <cap> <feat>`** — mirrors `doc-phase` but for feature docs
4. **`init plan-feature <cap> <feat>`** — for plan.md workflow

**What each new route returns (identical structure to phase counterparts, different paths):**

```javascript
// init execute-feature — same shape as execute-phase
{
  executor_model, verifier_model,
  commit_docs, parallelization,
  feature_found,         // was: phase_found
  feature_dir,           // was: phase_dir (.planning/capabilities/{cap}/features/{feat})
  capability_slug,       // new
  feature_slug,          // was: phase_slug
  feature_name,          // was: phase_name
  plans, summaries, incomplete_plans, plan_count, incomplete_count,
  state_exists, roadmap_exists
  // NO: branch_name (feature execution doesn't branch per feature)
  // NO: phase_req_ids (requirements come from FEATURE.md, not ROADMAP.md)
}
```

**Consolidation opportunity:** The core logic in all `init *-phase` routes is near-identical — find directory, list plans/summaries, resolve models, load config. Extract a `featureContext(cwd, cap, feat)` internal helper that all four new routes share. Estimated code: 60-80 lines of shared logic across four 30-line wrappers.

### plan-validate route

Current: `plan-validate <req_source> <plan_files...>` where req_source is either FEATURE.md or REQUIREMENTS.md.

Feature model: req_source is always FEATURE.md. No change needed — route already handles it.

### Slug resolution (3-tier)

Steps 1-2 (exact match, substring match) belong in CLI (fast, deterministic). Step 3 (LLM interpret) falls through to the workflow. The framing-discovery.md already has fuzzy resolution in Step 2. The new capability orchestrator needs the same pattern for routing at capability level.

**Implementation:** Extend `findFeatureInternal` in core.cjs to support substring matching. Currently it does exact slug match only.

---

## Agent Adaptation Analysis

### Per-Agent Decision

**gsd-planner.md** — ADAPT (minimal changes)
- `artifact_contract` section: paths already cover both phase and feature dirs (`{feature_dir}/{nn}-PLAN.md` or `{phase_dir}/{nn}-PLAN.md`) — this was future-proofed in Phase 3
- `execution_flow`: `init plan "${PHASE}"` → `init plan-feature "${CAP}" "${FEAT}"` (one line)
- Goal-backward: currently reads goal from ROADMAP.md. In v2, reads from FEATURE.md `## Goal` or derives from EU requirements. Add feature-mode branch.
- Everything else (self-critique, task schema, wave analysis, findings format) is completely agnostic
- **Delta: ~10 lines changed**

**gsd-executor.md** — ADAPT (minimal changes)
- `artifact_contract`: already covers `{feature_dir}/{nn}-PLAN.md` — zero changes
- `execution_flow`: `init execute "${PHASE}"` → `init execute-feature "${CAP}" "${FEAT}"` (one line)
- `state_updates`: `requirements mark-complete` uses feature-scoped REQ IDs (EU/FN/TC) — compatible, no change needed
- Everything else (checkpoint protocol, task commit, summary creation, self-check) is agnostic
- **Delta: ~5 lines changed**

**gsd-plan-checker.md** — ADAPT (minimal changes)
- `artifact_contract`: already covers both path patterns
- `verification_process` Step 1: `init phase-op` → `init plan-feature`. Goal lookup changes from ROADMAP.md to FEATURE.md
- Dimensions 1-7 are agnostic to phase vs feature — they check plan structure, REQ coverage, deps
- Dimension 8 (Nyquist): skip entirely for feature model (nyquist_validation disabled per config)
- **Delta: ~8 lines changed**

**gsd-verifier.md** — ADAPT (minimal changes)
- `artifact_contract`: already covers both path patterns
- `verification_process` Step 1: path change for finding plans/summaries
- Step 2: Goal derivation from FEATURE.md instead of ROADMAP.md
- Everything else (3-level artifact check, key link verification, anti-pattern scan) is agnostic
- Output: VERIFICATION.md moves to feature dir
- **Delta: ~10 lines changed**

**gsd-doc-writer.md** — REUSE AS-IS
- Already operates on "files provided by orchestrator" — no phase/feature coupling
- Input contract is "code files + review findings + feature requirements" — already feature-native
- Section ownership model, 3-pass validation, heading templates: fully agnostic
- The orchestrator (doc.md workflow) handles path resolution, not the agent
- **Delta: 0 changes**

**gsd-research-domain.md, gsd-research-edges.md, gsd-research-intent.md, gsd-research-prior-art.md, gsd-research-system.md, gsd-research-tech.md** — REUSE AS-IS
- All 6 gatherers receive context payload from orchestrator and write to output_path
- No hardcoded phase/feature paths in any gatherer
- **Delta: 0 changes**

**gsd-research-synthesizer.md** — REUSE AS-IS
- Reads gatherer outputs from paths provided by orchestrator
- **Delta: 0 changes**

**gsd-review-enduser.md, gsd-review-functional.md, gsd-review-quality.md, gsd-review-technical.md** — REUSE AS-IS
- Read requirements and code artifacts from paths provided by orchestrator
- In v2 these naturally read from FEATURE.md instead of REQUIREMENTS.md — orchestrator handles it
- **Delta: 0 changes**

**gsd-review-synthesizer.md** — REUSE AS-IS
- Consolidates reviewer outputs from paths provided by orchestrator
- **Delta: 0 changes**

**Summary: 5 agents need minor edits (~40 lines total), 10 agents need zero changes.**

---

## Template Consolidation Plan

### Templates that are already v2-native

| Template | Status | Notes |
|----------|--------|-------|
| `feature.md` | v2-native | EU/FN/TC requirements, trace table |
| `capability.md` | v2-native | What+why+feature list structure |
| `discovery-brief.md` | v2-native | Lens-aware discovery artifact |
| `summary.md` | Agnostic | Used by executor, phase and feature |
| `review.md` | Agnostic | Review artifact, path-agnostic |
| `docs.md` | Agnostic | Doc artifact, path-agnostic |

### Templates that carry phase terminology

| Template | Action |
|----------|--------|
| `state.md` | Update "Current Position" section: "Feature" replaces "Phase". Focus group tracking added. Change is in template only — ~10 lines. |
| `roadmap.md` | Replace phase checklist with focus group format per CONTEXT.md decision. Significant rewrite but it's just a markdown template. |
| `project.md` | Minor: replace "Phase" refs with capability/feature language. |
| `phase-prompt.md` | DELETE — this was the v1 plan template (already deleted in Phase 10 audit, confirm) |
| `summary-standard.md`, `summary-minimal.md`, `summary-complex.md` | These are variants of summary.md — confirm which survive, consolidate to one. |

### New templates needed

1. **`discovery-brief.md`** — may already exist (framing-discovery.md scaffolds from it). Verify.
2. **`focus-group.md`** — ROADMAP.md focus group format. New, short (~30 lines).

**No new complex templates needed.** The feature.md and capability.md templates already define the artifact structure that planning consumes.

---

## Orchestration Simplification Opportunities

### What complexity exists only because of the phase model

**1. Decimal phase gap-closure (execute.md: `close_parent_artifacts` step)**

The entire `close_parent_artifacts` step exists to handle gap-closure phases (e.g., `4.1`) that patch failures in parent phases. In v2, gap closure is handled as a new plan within the same feature. This step can be deleted entirely.

**2. ROADMAP.md phase-complete CLI command**

`phase complete "${PHASE_NUMBER}"` in execute.md marks phases done and advances STATE.md. In v2, features complete when all plans have summaries. The "complete" action becomes: update FEATURE.md status to "complete", update ROADMAP.md focus group checkbox. The CLI command shrinks from "mark phase complete + advance to next phase" to "update feature status".

**3. Plan PRD express path (plan.md step 3.5)**

The `--prd` flag generates CONTEXT.md from an external PRD file. Feature model doesn't use CONTEXT.md at the plan stage — FEATURE.md carries the requirements. This 50-line section of plan.md is deleted.

**4. Nyquist validation (plan.md step 5.5, plan-checker Dimension 8)**

Disabled in config. Skip section deletion — it's already gated behind `nyquist_validation_enabled`. But the plan-checker Dimension 8 section adds ~100 lines of checker complexity. In v2, it can be removed from the agent (not just skipped).

**5. Gap-closure mode in gsd-planner.md**

`gap_closure_mode` section (~50 lines) handles `--gaps` flag. Feature model doesn't use gap closure (failed verifications trigger a new feature plan directly). Can be removed from planner agent.

**6. Auto-advance wiring in plan.md**

The `--auto` flag and `workflow.auto_advance` config check in plan.md auto-chains to execute.md. The framing-pipeline.md already handles full pipeline chaining (research→requirements→plan→execute→review→reflect). Once framing-pipeline.md owns feature execution, plan.md no longer needs auto-advance logic.

**7. Milestone branch handling in execute.md**

`handle_branching` step checks `branching_strategy` for "phase" or "milestone" to create branches. Feature model doesn't use per-phase branches. This step simplifies to: no branching by default, user creates branches manually if desired. The `milestone_branch_template` config key becomes unused.

### Net result of removing phase-only complexity

| Section | Current Lines | After Removal |
|---------|--------------|---------------|
| close_parent_artifacts (execute.md) | ~60 | 0 |
| PRD express path (plan.md) | ~55 | 0 |
| Nyquist validation (plan.md) | ~35 | 0 |
| Gap-closure mode (gsd-planner.md) | ~55 | 0 |
| Auto-advance chain (plan.md) | ~45 | 0 |
| Milestone branching (execute.md) | ~20 | 0 |
| Total removable | ~270 lines | across 3 files |

This is not a rewrite — it's pruning sections that never apply in the feature model.

---

## Resume / State Simplification Opportunities

### Current resume model (phase-based)

```
STATE.md:
  Current Phase: 12 of 14
  Current Plan: 3 of 5

resume-work.md:
  Find current phase from STATE.md
  Find first PLAN without SUMMARY
  Offer: execute next plan / plan next phase
```

### v2 resume model (focus group based)

```
STATE.md (new structure per CONTEXT.md):
  Active Focus Group: Coaching Foundation
  Active Capability: coaching
  Active Feature: coaching/mistake-detection
  Current Plan: 2 of 3

resume-work.md (simplified):
  Read focus group from STATE.md
  Find active feature
  Find first PLAN without SUMMARY
  If multiple focus groups: ask which to continue
  Offer: execute / plan / discuss
```

### Simplification wins

**STATE.md template update:** The state template already has a "Feature: X of Y" field (from Phase 1). The current STATE.md file still uses "Phase: X of Y" language. The template was updated but the running project file wasn't. Phase 12 final cleanup fixes this.

**Progress calculation:** Current progress bar is `completed_plans / total_plans`. In v2 it's `completed_features / total_features in focus group`. Simpler because focus groups are bounded — you're not calculating against the entire roadmap.

**Incomplete work detection:** Instead of scanning `.planning/phases/*/PLAN.md`, scan `.planning/capabilities/*/features/*/PLAN.md`. Same pattern, different path glob. The `check_incomplete_work` step in resume-work.md is a one-line change.

**Reconstruction fallback:** resume-work.md has a `<reconstruction>` section for when STATE.md is missing. In v2 this reads capabilities from `.planning/capabilities/` and derives current feature from which has plans-without-summaries. Same logic, different paths.

**Multiple focus groups:** This is new in v2 but simple — add a Q&A step before `determine_next_action`: "Which focus group?" if STATE.md shows multiple active. One AskUserQuestion call.

---

## Capability Orchestrator Minimal Spec

### What framing-pipeline.md already does

```
For ONE capability/feature:
  1. Read BRIEF_PATH
  2. Run research-workflow (6 gatherers)
  3. Auto-generate REQUIREMENTS.md (3-layer)
  4. Run plan.md
  5. Run execute.md
  6. Run review.md
  7. Run doc.md
  8. Escalation handling at each stage boundary
```

### What the capability orchestrator adds on top

The capability orchestrator handles: given a capability slug, dispatch to framing-pipeline for each feature in priority order.

```
capability-orchestrator.md (NEW, thin):

1. Resolve capability slug (same 3-tier fuzzy match as framing-discovery)
2. Read CAPABILITY.md — get prioritized feature list
3. Build execution order:
   - Single feature: call framing-pipeline directly
   - Multiple features: create DAG from CAPABILITY.md feature list
   - Check for explicit depends: fields in each FEATURE.md
4. For each feature in DAG order:
   a. Resolve FEATURE.md path
   b. Check if feature has BRIEF.md (if not: run framing-discovery first)
   c. Call framing-pipeline with BRIEF_PATH + LENS + CAPABILITY_SLUG + FEATURE_SLUG
   d. Wait for pipeline completion
   e. Check feature status — if failed, pause and present to user
5. Update focus group status in ROADMAP.md when all features complete
```

**What this is NOT:**

- Not a new orchestration engine — it's a loop that calls framing-pipeline.md
- No new agent types needed
- No new escalation protocol — framing-pipeline's escalation handles stage failures
- Parallel execution: only if CAPABILITY.md DAG shows no dependencies between features. The CONTEXT.md says "execution is per-feature in waves, parallel where DAG allows" — identical pattern to execute.md's wave-based parallel spawning.

**Estimated size:** ~150 lines. Compare to execute.md (~400 lines) — it's simpler because the per-plan complexity stays in framing-pipeline.

### Minimal diff from framing-pipeline.md

The capability orchestrator does NOT need its own escalation protocol, its own banner/UI, or its own context assembly. It wraps framing-pipeline with a loop. The key additions over framing-pipeline:

1. DAG resolution (read CAPABILITY.md feature list + check FEATURE.md for depends_on)
2. Pre-flight check: does BRIEF.md exist? Route to framing-discovery if not.
3. Focus group status update in ROADMAP.md when complete

Everything else is framing-pipeline.md behavior.

---

## Synthesis: What is Actually New in Phase 12

Separating "adapt existing" from "write new":

### Write new (genuinely new code)

| Artifact | Est. Size | Justification |
|----------|-----------|---------------|
| `capability-orchestrator.md` (workflow) | ~150 lines | New loop pattern over framing-pipeline |
| `init execute-feature` (CLI route) | ~40 lines | New route in init.cjs |
| `init review-feature` (CLI route) | ~35 lines | New route in init.cjs |
| `init doc-feature` (CLI route) | ~35 lines | New route in init.cjs |
| `init plan-feature` (CLI route) | ~35 lines | New route in init.cjs |
| `feature-plan-index` (CLI route) | ~30 lines | Mirrors phase-plan-index for features |
| `focus-group.md` (template) | ~30 lines | ROADMAP.md focus group format |
| **Total new** | **~355 lines** | |

### Adapt existing (path surgery + deletions)

| Artifact | Type | Est. Delta |
|----------|------|-----------|
| framing-pipeline.md | Adapt | ~20 lines changed (paths + feature slug input) |
| framing-discovery.md | Adapt | ~25 lines changed (feature resolution, path) |
| plan.md | Adapt + prune | ~80 lines removed, ~15 changed |
| execute.md | Adapt + prune | ~80 lines removed, ~10 changed |
| review.md | Adapt | ~10 lines changed |
| doc.md | Adapt | ~10 lines changed |
| resume-work.md | Adapt | ~40 lines changed |
| gsd-planner.md | Adapt + prune | ~60 lines removed, ~10 changed |
| gsd-executor.md | Adapt | ~5 lines changed |
| gsd-plan-checker.md | Adapt + prune | ~100 lines removed, ~8 changed |
| gsd-verifier.md | Adapt | ~10 lines changed |
| state.md (template) | Update | ~10 lines changed |
| roadmap.md (template) | Rewrite | ~60 lines changed (focus group format) |

### Delete entirely (v1 phase-only artifacts)

Per CONTEXT.md: "Pure v2, drop v1. Rewrite plan/execute/review/doc to only call feature-level routes."

The v1 phase commands are already deleted. What remains to delete:
- Dead init route stubs that return error messages (from Phase 10)
- v1 terminology in any surviving file (Phase 12 final cleanup step)
- `milestone.cjs` in CLI lib — if milestone concept is gone, this module may be deletable (verify usage first)

---

## Critical Observations for Planner

**1. The `init <op>-phase` → `init <op>-feature` switch is the single highest-leverage change.**
Every workflow file calls one init route and parses one JSON object. Updating the init call + JSON field names in each workflow changes the data flow. The orchestration logic (loops, spawns, Q&A, error handling) is untouched.

**2. The planner and plan-checker agents are already architected for feature scope.**
`gsd-planner.md` `artifact_contract` explicitly lists `{feature_dir}/{nn}-PLAN.md`. The planner was written anticipating this migration. Same for gsd-plan-checker and gsd-verifier.

**3. framing-pipeline.md is the right backbone — don't build around it, build with it.**
The CONTEXT.md decision to use framing-pipeline.md as the core and add a thin capability orchestrator on top is correct. The pipeline already handles the hardest problems: escalation, backward resets, stage transitions, framing context injection. The capability orchestrator only adds "which feature next" logic.

**4. The capability orchestrator pattern mirrors execute.md's wave model exactly.**
execute.md: discover plans → build wave groups → spawn parallel agents → handle checkpoints → aggregate.
capability orchestrator: discover features → build DAG order → invoke framing-pipeline per feature → handle feature failures → aggregate.
Same shape, different granularity. The planner can model the new file on execute.md's structure.

**5. resume-work.md needs the biggest logic change of any existing workflow.**
It currently reads "Phase: X of Y" from STATE.md and drives routing from that. The focus group model requires reading a different STATE.md schema. This is a moderate rewrite (~40 lines changed), not a trivial path swap.

**6. Do not touch the 10 zero-change agents.**
The research gatherers, review specialists, research synthesizer, review synthesizer, and doc writer are all path-agnostic. The orchestrators pass paths in; agents don't care if paths point to phase dirs or feature dirs. These should be left completely alone.

---

## Sources

All findings from direct code reading. No external references needed — this is internal architecture analysis.

Files read:
- `.planning/phases/12-workflow-optimization-wiring/12-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `get-shit-done/workflows/framing-pipeline.md`
- `get-shit-done/workflows/plan.md`
- `get-shit-done/workflows/execute.md`
- `get-shit-done/workflows/review.md`
- `get-shit-done/workflows/doc.md`
- `get-shit-done/workflows/resume-work.md`
- `get-shit-done/workflows/research-workflow.md`
- `get-shit-done/workflows/framing-discovery.md`
- `get-shit-done/workflows/execute-plan.md`
- `get-shit-done/workflows/gather-synthesize.md`
- `agents/gsd-planner.md`
- `agents/gsd-executor.md`
- `agents/gsd-plan-checker.md`
- `agents/gsd-verifier.md`
- `agents/gsd-doc-writer.md`
- `get-shit-done/bin/lib/init.cjs` (partial)
- `get-shit-done/bin/lib/feature.cjs` (partial)
- `get-shit-done/bin/lib/roadmap.cjs` (partial)
- `get-shit-done/templates/feature.md`
- `get-shit-done/templates/capability.md`
- `get-shit-done/templates/state.md`
- `commands/gsd/init.md`
