---
lens: plan
secondary_lens: null
subject: requirements-refinement/coherence-report
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** requirements-refinement/coherence-report
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Categorical scoring is correct; numeric scoring is an anti-pattern

TC-02's decision to use blocks/risks/irrelevant (not numeric scores) is independently validated. LLMs produce unstable numeric scores across trials, and WSJF/RICE-style scoring requires human-judged dimensions that don't exist in an automated synthesis pass. Any confidence levels in Q&A agenda items should also be categorical.

[Sources: Domain Truth, Prior Art, Tech Constraints]

### Single-pass synthesis is viable but carries known quality risks

The context budget for the current project is ~60-120KB (~7-15% of the ~800KB window). Even a 20-cap project stays viable (~20-27%). However, single-pass means no self-correction -- errors in root cause groupings propagate to resolution sequence and Q&A agenda. Hallucinations cluster toward the end of generated output, meaning the resolution sequence (section 5) and contradictions (section 6) are the least reliable sections. The existing GSD review-synthesizer proves single-pass consolidation works at similar complexity.

[Sources: Domain Truth, Tech Constraints, Edge Cases, Prior Art]

### Agent must follow existing GSD synthesizer pattern (role_type: judge)

The coherence synthesizer is the third instance of an established GSD pattern: N specialist outputs -> single consolidated document. Both gsd-review-synthesizer and gsd-research-synthesizer demonstrate: quality gate on inputs, cross-referencing pass, severity assignment, conflict surfacing, ordered output. The agent must use `role_type: judge` to inherit opus-level model.

[Sources: Existing System, Prior Art, Tech Constraints]

### Root cause grouping requires explicit causal clustering instructions

Without explicit prompting for causal reasoning, LLMs default to topic-level grouping (semantic similarity), producing ~10x more "root causes" than proper causal clustering. The agent prompt must instruct the model to ask "what shared cause would produce these co-occurring symptoms?" rather than "which findings are about similar topics." Fishbone/5-Whys methodology operationalized as a prompt pattern.

[Sources: Domain Truth, Prior Art, Edge Cases]

### Q&A agenda format is an implicit contract with refinement-qa -- needs explicit structure

refinement-qa FN-01 programmatically parses the Q&A agenda section from RECOMMENDATIONS.md. No schema or formal format exists. The format must be machine-parseable, not just prose. Both features must agree on: section heading, item categories (decision/informational/auto-resolve), item fields (what to discuss, recommended resolution, confidence level). Ambiguous items should default to "decision" (safest).

[Sources: User Intent, Tech Constraints, Edge Cases, Prior Art]

### Zero-findings case must be structurally enforced, not left to LLM judgment

LLMs generate plausible synthesis about non-existent issues 44-79% of the time. The zero-findings path must be enforced by the orchestrator (detect empty findings directory, adjust prompt accordingly). The agent still runs but receives explicit instructions to produce a clean bill of health with shortened sections.

[Sources: Domain Truth, Edge Cases, User Intent]

### Orchestrator handles all file I/O; agent receives contents not paths

Established pattern across landscape-scan and gather-synthesize. The orchestrator must read all scan artifacts + project context + capability files and inject them as XML blocks into the agent prompt. The agent performs no disk reads or writes.

[Sources: Existing System, Tech Constraints, User Intent]

### Contradiction detection will systematically under-report

LLMs are high-precision but low-recall on contradiction detection (~71% accuracy overall, ~45% for conditional/self-contradictions). The Q&A agenda's "decision items" bucket will be smaller than warranted. refinement-qa should be designed to probe for additional contradictions beyond what RECOMMENDATIONS.md surfaces.

[Sources: Domain Truth, Edge Cases]

### Wave 1 execution is a build-order dependency, not a design blocker

Both refinement-write and landscape-scan outputs (scan.cjs, scan artifacts) are planned but unbuilt. coherence-report planning can proceed against specified contracts. Implementation is sequenced after Wave 1 in the capability feature table.

[Sources: Existing System, Tech Constraints]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Pipeline invariant #5 vs TC-01 "contents not paths"

**Edge Cases says:** Passing all contents to the agent violates pipeline invariant #5 ("Context Loading Via Paths Not Content") and risks exhausting the orchestrator's context. Suggests letting the agent read files itself (gets fresh 200K window).

**Existing System / Tech Constraints say:** TC-01 explicitly requires "agent receives contents, not paths" and "no file I/O in agent." The gather-synthesize pattern already does content injection successfully.

**Resolution:** TC-01 wins. The content injection pattern is proven in GSD and the measured context sizes (~60-120KB for current project) are well within limits. Pipeline invariant #5 exists to prevent bloating orchestrator context, but the coherence-report orchestrator's job is specifically to assemble and pass context -- it doesn't need to retain context after spawning the agent. Document this as an intentional exception to invariant #5, same as landscape-scan already does.

### Section ordering: put critical sections first vs fixed 1-7 order

**Domain Truth says:** Hallucinations cluster toward output end. Resolution sequence and contradictions (sections 5-6) are the most actionable but least reliable. Suggests reordering to put contradictions first.

**User Intent says:** Section ordering is fixed (1-7). refinement-qa expects Q&A agenda as the "final section."

**Resolution:** Keep the fixed section ordering. The refinement-qa parsing contract depends on it. Mitigate end-of-output degradation through agent prompt design: instruct the agent to reason about contradictions and resolution ordering BEFORE writing the output, then serialize into the fixed section order. This separates reasoning order from output order.

### Zero-findings: agent produces report vs orchestrator short-circuits

**Domain Truth says:** LLMs will fabricate issues from context alone; structurally skip synthesis if finding_count == 0.

**Existing System / User Intent say:** FN-02 specifies zero-findings must still produce full RECOMMENDATIONS.md with coherence assessment. The agent should receive empty findings context and produce the clean report.

**Resolution:** Hybrid. The orchestrator detects zero findings and passes a modified prompt that explicitly instructs: "No findings were detected. Produce a clean bill of health. Do NOT invent issues." The agent still runs (producing the coherence assessment) but with guardrails against hallucination.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **"Confidence level" field in Q&A agenda items is undefined** -- no categorical scale provided anywhere in the spec. Could mean recommendation confidence, finding confidence, or resolution confidence. Single-source ambiguity flagged by User Intent only. The plan must define this explicitly. [Source: User Intent]

- **Orchestrator workflow location (standalone vs stage in parent workflow)** -- no technical constraint differentiates the options. Both patterns exist in GSD. This is an architectural decision for the planner, not a research finding. [Source: Tech Constraints]

- **Output token cap (~32K) could truncate large reports** -- flagged by Edge Cases only. For <30 findings this is unlikely to hit, but no mitigation exists in the spec. [Source: Edge Cases]

### Unanswered Questions

- What categorical scale should "confidence level" use for Q&A agenda items? (Options: high/medium/low matching finding severity pattern, or a custom scale)
- Should contradictory finding pairs be excluded from the resolution sequence and deferred entirely to Q&A, or included with caveats?
- Does the orchestrator need to validate RECOMMENDATIONS.md structure (correct sections, valid finding ID references) before writing, or is that unnecessary complexity for an opus-level agent?

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Zero runtime dependencies (only js-yaml available) | Tech Constraints, Existing System | No templating engines, markdown parsers, or NLP libraries. All markdown assembled via string concatenation. |
| CommonJS module system (.cjs extension, require/module.exports) | Existing System, Tech Constraints | Any new module must follow this pattern. |
| Agent role_type must be `judge` (maps to inherit/opus) | Existing System, Tech Constraints | Using `executor` (sonnet) would produce inferior synthesis quality. |
| Single Claude invocation for full report (FN-02) | User Intent, Tech Constraints, Prior Art | No staged pipeline, no iterative refinement within this feature. |
| Agent receives contents not paths (TC-01) | User Intent, Existing System, Tech Constraints | Orchestrator must read and assemble all files before spawning agent. |
| RECOMMENDATIONS.md written to `.planning/refinement/` | Existing System, User Intent | Consumer contract for refinement-qa and refinement-artifact. |
| Q&A agenda must be the final section of RECOMMENDATIONS.md | User Intent, Edge Cases | refinement-qa parses this as "final section." |
| Goal alignment skipped when PROJECT.md has no validated requirements | User Intent, Edge Cases | Must not hallucinate goal alignment against nonexistent requirements. |
| 50KB Bash buffer limit (output() uses @file: fallback) | Existing System, Tech Constraints | Orchestrator must handle @file: prefix when reading CLI output. |
| Section ordering fixed (exec summary, root causes, systemic patterns, goal alignment, resolution sequence, contradictions, Q&A agenda) | User Intent | refinement-qa depends on this structure. |
| Finding card root_cause field may be null | Existing System | Synthesis must handle findings without root_cause (landscape-scan consolidation may not have run). |
| refinement-write route does not yet exist | Existing System, Tech Constraints | Plan must account for Wave 1 build-order dependency or define alternative write mechanism. |

## Recommended Scope

Actionable guidance for the planner: what to build, what to skip, what needs more investigation.

### Build (In Scope)

- **Agent definition file (`agents/gsd-coherence-synthesizer.md`)** -- follows proven synthesizer pattern from review-synthesizer and research-synthesizer. Must include: explicit causal clustering instructions, categorical goal alignment logic, zero-findings guardrails, fixed section ordering, and Q&A agenda format spec. [Sources: Prior Art, Domain Truth, Existing System]

- **Orchestration workflow** -- loads scan artifacts (matrix.md, dependency-graph.md, findings/*.md) + project context (PROJECT.md, STATE.md, ROADMAP.md) + all CAPABILITY.md files via existing utility functions (safeReadFile, extractFrontmatter, cmdCapabilityList). Assembles into XML blocks. Spawns single agent invocation. Writes output via refinement-write. [Sources: Existing System, Tech Constraints, User Intent]

- **Input validation in orchestrator** -- quality gate pattern from research-synthesizer: verify .planning/refinement/ exists, verify matrix.md and findings/ are present, count findings, detect zero-findings case. Validate finding card schema (type, severity required). Abort with clear error if scan artifacts missing. [Sources: Edge Cases, Existing System, Domain Truth]

- **Q&A agenda format contract** -- define explicit parseable structure: markdown table or structured list with columns for category (decision/informational/auto-resolve), topic, recommended resolution, confidence (high/medium/low). This is a shared contract with refinement-qa. [Sources: User Intent, Tech Constraints, Edge Cases]

- **Zero-findings path** -- orchestrator detects empty findings, modifies agent prompt to produce clean bill of health with explicit "do not invent issues" instruction. Shortened sections (root causes: none, patterns: none, etc.). [Sources: Domain Truth, Edge Cases, User Intent]

### Skip (Out of Scope)

- **Multi-pass synthesis pipeline** -- contradicts FN-02 single-invocation constraint, adds orchestration complexity, and GSD review-synthesizer proves single-pass works. [Source: Prior Art]

- **Numeric scoring / WSJF / RICE prioritization** -- false precision for natural-language coherence findings. Spec already decided categorical. [Sources: Prior Art, Domain Truth]

- **Output validation of RECOMMENDATIONS.md structure** -- an opus-level agent following explicit section ordering instructions will produce correct structure. Adding a validation pass means either a second invocation (violates FN-02) or regex-based section checking (brittle, low value). Accept the risk. [First principles: YAGNI for v1]

- **Context truncation / summarization for large projects** -- current project and reasonable growth (up to 20 caps) fit comfortably within context limits. Premature to build summarization for the 50+ cap case that may never occur. [Sources: Tech Constraints]

- **Formal knowledge graph for findings** -- overkill for <50 findings with zero-dep constraint. Flat markdown with cross-references (root cause ID -> finding IDs) is sufficient. [Source: Prior Art]

### Investigate Further

- **Q&A agenda "confidence level" definition** -- must be decided before planning. Recommend: categorical high/medium/low, where high = clear single resolution, medium = resolution is likely correct but has tradeoffs, low = multiple viable options or insufficient data. [Source: User Intent]

- **Contradictions in resolution sequence** -- should contradictory pairs be excluded from the resolution sequence and deferred to Q&A, or included with caveats? Recommend: exclude from resolution sequence, reference in contradictions section, route to Q&A as decision items. [Source: Edge Cases]

- **refinement-write dependency** -- if Wave 1 hasn't executed by coherence-report build time, the plan needs a fallback write mechanism (direct fs.writeFileSync in orchestrator, later replaced by refinement-write). [Sources: Existing System, Tech Constraints]
