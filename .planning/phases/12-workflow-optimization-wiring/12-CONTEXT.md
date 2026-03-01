# Phase 12: Workflow Optimization & Wiring - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix B1-B3 blockers, wire all v2 flows (new project, brownfield, after-start), establish capability/feature lifecycle, simplify ROADMAP.md model, and clean all remaining v1 terminology and dead code. After this phase, the full v2 pipeline works end-to-end.

</domain>

<decisions>
## Implementation Decisions

### Init detect/branch/converge
- Single entry point for both new and brownfield projects
- **Detection signal:** has source code files (not just .planning/ existence)
- **New project flow:** Project Q&A (goals, tech stack, architecture, brand/style) -> scaffolding -> Capabilities Q&A (all potential capabilities at high level) -> .planning/ with initial capabilities list
- **Brownfield flow:** Deep codebase scan -> suggest capabilities + features -> abbreviated Q&A (user confirms/corrects scan findings, adds goals/standards) -> user confirms capabilities + features -> auto-generate .documentation/ (architecture.md, domain.md, mapping.md, plus capability flow/module docs) -> user confirms documentation -> write everything
- **Convergence point:** Both paths produce PROJECT.md + capabilities defined + .planning/ populated + STATE.md + ROADMAP.md
- STATE.md and ROADMAP.md created during init (fixes B2)
- New projects: .documentation/ seeded from Q&A answers but without extensive capability module/flow docs (none exist yet)
- Brownfield: .documentation/ seeded with full capability flow/module docs from scan (after user confirmation)

### Capability -> feature bridge
- `/gsd:new <cap>` creates CAPABILITY.md (stub)
- Discuss capability enhances CAPABILITY.md + creates initial FEATURE.md stubs (features discovered during discussion)
- Discuss feature enhances specific FEATURE.md in depth
- User controls how deep they go before triggering pipeline — can jump to research/plan after discussing capability or go deeper into individual features first
- **CAPABILITY.md holds:** what + why + feature list + priority order + cross-feature constraints. No requirements.
- **FEATURE.md holds:** 3-layer requirements (end-user, functional, technical). This is where planning consumes.
- No capability-level requirements — avoids sync problem. Capability = WHAT and WHY, Feature = specific HOW.
- Planning is adaptable: plan a capability (all features together) or plan a single feature
- Capability-level plan creates DAG of features with dependencies
- Execution is per-feature in waves, parallel where DAG allows

### Directory structure
```
.planning/capabilities/<cap>/
  CAPABILITY.md
  features/
    <feat>/
      FEATURE.md
      DISCOVERY-BRIEF.md
      RESEARCH.md
      01-PLAN.md
      01-SUMMARY.md
```
Each feature is a self-contained unit with full pipeline history.

### Pipeline stage rewiring (B1 fix)
- **Pure v2, drop v1.** Rewrite plan/execute/review/doc to only call feature-level routes. v1 phase system is dead. Clean break.
- Keep separate workflow files (plan.md, execute.md, review.md, doc.md). framing-pipeline.md orchestrates.
- Pipeline passes **feature only** (not cap + feature). Stages derive capability from feature's directory path.
- **Capability orchestrator:** Thin orchestrator reads CAPABILITY.md, gets prioritized feature list, calls framing-pipeline for each feature in order. Same pattern as execute-phase dispatching plans.
- **Single entry point:** `/gsd:<lens> <slug>` (e.g., `/gsd:new mistake-detection`). 3-tier slug resolution determines whether the input resolves to a capability or feature. If capability, capability orchestrator handles it. If feature, framing-pipeline runs directly. User doesn't need to specify which — the system figures it out.

### Slug resolution (3-tier)
- **Exact match** -> route directly (`/new mistake-detection`)
- **Wildcard match** -> fuzzy match (`/new mistake` -> mistake-detection)
- **LLM interpret** -> Claude interprets intent (`/new find errors in my play` -> asks if ambiguous)
- Steps 1-2 in CLI route, step 3 falls through to workflow
- Applies to both capability AND feature slug matching
- **Lens is always explicit** via command: /new, /debug, /enhance, /refactor
- Only exception: brownfield init auto-selects "enhance" lens

### Pipeline stage transitions

**Requirements -> Plan: Always user-initiated.**
- User details out many features in parallel, starts planning/building in separate terminals. Each terminal is a "team."
- No auto-advance. User runs `/gsd:plan <feature>` when ready.
- This enables the parallel workflow pattern: Terminal 1 plans feature A while Terminal 2 discusses feature B while Terminal 3 executes feature C.

**Plan stage (full sequence):**
- Research (6 gatherers + 1 synthesizer) -> Draft plan -> Self-validate (plan-checker) -> Surface assumptions, gaps, questions for Q&A with user -> Loop (refine based on answers, re-validate if needed) -> Finalize
- Assumptions surfacing uses existing list-phase-assumptions pattern, adapted for features
- Single plan per feature (if too big, feature should be split)
- Capability-level planning: plans all features together, creates DAG with dependencies

**Plan -> Execute: User-initiated.**
- `/gsd:execute <feature>` kicks off execution
- Capability-level execution: per-feature in waves, parallel where DAG allows

**Execute -> Review: Auto-chains.**
- Review = code review + requirements verification against FEATURE.md 3-layer requirements (EU/FN/TC)
- Surfaces gaps and issues
- Human checkpoint: if issues found, Q&A with user for fix decisions -> fix -> continue
- If clean: auto-continues to doc

**Review -> Document: Auto-chains.**
- Updates `.documentation/` files: architecture.md, domain.md, mapping.md
- Updates capability-specific module and flow documentation
- Uses existing gsd-doc-writer.md agent with 3-pass self-validation (structural compliance -> referential integrity -> gate consistency)
- Section ownership model: [derived] sections regenerated from code, [authored] sections preserved
- Strict heading templates for grep consistency (from Phase 5 DOCS-01/02/03)
- Module docs before flow docs (8% truthfulness improvement)
- Human checkpoint: surfaces documentation changes for user confirmation before writing

**Full auto-chain:** User kicks off execute once -> builds code -> auto-reviews against requirements -> auto-documents -> done. Only pauses for human decisions (fix Q&A, doc confirmations).

### State & roadmap model
- **STATE.md tracks:** Active focus group, active capability + feature within focus, current plan, key decisions from discovery, blockers
- **Focus group:** Bundle of capabilities/features for a sprint. Created via `/gsd:focus` command with Q&A (goals, priority caps/features) -> quick dependency ordering -> ROADMAP.md update.
- **Focus group concurrency:** `/gsd:focus` evaluates overlap — overlapping dependencies merge into existing focus (reprioritize), independent workstreams create parallel focus groups. Quick inline scan (mgrep + read FEATURE.md files for shared file paths), surface findings to user, user confirms/overrides.
- **Multiple active focus groups:** STATE.md tracks each with own current feature and plan progress. Resume asks which to pick up.
- **ROADMAP.md simplified:** Focus groups with ordered items, goal, dependency info, status checkboxes. No success criteria or requirement mappings (those live in FEATURE.md). Light sequencing scaffold.
```markdown
## Active Focus: Coaching Foundation
### Goal
Surface mistakes and grade decisions for a single user session.
### Priority Order
1. coaching/mistake-detection -> depends: none
2. coaching/grading -> depends: mistake-detection
3. coaching/session-summary -> depends: grading
### Status
- [x] coaching/mistake-detection (complete)
- [ ] coaching/grading (in progress)
- [ ] coaching/session-summary (not started)
```

### Final cleanup (last step of Phase 12)
- Full sweep of v1 terminology: "Phase", "Milestone", "Plan" references not related to v2 changes
- Dead code / orphan audit and cleanup
- Clean break before Phase 13 E2E testing

### Claude's Discretion
- Exact CLI route names and argument shapes for new v2 routes
- Internal data structures for DAG representation
- How plan-checker self-validation adapts from phase to feature scope
- Implementation order of sub-tasks within this phase

</decisions>

<specifics>
## Specific Ideas

- "Every terminal window is a team" — the user runs multiple features through different pipeline stages in parallel terminals
- 3-step detect/branch/converge pattern for init (not a complex decision tree)
- Focus groups are the v2 replacement for milestones — lightweight sequencing, not heavyweight project management
- Documentation requirements from Phase 5 (DOCS-01/02/03) define the doc agent behavior: reflect-and-write, 3-pass validation, section ownership tags [derived]/[authored], strict heading templates for grep consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-workflow-optimization-wiring*
*Context gathered: 2026-03-01*
