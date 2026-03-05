---
lens: plan
secondary_lens: null
subject: requirements-refinement/change-application
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** requirements-refinement/change-application
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### DELTA.md Must Be Renamed to EXECUTION-LOG.md

Both change-application FEATURE.md and refinement-artifact claim `.planning/refinement/DELTA.md`. Refinement-artifact owns DELTA.md for semantic diffs; change-application's execution log must use `EXECUTION-LOG.md`. This was already resolved in STATE.md and refinement-artifact's 01-PLAN.md (line 68). The FEATURE.md spec still says "DELTA.md" -- the plan must use `EXECUTION-LOG.md` throughout and treat the spec name as superseded.

[Sources: Existing System, Tech Constraints, Edge Cases, User Intent]

### Only 2 of 7 Mutation Types Have CLI Routes

`capability-create` and `feature-create` exist. The remaining 5 (move, modify-metadata, reinstate, defer, kill) require direct file edits flagged UNVALIDATED. This makes the "fallback" path the de facto primary path at launch. All gatherers independently verified this against `gsd-tools.cjs` route listing.

[Sources: Domain Truth, Existing System, Tech Constraints, Edge Cases, User Intent, Prior Art]

### Git Rebase Sequencer Is the Correct Execution Model

The applied/failed/skipped/pending state machine maps 1:1 to DELTA.md entry statuses. The three failure options (fix-and-resume, skip-and-continue, abort) are the exhaustive set for sequential-apply-with-failure, matching git's continue/skip/abort. Execute-plan's AskUserQuestion + checkpoint protocol is the proven Claude Code mechanism for halt-and-ask.

[Sources: Prior Art, Domain Truth]

### Execution Log Must Be Written Incrementally (Not Batch)

The spec implies EXECUTION-LOG.md is written at the end (FN-04), but fix-and-resume (FN-03) requires knowing what already succeeded. Without incremental writes, a crash mid-execution leaves no record. The WAL principle applies: log intent before execution, update status after each mutation.

[Sources: Domain Truth, Edge Cases, Prior Art]

### Mutations Must Follow Topological (Safe) Execution Order

Creates before moves before metadata before reinstate before defer before kills. This is a mathematical invariant of the dependency graph, not a design preference. Violating it (e.g., moving a feature to a capability that hasn't been created yet) produces cascading failures.

[Sources: Domain Truth, Prior Art, User Intent]

### Each Mutation Must Be Atomic at the File Level

Partial writes corrupt state worse than failed writes. Read file, compute new content in memory, write complete file in one operation. `fs.writeFileSync` is not truly atomic (crash mid-write can truncate), but it is sufficient for markdown files in a single-process context.

[Sources: Domain Truth, Tech Constraints, Edge Cases]

### No Rollback Mechanism -- Applied Changes Persist

FEATURE.md EU-02 explicitly states "applied entries (safe to keep)." GSD has no snapshot/undo capability. Rollback would require reverse functions for every mutation type -- unnecessary complexity given that individual mutations are valid states. The "abort" option stops processing but does not undo.

[Sources: Domain Truth, Prior Art, User Intent]

### CHANGESET.md Action Field Is Free Text (No Structured Mutation Type)

The `action` field contains human-readable text like "Move feature X from cap-A to cap-B." There is no `mutation_type` enum. The workflow (executed by Claude Code as an LLM) must classify action text into one of 7 mutation types. This is well-suited to the runtime (LLM classification) but non-deterministic.

[Sources: Existing System, Tech Constraints, Edge Cases]

### AskUserQuestion for Failure Handling

All user interaction in GSD workflows uses AskUserQuestion. FN-03's fix/skip/abort decision must use this tool, consistent with execute-plan's checkpoint protocol.

[Sources: Prior Art, User Intent]

### Create Routes Error on Duplicates (Idempotency Gap)

`cmdCapabilityCreate` and `cmdFeatureCreate` call `error()` -> `process.exit(1)` when the entity already exists. On fix-and-resume or partial re-runs, creates that already succeeded will crash. The workflow must pre-check existence before calling create routes.

[Sources: Existing System, Edge Cases, Domain Truth]

## Conflicts

### EXECUTION-LOG.md Writing: Direct vs refinement-write Route

**User Intent says:** `refinement-write --type delta` (from refinement-artifact) may be the intended mechanism for writing the execution log, since refinement-artifact owns directory management.
**Tech Constraints says:** `refinement-write` is planned but not yet built. The workflow can write directly using the Write tool with no dependency.

**Resolution:** Write directly. The `refinement-write` route is not yet built, and change-application should not depend on it. If refinement-write is available at execution time, it can be used opportunistically, but the plan should not require it. Direct write is simpler and has zero dependencies.

### Incremental vs End-of-Run EXECUTION-LOG.md Writes

**Domain Truth says:** Log must be written incrementally (WAL pattern) for crash recovery and resumability.
**Prior Art says:** In-memory state suffices because change-application runs within a single Claude Code session; EXECUTION-LOG.md is for downstream consumption, not crash recovery.

**Resolution:** Both are partially right. The workflow runs in a single session (no cross-session resume needed), but FN-03's "fix and resume" requires knowing what already succeeded. Write EXECUTION-LOG.md after each mutation AND on failure halt. This satisfies both the audit trail requirement and the resume-after-failure requirement without over-engineering crash recovery.

### delta-parse CLI Route: Build or Defer?

**User Intent says:** TC-02 mentions `delta-parse` with "if needed," suggesting it may be optional.
**Tech Constraints says:** The route is listed as planned but belongs to a different scope.

**Resolution:** Defer. The "if needed" qualifier means it is not required for change-application to function. EXECUTION-LOG.md is consumed by refinement-artifact, which can parse it directly. Building delta-parse is out of scope per the feature boundary.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Reinstate artifact cleanup scope (single source: Edge Cases).** FN-05 says "clear downstream artifacts (research, plans)" but does not enumerate file patterns. Existing features have `research/`, `RESEARCH.md`, `01-PLAN.md`, `02-PLAN.md`. Whether `review/` or `BRIEF.md` should be cleared is unspecified. The planner must define the exact glob patterns.

- **Kill-capability precondition (single source: Edge Cases).** Whether killing a capability requires all its features to be killed first is implied by execution order (kill features before kill caps) but not stated as a hard precondition. A kill-capability entry without corresponding kill-feature entries would leave orphaned active features under a killed capability.

- **Modify-metadata field specification (single source: User Intent).** How the action text encodes which field to change and what the new value should be is undefined. The parsing contract between CHANGESET.md's free-text action and the modify-metadata handler is unspecified.

- **Move-feature atomicity (single source: User Intent).** Moving a directory requires copy + verify + delete across multiple filesystem operations. Claude Code's Edit tool cannot move directories. The workflow must use Bash `cp -r` + `rm -rf` or equivalent, which is multi-step and not atomic.

### Unanswered Questions

1. Should the workflow create a git checkpoint (stash/commit) before executing mutations, so the user can revert if the entire run is unsatisfactory?
2. What happens when a CHANGESET.md entry action does not map to any of the 7 known mutation types? No default/error handler is specified.
3. For large change sets (50+ entries), will context window pressure on the workflow agent cause degraded behavior?
4. Should `capability-create` and `feature-create` gain `--if-not-exists` flags, or should the workflow pre-check and skip?

## Constraints Discovered

Hard limits the planner MUST respect. Violating these leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Zero runtime deps, CJS only | Tech Constraints | Cannot introduce libraries; all new code must be CommonJS `require`/`module.exports` |
| Execution log file is EXECUTION-LOG.md, not DELTA.md | Existing System, Tech Constraints, Edge Cases | Using DELTA.md overwrites refinement-artifact's semantic diff output |
| `output()` calls `process.exit(0)` -- CLI commands terminate process | Existing System | Cannot call CLI functions in-process; must invoke via Bash subprocess |
| Frontmatter uses FAILSAFE_SCHEMA (all string values) | Existing System, Tech Constraints | Status values written as strings; no type coercion |
| Feature is a workflow file (.md), not a code module | Tech Constraints | No programmatic access to Node.js modules; uses Bash commands + Read/Edit/Write tools |
| Direct file edits use Read/Edit tools, never Bash sed/awk | User Intent (TC-01) | Violation risks unstructured file corruption |
| `changeset-parse` route must exist before this feature runs | Existing System, Tech Constraints | Route is planned in refinement-qa but not yet built; hard upstream dependency |
| `error()` in CLI routes calls `process.exit(1)` with unstructured stderr | Existing System, Edge Cases | Workflow must parse stderr text to determine failure reason; no JSON error payloads |
| No `fs.rename` or directory-move utility exists in codebase | Existing System | Move-feature must be implemented as copy+delete in the workflow |
| CHANGESET.md `action` field is free text, not structured mutation type | Existing System, Tech Constraints | LLM must classify action text into mutation type; non-deterministic |

## Recommended Scope

### Build (In Scope)

- **Workflow file implementing the sequencer state machine** -- applied/failed/skipped/pending buckets, sequential execution with halt-on-failure, AskUserQuestion for user decisions. This is the core deliverable. [Sources: Prior Art, Domain Truth, User Intent]

- **7 mutation handlers (switch statement, not plugin architecture)** -- 2 via CLI subprocess (`capability-create`, `feature-create`), 5 via direct Read/Edit with UNVALIDATED flag (move, modify-metadata, reinstate, defer, kill). Simple if/else routing per type. [Sources: all gatherers]

- **Pre-execution validation pass** -- before running mutations, check that referenced capabilities/features exist on disk and that create targets do not already exist (idempotency guard). Flag impossible entries (e.g., move to non-existent capability not in the create set) as FAILED before execution starts. [Sources: Edge Cases, Domain Truth]

- **EXECUTION-LOG.md output with incremental writes** -- write after each mutation completes. Include frontmatter (date, changeset source, result counts), summary table, per-entry results, and logged-only section. Overwrite per run. [Sources: Domain Truth, Edge Cases, Tech Constraints, User Intent]

- **Reinstate mutation with defined artifact cleanup** -- set status to `exploring`, clear kill/defer reasoning, delete `research/` directory and `*-PLAN.md` files, preserve EU/FN/TC sections. Planner must define exact glob patterns. [Sources: User Intent, Domain Truth]

- **Move-feature via copy-verify-delete** -- copy directory tree to target capability, update frontmatter `capability` field, verify copy, delete source. Never delete-then-create. [Sources: Domain Truth, Tech Constraints]

### Skip (Out of Scope)

- **Building new CLI routes (move, kill, defer, reinstate, modify-metadata)** -- these are cli-tooling backlog items, not change-application scope. UNVALIDATED flags serve as the backlog signal. [Sources: User Intent, Prior Art]

- **delta-parse CLI route** -- deferred per TC-02 "if needed" qualifier. [Source: User Intent]

- **Rollback/undo mechanism** -- explicitly excluded by EU-02. Applied changes persist. [Sources: Prior Art, Domain Truth]

- **Dry-run/preview mode** -- the entire refinement pipeline (coherence-report -> refinement-qa) IS the preview. Adding another layer violates YAGNI. [Source: Prior Art]

- **Per-mutation git commits** -- the refinement as a whole is the meaningful commit unit, handled by refinement-artifact. [Source: Prior Art]

- **Generic mutation engine/plugin architecture** -- 7 types is a small stable set. A switch statement is simpler and more debuggable. [Source: Prior Art]

### Investigate Further

- **Mutation type inference from free-text action** -- the planner must decide whether to (a) pattern-match action text in the workflow (LLM classification), or (b) propose adding a `mutation_type` field to the CHANGESET.md schema in changeset-write (upstream change, cheap since schema is not yet built). Option (b) is more reliable and testable. [Sources: Tech Constraints, Existing System]

- **Reinstate artifact cleanup scope** -- planner must define exact file/directory patterns to clear. Candidates: `research/`, `RESEARCH.md`, `*-PLAN.md`. Excludes: `FEATURE.md`, `BRIEF.md` (unclear). [Source: Edge Cases]

- **Skip-with-dependency-check** -- when user chooses "skip and continue" on a failed entry, should the workflow warn about pending entries that depend on the skipped one? The spec does not require this but Domain Truth flags it as a cascading failure risk. Planner should decide if a simple warning suffices or if dependent entries should be auto-marked SKIPPED. [Source: Domain Truth]

- **Context window pressure for large change sets** -- 50+ entries with multiple failures could exhaust the workflow agent's context. The planner may need to design a batching strategy or context-minimization approach. [Source: Edge Cases]
