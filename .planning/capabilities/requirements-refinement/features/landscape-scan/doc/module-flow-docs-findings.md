---
focus_area: module-flow-docs
feature: requirements-refinement/landscape-scan
date: 2026-03-05
---

## Finding: No module doc exists for landscape-scan.md workflow

- **target_file**: .documentation/modules/landscape-scan-workflow.md
- **current_state**: The workflow file `get-shit-done/workflows/landscape-scan.md` was created as part of this feature. It is a 5-stage orchestrator (discover, enumerate, analyze, consolidate, assemble) that spawns per-pair sub-agents. No corresponding module doc exists in `.documentation/modules/`. Other workflows of comparable complexity (review.md, plan.md, research.md) all have module docs.
- **recommended_change**: Create `.documentation/modules/landscape-scan-workflow.md` following the established module-doc pattern (type: module-doc frontmatter, Purpose [derived], Exports [derived] with inputs/steps/Task() blocks, Depends-on [derived]). Key content: document the 5-stage pipeline, the CLI commands it invokes (scan-discover, scan-pairs, scan-checkpoint), the sub-agent delegation pattern (gsd-scan-pair template via Task()), and the three-layer output structure (findings, consolidated report, dependency graph).
- **rationale**: This is the primary orchestration file for the feature. Without a module doc, there is no quick-reference for how the workflow operates, what it delegates, or what it produces. All peer workflows have module docs. The enhance lens requires documenting what was added.

## Finding: No module doc exists for scan.cjs CLI library

- **target_file**: .documentation/modules/scan-cli.md
- **current_state**: `get-shit-done/bin/lib/scan.cjs` was created as a new file. It exports three CLI commands (cmdScanDiscover, cmdScanPairs, cmdScanCheckpoint) plus schema constants. No module doc exists. Other CLI libraries (capability.cjs) do not have standalone module docs either, so this is consistent with current convention.
- **recommended_change**: Create `.documentation/modules/scan-cli.md` documenting the three exported commands, their arguments, their outputs (JSON to stdout), and the route wiring in gsd-tools.cjs. Alternatively, if the project convention is to not document individual CLI libs, skip this and instead ensure the landscape-scan workflow module doc references the CLI interface.
- **rationale**: scan.cjs introduces a new CLI surface area (three new routes). The review synthesis identified spec deviations in this file (FN-01 filesystem approach vs capability-list, checkpoint path format). A module doc would capture the actual behavior and serve as the canonical reference, reducing confusion when the spec text is stale. Priority is lower than the workflow doc since other CLI libs lack standalone docs.

## Finding: No flow doc exists for the landscape-scan pipeline

- **target_file**: .documentation/flows/requirements-refinement/landscape-scan.md
- **current_state**: No flow doc exists under `.documentation/flows/` for the landscape-scan pipeline. The pipeline has a clear trigger (user runs `/gsd:refine`), defined inputs (project capabilities directory), a multi-stage flow (discover -> enumerate -> analyze -> consolidate -> assemble), and defined outputs (landscape map with three layers). Other multi-stage pipelines (pipeline-execution/scope-aware-routing, pipeline-execution/research-overhaul) have flow docs.
- **recommended_change**: Create `.documentation/flows/requirements-refinement/landscape-scan.md` with Trigger [derived], Input [derived], Steps [derived], Output [derived], and Side-effects [derived] sections. Document the end-to-end flow from CLI invocation through sub-agent spawning to final landscape map assembly. Include the checkpoint/resume mechanism (EU-02) as a distinct flow branch.
- **rationale**: The landscape-scan is the entry point for the entire requirements-refinement capability pipeline. A flow doc makes the trigger-input-steps-output chain discoverable without reading the full workflow markdown. The enhance lens calls for documenting the delta -- this entire flow is new.

## Finding: Capability-level doc for requirements-refinement is stale

- **target_file**: .documentation/capabilities/requirements-refinement.md
- **current_state**: The capability doc is in "exploring" status with placeholder sections (Brief: empty, Requirements: empty). It does not reference any of the five implemented features (landscape-scan, coherence-report, refinement-qa, change-application, refinement-artifact) or the pipeline architecture connecting them.
- **recommended_change**: Update the [derived] sections to reflect the implemented state: set status to active, populate the Brief with the capability's purpose and the 5-feature pipeline architecture (landscape-scan -> coherence-report -> refinement-qa -> change-application -> refinement-artifact), and list the feature slugs with their roles. Preserve any [authored] sections unchanged.
- **rationale**: The capability doc is the top-level entry point for understanding requirements-refinement. Its current state ("exploring", empty brief) contradicts the fully implemented reality. This creates confusion for anyone navigating the documentation hierarchy. All five features have been executed through at least Wave 1 of the capability's implementation.

## Finding: gsd-scan-pair template has no module doc

- **target_file**: .documentation/modules/gsd-scan-pair-template.md
- **current_state**: `get-shit-done/templates/gsd-scan-pair.md` is a new per-pair agent template spawned by the landscape-scan orchestrator. It defines the analysis protocol for comparing two capabilities/features. No module doc exists. The review synthesis notes a spec deviation (TC-02: template lives at templates/ not agents/ as spec says).
- **recommended_change**: Create a module doc if other templates have module docs, or fold the template's interface description into the landscape-scan workflow module doc. At minimum, the workflow module doc should document that the template exists at `templates/gsd-scan-pair.md` (not `agents/` as the stale spec says), what inputs it receives, and what output format it produces (finding cards per FN-03).
- **rationale**: The template is a delegation boundary -- the orchestrator hands off per-pair analysis to it. Documenting its interface (inputs, expected output format) at the module level makes the delegation contract explicit. The TC-02 path deviation makes this especially important for discoverability.
