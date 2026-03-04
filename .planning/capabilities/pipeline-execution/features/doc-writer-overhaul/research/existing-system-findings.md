## Existing System Findings

### Relevant Implementations

- **doc.md is a 12-step single-agent workflow**: Steps 1-3 initialize, locate artifacts, assemble context; Step 4 spawns one `general-purpose` Task; Steps 5-12 verify, present Q&A, commit. The entire pipeline from spawn to commit is orchestrated in one sequential flow — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md` (all 119 lines)

- **Step 4 spawns `subagent_type="general-purpose"`** — not a named agent type like reviewers use. This deviates from the established pattern where spawned agents use their slug as `subagent_type` (e.g., `gsd-review-enduser`). The doc-writer is the only pipeline agent still using the generic subagent type — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:50`

- **gsd-doc-writer agent is `role_type: executor`** — maps to Sonnet per model-profiles.md. Both the explorer and synthesizer roles in the new design will need to handle this split: explorers stay executor/Sonnet, synthesizer should be judge/inherit (Opus). The current agent definition has no synthesizer role — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:4`

- **gsd-doc-writer scope is narrow**: "Primary: Files directly modified in reviewed change." "Impact discovery (one hop): Grep existing flow docs for references to modified modules." Output targets are exclusively `.documentation/` directory paths. No mention of CLAUDE.md, hooks, standards, or friction-reduction recommendations — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:29-31`

- **Q&A loop in doc.md is per-doc (modules/flows), not per-recommendation**: Step 7 iterates "for each doc (modules first, then flows)" with Approve/Edit/Reject. The new design presents recommendations per focus area — the loop structure must change from doc-level to recommendation-level — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:64-71`

- **gather-synthesize.md is the canonical parallel pattern**: Defines parameters (`gatherers[]`, `synthesizer`, `context`, `subject`), 5-step process (context assembly, parallel spawn, failure handling, synthesize, completion), failure threshold (>50% abort), retry-once policy, and the Executor/Judge model split. Explicitly notes "any future workflow needing parallel analysis + consolidation" as a reuse target — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md`

- **review.md is the nearest functional analogue**: 4 parallel reviewer Task() spawns using named `subagent_type` values (`gsd-review-enduser`, `gsd-review-functional`, `gsd-review-technical`, `gsd-universal-quality-reviewer`), all at `model="sonnet"`. Synthesizer uses `subagent_type="gsd-review-synthesizer"`, `model="inherit"`. This is the exact spawn pattern doc explorers should replicate — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:61-113`

- **Skill command pattern is consistent across plan/execute/review**: Each skill has YAML frontmatter (`name`, `description`, `argument-hint`, `allowed-tools`), `<objective>`, `<execution_context>`, `<context>`, and `<process>` sections. Process always: (1) slug-resolve via `gsd-tools.cjs`, (2) handle resolution result with ambiguous/no-match branches, (3) route to workflow. The `/gsd:doc` skill must follow this exact structure — `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md`, `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md`, `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md`

- **`/gsd:plan` supports both feature and capability routing**: Slug-resolve detects type; capability -> capability-orchestrator.md; feature -> plan.md directly. This is the pattern `/gsd:doc` should replicate for capability-level doc runs — `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md:45-56`

- **`/gsd:review` is feature-only**: Uses `--type feature` hint in slug-resolve. Does not support capability-level invocation. The `/gsd:doc` design requires both, so `/gsd:plan` and `/gsd:execute` are the structural models, not `/gsd:review` — `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md:34`

- **LENS propagates into doc.md as a declared input but is only used for context assembly (Layer 4)**: LENS is listed as an input (`debug | new | enhance | refactor`) and shapes the "lens-specific doc focus" in Step 2 context assembly. The doc agent's `Framing Context` section also uses LENS to adjust emphasis. However, LENS is never passed to the spawned Task() — it is embedded in the prompt context — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:12,37-38`

- **review.md auto-chains to doc.md at Step 12**: When 0 blocker/major findings remain, auto-invokes `@{GSD_ROOT}/get-shit-done/workflows/doc.md` passing only CAPABILITY_SLUG and FEATURE_SLUG — LENS is NOT passed in the auto-chain call — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:163-168`

- **framing-pipeline.md passes LENS to doc.md** at Stage 6: Provides framing_context block including `Primary lens: {LENS}` and lens-specific doc emphasis. The pipeline-invoked path does propagate LENS correctly; the standalone review auto-chain path does not — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:354-377`

- **doc.md output directory convention is `{feature_dir}/doc-report.md`**: The doc-report.md file is the contract between the doc stage and the commit step. The overhaul adds `{feature_dir}/doc/` as explorer output directory while keeping doc-report.md as synthesizer output — confirmed by FN-03 in FEATURE.md and the existing Step 12 completion message referencing `{feature_dir}/doc-report.md` — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:104`

- **No `/gsd:doc` skill file exists**: `commands/gsd/` contains: debug, new, discuss-capability, focus, status, resume-work, progress, init, discuss-feature, refactor, plan, review, enhance, execute — no `doc.md`. The file must be created from scratch — confirmed via Glob of `/Users/philliphall/get-shit-done-pe/commands/gsd/*.md`

### Constraints

- **`subagent_type="general-purpose"` in doc.md Step 4 must change to `subagent_type="gsd-doc-writer"`** to align with the named-agent pattern all other pipeline stages use. Using `general-purpose` bypasses agent file role definitions — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:50` (all other stages use named agent slugs)

- **Section ownership model ([derived]/[authored]) is baked into gsd-doc-writer** and documented with exact heading templates. Any restructure of the agent for explorer/synthesizer dual-role must preserve this model or explicitly split it across roles. Overwriting it silently would break existing `.documentation/` files — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:63-77`

- **3-pass self-validation is an agent-level responsibility, not orchestrator-level**: Passes 1 (structural), 2 (referential integrity), and 3 (gate doc consistency) are explicitly defined in the agent and their results written to doc-report.md. If the agent splits into explorer vs synthesizer, the validation responsibility must be re-assigned — explorer validates its own findings; synthesizer validates the final assembled report — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:124-146`

- **Q&A mechanics in doc.md Steps 7-8 are defined in the orchestrator, not in the agent** — the agent never calls AskUserQuestion. This is a firm constraint from `key_constraints`: "Q&A happens HERE via AskUserQuestion — NOT inside doc agent." The Q&A loop structure changes (from per-doc to per-recommendation), but the constraint that Q&A lives in the workflow, not the agent, must hold — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:109`

- **doc.md currently produces `.documentation/` module and flow files as primary outputs** — these are named, structured artifacts. If explorers produce findings files (not `.documentation/` files directly), the synthesizer must decide which recommendations result in actual `.documentation/` file writes — a downstream step not currently modeled. The FEATURE.md spec says explorers write findings to `{feature_dir}/doc/`, synthesizer writes `doc-report.md` with recommendations. Actual `.documentation/` file writes happen only for approved recommendations after Q&A — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:87-95`

- **`commit_docs` flag from gsd-tools init controls whether git commit runs** — this is a CLI-managed gate, not a doc-stage invention. Any new doc entry point (`/gsd:doc`) still needs to call `init feature-op ... doc --raw` to get this flag. Skip it and git commit behavior becomes undefined — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:20`

### Reuse Opportunities

- **gather-synthesize.md Steps 1-5 are directly reusable** as the orchestration pattern for 5 parallel doc explorers + 1 synthesizer. The Task() prompt template, failure handling (retry once, >50% abort), and manifest construction are all reusable without modification — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` (Steps 2-4)

- **review.md Step 4 parallel Task() spawn blocks are the direct model for doc explorer spawns**: Copy structure (prompt template, subagent_type per agent, model="sonnet"), replace reviewer agents with 5 doc explorer agent references. The `mkdir -p "${FEATURE_DIR}/doc"` setup follows the same `mkdir -p "${FEATURE_DIR}/review"` pattern — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:30,61-91`

- **plan.md and execute.md `/gsd:doc` skill structure**: Both use the identical 3-section process (slug-resolve, handle-resolution, workflow-invocation) with capability+feature routing. The entire process block from either command can be cloned with `doc.md` substituted as the invoked workflow — `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md:34-82`

- **gsd-doc-writer.md `Framing Context` section** already handles all 4 lenses with appropriate emphasis instructions. This lens-aware behavior is reusable as-is for explorer agents receiving LENS in their prompt — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:47-53`

- **doc.md Steps 1-3 (init, context assembly, artifact location) are preserved unchanged** per FN-05. These 3 steps produce the file lists and review synthesis that all 5 explorers consume — no rework needed — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:17-43`

- **doc.md Steps 9-12 (trace table update, commit, output paths, completion message) are preserved unchanged**. They consume doc-report.md which the synthesizer produces in the same format — no rework needed — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:79-106`

- **research-workflow.md explorer output naming convention** (`{dimension}-findings.md` in `{output_dir}/research/`) is directly reusable as the model for doc explorer output naming: `{focus-area}-findings.md` in `{feature_dir}/doc/` — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md:112-135`

### Integration Points

- **review.md Step 12 auto-chain must pass LENS when invoking doc.md**: Currently auto-chains with only CAPABILITY_SLUG and FEATURE_SLUG. To fulfill EU-03 (LENS shapes explorer emphasis), the auto-chain must also pass LENS. The LENS is available in review.md's context at Step 12 — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:165-168`

- **framing-pipeline.md Stage 6 invocation already passes LENS correctly** and will continue to work without modification once doc.md propagates LENS to explorer prompts — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:353-377`

- **capability-orchestrator.md is the model for capability-level `/gsd:doc` routing**: The orchestrator reads CAPABILITY.md features table, builds DAG, groups waves, and dispatches per-feature pipelines. A `/gsd:doc {cap}` invocation would use the same orchestrator pattern with `LENS=doc` — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:14-25`

- **gsd-tools.cjs `slug-resolve` is the mandatory entry point for all skill commands**: `/gsd:doc` must call `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS"` as Step 1. No skill command bypasses this — `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md:38`

- **`init feature-op ... doc --raw` gates the workflow**: Must be called at Step 1 of doc.md to parse `feature_found`, `feature_dir`, `commit_docs`, etc. The new `/gsd:doc` standalone path must still funnel through this init call before invoking doc.md — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:20-23`

### Undocumented Assumptions

- **doc.md assumes LENS is always provided** (listed as a required input), but the review.md auto-chain at Step 12 does not pass LENS — meaning in the most common non-framing-pipeline invocation path, LENS arrives as undefined. The current doc-writer apparently operates without it silently — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:165-168` vs `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:12`

- **gsd-doc-writer.md assumes all context (file paths, review artifacts, gate doc paths) is provided by the orchestrator at spawn time**: "All context ... is provided by the orchestrator at spawn time." This means the agent does NO path resolution itself. Explorer agents inherit this assumption — they depend entirely on the orchestrator providing scoped file lists — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:150`

- **The doc workflow assumes `.documentation/gate/` exists** — Steps validate against `glossary.md`, `constraints.md`, and `state.md` in that directory (Pass 3). No init check verifies these exist before spawning the agent — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:143-146`

- **`general-purpose` subagent_type in doc.md Step 4 means no agent file is read by the spawned task** — the prompt must contain the full role definition inline, or the agent reads its own file via the prompt instruction. This is inconsistent with how other pipeline stages work (they pass agent path in the prompt and the agent reads it) — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md:50`

- **doc-report.md format is assumed to be stable as the Q&A contract** but is not formally specified anywhere — it is only described as containing "pass 1/2/3 results", "impact flags", and "coverage statement." The FEATURE.md overhaul adds recommendations with target file + what to change + why + focus area, which is a significant format expansion not currently documented — `/Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md:158-162`
