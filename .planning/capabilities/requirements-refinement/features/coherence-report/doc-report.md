---
type: doc-report
feature: requirements-refinement/coherence-report
date: 2026-03-05
explorer_manifest:
  code-comments: success
  module-flow-docs: success
  standards-decisions: success
  project-config: success
  friction-reduction: success
---

## Code Comments

### Recommendation: Add docstring to coherence-report workflow describing its pipeline position

- **target_file**: get-shit-done/workflows/coherence-report.md
- **what_to_change**: The `<purpose>` block (lines 1-5) describes what the workflow does but does not mention that it is the second stage of a five-stage pipeline or name its upstream (landscape-scan) and downstream (refinement-qa) neighbors. Add a one-line pipeline position note matching the pattern used in landscape-scan's module doc ("Entry point for the requirements-refinement pipeline").
- **why**: Developers reading the workflow in isolation cannot orient themselves in the pipeline without cross-referencing CAPABILITY.md. The upstream workflow (landscape-scan) already documents its downstream consumer.
- **priority**: low

### Recommendation: Document the MODE variable semantics inline

- **target_file**: get-shit-done/workflows/coherence-report.md
- **what_to_change**: At lines 36-38 where MODE is set to "zero-findings" or "normal", add a brief inline comment explaining that the mode flag controls the synthesizer's output template (7-section vs. clean-bill-of-health). Currently the variable is set without context on why the distinction matters.
- **why**: The mode drives a significant behavioral branch in the downstream agent. A reader tracing through the orchestrator should understand the impact without needing to read the full agent definition.
- **priority**: low

### Recommendation: Add parameter documentation to refinement.cjs utility functions

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: The exported utility functions `parseMarkdownTable`, `diffMaps`, `snapshotFindings`, and `snapshotTable` have JSDoc summary lines but lack `@param` and `@returns` annotations. Add typed parameter docs. For example, `snapshotTable(filePath, keyFn)` should document that `keyFn` is `(row: Object) => string|null` and the return type is `Map<string, Object>`.
- **why**: These functions are consumed by multiple CLI commands (refinement-init, refinement-delta, refinement-report). Without parameter docs, callers must read implementation to understand the expected key function signature.
- **priority**: medium

## Module and Flow Docs

### Recommendation: Create module doc for coherence-report workflow

- **target_file**: .documentation/modules/coherence-report-workflow.md
- **what_to_change**: Create a new module doc following the established pattern (see `landscape-scan-workflow.md` for the template). Sections: Purpose [derived], Exports [derived] (inputs, CLI commands invoked, steps, sub-agent delegation, outputs), Depends-on [derived], Constraints [authored]. Key content: single-agent invocation of gsd-coherence-synthesizer, context loading from 4 source categories (scan artifacts, project files, capability definitions, mode flag), output via refinement-write CLI route, fallback to direct write on CLI failure.
- **why**: Every other completed feature in this pipeline (landscape-scan) has a module doc. The coherence-report workflow is a 157-line orchestrator with specific dependencies and a defined interface -- it warrants the same documentation coverage.
- **priority**: high

### Recommendation: Create module doc for gsd-coherence-synthesizer agent

- **target_file**: .documentation/modules/coherence-synthesizer-agent.md
- **what_to_change**: Create a module doc covering: Purpose [derived] (zero-tool judge agent that produces RECOMMENDATIONS.md), Exports [derived] (input XML blocks, 7-section output format, category/confidence definitions), Depends-on [derived] (nothing -- tools:[] by design), Constraints [authored] (zero file I/O per TC-01, section ordering is immutable per refinement-qa parsing contract, categorical goal alignment per TC-02).
- **why**: The agent has a distinct interface contract (7 fixed sections consumed by refinement-qa). The scan-pair template does not have a module doc (it is a template, not an agent), but the coherence-synthesizer is a full agent definition with behavioral constraints worth documenting.
- **priority**: high

### Recommendation: Create flow doc for requirements-refinement/coherence-report

- **target_file**: .documentation/flows/requirements-refinement/coherence-report.md
- **what_to_change**: Create a flow doc following the pattern established by `flows/requirements-refinement/landscape-scan.md`. Sections: Trigger [derived] (invoked after landscape-scan completes), Input [derived] (.planning/refinement/ scan artifacts + project context files), Steps [derived] (6-step flow: validate -> load scan -> load project context -> assemble prompt -> spawn agent -> write output), Output [derived] (.planning/refinement/RECOMMENDATIONS.md), Side-effects [derived] (temp file creation/cleanup in .planning/refinement/.tmp/), WHY [authored] (single-pass synthesis rationale, content-not-paths rationale, zero-findings mode rationale).
- **why**: The landscape-scan flow doc exists. The coherence-report is the next pipeline stage and has the same documentation need. Without a flow doc, the end-to-end pipeline data path has a gap between scan output and Q&A input.
- **priority**: high

### Recommendation: Update capability-level doc with coherence-report details

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: The capability doc lists coherence-report in the pipeline table (line 17) with a one-line description. Now that the feature is implemented, expand the Key Patterns section to include the coherence-report-specific patterns: (1) single-agent synthesis (one invocation, not staged), (2) zero-tool judge agent pattern (tools:[], receives content not paths), (3) graceful degradation for optional project files (PROJECT.md, ROADMAP.md, STATE.md).
- **why**: The capability doc's Key Patterns section currently only covers landscape-scan patterns (sequential pair analysis, checkpoint resumability). As features are completed, the capability doc should reflect the full pipeline's patterns.
- **priority**: medium

## Standards and Decisions

### Recommendation: Codify the zero-tool judge agent pattern

- **target_file**: .documentation/gate/constraints.md
- **what_to_change**: Add a new constraint entry: `## Constraint: zero-tool-judge-agent [manual]` documenting the pattern where an agent has `tools: []`, `reads: []`, `writes: []` and receives all context via prompt. The orchestrator handles all I/O; the agent's output IS the artifact. Reference TC-01 of coherence-report as the originating decision.
- **why**: This is a new architectural pattern in GSD. The `agent-receives-content` constraint covers the general principle, but the zero-tool judge is a stricter specialization (no tools at all, not just no file reads). Future features may need judge agents and should follow this pattern rather than re-deriving it.
- **priority**: medium

### Recommendation: Add glossary entry for RECOMMENDATIONS.md

- **target_file**: .documentation/gate/glossary.md
- **what_to_change**: Add: `## Glossary: recommendations [manual]` -- "Seven-section synthesis document produced by coherence-report. Contains root causes, systemic patterns, goal alignment, resolution sequence, contradictions, and Q&A agenda. Consumed by refinement-qa. Written to `.planning/refinement/RECOMMENDATIONS.md`."
- **why**: The glossary already defines "landscape map," "coherence finding," and "GAP" from the scan stage. RECOMMENDATIONS.md is the primary artifact of the next stage and has a fixed section contract consumed by downstream features.
- **priority**: medium

### Recommendation: Add glossary entry for Q&A agenda categories

- **target_file**: .documentation/gate/glossary.md
- **what_to_change**: Add entries for the three Q&A agenda categories: `decision` (requires user choice), `informational` (clear fix, user should know), `auto-resolve` (obvious fix, no discussion needed). These are defined in `agents/gsd-coherence-synthesizer.md:106-109` and consumed by refinement-qa.
- **why**: These categories form a contract between coherence-report output and refinement-qa input. Codifying them in the glossary prevents drift between producer and consumer definitions.
- **priority**: low

## Project Config

### Recommendation: Add refinement.cjs coherence-report routes to state doc

- **target_file**: .documentation/gate/state.md
- **what_to_change**: The state doc template is empty (contains only the template placeholder). Add a state entry for `.planning/refinement/RECOMMENDATIONS.md`: Type: file, Location: `.planning/refinement/RECOMMENDATIONS.md`, Schema: 7-section markdown (Executive Summary, Root Causes, Systemic Patterns, Goal Alignment, Resolution Sequence, Contradictions, Q&A Agenda), Lifecycle: created by coherence-report, consumed by refinement-qa, overwritten on re-run, Owned-by: coherence-report workflow, Read-by: refinement-qa workflow.
- **why**: RECOMMENDATIONS.md is a stateful artifact with a fixed schema and cross-feature lifecycle. The state doc exists to track exactly this kind of inter-module data contract.
- **priority**: medium

## Friction Reduction

*No recommendations identified.*

The coherence-report workflow is a straightforward orchestrator with a single agent invocation. The CLI routes (refinement-write, refinement-init) already exist and are reused. No repetitive manual steps or automation opportunities were identified beyond what the existing tooling provides.

## Impact Flags

- `.documentation/capabilities/requirements-refinement.md`: Key Patterns section needs expansion for coherence-report patterns
- `.documentation/gate/constraints.md`: New constraint entry for zero-tool judge agent pattern
- `.documentation/gate/glossary.md`: New entries for recommendations artifact and Q&A categories
- `.documentation/gate/state.md`: New state entry for RECOMMENDATIONS.md artifact lifecycle
