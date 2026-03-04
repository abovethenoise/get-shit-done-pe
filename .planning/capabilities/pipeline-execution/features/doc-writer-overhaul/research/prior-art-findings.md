---
type: research-output
dimension: prior-art
feature: pipeline-execution/doc-writer-overhaul
date: 2026-03-04
---

## Prior Art Findings

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| GSD Gather-Synthesize (internal) | Proven pattern already used by research (6 gatherers) and review (4 reviewers): parallel agents by focus area, shared synthesizer, failure-tolerant manifest | proven | high | `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` |
| DocAgent (Facebook Research, 2025) | Sequential multi-agent pipeline (Reader→Searcher→Writer→Verifier) per component, topological ordering, dependency-first | proven (academic) | medium | [arxiv.org/abs/2504.08725](https://arxiv.org/abs/2504.08725) |
| MDocAgent (2025) | Two parallel RAG pipelines (text + image) feeding 5 specialized agents with a summarizing agent; parallel-first, multi-modal | emerging | low | [ar5iv.labs.arxiv.org](https://ar5iv.labs.arxiv.org/html/2503.13964) |
| divar-ir/ai-doc-gen | 5 concurrent analyzers (code structure, data flow, dependency, request flow, API) → unified README, CLAUDE.md, cursor rules | emerging | low-medium | [github.com/divar-ir/ai-doc-gen](https://github.com/divar-ir/ai-doc-gen) |
| RepoAgent (OpenBMB, 2024) | Single-agent topological traversal with DAG dependency ordering, bottom-to-top generation, git-diff delta tracking | proven (academic) | low | [arxiv.org/abs/2402.16667](https://arxiv.org/abs/2402.16667) |
| AWS Scatter-Gather Pattern | Canonical parallel fan-out → aggregator pattern: tasks distributed to N agents, results gathered and synthesized by aggregator LLM | proven (cloud architecture) | high | [docs.aws.amazon.com](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/parallelization-and-scatter-gather-patterns.html) |
| Claude Agent SDK Slash Commands | `.claude/commands/` YAML+markdown skill files; `argument-hint`, `allowed-tools`, `$ARGUMENTS` substitution; auto-discovered via slash command menu | proven (platform native) | high | [platform.claude.com/docs](https://platform.claude.com/docs/en/agent-sdk/slash-commands) |

---

### Recommended Starting Point

**GSD Gather-Synthesize (internal) + Claude Agent SDK Slash Commands** — these two patterns together directly satisfy all three pillars of this feature with zero new concepts introduced:

1. **Parallel explorers by focus area (FN-01, FN-02, TC-01, TC-03):** The `gather-synthesize.md` pattern already handles parallel Task() spawns, retry logic, failure manifests, and synthesizer invocation. The doc-writer-overhaul reuses the exact same pattern that research (6 gatherers) and review (4 reviewers) already use. The only change is substituting 5 doc-focused explorer agents for the existing reviewer agents and directing them to focus areas (code comments, module & flow docs, standards & decisions, project config, friction reduction). Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` lines 1-3 (purpose) and `review.md` lines 1-2 (existing 4-reviewer application).

2. **Synthesizer producing doc-report.md (FN-03):** Same synthesizer invocation pattern already implemented for review (`gsd-review-synthesizer`) and research (`gsd-research-synthesizer`). Single synthesizer reads all explorer findings and writes unified output. The `doc-report.md` format contract stays unchanged, protecting the Q&A loop downstream. Source: `gather-synthesize.md` Step 4.

3. **/gsd:doc standalone skill (EU-02, FN-04, TC-02):** The `commands/gsd/review.md` and `commands/gsd/plan.md` skill files show exactly the pattern to replicate: YAML frontmatter → slug-resolve bash call → route by type (feature vs capability) → invoke workflow. Claude Agent SDK confirms `.claude/commands/` `.md` files with `argument-hint` and `$ARGUMENTS` are the correct mechanism. Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md` and [platform.claude.com/docs](https://platform.claude.com/docs/en/agent-sdk/slash-commands).

4. **Lens propagation (EU-03):** Already established in research and review. Layer 4 framing context injection in `gather-synthesize.md` passes lens to each gatherer. The doc-writer-overhaul extends this: LENS shapes emphasis within each explorer's prompt (not which explorers run). Source: `gather-synthesize.md` Layer 4, `gsd-doc-writer.md` Framing Context section.

Start from the GSD internal pattern. External approaches add nothing that isn't already present.

---

### Anti-Patterns

- **DocAgent's Reader→Searcher→Writer→Verifier sequential-per-component pipeline:** This is a serial, component-level traversal pattern designed for whole-repository documentation generation. It optimizes for dependency completeness (topological ordering) but requires one full agent cycle per file/function. In GSD's context, the unit of work is a feature delta (not a full repo), and the goal is recommendations (not exhaustive docstrings for every function). Adopting DocAgent's sequential-per-component pattern would mean serializing work that should be parallel and generating far more output than the Q&A loop can process. Anti-pattern in this context because: sequential = slower, per-component scope = exploding output volume, dependency ordering = irrelevant when input is already a bounded git diff. Source: [arxiv.org/html/2504.08725v2](https://arxiv.org/html/2504.08725v2) — DocAgent described as "sequential iterative cycles: Reader → Searcher → Writer → Verifier."

- **Generating documentation directly (write to .documentation/ in explorers):** The current single-agent doc-writer writes module and flow docs directly to `.documentation/`. This is the anti-pattern being replaced. Explorers writing directly creates: race conditions if two explorers attempt the same file, no deduplication, no human review gate before file creation. The pattern fix is explorers → findings files only; synthesizer → doc-report.md; Q&A loop → approved artifacts only then committed. Source: FEATURE.md FN-03 (synthesizer produces doc-report.md), FN-06 (Q&A loop preserved), `doc.md` key_constraints "Q&A happens HERE via AskUserQuestion -- NOT inside doc agent."

- **Configurable focus areas per-run:** MDocAgent uses parallel modalities (text + image) but these are static pipelines, not user-configurable per invocation. Similarly, divar-ir/ai-doc-gen runs all 5 analyzers always. The temptation to make GSD's doc explorer focus areas user-configurable (skip friction-reduction, run only code-comments, etc.) adds complexity without proportional value — FEATURE.md FN-02 explicitly states "Focus areas are stable — not configurable per-run." Adding configurability here means: more UI decisions, conditional logic in doc.md, and an irregular user experience. [First principles: YAGNI — the user benefit of skipping one focus area does not justify the orchestration complexity of conditional spawning and manifest interpretation.]

- **Monolithic single-agent doc generation (the status quo):** The existing `doc.md` Step 4 spawns one Task with `subagent_type="general-purpose"`. This works for narrow scope (code + .documentation) but fails to scale to 5 focus areas: a single agent covering code comments, architecture decisions, CLAUDE.md drift, AND friction reduction will produce generic, shallow output on each dimension. Research and review both demonstrated that specialist agents produce higher-quality targeted output than a single generalist. Source: `doc.md` key_constraints "Single-agent pipeline (NOT gather-synthesize) — one doc-writer, not parallel gatherers" — this is the constraint being removed.

---

### Libraries / Tools

- **gsd-tools CLI (existing, project-native):** `slug-resolve`, `init feature-op`, `capability-status` routes already used by all existing commands. `/gsd:doc` skill should use the same `slug-resolve` CLI route as `review.md` and `plan.md` — no new tooling needed. Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md` Step 1 bash block.

- **Claude Agent SDK slash command filesystem convention (platform-native):** `.claude/commands/{name}.md` with YAML frontmatter (`allowed-tools`, `argument-hint`, `description`) and `$ARGUMENTS` substitution. This is the canonical pattern for standalone skills in Claude Code. Source: [platform.claude.com/docs/en/agent-sdk/slash-commands](https://platform.claude.com/docs/en/agent-sdk/slash-commands).

- **No external libraries required.** This feature is a workflow restructure within an existing AI agent framework. The gather-synthesize pattern, Task() orchestration, and slash command convention are all already present in the stack.

---

### Canonical Patterns

- **Scatter-Gather (Fan-out / Fan-in):** Distribute N independent subtasks to N parallel agents, wait for all, aggregate via a single synthesizer. Use when: problem decomposes into parallel independent dimensions, synthesis requires cross-dimension awareness. GSD already applies this in research (6 gatherers) and review (4 reviewers). Doc-writer-overhaul applies it to documentation (5 explorers). Source: [AWS Prescriptive Guidance — Parallelization and scatter-gather patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/parallelization-and-scatter-gather-patterns.html) and `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md`.

- **Executor/Judge model allocation:** Explorers (executors) run on Sonnet; synthesizer (judge) runs on inherit/Opus. This is already established in GSD: `gather-synthesize.md` key_constraints "Gatherers use role_type executor (Sonnet). Synthesizer uses role_type judge (Opus via inherit)." Applying this split to doc explorers keeps cost proportional — explorers do bounded investigation, synthesizer does quality filtering and deduplication. Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` key_constraints (last bullet).

- **Focus Area as Partition Key:** Assign each parallel agent exactly one non-overlapping investigation domain. Each agent writes to a domain-scoped findings file. Synthesizer reads all findings and resolves overlaps. This prevents duplicate work and enables partial-failure tolerance (synthesizer works with whatever findings arrive). Applied in: GSD research (6 dimensions), GSD review (4 dimensions), divar-ir/ai-doc-gen (5 analyzers), MDocAgent (text vs image RAG pipelines). Source: `gather-synthesize.md` Step 2 (one Task per gatherer), FEATURE.md TC-03 "Explorers must not overlap — the focus area assignment is the partition key."

- **Slug-Resolve → Route → Invoke workflow (command pattern):** All GSD standalone skills follow the same 3-step pattern: (1) `gsd-tools slug-resolve $ARGUMENTS` to get resolved type + slugs, (2) route by type (feature vs capability), (3) invoke the appropriate workflow with resolved slugs. `/gsd:doc` should follow this exactly. Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md` (capability vs feature routing) and `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md` (feature-only routing with type hint).

- **Lens injection as Layer 4 context (framing-agnostic pattern):** Lens does not change which agents run or what output format they produce — it shapes the emphasis within each agent's prompt via Layer 4 framing context. This keeps the gather-synthesize pattern framing-agnostic (the pattern is invariant; only the prompts vary). Already applied in research and review; doc-writer-overhaul extends to doc explorers. Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` key_constraints "The pattern is framing-agnostic: framing changes the Layer 4 context and the gatherer agent definitions, not this pattern itself."
