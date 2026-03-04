# Research Synthesis

**Synthesized:** 2026-03-04
**Subject:** pipeline-execution/research-overhaul
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### The `@workflow.md` delegation pattern is the root cause of research shortcutting

The "Invoke @research-workflow.md" pattern in plan.md Step 5 (line 60) and framing-pipeline.md Stage 1 (line 86) is ambiguous. The model interprets it as "read this file" or "delegate to primary collaborator" rather than "orchestrate 6 parallel Task() spawns." The model itself diagnosed this failure in a prior session. The `Task()` pseudo-code pattern (used in plan.md Step 7, execute.md) is the only unambiguous agent-spawn signal in the codebase and has never caused shortcuts.

[Sources: Domain Truth, Existing System, User Intent, Tech Constraints, Edge Cases, Prior Art -- all 6 gatherers independently identified this as the root cause]

### Explicit `Task()` pseudo-code is the proven fix for delegation ambiguity

Plan.md Step 7's `Task(prompt=..., subagent_type=..., model=..., description=...)` block works reliably. The fix is to replicate this pattern for research spawning. Anthropic's own docs confirm explicit parallel tool-call instruction boosts compliance to ~100%. Prior art from Anthropic's multi-agent research system uses imperative enumeration over delegation.

[Sources: Domain Truth, Existing System, Tech Constraints, Prior Art]

### The binary `has_research` check is structurally insufficient for lens-aware reuse

`init.cjs:491` checks only file existence (`files.some(f => f === 'RESEARCH.md')`). No lens metadata, no timestamp, no scope comparison. Research produced under `/new` lens is silently reused for `/enhance` work -- different lenses emphasize different research dimensions. RESEARCH.md has no standardized frontmatter schema to store lens metadata.

[Sources: Domain Truth, Existing System, Tech Constraints, Edge Cases, Prior Art]

### Skip gates must be removed -- their presence structurally communicates optionality

`--skip-research` (model-parsed flag, no CLI enforcement) and `research_enabled` (config gate) signal to the model that research is optional. Academic research shows conditional gates around steps cause models to favor the skip branch under resource pressure. Anthropic's long-running agent patterns avoid skip gates entirely for mandatory steps. Research grounds planning in codebase-specific facts that training knowledge cannot provide (up to 93.1% accuracy drop for unspecified requirements).

[Sources: Domain Truth, User Intent, Prior Art]

### Both plan.md and framing-pipeline.md must be fixed consistently

Both callers use identical `@workflow.md` delegation patterns. Both route to research-workflow.md. The fix must apply to both to prevent the anti-pattern from persisting in either entry point.

[Sources: Existing System, User Intent, Edge Cases]

### `gather-synthesize.md` and `research-workflow.md` are invariants -- callers change, not these files

The BRIEF explicitly declares these as invariant. The fix works by changing how callers invoke research, not by modifying the research orchestration core or gatherer agents.

[Sources: Existing System, User Intent, Tech Constraints]

### Lens metadata must be persisted alongside RESEARCH.md for reuse comparison

If the reuse check must compare current lens against prior lens, the prior lens must be stored somewhere. Frontmatter in RESEARCH.md is the lowest-cost approach -- `extractFrontmatter()` already exists in `frontmatter.cjs`, and the synthesizer can be instructed to write it. No new infrastructure needed.

[Sources: User Intent, Tech Constraints, Edge Cases, Prior Art]

### The `@workflow.md` anti-pattern is systemic across all workflow-to-workflow calls

Grep of the codebase reveals 9+ instances of bare `@{GSD_ROOT}/workflows/*.md` delegation: framing-pipeline (5 instances: research, plan, execute, review, doc), capability-orchestrator (1), review (1), framing-discovery (1), research-workflow (1). Not all are bugs -- some are sequential stage handoffs that work correctly as inline reads. The audit must distinguish agent-spawn delegation (bug) from context reading (correct).

[Sources: Existing System, User Intent, Edge Cases]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Where should the 6 explicit Task() blocks live?

**Tech Constraints says:** Multiple viable options exist -- (a) inline Task() blocks in research-workflow.md, (b) keep gather-synthesize.md as shared pattern with stronger imperative language, (c) inline Task() blocks in each caller (plan.md, framing-pipeline.md) directly.

**Prior Art says:** Callers should own the spawn instructions directly. research-workflow.md becomes reference documentation. "When in doubt, use inline execution" (Temporal pattern).

**Domain Truth says:** Task() blocks must be in the main context that can spawn subagents. Subagents cannot spawn other subagents -- so if research-workflow.md is spawned as a Task(), it cannot then spawn 6 gatherers.

**Resolution:** Domain Truth's constraint is decisive. If plan.md spawns research-workflow.md as a single Task(), that subagent cannot spawn the 6 gatherers (no nested spawning). Therefore either: (a) research-workflow.md runs in the main context (not as a Task) and uses explicit Task() blocks to spawn gatherers, or (b) the caller (plan.md / framing-pipeline.md) embeds the 6 Task() blocks directly. Option (b) creates DRY violation across two callers. Option (a) requires the main context to read and execute research-workflow.md inline -- which is the current pattern that fails. The most reliable approach: the caller's Step 5 contains the explicit 6 Task() blocks directly, with research-workflow.md as `required_reading` for context. The DRY cost is acceptable because the alternative (ambiguous delegation) is the documented root cause.

### Should the audit fix ALL `@workflow.md` instances or only agent-spawn instances?

**User Intent says:** The audit must distinguish "ambiguous delegation that spawns agents" from "reference reading that the current context executes." Not all `@{path}` patterns are bugs.

**Edge Cases says:** review.md auto-invokes doc.md via `@` -- same anti-pattern. framing-pipeline.md stages 3-6 use bare `@` delegation.

**Existing System says:** framing-pipeline stages 3-6 are sequential single-agent invocations, architecturally different from parallel multi-agent spawns. `execute.md` correctly uses `@` inside Task() prompts for context file references.

**Resolution:** The audit should classify each instance: (1) parallel agent spawn = must use Task() (research is the only current case), (2) sequential workflow handoff = `@` reference may work but should be evaluated for reliability, (3) context file reference inside Task() prompt = correct usage. The feature scope fixes category 1 definitively and documents categories 2-3 for future work.

### Lens-aware reuse: frontmatter vs CLI flag vs user Q&A

**Tech Constraints says:** Multiple options: frontmatter in RESEARCH.md, CLI `--lens` parameter to init, or Bash grep of RESEARCH.md header.

**User Intent says:** Must work without user intervention for the common case (IR-1). User Q&A only for genuinely ambiguous cases.

**Prior Art says:** Scope-key cache invalidation (Prefect pattern): composite key = (file_path + lens). Store lens in RESEARCH.md at write time, compare at read time.

**Resolution:** Frontmatter approach wins on all criteria: automatic (no user Q&A), deterministic (exact lens match), zero infrastructure (extractFrontmatter already exists), no gsd-tools changes required for v1 (workflow can read RESEARCH.md directly via Bash). The synthesizer writes `lens: {primary_lens}` and `secondary_lens: {secondary_lens}` in RESEARCH.md frontmatter; plan.md reads it and compares.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Compound lens comparison logic** -- Only Edge Cases covers the case where current invocation has a primary+secondary lens pair but prior research had only a primary lens. No formal compatibility matrix exists. The comparison logic must handle tuple comparison, not just scalar. [Source: Edge Cases]

- **Stale research with matching lens** -- Edge Cases notes that RESEARCH.md could match the current lens but be stale (written before major FEATURE.md rewrites). No timestamp comparison exists. Whether to add timestamp checking is unresolved. [Source: Edge Cases]

- **Trivial feature + mandatory research** -- Edge Cases flags that mandatory research on a 1-line fix produces noise. This is accepted as design intent per the BRIEF but may need a future escape valve. [Source: Edge Cases]

- **Task() blocks treated as pseudocode suggestions** -- Edge Cases and Domain Truth both flag that Task() pseudo-code is natural language, not executable syntax. Without empirical validation, confidence in ~100% compliance is extrapolated from plan.md Step 7 success, not measured. [Sources: Edge Cases, Domain Truth]

### Unanswered Questions

- What happens when framing-pipeline.md calls plan.md via `@` and plan.md now has mandatory research? If the `has_research` skip gate is removed, research could run twice in one pipeline run (once in framing-pipeline Stage 1, once in plan.md Step 5). The reuse logic must prevent this double-run.

- Should `research-workflow.md` become pure reference documentation if callers now own the spawn instructions? The BRIEF floats this as a follow-up but it is architecturally linked to this feature.

- Does the fix need to handle `review.md`'s gather-synthesize delegation (4 reviewer agents)? Same pattern, same potential failure. Out of scope per BRIEF but structurally identical.

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Subagents cannot spawn other subagents | Domain Truth, Tech Constraints | If research-workflow.md is spawned as a Task(), it cannot then spawn 6 gatherers. The 6 Task() spawns must happen in the main conversation context. |
| Subagents do not inherit parent conversation context | Domain Truth | A spawned research-workflow.md agent would not see framing_context, lens metadata, or assembled context payload. Gatherer spawns must happen where context is available. |
| `gather-synthesize.md` and `research-workflow.md` are declared invariants | Existing System, User Intent | These files must not change (per BRIEF). All fixes go in callers: plan.md, framing-pipeline.md. |
| `Task()` model parameter does not accept `"opus"` | Tech Constraints | Use `"inherit"` for judge/Opus-level agents, `"sonnet"` for executor agents. |
| Orchestrator receives no agent output in-context; results are file-based | Tech Constraints | Spawned gatherers write to disk. Orchestrator checks file existence, not return values. |
| CommonJS only in `bin/lib/` | Tech Constraints | Any init.cjs changes must use `require()`/`module.exports`. |
| `--skip-research` is model-parsed, not CLI-enforced | Existing System | There is no argument parser -- the "flag" is extracted by the model from the invocation prompt text. Removal means removing it from workflow prose. |
| framing-pipeline.md key_constraints: all 6 stages run in sequence, no stage skipping | Existing System | Research (Stage 1) was already mandatory in framing-pipeline. Fixing framing-pipeline's delegation pattern does not conflict with its own constraints. |
| Removing `research_enabled` gate breaks backward compat for projects with `research: false` in config.json | Existing System | Users who intentionally set this config will lose the opt-out capability. This is accepted design intent per the BRIEF. |

## Recommended Scope

Actionable guidance for the planner: what to build, what to skip, what needs more investigation.

### Build (In Scope)

- **Replace plan.md Step 5 delegation with 6 explicit Task() blocks** -- Embed one Task() pseudo-code block per gatherer directly in plan.md Step 5, following the Step 7 pattern. Include Anthropic's parallel tool-call instruction block. Number each gatherer (1 of 6, 2 of 6...) to prevent omission errors. [Supported by: all 6 gatherers]

- **Apply the same fix to framing-pipeline.md Stage 1** -- Same delegation anti-pattern, same fix. [Supported by: Existing System, User Intent, Edge Cases]

- **Remove `--skip-research` and `research_enabled` gates from plan.md** -- Delete the conditional bypass paths. Research becomes structurally mandatory. [Supported by: Domain Truth, User Intent, Prior Art]

- **Add lens metadata to RESEARCH.md output** -- Instruct the synthesizer (via the caller's Task() prompt) to write YAML frontmatter with `lens`, `secondary_lens`, `subject`, and `date` fields. [Supported by: User Intent, Tech Constraints, Edge Cases, Prior Art]

- **Implement lens-aware reuse logic in plan.md Step 5** -- Replace binary `has_research` check: if RESEARCH.md exists, read its frontmatter lens field, compare against current lens. If match, reuse. If mismatch, re-run. [Supported by: all 6 gatherers]

- **Audit all `workflows/*.md` files for `@workflow.md` delegation instances** -- Enumerate every instance, classify as (1) parallel-spawn bug, (2) sequential handoff, (3) context reference. Fix category 1; document categories 2-3 with disposition. [Supported by: User Intent, Existing System, Edge Cases]

- **Update plan.md research failure path** -- Remove "skip research" from the failure options (contradicts mandatory research). Keep "provide context directly" and "abort" as valid failure responses. [Supported by: Edge Cases]

### Skip (Out of Scope)

- **Modifying gather-synthesize.md** -- Declared invariant. No changes. [Source: BRIEF, Existing System]

- **Modifying research-workflow.md** -- Declared invariant. It becomes reference documentation that callers read but no longer delegate to. [Source: BRIEF, Existing System]

- **Modifying gatherer agent definitions** -- Declared invariant. [Source: BRIEF]

- **Adding timestamp-based staleness checking** -- Adds complexity without clear acceptance criteria. Lens-aware reuse is sufficient for v1. [Source: Edge Cases -- single-source finding]

- **Fixing review.md gather-synthesize delegation** -- Same pattern but different feature scope. Document as follow-up. [Source: Tech Constraints, Edge Cases]

- **Converting framing-pipeline.md stages 3-6 to Task() pattern** -- These are sequential single-agent handoffs, not parallel spawns. Different category. Document in audit, fix separately if needed. [Source: Existing System, User Intent]

- **Adding new gatherer types or dimensions** -- Out of scope per BRIEF. [Source: User Intent]

### Investigate Further

- **Double-research prevention in framing-pipeline -> plan.md chain** -- When framing-pipeline Stage 1 runs research and then Stage 3 invokes plan.md, plan.md's mandatory research would run again if the `has_research` reuse check fails (or is removed without replacement). The reuse logic must handle this case. The planner should design the lens-aware reuse check to cover this scenario explicitly. [Gap: Edge Cases flagged this; no gatherer proposed a complete solution]

- **Whether research-workflow.md should formally become reference documentation** -- If callers now embed the 6 Task() blocks, research-workflow.md's Step 5 delegation is dead code. Should its role be formalized as "specification only"? Low risk either way but worth a planner decision. [Gap: Prior Art and Tech Constraints both suggest this but it is a BRIEF follow-up item]

- **Empirical validation of Task() compliance rate** -- The hypothesis that explicit Task() blocks prevent shortcuts is based on plan.md Step 7 anecdotal success and Anthropic docs. No controlled test exists. The planner should note this as a post-ship verification item. [Gap: Domain Truth and Edge Cases both flag this risk]
