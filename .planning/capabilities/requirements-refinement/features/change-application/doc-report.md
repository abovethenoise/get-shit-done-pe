---
type: doc-report
feature: requirements-refinement/change-application
date: 2026-03-05
explorer_manifest:
  code-comments: success
  module-flow-docs: success
  standards-decisions: success
  project-config: success
  friction-reduction: success
---

## Code Comments

### Recommendation: Add docstring to cmdChangesetParse explaining round-trip format

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: The `cmdChangesetParse` function (line 535) has a one-line JSDoc ("Parse CHANGESET.md and return JSON for change-application consumption") but does not document the output shape (`{ meta, entries }`) or the entry fields. Add parameter/return documentation showing the `meta` object keys (`date`, `status`, `source`, `total`, `counts`) and `entries[]` shape (`id`, `topic`, `type`, `source`, `capabilities`, `action`, `reasoning`). This is the primary interface between refinement-qa and change-application.
- **why**: This function is the contract boundary between two pipeline stages. Its output shape is consumed by the change-application workflow, and any field changes would break downstream. Documenting the shape here prevents drift.
- **priority**: medium

### Recommendation: Document guardPath conditional usage caveat in cmdRefinementReport

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: At lines 277-298, three sites call `guardPath` conditionally (`if (value) guardPath(...)`) unlike all other call sites which call it unconditionally. Add an inline comment at the first site explaining why the conditional wrapper exists (these flags are optional, unlike the mandatory flags elsewhere) and noting the known gap: if a flag is present but its value is missing, execution falls through to a misleading error. Reference CODE-QUALITY-REVIEW Finding 1.
- **why**: Code quality review flagged this as a suspected regression. An inline comment prevents future developers from "fixing" the conditional calls without understanding the optional-flag context, and documents the known misleading-error edge case.
- **priority**: low

## Module & Flow Docs

### Recommendation: Create module doc for change-application workflow

- **target_file**: .documentation/modules/change-application-workflow.md
- **what_to_change**: Create a new module doc following the pattern established by `landscape-scan-workflow.md`. Should cover: Purpose (apply confirmed changes from CHANGESET.md), Exports (CLI commands invoked: changeset-parse, capability-create, feature-create; tools used: Read, Edit, AskUserQuestion), Depends-on (gsd-tools.cjs changeset-parse route, refinement.cjs cmdChangesetParse, capability/feature create routes), Constraints (single EXECUTION-LOG.md write at end, no mutation classification or topological sort, CLI positional args for creates, direct edits for everything else).
- **why**: Every other pipeline workflow (landscape-scan) has a module doc. change-application is the fourth stage of a five-stage pipeline and has a non-trivial interface (mixed CLI + direct-edit approach). Without documentation, the "why not classify mutations?" decision will be re-asked.
- **priority**: high

### Recommendation: Create flow doc for change-application pipeline stage

- **target_file**: .documentation/flows/requirements-refinement/change-application.md
- **what_to_change**: Create a flow doc following the pattern in `flows/requirements-refinement/landscape-scan.md`. Document: Trigger (invoked after refinement-qa completes CHANGESET.md), Input (CHANGESET.md via changeset-parse), Steps (parse -> split actionable/logged -> apply each -> failure handler -> write EXECUTION-LOG.md), Output (EXECUTION-LOG.md with per-entry results), Side-effects (creates capabilities/features via CLI, modifies CAPABILITY.md/FEATURE.md files via Edit). Include the checkpoint-less design rationale (no resume needed -- changes are small and fast, unlike the long-running landscape-scan).
- **why**: Flow docs exist for landscape-scan. As subsequent pipeline stages ship, maintaining the same doc pattern ensures the full pipeline is navigable. The enhance lens calls for documenting what changed: this stage was simplified from 9 requirements to 4, dropping mutation classification, topological sort, WAL, and idempotency pre-checks.
- **priority**: high

### Recommendation: Update capability doc with change-application key patterns

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: The "Key Patterns" section currently lists patterns from landscape-scan only (sequential pair analysis, checkpoint resumability, agent-receives-content, skip-not-halt). Add a pattern entry for change-application: "CLI routes for creates, direct edits for everything else" -- this is the core architectural decision that drove the simplification from 9 to 4 requirements. Also note the EXECUTION-LOG.md output (not DELTA.md) to prevent confusion with refinement-artifact's delta output.
- **why**: The capability doc is the entry point for understanding the pipeline. It currently omits change-application patterns entirely, which will cause confusion when refinement-artifact ships and references EXECUTION-LOG.md.
- **priority**: medium

## Standards & Decisions

### Recommendation: Codify the simplification decision rationale

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: Add a decision record or expand Key Patterns to document the user-directed simplification: change-application was initially designed with 7 mutation types, topological sort, WAL, and idempotency pre-checks. User escalation identified this as over-engineering for markdown file edits. The feature was reduced to 4 requirements (EU-01, EU-02, FN-01, TC-01). This establishes a precedent: "when the domain is low-risk (markdown docs), favor simple sequential application over defensive patterns."
- **why**: This was a significant architectural decision with broader implications. Future features in GSD that operate on markdown artifacts should follow this precedent rather than re-discovering it. The review-decisions.md captures the user's direction but it is buried in planning artifacts, not in the living documentation.
- **priority**: medium

### Recommendation: Document positional-args-only CLI convention

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: Add to Key Patterns: "gsd-tools CLI routes use positional args (not flags) for required parameters. Only --raw and --cwd are flag-based." This convention was enforced by the blocker fix in change-application (CLI syntax bug where flag-based invocation produced wrong slugs). The convention is implicit in gsd-tools.cjs arg parsing but not documented anywhere.
- **why**: The blocker finding proved this convention matters -- flag-style invocation silently produces wrong results. Documenting it prevents the same bug in future workflows that invoke CLI routes.
- **priority**: high

## Project Config

*No recommendations identified.*

No CLAUDE.md exists at project root. The global ~/.claude/CLAUDE.md contains GSD instructions but nothing specific to change-application or requirements-refinement CLI conventions. No config drift detected.

## Friction Reduction

### Recommendation: Add a changeset-parse dry-run validation step to refinement-qa handoff

- **target_file**: get-shit-done/workflows/refinement-qa.md
- **what_to_change**: At the end of refinement-qa (after writing CHANGESET.md), add a validation step that runs `changeset-parse --raw` and checks for errors. This catches malformed CHANGESET.md before the user moves to change-application, rather than failing at the start of change-application with a parse error.
- **why**: The change-application workflow's first step is parsing CHANGESET.md. If the file is malformed (e.g., missing frontmatter, wrong entry format), the user gets an opaque error and has to debug. Validating at the writer side is cheaper than diagnosing at the consumer side.
- **priority**: low

## Impact Flags

- `.documentation/capabilities/requirements-refinement.md`: Key Patterns section needs change-application patterns added; positional-args convention and simplification decision rationale should be documented here.
- `.documentation/flows/requirements-refinement/landscape-scan.md`: Reference file for flow doc pattern -- new change-application flow doc should follow this structure.
- `.documentation/modules/landscape-scan-workflow.md`: Reference file for module doc pattern -- new change-application module doc should follow this structure.
