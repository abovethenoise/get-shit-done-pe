---
focus_area: friction-reduction
feature: requirements-refinement/landscape-scan
date: 2026-03-05
---

## Finding: No `init` compound command for landscape-scan workflow

- **target_file**: get-shit-done/bin/lib/init.cjs
- **current_state**: Other workflows (resume, project, plan-feature, execute-feature, etc.) have `init` compound commands registered in gsd-tools.cjs that pre-load all required context in a single CLI call. The landscape-scan workflow has no corresponding `init` entry. The workflow itself issues three separate CLI calls during startup (scan-discover, scan-pairs, scan-checkpoint --action list) that could be collapsed.
- **recommended_change**: Add `cmdInitLandscapeScan` to init.cjs that bundles discovery, pair enumeration, checkpoint listing, and tier detection into a single JSON payload. Register as `init landscape-scan` in gsd-tools.cjs. This follows the established pattern used by all other workflow init commands.
- **rationale**: Every other workflow uses a compound init command to reduce startup latency and context-switching overhead. The landscape-scan workflow currently requires the orchestrator agent to make three sequential CLI calls and manually combine results. A compound init would reduce this to one call, cutting startup friction and aligning with the established convention.

## Finding: No slash command or entry point for launching landscape-scan

- **target_file**: (new file) .claude/commands/gsd-scan.md (or equivalent)
- **current_state**: The landscape-scan workflow exists at `get-shit-done/workflows/landscape-scan.md` but there is no slash command (under `.claude/commands/`) that invokes it. Users must manually reference the workflow file. Other GSD workflows are typically launched via slash commands (e.g., `/gsd:plan-feature`).
- **recommended_change**: Create a slash command entry point (e.g., `/gsd:landscape-scan`) that loads the workflow and triggers execution. This is a thin wrapper that reads the workflow file and passes it to the agent.
- **rationale**: Without a discoverable entry point, users must know the workflow file path to launch a scan. A slash command makes the capability discoverable and consistent with how other GSD workflows are invoked.

## Finding: Sequential pair analysis lacks progress estimation

- **target_file**: get-shit-done/workflows/landscape-scan.md
- **current_state**: The workflow logs "Pair {i}/{total}: {A} x {B} -> {N} findings" after each pair completes (line 103). However, for medium/large projects, there is no elapsed-time tracking or ETA estimation. The scan is potentially long-running (N*(N-1)/2 subagent calls) and the user has no way to gauge remaining time.
- **recommended_change**: Add a lightweight timing pattern to the workflow: record start time before the pair loop, compute elapsed per-pair average after each completion, and log estimated remaining time. Example: "Pair 5/15 complete (~2m/pair, ~20m remaining)". This requires no CLI changes -- it is pure workflow-level logic.
- **rationale**: For projects with 10+ capabilities (45+ pairs), the scan can run for a significant duration. Progress estimation reduces uncertainty and helps users decide whether to let it run unattended. This is a workflow UX improvement, not a feature change.

## Finding: Capability directory listing helper not surfaced for reuse

- **target_file**: get-shit-done/bin/lib/scan.cjs
- **current_state**: The synthesis (Finding 7) identifies that capability directory listing is duplicated across scan.cjs:28-31, scan.cjs:110-113, and capability.cjs:57-60. The `listDirs` helper exists in scan.cjs (line 10-16) but is module-private. The same pattern is reimplemented elsewhere.
- **recommended_change**: Extract `listDirs` (or a more specific `listCapabilitySlugs(cwd)` helper) into core.cjs and reuse it from scan.cjs, capability.cjs, and any other consumer. This is a one-time DRY extraction that prevents future drift.
- **rationale**: The review synthesis confirms 10+ occurrences of this pattern across the codebase. A shared helper eliminates the maintenance burden of keeping them consistent and reduces the chance of subtle behavioral divergence (e.g., one caller sorting, another not).
