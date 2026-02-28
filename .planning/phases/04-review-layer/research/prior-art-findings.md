## Prior Art Findings

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Qodo 2.0 Multi-Agent Expert Review | Specialized agents per analysis domain (security, style, performance) with a judge agent that consolidates, deduplicates, and filters findings | proven | high | [Qodo blog](https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/) |
| Google ADK Parallel→Synthesizer Pattern | Fan-out parallel agents with isolated output keys, fan-in synthesizer reads all outputs and produces consolidated report | proven | high | [Google ADK guide](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/) |
| Calimero Multi-Agent Code Reviewer | 2-5 LLM agents run in parallel, consensus-based scoring (severity x agreement), review aggregator clusters similar findings | emerging | medium | [GitHub repo](https://github.com/calimero-network/ai-code-reviewer) |
| CodeRabbit Hybrid Pipeline+Agent | Deterministic pipeline (30+ static analyzers) feeds curated context to LLM, verification agent grounds feedback | proven | low | [CodeRabbit architecture](https://www.coderabbit.ai/blog/pipeline-ai-vs-agentic-ai-for-code-reviews-let-the-model-reason-within-reason) |
| PR-Agent Single-Pass Review | Single LLM call with Jinja2 prompt template, YAML response parsing, no multi-perspective | proven | low | [PR-Agent DeepWiki](https://deepwiki.com/qodo-ai/pr-agent) |

### Recommended Starting Point

**Qodo 2.0 judge pattern + Google ADK fan-out/fan-in**, adapted to GSD's existing gather-synthesize primitive.

Rationale: GSD already has a proven parallel gather → synthesize pattern (Phase 2 research agents). The review layer is structurally identical: fan-out to 4 specialist reviewers (instead of 6 research gatherers), fan-in to a synthesizer (instead of research synthesizer). The Qodo 2.0 architecture validates this exact shape for code review specifically — specialized agents per domain with a judge that consolidates and filters.

Key adaptations for GSD context:
- GSD reviewers trace against explicit REQ IDs (EU-xx, FN-xx, TC-xx), not general code quality — this is closer to requirement traceability verification than typical PR review [First principles: GSD reviews are requirement-conformance checks with evidence, not open-ended code critique]
- GSD's synthesizer already has conflict priority ranking (P1/P2/P3) and section-locked headings — the review synthesizer follows the same structural pattern with review-specific semantics (blocker/major/minor severity, user>functional>technical>quality priority) — [agents/gsd-research-synthesizer.md](/Users/philliphall/get-shit-done-pe/agents/gsd-research-synthesizer.md)
- Calimero's consensus scoring (severity x agreement) is unnecessary — GSD reviewers cover non-overlapping requirement layers, so "agreement" between reviewers is rare by design. Conflicts are the interesting signal, not consensus. [First principles: orthogonal reviewers produce orthogonal findings; overlap = cross-layer concern, not consensus]

### Anti-Patterns

- **Over-prompted verification**: Asking an LLM to explain reasoning AND propose corrections in the same pass reduces requirement-conformance accuracy by 20-40 percentage points. GPT-4o accuracy dropped from 52% to 11% with complex prompts. GSD reviewers must report verdicts only — the synthesizer handles severity, and the user handles resolution. Keep reviewer prompts simple: verdict + evidence. — [arxiv.org/html/2508.12358v1](https://arxiv.org/html/2508.12358v1)

- **Single-pass multi-concern review**: PR-Agent's architecture sends one prompt covering all review dimensions. This conflates distinct cognitive tasks — security reasoning differs from performance analysis. GSD's parallel specialist model avoids this by construction. — [PR-Agent architecture](https://deepwiki.com/qodo-ai/pr-agent)

- **Consensus-as-quality for orthogonal reviewers**: Calimero weights findings by agent agreement count. This works when agents overlap (3 security agents). For GSD's non-overlapping layers, agreement-based weighting would suppress valid single-reviewer findings. Each reviewer's domain authority stands on its own. — [First principles: consensus scoring assumes redundancy; GSD reviewers are complementary, not redundant]

- **Ungrounded findings (hallucinated review comments)**: LLM reviewers frequently flag correct code as non-compliant (false negatives). The mitigation is evidence-gating: every finding must cite file:line with quoted code. The synthesizer spot-checks citations before presenting. This matches GSD's CONTEXT.md decision that findings without evidence are not actionable. — [diffray.ai/blog/llm-hallucinations-code-review](https://diffray.ai/blog/llm-hallucinations-code-review/)

- **Severity assignment at the reviewer level**: When individual reviewers assign severity, they lack cross-layer context. Qodo 2.0's judge assigns final severity after seeing all perspectives. GSD's CONTEXT.md already decided this correctly — reviewers report verdicts, synthesizer assigns severity. — [Qodo 2.0 architecture](https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/)

### Libraries / Tools

No external libraries are applicable. GSD's review layer is an LLM orchestration pattern implemented through agent definitions and workflow scripts, not a library dependency.

Relevant ecosystem tools for reference only (not dependencies):
- **Qodo PR-Agent** (open-source): Single-pass review with Jinja2 templates and YAML response parsing — useful reference for prompt template structure, not for multi-agent pattern — [github.com/qodo-ai/pr-agent](https://github.com/qodo-ai/pr-agent)
- **Calimero ai-code-reviewer** (open-source): Multi-agent with consensus aggregation — useful reference for review aggregator data flow — [github.com/calimero-network/ai-code-reviewer](https://github.com/calimero-network/ai-code-reviewer)

### Canonical Patterns

- **Fan-out/Fan-in with isolated state**: Each parallel reviewer writes to a unique output key/file. Synthesizer reads all outputs after completion. Prevents race conditions and context leakage. Google ADK documents this explicitly: each agent must write to a unique key. GSD already implements this in research (6 gatherers → 6 files → synthesizer reads all). Review layer replicates: 4 reviewers → 4 trace reports → synthesizer reads all. — [Google ADK parallel pattern](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)

- **Judge-not-voter**: The synthesizer is a judge with authority, not a vote counter. It reads evidence, applies priority ordering, and makes severity determinations. Qodo 2.0 validates this: their judge resolves conflicts, removes duplicates, and filters low-signal results. This matches GSD's CONTEXT.md decision: synthesizer uses judgment first, priority ordering as tiebreaker. — [Qodo 2.0 judge](https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/)

- **Two-phase verification prompting**: Research shows that separating requirement comprehension from code auditing significantly improves accuracy (GPT-4o went from 52% to 85% with behavioral comparison prompt). GSD reviewers should first internalize their requirement layer, then trace code against it — not attempt both in one reasoning pass. — [arxiv.org/html/2508.12358v1](https://arxiv.org/html/2508.12358v1)

- **Evidence-gated findings**: Every claim cites file:line + quoted code + reasoning chain. Findings without evidence are discarded before synthesis. This is both a hallucination mitigation (forces grounding) and a quality filter (unevidenced claims are noise). Documented across CodeRabbit (verification agent grounds feedback) and GSD's own CONTEXT.md decisions. — [CodeRabbit verification](https://www.coderabbit.ai/blog/pipeline-ai-vs-agentic-ai-for-code-reviews-let-the-model-reason-within-reason)

- **Curated context over maximum context**: CodeRabbit's core lesson is that more context hurts. Each reviewer should receive only its requirement layer + the relevant code, not the entire project context. The framing-specific question injection (from CONTEXT.md) follows this principle — change the questions, not the context volume. — [CodeRabbit context management](https://www.coderabbit.ai/blog/pipeline-ai-vs-agentic-ai-for-code-reviews-let-the-model-reason-within-reason)

- **Requirement-conformance vs open-ended review**: LLM accuracy at verifying code against specifications is 52-78% (best case with behavioral comparison prompting: 85%). This is adequate for surfacing issues for human decision but NOT for autonomous pass/fail gating. GSD's design (present recommendations to user for decision) correctly accounts for this limitation. — [arxiv.org/html/2508.12358v1](https://arxiv.org/html/2508.12358v1)
