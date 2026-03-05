# Quality Trace: coherence-report

**Reviewer:** Quality (Code Quality Judge)
**Artifacts:** `get-shit-done/workflows/coherence-report.md`, `agents/gsd-coherence-synthesizer.md`
**Requirements:** EU-01, FN-01, FN-02, FN-03, TC-01, TC-02

---

## Phase 1: Quality Standards

Evaluating two markdown-based prompt artifacts (orchestrator workflow + stateless agent definition) within a meta-prompting framework. Principles under evaluation:

- **DRY:** No redundant specification between orchestrator and agent
- **KISS:** Minimal orchestration steps; no unnecessary indirection
- **Earned Abstractions:** Each structural element must serve the pipeline
- **Interface Contracts:** Orchestrator-agent boundary must be clean; downstream (refinement-qa) parsing contract must be unambiguous
- **Robustness:** Error paths explicitly handled; graceful degradation for optional inputs
- **Pattern Consistency:** Must follow established GSD workflow/agent patterns (landscape-scan, gather-synthesize, review-synthesizer)

---

## Phase 2: Trace Against Code

### Finding 1: Clean orchestrator-agent separation

**Category:** Unnecessary Abstraction

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:5` -- `tools: []`
- `agents/gsd-coherence-synthesizer.md:12` -- `You do NOT read files, write files, or use any tools.`
- `get-shit-done/workflows/coherence-report.md:97-105` -- orchestrator handles spawn and capture, agent receives contents
- Reasoning: The two-file split (orchestrator + zero-tools agent) is an earned abstraction. The orchestrator handles all I/O (7 steps of file reads, CLI calls, writes). The agent is a pure reasoning pass. This matches the established pattern (gather-synthesize.md + research-synthesizer, review workflow + review-synthesizer). The separation keeps the agent definition reusable and testable without file system dependencies.

---

### Finding 2: Redundant root-cause clustering between landscape-scan and coherence-synthesizer

**Category:** DRY

**Verdict:** suspected regression

**Evidence:**
- `get-shit-done/workflows/landscape-scan.md:111-118` -- consolidation step performs root-cause grouping: `Group N symptoms into M root causes (M <= N)... assign ROOT-{NNN}, list the symptom FINDING IDs`
- `agents/gsd-coherence-synthesizer.md:38-41` -- Step 2 Causal Clustering performs the same operation: `For each cluster of 2+ findings: ask "what shared CAUSE would produce these co-occurring symptoms?"... Assign ROOT-{NNN} IDs.`
- Reasoning: Both landscape-scan consolidation and coherence-synthesizer perform root-cause grouping with ROOT-{NNN} ID assignment. landscape-scan even writes `root_cause: ROOT-{NNN}` into finding frontmatter. The coherence-synthesizer then re-derives root causes from the same findings. This is either intentional (synthesizer refines/overrides scan's grouping with project context) or a DRY violation. The agent does not reference the scan's existing root_cause field or explain why it re-derives. If the scan's grouping is disposable, the scan should not produce it; if the agent is meant to refine it, the agent should acknowledge the prior grouping.

---

### Finding 3: Completion message lists static section names

**Category:** KISS

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/coherence-report.md:133-141` -- completion step hardcodes all 7 section names
- Reasoning: While this duplicates the section list from the agent's output format, the completion message serves a different purpose (user confirmation of what was generated). The 7-section ordering is a contract with refinement-qa; echoing it at completion is cheap confirmation, not a maintenance burden. Acceptable.

---

### Finding 4: Agent contradiction detection instruction includes statistical claim

**Category:** Idiomatic Violation

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:45` -- `LLMs systematically under-detect contradictions (~45% recall). Explicitly enumerate comparisons.`
- Reasoning: This calibration instruction is intentional prompt engineering, not a stray comment. The ~45% recall figure motivates the explicit enumeration instruction. It serves the goal of robust contradiction detection. Whether the number is precisely correct matters less than the behavioral instruction it justifies (explicit pairwise comparison). This is an earned prompt design choice.

---

### Finding 5: No explicit handling for ROADMAP.md or STATE.md missing

**Category:** Robustness

**Verdict:** not met

**Evidence:**
- `get-shit-done/workflows/coherence-report.md:46` -- `Read .planning/PROJECT.md (if exists; handle gracefully if missing)`
- `get-shit-done/workflows/coherence-report.md:47-48` -- `Read .planning/ROADMAP.md` and `Read .planning/STATE.md` with no "if exists" qualifier
- Reasoning: PROJECT.md gets explicit "if exists" handling, but ROADMAP.md and STATE.md do not. The workflow assumes these always exist. If either is missing (e.g., a project in early setup), the orchestrator has no graceful fallback. Compare to the PROJECT.md handling on the same step which explicitly addresses the missing case. This inconsistency is a minor robustness gap -- either all three should have graceful handling or the workflow should validate their existence in step 1.

---

### Finding 6: Workflow does not follow gather-synthesize pattern

**Category:** Unnecessary Abstraction

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/gather-synthesize.md:1-2` -- reusable pattern for `N gatherer agents in parallel, then one synthesizer agent`
- `get-shit-done/workflows/coherence-report.md` -- bespoke orchestrator with no gatherers, just one agent spawn
- Reasoning: gather-synthesize is designed for parallel-gather-then-synthesize flows. coherence-report has zero gatherers -- it loads pre-existing scan artifacts and passes them to a single agent. Using gather-synthesize here would add structural overhead (empty gatherer array, manifest handling, abort thresholds) for zero benefit. The bespoke workflow is simpler and correct. Not a violation.

---

### Finding 7: Agent frontmatter pattern inconsistency with peer agents

**Category:** Idiomatic Violation

**Verdict:** not met (minor)

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:5-7` -- `tools: []`, `reads: []`, `writes: []`
- `agents/gsd-research-synthesizer.md:5-7` -- `tools: Read, Write, Bash, Grep, Glob`, `reads: [research-gatherer-outputs, ...]`, `writes: [research-synthesis]`
- `agents/gsd-review-synthesizer.md:5-7` -- `tools: Read, Write, Bash, Grep, Glob`, `reads: [review-trace-reports, ...]`, `writes: [review-synthesis]`
- Reasoning: The coherence-synthesizer is the only synthesizer-pattern agent with empty tools/reads/writes. This is intentionally correct (it receives all context in-prompt and outputs text), but breaks the pattern of other synthesizer agents. The research and review synthesizers read files themselves. This divergence is justified by the design (TC-01 mandates zero file I/O), but creates a pattern inconsistency within the `gsd-*-synthesizer` family. A reader seeing three synthesizer agents with different tool access may be confused about the intended pattern. Minor -- the agent's Role section clarifies the constraint.

---

### Finding 8: Temp file for refinement-write is underspecified

**Category:** Robustness

**Verdict:** not met (minor)

**Evidence:**
- `get-shit-done/workflows/coherence-report.md:110-111` -- `Write agent output to a temp file` followed by `node ... refinement-write ... --content-file {temp_path}`
- Reasoning: The workflow says "write to a temp file" and "clean up temp file" but does not specify where to create it, what to name it, or how to handle cleanup on failure. Compare to change-application.md which also uses temp files but specifies the cleanup path. In a prompt-based workflow this is acceptable (the executing Claude will figure it out), but if the refinement-write call fails and the fallback triggers, the temp file may be orphaned. Minor since Claude's execution context handles this implicitly.

---

### Finding 9: Q&A Agenda contract is well-specified for downstream parsing

**Category:** Earned Abstractions

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:98-104` -- table format with explicit columns: `# | Category | Topic | Recommended Resolution | Confidence`
- `agents/gsd-coherence-synthesizer.md:106-110` -- Category definitions: `decision`, `informational`, `auto-resolve`
- `agents/gsd-coherence-synthesizer.md:113-115` -- Confidence definitions: `HIGH`, `MEDIUM`, `LOW`
- `get-shit-done/workflows/refinement-qa.md:22-29` -- downstream consumer parses this exact table format
- Reasoning: The Q&A Agenda is a shared contract between coherence-synthesizer (producer) and refinement-qa (consumer). Both sides specify the same table structure, column names, and category/confidence vocabularies. The contract is explicit and machine-parseable. This is a well-earned interface specification.

---

### Finding 10: Goal alignment skip condition is correctly propagated

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `agents/gsd-coherence-synthesizer.md:49` -- `If no validated requirements exist: SKIP goal alignment entirely.`
- `agents/gsd-coherence-synthesizer.md:86` -- `(Skip this section entirely if no validated requirements in PROJECT.md)`
- `get-shit-done/workflows/coherence-report.md:46` -- `Read .planning/PROJECT.md (if exists; handle gracefully if missing)`
- Reasoning: The chain is: orchestrator handles missing PROJECT.md gracefully -> agent receives empty or absent project context -> agent skips goal alignment section. TC-02 requirement for categorical-only alignment with skip-when-no-requirements is properly implemented across both artifacts.

---

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | Clean orchestrator-agent separation | Unnecessary Abstraction | met |
| 2 | Redundant root-cause clustering (scan vs. synthesizer) | DRY | suspected regression |
| 3 | Completion message lists static section names | KISS | met |
| 4 | Statistical claim in contradiction instruction | Idiomatic Violation | met |
| 5 | Missing graceful handling for ROADMAP.md/STATE.md | Robustness | not met |
| 6 | Correctly avoids gather-synthesize pattern | Unnecessary Abstraction | met |
| 7 | Synthesizer frontmatter diverges from peer agents | Idiomatic Violation | not met (minor) |
| 8 | Temp file creation underspecified | Robustness | not met (minor) |
| 9 | Q&A Agenda downstream contract well-specified | Earned Abstractions | met |
| 10 | Goal alignment skip condition properly propagated | Robustness | met |

**Key concern:** Finding 2 (DRY -- redundant root-cause clustering) is the only item that warrants investigation. landscape-scan's consolidation step and coherence-synthesizer's causal clustering step perform overlapping work. The relationship between these two passes should be clarified: does the synthesizer refine the scan's grouping, or re-derive from scratch?

**Overall assessment:** The two artifacts are well-structured, follow established patterns appropriately, and maintain clean separation of concerns. The orchestrator-agent boundary is correct. The downstream contract with refinement-qa is explicit and parseable. Minor robustness gaps exist but do not threaten functional integrity.
