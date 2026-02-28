# Phase 3: Planning Pipeline - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

The planner agent drafts plans with full requirement traceability, self-critiques its own work through a structured loop, and gets explicit user confirmation before finalizing. Covers PLAN-01 through PLAN-04, REQS-03, and REQS-04.

Research, execution, review, and documentation are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Self-critique loop
- Primary focus: **coverage gaps** (does every REQ have a task? does every task have a REQ?)
- Fix obvious gaps silently (missing REQ coverage → auto-add task)
- Surface ambiguous issues to user (REQ interpretable multiple ways, approach assumptions)
- Flag implementation assumptions the planner made (e.g., "assumed sync not async") — prevents silent wrong turns
- Hard stop at 2 rounds of self-critique
- After round 2, any remaining unresolved issues are surfaced to user — planner does not make judgment calls on leftovers

### User Q&A format
- Findings presented **one-at-a-time**, not batched
- Three response options per finding:
  - **Accept** — planner's suggestion is good
  - **Direct Feedback** (freeform) — user tells planner what to change
  - **Additional Research Guidance** (freeform) — user points planner toward what to investigate
- Research guidance flow: research → revise → if finding resolved, move silently to next; if new gaps/assumptions surface, add them to the finding queue
- Plan finalized via **explicit "Finalize this plan?" confirmation** after all findings resolved — no auto-finalize

### Traceability mechanics
- Traceability table lives at **top of FEATURE.md** — single hub updated by each pipeline stage
- Table columns: `| REQ | Research | Plan | Execute | Review | Docs | Status |`
- Empty cell = gap at that stage
- Status column for overall verdict per REQ

### CLI validation (gsd plan validate)
- Three-way validation, run after plan is written:
  - **ERROR: orphan task** — task has no REQ reference
  - **WARNING: uncovered REQ** — REQ in FEATURE.md has no task in PLAN.md
  - **ERROR: phantom reference** — task references a REQ ID that doesn't exist in FEATURE.md
- Errors block finalization. Warnings surface in self-critique.
- **ERROR: cross-layer mixing** — task references both EU and TC layer REQs. Must split or bridge through FN.
  - Rationale: EU verified via UI/integration review, TC verified against code. Mixing = two verification methods for one artifact = trace table lies about coverage.

### Plan task structure
- Five fields per task, each preventing a specific failure mode:
  - **REQs** — pointers to requirement specs (prevents orphan work, scope creep)
  - **Artifact** — exact file path to create/modify (prevents wrong file, wrong location)
  - **Inputs** — upstream artifacts with key columns/shape (prevents wrong data dependencies — Sonnet's #1 error class)
  - **Done** — observable exit condition (prevents gold-plating and under-building)
  - **Title** — what the task does
- Intentionally omitted: steps/substeps (let executor decide how), implementation notes (that's the technical spec), priority/order (structural), estimates (executor doesn't use), dependencies (implicit from Inputs)
- Task granularity: **one atomic commit** per task
- Tasks organized in **wave-based grouping** — wave 1 runs in parallel, wave 2 depends on wave 1, etc.

### Pipeline prerequisites
- Planner **requires RESEARCH.md** to exist before starting — no inline research, no --skip-research
- Strict pipeline order: research → plan → execute → review → docs

### Claude's Discretion
- Self-critique prompt wording and structure
- How to present wave groupings visually in the plan
- Internal data structures for tracking findings during the Q&A loop

</decisions>

<specifics>
## Specific Ideas

- Task schema optimized for Sonnet execution: "REQs are pointers to specs, Artifact eliminates path guessing, Inputs short-circuits the most common code error class (wrong data shapes), Done scopes the work"
- CLI validation modeled after linter output: `gsd plan validate --feature grade-actions` with clear error/warning messages and fix suggestions
- Cross-layer enforcement example: "EU + TC in one task = two verification methods for one artifact = reviewer can't fully assess it = trace table lies about coverage"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-planning-pipeline*
*Context gathered: 2026-02-28*
