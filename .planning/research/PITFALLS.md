# Pitfalls Research

**Domain:** AI coding assistant orchestration framework refactor (meta-prompting, hierarchical work breakdown, requirement traceability, multi-perspective code review)
**Researched:** 2026-02-28
**Confidence:** HIGH — pitfalls grounded in: (1) first-party codebase analysis (CONCERNS.md), (2) published multi-agent failure research (2025), (3) Claude Code-specific context bloat documentation, (4) requirements traceability adoption research

---

## Critical Pitfalls

### Pitfall 1: Refactoring the Scaffold While Standing On It

**What goes wrong:**
You use GSD v1 to plan and build GSD v2. Mid-refactor, you change the command/workflow/agent interfaces that the active session is using. The tool breaks under you during execution. Partially migrated states produce corrupted `.planning/` artifacts that v1 can't read and v2 doesn't exist yet to read.

**Why it happens:**
The bootstrap problem is invisible at planning time. The "use the tool to build the tool" pattern feels natural — it's the whole point — but the moment a command, workflow, or agent filename changes, any in-flight session referencing that path silently receives wrong context or no context (hardcoded `~/.claude/get-shit-done/` paths in workflow `@` references are the specific failure vector, identified in CONCERNS.md).

**How to avoid:**
- Treat v1 as frozen during v2 construction. Never rename or delete v1 files during an active build session.
- Build v2 in a parallel directory (`get-shit-done-v2/` or `get-shit-done-pe/`) with its own path namespace. Only cut over after v2 is fully functional.
- The clean break from v1 artifacts (already declared in PROJECT.md) is the right call — it removes the temptation to incrementally migrate while running.
- Establish a "last v1 session" checkpoint: one final planning run with v1, then all subsequent sessions use v2 exclusively.

**Warning signs:**
- Editing a workflow file mid-session that is referenced by the current active workflow
- PLAN.md tasks that reference both v1 paths and v2 paths
- Agents not finding expected context because a rename happened between spawn and execution

**Capability to address:** Refactor capability — specifically the "reason for change → explore options" discovery phase must include a hard constraint: no in-place mutation of active v1 interfaces.

---

### Pitfall 2: Hierarchy Depth That Exceeds Cognitive Carrying Capacity

**What goes wrong:**
Project → Capability → Feature is a 3-level hierarchy. Each level adds: a creation command, a discovery workflow, a requirement document, a state to track. If features become sub-features or capabilities become sub-capabilities "just in case," the cognitive load of navigating the hierarchy exceeds the value it provides. Users start skipping levels. Documentation gaps appear at the skipped levels.

**Why it happens:**
Hierarchical decomposition feels precise. When planning a complex system it's tempting to add depth for edge cases. WBS research consistently shows that levels beyond 3-4 create coordination overhead that outweighs decomposition benefits. The PROJECT.md already removed milestones — that was the right call. The risk is re-introducing equivalent depth through sub-features or nested capabilities.

**How to avoid:**
- Hard rule: maximum 3 levels (Project / Capability / Feature). No sub-features. If a feature is too large, it becomes a capability.
- Enforce this in the hierarchy commands: `new feature` inside a `capability` — period. No `new sub-feature`.
- Every level must answer a distinct question: Capability = "what user goal does this enable?", Feature = "what building block implements part of that goal?" If the answer is the same, collapse the level.
- If more granularity is needed, express it in the 3-layer requirements (story / functional / technical) — not in the hierarchy.

**Warning signs:**
- PRD language using "sub-feature," "component," or "module" as distinct hierarchy levels
- Capability documents containing only one feature
- Feature documents referencing other features as dependencies (sign they should be the same capability)
- Planning sessions that require navigating more than 3 directory levels to find a PLAN.md

**Capability to address:** Hierarchy design capability — define and enforce maximum depth as a first-class constraint, not a guideline.

---

### Pitfall 3: 3-Layer Requirements as Documentation Theater

**What goes wrong:**
The 3-layer requirement structure (end-user story + acceptance, functional behavior spec, technical implementation spec) produces well-formatted documents that look thorough but are written at the wrong time — after the solution is already decided. Layers 2 and 3 become post-hoc justification for what the executor was going to do anyway. Traceability IDs appear in PLAN.md tasks but the reviewer can't actually trace back to find a violated requirement.

**Why it happens:**
Requirements traceability research (Springer 2023) identifies the "benefit problem" as the primary adoption barrier: teams see immediate overhead (writing 3 documents instead of 1) but delayed, diffuse benefit (catching the wrong thing early). When benefit is invisible, compliance becomes mechanical. The executor writes requirements that match the plan rather than writing requirements that constrain the plan.

**How to avoid:**
- Requirements must be written before any solution framing. The discovery workflow (debug/new/enhance/refactor) produces requirements; the plan is produced after.
- Functional layer (Layer 2) must include at least one explicit constraint or edge case that is non-obvious. If every functional spec says "the system shall do X" where X is exactly what Layer 3 says to implement, Layer 2 added nothing.
- Review agents trace requirements forward (does this code satisfy REQ-F-03?), not backward (given this code, what requirement does it satisfy?).
- Plan tasks must reference specific REQ IDs, and those IDs must be resolvable — not just present as text. Consider requiring the executor to confirm each REQ ID exists before the plan is accepted.

**Warning signs:**
- PLAN.md tasks that all reference REQ-T-* (technical layer only, skipping user/functional layers)
- Requirement documents written in under 5 minutes
- Layer 2 and Layer 3 requirements that are paraphrases of each other
- Review agents saying "requirements satisfied" on every review without identifying any gap

**Capability to address:** Requirements definition capability + review synthesis capability. The self-critique step (coverage, approach validity, feasibility) must explicitly check whether requirements constrain or merely describe the implementation.

---

### Pitfall 4: Parallel Review Agents Producing Contradictory Findings Without Resolution Protocol

**What goes wrong:**
4 parallel reviewers (end-user, functional, technical, code quality) each produce a trace report. Reviewer 1 approves the implementation. Reviewer 4 flags a DRY violation requiring refactor. No resolver knows which finding takes priority, or the synthesis step picks the majority view (3 approve, 1 flags) and discards the valid critique. The user sees "reviewers agree, minor issues" when a legitimate quality problem exists.

**Why it happens:**
Multi-agent coordination research (2025, published in ACM) identifies that 36.94% of multi-agent failures are coordination failures — conflicting objectives, state synchronization issues. Parallel reviewers optimizing for different criteria will naturally disagree. Without an explicit resolution protocol and priority ordering, synthesis becomes averaging rather than adjudication.

**How to avoid:**
- Establish explicit priority ordering for conflicts: end-user acceptance (does it work for the user?) > functional compliance (does it match the spec?) > technical compliance (does it match implementation spec?) > code quality (is it clean?). Code quality never overrides functional compliance.
- The review synthesizer must flag — not discard — every finding where reviewers disagree. Disagreement is signal, not noise.
- Synthesis output must include a "conflicts" section separate from "consensus findings." The user sees conflicts explicitly.
- Each reviewer must use a structured finding format with severity (blocker / major / minor) so synthesis can make priority decisions based on severity, not reviewer identity.

**Warning signs:**
- Synthesis reports that contain only consensus findings with no mention of reviewer disagreements
- All 4 reviewers approving with minor notes on every feature (statistically implausible for real code)
- Reviewer prompts that all share the same success criteria (if criteria overlap, reviewers are duplicating work)
- Self-critique step surfacing issues that review step missed

**Capability to address:** Review synthesis capability. The synthesizer agent needs an explicit conflict resolution algorithm, not just "consolidate findings."

---

### Pitfall 5: Agent Prompt Bloat from Layered Framing Context

**What goes wrong:**
Each agent receives: core project context + capability context + feature context + framing-specific context (debug/new/enhance/refactor). As GSD v2 evolves, each layer accumulates more "helpful" context. After 6 months, an executor agent prompt is 8,000 tokens of context before it sees the actual task. Claude Code subagent research (DEV.to, 2025) documents that each subprocess already loads ~50K tokens of baseline configuration — additional layering compounds this directly.

**Why it happens:**
Framing-aware context sounds like good design: give the agent exactly what it needs. But "what it needs" expands over time. Every encountered edge case produces a new instruction. Capability context documents grow. Feature documents grow. The architecture is correct (layering), but the content discipline is missing. Long system prompts also degrade performance: time-to-first-token increases, KV cache bloats, and attention to earlier instructions declines (documented "context rot" phenomenon).

**How to avoid:**
- Set a hard token budget per context layer. Suggested: core (≤500 tokens), capability context (≤300 tokens), framing-specific (≤400 tokens). These are not guidelines — enforce them by making context documents fail validation if they exceed the limit.
- Apply the Claude-specific compression insight: strip all human-readable framing, headers, and prose explanation from agent context. Instructions only. CLAUDE.md compression research shows 60-70% reduction is achievable without information loss.
- Framing context should add questions the agent must answer, not background the agent already has from the capability context.
- Audit context size at each capability milestone. If core context has grown, compress before adding new capabilities.

**Warning signs:**
- Agent context documents that include "Background:" or "Context:" sections alongside "Instructions:"
- Framing documents that re-explain what a capability is (already in capability context)
- Executor agents taking noticeably longer to start producing output over time
- Any single context layer exceeding 500 tokens

**Capability to address:** Layered context architecture capability. Context budget enforcement is a first-class design constraint, not a post-hoc optimization.

---

### Pitfall 6: Self-Critique Loop Without Termination Guarantee

**What goes wrong:**
The iterative planning loop (research → draft → self-critique → present to user) introduces a feedback cycle. The self-critique step identifies issues. The draft is revised. The revised draft is critiqued again. In adversarial prompt conditions, the critic can always find something to critique — a revised plan has new tradeoffs to flag. The loop runs until context is exhausted or the user intervenes. Real examples (SuperAGI issue #542, 2024) documented agents repeating the same response 58+ times in reflection loops.

**Why it happens:**
Self-critique is designed to surface what a single-pass plan misses. But without a termination condition, "good enough" is never reached because a perfect plan doesn't exist. The critic optimizes for finding flaws, not for declaring completion. This is structurally identical to the infinite loop failure mode documented in LLM production systems.

**How to avoid:**
- Maximum 2 self-critique rounds per plan. Hard stop, not a guideline. After round 2, the critique result (including unresolved issues) is presented to the user — the user decides, not the loop.
- Self-critique scope must be bounded: the critic checks 4 specific dimensions (coverage, approach validity, feasibility, surface assumptions) and produces at most one finding per dimension. Not an exhaustive review.
- Critique findings must be categorized as blocker (loop continues) or advisory (loop terminates, finding included in output). If no blocker findings, loop terminates regardless of advisory count.
- The workflow must have an explicit "termination reached" state that produces output even if critique found issues.

**Warning signs:**
- Self-critique workflow that doesn't specify a maximum iteration count
- Critique step that can produce open-ended "other concerns" findings
- Plans that go through more than 2 rounds before user sees them
- Increasing critique findings on later rounds (sign of context drift, not genuine improvement)

**Capability to address:** Planning workflow capability — termination logic is a first-class requirement for any iterative loop, not an afterthought.

---

### Pitfall 7: .documentation/ Becoming a Graveyard

**What goes wrong:**
The reflect-and-write documentation step generates `.documentation/` reference files after each feature completes. Six features in, the documentation directory has 6 docs. Feature 3's implementation changed when Feature 5 was built — the feature 3 doc is now stale. No automated process detects staleness. Future sessions load stale docs as authoritative reference, producing AI planning decisions based on how the system used to work.

**Why it happens:**
Documentation-from-code sounds like it solves the staleness problem — you write docs after building, not before. But "final state" is only final for that feature. Subsequent features change the system, and no trigger exists to invalidate previously written docs. This is the fundamental documentation maintenance problem, not solved by generation timing.

**How to avoid:**
- Documentation scope must be scoped to the capability, not individual features. A capability doc is written once at capability completion, not per-feature. This reduces the surface area that can go stale.
- Each doc must carry a `built-from-code-at:` timestamp that maps to a git SHA or a STATE.md snapshot. Staleness is detectable by comparing to current state.
- Documentation is not loaded as context unless it matches the current capability being worked on. Old capability docs are archival, not active context.
- The reflector agent must be instructed to note what the current state CHANGED from — this makes future staleness traceable ("Feature 5 changed X, which was documented in capability-3 doc as Y").

**Warning signs:**
- Documentation directory growing larger than 5 files without a corresponding "outdated" marker system
- Planning sessions that reference a `.documentation/` file for a feature completed more than 2 capabilities ago
- Discrepancies between docs and actual code found during review (the sign has already been missed by that point)
- Docs written from memory rather than from reading actual implemented code

**Capability to address:** Documentation capability — the reflector workflow must enforce reading actual code files before writing docs, not generating from memory.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy v1 agent prompts as v2 starting point | Fast initial drafts | v1 framing assumptions embedded in v2 agents; accumulate as invisible debt | Only if there's a systematic audit step that removes v1-specific references |
| Skip Layer 2 (functional spec) for "obvious" features | Faster requirements writing | Reviewers have no functional spec to trace against; code quality reviewer fills the gap with implicit standards | Never — if a feature is obvious, Layer 2 takes 2 minutes |
| Write documentation from agent memory rather than reading code | Faster execution | Docs reflect what was planned, not what was built; drift begins immediately | Never |
| Reuse the same self-critique prompt for all framings | One less prompt to maintain | Debug self-critique checks different dimensions than new-feature critique; wrong critique finds wrong issues | Never — framing changes critique dimensions |
| Single synthesizer that picks majority review finding | Simpler synthesis logic | Valid minority findings (e.g., a single DRY violation) are silently discarded | Never — minority findings need explicit handling |

---

## Integration Gotchas

Common mistakes when connecting the new hierarchy to existing gsd-tools.cjs infrastructure.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| STATE.md with new hierarchy | Add capability/feature fields to STATE.md body and expect frontmatter to auto-sync | The dual-write pattern (CONCERNS.md) means any new field needs updating in BOTH `buildStateFrontmatter` AND the markdown body template — missing one causes silent desync |
| gsd-tools CLI capability commands | Build capability commands as wrappers around existing phase commands | Phase commands have phase-specific bugs (renumbering regex, decimal nesting) — new capability commands should be built fresh, not as wrappers |
| PLAN.md frontmatter with REQ IDs | Add REQ ID fields to existing PLAN.md frontmatter format | The custom YAML parser (CONCERNS.md) cannot handle values containing `:` without quoting — REQ IDs like `REQ-F-03: auth flow` will break parsing. Either quote all values or resolve the js-yaml migration first |
| Parallel review agent spawning | Spawn 4 reviewers in a single wave using current wave execution | Wave execution is proven but each reviewer needs isolated context — if capability/feature context leaks between reviewer spawns, reviewers don't provide independent perspectives |
| Hardcoded path references in workflows | Update `~/.claude/get-shit-done/` paths in existing workflows to point at v2 | Path references are not validated at workflow load time (CONCERNS.md) — a missed reference produces silent context loss, not an error. Use `cmdVerifyReferences` after every path change |

---

## Performance Traps

Patterns that work at small scale but degrade as the framework is used.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-feature documentation files | Doc directory size grows linearly with features; each planning session loads more docs | Scope docs to capabilities, not features | After ~5 features per capability |
| Eager STATE.md frontmatter sync on every write | Slow state updates when many capability/feature directories exist (already documented in CONCERNS.md) | Lazy sync: only recalculate progress when explicitly requested | After ~20 features exist |
| Full context in every reviewer spawn | 4 reviewers × (50K baseline + layered context) = 200K+ tokens per review cycle | Reviewer context should contain only the feature requirements + diff, not full project history | First time used in practice |
| Self-critique that re-reads full plan | If plan grows large, each critique pass processes the entire document | Critique reads only the structured task list + requirement map, not prose rationale | Plans with >20 tasks |
| History digest scanning all capability/feature summaries | cmdHistoryDigest already slow on v1 (CONCERNS.md); v2 hierarchy adds more summary files | Cache digest with mtime-based invalidation (already identified fix path in CONCERNS.md) | After first few capabilities complete |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **3-layer requirements:** Often missing Layer 2 (functional) — verify it includes at least one constraint not derivable from Layer 1 or Layer 3
- [ ] **PLAN.md traceability:** Often missing REQ ID verification — verify each REQ ID in the plan resolves to an actual requirement in the feature document (not just present as a string)
- [ ] **Review synthesis:** Often missing conflict section — verify the synthesis output explicitly lists any finding where reviewers disagreed, not just consensus
- [ ] **Self-critique termination:** Often missing hard stop — verify the planning workflow has a maximum iteration count that is enforced, not suggested
- [ ] **Documentation from code:** Often written from memory — verify the reflector agent's output references specific function names, file paths, or line ranges from the actual built code
- [ ] **Framing-aware agents:** Often reverted to generic — verify framing-specific questions produce different discovery outputs for the same capability under different framings (debug vs new)
- [ ] **Context budget:** Often not enforced — verify each layered context document is within its token budget before treating the agent architecture as stable
- [ ] **v1 path references:** Often missed — verify `cmdVerifyReferences` passes after every file rename or move in v2

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Active session broken by v1 refactor mid-build | HIGH | Roll back renamed/moved files from git, complete current session in v1, re-plan v2 migration as a clean-break capability |
| Hierarchy depth exceeded (sub-features created) | MEDIUM | Promote sub-features to features of a new capability, or merge into parent feature requirements; no code changes needed, only artifact restructuring |
| Requirements written post-hoc (theater mode) | MEDIUM | Rewrite requirements from user story backward; treat implemented code as a prototype, not the spec; run review cycle against rewritten requirements |
| Parallel reviewers all agree suspiciously | LOW | Re-run review with explicit instruction to each reviewer to find one thing they would change; if still unanimous approval, proceed but flag for follow-up |
| Self-critique loop exceeded 2 rounds | LOW | Hard-stop the loop, present findings with "unresolved" tag; user decides what to accept; do not iterate further |
| .documentation/ files are stale | MEDIUM | Mark stale docs with `[STALE - superseded by capability-X]` header; re-run reflector for the current capability against actual code; do not delete stale docs (they're archival) |
| Agent context bloat causing slow responses | MEDIUM | Audit all context documents, apply compression (strip human-readable framing), verify token budgets; re-test response latency |

---

## Pitfall-to-Capability Mapping

How v2 capabilities should address these pitfalls.

| Pitfall | Prevention Capability | Verification |
|---------|----------------------|--------------|
| Refactoring the scaffold while using it | Refactor capability design (clean-break constraint must be explicit) | v1 directory frozen; v2 in isolated path; no shared mutable state |
| Hierarchy depth exceeded | Hierarchy design capability (max-depth constraint enforced by commands) | `new sub-feature` command does not exist; hierarchy validator rejects >3 levels |
| Requirements as theater | Requirements definition capability (Layer 2 constraint check) | Self-critique checks coverage; reviewer traces to specific REQ IDs |
| Conflicting parallel review findings lost | Review synthesis capability (conflict resolution protocol) | Synthesis output always contains "conflicts" section, even if empty |
| Agent prompt bloat | Layered context architecture capability (token budget enforcement) | Each context layer under budget; compression applied at authorship time |
| Self-critique infinite loop | Planning workflow capability (termination logic) | Maximum 2 critique rounds; blocker/advisory categorization enforced |
| .documentation/ staleness | Documentation capability (capability-scoped, timestamp-tagged docs) | Docs reference code artifacts by path/function, not by description |

---

## Sources

- CONCERNS.md: First-party codebase analysis — identifies fragile areas, tech debt, and performance bottlenecks specific to GSD v1 (HIGH confidence)
- [Why Multi-Agent LLM Systems Fail — Augment Code](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them): Coordination failure taxonomy, 36.94% coordination failure rate (MEDIUM confidence — secondary summary)
- [Why Claude Code Subagents Waste 50K Tokens Per Turn](https://dev.to/jungjaehoon/why-claude-code-subagents-waste-50k-tokens-per-turn-and-how-to-fix-it-41ma): Claude-specific context bloat mechanics, 4-layer isolation solution (HIGH confidence — first-party technical analysis)
- [Why don't we trace? Barriers to software traceability](https://link.springer.com/article/10.1007/s00766-023-00408-9): Requirements traceability adoption research, "benefit problem" root cause (HIGH confidence — peer-reviewed)
- [Compress Your CLAUDE.md: Cut 60-70% of System Prompt Bloat](https://techloom.it/blog/compress-claude-md.html): Context compression evidence for Claude-specific prompts (MEDIUM confidence)
- [LLM Tool-Calling in Production: Infinite Loop Failure Mode](https://medium.com/@komalbaparmar007/llm-tool-calling-in-production-rate-limits-retries-and-the-infinite-loop-failure-mode-you-must-2a1e2a1e84c8): Self-critique loop termination failure modes (MEDIUM confidence)
- [Work Breakdown Structures in the AI Era](https://dev.to/simplewbs/work-breakdown-structures-why-theyre-more-critical-than-ever-in-the-ai-era-3ief): WBS depth research, 3-level recommendation (MEDIUM confidence)
- [AI Coding Agents in 2026: Coherence Through Orchestration](https://mikemason.ca/writing/ai-coding-agents-jan-2026/): Framework coherence degradation patterns at scale (MEDIUM confidence)
- SuperAGI Issue #542: Reflection loop producing 58 repetitions (MEDIUM confidence — GitHub issue report)

---
*Pitfalls research for: GSD v2 — AI orchestration framework refactor*
*Researched: 2026-02-28*
