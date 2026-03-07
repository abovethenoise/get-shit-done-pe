---
lens: enhance
secondary_lens: null
subject: subagent-delegation/workflow-enforcement
date: 2026-03-07
---

# Research Synthesis

**Synthesized:** 2026-03-07
**Subject:** subagent-delegation/workflow-enforcement
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Agent YAML frontmatter is the correct single authority for model routing

Claude Code reads the `model` field from agent YAML frontmatter natively at spawn time. The `model=` parameter in Task() calls is redundant when pre-defined agent files exist (GSD always uses pre-defined agents). Removing `model=` from Task() calls is safe and actually fixes known contradictions (e.g., review.md forces gsd-review-quality to sonnet via Task() while YAML says opus). All 20 agent files already have `model` in frontmatter (14 sonnet, 6 opus). There is a known Claude Code bug (Issue #18873) where Task() `model=` short names return 404 from API -- removing `model=` sidesteps this bug entirely.

[Sources: Domain Truth, Existing System, Tech Constraints, Edge Cases, Prior Art]

### 5 workflows need delegation.md added to required_reading; 4 already have it

Current state: execute.md, execute-plan.md, plan.md have delegation.md in `required_reading`. gather-synthesize.md references it inline but not in required_reading. The 5 needing addition: doc.md, review.md, framing-pipeline.md, landscape-scan.md, init-project.md. The `required_reading` pattern is established across 15 of 18 workflows -- this is a mechanical 1-line addition per file using `@{GSD_ROOT}/get-shit-done/references/delegation.md`.

[Sources: Existing System, Tech Constraints, User Intent, Prior Art]

### 28 model= instances need removal across workflows + delegation.md

Detailed breakdown confirmed by multiple gatherers: doc.md (7), review.md (5), plan.md (9), execute.md (2), execute-plan.md (1), delegation.md (4). Types include hardcoded `model="sonnet"`, `model="inherit"`, and variable references like `model="{executor_model}"`. All have corresponding correct values in agent YAML frontmatter.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Four known Task() vs YAML contradictions that FN-03 fixes

| Workflow | Agent | Task() says | YAML says |
|----------|-------|-------------|-----------|
| review.md | gsd-review-quality | sonnet | opus |
| doc.md | gsd-doc-synthesizer | inherit | opus |
| review.md | gsd-review-synthesizer | inherit | opus |
| plan.md | gsd-research-synthesizer | inherit | opus |

The gsd-review-quality contradiction is the most severe -- the quality reviewer (designed for opus-level judgment) runs on sonnet. The `inherit` cases work coincidentally because the parent is Opus, but frontmatter is more robust.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Duplicate instructions degrade LLM compliance; consolidation improves it

Research shows LLMs detect instruction conflicts at 87-91% F1 but rarely resolve them correctly. Instruction compliance drops as instruction count and density increase (SIFo 2024). Stripping redundant delegation prose from 9 workflows reduces per-workflow instruction density, making remaining workflow-specific instructions more likely to be followed. ~79% of multi-agent failures originate from specification/coordination issues, not implementation bugs.

[Sources: Domain Truth, Prior Art]

### This is a text-editing enforcement pass, not a new pattern

No new patterns need to be introduced. The required_reading pattern is proven (15 workflows use it). Frontmatter model routing is the official Claude Code mechanism. Skills-based injection was evaluated and rejected (wrong layer -- delegation rules govern orchestrator behavior, not subagent behavior). MCP contract enforcement was evaluated and rejected (wrong tool class -- this is static prompt hygiene, not runtime validation). Both rejections align with zero-runtime-deps constraint and YAGNI.

[Sources: Prior Art, Domain Truth, Tech Constraints]

### Command file audit (TC-03) is straightforward

10 of 16 commands have `Task` in allowed-tools. 6 commands lack it (discuss-capability, discuss-feature, focus, progress, resume-work, status) -- all invoke conversational Q&A or status workflows with zero delegation content. No command files contain inline delegation logic, Task() calls, or contradictions with delegation.md.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Net line reduction is achievable

Baseline: 2858 lines across 9 target workflows + delegation.md. Removing 28 model= instances, redundant inline delegation prose, and inline model-assignment summaries in key_constraints sections should yield net reduction. Adding ~5-6 required_reading lines offsets minimally. Key sections to strip: framing-pipeline.md line 418 and doc.md line 259 hardcode model names in key_constraints summaries.

[Sources: Existing System, Tech Constraints, User Intent]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### required_reading is a convention vs. a guarantee

**Domain Truth says:** `required_reading` is a GSD convention, not a Claude Code primitive. The orchestrator must interpret it. If the orchestrator ignores it, delegation reference goes unread. Risk is higher than inline instructions because inline instructions are always in context.

**Prior Art says:** The `required_reading` pattern is proven and established across 15 workflows. It is the project's standard mechanism for DRY cross-cutting concerns.

**Resolution:** Both are correct at different levels. required_reading works in practice (15 workflows use it successfully) but is not a runtime guarantee. The mitigation is already identified by Domain Truth: use `@file` path syntax that Claude Code resolves automatically, which is exactly what GSD does (`@{GSD_ROOT}/...`). The `@file` reference mechanism IS a Claude Code native feature. No action needed beyond the planned approach.

### Variable model params ({executor_model} etc.) -- template variables or dead code?

**Edge Cases says:** These look like model routing but may be template variables resolved by some mechanism. Removing them could break templates if any code resolves them. Verify before removing.

**Existing System says:** These are variable references from CLI init routes, resolved by `resolveModelInternal()` which defaults to sonnet. Removing `model=` from these Task() calls has no side effect IF Claude Code reads YAML frontmatter natively.

**Tech Constraints says:** execute.md uses `model="{executor_model}"` and `model="{verifier_model}"` -- these come from CLI init route JSON output. Since both agents are `model: sonnet` in YAML, removing is safe.

**Resolution:** Existing System and Tech Constraints agree these are init-route variables, not unresolved templates. The agents' YAML frontmatter already has the correct values. Safe to remove. Edge Cases' caution is reasonable but resolved by the other gatherers' analysis.

### Scope of AUDIT-FINDINGS.md deferred items (2-7)

**User Intent says:** Items 2-7 from AUDIT-FINDINGS.md were "deferred to this feature" but half involve .cjs code changes that CAPABILITY.md says "Does Not Touch." This is a scope trap needing explicit user decision.

**Existing System says:** resolveModelInternal in core.cjs:305 converts opus to inherit, contradicting the decision that opus is a valid model value. However, FN-03 removes model= from Task() calls, making this code path potentially dead for delegation.

**Resolution:** The .cjs items (init.cjs stale reference, resolveModelInternal opus-to-inherit conversion) are CLI tooling -- out of scope per CAPABILITY.md boundaries. FN-03's removal of model= from Task() calls makes the CLI model resolution code irrelevant for delegation purposes (workflows won't consume those values). The planner should document these as "rendered moot by FN-03" rather than fixing the .cjs code. If CLI routes still emit model variables that nothing consumes, that is dead code cleanup -- a separate concern.

### Number of command files: 16 vs 19

**Edge Cases says:** TC-03 says 16 command files but source tree has 19 files per glob results.

**Existing System says:** 16 command files in commands/gsd/ need TC-03 audit.

**Resolution:** The planner should glob the actual source tree to get the correct count. The discrepancy may be from non-.md files or subdirectories. TC-03 audit must target whatever is actually present.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **gather-synthesize.md may not need required_reading addition**: Its only delegation content is cross-references to delegation.md (lines 4, 74). Adding delegation.md to required_reading may be redundant. Needs judgment call during planning. [Source: Edge Cases]

- **landscape-scan.md has minimal delegation content**: It has no `model=` in Task() calls and no delegation content beyond conceptual reference to gather-synthesize. May not need delegation.md in required_reading despite being in the 9-file list. [Source: Existing System]

- **Prompt-level fixes may not fully solve 0% Sonnet usage**: Research found prompt refinements yield only ~5-14% improvement in multi-agent task completion. If deeper structural reasons prevent delegation, workflow-enforcement alone may be insufficient. [Source: Domain Truth]

- **Task tool renamed to Agent in v2.1.63**: Existing `Task(...)` references still work as aliases, but if the alias is deprecated, all Task() references break. Not in scope for this feature but a future risk. [Source: Edge Cases]

### Unanswered Questions

- Has anyone verified at runtime that removing `model=` from Task() calls correctly falls through to YAML frontmatter routing? The delegation-patterns feature was built on this assumption but no gatherer reports a direct test.

- What is the exact count of files in `commands/gsd/`? Gatherers report both 16 and 19.

- Do the `{executor_model}`, `{planner_model}` etc. variable substitutions in workflows actually get resolved at runtime, or are they dead template syntax? Existing System says they come from CLI init routes, but if workflows are invoked without init, the variables would be unresolved.

## Constraints Discovered

| Constraint | Source | Impact |
|-----------|--------|--------|
| Agent YAML files are outside repo (~/.claude/agents/) and must not be modified | Existing System, User Intent | Workflow-enforcement can only align Task() calls to match existing YAML values; cannot change agent model assignments |
| Subagents cannot spawn subagents (flat delegation) | Domain Truth, Edge Cases, Prior Art | Workflow instructions must not imply multi-level delegation |
| required_reading is a GSD convention, not a Claude Code runtime feature | Domain Truth, Tech Constraints | Adding delegation.md to required_reading relies on AI compliance, not runtime enforcement; @file syntax mitigates |
| Net line count must decrease across all modified files | Existing System, User Intent | TC-02 constraint; do not add new explanatory content |
| Codebase size must not increase (Invariant 4) | Existing System (CAPABILITY.md) | Enforcement replaces existing code, not adds to it |
| Zero runtime dependencies | Prior Art, Tech Constraints | No MCP, lint scripts, or hooks for enforcement |
| Workflow stage sequencing and intent must not change | User Intent (CAPABILITY.md) | Only how delegation happens within stages changes |
| Claude Code Task() model= param may 404 on short names (Issue #18873) | Edge Cases | Removing model= is not just cleanup -- it avoids a known platform bug |
| model="inherit" is the default when model= is omitted from Task() | Edge Cases | Removing model="inherit" preserves identical behavior; removing model="sonnet" changes behavior (requires YAML frontmatter to work) |

## Recommended Scope

### Build (In Scope)

- **FN-01: Add delegation.md to required_reading in remaining workflows** -- 5 workflows need it (doc.md, review.md, framing-pipeline.md, landscape-scan.md, init-project.md). gather-synthesize.md already references delegation.md inline; evaluate whether required_reading addition is needed or redundant. Mechanical change, established pattern. [Sources: Existing System, Tech Constraints, Prior Art]

- **FN-02: Strip redundant inline delegation content** -- Remove inline model routing rules, parallel spawning instructions, and anti-pattern warnings that duplicate delegation.md. Preserve workflow-specific Task() templates, constraints, and parameters. Remove empty section headers after stripping. Focus areas: doc.md, review.md, plan.md have most redundant content; framing-pipeline.md and doc.md key_constraints sections hardcode model names. [Sources: Domain Truth, Existing System, User Intent]

- **FN-03: Remove model= from all 28 Task() calls** -- Across 5 workflow files + delegation.md. This fixes 4 known contradictions (gsd-review-quality forced to sonnet, 3 synthesizers using inherit instead of opus). Update key_constraints summaries to reference agent frontmatter instead of hardcoding model names. [Sources: all 6 gatherers agree]

- **TC-01: Compliance audit of 4 already-updated workflows** -- execute.md, execute-plan.md, plan.md, gather-synthesize.md. Check for missing delegation.md reference, lingering model= in Task() calls, redundant inline delegation. Fix inline. [Sources: Existing System, User Intent]

- **TC-02: Measure and verify net line reduction** -- Snapshot baseline (2858 lines across 10 files) before modifications. Verify net decrease after all changes. [Sources: Existing System, User Intent]

- **TC-03: Command file coherence audit** -- Verify Task in allowed-tools for delegation-heavy commands. Verify no inline delegation logic or contradictions. Glob actual source tree for correct file count. Fix coherence-report.md @file anti-pattern (AUDIT-FINDINGS.md finding #1). [Sources: Existing System, Tech Constraints, Edge Cases, User Intent]

### Skip (Out of Scope)

- **CLI tooling changes (init.cjs, core.cjs)** -- AUDIT-FINDINGS.md items 2-5, 7 involve .cjs code. CAPABILITY.md says "Does Not Touch: CLI tooling." FN-03's removal of model= from Task() calls renders the CLI model resolution code path irrelevant for delegation. Document as "rendered moot by FN-03." [Sources: User Intent, Existing System]

- **Agent YAML frontmatter modifications** -- Trust current values as-is per FEATURE.md decision. [Sources: User Intent, Existing System]

- **Runtime enforcement infrastructure** -- No MCP, lint scripts, hooks, or validation tooling. One-time edit pass with compliance audit is sufficient. [Sources: Prior Art, Domain Truth]

- **Skills-based injection** -- Wrong layer (orchestrator needs the knowledge, not subagents). [Source: Prior Art]

- **Task-to-Agent rename** -- Task() alias still works. Rename is a separate concern if alias is ever deprecated. [Source: Edge Cases]

### Investigate Further

- **Runtime verification of frontmatter model routing** -- The entire feature rests on the assumption that Claude Code reads agent YAML `model` field at spawn time when `model=` is omitted from Task() calls. Multiple gatherers cite official docs confirming this, but no gatherer reports a direct runtime test. Low risk given docs confirmation, but a single test spawn during execution would eliminate the assumption. [Sources: Domain Truth, Existing System, Edge Cases]

- **Exact command file count** -- Gatherers disagree (16 vs 19). Planner should glob source tree during planning to get definitive count. [Sources: Edge Cases, Existing System]

- **gather-synthesize.md and landscape-scan.md inclusion** -- Both are in the 9-file list but have minimal or zero delegation content. Planner should evaluate whether adding required_reading is useful or noise for these two files. [Sources: Edge Cases, Existing System]
