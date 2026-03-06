## Existing System Findings

### Relevant Implementations

- **framing-pipeline.md** (494 lines) is the primary pipeline orchestrator. Runs 6 stages: research -> requirements -> plan -> execute -> review -> doc. Stage 1 (research, lines 73-178) and Stage 2 (requirements generation, lines 183-229) are targeted for removal. Stages 3-6 (plan, execute, review, doc) remain but are reshaped. Currently assumes single-feature scope via inputs contract (lines 16-24). -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md`

- **capability-orchestrator.md** (156 lines) provides DAG wave orchestration. Reads CAPABILITY.md features table, builds dependency graph via topological sort, groups into waves, dispatches framing-pipeline per feature sequentially within each wave (line 92). To be deleted (TC-01), DAG logic absorbed into framing-pipeline. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md`

- **research-workflow.md** (224 lines) is self-described reference documentation ("Callers own the actual Task() spawns" -- line 5). Supports both capability-level and feature-level scope via Layer 3 context assembly (lines 68-79). To be deleted (TC-02). -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md`

- **plan.md** (390 lines) already contains complete research spawn logic in Step 5 (lines 59-166) -- 6 parallel gatherers + synthesizer with lens-aware reuse check on RESEARCH.md frontmatter. This is a working duplicate of framing-pipeline Stage 1. After TC-02/FN-04, plan.md becomes the single owner of research. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:59-166`

- **review.md** (193 lines) orchestrates 4 reviewers + synthesizer. Takes `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS`. Initializes via `gsd-tools init feature-op`. Has auto-advance to doc in Step 12 (lines 162-179) with blocker gating. Spawns reviewers at `model="sonnet"` (lines 67, 74, 81, 88), synthesizer at `model="inherit"` (line 110). -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md`

- **doc.md** (204 lines) orchestrates 5 explorers + synthesizer. Same input signature and init pattern as review.md. Explorers at `model="sonnet"`, synthesizer at `model="inherit"`. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md`

- **execute.md** (216 lines) terminates at `offer_next` step: "The workflow ends. The user decides next steps." (line 201). This is the broken auto-chain point. Execute does NOT return control to framing-pipeline; it terminates independently. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md:188-202`

- **progress.md** (154 lines) routing table (lines 110-117) maps 6 conditions to routes. References `focus_groups` in init parse (line 16) but the actual init function never provides this data -- focus group info exists only as authored markdown in ROADMAP.md. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/progress.md:89-120`

### Constraints

- **`gsd:review` command forces `--type feature` on slug-resolve** (line 34), preventing capability-scope resolution. Statement on line 15: "Review always operates at the feature level." TC-05 requires removing this constraint. By contrast, `gsd:doc`, `gsd:plan`, and `gsd:execute` all accept both scope types. -- `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md:34` (blocks capability-scope review)

- **`init feature-op` requires both capSlug and featSlug.** The `cmdInitFeatureOp` function (init.cjs line 586) errors if either is missing. Capability-scope review/doc must either iterate features calling init per feature, or introduce a new init route. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs:586` (blocks multi-feature init)

- **ROLE_MODEL_MAP is the single source of model resolution for v2 agents.** executor->sonnet, judge->inherit, quick->haiku. Changing an agent's `role_type` immediately changes its resolved model via `resolveModelFromRole()`. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:18-22`

- **plan.md planner model resolves through `resolveModelFromRole`.** `init plan-feature` (init.cjs line 443) calls `resolveModelFromRole` for the planner agent. Currently gsd-planner has `role_type: executor` -> sonnet. TC-08 change to `role_type: judge` will resolve to inherit/Opus -- this is the intended correction per model-profiles.md v2 table. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs:443`

- **TC-06 line budget.** Current totals: framing-pipeline (494) + capability-orchestrator (156) + research-workflow (224) + review (193) + doc (204) + plan (390) + execute (216) + progress (154) = 2,031 lines. Deletions: capability-orchestrator (-156) + research-workflow (-224) + framing-pipeline Stage 1 (~-105) + Stage 2 (~-47) = ~532 lines freed for additions.

- **framing-pipeline inputs contract is single-feature.** BRIEF_PATH, FEATURE_SLUG, FEATURE_DIR are all singular. Absorbing capability-orchestrator means framing-pipeline must accept either a single feature or a capability slug with feature list derived from CAPABILITY.md. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:16-24`

### Reuse Opportunities

- **DAG wave logic** (capability-orchestrator Steps 2-4, lines 33-120) is self-contained and transplantable: parse features table -> build adjacency list -> topological sort -> group into waves -> execute per wave with user confirmation. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:33-120`

- **gather-synthesize.md pattern** is scope-agnostic. Takes `subject` string, `gatherers[]` array, and `context` payload with no feature/capability assumptions. Review and doc can widen scope by changing context assembly only. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md:6-20`

- **research-workflow.md Layer 3 scope detection** (lines 68-79): "if no feature_path, scan all features under capability." This pattern directly applies to scope-fluid review/doc context assembly. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md:68-79`

- **`gsd:doc` command capability-level iteration** (Step 6, lines 103-125): reads CAPABILITY.md features table, filters to reviewed features, invokes doc.md per feature. Provides the slug-resolve + feature iteration skeleton for capability-scope review. -- `/Users/philliphall/get-shit-done-pe/commands/gsd/doc.md:103-125`

- **review.md auto-advance logic** (Step 12, lines 162-179): implements review->doc auto-chain with blocker check. Pattern: if 0 blockers -> auto-invoke next stage; if blockers remain -> halt. Reusable for execute->review auto-chain. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:162-179`

- **Reviewer and doc-writer agents are scope-unaware.** They receive artifact paths from the orchestrator and process them without feature/capability assumptions. Widening input paths works without agent definition changes. -- `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md`, `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md`

### Integration Points

- **5+ command files reference capability-orchestrator.md** and must be updated when deleted: `gsd:plan` (capability path routes to orchestrator, line 78), `gsd:execute` (line 79), `gsd:new` (line 116), `gsd:refactor` (line 59), `gsd:enhance` and `gsd:debug` (same pattern). Post-merge, capability-scope work routes to framing-pipeline.md. -- `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md:78`, `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md:79`, `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:116`

- **framing-discovery.md invokes framing-pipeline.md** after brief finalization. The handoff contract passes BRIEF_PATH, LENS, CAPABILITY_SLUG, FEATURE_SLUG, FEATURE_DIR. If framing-pipeline absorbs capability orchestration, this contract needs a capability-scope variant (no specific FEATURE_SLUG, derive features from CAPABILITY.md). -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:1-5`

- **execute.md `offer_next` step** must be modified to signal completion back to the pipeline for auto-chain wiring (FN-08). Currently terminates independently. The pipeline wrapper in framing-pipeline.md handles the chaining, but execute.md's standalone invocation path must also support auto-chain when context allows. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md:188-202`

- **init.cjs `cmdInitFeatureOp`** (line 586) serves review and doc init. Capability-scope ops must either: (a) iterate features calling existing init per feature, or (b) add a capability-scope init route. Option (a) aligns with YAGNI and the existing doc command pattern. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs:586`

### Undocumented Assumptions

- **execute.md and framing-pipeline.md disagree on auto-chain.** framing-pipeline.md:294 says "auto-chain to Stage 5" and line 488 says "Full auto-chain." But execute.md:201 says "The workflow ends." When execute is invoked standalone (via `/gsd:execute`), no auto-chain fires. Auto-chain only works when framing-pipeline manually chains stages 4->5->6 in sequence -- execute.md itself has no return/callback mechanism. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md:201` vs `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:294`

- **4 reviewer agents declare `role_type: judge` but workflows spawn them as `model="sonnet"`.** The workflow model= parameter overrides frontmatter-based resolution. TC-08 resolves this by changing agent frontmatter to `role_type: executor` to match actual spawn behavior (sonnet). -- `/Users/philliphall/get-shit-done-pe/agents/gsd-review-enduser.md:5` (and functional, technical, quality) vs `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:67,74,81,88`

- **gsd-planner declares `role_type: executor` but performs judge-tier work.** It creates plans (structural decisions, architecture choices). model-profiles.md v2 table lists "Planner" under judge tier. TC-08 changes this to `role_type: judge`, which will resolve to inherit/Opus via ROLE_MODEL_MAP. -- `/Users/philliphall/get-shit-done-pe/agents/gsd-planner.md:6` vs `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md:29`

- **progress.md expects `focus_groups` from init but it is never provided.** The workflow parses focus_groups on line 16, and routes D/F reference focus groups (lines 115, 117). But `cmdInitFeatureProgress` in init.cjs never populates this field. Focus routing is dead code -- the workflow must parse ROADMAP.md markdown directly. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/progress.md:16` vs `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs:657-747`

- **capability-orchestrator processes features sequentially within waves** (line 92: "Process one feature at a time"). Despite DAG waves enabling parallelism, actual execution is sequential. This means all features are complete when orchestrator finishes, making post-orchestration review/doc safe to run. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:92`

- **review.md auto-advance passes only feature-scope data.** Step 12 auto-invokes doc with `CAPABILITY_SLUG, FEATURE_SLUG, LENS` (lines 167, 172). No execution scope or multi-feature context survives this handoff -- it is a hard feature-scope boundary. -- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:167-172`
