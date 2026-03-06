## Prior Art Findings

### Problem Class

Consolidating two orchestrators (capability-orchestrator + framing-pipeline) into one scope-fluid pipeline that handles both feature-scope and capability-scope execution, with auto-chaining between stages, mid-pipeline entry points, and research absorbed into plan. The system is markdown-based meta-prompting for Claude Code -- no runtime deps, no state machines, no databases. Orchestration is expressed as prose instructions in `.md` files interpreted by an LLM.

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Conditional Branch Orchestrator | Single pipeline with scope-detection at entry; if capability: DAG+wave plan+execute per feature, then review+doc once; if feature: linear pipeline | proven | **high** | [Airflow BranchOperator](https://www.astronomer.io/docs/learn/airflow-branch-operator/); [Azure Sequential Orchestration](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) |
| Scope-Agnostic Downstream (Nx "affected") | Detect scope once at orchestration level, propagate artifact list to scope-unaware downstream stages | proven | **high** | [Nx affected docs](https://nx.dev/docs/features/ci-features/affected) |
| Hierarchical Orchestrator (keep two files) | Parent orchestrator delegates to child pipeline per scope; capability-orchestrator stays as thin DAG scheduler calling framing-pipeline per feature | proven | **low** | [Metapatterns Orchestrator wiki](https://github.com/denyspoltorak/metapatterns/wiki/Orchestrator); [Pipeline of Agents](https://www.vitaliihonchar.com/insights/how-to-build-pipeline-of-agents) |

### Recommended Starting Point

**Conditional Branch Orchestrator + Scope-Agnostic Downstream (combined)**: These two patterns complement each other and together address the full refactor.

Rationale:

1. **GSD workflows are prose, not code.** There is no runtime engine. The "orchestrator" is a markdown file an LLM reads. Adding state machines or hierarchical delegation requires infrastructure GSD does not have and should not build (YAGNI, TC-06 no net line increase). A branch in prose is just an if/else paragraph. [First principles: markdown-based orchestration = instructions; branching = conditional prose]

2. **The two files share 80%+ structure.** capability-orchestrator.md is "build a DAG, then call framing-pipeline per feature." Its unique logic is ~40 lines of DAG construction + wave grouping. Absorbing that into framing-pipeline.md as a scope-detection branch at the top is simpler than maintaining two files with overlapping concerns. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md` -- 157 lines total, DAG logic in Steps 2-3]

3. **execute.md already proves the pattern.** Wave-based DAG execution for plans within a feature uses the same topological-sort-then-wave-group approach. Reusing this at the feature-within-capability level is pattern reuse, not invention. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md` lines 30-50]

4. **Scope detection is trivial.** Per FN-06 and FEATURE.md decisions, scope is inferred from slug-resolve output (capability or feature). One conditional in prose.

5. **Downstream stages are already scope-agnostic.** The gather-synthesize pattern, review agents, and doc explorers all process artifact lists. Expanding from single-feature to multi-feature is widening the input, not changing behavior. This matches Nx's approach: detect scope once, propagate to scope-unaware consumers. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` -- context layers already support capability-scope]

6. **Azure's sequential orchestration pattern confirms the approach**: "The choice of which agent gets invoked next is deterministically defined as part of the workflow and isn't a choice given to agents in the process." GSD's pipeline is exactly this -- deterministic stage sequencing with scope as a parameter. [Source: Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

Implementation shape:
```
framing-pipeline.md (consolidated):
  1. Initialize (detect scope: capability or feature via slug-resolve)
  2. IF capability: build DAG from CAPABILITY.md, group features into waves
  3. FOR each unit in execution scope:
       plan(+research) -> execute
  4. THEN once for full execution scope:
       review -> doc
```

### Anti-Patterns

- **God Orchestrator**: "In large systems a single Orchestrator is very likely to become overgrown and turn into a development bottleneck." Risk is mitigated here because: (a) the two orchestrators overlap heavily, (b) the merged file handles exactly two branches (capability/feature) not N, (c) GSD workflows are read-once prose, not maintained codebases with team contention. The anti-pattern applies to runtime services, not LLM instruction documents. -- [Metapatterns Orchestrator wiki](https://github.com/denyspoltorak/metapatterns/wiki/Orchestrator)

- **Premature State Machine**: State machine workflows are appealing for mid-pipeline entry, but they require a runtime engine to manage transitions. GSD has no such engine -- the LLM IS the engine. Adding state machine abstractions to markdown instructions would add complexity without enforcement. Mid-pipeline entry is better solved by artifact detection (SUMMARY.md presence = already executed, PLAN.md presence = ready to execute). -- [First principles: state machines need enforcement; LLM-interpreted prose has no enforcement mechanism]

- **Per-Feature Review with Cross-Feature Aggregation Layer**: Running N separate feature reviews then adding a "cross-feature synthesizer." This doubles agent spawns and is the current pattern with an extra layer. One review at execution scope catches cross-feature issues natively because reviewers see all artifacts together. -- [First principles: adding a layer to compensate for wrong scoping is more complex than fixing the scoping]

- **Dynamic Scope Negotiation Between Agents**: Approaches where agents discover or negotiate their own scope (RL-based dynamic routing). GSD's scope is known at orchestration time -- it's whatever was executed. Agents don't need to discover it; they receive it. -- [First principles: scope is a function of what was executed, not what agents discover]

- **Scope-Fluid via Two Code Paths (if feature -> X, if capability -> Y)**: Implementing separate review/doc logic per scope violates DRY. The correct approach: one path that receives a variable-length artifact list. Review and doc behave identically regardless of whether the list has 1 feature or 10. The branching belongs at orchestration (what to plan+execute), not at downstream stages. -- [First principles: branching on scope at the wrong abstraction level creates two maintenance paths]

### Libraries / Tools

No external libraries applicable. GSD is zero-runtime-dep, Node.js CommonJS. Orchestration is markdown interpreted by Claude Code's Task() API. Relevant tools already in the codebase:

- `gsd-tools.cjs`: CLI for state mutations, slug resolution, status queries -- already handles both capability and feature scope [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs`]
- Claude Code `Task()` API: subagent spawning with model selection -- already used by all workflows [Source: framing-pipeline.md Stage 1]
- `slug-resolve` CLI route: already resolves both capability and feature slugs -- scope detection needs no new tooling [Source: FEATURE.md EU-01]

### Canonical Patterns

- **Conditional Pipeline Branching**: Single pipeline definition with scope-detection at entry that determines iteration behavior. Capability scope: iterate plan+execute per feature in DAG wave order, then single review+doc. Feature scope: linear pipeline. This is Airflow's BranchOperator expressed in prose. Use when: two workflows share 80%+ of stages and differ only in iteration scope. -- [Airflow Branching](https://www.astronomer.io/docs/learn/airflow-branch-operator/)

- **Scope Detection then Propagation** (from Nx): Detect what changed in one step, then feed that scope to all downstream tasks without those tasks knowing how scope was determined. Separation of detection and consumption. Review.md and doc.md become scope-agnostic -- they process whatever artifact list they receive. Use when: downstream stages should not contain scope logic. -- [Nx affected](https://nx.dev/docs/features/ci-features/affected)

- **Artifact-Based Stage Detection**: Instead of tracking pipeline state in a manifest, infer current stage from artifact presence. PLAN.md exists but no SUMMARY.md = ready to execute. SUMMARY.md exists but no synthesis.md = ready to review. This is how GSD already works (FN-07) and is the correct pattern for a stateless, LLM-interpreted system. Use when: mid-pipeline entry is needed without a state tracking mechanism. -- [First principles: in a system where the LLM re-reads context each invocation, filesystem artifacts ARE the state]

- **Gather-Synthesize with Variable-Width Input**: The existing GSD pattern. N parallel specialists + 1 synthesizer. The width of the input (one feature vs. many) doesn't change the pattern. Synthesizer handles multi-source consolidation with manifest tracking. Use when: the parallel work pattern is correct but the input scoping needs to expand. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md`]

- **Auto-Chain via Deterministic Sequencing**: Azure's sequential orchestration confirms that deterministic stage ordering (not agent-decided routing) is the correct approach for pipelines with known stage dependencies. Each stage completes and the orchestrator invokes the next. Human gates are explicit checkpoints, not routing decisions. Use when: pipeline stages have fixed ordering with optional human gates. -- [Azure AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

### Wiring Bug Confirmation

The execute -> review auto-chain failure is a design gap, not a conditional bug. `execute.md` was written as a standalone workflow ("The workflow ends. The user decides next steps" at its final step). `framing-pipeline.md` was written later assuming execute would return control. The fix is straightforward: execute.md should not present "next steps" when invoked as a pipeline stage -- it should return cleanly so the orchestrator can auto-chain to review. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md` final step; `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md` Section 5]
