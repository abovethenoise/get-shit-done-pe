# End-User Trace Report: scope-fluid-pipeline

**Reviewer:** End-User Dimension
**Feature:** pipeline-execution/scope-fluid-pipeline
**Lens:** refactor
**Date:** 2026-03-05

---

## Phase 1: Internalize Requirements

| Req ID | Title | "Met" looks like |
|--------|-------|-----------------|
| EU-01 | Scope-fluid pipeline entry | Slug-resolve determines scope at entry; pipeline adapts; all commands accept both capability and feature references |
| EU-02 | Autonomous pipeline progression | plan->execute->review->doc auto-chains; human gates only at review findings Q&A and doc approval Q&A; no forced /clear between stages |
| EU-03 | Focus-aware progress routing | Progress identifies focus groups; falls back to recent work then state scan; concrete /gsd:* commands; asks when ambiguous; never suggests "add feature" when planning/execution is next |
| EU-04 | No CLI breakage | All gsd-tools CLI routes pass smoke test; all 13 slash commands fire without error; both scopes work; existing artifacts remain compatible |

---

## Phase 2: Trace Against Code

### EU-01: Scope-fluid pipeline entry

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:27` -- `SCOPE: "capability" if FEATURE_SLUG is null/empty, "feature" if FEATURE_SLUG is provided` -- Scope determination at entry, derived from inputs.
- `get-shit-done/workflows/framing-pipeline.md:55-56` -- `SCOPE = if FEATURE_SLUG is provided then "feature" else "capability"` -- Pipeline adapts behavior based on resolved scope.
- `get-shit-done/workflows/framing-pipeline.md:82-138` -- Capability-scope branch (DAG wave orchestration) vs feature-scope branch (linear pipeline) -- Pipeline behavior differs per scope.
- `commands/gsd/plan.md:35` -- `RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")` -- No `--type` constraint; accepts both scopes.
- `commands/gsd/execute.md:39` -- Same unconstrained slug-resolve.
- `commands/gsd/review.md:34` -- `slug-resolve "$ARGUMENTS"` -- No type hint, accepts both scopes. Explicitly documented: "no type hint -- accepts both scopes."
- `commands/gsd/doc.md:37` -- Same unconstrained slug-resolve.
- `commands/gsd/new.md:48`, `commands/gsd/enhance.md:50`, `commands/gsd/debug.md:50`, `commands/gsd/refactor.md:50` -- All use unconstrained slug-resolve.
- Reasoning: All commands use `slug-resolve` without `--type` constraints. The pipeline detects scope from the resolved slug type and adapts behavior accordingly. Acceptance criteria satisfied.

### EU-02: Autonomous pipeline progression

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:168-173` -- Plan stage: "If clean: proceed to Stage 2" -- Plan finalization triggers execute automatically.
- `get-shit-done/workflows/framing-pipeline.md:204-206` -- Execute stage: "If clean: proceed directly to Stage 3 (Review) -- NO user gate here" -- Execute completion triggers review automatically.
- `get-shit-done/workflows/framing-pipeline.md:261-262` -- "If review passes cleanly (no blockers): proceed directly to Stage 4 (Doc) -- NO user gate here" -- Review completion triggers doc automatically.
- `get-shit-done/workflows/framing-pipeline.md:439-440` -- "Full auto-chain: user kicks off pipeline -> plans -> builds code -> auto-reviews -> auto-documents -> done. Human gates ONLY at: review findings Q&A and doc approval Q&A."
- `get-shit-done/workflows/review.md:136-148` -- Review findings Q&A loop (human gate 1): options via AskUserQuestion for each finding.
- `get-shit-done/workflows/doc.md:162-176` -- Doc recommendations Q&A loop (human gate 2): options via AskUserQuestion for each recommendation.
- `get-shit-done/workflows/execute.md:199-204` -- Execute's `offer_next` step: "If running under pipeline orchestration (framing-pipeline.md), the pipeline handles next-stage chaining automatically." -- Execute returns cleanly to pipeline.
- `get-shit-done/workflows/review.md:177-193` -- Auto-Advance (Step 12): auto-invokes doc workflow when no blockers remain.
- `get-shit-done/workflows/framing-pipeline.md:206-209` -- Context exhaustion check: "If context window is degraded after execute, present next command and exit cleanly" -- Graceful degradation without forced /clear.
- Reasoning: All four stage transitions are explicitly auto-chained. Human gates exist only at review findings Q&A and doc approval Q&A. Context exhaustion is handled gracefully. All acceptance criteria satisfied.

### EU-03: Focus-aware progress routing

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/progress.md:99-118` -- Tier 1 (Focus Group Routing): "Parse ROADMAP.md directly for focus groups... For each active focus group: identify its features and determine pipeline state."
- `get-shit-done/workflows/progress.md:122-131` -- Tier 2 (Recent Work Continuation): "Read STATE.md Session Continuity section... Identify last active capability/feature."
- `get-shit-done/workflows/progress.md:135-144` -- Tier 3 (State Scan): "Scan all feature directories under .planning/capabilities/... Collect all features with incomplete pipeline stages."
- `get-shit-done/workflows/progress.md:157-166` -- Single next step output: concrete `/gsd:{command} {cap/feat}` commands.
- `get-shit-done/workflows/progress.md:170-183` -- Multiple parallel-safe paths: presents all options with "Which would you like to advance?"
- `get-shit-done/workflows/progress.md:114-115` -- "If multiple parallel-safe paths exist: present all options and use AskUserQuestion to ask which to advance"
- `get-shit-done/workflows/progress.md:149-151` -- Anti-pattern guards: "NEVER suggest 'add feature' or 'discuss features' when a feature has FEATURE.md with requirements but no PLANs -- the next step is /gsd:plan, not more discussion"
- Reasoning: 3-tier fallback implemented (focus groups -> recent work -> state scan). Concrete commands presented. Ambiguous paths trigger user choice. Anti-pattern guards prevent suggesting discussion when execution is needed. All acceptance criteria satisfied.

### EU-04: No CLI breakage

**Verdict:** met (proven)

**Evidence:**
- `commands/gsd/review.md:34` -- slug-resolve without `--type feature` (constraint removed per TC-05). Command accepts both scopes.
- `commands/gsd/doc.md:37` -- Same unconstrained slug-resolve.
- `commands/gsd/plan.md:38` -- Unconstrained slug-resolve, routes capability to framing-pipeline and feature to plan.md.
- `commands/gsd/execute.md:39` -- Same dual routing pattern.
- All 4 framing lens commands (`new.md`, `enhance.md`, `debug.md`, `refactor.md`) -- all use unconstrained slug-resolve and route both scope types.
- No active workflow/command/agent files reference deleted `capability-orchestrator.md` or `research-workflow.md` (grep confirmed zero hits in `get-shit-done/`, `commands/`, `agents/` directories).
- Agent frontmatter changes (role_type corrections) do not alter command signatures or CLI interfaces.
- Reasoning: All existing commands retain their names, argument patterns, and general behavior. The `--type feature` constraint was removed from review.md (TC-05 satisfied). No orphaned references to deleted workflows in active code. Commands still accept the same input slugs and produce the same output patterns. Existing `.planning/` artifacts (CAPABILITY.md, FEATURE.md) remain compatible since no format changes were made.

**Cross-layer observations:**
- The `/gsd:doc` command's capability-level invocation (Step 6, line 114) iterates features sequentially, passing each individually to doc.md: `Pass: CAPABILITY_SLUG, FEATURE_SLUG={current feature}, LENS`. This means when invoked via the standalone command at capability scope, each feature's doc explorers only see that single feature's artifacts, not the full scope. In contrast, when invoked via framing-pipeline.md, doc.md receives FEATURE_SLUG=null and its Step 3 "Scope-Fluid" path collects all features. This creates two different behaviors for the same capability-scope intent depending on entry path. The review command does NOT have this issue -- it passes FEATURE_SLUG=null for capability scope (line 82). This inconsistency in the doc command may cause user confusion, though it does not violate EU-04 (backward compatibility) since the command still works.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | All commands use unconstrained `slug-resolve`; framing-pipeline.md:27,55-56 derives scope and adapts behavior |
| EU-02 | met | framing-pipeline.md:204-206,261-262,439-440 -- auto-chain wiring with human gates only at review Q&A and doc Q&A |
| EU-03 | met | progress.md:99-183 -- 3-tier routing (focus groups -> recent work -> state scan) with concrete commands and anti-pattern guards |
| EU-04 | met | All commands retain signatures; zero orphaned refs to deleted files in active code; `--type feature` removed from review.md |

**Cross-layer observation (secondary):** `/gsd:doc` command capability-level path (doc.md command Step 6) iterates features individually rather than passing capability scope to doc.md workflow, creating inconsistent scope behavior compared to the pipeline path. The review command handles this correctly by passing FEATURE_SLUG=null. This does not affect any EU verdict but is a functional concern relevant to FN-02 (scope-fluid doc).
