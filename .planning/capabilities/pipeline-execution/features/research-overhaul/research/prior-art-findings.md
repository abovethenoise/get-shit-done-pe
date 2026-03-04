## Prior Art Findings

**Researched:** 2026-03-04
**Domain:** AI agent delegation patterns, LLM instruction compliance, workflow result reuse, multi-agent orchestration
**Confidence:** HIGH (primary sources: Anthropic official docs, academic research, Prefect docs)

---

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Anthropic Explicit Parallel Tool-Call Instruction | Embed canonical "use parallel tool calls" prompt block directly in workflow instructions; boosts compliance to ~100% | proven | high | [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) |
| Imperative Task() Pseudocode Enumeration | Inline literal Task() pseudocode blocks per spawnable agent, one per line, rather than delegating via @file reference | proven | high | [claudelog.com Task tool mechanics](https://claudelog.com/mechanics/task-agent-tools/), [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system) |
| Artifact-Based Dependency Gates | Require agents to produce/consume concrete file artifacts before downstream can proceed; makes skipping structurally impossible | proven | medium | [aiyan.io engineer agent reliability](https://www.aiyan.io/blog/engineer-agent-reliability/) |
| Scope-Key Cache Invalidation (Prefect-style) | Cache results against a composite key including scope/context dimensions; invalidate when key changes | proven | high | [Prefect caching docs](https://docs.prefect.io/v3/concepts/caching) |
| Temporal Child Workflow Delegation | Partition work into explicit child workflows for cross-boundary isolation; use activities for everything else | proven | low | [Temporal child workflows](https://docs.temporal.io/child-workflows) |

---

### Recommended Starting Point

**Imperative Task() Pseudocode Enumeration + Anthropic Parallel Tool-Call Block**: Replace the `@workflow.md` indirection pattern in plan.md Step 5 (and all callers) with explicit `Task()` pseudocode blocks — one per gatherer — directly embedded in the calling workflow. Pair with Anthropic's canonical parallel tool-call instruction block to drive ~100% compliance.

Rationale: The problem is unambiguous — the model admitted "Invoke @research-workflow.md" is ambiguous and causes shortcuts. The fix is equally unambiguous: Step 7 in plan.md already uses explicit `Task()` pseudocode and never shortcutted. The delta is simple. For research reuse, scope-key cache invalidation (lens + file existence) maps directly to GSD's constraints without adding infrastructure.

Source: [BRIEF.md — "Step 7's explicit Task() block left no room for misinterpretation"](/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md), [Anthropic prompting best practices — parallel tool call section](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

---

### Anti-Patterns

- **Indirect delegation via @file reference for multi-step orchestration**: "Invoke @research-workflow.md" is ambiguous — models interpret it as "delegate" (read and pass on) OR "execute yourself," not unambiguously as "orchestrate these N parallel spawns." Documented failure mode: model admitted shortcutting in prior session. Same failure observed in CrewAI (tasks skipped when not enumerated) and in LangGraph (inline logic ignored when hidden behind edges). — [BRIEF.md prior exploration section](/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md), [First principles: indirection adds interpretation room; parallel spawn instructions must leave zero interpretation room]

- **Binary file-existence check for research reuse**: `has_research` = `test -f RESEARCH.md` doesn't account for whether existing research covers the current lens. Reusing /new research for /enhance work produces wrong artifacts downstream. Documented analogously in Prefect: cache keys that don't incorporate all relevant inputs produce stale cache hits that appear valid but aren't. — [Prefect caching docs — cache_key_fn section](https://docs.prefect.io/v3/concepts/caching), [BRIEF.md — "Binary has_research check doesn't account for lens changes"](/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md)

- **Skip gates for mandatory workflow steps**: `research_enabled` and `--skip-research` gates on a step that's architecturally mandatory. Research without which the planner has no foundation. Skip gates that exist "for efficiency" become the escape route that models and users take under pressure. Anthropic's long-running agent pattern avoids skip gates entirely: "agents constrained to work on single features per session, mark only verified features complete" — no optional escape. — [Anthropic long-running agent harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), [BRIEF.md — "Research is mandatory — no skip gates exist"](/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md)

- **Uniform failure patterns at high instruction density**: Embedding all 6 gather instructions inside one high-density prompt block risks "omission errors" where the model drops later instructions under cognitive load. Research shows models shift from modification errors to omission errors as instruction count grows. Mitigation: enumerate each Task() call individually on its own line with its own label, not as a nested array inside a single block. — [arxiv.org/html/2507.11538v1 — instruction density study](https://arxiv.org/html/2507.11538v1)

- **Child workflow delegation for code organization**: Temporal's documentation explicitly calls out using child workflows "just for code organization" as an anti-pattern. Analogously, research-workflow.md should not become an indirection layer that callers delegate through if explicit inline Task() pseudocode in the caller is sufficient. "When in doubt, use an Activity" (inline execution) — the equivalent for GSD is: when in doubt, embed the Task() calls directly in the calling workflow. — [Temporal child workflows docs](https://docs.temporal.io/child-workflows)

- **Vague action verbs in orchestration instructions**: Anthropic's prompting docs explicitly contrast "suggest" vs "change" — the model follows the literal verb. "Invoke" is similarly ambiguous: does it mean "call (delegate)" or "invoke (execute)"? Instructions that contain vague verbs produce inconsistent compliance. Fix: use verbs that admit only one interpretation — "Spawn", "Call Task()", "Create a Task call for". — [Anthropic prompting best practices — tool usage section](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

---

### Libraries / Tools

No external libraries apply. GSD is a markdown-driven meta-prompting framework; the fix lives in instruction text, not in code dependencies.

Relevant reference implementations (not dependencies):
- **Prefect `cache_key_fn`**: The pattern for scope-aware cache invalidation — composite key = (file_path + lens + secondary_lens). Directly translatable to an `if` branch in plan.md Step 5. — [docs.prefect.io/v3/concepts/caching](https://docs.prefect.io/v3/concepts/caching)

---

### Canonical Patterns

- **Explicit parallel tool-call instruction block**: Anthropic's documented canonical prompt block for maximizing parallel Task compliance. Embed directly in any workflow that must spawn parallel agents. Their own data: "boosts to ~100%" compliance without it being an architectural change. Exact text from Anthropic docs: "If you intend to call multiple tools and there are no dependencies between the tool calls, make all of the independent tool calls in parallel... Maximize use of parallel tool calls where possible to increase speed and efficiency." — [Anthropic prompting best practices — parallel tool calls section](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

- **Imperative enumeration over delegation**: Anthropic's multi-agent research system avoids shortcutting by embedding explicit scaling rules per complexity tier directly in prompts — not as references to other documents, but as inline rules. Each subagent receives "objective, output format, tool guidance, and clear task boundaries" at spawn time. Applied to GSD: the calling workflow should contain one `Task()` block per gatherer with all parameters filled in, not a reference to research-workflow.md. — [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

- **Scope-key research reuse**: Prefect's `cache_key_fn` pattern: cache validity = f(inputs + scope). For GSD research: reuse is valid iff `RESEARCH.md` exists AND the lens stored in it matches the current lens. Implementation: add a `<!-- lens: {LENS} -->` comment to RESEARCH.md at write time; plan.md Step 5 reads it to compare. If lens mismatch: re-run. If match: reuse. — [Prefect caching docs](https://docs.prefect.io/v3/concepts/caching), [First principles: a cache is only valid when its key covers all inputs that affect the output]

- **Positive framing + success criteria per-step**: Anthropic's prompting docs confirm that adding "why" context behind instructions helps Claude generalize. For spawn instructions: include both the mechanic ("Spawn Task() for each") and the rationale ("because gatherers have no inter-dependencies and must run in parallel to maximize research breadth"). Rationale makes the compliance check self-evident to the model. — [Anthropic prompting best practices — context section](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

- **Numbered steps for multi-step compliance**: Anthropic docs and academic research consistently confirm: "Provide instructions as sequential steps using numbered lists or bullet points when the order or completeness of steps matters." For GSD gather phase: number each gatherer Task() call (1 of 6, 2 of 6, ...) so the model registers each as a distinct required action, not as an array that can be partially satisfied. — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), [arxiv.org step-by-step instructions study](https://arxiv.org/html/2506.09983)

- **Reference workflow as specification, not delegation target**: research-workflow.md's role changes when callers embed explicit Task() pseudocode. It becomes canonical specification (what the pattern is) rather than the delegation target (what the orchestrator calls). This mirrors Temporal's pattern: child workflows for isolation and partitioning, activities (inline) for everything else. — [Temporal child workflows docs — "Do not use Child Workflows just for code organization"](https://docs.temporal.io/child-workflows), [First principles: documentation and execution should be separate concerns]

---

### Key Synthesis for the Planner

The core problem has two parts and two fixes:

**Part 1 — Delegation ambiguity (root cause of shortcutting)**

```
CURRENT:  plan.md Step 5: "Invoke @research-workflow.md with params"
FAILURE:  model reads "Invoke" as delegate-to-primary-collaborator OR spawn-one-agent
FIX:      Replace with 6 explicit Task() pseudocode blocks + Anthropic parallel block
EVIDENCE: Step 7 explicit Task() block = no shortcuts. Step 5 @-reference = shortcuts.
          Anthropic: explicit Task() enumeration boosts to ~100% compliance.
```

**Part 2 — Binary research reuse (wrong cache key)**

```
CURRENT:  if has_research: skip. Binary file-existence check.
FAILURE:  /new research reused for /enhance — different lens, wrong research focus
FIX:      Scope-key check: exists AND lens matches
PATTERN:  Prefect cache_key_fn — composite key includes all inputs that affect output
IMPL:     Store lens in RESEARCH.md frontmatter at write time; compare at reuse time
```

Both fixes are instruction-text changes to plan.md (and audited callers). No new infrastructure, no new agents, no gather-synthesize.md changes. research-workflow.md becomes reference documentation; callers own the spawn instructions.

---

### Sources

**Primary (HIGH confidence — official documentation)**

- [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — parallel tool-call instruction block, numbered steps, action verb precision, subagent orchestration guidance
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) — imperative enumeration pattern, per-subagent task boundaries, parallel spawn mechanics
- [Anthropic Long-Running Agent Harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — mandatory step patterns, skip-gate anti-pattern
- [Prefect Caching Documentation](https://docs.prefect.io/v3/concepts/caching) — scope-key cache invalidation pattern, cache_key_fn composite key
- [Temporal Child Workflows](https://docs.temporal.io/child-workflows) — delegation vs inline execution decision rule, "not for code organization" anti-pattern
- [claudelog.com Task Tool Mechanics](https://claudelog.com/mechanics/task-agent-tools/) — Claude conserves Task spawning by default; explicit enumeration required for guaranteed parallel use
- [aiyan.io Engineer Agent Reliability](https://www.aiyan.io/blog/engineer-agent-reliability/) — artifact-based dependency gates as structural compliance enforcement

**Secondary (MEDIUM confidence — academic research)**

- [arxiv.org/html/2507.11538v1 — How Many Instructions Can LLMs Follow at Once?](https://arxiv.org/html/2507.11538v1) — instruction density study; omission errors at high density; primacy effects
- [arxiv.org/html/2506.09983 — Step-by-step Instructions for Dependency Parsing](https://arxiv.org/html/2506.09983) — numbered steps improve compliance on multi-step tasks

**Internal (HIGH confidence — GSD artifacts)**

- [BRIEF.md — pipeline-execution/research-overhaul](/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md) — documents the exact failure mode, model self-diagnosis of shortcutting
- [plan.md — get-shit-done/workflows/plan.md](/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md) — Step 5 (@-reference pattern) vs Step 7 (explicit Task() pattern) contrast
- [framing-pipeline.md — get-shit-done/workflows/framing-pipeline.md](/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md) — Stage 1 uses same @-reference pattern as plan.md Step 5
- [gather-synthesize.md — invariant reference](/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md) — the pattern that must actually execute; unchanged by this fix
- [PRIOR-ART.md — phase 02-agent-framework](/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/PRIOR-ART.md) — foundational research on scatter-gather, Claude Agent SDK, Anthropic multi-agent patterns (reused here, not duplicated)

---

*Researched: 2026-03-04*
*Capability: pipeline-execution*
*Feature: research-overhaul*
*Dimension: Prior Art*
