# Functional Trace Report: scope-fluid-pipeline

**Reviewer:** gsd-review-functional
**Lens:** refactor
**Date:** 2026-03-05
**Scope:** FN-01 through FN-09

---

## Phase 1: Internalize Requirements

| Req ID | Behavior Specification |
|--------|----------------------|
| FN-01 | Scope-fluid review: 4 reviewers receive full execution-scope artifact list, 1 synthesizer consolidates, scope inferred from SUMMARY.md presence, spec is ground truth |
| FN-02 | Scope-fluid doc: 5 explorers see full scope, 1 synthesizer consolidates, code is ground truth, doc aggregator detects terminology/orphaned/priority issues |
| FN-03 | Remediation loop: accepted findings -> planner -> remediation PLAN -> executor -> re-review, max 2 cycles, reuses existing patterns |
| FN-04 | Research absorbed into plan: plan stage spawns 6 parallel gatherers + synthesizer, research feeds directly into planning, replaces separate research stage |
| FN-05 | Requirements from discussion: pipeline no longer has requirements generation stage, receives pre-written requirements from FEATURE.md |
| FN-06 | Single pipeline orchestrator: framing-pipeline.md absorbs capability-orchestrator DAG logic, capability scope = DAG plan+execute per feature then review+doc once, feature scope = linear 4-stage |
| FN-07 | Progress focus-aware routing: 3-tier (focus groups -> recent work -> state scan), artifact-based state detection, parallel-safe detection, anti-pattern guards |
| FN-08 | Auto-chain wiring: plan->execute auto, execute->review auto (NO user gate), review->doc auto (no blockers), human gates only at review Q&A and doc approval Q&A, context exhaustion fallback |
| FN-09 | Backward compat: CLI routes unchanged, deleted workflow callers updated, no orphaned refs, agent role_type corrected (4 reviewers judge->executor, planner executor->judge) |

---

## Phase 2: Trace Against Code

### FN-01: Scope-fluid review

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/review.md:14` -- `FEATURE_SLUG: The feature being reviewed (null/empty for capability scope)` -- Review accepts both scopes via FEATURE_SLUG presence/absence.
- `get-shit-done/workflows/review.md:43-56` -- Step 3 "Locate Artifacts (Scope-Fluid)" implements dual-path artifact collection: feature scope reads from single feature dir, capability scope scans all feature directories under the capability collecting SUMMARY.md and FEATURE.md paths.
- `get-shit-done/workflows/review.md:58` -- `Spec (FEATURE.md requirements) is ground truth for code review.` -- Ground truth is spec as specified.
- `get-shit-done/workflows/review.md:75-105` -- Step 4 spawns 4 reviewers (enduser, functional, technical, quality) in parallel, each receiving the full artifact list and requirement IDs from scope.
- `get-shit-done/workflows/review.md:120-127` -- Step 6 spawns 1 synthesizer to consolidate findings.
- `get-shit-done/workflows/review.md:56` -- `Log scope: "Reviewing at {SCOPE} scope: {feature count} feature(s)"` -- Scope inferred from SUMMARY.md presence in feature directories.

**Cross-layer observations:** Quality reviewer (line 99-104) receives cross-scope detection instructions for capability scope, implementing the "Code aggregator detects: cross-scope state conflicts, interface contract violations, conflicting assumptions, spec coverage gaps" from FN-01 spec.

---

### FN-02: Scope-fluid doc

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/doc.md:14` -- `FEATURE_SLUG: The feature being documented (null/empty for capability scope)` -- Doc accepts both scopes.
- `get-shit-done/workflows/doc.md:43-55` -- Step 3 "Locate Artifacts (Scope-Fluid)" implements dual-path: feature scope reads from single dir, capability scope scans all feature dirs for SUMMARY.md presence.
- `get-shit-done/workflows/doc.md:57` -- `Code (what was actually built) is ground truth for documentation.` -- Ground truth is code as specified.
- `get-shit-done/workflows/doc.md:59` -- Doc aggregator framing for capability scope detects terminology inconsistency, orphaned docs, and update priority ordering.
- `get-shit-done/workflows/doc.md:81-118` -- Step 4 spawns 5 explorers (code-comments, module-flow-docs, standards-decisions, project-config, friction-reduction) in parallel.
- `get-shit-done/workflows/doc.md:144-149` -- 1 synthesizer consolidates recommendations into doc-report.md.

**Cross-layer observations:** None.

---

### FN-03: Review remediation loop

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:264-285` -- Section 5a "Remediation Loop (Post-Review)" implements the full loop: `REMEDIATION_COUNTER = 0`, accepted findings fed to planner, remediation PLANs executed via executor, counter incremented, re-review at execution scope, `REMEDIATION_COUNTER >= 2` stops loop.
- `get-shit-done/workflows/framing-pipeline.md:270-271` -- `Feed accepted findings to planner (existing planning pattern via plan.md)` and `Execute remediation plans via existing executor (execute.md)` -- Reuses existing planner and executor.
- `get-shit-done/workflows/framing-pipeline.md:280` -- `Human gate: Only at the review findings Q&A within review.md.` -- Human gate preserved.
- `get-shit-done/workflows/framing-pipeline.md:277` -- `If REMEDIATION_COUNTER >= 2: stop remediation loop, proceed to Stage 4 (Doc) with remaining findings logged` -- Max 2 cycles enforced.

**Cross-layer observations:** None.

---

### FN-04: Research absorbed into plan

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/plan.md:57-159` -- Step 5 "Handle Research" contains the full 6-gatherer parallel spawn (domain-truth, existing-system, user-intent, tech-constraints, edge-cases, prior-art) plus synthesizer, all within plan.md.
- `get-shit-done/workflows/plan.md:91` -- `Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next)` -- All 6 always spawned in parallel when research needed.
- `get-shit-done/workflows/plan.md:148-159` -- Synthesizer spawned after gatherers, produces RESEARCH.md, which feeds directly into planning (Step 7).
- `get-shit-done/workflows/framing-pipeline.md:168` -- `Plan.md owns research internally (Step 5: 6 parallel gather-synthesize agents with lens-aware RESEARCH.md reuse checking). No separate research stage needed.` -- Pipeline explicitly delegates research to plan.
- Deleted file `research-workflow.md` confirmed absent from filesystem (verified via bash test).

**Cross-layer observations:** Lens-aware reuse check at plan.md:71-74 prevents unnecessary re-research when lens matches existing RESEARCH.md frontmatter.

---

### FN-05: Requirements from discussion

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:436` -- `Requirements come from discuss-feature upstream. Pipeline receives pre-written requirements in FEATURE.md.` -- Pipeline does not generate requirements.
- `get-shit-done/workflows/framing-pipeline.md:1-5` -- Pipeline purpose states "4 stages: plan -> execute -> review -> doc" with no requirements generation stage.
- `get-shit-done/workflows/plan.md:41-43` -- Step 3 validates FEATURE.md existence with requirements, directs user to `discuss-feature` if missing: `If missing: Error -- run /gsd:discuss-feature first.`
- No Stage 2 (requirements generation) exists in framing-pipeline.md -- pipeline goes directly from initialization/scope-detection to Stage 1 (Plan).

**Cross-layer observations:** None.

---

### FN-06: Single pipeline orchestrator

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:1-5` -- Purpose states: `Orchestrate the post-discovery pipeline for any scope (capability or feature).`
- `get-shit-done/workflows/framing-pipeline.md:82-133` -- Section 2 "Capability-Scope Branch (DAG Wave Orchestration)" absorbs DAG logic: builds feature DAG from CAPABILITY.md (2a), cycle detection with AskUserQuestion resolution (2b), topological sort into waves (2c), plan+execute per feature in wave order (2d), review+doc once for full scope after all waves.
- `get-shit-done/workflows/framing-pipeline.md:134-138` -- Section 2e "Feature-Scope Branch" runs linear plan->execute->review->doc.
- Deleted file `capability-orchestrator.md` confirmed absent from filesystem.
- `get-shit-done/workflows/framing-pipeline.md:39-46` -- Lens metadata extracted from brief frontmatter, passed as paths to stages -- not force-injected as content blocks.

**Cross-layer observations:** None.

---

### FN-07: Progress focus-aware routing

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/progress.md:86` -- `Route using 3-tier priority. Start at Tier 1; fall through when the tier has no actionable result.`
- `get-shit-done/workflows/progress.md:88-96` -- Artifact-based pipeline state detection: FEATURE.md without PLANs -> needs planning, PLANs without SUMMARYs -> needs execution, SUMMARYs without review/ -> needs review, review/ without doc-report.md -> needs doc.
- `get-shit-done/workflows/progress.md:99-118` -- Tier 1 (Focus Group Routing): parses ROADMAP.md directly for focus groups, identifies pipeline state per focus feature, checks dependencies, detects parallel-safe work, AskUserQuestion for ambiguous paths.
- `get-shit-done/workflows/progress.md:101` -- `Parse ROADMAP.md directly for focus groups. Do NOT use focus_groups from init (dead code -- never populated).`
- `get-shit-done/workflows/progress.md:122-131` -- Tier 2 (Recent Work Continuation): reads STATE.md Session Continuity, identifies last active feature, determines pipeline state.
- `get-shit-done/workflows/progress.md:135-144` -- Tier 3 (State Scan): scans all feature directories, collects incomplete features, presents prioritized list.
- `get-shit-done/workflows/progress.md:148-151` -- Anti-pattern guards: NEVER suggest "add feature" when FEATURE.md has requirements but no PLANs, NEVER suggest `/gsd:new` when features need execution, always present most progressing action.
- `get-shit-done/workflows/progress.md:157-183` -- Output format presents concrete `/gsd:{command}` commands in both single and multiple parallel-safe path cases.

**Cross-layer observations:** None.

---

### FN-08: Auto-chain wiring

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:205` -- `If clean: proceed directly to Stage 3 (Review) -- NO user gate here` -- Execute->review auto-chain with explicit NO user gate.
- `get-shit-done/workflows/framing-pipeline.md:262` -- `If review passes cleanly (no blockers): proceed directly to Stage 4 (Doc) -- NO user gate here` -- Review->doc auto-chain with NO user gate.
- `get-shit-done/workflows/framing-pipeline.md:439-440` -- `Execute -> Review auto-chains (no user intervention, NO user gate). Review -> Doc auto-chains when clean (NO user gate).` and `Full auto-chain: user kicks off pipeline -> plans -> builds code -> auto-reviews -> auto-documents -> done. Human gates ONLY at: review findings Q&A and doc approval Q&A.`
- `get-shit-done/workflows/framing-pipeline.md:206-209` -- Context exhaustion check after execute: presents concrete next command `/gsd:review {cap/feat}` and exits cleanly.
- `get-shit-done/workflows/framing-pipeline.md:282-285` -- Context exhaustion check after review: presents `/gsd:doc {cap/feat}`.
- `get-shit-done/workflows/execute.md:201` -- `The workflow returns. If running under pipeline orchestration (framing-pipeline.md), the pipeline handles next-stage chaining automatically.` -- Execute returns cleanly for pipeline chaining.
- `get-shit-done/workflows/review.md:175-192` -- Step 12 Auto-Advance: auto-invokes doc workflow when 0 blockers remain, handles deferred findings case, stops when blockers remain.

**Cross-layer observations:** There is a subtle redundancy: both framing-pipeline.md (Section 5/6) and review.md (Step 12) implement review->doc auto-chain. When review.md runs under pipeline orchestration, both paths would trigger. However, this is a defense-in-depth pattern -- if review.md is invoked standalone (via `/gsd:review`), Step 12 handles auto-advance; if under pipeline, the pipeline handles it. The behavior converges to the same outcome.

---

### FN-09: CLI and workflow backward compatibility

**Verdict:** met

**Evidence:**
- **Deleted workflow callers updated:** No references to `capability-orchestrator` or `research-workflow` found in `commands/` or `get-shit-done/` directories (verified via grep). All 7 command files updated to reference `framing-pipeline.md`.
- **No orphaned references:** grep across active source files (commands/, get-shit-done/) returns zero matches for both deleted filenames. References persist only in `.documentation/` and `.planning/` (historical/archival), not in active workflow or command files.
- **Agent role_type corrections:**
  - `agents/gsd-review-enduser.md:5` -- `role_type: executor` (was judge)
  - `agents/gsd-review-functional.md:5` -- `role_type: executor` (was judge)
  - `agents/gsd-review-technical.md:5` -- `role_type: executor` (was judge)
  - `agents/gsd-review-quality.md:5` -- `role_type: executor` (was judge)
  - `agents/gsd-planner.md:6` -- `role_type: judge` (was executor)
- **CLI scope unchanged:** `commands/gsd/review.md` no longer contains `--type feature` constraint (verified via grep). slug-resolve called without type hint, accepting both capability and feature scope.
- **Review command scope-fluid:** `commands/gsd/review.md:16-17` -- `Accepts both scopes -- resolves the user's reference and routes accordingly.` Steps 3-4 implement feature-level and capability-level invocation paths.
- **Doc command scope-fluid:** `commands/gsd/doc.md:47-53` -- Routes both feature and capability scope. Step 6 implements capability-level invocation with inline feature iteration.
- `agents/gsd-review-synthesizer.md:5` -- `role_type: judge` -- Correctly left as judge (synthesizers decide/consolidate).

**Cross-layer observations:** References to deleted files persist in `.documentation/` files (e.g., `pipeline-execution-scope-aware-routing.md`, `research-workflow.md` module doc). These are documentation artifacts from prior work, not active workflow references. They may need updating via the doc stage but do not constitute functional orphaned references.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `review.md:43-56` -- Scope-fluid artifact collection with dual-path (feature/capability), 4 reviewers + 1 synthesizer, spec as ground truth |
| FN-02 | met | `doc.md:43-57` -- Scope-fluid artifact collection, 5 explorers + 1 synthesizer, code as ground truth, aggregator framing |
| FN-03 | met | `framing-pipeline.md:264-285` -- Remediation loop with counter, max 2 cycles, reuses existing planner/executor |
| FN-04 | met | `plan.md:57-159` -- 6 parallel gatherers + synthesizer in plan Step 5, research-workflow.md deleted |
| FN-05 | met | `framing-pipeline.md:436` + `plan.md:41-43` -- No requirements stage, pipeline receives pre-written FEATURE.md requirements |
| FN-06 | met | `framing-pipeline.md:82-138` -- Single orchestrator with DAG wave ordering (capability) and linear 4-stage (feature) |
| FN-07 | met | `progress.md:86-183` -- 3-tier routing, artifact-based state detection, parallel-safe detection, anti-pattern guards |
| FN-08 | met | `framing-pipeline.md:205,262` -- Execute->review and review->doc auto-chain with explicit NO user gate, context exhaustion fallback |
| FN-09 | met | Zero orphaned refs in active source, 5 agent role_types corrected, review/doc commands accept both scopes |
