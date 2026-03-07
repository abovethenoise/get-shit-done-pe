---
lens: enhance
secondary_lens: null
subject: subagent-delegation/delegation-patterns
date: 2026-03-07
---

# Research Synthesis

**Synthesized:** 2026-03-07
**Subject:** subagent-delegation/delegation-patterns
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### The 0% Sonnet problem is a compliance/attention problem, not a technical API limitation

Claude Code's Agent tool fully supports `model="sonnet"` and custom subagent types. Workflows already contain correct Task() blocks with `model="sonnet"`. The orchestrator simply does not follow the delegation instructions -- it handles work inline instead of spawning subagents. Three overlapping reference docs (337 lines total) create context noise that suppresses delegation compliance via the "lost in the middle" attention pattern.

[Sources: Domain Truth, Tech Constraints, Prior Art, Edge Cases]

### `role_type` is GSD-internal; Claude Code only reads the `model` frontmatter field

Claude Code's native model routing uses the `model` field in agent YAML frontmatter (`sonnet`, `haiku`, `inherit`, or `opus`). GSD's custom `role_type` field is invisible to Claude Code -- it is only consumed by GSD's `resolveModelFromFrontmatter()` function. No GSD agent file currently contains an explicit `model:` field, so Claude Code defaults all agents to `inherit` (parent model). This is a structural root cause of 0% Sonnet usage.

[Sources: Domain Truth, Tech Constraints, Existing System]

### Agent frontmatter `model` field is the most robust enforcement path

Moving model assignment into Claude Code-recognized frontmatter (`model: sonnet` or `model: inherit`) collapses the resolution chain from 3 steps (init resolves -> workflow receives -> AI constructs Task call) to 1 step (AI spawns agent by name -> Claude Code reads model from frontmatter). This moves model selection from "instruction the AI must follow" to "configuration Claude Code enforces."

[Sources: Domain Truth, Tech Constraints, Prior Art]

### Reference doc data contradicts actual agent frontmatter

`model-profiles.md` line 31 says "4x reviewers = judge = Opus" but all 4 reviewer agent files have `role_type: executor`. The planner agent file has `role_type: judge` but `model-profiles.md` line 29 says planner is `executor`. Workflows hardcode `model="sonnet"` for reviewers, matching the agent frontmatter, not the reference doc. The agent files are the source of truth; the reference doc is stale.

[Sources: Existing System, Edge Cases, Tech Constraints]

### All 20 GSD agent files already have `role_type` in frontmatter

Complete coverage confirmed via grep. No migration needed for `role_type`. This means v1 fallback (`resolveModelInternal()`) is technically dead code -- every agent can be resolved via the v2 `resolveModelFromFrontmatter()` path.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Consolidation must restructure for AI consumption, not just merge files

Simply concatenating 3 docs would reduce file count but could worsen compliance by creating a longer single document with more "middle." The consolidated doc must: front-load imperative routing rules, use XML tags for section boundaries, include few-shot examples, and target under 150 lines. Narrative prose is weaker than imperative framing for behavioral instructions.

[Sources: Domain Truth, Prior Art, Edge Cases]

### Subagents cannot spawn other subagents

Claude Code enforces single-level delegation. All Agent/Task calls must originate from the main orchestrator thread. Delegation patterns must be flat.

[Sources: Domain Truth, Tech Constraints]

### Workflows bypass model resolution entirely for most agents

`plan.md`, `review.md`, and `doc.md` hardcode `model="sonnet"` and `model="inherit"` as string literals in Task() blocks. The `resolveModelFromFrontmatter()` function is only called once in production (for a nonexistent `gsd-researcher.md`). The v1 `resolveModelInternal()` is actively used for planner, executor, verifier, and checker via init.cjs.

[Sources: Existing System, Tech Constraints]

### `@file` references will break silently if source files are deleted

5 active `@file` references point to `gather-synthesize.md`: `review.md:6`, `doc.md:6`, `plan.md:2`, `init-project.md:350`, `commands/gsd/init.md:38`. Claude Code does not error on missing `@file` references -- it silently omits the content. File moves must update all references atomically.

[Sources: Edge Cases, Existing System]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Is `"opus"` a valid model parameter value?

**Domain Truth says:** `"opus"` is NOT a valid model parameter. Only `"sonnet"`, `"haiku"`, and `"inherit"` are accepted. Agents needing Opus must use `"inherit"`.

**Tech Constraints says:** `"opus"` IS now valid since Claude Code v1.0.64 (July 2025), per GitHub issue #4377 closed as implemented.

**Resolution:** Tech Constraints has the more recent evidence. `"opus"` is now valid. Review decision: use explicit `model: opus` for judge/synthesizer agents rather than `inherit`, for clarity and traceability.

### Is the v1 fallback path dead or actively used?

**Tech Constraints says:** All agents have `role_type`, so `resolveModelFromFrontmatter()` (v2) could handle everything. v1 is logically dead.

**Existing System says:** v1 `resolveModelInternal()` is actively called by init.cjs for planner, executor, verifier, and checker (lines 427-428, 509-510). v2 `resolveModelFromFrontmatter()` is called exactly once -- for a nonexistent agent file. v1 is the *primary* resolution path in practice.

**Resolution:** Both are correct but describe different things. v1 is dead *in principle* (no agent lacks `role_type`) but alive *in code* (init.cjs calls v1 functions). For the delegation-patterns feature (doc consolidation), the consolidated doc should describe v2 as canonical and note v1 as deprecated. Actually removing v1 code is out of scope (that's a code change, not a doc change). The doc should not document v1 internals.

### Is the `model=` Task parameter reliable?

**Tech Constraints says:** `model="sonnet"` is a valid, supported parameter.

**Edge Cases says:** Multiple GitHub issues (#11682, #5456) document that the `model` parameter returns 404 errors or is silently ignored. This could be the actual root cause of 0% Sonnet usage.

**Resolution:** Both positions have evidence. The GitHub issues are real but may be version-specific or resolved. The safest strategy is defense in depth: (1) set `model` in agent frontmatter as the primary enforcement, (2) also pass `model` in Task() calls as a belt-and-suspenders measure. If frontmatter `model` is also ignored (per #5456), then delegation to Sonnet is blocked at the platform level and GSD cannot fix it through docs alone. The consolidated doc should note this risk.

### Should gather-synthesize context assembly (Layers 0-4) be in the consolidated doc?

**Edge Cases says:** Keep it in delegation.md as a clearly separated section. Removing it means the "consolidate 3 into 1" goal is not met.

**User Intent says:** This is ambiguous. At 212 lines, gather-synthesize.md is the largest source doc and the context assembly section is ~40% of it. Keeping it inflates the doc.

**Prior Art says:** Target under 150 lines total. Every token competes for attention.

**Resolution:** The context assembly layers are an orchestration process detail, not a delegation pattern. They should NOT go into `delegation.md`. The gather-synthesize pattern definition (delegation shape, model routing, failure handling) belongs in delegation.md. The context assembly steps belong in workflow files that already inline their own layer references. This respects the line budget and keeps delegation.md focused on delegation.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Claude Code `model` parameter reliability** -- Edge Cases cites GitHub issues suggesting the parameter is broken, but these may be version-specific. No gatherer confirmed the current-version behavior empirically. [Source: Edge Cases only]

- **`gsd-debugger` agent file does not exist** -- Tech Constraints found it referenced in debug templates but no agent file exists. Single-source finding with no impact on delegation-patterns feature. [Source: Tech Constraints only]

- **`general-purpose` used for planner instead of `gsd-planner`** -- plan.md spawns the planner with `subagent_type="general-purpose"` despite having a `gsd-planner.md` agent definition. This means the planner runs without the gsd-planner system prompt or frontmatter settings. Not addressed by other gatherers. [Source: Tech Constraints only]

### Unanswered Questions

1. **Does `model` in agent frontmatter actually work in current Claude Code?** GitHub issues suggest it may be ignored. No empirical test was conducted. This is critical -- if frontmatter `model` is also ignored, GSD's entire delegation strategy needs rethinking.

2. **What is the current Claude Code version in this environment?** The `opus` validity and `model` parameter reliability both depend on version. No gatherer checked.

3. **Will updating `@file` references in workflow files violate the "out of scope" boundary?** The feature says workflow file modifications are out of scope (that's the workflow-enforcement feature). But `@file` references will break if source files are deleted. This creates a sequencing dependency.

4. **Should `role_type` be kept, removed, or made optional?** If `model` is added to agent frontmatter directly, `role_type` becomes purely semantic. No gatherer reached consensus on whether to keep it.

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Consolidated doc must be < 337 lines (combined total of source docs) | User Intent, Edge Cases | Exceeding defeats the purpose of consolidation |
| Total codebase size must not increase across all modified files | User Intent | Adding `model:` to agent frontmatter counts against budget; offset by deleting 3 source docs |
| Workflow files are NOT modified in this feature | User Intent | `@file` reference updates belong to workflow-enforcement feature. Must coordinate sequencing. |
| Skill files are NOT modified | User Intent | Out of scope entirely |
| CLI tooling (gsd-tools.cjs) is NOT modified | User Intent | Code changes to resolution functions are out of scope |
| Subagents cannot spawn other subagents | Domain Truth, Tech Constraints | Delegation patterns must be flat (single-level) |
| `model` field defaults to `inherit` when omitted from frontmatter | Domain Truth, Tech Constraints | Every executor agent MUST have explicit `model: sonnet` or it runs on Opus |
| `@file` references fail silently on missing files | Edge Cases | Deleting source docs without updating references breaks delegation silently |
| 5 active `@file` references to `gather-synthesize.md` exist | Edge Cases, Existing System | These will break when gather-synthesize.md is deleted |
| `model-profiles.md` and `model-profile-resolution.md` are not referenced by any workflow | Existing System | Safe to delete -- no `@file` references will break |

## Recommended Scope

### Build (In Scope)

- **Create `references/delegation.md`** -- Single consolidated reference doc under 150 lines. Contains: model routing table (executor=sonnet, judge=inherit, quick=haiku), two delegation shapes (gather-synthesize, single delegation), the `inherit` constraint explanation, and few-shot Task/Agent call examples. Use XML tags for section boundaries. Imperative framing throughout. [Supported by: Domain Truth, Prior Art, User Intent, Edge Cases]

- **Add `model:` field to all 20 agent frontmatter files** -- Set `model: sonnet` for executor agents, `model: inherit` for judge agents, `model: haiku` for quick agents. This is the primary enforcement mechanism -- Claude Code reads this natively. [Supported by: Domain Truth, Tech Constraints]

- **Fix role_type mismatches in `model-profiles.md` data before consolidation** -- Resolve the planner (judge in file, executor in doc) and reviewer (executor in files, judge in doc) contradictions. Use agent files as source of truth. [Supported by: Existing System, Edge Cases]

- **Delete `model-profiles.md` and `model-profile-resolution.md`** -- No workflow references these. Safe to delete immediately. [Supported by: Existing System]

- **Create a redirect or keep `gather-synthesize.md` as a stub** -- 5 workflows reference this file via `@file`. Since workflow modifications are out of scope, the file cannot simply be deleted. Options: (a) leave a stub that points to delegation.md, (b) keep gather-synthesize.md with only the orchestration process steps (not model routing), (c) defer deletion to workflow-enforcement feature. [Supported by: Edge Cases, User Intent scope boundary]

- **Remove v1 deprecated content from consolidated doc** -- v1 profile tables, per-agent overrides, profile switching instructions. These have no active consumers and dilute attention. [Supported by: User Intent, Domain Truth]

### Skip (Out of Scope)

- **Modifying workflow files** (plan.md, review.md, doc.md, execute.md, execute-plan.md) -- Belongs to workflow-enforcement feature (P1, depends on this feature). [Source: User Intent]

- **Removing v1 code** (`resolveModelInternal()`, `resolveModelFromFrontmatter()`) from core.cjs/init.cjs -- Code changes are out of scope. Doc consolidation only. [Source: User Intent]

- **Removing `role_type` from agent frontmatter** -- Even if `model` is added, `role_type` still has value as a semantic label for GSD's resolution code. Removing it would break `resolveModelFromFrontmatter()`. [Source: Existing System, Tech Constraints]

- **Measuring Sonnet usage outcomes** -- The success metric (Sonnet > 0%) is a downstream outcome, not this feature's deliverable. [Source: User Intent]

- **Adding CLI lint/validation for agent frontmatter** -- Useful follow-up but out of scope. [Source: Edge Cases]

### Investigate Further

- **Empirically test `model` parameter in current Claude Code version** -- Run a simple Agent call with `model="sonnet"` and verify the subagent actually runs on Sonnet (check via model self-identification or API logs). If the parameter is broken at the platform level, the entire delegation strategy needs rethinking. This is the highest-risk unknown. [Gap: Edge Cases raised GitHub issues #11682, #5456; no gatherer tested empirically]

- **Determine if `model` in agent frontmatter is respected** -- Related to above. If Claude Code ignores frontmatter `model` (per GitHub #5456), adding it to agent files is inert. Test before committing to this as the primary enforcement mechanism. [Gap: no empirical verification]

- **Coordinate `@file` reference updates with workflow-enforcement feature** -- The 5 `@file` references to `gather-synthesize.md` must be updated when that file is deleted/restructured. If workflow-enforcement is not implemented immediately after delegation-patterns, there will be a window where references are broken. Plan the sequencing. [Gap: cross-feature dependency not fully resolved]

- **Decide on `gather-synthesize.md` fate** -- Keep as stub? Split orchestration steps out? Defer deletion? This decision depends on the `@file` constraint and the workflow-enforcement feature timeline. [Gap: User Intent flagged as ambiguous]
