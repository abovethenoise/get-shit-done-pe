---
type: doc-report
feature: requirements-refinement/landscape-scan
date: 2026-03-05
explorer_manifest:
  code-comments: success
  module-flow-docs: success
  standards-decisions: success
  project-config: success
  friction-reduction: success
---

## Code Comments

### Recommendation: Add JSDoc to cmdScanCheckpoint for argument contracts

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **what_to_change**: Add JSDoc blocks to the three exported functions (`cmdScanDiscover`, `cmdScanPairs`, `cmdScanCheckpoint`). Prioritize `cmdScanCheckpoint` which has the most complex argument parsing (three `--action` modes, `--pair` format using `A__B` double-underscore, optional `--output-dir`).
- **why**: The `--pair` double-underscore format and three-mode switch are non-obvious conventions. Callers (gsd-tools router, workflow orchestrator) must currently read the implementation to understand the interface.
- **priority**: medium

### Recommendation: Document completeness classification rationale inline

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **what_to_change**: Add an inline comment above the completeness computation block (lines 58-66) explaining: CAPABILITY.md is the anchor document; features without a capability spec are treated as orphaned (completeness `none`), not `partial`.
- **why**: This classification was questioned during review. A one-line comment prevents the same question from recurring and documents the deliberate design choice.
- **priority**: medium

### Recommendation: Document listDirs sort as load-bearing for checkpoint resumability

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **what_to_change**: Add comment: `/** List sorted subdirectory names. Sorting ensures deterministic pair enumeration order for checkpoint resumability. */`
- **why**: If sort order changed between runs, pair keys (`A__B`) would not match previously written checkpoints, silently breaking EU-02 resumability.
- **priority**: medium

## Module and Flow Docs

### Recommendation: Create flow doc for the landscape-scan pipeline

- **target_file**: .documentation/flows/requirements-refinement/landscape-scan.md
- **what_to_change**: Create a flow doc with Trigger, Input, Steps, Output, and Side-effects sections (all [derived]). Document the end-to-end flow: CLI invocation -> discover -> enumerate -> per-pair sub-agent analysis -> consolidate -> assemble landscape map. Include the checkpoint/resume branch (EU-02).
- **why**: Landscape-scan is the entry point for the entire requirements-refinement pipeline. Other multi-stage pipelines have flow docs. The enhance lens requires documenting this new flow.
- **priority**: high

### Recommendation: Create module doc for landscape-scan workflow

- **target_file**: .documentation/modules/landscape-scan-workflow.md
- **what_to_change**: Create module doc following the established pattern (Purpose, Exports, Depends-on -- all [derived]). Document the 5-stage pipeline, the CLI commands it invokes, the sub-agent delegation pattern (gsd-scan-pair template via Task()), and the three-layer output structure. Include note that the template lives at `templates/gsd-scan-pair.md` (not `agents/` as stale spec says).
- **why**: Peer workflows (review.md, plan.md, research.md) all have module docs. This is the primary orchestration file for the feature.
- **priority**: high

### Recommendation: Update capability-level doc for requirements-refinement

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **what_to_change**: Update [derived] sections: set status to active, populate Brief with the 5-feature pipeline architecture (landscape-scan -> coherence-report -> refinement-qa -> change-application -> refinement-artifact), list feature slugs with roles. Preserve any [authored] sections.
- **why**: Currently shows "exploring" status with empty brief, contradicting the fully implemented reality. This is the top-level entry point for understanding the capability.
- **priority**: high

### Recommendation: Create module doc for scan.cjs CLI library

- **target_file**: .documentation/modules/scan-cli.md
- **what_to_change**: Document the three exported commands, their arguments, JSON output shapes, and route wiring in gsd-tools.cjs. Alternatively, fold this into the landscape-scan workflow module doc if standalone CLI lib docs are not the project convention.
- **why**: scan.cjs introduces three new CLI routes with non-trivial argument contracts. Review identified spec deviations in this file that a module doc would clarify.
- **priority**: medium

## Standards and Decisions

### Recommendation: Codify agent-receives-content-not-paths pattern

- **target_file**: .documentation/gate/constraints.md
- **what_to_change**: Add constraint: "Reasoning agents receive content, not paths. All file I/O is performed by the orchestrator or gsd-tools layer. Agents must not read or write files directly."
- **why**: This separation is critical for testability, reproducibility, and controlling agent side effects. Already the de facto pattern -- codifying it prevents future violations.
- **priority**: high

### Recommendation: Codify skip-not-halt pattern for batch workflows

- **target_file**: .documentation/gate/constraints.md
- **what_to_change**: Clarify the `no-silent-failures` constraint with a companion convention: "For batch workflows processing independent items, malformed output from one item should be logged and skipped, not used to halt the entire batch. The skip must be visible (logged to stderr or captured in output)."
- **why**: The existing constraint is ambiguous for batch scenarios. The landscape-scan approach (log + skip) was validated in review as the correct middle ground.
- **priority**: high

### Recommendation: Codify double-underscore separator convention for composed slugs

- **target_file**: .documentation/gate/constraints.md
- **what_to_change**: Add convention: "When composing multiple slug values into a single filename, use double-underscore (`__`) as separator to avoid collision with hyphens in slugs."
- **why**: Reusable pattern decision. Without codification, future features will hit the same hyphen ambiguity and may choose a different separator.
- **priority**: medium

### Recommendation: Codify graceful degradation pattern for unimplemented optimizations

- **target_file**: .documentation/gate/constraints.md
- **what_to_change**: Add convention: "Unimplemented optimizations must degrade to correct-but-slow behavior, never skip work. Emit a stderr warning when falling back."
- **why**: This principle was applied and validated in landscape-scan review. It prevents future implementations from silently skipping work or failing hard on missing optimization paths.
- **priority**: medium

### Recommendation: Add requirements-refinement domain terms to glossary

- **target_file**: .documentation/gate/glossary.md
- **what_to_change**: Add entries for: landscape map, coherence finding, GAP (finding type), completeness (full/partial/none).
- **why**: These terms are used across all five features in the capability. The glossary exists to prevent term drift.
- **priority**: low

## Project Config

*No recommendations identified.*

## Friction Reduction

### Recommendation: Add compound init command for landscape-scan workflow

- **target_file**: get-shit-done/bin/lib/init.cjs
- **what_to_change**: Add `cmdInitLandscapeScan` that bundles discovery, pair enumeration, checkpoint listing, and tier detection into a single JSON payload. Register as `init landscape-scan` in gsd-tools.cjs.
- **why**: Every other workflow uses a compound init command. Landscape-scan currently requires three sequential CLI calls at startup. A compound init reduces this to one call, cutting startup friction.
- **priority**: high

### Recommendation: Extract shared listDirs/listCapabilitySlugs helper to core.cjs

- **target_file**: get-shit-done/bin/lib/core.cjs
- **what_to_change**: Extract the `listDirs` helper (or a more specific `listCapabilitySlugs(cwd)`) into core.cjs for reuse across scan.cjs, capability.cjs, and other consumers.
- **why**: Review synthesis confirms 10+ occurrences of this pattern. A shared helper eliminates maintenance burden and prevents subtle behavioral divergence (e.g., sorting inconsistencies).
- **priority**: medium

### Recommendation: Add progress estimation to pair analysis loop

- **target_file**: get-shit-done/workflows/landscape-scan.md
- **what_to_change**: Add lightweight timing to the workflow: record start time before the pair loop, compute elapsed per-pair average, log estimated remaining time after each completion (e.g., "Pair 5/15 complete (~2m/pair, ~20m remaining)").
- **why**: For 10+ capability projects (45+ pairs), the scan is long-running. Progress estimation reduces user uncertainty. Pure workflow-level change, no CLI modifications needed.
- **priority**: low

### Recommendation: Create slash command entry point for landscape-scan

- **target_file**: .claude/commands/gsd-scan.md
- **what_to_change**: Create a slash command (e.g., `/gsd:landscape-scan`) that loads and triggers the workflow. Thin wrapper following the pattern of other GSD slash commands.
- **why**: Without a discoverable entry point, users must know the workflow file path. A slash command makes the capability consistent with how other GSD workflows are launched.
- **priority**: low

## Impact Flags

- `.documentation/gate/constraints.md`: Four new conventions recommended (agent-receives-content, skip-not-halt batch pattern, double-underscore separator, graceful degradation)
- `.documentation/gate/glossary.md`: New domain terms for requirements-refinement capability
- `.documentation/capabilities/requirements-refinement.md`: Stale status and empty brief need update to reflect implemented state
