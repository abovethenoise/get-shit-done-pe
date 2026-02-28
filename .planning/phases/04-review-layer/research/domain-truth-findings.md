# Domain Truth Findings: Phase 4 — Review Layer

**Researched:** 2026-02-28
**Dimension:** RSRCH-01 — First-principles analysis
**Confidence:** HIGH (research literature + first-principles reasoning grounded in prior GSD domain research)
**Requirements addressed:** REVW-01 through REVW-08

---

## First Principles

- **FP-1: A reviewer that generates its own evidence is not a reviewer — it is an author grading its own work.** The review layer's credibility depends entirely on tracing findings back to artifacts that exist independently of the reviewer. Every verdict must cite file:line, quote the relevant code, and explain the reasoning chain. A verdict without evidence is indistinguishable from hallucination. Research confirms LLM code review tools generate incorrect findings at rates of 29-45% when not grounded in verifiable artifacts. [Source: [LLM Hallucinations in AI Code Review — diffray](https://diffray.ai/blog/llm-hallucinations-code-review/)] [Connects to: REVW-02, REVW-03, REVW-04, REVW-05, REVW-06 — every reviewer must produce evidence-backed trace reports]

- **FP-2: Parallel reviewers must be context-isolated to prevent anchoring bias.** When one reviewer's findings are visible to another before the second reaches its own conclusions, the second anchors to the first. Multi-agent peer review simulations show that social influence, authority effects, and groupthink cause ~37% variation in final decisions. Parallel execution with no shared state forces independent analysis — the synthesizer sees N independent perspectives, not N perspectives polluted by mutual knowledge. [Source: [AgentReview: Exploring Peer Review Dynamics with LLM Agents — EMNLP 2024](https://arxiv.org/html/2406.12708v2)] [Connects to: REVW-01 — 4 parallel specialist reviewers without context leakage]

- **FP-3: Verdict assignment and severity assignment are fundamentally different cognitive tasks that must not be conflated.** A reviewer determining "did this requirement pass?" is making a binary factual judgment against evidence. A synthesizer determining "how bad is this failure?" requires weighing the finding against all other findings, understanding cross-layer interactions, and applying domain priority. Combining both in a single agent forces it to context-switch between investigation and judgment, degrading both. This mirrors the Executor/Judge separation principle established in Phase 2 domain research. [First principles: investigation (what happened?) and adjudication (how much does it matter?) require different cognitive postures — investigative vs judicial. Conflating them produces anchoring where the investigator biases their own severity assessment based on the difficulty of finding the issue, not its actual impact.]

- **FP-4: Requirement layers partition the review space the way research dimensions partition the epistemic space.** End-user requirements (EU-xx), functional specs (FN-xx), technical specs (TC-xx), and code quality each define a non-overlapping primary concern. A reviewer scoped to one layer asks fundamentally different questions than a reviewer scoped to another. This specialization is not arbitrary — security code review research shows specialists find different classes of issues than generalists, even when generalists have more overall experience. [Source: [An Empirical Study on the Effectiveness of Security Code Review — Berkeley](https://people.eecs.berkeley.edu/~daw/papers/coderev-essos13.pdf)] [Connects to: REVW-01, REVW-03, REVW-04, REVW-05, REVW-06 — each reviewer traces against its own requirement layer]

## Universal Constraints

- **UC-1: LLMs cannot reliably judge code correctness without concrete anchors.** Research on LLM code verification shows requirement conformance recognition rates of only 52-78% when judging code against natural language specifications alone. The implication: reviewer agents must be given the specific requirement text, the specific file:line to inspect, and the specific acceptance criteria — not asked to holistically assess a codebase. The narrower and more concrete the evaluation target, the higher the accuracy. [Source: [Uncovering Systematic Failures of LLMs in Verifying Code Against NL Specifications — arxiv 2508.12358](https://arxiv.org/html/2508.12358v1)] [Connects to: REVW-02 — per-requirement verdicts, not holistic assessments]

- **UC-2: Position bias and presentation order affect LLM judge decisions by 10%+ in accuracy.** When an LLM evaluates multiple items, the order they appear in context affects the verdict. For the synthesizer consolidating 4 reports, this means the report ordering should not systematically favor or disfavor any reviewer. The 04-CONTEXT priority ordering (user > functional > technical > quality) is a tiebreaker mechanism, not a presentation order — the synthesizer should read all 4 reports before applying priority weighting. [Source: [LLM-As-Judge: Best Practices — Monte Carlo Data](https://www.montecarlodata.com/blog-llm-as-judge/)] [Connects to: REVW-07 — synthesizer consolidation must account for position bias]

- **UC-3: More complex prompting increases misjudgment rates in code review evaluation.** Counter-intuitively, adding explanation requirements and correction proposals to LLM code review prompts leads to higher error rates. The implication for reviewer agents: keep the review prompt focused on verdict + evidence. Do NOT ask reviewers to also propose fixes, suggest improvements, or explain alternative approaches — that expands the cognitive task and degrades the primary judgment. [Source: [Rethinking Code Review Workflows with LLM Assistance — arxiv 2505.16339](https://arxiv.org/html/2505.16339v1)] [Connects to: REVW-02 — reviewers report verdicts and findings only, consistent with the 04-CONTEXT decision that reviewers do NOT assign severity]

- **UC-4: Re-review cycles must have hard limits to prevent infinite loops.** Anchoring bias research shows that even after substantial improvements, initial reviewer impressions persist. A reviewer that flagged an issue in round 1 is biased toward re-flagging in round 2 even if the fix is adequate. The 04-CONTEXT decision of max 2 re-review cycles is well-calibrated — enough to catch genuine fix failures, short enough to prevent anchoring-driven rejection spirals. [Source: [How was my performance? Exploring the role of anchoring bias in AI-assisted decision making — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0268401225000076)] [Connects to: REVW-08 — user presentation with bounded re-review]

- **UC-5: Bidirectional traceability is the structural mechanism that makes review verdicts verifiable.** A verdict of "met" or "not met" is only meaningful if an external observer can trace: requirement -> plan task -> executed code -> review finding. Without this chain, the review is an opinion. With it, the review is auditable. This is established practice in safety-critical software (DO-178C, ISO 26262) and applies equally here — the review layer consumes the traceability table produced by Phase 3 planning. [Source: [Requirements Traceability — Parasoft](https://www.parasoft.com/learning-center/iso-26262/requirements-traceability/)] [Connects to: REVW-02, REVW-03, REVW-04, REVW-05 — each reviewer traces against specific REQ IDs through the traceability chain]

## Validated Assumptions

- **VA-1: The 3-level verdict scale (met / not met / regression) is more reliable than graded scales for LLM judges.** LLM-as-judge research consistently shows that binary or near-binary scales produce higher inter-rater agreement than fine-grained scales (1-5 or 1-10). "Partially met" is the most subjective category in any rating system — removing it forces the reviewer to commit to a factual determination. The 04-CONTEXT decision to eliminate "partially met" is validated by the literature on LLM evaluation reliability. Evidence: G-Eval research showed graded scales produce inconsistent results across runs; binary decisions are more stable. [Source: [LLM-as-a-Judge Simply Explained — Confident AI](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)] [Connects to: REVW-02]

- **VA-2: Specialized reviewer agents outperform a single generalist reviewer for finding different classes of issues.** The 04-CONTEXT decision to have 4 specialist reviewers (not 1 general reviewer making 4 passes) is supported by research showing role-prompt diversity and heterogeneous evaluators improve review outcomes. Diversified system roles enable systems to better emulate collective intelligence while surfacing the contributions of specialization to bias mitigation. A single reviewer making multiple passes anchors to its own first-pass findings. [Source: [Multi-Agent Evaluation System — Cognizant AI Lab](https://www.cognizant.com/us/en/ai-lab/blog/ai-scoring-multi-agent-evaluation-system)] [Connects to: REVW-01 — 4 parallel specialist reviewers]

- **VA-3: The synthesizer-as-judge pattern maps directly to established multi-agent consolidation architectures.** The pattern of parallel specialist agents feeding into a single consolidation agent is documented across Google ADK, Anthropic Agent SDK, and academic literature as the canonical approach for multi-perspective evaluation. The synthesizer's role — weigh conflicting evidence, detect cross-layer tensions, apply priority ordering — matches the "judicial" cognitive posture identified in Phase 2 research. [Source: [Developer's guide to multi-agent patterns in ADK — Google](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)] [Connects to: REVW-07]

## Domain Risks

- **DR-1: Regression detection is the hardest review task for LLMs — it requires comparing two states, not evaluating one.** Detecting regressions requires the reviewer to understand both the before-state and the after-state, then determine if the after-state is worse on any dimension not covered by the current requirement set. This is fundamentally harder than checking "does this code meet requirement X?" because the comparison target is implicit (previous behavior) rather than explicit (written requirement). Risk: regression verdicts will have the highest false-negative rate of any verdict type. Mitigation: the 04-CONTEXT decision to distinguish "proven regression" (test fails, removed function) from "suspected regression" (code analysis) is critical — it prevents low-confidence suspicions from being treated as facts. [First principles: evaluating against an explicit spec is one-state reasoning; detecting regressions is two-state reasoning requiring temporal comparison, which is inherently harder for stateless LLM evaluators.]

- **DR-2: Code quality review is the most hallucination-prone reviewer role because its criteria are judgment-based, not specification-based.** EU/FN/TC reviewers have concrete specs to trace against. The code quality reviewer evaluates against principles (DRY, KISS, unnecessary complexity) — these are inherently more subjective and give the LLM more room to fabricate findings. The 04-CONTEXT posture of "prove this complexity is necessary" with the constraint "opinionated about outcomes, NOT preferences" is the right mitigation, but this reviewer will still produce the highest false-positive rate. Risk: noise from the quality reviewer drowns out signal from the specification reviewers. Mitigation: synthesizer severity assignment (not reviewer self-severity) and priority ordering (quality is lowest priority) contain this risk. [First principles: the narrower and more concrete the evaluation criteria, the lower the hallucination rate. Quality criteria are the widest and least concrete of the four review dimensions.]

- **DR-3: The ~1500 token agent budget creates tension with the evidence-citation requirement.** Each reviewer must include its review criteria, the framing-specific questions, AND produce findings with file:line citations and code quotes. If the agent definition consumes 1500 tokens and the requirements context consumes another 1000+, the remaining context budget for actual code reading and evidence production is constrained. Risk: reviewers truncate evidence to fit context limits, producing verdicts that the synthesizer cannot verify. Mitigation: agent definitions must be ruthlessly minimal (role + goal + output format only); requirement text and code content are injected at runtime, not baked into the definition. [First principles: context windows are finite and competitive (Phase 2 Truth 2). Every token in the agent definition displaces a token of actual code the reviewer needs to read.]

- **DR-4: The one-at-a-time finding presentation pattern creates a serial bottleneck in the user decision loop.** If a review surfaces 15 findings and each requires user decision (Accept / Edit / Research / Defer / Dismiss), the user must make 15 sequential decisions. This is faithful to the user-in-the-loop principle but risks decision fatigue. The 04-CONTEXT decision is correct (consistency with Phase 3 Q&A pattern), but the synthesizer should prioritize and order findings so blockers appear first and minor issues appear last — allowing the user to stop when they hit diminishing returns. [First principles: human attention is the scarcest resource in the system. Serial presentation preserves control but must respect cognitive load by front-loading the highest-impact decisions.]

---

## Requirement Coverage Map

| Requirement | Findings | Coverage |
|-------------|----------|----------|
| REVW-01 (4 parallel reviewers) | FP-2, FP-4, VA-2 | Full — parallel isolation and specialization validated |
| REVW-02 (trace reports with verdicts) | FP-1, UC-1, UC-3, VA-1 | Full — evidence-backed verdicts with binary-like scale validated |
| REVW-03 (end-user traces story + acceptance) | FP-1, FP-4, UC-5 | Full — layer-specific tracing grounded in traceability chain |
| REVW-04 (functional traces behavior specs) | FP-1, FP-4, UC-5 | Full — same structural principle as REVW-03 |
| REVW-05 (technical traces implementation specs) | FP-1, FP-4, UC-5 | Full — same structural principle as REVW-03 |
| REVW-06 (code quality traces DRY/KISS/bloat) | FP-4, DR-2 | Covered with risk — judgment-based criteria are hallucination-prone |
| REVW-07 (synthesizer consolidates with priority) | FP-3, UC-2, VA-3 | Full — judicial pattern validated, position bias risk identified |
| REVW-08 (user reviews recommendations) | UC-4, DR-4 | Full — bounded re-review and serial presentation validated with caveats |

---

## Sources

**Research papers:**
- [AgentReview: Exploring Peer Review Dynamics with LLM Agents — EMNLP 2024](https://arxiv.org/html/2406.12708v2)
- [Uncovering Systematic Failures of LLMs in Verifying Code Against NL Specifications](https://arxiv.org/html/2508.12358v1)
- [Rethinking Code Review Workflows with LLM Assistance](https://arxiv.org/html/2505.16339v1)
- [An Empirical Study on the Effectiveness of Security Code Review — Berkeley](https://people.eecs.berkeley.edu/~daw/papers/coderev-essos13.pdf)
- [Anchoring Bias in AI-assisted Decision Making — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0268401225000076)

**Industry and practitioner sources:**
- [LLM-As-Judge: Best Practices — Monte Carlo Data](https://www.montecarlodata.com/blog-llm-as-judge/)
- [LLM-as-a-Judge Simply Explained — Confident AI](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)
- [LLM Hallucinations in AI Code Review — diffray](https://diffray.ai/blog/llm-hallucinations-code-review/)
- [Multi-Agent Evaluation System — Cognizant AI Lab](https://www.cognizant.com/us/en/ai-lab/blog/ai-scoring-multi-agent-evaluation-system)
- [Developer's guide to multi-agent patterns in ADK — Google](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [Requirements Traceability — Parasoft](https://www.parasoft.com/learning-center/iso-26262/requirements-traceability/)

**Prior GSD research:**
- [Phase 2 Domain Truth — `.planning/phases/02-agent-framework/research/DOMAIN-TRUTH.md`] (anchoring bias, parallel gather, Executor/Judge pattern)

---

*Phase: 04-review-layer*
*Dimension: RSRCH-01 (Domain Truth)*
*Research completed: 2026-02-28*
