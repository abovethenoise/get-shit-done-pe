## Prior Art Findings

Context: coherence-report takes raw scan findings (matrix, dependency graph, finding cards) from landscape-scan and synthesizes them into RECOMMENDATIONS.md -- root causes grouped to finding IDs, systemic patterns, goal alignment, resolution sequence, contradictions, and a Q&A agenda for refinement-qa.

Key constraints: zero runtime deps, Node.js CommonJS, single Claude invocation for synthesis, agent receives contents not paths, categorical goal alignment (blocks/risks/irrelevant), Q&A agenda triage (decision/informational/auto-resolve).

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| SonarQube report model | Severity-grouped findings with remediation effort estimates, quality dimensions, and priority-ordered resolution | proven | high | [SonarQube metrics docs](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition) |
| GSD review-synthesizer pattern | Existing in-project agent that consolidates 4 reviewer traces into severity-ordered findings with conflicts/tensions sections | proven (in-project) | high | `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md` |
| GSD research-synthesizer pattern | Existing in-project agent that consolidates 6 research outputs into consensus/conflicts/gaps/constraints/scope | proven (in-project) | high | `/Users/philliphall/get-shit-done-pe/agents/gsd-research-synthesizer.md` |
| WSJF prioritization | Cost of delay / job size ranking from SAFe; multi-factor scoring (business value + time criticality + risk reduction) / effort | proven | low | [SAFe WSJF](https://framework.scaledagile.com/wsjf) |
| GitHub Agentics issue triage | LLM-based auto-categorization of issues into types/priorities with human-in-the-loop for ambiguous cases | emerging | medium | [GitHub Agentics triage](https://github.com/githubnext/agentics/blob/main/docs/issue-triage.md) |
| Fishbone / 5-Whys root cause grouping | Structured causal analysis: categorize symptoms into cause buckets, drill down per cause to find root | proven | medium | [EasyRCA comparison](https://easyrca.com/blog/root-cause-and-effect-analysis-5-whys-vs-fishbone/) |

### Recommended Starting Point

**Hybrid: GSD synthesizer agents (structural pattern) + SonarQube report model (report structure) + categorical triage (Q&A agenda)**

Rationale:

1. **Agent structure:** GSD already has two synthesizer agents that solve nearly the same problem -- consolidating multiple specialist outputs into a single actionable report. The `gsd-review-synthesizer` is the closest analog: it takes 4 trace reports, assigns severity, resolves conflicts, and orders findings by impact. The coherence-report synthesizer should follow this exact pattern but adapt the input (scan artifacts instead of reviewer traces) and output (RECOMMENDATIONS.md instead of synthesis.md). This is not speculation -- the codebase has proven this agent shape works. [Source: `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md`, `/Users/philliphall/get-shit-done-pe/agents/gsd-research-synthesizer.md`]

2. **Report structure:** SonarQube's model of grouping by severity tier (Blocker > Critical > Major > Minor > Info), estimating remediation effort, and rolling up into quality dimensions maps directly to the FEATURE.md spec. The coherence-report already specifies: executive summary (counts by severity + themes), root causes, systemic patterns, goal alignment, resolution sequence. SonarQube validates this structure as the proven way to make findings actionable. The key adaptation: SonarQube uses numeric remediation effort (minutes), but GSD should stay categorical (blocks/risks/irrelevant) per the FEATURE.md decision. [Source: SonarQube metrics docs](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition)

3. **Q&A agenda triage:** The three-bucket categorization (decision items / informational items / auto-resolve items) maps to a well-established triage pattern seen in GitHub's agentic workflows and clinical decision support systems. The critical design choice is what determines each bucket:
   - **Decision items:** contradictions (from FEATURE.md FN-02 section 6) + cases where goal alignment is ambiguous + strategic tradeoffs
   - **Informational items:** clear findings with obvious fixes, no tradeoffs
   - **Auto-resolve items:** missing docs, naming inconsistencies, gap fillings where only one reasonable option exists

   This maps to GitHub Agentics' pattern of categorize-then-route, but without the webhook/CI machinery -- the agent embeds the categorization directly in RECOMMENDATIONS.md as a final section. [Source: GitHub Agentics triage](https://github.github.com/gh-aw/blog/2026-01-13-meet-the-workflows/)

4. **Root cause grouping:** The FEATURE.md spec already describes the right approach (root cause → [symptom finding IDs]). This mirrors the landscape-scan's consolidation pass (FN-04) which groups N symptoms into M root causes. The fishbone/5-Whys methodology offers a useful prompt engineering technique: instruct the synthesis agent to ask "why do these findings co-occur?" for each cluster, which surfaces the shared cause. No library or tool needed -- this is a prompt design pattern. [First principles: the input is <50 natural language finding cards; Claude can cluster them by shared cause in a single pass without algorithmic support]

### Anti-Patterns

- **Numeric scoring / WSJF for prioritization:** Looks appealing because it produces a sortable score, but introduces false precision for this context. GSD findings are natural-language descriptions of coherence issues -- assigning numeric "business value" and "time criticality" scores to them would require the agent to invent numbers with no grounding. The FEATURE.md already decided correctly: categorical assessment (blocks/risks/irrelevant) avoids this trap. SonarQube's numeric remediation effort works because they have rule-specific baselines calibrated over millions of codebases; GSD has no such baseline. [First principles: categorical > numeric when the input data doesn't support meaningful numeric differentiation; FEATURE.md TC-02 decision confirms this]

- **Multi-pass synthesis pipeline (analyze -> score -> rank -> format):** Tempting to break synthesis into staged Claude calls for "better reasoning," but this contradicts the FEATURE.md FN-02 decision ("single Claude invocation produces full report"). Multi-pass adds orchestration complexity, increases token cost, and creates intermediate state management problems. The GSD review-synthesizer already proves that a single-pass consolidation works for similar complexity levels. For the expected input size (<50 finding cards + project context), a single opus-level invocation has sufficient context window. [Source: FEATURE.md FN-02 decision; `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md` precedent]

- **External prioritization framework (RICE, MoSCoW, etc.):** These are designed for product roadmap prioritization with stakeholder input, not for automated synthesis of coherence findings. They require human judgment on multiple axes (reach, impact, confidence, effort) -- which defeats the purpose of the coherence-report generating an actionable first-pass that shapes the Q&A. The resolution sequence should be determined by: severity (from finding cards) + goal alignment (blocks > risks > irrelevant) + dependency fan-out (more downstream impact = higher priority). These are all derivable from the scan artifacts without human input. [Source: RICE framework](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/); [First principles: prioritization frameworks requiring human-scored dimensions are inappropriate for an automated synthesis pass]

- **Structured knowledge graph / formal ontology for findings:** Tools like jQAssistant/Neo4j model code dependencies as graph databases for querying. This is overkill -- the findings are already structured (finding cards with type, severity, affected capabilities) and the total count is small (<50). A flat markdown structure with cross-references (root cause ID -> finding IDs) is sufficient and maintains zero-dep constraint. [First principles: zero-runtime-deps project constraint; graph DB adds infrastructure for <50 nodes]

### Libraries / Tools

No external libraries recommended. The implementation should use:

- **Existing GSD agent infrastructure:** Agent definition file (`agents/gsd-coherence-synthesizer.md`) following the same pattern as `gsd-review-synthesizer.md` and `gsd-research-synthesizer.md`. No new tooling needed -- the agent framework is already built. [Source: `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md`]
- **`gsd-tools.cjs` for file I/O:** Orchestrator reads all scan artifacts and project context files, passes contents to the synthesis agent. Same separation used in landscape-scan. [Source: landscape-scan FEATURE.md TC-01, TC-02]
- **Node.js `fs` built-in:** For reading scan artifacts and writing RECOMMENDATIONS.md. Already used throughout the project.

### Canonical Patterns

- **Synthesizer agent pattern (GSD-internal):** A single agent receives N specialist outputs, cross-references for agreement/disagreement, assigns severity, resolves conflicts via priority ordering, and produces a single consolidated document. Both `gsd-review-synthesizer` (4 reviewer traces -> synthesis.md) and `gsd-research-synthesizer` (6 gatherer outputs -> RESEARCH.md) implement this. The coherence-report synthesizer is a third instance: scan artifacts -> RECOMMENDATIONS.md. Key structural elements to replicate: (a) quality gate on inputs, (b) cross-referencing pass, (c) severity assignment, (d) conflict surfacing, (e) ordered output. [Source: `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md`, `/Users/philliphall/get-shit-done-pe/agents/gsd-research-synthesizer.md`]

- **Severity-tier ordering (SonarQube model):** Present findings highest-severity-first. Within same severity, order by goal alignment (blocks > risks > irrelevant), then by downstream dependency count. This is how SonarQube orders its issue lists and how `gsd-review-synthesizer` orders its findings (blockers first, then major, then minor). The resolution sequence in RECOMMENDATIONS.md should follow this same ordering. [Source: SonarQube metrics](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition); `/Users/philliphall/get-shit-done-pe/agents/gsd-review-synthesizer.md`]

- **Three-bucket triage (decision/informational/auto-resolve):** For each resolution item, categorize by the amount of human judgment required. Decision items go to Q&A for discussion. Informational items are presented but don't require a response. Auto-resolve items get a recommended action and confidence level; refinement-qa confirms them in batch rather than one-by-one. This mirrors GitHub's agentic triage model (categorize -> label -> route) adapted for a human-in-the-loop Q&A session rather than CI automation. [Source: GitHub Agentics triage](https://github.github.com/gh-aw/blog/2026-01-13-meet-the-workflows/); FEATURE.md FN-03]

- **Root cause clustering via causal prompting:** Instead of algorithmic clustering, instruct the synthesis agent to group findings by asking "what shared cause would produce these co-occurring symptoms?" This is the fishbone method operationalized as a prompt pattern. The agent receives all finding cards and looks for: (a) findings affecting the same capabilities, (b) findings of the same type across different capabilities, (c) findings that form causal chains (A causes B). Each cluster becomes a root cause entry in RECOMMENDATIONS.md with pointers to its symptom finding IDs. [Source: fishbone/5-Whys methodology](https://easyrca.com/blog/root-cause-and-effect-analysis-5-whys-vs-fishbone/); [First principles: Claude's reasoning is better at semantic causal clustering than any hash-based algorithm for <50 findings]
