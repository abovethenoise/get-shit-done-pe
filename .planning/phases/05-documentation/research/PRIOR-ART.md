## Prior Art Findings

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| DocAgent (Meta) Multi-Agent with AST DAG | 5 specialized agents (Reader, Searcher, Writer, Verifier, Orchestrator) process code in topological dependency order via AST-parsed DAG. Tarjan's algorithm condenses cycles. Each component documented only after its dependencies. | proven (ACL 2025) | high | [arxiv.org/html/2504.08725v1](https://arxiv.org/html/2504.08725v1) |
| RepoAgent (OpenBMB) 3-Stage Pipeline | Global structure analysis (AST + dependency graph) -> bottom-to-top documentation generation -> Git pre-commit hook update stage. Detects minimal impacted scope via bidirectional references. | proven (EMNLP 2024) | high | [arxiv.org/html/2402.16667v1](https://arxiv.org/html/2402.16667v1) |
| DocAider (Microsoft/UCL) PR-Triggered Multi-Agent | GitHub Actions workflow triggers on PR open. Code Context Agent builds call graph, Documentation Generation Agent writes, Review Agent validates, Revise Agent fixes. Recursive update propagation through dependents. | emerging | medium | [Microsoft Tech Community](https://techcommunity.microsoft.com/blog/educatordeveloperblog/docaider-automated-documentation-maintenance-for-open-source-github-repositories/4245588) |
| rustdoc Executable Documentation | Documentation comments are first-class language constructs. Code examples in docs are compiled and run as tests. Stale examples break the build. Search-first navigation. | proven (Rust ecosystem standard) | medium (pattern, not tool) | [blog.goose.love/posts/rustdoc](https://blog.goose.love/posts/rustdoc/) |
| Mintlify AI-Native Doc Platform | AST parsing -> tokenization -> fine-tuned LLM generation. Generates interactive API playgrounds, flowcharts (Mermaid.js), semantic search. Commercial platform. | proven (commercial) | low (SaaS, wrong scope) | [mintlify.com](https://www.mintlify.com/) |
| doc-comments-ai (tree-sitter + LLM) | Tree-sitter parses code structure, LLM generates docstring/comment blocks per method. Only modifies files without unstaged changes (Git-aware safety). | emerging | low (function-level, not flow-level) | [github.com/fynnfluegge/doc-comments-ai](https://github.com/fynnfluegge/doc-comments-ai) |

### Recommended Starting Point

**DocAgent's topological processing + RepoAgent's Git-based update detection**, adapted to GSD's existing gather-synthesize primitive and the CONTEXT.md decisions around section ownership.

Rationale: GSD's doc agent has a unique constraint that neither DocAgent nor RepoAgent address: it generates flow-level narratives across modules, not function-level docstrings within modules. However, the core patterns from both systems directly apply:

1. **Dependency-ordered generation** (DocAgent): GSD should document modules before flows that reference them. This matches CONTEXT.md's discovery scope -- modified modules first, then one-hop flow impact. DocAgent proves this ordering improves truthfulness from 86.75% to 94.64% (ablation study). [First principles: you cannot accurately describe a flow's steps without first understanding the modules those steps traverse]

2. **Minimal-scope update detection** (RepoAgent): RepoAgent's three update triggers map directly to GSD's needs -- (1) source code modified -> regenerate module doc derived sections, (2) references removed -> flag orphaned flow references, (3) new references added -> flag flows needing new step entries. GSD's `built-from-code-at:` git SHA requirement is a simpler version of this same pattern. [arxiv.org/html/2402.16667v1](https://arxiv.org/html/2402.16667v1)

3. **Multi-agent with verification** (DocAgent + DocAider): Both systems separate writing from verification. GSD's 3-pass self-validation (structural, referential, gate-doc consistency) is more rigorous than either system's verification. DocAgent's Verifier checks completeness, helpfulness, truthfulness -- GSD's passes check structural compliance, referential integrity, and constraint/glossary consistency. Different concerns, same separation-of-concerns principle.

Key adaptations for GSD context:
- GSD does NOT need AST parsing or dependency DAG construction. The doc agent operates post-review on a small change set (modified files from the reviewed change), not on an entire repository. The input contract is already scoped: code files + review findings + FEATURE.md. [First principles: GSD's pipeline has already narrowed scope by the time the doc agent runs; full-repo analysis is a solution to a problem GSD doesn't have]
- GSD's section ownership model (`[derived]`/`[authored]`) has no direct precedent in any system found. DocAgent and RepoAgent overwrite all generated content. GSD's approach is more nuanced -- derived sections are overwritable, authored sections are preserved and flagged on conflict. This is the right design for a system where humans add judgment (WHY blocks, Constraints) that machines should not erase.
- GSD's flow narratives (cross-module, trigger-to-output paths) are a novel doc type. No surveyed tool generates this kind of documentation. The closest analog is architecture decision records (ADRs), but those capture "why" not "what happens." GSD's flow docs capture the runtime path through modules -- this is original to the project.

### Anti-Patterns

- **Full-repo analysis on every change**: DocAgent processes entire repositories (164 repos, 115,943 nodes). RepoAgent builds global dependency graphs. For GSD's incremental, post-review context, this is massive overkill. The doc agent should read only the files from the reviewed change + existing docs that reference those files (one-hop). CONTEXT.md already decided this correctly ("Never: full codebase scan or unrelated modules"). Violating this wastes tokens and introduces hallucination risk from irrelevant context. -- [First principles: context volume correlates with hallucination rate; Phase 4 research confirmed this via CodeRabbit's "curated context over maximum context" finding]

- **Function-level docstring generation**: doc-comments-ai, Mintlify, and most commercial tools generate per-function documentation (JSDoc-style). GSD explicitly rejected this -- "Function-level reference stays in the code itself (types, naming)." Flow narratives and module overviews are the value layer. Generating function docstrings would duplicate what TypeScript types already express and create a maintenance burden with near-zero lookup value. -- [CONTEXT.md decision: "module-level granularity in flows: reference modules, not functions"]

- **Single-agent documentation generation**: DocAider's research found that moving from single-agent to multi-agent "significantly reduced hallucinations and improved accuracy." However, GSD should NOT adopt multi-agent for documentation. The doc agent's scope is already narrow (one change set, post-review), and the 3-pass validation provides the verification benefit without agent coordination overhead. Multi-agent matters when the input scope is large (full repo); GSD's scoped input makes a single writer + validation passes more efficient. -- [First principles: multi-agent coordination has overhead; justified for large scope, not for the narrow scope GSD's pipeline provides]

- **Overwriting human-authored content**: No surveyed system distinguishes between machine-derived and human-authored documentation sections. All treat documentation as fully regenerable. GSD's `[derived]`/`[authored]` tags solve a real problem -- WHY blocks and Constraint notes contain judgment that would be lost on regeneration. Systems that overwrite everything force users to re-add judgment after every update, which means they stop adding judgment entirely. -- [First principles: if the system destroys your edits, you stop editing]

- **Skipping verification/validation**: IBM reports 59% time savings from AI documentation, but also notes AI "may generate inaccurate information." DocAgent's truthfulness metric shows 95.74% existence ratio (best case) -- meaning ~4% of referenced code entities are hallucinated even with sophisticated multi-agent verification. GSD's Pass 2 (referential integrity: "module names match real code artifacts, listed exports actually exist") directly targets this. Without it, documentation references will hallucinate exports and dependencies. -- [DocAgent evaluation](https://arxiv.org/html/2504.08725v1), [IBM](https://www.ibm.com/think/insights/ai-code-documentation-benefits-top-tips)

- **Consensus-based verification for single-writer systems**: DocAgent uses LLM-as-judge for helpfulness evaluation. This makes sense when comparing multiple documentation variants. GSD has one writer producing one output -- the verification should be deterministic (structural checks, reference resolution against actual files), not LLM-judged quality. Pass 1 and Pass 2 are deterministic; Pass 3 (gate doc consistency) can be mostly deterministic (string matching against glossary, pattern matching against constraints). -- [First principles: deterministic validation catches more bugs with less token cost than LLM-as-judge for structured output]

### Libraries / Tools

No external libraries are required. GSD's documentation agent is an LLM orchestration pattern implemented through agent definitions and workflow scripts.

Relevant implementation patterns from surveyed tools (not dependencies):

- **Tree-sitter** (used by doc-comments-ai): AST parsing for code structure extraction. GSD does NOT need this -- the doc agent reads source files as text, relying on the LLM's code comprehension rather than structured parsing. The input scope is small enough that raw file reading is sufficient.
- **Git diff / Git log**: For staleness detection (`built-from-code-at:` SHA tracking). GSD already uses Git throughout the pipeline. The doc agent should stamp each generated doc with the commit SHA of the code it was built from, enabling future staleness checks via `git log --since`.
- **grep / mgrep**: For one-hop impact discovery. The doc agent should grep existing flow docs for references to modified module names, producing a list of potentially stale flow docs. This is already decided in CONTEXT.md.

### Canonical Patterns

- **Dependencies-first generation order**: DocAgent proves that documenting dependencies before dependents improves truthfulness by ~8 percentage points (94.64% vs 86.75%). For GSD, this means: generate/update module docs first, then generate/update flow docs that reference those modules. The module doc serves as verified context for the flow doc writer. This ordering is implicit in CONTEXT.md's discovery scope ("files directly modified" first, then "impact discovery one hop") but should be made explicit in the agent's processing sequence. -- [DocAgent ablation study](https://arxiv.org/html/2504.08725v1)

- **Minimal-scope change propagation**: RepoAgent identifies three update triggers: (1) source code modified, (2) references removed, (3) new references added. GSD should adopt this exact model. For each modified module: regenerate its `[derived]` sections. Then grep flow docs for that module name -- if found, flag those flows (don't auto-rewrite). If a new module appears, check if any existing flow should reference it (unlikely in practice -- new flows would be created). CONTEXT.md already specifies this as "Impact handling: impacted flow docs are flagged only." -- [RepoAgent update mechanism](https://arxiv.org/html/2402.16667v1)

- **Section-level ownership with explicit tags**: GSD's `[derived]`/`[authored]` model is novel but follows a well-established pattern from configuration management: some sections are machine-generated (regenerate freely), others are human-edited (preserve, flag conflicts). The analog in Kubernetes is `metadata.annotations` (machine-managed) vs `metadata.labels` (often human-set). The doc agent should parse existing docs by heading anchors, identify section tags, and apply different update strategies per tag. This is already specified in CONTEXT.md but has no precedent in documentation tooling -- GSD is innovating here.

- **3-pass validation as a pipeline**: DocAgent separates completeness, helpfulness, and truthfulness checks. GSD's 3-pass model (structural -> referential -> gate-doc consistency) is a better fit because: Pass 1 is fully deterministic (heading format, required sections, tag presence), Pass 2 is mostly deterministic (file existence checks, export resolution, dependency verification), and Pass 3 mixes deterministic (glossary term matching) with light inference (constraint violation detection). Running passes in order means structural failures are caught before wasting effort on referential checks. -- [First principles: fail fast; cheapest checks first]

- **Git SHA as staleness marker**: GSD's `built-from-code-at:` git SHA requirement is a lightweight version of RepoAgent's Git pre-commit hook detection. The SHA stamps when docs were generated. To detect staleness later: `git log <sha>..HEAD -- <source_file>` returns non-empty if the source changed since docs were last generated. This is simpler and more reliable than timestamp-based approaches (which break across timezones and rebases). No surveyed tool uses exactly this pattern, but it follows Git's content-addressable design naturally. -- [First principles: Git SHAs are content-derived; if the SHA changed, the content changed]

- **Trigger model: event-driven, not scheduled**: RepoAgent uses Git pre-commit hooks. DocAider uses PR-open events. GSD uses review-acceptance as the trigger. All three share the pattern: documentation generation is event-driven (code change event), not scheduled (cron job). This avoids both staleness (docs update when code changes) and unnecessary work (no regeneration when nothing changed). GSD's trigger is the most precise -- it fires only after code has been reviewed and accepted, meaning the doc agent never documents code that might be rolled back. -- [First principles: the later in the pipeline you generate docs, the less wasted work from rejected changes]

- **Evidence-grounded generation (input contract)**: DocAgent's Reader agent explicitly requests specific context before the Writer generates. GSD's input contract serves the same purpose: the doc agent reads three specific sources (code, review findings, FEATURE.md) to answer three specific questions (what does it do, why is it this way, what was it supposed to do). This prevents the "write documentation from memory" failure mode where LLMs generate plausible-but-wrong descriptions. -- [CONTEXT.md decision: "Agent reads three sources to answer different lookup questions"]

### Staleness Detection Approaches

| Approach | Used By | How It Works | Fit for GSD |
|----------|---------|-------------|-------------|
| Git pre-commit hook | RepoAgent | Hook fires on commit, diffs staged files against dependency graph, regenerates affected docs before commit completes | Low -- too aggressive for GSD's pipeline; docs should generate after review, not on every commit |
| PR-open event | DocAider | GitHub Actions workflow triggers on PR creation, processes changed files | Medium -- right trigger concept but wrong timing (pre-review vs post-review) |
| Git SHA stamp | GSD (proposed) | Each doc carries `built-from-code-at:` SHA. Staleness check: `git log <sha>..HEAD -- <source>`. Non-empty = stale. | High -- simple, reliable, content-derived, no external dependencies |
| Dependency graph + 3 triggers | RepoAgent | Track (1) modified source, (2) removed references, (3) new references. Update minimally. | High -- GSD should adopt the trigger taxonomy but implement via grep, not graph construction |
| Bidirectional reference tracking | DocAgent | AST-parsed dependency DAG tracks who-calls-whom. Update propagates through graph. | Low -- requires global AST analysis that GSD's scoped pipeline doesn't need |

### Key Metrics from Surveyed Systems

| System | Truthfulness | Completeness | Notes |
|--------|-------------|--------------|-------|
| DocAgent (GPT-4) | 95.74% existence ratio | 0.934 | Best-in-class but still ~4% hallucinated references |
| DocAgent (Claude) | 88.17% existence ratio | 0.953 | Higher completeness, lower truthfulness than GPT |
| ChatGPT baseline (no agents) | 61.10% existence ratio | 0.815 | Single-pass LLM without multi-agent or dependency ordering |
| RepoAgent | 70-91% user preference over human docs | N/A | Different eval methodology |
| DocAider | 1.0 function/class description accuracy | N/A | Small-scale eval (6 repos, max 20 files each) |

Key takeaway: Even sophisticated multi-agent systems with AST-based verification achieve only ~96% accuracy on code entity references. GSD's Pass 2 (referential integrity) is essential, not optional. The 4-5% hallucination rate means roughly 1 in 20 referenced exports or dependencies will be wrong without verification.

### Implications for GSD Phase 5

1. **The doc agent should be a single writer with deterministic validation, not a multi-agent system.** GSD's pipeline has already narrowed scope sufficiently. The verification value comes from the 3-pass validation, not from agent count.

2. **Process modules before flows.** DocAgent's ablation study proves dependency-first ordering matters. Module docs become verified context for flow doc generation.

3. **The `[derived]`/`[authored]` section ownership model is novel and correct.** No surveyed system does this. It solves the real problem of preserving human judgment across regeneration cycles.

4. **Git SHA staleness is the right approach.** Simpler than dependency graphs, more reliable than timestamps, native to the tooling GSD already uses.

5. **One-hop impact flagging (not auto-rewrite) is validated by RepoAgent's approach.** Minimal-scope propagation with human review of flagged docs prevents cascading hallucinations.

6. **Pass 2 (referential integrity) is the highest-value validation pass.** The ~4-5% entity hallucination rate in best-in-class systems makes this non-negotiable. File existence checks, export verification, and dependency resolution should be deterministic, not LLM-judged.

7. **The trigger timing (post-review-acceptance) is optimal.** It avoids wasted work on rejected code and ensures the doc agent only documents accepted, reviewed code. No surveyed system is this selective about when to generate docs.
