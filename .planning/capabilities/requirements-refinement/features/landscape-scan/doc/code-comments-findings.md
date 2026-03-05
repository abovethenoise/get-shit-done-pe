---
focus_area: code-comments
feature: requirements-refinement/landscape-scan
date: 2026-03-05
---

## Finding: scan.cjs functions lack JSDoc parameter/return documentation

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **current_state**: The three exported functions (`cmdScanDiscover`, `cmdScanPairs`, `cmdScanCheckpoint`) have no JSDoc comments. The file has a one-line module header (`Scan -- Landscape scan CLI commands for cross-capability coherence analysis`) and two section dividers (`Helpers`, `Commands`), but no function-level documentation. Callers must read the implementation to understand parameter contracts (e.g., that `cmdScanCheckpoint` expects `args` to contain `--pair`, `--action`, `--output-dir` flags, or that `raw` controls JSON vs pretty output).
- **recommended_change**: Add brief JSDoc blocks to each exported function. Focus on parameters and output shape since these are CLI-facing commands consumed by the router in gsd-tools.cjs. Example for `cmdScanCheckpoint`: document the three `--action` modes (read/write/list), the `--pair` format (`{A}__{B}`), and the optional `--output-dir` override.
- **rationale**: Other lib modules in the codebase (e.g., state.cjs, capability.cjs) follow the same no-JSDoc pattern, so this is consistent with existing conventions. However, scan.cjs has the most complex argument parsing of the three functions (especially `cmdScanCheckpoint` with its three-mode switch), and the `--pair` format (`A__B` double-underscore) is a non-obvious convention. Minimal JSDoc on `cmdScanCheckpoint` would prevent confusion when the orchestrator workflow or future commands construct pair keys.

## Finding: completeness logic in cmdScanDiscover lacks inline rationale

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **current_state**: Lines 59-66 compute a `completeness` value (`full`, `partial`, `none`) using a conditional chain. The comment on line 58 says `// Compute completeness` but does not explain the classification criteria. The review synthesis (Finding 11) identified that a directory with features but no CAPABILITY.md is classified `none` (same as truly empty). This was deemed intentional -- but the code does not explain why features alone do not qualify as `partial`.
- **recommended_change**: Add an inline comment above the completeness block explaining the design choice: CAPABILITY.md is the anchor document; features without a capability spec are treated as orphaned (triggering GAP detection), not as partial completeness.
- **rationale**: This classification is a deliberate design decision that was questioned during review. A one-line comment prevents the same question from recurring and documents the intent for future maintainers.

## Finding: listDirs helper has no comment explaining its role

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **current_state**: `listDirs` (line 10-16) is an internal helper that lists subdirectories sorted alphabetically. It is used by both `cmdScanDiscover` and `cmdScanPairs`. No comment explains its purpose or why sorting matters (deterministic pair enumeration depends on consistent ordering).
- **recommended_change**: Add a one-line comment: `/** List sorted subdirectory names. Sorting ensures deterministic pair enumeration order. */`
- **rationale**: The sort is load-bearing for checkpoint resumability -- if ordering changed between runs, pair keys (`A__B`) would not match previously written checkpoints. This non-obvious constraint deserves a comment.

## Finding: gsd-scan-pair.md template is well-documented, no gaps

- **target_file**: get-shit-done/templates/gsd-scan-pair.md
- **current_state**: The template has clear sections for Input, Finding Schema, Analysis Instructions, and Output. Each finding type and severity level is defined with examples. The template explicitly states "You do NOT perform file I/O" and explains the placeholder replacement contract (`{{CAPABILITY_A}}`, etc.).
- **recommended_change**: None needed.
- **rationale**: The template serves as both agent instructions and schema documentation. Its inline explanations are thorough and match the requirements in FN-03.

## Finding: landscape-scan.md workflow is well-documented, no gaps

- **target_file**: get-shit-done/workflows/landscape-scan.md
- **current_state**: The workflow uses structured XML-style tags (`<purpose>`, `<step>`, `<success_criteria>`) with clear step names, inline code blocks for CLI invocations, and detailed output format specifications. Each step explains its logic and edge cases (e.g., malformed agent output handling in step 4.6, checkpoint-based resumption in step 3).
- **recommended_change**: None needed.
- **rationale**: Workflow files in GSD are consumed by LLM orchestrators, not human developers. The current documentation density is appropriate for that audience.
