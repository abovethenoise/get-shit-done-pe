---
lens: enhance
secondary_lens: ""
subject: "Doc-Writer Overhaul: Restructure doc stage from single-agent to gather->synthesize with parallel explorers by focus area, add /gsd:doc standalone skill, expand recommendation scope"
date: 2026-03-04
---

# Research Synthesis

**Synthesized:** 2026-03-04
**Subject:** Doc-Writer Overhaul: Restructure doc stage from single-agent to gather->synthesize with parallel explorers by focus area, add /gsd:doc standalone skill, expand recommendation scope
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Gather-Synthesize Is the Correct Pattern

The existing `gather-synthesize.md` pattern (parallel Task() spawns + synthesizer) is proven, directly reusable, and the right fit for documentation exploration. Research uses 6 gatherers, review uses 4 reviewers -- doc adds 5 explorers using the identical orchestration. No new infrastructure is needed. The AWS scatter-gather pattern validates this architecturally: fan-out to N independent agents, fan-in through a single synthesizer.

[Sources: Domain Truth, Existing System, Prior Art, Tech Constraints]

### Focus Area Boundaries Must Be Enforced at Spawn Time

Vague or overlapping explorer scope causes duplicate work and conflicting recommendations that the synthesizer cannot cleanly resolve. Anthropic's own multi-agent research found vague instructions caused agents to perform identical work. The partition key is the focus area assignment -- each explorer gets exactly one non-overlapping domain in its prompt. TC-03 specifies the partition: code comments reads source files; module/flow docs works from SUMMARYs; standards/decisions and project config read .documentation/ and CLAUDE.md; friction reduction analyzes workflow patterns.

[Sources: Domain Truth, Edge Cases, Prior Art]

### Explorer Failure Must Be Non-Fatal

Individual explorer failures must not abort the entire doc stage. The synthesizer works with whatever findings arrive. The abort threshold from gather-synthesize.md (>50%) applies: with 5 explorers, 3+ failures trigger abort, 2 or fewer proceed. Each explorer must produce a non-empty findings file even if it finds nothing ("no opportunities identified") -- empty files trigger the retry mechanism.

[Sources: Domain Truth, Edge Cases, Tech Constraints]

### LENS Must Be a First-Class Input to Every Explorer

The same set of changed files requires completely different documentation depending on why the change happened (new vs enhance vs debug vs refactor). LENS must be explicitly embedded in each explorer's Task() prompt -- Task() spawns fresh context windows with no implicit state transfer from the orchestrator. The framing-pipeline path already propagates LENS correctly; the standalone and review-auto-chain paths currently do not.

[Sources: Domain Truth, Existing System, User Intent, Tech Constraints]

### /gsd:doc Skill Follows Established Command Pattern

The skill file follows the slug-resolve -> route by type -> invoke workflow pattern used by /gsd:plan, /gsd:execute, and /gsd:review. Slug-resolve handles feature vs capability routing. File lives at `commands/gsd/doc.md` in repo source, deployed to `~/.claude/commands/gsd/doc.md` via install. No novel invocation patterns.

[Sources: Existing System, User Intent, Tech Constraints, Prior Art]

### LENS Default to "enhance" for Standalone Invocation Is Correct

The most common standalone use case is post-review documentation updates on incremental changes. The inference chain is: pipeline context -> RESEARCH.md frontmatter `lens:` field -> "enhance" default. FEATURE.md frontmatter does NOT carry a `lens` field, so it is not a reliable inference source. RESEARCH.md is the reliable fallback because the research synthesizer writes `lens:` into its frontmatter. STATE.md `pipeline_position` is free-form text and cannot be machine-parsed for LENS.

[Sources: Domain Truth, Existing System, Tech Constraints, Edge Cases]

### Recommendations Must Be Actionable (Target File + Change + Rationale)

Vague recommendations defeat the purpose of automation. The minimum useful recommendation unit is: target file, current state, proposed change, rationale. Without all four, the Q&A loop becomes a burden. This structure must be preserved end-to-end from explorer findings through synthesizer to Q&A presentation.

[Sources: Domain Truth, User Intent]

### Q&A Loop Stays in the Workflow, Not the Agent

Q&A via AskUserQuestion happens in doc.md, never inside the doc agent. This is an existing hard constraint. The Q&A input source changes (synthesized recommendations vs single-agent report) but the constraint that orchestrator owns Q&A remains.

[Sources: Existing System, User Intent]

### doc-report.md Is the Contract -- Format Must Be Q&A-Compatible

The synthesizer outputs `{feature_dir}/doc-report.md`. Downstream steps (verify, Q&A, commit) consume this file. The "same format" requirement means Q&A-compatible, not identical schema to the current validation-oriented report. The format expands to include recommendations grouped by focus area with target file, change, rationale, and priority ordering.

[Sources: Existing System, User Intent, Edge Cases]

### Model Split: Explorers on Sonnet, Synthesizer on Opus via inherit

Explorers use `model="sonnet"` (executor role, bounded investigation). Synthesizer uses `model="inherit"` (judge role, runs on Opus). Task() `model` parameter overrides the agent file's `role_type` declaration, so a single agent file CAN serve both roles. This is the established executor/judge split from gather-synthesize.md.

[Sources: Existing System, Tech Constraints, Prior Art]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Single Agent File vs Separate Agent Files for Explorer/Synthesizer

**FEATURE.md decision says:** Single `gsd-doc-writer` agent handles both explorer and synthesizer roles via prompt differentiation -- "same as research gatherers use dimension-specific prompts with shared agent type."

**Edge Cases + Tech Constraints say:** Research gatherers do NOT share agent type -- they use 6 distinct agent files. Review uses 5 distinct agent files. The gsd-doc-writer agent's Role, Success Criteria, and 3-pass validation are all written for the current single-agent doc-writer role. Using it as a focused explorer for CLAUDE.md or friction-reduction conflicts with its defined purpose. Prompt override works mechanically but creates maintenance risk.

**Resolution:** The FEATURE.md claim that research uses "shared agent type" is factually incorrect -- each research dimension has its own agent file. However, the FEATURE.md decision to use a single agent file is still valid IF the agent definition is substantially rewritten to support both roles. The planner should evaluate whether expanding the existing `gsd-doc-writer.md` to cleanly handle both roles is achievable, or whether creating `gsd-doc-explorer.md` and `gsd-doc-synthesizer.md` (following the review pattern with separate files) produces a cleaner result. The TC-01 constraint says "no new agent files unless single agent can't handle both roles" -- the planner must make this judgment call during planning.

[Sources: Edge Cases, Tech Constraints, Existing System]

### Q&A Loop "Unchanged" vs Format Shift

**User Intent / FEATURE.md says:** "Same AskUserQuestion loop as current doc.md Step 7" (FN-06). Q&A mechanics are unchanged.

**Edge Cases says:** The current Q&A loop iterates "each doc (modules first, then flows)" with content preview. The new format is recommendation entries (target file, what to change, why) -- not generated docs. The loop's display logic and iteration model must change to handle recommendation entries instead of document content.

**Resolution:** FN-06's intent is that the Q&A mechanism (AskUserQuestion with Approve/Edit/Reject) is preserved, not that the loop code is literally unchanged. The loop must be updated to iterate recommendations grouped by focus area and present what/why fields instead of content previews. This is a required change, not an optional enhancement. The planner must account for Q&A loop modifications in doc.md Steps 7-8.

[Sources: User Intent, Edge Cases, Existing System]

### Capability-Level Doc via capability-orchestrator.md

**FEATURE.md (TC-02) says:** "Iterates reviewed features via capability-orchestrator pattern (same as execute/review)."

**Tech Constraints says:** capability-orchestrator.md dispatches full framing-pipeline (6 stages) per feature -- reusing it directly would re-run research, plan, execute, review. Incompatible.

**Resolution:** Capability-level `/gsd:doc {cap}` needs a lightweight inline iteration loop in the skill command itself: read CAPABILITY.md features table, filter to features with review artifacts (`{feature_dir}/review/synthesis.md` exists), invoke doc.md per feature sequentially. This follows the capability-orchestrator's iteration logic without importing its full pipeline dispatch. The planner should implement this as inline logic in the /gsd:doc skill, not as a reuse of capability-orchestrator.md.

[Sources: Tech Constraints, Edge Cases]

## Gaps

Missing information, unfilled dimensions, and low-confidence findings. The planner must account for these unknowns.

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Conflict resolution priority for doc recommendations is undefined.** Review has explicit priority ordering (end-user > functional > technical > quality). Doc has no equivalent. When multiple explorers recommend conflicting changes to the same file, the synthesizer uses unguided judgment. The planner should define a priority order for focus areas. [Source: Edge Cases -- single source]

- **What constitutes "review artifacts exist" for capability-level gating is unspecified.** FN-04 says "all features with review artifacts" but the specific gate check (synthesis.md existence? SUMMARY.md? state flag?) is not defined. [Source: User Intent -- single source]

- **Explorer output size bounds are not specified.** Large codebases could produce very large findings files that overwhelm the synthesizer's context window. No mitigation is defined in FEATURE.md. [Source: Edge Cases -- single source]

### Unanswered Questions

- Should the 3-pass self-validation (structural, referential, gate consistency) be split between explorer and synthesizer, dropped entirely, or replaced with a different validation model for the recommendation-based output?
- When `/gsd:doc {cap}` runs on a capability where some features already have doc-report.md from pipeline auto-chain, should it skip, overwrite, or prompt?
- What is the synthesizer's behavior when zero findings files arrive (all 5 explorers fail but below the abort threshold is impossible with 5 -- 5/5 = 100%)?

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Task() `model` accepts only "sonnet", "haiku", "inherit" -- no "opus" | Tech Constraints | Synthesizer must use `model="inherit"`, not `model="opus"` |
| Each Task() spawns fresh context -- LENS must be embedded in prompt | Tech Constraints, Domain Truth | Omitting LENS from explorer prompts means they run without emphasis context |
| Q&A lives in doc.md workflow, never in the agent | Existing System | Moving Q&A into agent breaks the orchestrator/agent boundary |
| `init feature-op` does NOT return LENS -- caller must supply it | Tech Constraints | /gsd:doc must infer LENS itself before calling doc.md |
| `{feature_dir}/doc/` directory does not exist -- must mkdir before explorer spawns | Tech Constraints, Edge Cases | All 5 explorer writes fail simultaneously, triggering 100% abort |
| Explorer findings must be non-empty files (even "nothing found") | Edge Cases | Empty files trigger gather-synthesize retry mechanism |
| Abort threshold >50%: with 5 explorers, 3+ failures = abort | Edge Cases, Domain Truth | Threshold must be stated explicitly in restructured doc.md |
| `subagent_type="general-purpose"` must change to `subagent_type="gsd-doc-writer"` | Existing System | Aligns with named-agent pattern; current generic type bypasses agent definitions |
| Section ownership model ([derived]/[authored]) must be preserved | Existing System | Overwriting it silently breaks existing .documentation files |
| `commit_docs` flag from `init feature-op` gates git commit | Existing System | /gsd:doc must call init to get this flag; skipping it = undefined commit behavior |
| Focus areas are stable -- not configurable per-run | User Intent, Prior Art | YAGNI; conditional spawning adds orchestration complexity without proportional value |
| review.md auto-chain (Step 12) must pass LENS to doc.md | Existing System | Currently omits LENS; doc explorers receive no emphasis context on the most common invocation path |
| All changes must deploy atomically (doc.md + agent definition) | Edge Cases | Partial deploy = explorers produce findings but synthesizer uses old module/flow schema |

## Recommended Scope

Actionable guidance for the planner: what to build, what to skip, what needs more investigation.

### Build (In Scope)

- **Restructure doc.md Step 4** from single Task() to 5 parallel explorer Task() blocks + 1 synthesizer Task(), following gather-synthesize.md pattern -- this is the core deliverable [Sources: all 6 gatherers agree]
- **Define 5 focus area explorer prompts** with explicit non-overlapping scope assignments: code comments, module/flow docs, standards/decisions, project config, friction reduction [Sources: Domain Truth, User Intent, Prior Art]
- **Create /gsd:doc skill** at `commands/gsd/doc.md` following slug-resolve -> route -> invoke pattern, supporting feature-level and capability-level invocation [Sources: Existing System, User Intent, Tech Constraints, Prior Art]
- **Add LENS propagation** to each explorer Task() prompt; fix review.md Step 12 auto-chain to pass LENS; implement LENS inference chain for standalone invocation (RESEARCH.md frontmatter -> "enhance" default) [Sources: Domain Truth, Existing System, Tech Constraints]
- **Update Q&A loop** in doc.md Steps 7-8 to iterate recommendations grouped by focus area instead of per-doc modules/flows [Sources: Edge Cases, User Intent]
- **Expand gsd-doc-writer agent definition** to support both explorer and synthesizer roles via prompt differentiation (or create separate agent files if single-file approach is unworkable) [Sources: Tech Constraints, Edge Cases]
- **Add `mkdir -p "${FEATURE_DIR}/doc"` to doc.md** before explorer spawns [Sources: Tech Constraints, Edge Cases]
- **Remove `key_constraints` "Single-agent pipeline" note** from doc.md [Source: User Intent]
- **Implement capability-level iteration** as inline loop in /gsd:doc skill (not via capability-orchestrator.md) [Sources: Tech Constraints, Edge Cases]

### Skip (Out of Scope)

- **Auto-applying recommendations** -- user approves each via Q&A [Source: User Intent, FEATURE.md EU-01 Out of Scope]
- **Changing .documentation directory structure** [Source: User Intent, FEATURE.md EU-01 Out of Scope]
- **Configurable focus areas per-run** -- YAGNI, adds complexity without value [Source: User Intent, Prior Art]
- **External documentation tools/libraries** (DocAgent, RepoAgent, etc.) -- internal patterns cover everything needed [Source: Prior Art]
- **Running /gsd:doc without prior execution/review artifacts** [Source: User Intent, FEATURE.md EU-02 Out of Scope]
- **LENS inference from STATE.md pipeline_position** -- free-form text, not machine-parseable [Sources: Tech Constraints, Edge Cases]

### Investigate Further

- **Single agent file vs separate agent files** -- The planner must evaluate whether expanding gsd-doc-writer.md to handle explorer + synthesizer roles cleanly is achievable, or whether 2 new agent files (gsd-doc-explorer.md + gsd-doc-synthesizer.md) produce cleaner separation. The FEATURE.md decision favors single file but the evidence from research/review patterns favors separate files. [Sources: Edge Cases, Tech Constraints, Existing System]
- **Focus area conflict resolution priority** -- Define ordering (e.g., code comments > module docs > standards > config > friction) for when multiple explorers recommend conflicting changes to the same target file. Without this, synthesizer behavior is inconsistent. [Source: Edge Cases]
- **"Review artifacts exist" gate condition for capability-level invocation** -- Specify the exact check: `{feature_dir}/review/synthesis.md` existence is the most reliable signal. [Source: User Intent]
- **3-pass validation split** -- Decide whether structural/referential/gate validation is dropped, moved to synthesizer only, or split across roles. Current validation model is executor-centric. [Sources: Existing System, Edge Cases]
