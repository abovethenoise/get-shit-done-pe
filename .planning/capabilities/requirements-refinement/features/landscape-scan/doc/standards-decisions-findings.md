---
focus_area: standards-decisions
feature: requirements-refinement/landscape-scan
date: 2026-03-05
---

## Finding: Double-underscore separator convention not codified

- **target_file**: .documentation/gate/constraints.md
- **current_state**: The landscape-scan implementation chose double-underscore (`__`) separators for checkpoint filenames (e.g., `capA__capB.complete`) to avoid ambiguity with capability slugs that contain hyphens. This decision is noted in FEATURE.md context but not recorded as a project-wide convention. The rationale (hyphen collision avoidance) applies to any future command that composes slugs into filenames.
- **recommended_change**: Add a constraint or convention entry documenting: "When composing multiple slug values into a single filename, use double-underscore (`__`) as the separator to avoid collision with hyphens already present in slugs."
- **rationale**: This is a reusable pattern decision. If a future feature composes slugs into filenames using hyphens, it will hit the same ambiguity problem. Codifying it once prevents rediscovery.

## Finding: Agent-receives-content pattern not documented as architectural standard

- **target_file**: .documentation/gate/constraints.md
- **current_state**: The landscape-scan design established a clean separation: gsd-tools does all file I/O, the reasoning agent receives file contents (not paths) and never performs I/O. This pattern is described in FEATURE.md key decisions and enforced in the template (`gsd-scan-pair.md`), but is not recorded as a project-level architectural standard. The same pattern should apply to any future agent-delegated workflow.
- **recommended_change**: Add a constraint: "Reasoning agents receive content, not paths. All file I/O is performed by the orchestrator or gsd-tools layer. Agents must not read or write files directly."
- **rationale**: This separation is critical for testability, reproducibility, and controlling agent side effects. It is already the de facto pattern in landscape-scan and likely intended for all agent workflows. Without codification, future features may violate it unknowingly.

## Finding: Graceful degradation with stderr transparency pattern worth codifying

- **target_file**: .documentation/gate/constraints.md
- **current_state**: The landscape-scan implementation handles unimplemented tiers (medium/large scaling) by falling back to safe behavior (full pairwise analysis) while emitting a stderr warning. The review synthesis explicitly validated this as acceptable ("over-analyzes, never under-analyzes"). This pattern -- degrade safely + tell the user -- is not captured as a project standard, despite being a sound general principle.
- **recommended_change**: Add a constraint or convention: "Unimplemented optimizations must degrade to correct-but-slow behavior, never skip work. Emit a stderr warning when falling back so the user knows the optimization was not applied."
- **rationale**: This codifies the principle that was already applied and validated in review. It prevents future implementations from silently skipping work or failing hard when an optimization path is not yet built.

## Finding: Malformed agent output handling -- skip-not-halt pattern

- **target_file**: .documentation/gate/constraints.md
- **current_state**: The landscape-scan implementation skips malformed agent output rather than halting the entire workflow. This is noted in the feature context key decisions. The existing `no-silent-failures` constraint could be read as conflicting with this -- skipping malformed output could be seen as swallowing an error. In practice, the implementation logs the skip (not silent), and halting would be worse (one bad pair kills the whole scan).
- **recommended_change**: Clarify the `no-silent-failures` constraint or add a companion convention: "For batch/iterative workflows processing independent items, malformed output from one item should be logged and skipped, not used to halt the entire batch. The skip must be visible (logged to stderr or captured in output)."
- **rationale**: The existing constraint is ambiguous for batch scenarios. Without clarification, a future implementer might either halt on first bad output (fragile) or silently skip it (violating no-silent-failures). The landscape-scan approach is the correct middle ground and should be the documented standard.

## Finding: Glossary missing requirements-refinement domain terms

- **target_file**: .documentation/gate/glossary.md
- **current_state**: The glossary defines foundational terms (module, flow, gate doc, derived, authored) but has no entries for requirements-refinement concepts that are now part of the system: landscape map, coherence finding, capability pair, GAP finding, completeness classification (full/partial/none), confidence scoring (HIGH/MEDIUM/LOW). These terms are used across multiple features in the requirements-refinement capability.
- **recommended_change**: Add glossary entries for the key domain terms introduced by requirements-refinement, at minimum: landscape map, coherence finding, GAP (as a finding type), completeness (full/partial/none).
- **rationale**: The glossary exists to prevent term drift and ensure shared vocabulary. The requirements-refinement capability introduced multiple new domain concepts that are used across its five features. Without glossary entries, these terms may be used inconsistently in future documentation or code.
