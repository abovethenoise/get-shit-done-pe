---
type: doc-report
feature: requirements-refinement/refinement-qa
date: 2026-03-05
explorer_manifest:
  code-comments: success
  module-flow-docs: success
  standards-decisions: success
  project-config: success
  friction-reduction: success
---

## Code Comments

### Recommendation: Add JSDoc for CHANGESET_TYPES and TYPE_ORDER constants

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: Add a brief JSDoc comment above `CHANGESET_TYPES` (line 441) and `TYPE_ORDER` (line 442) explaining the canonical ordering and that these 6 types define the changeset contract between refinement-qa (producer) and change-application (consumer).
- **why**: These constants are the authoritative definition of the changeset entry vocabulary. Downstream consumers (changeset-parse, change-application workflow) depend on this list. A one-line comment prevents someone from casually adding a type without understanding the contract.
- **priority**: medium

### Recommendation: Add parameter docs for cmdChangesetWrite entry validation

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: Expand the JSDoc on `cmdChangesetWrite` (line 447) to document the required shape of each entry in `data.entries`: `{ id, topic, type, capabilities, action, reasoning, source_finding?, severity? }`. Currently the function comment just says "Write CHANGESET.md from JSON input" with no schema hint.
- **why**: The validation block at lines 461-467 enforces required fields but the expected shape is only discoverable by reading the implementation. A parameter note prevents callers from trial-and-error.
- **priority**: medium

### Recommendation: Document severity sort behavior in cmdChangesetWrite

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: Add an inline comment at the sort block (lines 471-476) explaining the two-level sort: primary by TYPE_ORDER, secondary by severity within each type group. Note the SEVERITY_ORDER mapping (critical/high -> 0, major/medium -> 1, minor/low -> 2, info -> 3).
- **why**: The severity sort was added as a review fix (Finding 2). The mapping collapses synonyms (critical=high, major=medium) which is non-obvious. A comment captures the design intent so future changes preserve the behavior.
- **priority**: medium

### Recommendation: Add inline note for source field fallback chain in cmdChangesetWrite

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: At line 517 (`entry.source || entry.source_finding || 'user-initiated'`), add a comment explaining the fallback chain: `source` is the canonical field name, `source_finding` is accepted for backward compatibility, and `'user-initiated'` is the default for USER_INITIATED entries that have no finding reference.
- **why**: This line was the subject of review Finding 1 (major -- field name mismatch). The fix introduced a fallback chain that is load-bearing for the write/parse round-trip. Without a comment, the reasoning behind the chain will be lost.
- **priority**: high

## Module and Flow Docs

### Recommendation: Create module doc for refinement-qa workflow

- **target_file**: .documentation/modules/refinement-qa-workflow.md
- **what_to_change**: Create a new module doc following the established pattern (see landscape-scan-workflow.md). Include: Purpose [derived] (interactive Q&A on coherence findings, produces CHANGESET.md), Exports [derived] (no CLI commands -- workflow prompt only; invokes changeset-write CLI route), Depends-on [derived] (RECOMMENDATIONS.md from coherence-report, finding cards from landscape-scan, changeset-write from refinement.cjs), Steps [derived] (load_and_parse_agenda, zero_findings_check, structured_qa, open_ended_phase, write_final_changeset, completion).
- **why**: landscape-scan has a module doc; refinement-qa does not. This is the middle of the pipeline and the only interactive step -- its interface and dependencies should be documented for maintainability.
- **priority**: high

### Recommendation: Create flow doc for requirements-refinement/refinement-qa

- **target_file**: .documentation/flows/requirements-refinement/refinement-qa.md
- **what_to_change**: Create a new flow doc following the landscape-scan flow doc pattern. Cover: Trigger (invoked after coherence-report produces RECOMMENDATIONS.md), Input (RECOMMENDATIONS.md, FINDING-*.md cards, matrix.md, dependency-graph.md), Steps (agenda parse -> auto-resolve batch -> priority walk with contradiction adjacency -> open-ended phase -> final changeset-write), Output (CHANGESET.md with status:complete), Side-effects (checkpoint writes during session via changeset-write --checkpoint).
- **why**: The flow doc captures the end-to-end data flow through the Q&A step. landscape-scan has one; refinement-qa should match. Critical for understanding the pipeline handoff from coherence-report to change-application.
- **priority**: high

### Recommendation: Add changeset CLI commands to scan-cli module doc or create changeset-cli module doc

- **target_file**: .documentation/modules/scan-cli.md (update) or .documentation/modules/changeset-cli.md (new)
- **what_to_change**: Document the `changeset-write` and `changeset-parse` CLI routes added to gsd-tools.cjs. Include: command signatures, required arguments, JSON input schema for changeset-write, output shape for changeset-parse, checkpoint vs complete mode distinction.
- **why**: scan-cli.md documents the landscape-scan CLI routes. The changeset routes are in the same file (refinement.cjs) and follow the same pattern. They need equivalent documentation for the change-application consumer.
- **priority**: medium

### Recommendation: Update capability doc with refinement-qa details

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: The capability doc lists refinement-qa in the pipeline table with a one-line description. Now that the feature is implemented, expand the "Key Patterns" section to include: AskUserQuestion-based resolution flow, checkpoint resumability via changeset-write --checkpoint, contradiction adjacency reordering, and auto-resolve batching. These are new patterns introduced by this feature.
- **why**: The capability doc serves as the entry point for understanding the pipeline. The current entry for refinement-qa is pre-implementation placeholder text. It should reflect the actual implementation patterns.
- **priority**: medium

## Standards and Decisions

### Recommendation: Codify the changeset contract pattern

- **target_file**: .documentation/capabilities/requirements-refinement.md (Key Patterns section)
- **what_to_change**: Add a key pattern entry: "Producer-consumer contract via CHANGESET.md" -- refinement-qa writes, change-application reads, changeset-parse refuses partial status as a safety gate. This pattern (structured markdown artifact with frontmatter metadata, parseable by a dedicated CLI command, with a status gate) could be reused by other pipeline stages.
- **why**: The changeset write/parse/refuse-partial pattern is a deliberate architectural decision documented only in plan summaries. It belongs in the capability-level patterns section where it can inform future pipeline stages.
- **priority**: medium

### Recommendation: Document the AskUserQuestion resolution pattern

- **target_file**: .documentation/capabilities/requirements-refinement.md (Key Patterns section)
- **what_to_change**: Add a key pattern entry: "Three-option AskUserQuestion resolution" -- each finding gets Accept/Research/Reject options, with follow-up text capture for Research and Reject. This is the first GSD workflow to use AskUserQuestion in a structured loop with typed outcomes. Document the empty-response guard behavior.
- **why**: This interaction pattern (structured options -> follow-up text capture -> typed entry recording) is reusable. If future workflows need interactive resolution loops, they should reference this pattern rather than reinventing it.
- **priority**: low

## Project Config

*No recommendations identified.*

The project has no CLAUDE.md at root level. The global user CLAUDE.md references GSD correctly. No config drift detected between the refinement-qa implementation and existing project configuration.

## Friction Reduction

### Recommendation: Add a slash command or skill for refinement-qa invocation

- **target_file**: get-shit-done/commands/ (new command file, if pattern exists)
- **what_to_change**: Check whether the other pipeline stages (landscape-scan, coherence-report) have slash commands. If so, add one for refinement-qa. If not, this is a pipeline-wide gap to note but not act on for this feature alone.
- **why**: The workflow is a standalone prompt file invoked manually. If the pipeline is meant to be run step-by-step via slash commands, a missing command for the Q&A step creates friction in the middle of the pipeline.
- **priority**: low

### Recommendation: Document the checkpoint-resume pattern for interrupted Q&A sessions

- **target_file**: .documentation/flows/requirements-refinement/refinement-qa.md (when created)
- **what_to_change**: In the flow doc, include a "Recovery" section explaining what happens when a Q&A session is interrupted mid-way: CHANGESET.md exists with status:partial, changeset-parse will refuse it, user must re-run refinement-qa which will overwrite from scratch (no resume from checkpoint). If resume-from-checkpoint is desired in the future, document that the checkpoint writes are currently overwrite-only (not append).
- **why**: The checkpoint mechanism writes to CHANGESET.md but the workflow has no resume-from-checkpoint logic. Users who see a partial CHANGESET.md after an interruption may expect resume behavior. Documenting the actual behavior prevents confusion.
- **priority**: medium

## Impact Flags

- .documentation/capabilities/requirements-refinement.md: Needs update to reflect implemented refinement-qa patterns (currently has pre-implementation placeholder text for this feature)
- .documentation/modules/scan-cli.md: May need update or sibling doc for changeset CLI routes added in the same refinement.cjs module
