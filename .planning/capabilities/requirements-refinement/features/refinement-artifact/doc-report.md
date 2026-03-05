---
type: doc-report
feature: requirements-refinement/refinement-artifact
date: 2026-03-05
explorer_manifest:
  code-comments: success
  module-flow-docs: success
  standards-decisions: success
  project-config: success
  friction-reduction: success
---

## Code Comments

### Recommendation: Add JSDoc parameter/return annotations to helper functions

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: `guardPath`, `clearFindings`, `matrixKeyFn`, and `graphKeyFn` (lines 11-27) are shared helpers extracted during review fixes but lack JSDoc. Add `@param`/`@returns` annotations consistent with the documented utility functions below them (`parseMarkdownTable`, `diffMaps`, `snapshotFindings`, `snapshotTable` all have JSDoc).
- **why**: These four helpers are the DRY extractions from the review cycle. Future maintainers need to know their contracts -- especially `guardPath` which calls `error()` (process-terminating) on failure, a non-obvious side effect.
- **priority**: medium

### Recommendation: Document renderDeltaTable parameters

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: `renderDeltaTable` (line 327) has a one-line JSDoc but no `@param` annotations. Add parameter docs for `heading` (string, section heading), `columns` (string[], column names), `rows` (string[][], row data). Note the empty-heading behavior used by matrix/graph sections.
- **why**: This function's `heading` parameter has special behavior when empty string is passed (renders `### ` with no title). Documenting this prevents confusion.
- **priority**: low

### Recommendation: Add inline comment explaining first-run detection AND condition

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: At line 358, the condition `snapshot.recommendations === null && snapshot.findings.size === 0` uses AND rather than OR. Add a brief inline comment: `// Conservative: only skip delta on true first run (no recommendations AND no findings)`.
- **why**: Both functional and technical reviewers flagged this as stricter than spec language. A comment prevents future developers from "fixing" it to OR.
- **priority**: medium

## Module and Flow Docs

### Recommendation: Create module doc for refinement.cjs

- **target_file**: .documentation/modules/refinement-cli.md
- **what_to_change**: Create a new module doc following the scan-cli.md pattern. Should cover: Purpose (refinement artifact lifecycle CLI), Exports (6 CLI commands + 4 utility functions with route mappings and JSON output shapes), Depends-on (core.cjs). Use `[derived]` tags on Purpose/Exports/Depends-on sections.
- **why**: scan.cjs has a module doc at `.documentation/modules/scan-cli.md`. refinement.cjs is the same pattern (CLI lib module) with 6 exported commands and no module doc. This is the largest new source file in the capability (615 lines).
- **priority**: high

### Recommendation: Create flow doc for refinement-artifact pipeline stage

- **target_file**: .documentation/flows/requirements-refinement/refinement-artifact.md
- **what_to_change**: Create a flow doc describing the refinement-artifact stage in the pipeline. Document the lifecycle: `refinement-init` (snapshot + clear) -> scan writes findings/matrix/graph -> `refinement-report` (aggregate) -> `refinement-delta` (compare to snapshot, write DELTA.md). Include the snapshot-then-clear pattern and first-run skip behavior.
- **why**: landscape-scan has a flow doc at `.documentation/flows/requirements-refinement/landscape-scan.md`. refinement-artifact is a comparable pipeline stage with no flow doc. The init-snapshot-report-delta lifecycle is non-obvious without documentation.
- **priority**: high

### Recommendation: Update capability doc with refinement-artifact role clarification

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: The feature table describes refinement-artifact as "Generate the final refinement report summarizing all changes and decisions." This is inaccurate -- the feature manages directory structure, pre-scan snapshots, report writing, and delta computation. It does not "summarize changes and decisions" (that is coherence-report + refinement-qa). Update the description to: "Manage refinement directory structure, pre-scan snapshots, report file writing, and cross-run delta computation."
- **why**: Current description conflates refinement-artifact with coherence-report. Accurate pipeline-stage descriptions prevent confusion about which feature owns which responsibility.
- **priority**: medium

## Standards and Decisions

### Recommendation: Document snapshot-then-clear pattern

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: Add "Snapshot-then-clear" to the Key Patterns section. Pattern: `cmdRefinementInit` reads existing artifacts into a snapshot object, then clears stale findings before new scan writes. This ensures delta computation has a baseline while preventing orphan findings from accumulating.
- **why**: This pattern is established in refinement-artifact and will apply to any future artifact lifecycle features. It is already listed in 01-SUMMARY.md patterns-established but not in the capability-level documentation.
- **priority**: medium

### Recommendation: Document semantic diffing via Map key functions

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: Add a note under Key Patterns: "Semantic diffing uses `diffMaps` with configurable key functions (`matrixKeyFn`, `graphKeyFn`) rather than textual line-diff. Keys are derived from domain-meaningful columns (first two columns for matrix, From|To for graph). Finding IDs come from filenames."
- **why**: TC-02 explicitly required semantic (not textual) diffing. This architectural decision should be documented at the capability level so downstream features (coherence-report delta, future audit tools) follow the same pattern.
- **priority**: low

## Project Config

### Recommendation: No CLAUDE.md exists; no project-config changes needed

- **target_file**: n/a
- **what_to_change**: No changes. The project has no CLAUDE.md (project-level config is in the user's global `~/.claude/CLAUDE.md`). The refinement-artifact feature does not introduce any new workflow instructions, environment requirements, or tool configurations that would warrant creating one.
- **why**: Checked for CLAUDE.md at project root -- does not exist. No config drift possible.
- **priority**: low

## Friction Reduction

### Recommendation: Add changeset-write and changeset-parse to route documentation

- **target_file**: .documentation/modules/refinement-cli.md (proposed new file)
- **what_to_change**: When creating the refinement-cli module doc (see Module and Flow Docs section), ensure changeset-write and changeset-parse routes are included. These two commands (lines 447-601) are registered in gsd-tools.cjs but were added as part of the refinement-artifact feature to support downstream change-application. Without documentation, prompt authors discovering available CLI routes will miss them.
- **why**: Six routes are registered for refinement.cjs but only four map to refinement-artifact requirements. The two changeset routes serve change-application but live in this module. Documenting all six in one place prevents discovery friction.
- **priority**: medium

### Recommendation: Consolidate CHANGESET_TYPES constant documentation

- **target_file**: get-shit-done/bin/lib/refinement.cjs
- **what_to_change**: The `CHANGESET_TYPES` array (line 441) defines six valid types but their meanings are only discoverable by reading `cmdChangesetWrite` validation logic. Add a brief comment block above the constant listing each type's purpose (e.g., `ACCEPT` = apply as-is, `MODIFY` = apply with changes, `REJECT` = do not apply, etc.).
- **why**: Prompt authors building refinement-qa flows need to know valid changeset types without reading implementation code. A comment block serves as inline reference.
- **priority**: low

## Impact Flags

- `.documentation/capabilities/requirements-refinement.md`: Feature table description for refinement-artifact is inaccurate; Key Patterns section needs two additions (snapshot-then-clear, semantic diffing).
- `.documentation/modules/scan-cli.md`: Referenced as structural template for proposed refinement-cli.md module doc. No changes needed to this file itself.
- `.documentation/flows/requirements-refinement/landscape-scan.md`: Referenced as structural template for proposed refinement-artifact flow doc. No changes needed to this file itself.
