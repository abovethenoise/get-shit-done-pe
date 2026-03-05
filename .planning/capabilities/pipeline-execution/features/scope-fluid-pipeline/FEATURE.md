---
type: feature
capability: "pipeline-execution"
status: specified
created: "2026-03-05"
---

# scope-fluid-pipeline

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | specified |
| EU-02 | - | - | - | - | - | specified |
| EU-03 | - | - | - | - | - | specified |
| FN-01 | - | - | - | - | - | specified |
| FN-02 | - | - | - | - | - | specified |
| FN-03 | - | - | - | - | - | specified |
| FN-04 | - | - | - | - | - | specified |
| FN-05 | - | - | - | - | - | specified |
| FN-06 | - | - | - | - | - | specified |
| FN-07 | - | - | - | - | - | specified |
| FN-08 | - | - | - | - | - | specified |
| TC-01 | - | - | - | - | - | specified |
| TC-02 | - | - | - | - | - | specified |
| TC-03 | - | - | - | - | - | specified |
| TC-04 | - | - | - | - | - | specified |
| TC-05 | - | - | - | - | - | specified |
| TC-06 | - | - | - | - | - | specified |
| EU-04 | - | - | - | - | - | specified |
| FN-09 | - | - | - | - | - | specified |
| TC-07 | - | - | - | - | - | specified |
| TC-08 | - | - | - | - | - | specified |

## End-User Requirements

### EU-01: Scope-fluid pipeline entry

**Story:** As a GSD user, I want to enter the pipeline at any scope (capability or feature) from any command (/plan, /execute, /review, /doc, or framing lenses), so that I don't have to manually decompose work before the pipeline can run.

**Acceptance Criteria:**

- [ ] Slug-resolve determines scope (capability or feature) at entry
- [ ] Pipeline adapts behavior based on resolved scope
- [ ] All existing commands continue to accept both capability and feature references

**Out of Scope:**

- Changing how slug-resolve works (already handles both scopes)

### EU-02: Autonomous pipeline progression

**Story:** As a GSD user, I want the pipeline to auto-chain from plan through doc without manual handoffs, so that I only intervene at decision points that require my judgment.

**Acceptance Criteria:**

- [ ] Plan finalization triggers execute automatically
- [ ] Execute completion triggers review automatically
- [ ] Review completion (no blockers) triggers doc automatically
- [ ] Human gates exist only at: review findings Q&A, doc approval Q&A
- [ ] Auto-chain works when context allows (no forced /clear between stages)

**Out of Scope:**

- Forcing continuation when context window is exhausted

### EU-03: Focus-aware progress routing

**Story:** As a GSD user, I want progress to understand my focus groups and recent work, and suggest concrete next commands, so that I always know what to do next without getting unhelpful suggestions.

**Acceptance Criteria:**

- [ ] Progress identifies active focus groups when they exist
- [ ] Falls back to recent work continuation, then state scan when no focus groups
- [ ] Presents concrete `/gsd:*` commands as next steps
- [ ] Asks user when ambiguous (multiple parallel-safe paths)
- [ ] Never suggests "add feature" or "discuss features" when planning/execution is the next step

**Out of Scope:**

- Changing focus group creation or management

## Functional Requirements

### FN-01: Scope-fluid review

**Receives:** Execution scope (capability or feature) + all SUMMARY.md and FEATURE.md artifacts within that scope

**Returns:** synthesis.md with findings across the full execution scope

**Behavior:**

- 4 reviewers (enduser, functional, technical, quality) each receive the full execution-scope artifact list
- 1 synthesizer consolidates findings across the entire scope
- Scope inferred from SUMMARY.md presence in feature directories (no new manifest)
- Code review ground truth: spec (FEATURE.md requirements)
- Code aggregator detects: cross-scope state conflicts, interface contract violations, conflicting assumptions, spec coverage gaps in implementation

### FN-02: Scope-fluid doc

**Receives:** Execution scope + review synthesis + all code within scope

**Returns:** doc-report.md with recommendations across the full execution scope

**Behavior:**

- 5 explorers (code-comments, module-flow, standards, config, friction) each see full scope
- 1 synthesizer consolidates recommendations
- Doc review ground truth: code (what was actually built)
- Doc aggregator detects: terminology inconsistency, orphaned docs, update priority order
- Approved recommendations executed by doc writer agents

### FN-03: Review remediation loop

**Receives:** Accepted findings from review Q&A

**Returns:** Remediation PLAN.md(s) executed and re-reviewed

**Behavior:**

- Accepted findings fed to existing planner to produce remediation PLAN.md
- Remediation plans can be parallel-safe DAG (like regular execution)
- Executed via existing executor
- Re-review at execution scope level (max 2 cycles)
- Uses existing planning and execution patterns, no new artifacts

### FN-04: Research absorbed into plan

**Receives:** Requirements from FEATURE.md + brief context

**Returns:** RESEARCH.md + PLAN.md (research feeds directly into planning)

**Behavior:**

- Plan stage spawns 6 parallel research gatherers + synthesizer (all 6, always)
- Research output used immediately by planner (no separate handoff)
- Single stage replaces the current research stage + plan stage sequence

### FN-05: Requirements from discussion

**Receives:** User input during discuss-capability or discuss-feature

**Returns:** EU/FN/TC requirements written to FEATURE.md

**Behavior:**

- discuss-feature produces requirements (already exists)
- Pipeline no longer has a requirements generation stage
- Pipeline receives scope + requirements as input from upstream discussion
- Discovery/discussion are separate workflows with clean handoff contract to pipeline

### FN-06: Single pipeline orchestrator

**Receives:** Scope (capability or feature) + requirements + brief

**Returns:** Planned, executed, reviewed, documented work

**Behavior:**

- framing-pipeline.md absorbs capability-orchestrator DAG logic
- Capability scope: build DAG from CAPABILITY.md, plan+execute per feature in wave order, then review+doc once for full scope
- Feature scope: plan → execute → review → doc
- Lens available from brief frontmatter, referenced where useful by stages, not force-injected as large context blocks

### FN-07: Progress focus-aware routing

**Receives:** Project state (STATE.md, ROADMAP.md, focus groups, capability/feature statuses)

**Returns:** Prioritized next-action suggestions with concrete commands

**Behavior:**

- Primary: read active focus groups, identify next actionable item per focus
- Detect parallel-safe work across focuses
- If ambiguous: ask user which focus to advance
- If clear: present concrete commands
- Fallback (no focus groups): recent work continuation from STATE.md session data, then state scan across all capabilities/features
- Route based on artifact presence: SUMMARYs without review → review, PLANs without SUMMARYs → execute, specified without PLANs → plan

### FN-08: Auto-chain wiring

**Receives:** Stage completion signal

**Returns:** Next stage invocation (or user prompt if context exhausted)

**Behavior:**

- Plan finalization → execute (automatic)
- Execute completion → review (automatic, fix the current wiring where execute.md terminates instead of returning to pipeline)
- Review completion (no blockers) → doc (automatic)
- Human gates at review findings Q&A and doc approval Q&A
- If context window is exhausted, present next command for user to run in fresh context

### EU-04: No CLI breakage

**Story:** As a GSD user, I want all my existing CLI commands and workflows to continue working after this refactor, so that the fluid scope changes don't break my current tooling.

**Acceptance Criteria:**

- [ ] All gsd-tools CLI routes pass smoke test (valid JSON, no crashes)
- [ ] All 13 slash commands fire without error
- [ ] Feature-scope and capability-scope commands both work
- [ ] Existing project artifacts (.planning/, CAPABILITY.md, FEATURE.md) remain compatible

**Out of Scope:**

- Adding new CLI routes

### FN-09: CLI and workflow backward compatibility

**Receives:** Any existing gsd-tools CLI call or slash command invocation

**Returns:** Same output format and behavior as before refactor

**Behavior:**

- CLI routes that accept feature scope continue unchanged
- CLI routes that accept capability scope continue unchanged
- Deleted workflows (capability-orchestrator, research-workflow) have their callers updated to use the consolidated paths
- No orphaned references to deleted files
- Agent frontmatter role_type corrected to match actual model usage (4 reviewers: judge→executor, planner: executor→judge)

## Technical Specs

### TC-01: Delete capability-orchestrator.md

**Intent:** Eliminate orchestration duplication. DAG logic absorbed into framing-pipeline.md.

**Upstream:** Framing commands and /gsd:plan currently route to orchestrator for capability scope.

**Downstream:** framing-pipeline.md handles all orchestration.

**Constraints:**

- DAG wave ordering logic must be preserved in framing-pipeline.md
- Cycle detection and user resolution must survive

### TC-02: Delete research-workflow.md

**Intent:** Research is no longer a separate stage. Absorbed into plan.md.

**Upstream:** framing-pipeline.md Stage 1 currently invokes research-workflow.md.

**Downstream:** plan.md owns the full research + plan flow.

**Constraints:**

- 6 parallel gatherers + synthesizer pattern preserved inside plan.md
- Research output (RESEARCH.md) format unchanged

### TC-03: Remove framing-pipeline Stage 2 (requirements generation)

**Intent:** Requirements come from discuss-feature, not auto-generated in the pipeline.

**Upstream:** Discovery brief currently feeds into requirements auto-generation.

**Downstream:** Pipeline receives pre-written requirements in FEATURE.md.

**Constraints:**

- FEATURE.md format unchanged
- EU/FN/TC structure unchanged

### TC-04: Remove per-feature review/doc loops

**Intent:** Review and doc run once at execution scope, not per-feature.

**Upstream:** framing-pipeline.md currently loops review+doc per feature.

**Downstream:** Single review + single doc invocation per pipeline run.

**Constraints:**

- review.md and doc.md workflow internals unchanged (they already process artifact lists)
- Only the invocation pattern changes (what artifact list they receive)

### TC-05: Relax review/doc command scope constraints

**Intent:** /gsd:review and /gsd:doc should accept capability scope, not just feature scope.

**Upstream:** Command files currently force `--type feature` on slug-resolve.

**Downstream:** review.md and doc.md receive capability-scope artifact lists.

**Constraints:**

- review.md and doc.md must handle both single-feature and multi-feature artifact lists
- Agent definitions unchanged (already scope-agnostic per research findings)

### TC-07: CLI smoke test pass

**Intent:** All existing gsd-tools CLI routes must continue to work after refactor.

**Upstream:** Workflow changes may alter how CLI routes are called or what arguments they receive.

**Downstream:** Every command, workflow, and agent that calls gsd-tools.

**Constraints:**

- All existing CLI routes return valid JSON (no crashes, no unhandled errors)
- Routes that accept feature scope continue to work
- Routes that accept capability scope continue to work
- No new CLI routes required

### TC-08: Enforce correct role-to-model mapping

**Intent:** Every agent's frontmatter role_type must match its actual function, and every workflow model= parameter must align with ROLE_MODEL_MAP. No agent should run on the wrong model tier.

**Upstream:** ROLE_MODEL_MAP in core.cjs: executor→sonnet, judge→inherit (Opus), quick→haiku.

**Downstream:** Every Task() spawn in every workflow. Any future tooling that reads role_type.

**Constraints:**

- Executors (do work, produce artifacts): researchers, doc explorers, code reviewers, executor, doc writers → role_type: executor, model="sonnet"
- Judges (synthesize, decide, plan): planner, plan-checker, synthesizers, verifier → role_type: judge, model="inherit"
- Fix mismatches: 4 reviewer agents role_type judge→executor, gsd-planner role_type executor→judge
- Every workflow Task() call must use model= consistent with the agent's role_type
- Verify all 18 agents and all workflow Task() calls align after refactor

### TC-06: No net line increase

**Intent:** This is a consolidation refactor. Total lines across modified files must not increase.

**Upstream:** N/A — constraint on the refactor itself.

**Downstream:** N/A.

**Constraints:**

- Deletions (orchestrator, research-workflow, Stage 2, per-feature loops) must offset any additions
- No new files created
- No new artifacts or manifests introduced

## Decisions

- Model mapping cleanup: fix agent frontmatter role_type mismatches (4 reviewers say judge→should be executor, planner says executor→should be judge). Workflows already use correct models.
- Pipeline stage reordering: requirements come from discussion (upstream), research absorbed into plan. Pipeline stages are: plan → execute → review → doc.
- Scope detection: inferred from SUMMARY.md presence in feature directories. No new manifest artifact.
- Remediation: accepted review findings → existing planner → remediation PLAN.md → existing executor. Reuses existing patterns.
- Orchestrator merge: framing-pipeline absorbs capability-orchestrator (pipeline is the larger, more detailed file).
- Lens passing: available from brief frontmatter, stages reference it where useful. Not force-injected as large context blocks.
- Discovery/discussion: remain separate workflows. Clean handoff contract to pipeline (scope + requirements + brief).
- Tech-debt backlog: dropped. Simplification over additional artifacts.
