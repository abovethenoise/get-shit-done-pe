## Tech Constraints Findings

### Hard Constraints

- **Zero runtime dependencies** -- package.json shows only devDependencies (c8, esbuild). All implementation is pure Node.js CommonJS. No library APIs to constrain or break. -- `package.json` lines 38-41
- **Node >= 16.7.0 required** -- engines field. No ESM, no top-level await, no Node 18+ APIs in minimum target. -- `package.json` line 37
- **Claude Code model parameter: only sonnet/inherit/haiku** -- ROLE_MODEL_MAP maps executor->sonnet, judge->inherit (Opus), quick->haiku. Cannot specify "opus" directly. -- `core.cjs` lines 18-22
- **No new files permitted (TC-06)** -- consolidation refactor must produce net negative line count and zero new files. -- `FEATURE.md` TC-06
- **PLAN.md immutability invariant** -- once created, cannot be modified. Remediation loop (FN-03) must create new PLANs. -- `CAPABILITY.md` Invariant 3
- **State mutations only via gsd-tools CLI** -- no direct file writes for state changes. -- `CAPABILITY.md` Invariant 4
- **200k token context window per agent is fixed** -- each Task() subagent gets fresh 200k context. All payload + agent file reads must fit. -- [First principles: Claude Code agent architecture]
- **execute.md terminates by design** -- Step "offer_next" (line 201): "The workflow ends. The user decides next steps." This is the auto-chain break point FN-08 must fix. -- `execute.md` lines 196-202

### Dependency Capabilities

- **slug-resolve**: Already supports both capability and feature resolution via 3-tier matching (exact, fuzzy, fall-through). `typeHint` parameter is optional; omitting it searches both scopes. `--type feature` forces feature-only. -- `core.cjs` lines 394-473
- **gsd-tools init routes**: `init plan-feature`, `init execute-feature`, `init feature-op` all require CAPABILITY_SLUG + FEATURE_SLUG. No capability-scope-only init route exists for plan/execute/review/doc. -- `plan.md` Step 1, `execute.md` Step 1, `review.md` Step 1, `doc.md` Step 1
- **Reviewer agents are scope-agnostic** -- They receive `<review_context>` with artifact lists and requirement IDs, then trace against code. Will work with any artifact list (single or multi-feature). Zero agent definition changes needed. -- `agents/gsd-review-enduser.md`, `agents/gsd-review-quality.md`
- **Doc explorer agents are scope-agnostic** -- gsd-doc-writer.md operates on whatever `feature_artifacts` list is passed. Explorer boundaries (code-comments, module-flow-docs) are content-based, not feature-scoped. Zero changes needed. -- `agents/gsd-doc-writer.md`
- **research-workflow.md is reference documentation only** -- Not invoked via Task(). plan.md and framing-pipeline.md own their own research Task() spawns. Deleting it breaks zero invocation chains. -- `research-workflow.md` purpose block
- **plan.md already contains full research pattern** -- Step 5 has all 6 gatherers + synthesizer inline with lens-aware reuse check. Research is already "absorbed into plan" in practice. -- `plan.md` Step 5 (lines 58-167)
- **framing-pipeline.md Stage 1 duplicates plan.md research** -- Identical 6-gatherer spawn block. Since framing-pipeline calls plan.md at Stage 3, research would run twice if both kept. -- `framing-pipeline.md` lines 85-172 vs `plan.md` Step 5
- **review.md already has auto-advance to doc** -- Step 12 (lines 161-179) auto-invokes doc.md when no blockers remain. Wiring exists at feature scope. -- `review.md` Step 12
- **doc.md command already supports capability scope** -- `commands/gsd/doc.md` Step 6 iterates features inline without using capability-orchestrator. -- `commands/gsd/doc.md` lines 101-125
- **progress.md has focus group reading** -- Routes based on artifact presence but lacks active focus-group-first priority logic. -- `progress.md` Step "route"

### Compatibility Issues

- **8 command files reference capability-orchestrator.md** -- plan.md, execute.md, enhance.md, refactor.md, debug.md, new.md must all be updated to route capability-scope to framing-pipeline.md instead. -- grep across `commands/gsd/`
- **review.md command forces `--type feature`** -- `slug-resolve "$ARGUMENTS" --type feature` at `commands/gsd/review.md` line 34 prevents capability-scope resolution. TC-05 requires removing this constraint. -- `commands/gsd/review.md` line 34
- **4 reviewer agents have wrong role_type** -- gsd-review-enduser, gsd-review-functional, gsd-review-technical, gsd-review-quality: frontmatter says `role_type: judge` but Task() calls use `model="sonnet"` (executor tier). Should be `role_type: executor`. -- agent frontmatter vs `review.md` Task() blocks
- **gsd-planner has wrong role_type** -- `role_type: executor` in frontmatter but is a judge (synthesizes, plans, decides). Should be `role_type: judge` with `model="inherit"`. Workflows currently use `model="{planner_model}"` which resolves via `resolveModelFromRole` -- changing role_type will change the model from sonnet to inherit. **This is an intentional behavioral change per TC-08.** -- `agents/gsd-planner.md` line 6
- **framing-pipeline.md is hard-coded to single-feature flow** -- Every stage passes `FEATURE_SLUG` and `FEATURE_DIR` for one feature. No concept of execution scope spanning multiple features. Lines 264-376 all pass single-feature framing_context. -- `framing-pipeline.md`
- **framing-discovery.md can pass null FEATURE_SLUG** -- Step 10 line 268: `FEATURE_SLUG: The resolved feature slug (null if capability-level)`. framing-pipeline.md does not currently handle null FEATURE_SLUG. -- `framing-discovery.md` line 268
- **Review/doc output paths are feature-scoped** -- Review traces: `{feature_dir}/review/`. Doc findings: `{feature_dir}/doc/`. For capability-scope, need a different output location (e.g., `{capability_dir}/review/`). -- `review.md` line 31, `doc.md` lines 107-111
- **Documentation files reference deleted workflows** -- `.documentation/modules/research-workflow.md` and `.documentation/flows/pipeline-execution/scope-aware-routing.md` reference capability-orchestrator. Not code, but should be updated to avoid confusion. -- grep results
- **Dual research spawn is a run-twice risk** -- If framing-pipeline Stage 1 (research) is not removed, and plan.md Step 5 also runs research, research runs twice per feature in the framing-pipeline flow. FN-04 requires removing Stage 1 so plan.md is sole research owner. -- `framing-pipeline.md` Stage 1 vs `plan.md` Step 5

### Line Budget Analysis (TC-06)

| File | Current Lines | Change | Net |
|------|--------------|--------|-----|
| capability-orchestrator.md | 156 | Delete entirely | -156 |
| research-workflow.md | 224 | Delete entirely | -224 |
| framing-pipeline.md Stage 2 | ~50 | Remove | -50 |
| framing-pipeline.md Stage 1 (research) | ~90 | Remove (plan.md owns) | -90 |
| framing-pipeline.md per-feature loops | ~30 | Remove | -30 |
| **Total deletions** | | | **-550** |
| framing-pipeline.md DAG absorption | | Add ~60 | +60 |
| framing-pipeline.md scope branching | | Add ~40 | +40 |
| Auto-chain wiring in plan/execute | | Add ~30 | +30 |
| Review/doc scope relaxation in commands | | Add ~20 | +20 |
| Progress focus-aware routing | | Add ~30 | +30 |
| **Total additions** | | | **+180** |
| **Net** | | | **-370** |

Budget is comfortable. Significant headroom for implementation. -- line counts from `wc -l` across all affected files (3087 total)

### Context Budget for Capability-Scope Review

| Component | 1 Feature | 5 Features |
|-----------|-----------|------------|
| Agent definition | ~2k chars | ~2k chars |
| Layer 1-2 (PROJECT+STATE+ROADMAP+CAPABILITY) | ~33k chars | ~33k chars |
| Layer 3 (FEATURE.md x N) | ~7k chars | ~35k chars |
| Artifact list (SUMMARY refs) | ~2k chars | ~10k chars |
| Agent file reads during execution | ~50k chars | ~120k chars |
| **Estimated total** | **~94k chars (~24k tokens)** | **~200k chars (~50k tokens)** |

5-feature capability review: ~50k tokens context payload, leaving ~150k tokens for agent reasoning. Viable. 8+ features: constrained, may need chunking. -- [First principles: 200k token limit, ~4 chars/token, measured file sizes]

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Delete capability-orchestrator.md, absorb DAG into framing-pipeline.md (TC-01, FN-06) | Viable | DAG logic is ~60 lines. framing-pipeline.md is 494 lines. Net: -96 lines. Must update 6 command files. -- `capability-orchestrator.md` |
| Delete research-workflow.md (TC-02) | Viable | Reference doc only, zero callers. -224 lines clean. -- `research-workflow.md` purpose block |
| Remove framing-pipeline Stage 2 (TC-03) | Viable | ~50 lines. Requirements come from discuss-feature. No downstream dependency on auto-generation. -- `framing-pipeline.md` lines 180-230 |
| Remove framing-pipeline Stage 1 research (FN-04) | Viable | ~90 lines. plan.md Step 5 already owns identical research spawns with lens-aware reuse. Removing Stage 1 eliminates duplicate-run risk. -- `framing-pipeline.md` lines 73-178 vs `plan.md` Step 5 |
| Remove per-feature review/doc loops (TC-04) | Viable | Review/doc invocation changes from per-feature to once-per-execution-scope. Agents are scope-agnostic. -- `framing-pipeline.md` Stages 5-6 |
| Relax review command scope (TC-05) | Viable | Remove `--type feature` from `commands/gsd/review.md` line 34. Add capability handling like doc.md command pattern. -- `commands/gsd/review.md` |
| Scope detection via SUMMARY.md presence | Viable | SUMMARY.md already exists per-plan in feature dirs. Glob scan requires no new tooling. -- [First principles: SUMMARY.md is the existing execution completion marker] |
| Auto-chain execute->review (FN-08) | Constrained | execute.md terminates by design. Fix is in framing-pipeline.md orchestration, not in execute.md. Context exhaustion after multiple agent spawns is the real risk -- must include fallback to present next command. -- `execute.md` line 201, `FEATURE.md` EU-02 |
| Auto-chain plan->execute (FN-08) | Constrained | plan.md runs research (6 agents) + planner + checker before execute even starts. Context budget may be exhausted. Same fallback strategy needed. -- `plan.md` lines 370-376 |
| Review remediation loop (FN-03) | Viable | Reuses existing planner + executor. review.md has re-review cycle (max 2). Adding "feed findings to planner" extends existing flow. -- `review.md` Step 9 |
| Focus-aware progress routing (FN-07) | Viable | progress.md already reads focus groups and routes by artifact presence. Enhancement is prioritization logic, not new infrastructure. -- `progress.md` |
| TC-06 no net line increase | Viable | ~-370 net lines estimated. Comfortable budget. -- line budget analysis above |
| TC-08 fix role_type mismatches | Viable | 4 reviewers: judge->executor. 1 planner: executor->judge. Workflows already use correct model= params for reviewers. **Planner model WILL change from sonnet to inherit (Opus) -- this is the intended effect of TC-08.** -- agent frontmatter, `core.cjs` ROLE_MODEL_MAP |
| 5-feature capability-scope review | Viable | ~50k tokens context. Well within 200k limit. -- context budget analysis above |
| 8+ feature capability-scope review | Constrained | Context payload approaches 200k. May need chunked review strategy. -- context budget analysis above |

### Alternatives

- **Auto-chain blocked by context exhaustion** -> Present concrete next command for fresh context. Already specified in EU-02: "If context window is exhausted, present next command for user to run in fresh context." -- `FEATURE.md` FN-08
- **Large capabilities (8+ features) overflow context** -> Chunked review: split features into groups of 3-5, run review per chunk, then meta-synthesize. Synthesizer already handles partial inputs. -- [First principles: chunking is standard mitigation for context overflow]
- **review.md/doc.md input contract is feature-scoped** -> Parameterize scope: add EXECUTION_SCOPE parameter ("feature" or "capability") with features[] list. Capability-scope iterates features[] for artifact assembly but runs same agents. Avoids duplicating workflows. -- [First principles: parameterize scope rather than duplicate]
- **DAG absorption makes framing-pipeline.md too large** -> Extract DAG logic into `references/` directory (like gather-synthesize.md). Not a new workflow, just a reference doc. -- [First principles: reference docs aren't invoked files, preserving TC-06 "no new files" constraint if interpreted strictly]

### Key Findings Summary

1. **The auto-chain "bug" is a misattribution.** execute.md correctly ends without chaining. framing-pipeline.md correctly chains execute->review->doc. The real issue: framing-pipeline runs review/doc per-feature, not per-execution-scope.

2. **Agent definitions need zero changes.** All reviewer and doc explorer agents are scope-agnostic -- they operate on whatever artifact list the orchestrator provides.

3. **Context overflow is real for 8+ feature capabilities** but manageable for typical 3-5 feature capabilities (~50k tokens of 200k budget).

4. **The refactor is primarily orchestration logic** (framing-pipeline.md absorbing capability-orchestrator.md), not agents or gsd-tools.cjs. The orchestrator needs to defer review/doc until full execution scope completes, then assemble multi-feature artifact list.

5. **plan.md already owns research.** framing-pipeline Stage 1 is a duplicate. Removing it (FN-04) is clean with zero risk -- plan.md Step 5 has identical code with lens-aware reuse checking.

6. **Planner model will change.** Fixing gsd-planner role_type from executor to judge means ROLE_MODEL_MAP resolves to `inherit` (Opus) instead of `sonnet`. This is the explicit intent of TC-08 but is a behavioral/cost change worth noting.

7. **Line budget is very comfortable.** ~550 lines deleted vs ~180 added = ~370 net reduction. Well within TC-06 constraint.
