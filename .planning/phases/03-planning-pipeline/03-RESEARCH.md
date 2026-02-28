# Phase 3: Planning Pipeline - Research

**Researched:** 2026-02-28
**Domain:** Meta-prompting planner agent, CLI validation, traceability enforcement
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing v1 planner agent and plan-phase workflow into a v2 system with three new capabilities: (1) a new task schema where each task carries REQs, Artifact, Inputs, Done fields instead of the v1 `<task>` XML structure, (2) a self-critique loop (max 2 rounds) that catches coverage gaps and surfaces assumptions before the user sees the plan, and (3) a `gsd plan validate` CLI command that enforces orphan-task, uncovered-REQ, phantom-reference, and cross-layer-mixing rules. The traceability table already exists in FEATURE.md template (created Phase 1) -- Phase 3 wires it into the planning pipeline so the planner populates Plan column cells when writing plans.

All artifacts in this phase are markdown agent definitions, markdown workflow updates, and Node.js CLI code in `gsd-tools.cjs` ecosystem. No new libraries. No new dependencies. The work is structural: reshaping how the planner thinks and validating what it produces.

**Primary recommendation:** Build the CLI validator first (it has no dependencies), then update the planner agent definition, then wire the self-critique and Q&A loop into the plan-phase workflow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Primary focus: **coverage gaps** (does every REQ have a task? does every task have a REQ?)
- Fix obvious gaps silently (missing REQ coverage -> auto-add task)
- Surface ambiguous issues to user (REQ interpretable multiple ways, approach assumptions)
- Flag implementation assumptions the planner made (e.g., "assumed sync not async") -- prevents silent wrong turns
- Hard stop at 2 rounds of self-critique
- After round 2, any remaining unresolved issues are surfaced to user -- planner does not make judgment calls on leftovers
- Findings presented **one-at-a-time**, not batched
- Three response options per finding: Accept, Direct Feedback (freeform), Additional Research Guidance (freeform)
- Research guidance flow: research -> revise -> if finding resolved, move silently to next; if new gaps/assumptions surface, add them to the finding queue
- Plan finalized via **explicit "Finalize this plan?" confirmation** after all findings resolved -- no auto-finalize
- Traceability table lives at **top of FEATURE.md** -- single hub updated by each pipeline stage
- Table columns: `| REQ | Research | Plan | Execute | Review | Docs | Status |`
- Empty cell = gap at that stage
- Status column for overall verdict per REQ
- CLI validation (gsd plan validate):
  - ERROR: orphan task -- task has no REQ reference
  - WARNING: uncovered REQ -- REQ in FEATURE.md has no task in PLAN.md
  - ERROR: phantom reference -- task references a REQ ID that doesn't exist in FEATURE.md
  - ERROR: cross-layer mixing -- task references both EU and TC layer REQs
  - Errors block finalization. Warnings surface in self-critique.
- Five fields per task: REQs, Artifact, Inputs, Done, Title
  - REQs -- pointers to requirement specs
  - Artifact -- exact file path to create/modify
  - Inputs -- upstream artifacts with key columns/shape
  - Done -- observable exit condition
  - Title -- what the task does
- Intentionally omitted from tasks: steps/substeps, implementation notes, priority/order, estimates, dependencies
- Task granularity: **one atomic commit** per task
- Tasks organized in **wave-based grouping**
- Planner **requires RESEARCH.md** to exist before starting
- Strict pipeline order: research -> plan -> execute -> review -> docs

### Claude's Discretion
- Self-critique prompt wording and structure
- How to present wave groupings visually in the plan
- Internal data structures for tracking findings during the Q&A loop

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | Planner drafts plan with tasks referencing REQ IDs across all 3 requirement layers | New task schema (REQs/Artifact/Inputs/Done/Title) in planner agent; v2 PLAN.md format |
| PLAN-02 | System self-critique challenges draft on: requirement coverage, approach validity, execution feasibility, and surfaces assumptions needing human guidance | Self-critique loop section in planner agent definition; 2-round cap; finding categories |
| PLAN-03 | Self-critique findings presented to user as Q&A -- user provides feedback/guidance before finalization | Q&A flow in plan-phase workflow; one-at-a-time presentation; 3 response options |
| PLAN-04 | Plan finalized only after user confirms -- no auto-finalize | Explicit "Finalize this plan?" gate in plan-phase workflow |
| REQS-03 | Zero-orphan-task enforcement -- every plan task must reference at least one REQ ID | `gsd plan validate` CLI command -- ERROR: orphan task |
| REQS-04 | Traceability table mapping every REQ ID through plan -> execution -> review -> documentation | Traceability table in FEATURE.md (exists); planner populates Plan column; validator checks coverage |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js stdlib (fs, path) | 22.x | File I/O for CLI validator | Zero-dep policy from PROJECT.md |
| js-yaml | 4.1.1 | YAML frontmatter parsing in PLAN.md files | Already installed (Phase 1, FOUND-03) |

### Supporting
No new libraries needed. All work is markdown agent definitions + Node.js CLI code using existing patterns.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom regex-based PLAN.md parser | AST parser (remark/unified) | Overkill -- PLAN.md structure is fixed XML; regex + frontmatter.cjs handles it |
| JSON schema validation for tasks | Custom field checks | JSON schema adds a dependency; 5 fields with simple presence checks is trivial |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Current v1 Architecture (What Exists)

```
plan-phase.md workflow
    |
    +-- spawns gsd-phase-researcher (Task agent)
    |       writes: {phase}-RESEARCH.md
    |
    +-- spawns gsd-planner (Task agent)
    |       reads: RESEARCH.md, CONTEXT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md
    |       writes: {phase}-NN-PLAN.md files
    |
    +-- spawns gsd-plan-checker (Task agent, up to 3 revision iterations)
            reads: PLAN.md files, ROADMAP.md, REQUIREMENTS.md
            returns: VERIFICATION PASSED or ISSUES FOUND
```

**v1 PLAN.md task format (current):**
```xml
<task type="auto">
  <name>Task 1: [Action-oriented name]</name>
  <files>path/to/file.ext</files>
  <action>[Specific implementation]</action>
  <verify>[Command or check]</verify>
  <done>[Acceptance criteria]</done>
</task>
```

### v2 Architecture (What Changes)

```
plan-phase.md workflow (MODIFIED)
    |
    +-- spawns gsd-phase-researcher (unchanged)
    |       writes: {phase}-RESEARCH.md
    |
    +-- spawns gsd-planner (MODIFIED agent definition)
    |       reads: RESEARCH.md, CONTEXT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md, FEATURE.md
    |       writes: {phase}-NN-PLAN.md files (v2 task format)
    |       INTERNAL: self-critique loop (2 rounds max)
    |           round 1: check coverage, fix obvious gaps silently
    |           round 2: re-check, surface remaining issues
    |       RETURNS: plan + findings list (if any)
    |
    +-- workflow presents findings one-at-a-time to user (NEW)
    |       user: Accept | Feedback | Research Guidance
    |       loop until all findings resolved
    |
    +-- runs gsd plan validate (NEW CLI command)
    |       ERROR: orphan task, phantom reference, cross-layer mixing
    |       WARNING: uncovered REQ
    |       errors block finalization
    |
    +-- explicit "Finalize this plan?" confirmation (NEW)
    |
    +-- spawns gsd-plan-checker (may be adjusted but not primary scope)
```

**v2 PLAN.md task format (new):**
```xml
<task>
  <title>Create frontmatter validation for v2 task schema</title>
  <reqs>REQS-03, PLAN-01</reqs>
  <artifact>get-shit-done/bin/lib/verify.cjs</artifact>
  <inputs>
    - PLAN.md frontmatter (parsed by frontmatter.cjs) -> requirements field, task XML
    - FEATURE.md -> REQ ID list from trace table
  </inputs>
  <done>gsd plan validate returns 0 errors for a well-formed plan</done>
</task>
```

### Pattern 1: Self-Critique as Internal Planner Loop

**What:** The planner runs a self-critique pass after drafting, before returning to the orchestrator. This is NOT a separate agent spawn -- it is instructions within the planner agent definition telling it to review its own output.

**When to use:** Always, after initial plan draft is complete.

**Rationale:** Spawning a separate self-critique agent would double context cost and add orchestration complexity. The planner already has full context (RESEARCH.md, REQUIREMENTS.md, FEATURE.md). The critique is about coverage/completeness, which the same context enables.

**Structure in planner agent:**
```
<self_critique>
## After Drafting: Self-Critique (2 rounds max)

### Round 1 — Fix Silently
For each requirement in FEATURE.md:
  - Is there a task with this REQ in its <reqs>? If no -> add a task.
For each task:
  - Does every REQ in <reqs> exist in FEATURE.md? If no -> remove reference.
  - Does <artifact> specify an exact file path? If no -> fix it.
  - Does <inputs> name specific upstream artifacts? If no -> fix it.

### Round 2 — Surface Issues
Re-scan after Round 1 fixes. For remaining issues:
  - REQ interpretable multiple ways -> add to findings
  - Assumed approach without explicit requirement -> add to findings
  - Input data shape unclear -> add to findings
Each finding = { category, description, suggestion, reqs_affected }

### Hard Stop
After Round 2, return plan + findings list.
Do not attempt Round 3. Do not resolve ambiguous findings.
</self_critique>
```

### Pattern 2: Q&A Loop in Workflow (Not Agent)

**What:** The plan-phase workflow (not the planner agent) handles the Q&A loop. The planner returns a plan + findings. The workflow presents findings one at a time and handles user responses.

**Rationale:** The planner agent runs in a Task subagent -- it cannot interact with the user. Only the orchestrating workflow (which runs in the main conversation) can present questions and receive answers. This is already the pattern used for checkpoint tasks.

**Flow:**
```
planner returns: { plan_files: [...], findings: [...] }
    |
    for each finding in findings:
    |   present to user with 3 options
    |   if Accept -> mark resolved, next
    |   if Feedback -> apply to plan, re-validate, next
    |   if Research -> research, revise, check for new findings
    |       if new findings -> add to queue
    |       if finding resolved -> next
    |
    all findings resolved ->
    run gsd plan validate ->
    if errors -> show, require fixes, re-validate ->
    "Finalize this plan?" -> user confirms -> done
```

### Pattern 3: CLI Validator as Linter

**What:** `gsd plan validate` reads PLAN.md files and FEATURE.md, cross-references REQ IDs, and produces structured output.

**Rationale:** Validation must be deterministic and reproducible. An AI agent re-reading plans would be non-deterministic. A CLI command is fast, reliable, and can be run multiple times.

**Implementation pattern (follows existing verify.cjs conventions):**
```javascript
function cmdPlanValidate(cwd, featurePath, planPaths, raw) {
  const errors = [];
  const warnings = [];

  // 1. Parse FEATURE.md trace table -> set of valid REQ IDs
  // 2. For each PLAN.md:
  //    a. Extract <reqs> from each <task>
  //    b. Check: orphan task (no REQs) -> ERROR
  //    c. Check: phantom reference (REQ not in FEATURE.md) -> ERROR
  //    d. Check: cross-layer mixing (EU + TC in same task) -> ERROR
  // 3. Check: uncovered REQ (REQ in FEATURE.md not in any task) -> WARNING

  output({ errors, warnings, passed: errors.length === 0 }, raw);
}
```

### Anti-Patterns to Avoid

- **Separate self-critique agent:** Don't spawn a second agent for critique. The planner has all context needed. A separate agent would double context cost with no gain.
- **Batching findings:** CONTEXT.md explicitly says one-at-a-time. Don't present a table of findings and ask "which do you want to address?"
- **Auto-finalize after clean validation:** Even if `gsd plan validate` passes and all findings are resolved, the user must explicitly confirm finalization.
- **Embedding validation logic in the agent prompt:** Validation rules must be in CLI code, not in the agent prompt. Agent prompts are non-deterministic -- validation must be deterministic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex parser | `frontmatter.cjs` (extractFrontmatter) | Already handles PLAN.md frontmatter; battle-tested in Phase 1 |
| REQ ID extraction from FEATURE.md | Ad-hoc string parsing | Regex on trace table rows | Trace table format is fixed (`\| REQ-ID \| Layer \| ...`) -- simple regex is correct tool |
| Task XML parsing from PLAN.md | Full XML parser | Targeted regex on `<task>`/`<reqs>` | PLAN.md XML is not arbitrary -- it follows a fixed schema with known tags |
| Finding queue during Q&A | Custom data structure | Simple array with index pointer | Findings are processed sequentially one-at-a-time; array + index is sufficient |

**Key insight:** This phase is about plumbing, not computation. The hard problem is getting the right information to flow between the right components at the right time. The actual validation logic is trivial string matching.

## Common Pitfalls

### Pitfall 1: Traceability Table Column Mismatch

**What goes wrong:** CONTEXT.md specifies `| REQ | Research | Plan | Execute | Review | Docs | Status |` but the existing FEATURE.md template has `| REQ ID | Layer | Status | Plan | Review | Docs |`. These schemas differ.

**Why it happens:** The CONTEXT.md decisions were made during discussion without cross-referencing the existing template.

**How to avoid:** The v2 FEATURE.md template must be updated to match the CONTEXT.md column spec. The planner must read the actual FEATURE.md file (not assume a format). The validator must parse whatever column format exists.

**Warning signs:** If the planner references columns that don't exist in the template, or the validator can't find the Plan column.

### Pitfall 2: Cross-Layer Mixing Detection

**What goes wrong:** The validator needs to determine which "layer" a REQ ID belongs to (EU, FN, TC). If the FEATURE.md uses the convention EU-01, FN-01, TC-01, this is trivial. But if REQ IDs in REQUIREMENTS.md use a different scheme (like PLAN-01, REQS-03), the layer detection fails.

**Why it happens:** Phase 3's own requirements (PLAN-01, REQS-03) use project-level IDs, not the EU/FN/TC feature-level IDs. Cross-layer mixing only applies to feature-level plans, not project/phase-level plans.

**How to avoid:** Cross-layer validation should only trigger when REQ IDs follow the EU-xx/FN-xx/TC-xx pattern. Project-level REQ IDs (PLAN-xx, REQS-xx, FOUND-xx) are exempt from cross-layer checks.

**Warning signs:** Validator throwing false positives on project-level REQ IDs.

### Pitfall 3: Planner Agent Size

**What goes wrong:** The v1 planner agent is already 42KB (the largest agent). Adding self-critique instructions could push it past useful context limits.

**Why it happens:** Self-critique requires explaining what to check, how to fix, when to surface vs fix silently, finding format, etc.

**How to avoid:** The v2 planner agent should be a clean rewrite, not an additive edit. Strip v1 cruft. The self-critique section should be concise -- use the pattern "check X, if Y then Z" not "here is a detailed explanation of why X matters."

**Warning signs:** Agent definition exceeding ~50KB or ~12K tokens. If the planner agent needs > 15K tokens, split the self-critique into a reference document that gets `@`-included.

### Pitfall 4: Q&A Loop Loses Context

**What goes wrong:** The plan-phase workflow presents findings one at a time. If the user provides feedback, the workflow needs to apply it to the plan. But the workflow orchestrator doesn't have the plan's full context -- only the planner agent had that.

**Why it happens:** The workflow runs in the main conversation. The planner ran in a Task subagent. The subagent's context is gone after it returns.

**How to avoid:** Two strategies:
1. **Simple feedback** (accept, minor text changes): The workflow applies changes directly to the PLAN.md files on disk using file editing.
2. **Complex feedback** (re-approach, add/remove tasks): Re-spawn the planner agent with revision instructions (same pattern as the existing revision loop in step 12 of plan-phase.md).

**Warning signs:** The workflow trying to make architectural decisions about task structure. If feedback requires judgment, re-spawn the planner.

### Pitfall 5: Feature-Level vs Phase-Level Planning

**What goes wrong:** The CONTEXT.md decisions assume feature-level planning (FEATURE.md with EU/FN/TC requirements). But the current system plans at the phase level. Phase 3 itself uses phase-level requirements (PLAN-01, REQS-03). The validator and traceability table need to handle both.

**Why it happens:** v2 introduces project/capability/feature hierarchy but v2 is being built on v1's phase structure. The transition is incomplete.

**How to avoid:** Design the validator to work with both:
- Phase-level: REQ IDs from REQUIREMENTS.md, plans in `.planning/phases/` directory
- Feature-level: REQ IDs from FEATURE.md (EU-xx/FN-xx/TC-xx), plans associated with features
- Cross-layer mixing check: Only applies when REQ IDs follow EU/FN/TC pattern

## Code Examples

### Parsing Task REQs from v2 PLAN.md

```javascript
// Extract REQ IDs from v2 task format
function extractTaskReqs(planContent) {
  const tasks = [];
  const taskRegex = /<task>([\s\S]*?)<\/task>/g;
  const reqsRegex = /<reqs>(.*?)<\/reqs>/;
  const titleRegex = /<title>(.*?)<\/title>/;

  let match;
  while ((match = taskRegex.exec(planContent)) !== null) {
    const taskBlock = match[1];
    const reqs = reqsRegex.exec(taskBlock);
    const title = titleRegex.exec(taskBlock);
    tasks.push({
      title: title ? title[1].trim() : 'untitled',
      reqs: reqs ? reqs[1].split(',').map(r => r.trim()).filter(Boolean) : [],
    });
  }
  return tasks;
}
```

### Parsing REQ IDs from FEATURE.md Trace Table

```javascript
// Extract valid REQ IDs from FEATURE.md trace table
function extractFeatureReqIds(featureContent) {
  const reqIds = new Set();
  // Match trace table rows: | EU-01 | End-User | ... or | REQ | Research | Plan | ...
  const rowRegex = /^\|\s*((?:EU|FN|TC)-\d+)\s*\|/gm;
  let match;
  while ((match = rowRegex.exec(featureContent)) !== null) {
    reqIds.add(match[1]);
  }
  return reqIds;
}
```

### Detecting Cross-Layer Mixing

```javascript
// Check if a task mixes EU and TC layer requirements
function detectCrossLayerMixing(taskReqs) {
  const layers = new Set();
  for (const req of taskReqs) {
    const layerMatch = req.match(/^(EU|FN|TC)-/);
    if (layerMatch) {
      layers.add(layerMatch[1]);
    }
  }
  // Mixing = has both EU and TC (must bridge through FN)
  if (layers.has('EU') && layers.has('TC')) {
    return true;
  }
  return false;
}
```

### Validator Output Format

```javascript
// Output follows existing gsd-tools patterns
output({
  passed: errors.length === 0,
  errors: [
    { type: 'orphan_task', task: 'Task 3', plan: '03-02-PLAN.md', message: 'Task has no REQ references' },
    { type: 'phantom_reference', req: 'TC-99', task: 'Task 1', plan: '03-01-PLAN.md', message: 'REQ ID TC-99 not found in FEATURE.md' },
    { type: 'cross_layer_mixing', task: 'Task 2', plan: '03-01-PLAN.md', reqs: ['EU-01', 'TC-03'], message: 'Task mixes EU and TC layers' },
  ],
  warnings: [
    { type: 'uncovered_req', req: 'FN-02', message: 'REQ FN-02 in FEATURE.md has no task in any plan' },
  ],
  summary: { total_tasks: 5, total_reqs: 8, covered: 7, uncovered: 1, errors: 3, warnings: 1 }
}, raw);
```

## State of the Art

| Old Approach (v1) | New Approach (v2) | What Changes | Impact |
|-------------------|-------------------|--------------|--------|
| `requirements: []` in PLAN.md frontmatter | `<reqs>` per task in task body | REQ tracing moves from plan-level to task-level | Each task is independently traceable |
| `<action>` describes implementation | `<inputs>` + `<artifact>` + `<done>` | Tasks specify WHAT not HOW | Executor decides implementation approach |
| No self-critique | 2-round internal critique | Planner catches its own gaps | Fewer checker iterations needed |
| Plan-checker is only validation | CLI validator + plan-checker | Deterministic validation first, AI judgment second | Reliable baseline + intelligent review |
| User sees plans post-checker | User sees findings pre-finalize | Q&A loop before finalization | User corrects assumptions before execution |

## Open Questions

1. **FEATURE.md template update timing**
   - What we know: CONTEXT.md specifies a different column layout than the existing FEATURE.md template
   - What's unclear: Should the template update happen in Phase 3 or was it supposed to happen in Phase 1?
   - Recommendation: Update the template in Phase 3 since the traceability enforcement is Phase 3 scope (REQS-04). Keep backward compat with existing feature files.

2. **Phase-level vs feature-level validation scope**
   - What we know: v2 plans will eventually be feature-scoped. Current system is phase-scoped.
   - What's unclear: Should `gsd plan validate` accept a FEATURE.md path, a phase directory, or both?
   - Recommendation: Accept both. When FEATURE.md exists, validate against it. When only phase-level REQUIREMENTS.md exists, validate against that. This supports the transition.

3. **Plan-checker agent adjustment**
   - What we know: The existing plan-checker (gsd-plan-checker) runs after the planner in the workflow.
   - What's unclear: With self-critique + CLI validation added, is the plan-checker still needed?
   - Recommendation: Keep it but reduce its scope. Self-critique catches coverage. CLI validates structure. Plan-checker focuses on execution feasibility (can an executor actually implement these tasks?).

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `get-shit-done/bin/lib/verify.cjs` (existing validation patterns), `get-shit-done/bin/lib/frontmatter.cjs` (YAML parsing), `get-shit-done/bin/gsd-tools.cjs` (dispatch patterns)
- Existing agent: `agents/gsd-planner.md` (v1 planner, 42KB, current task format)
- Existing workflow: `get-shit-done/workflows/plan-phase.md` (current orchestration flow)
- Existing template: `get-shit-done/templates/phase-prompt.md` (v1 PLAN.md format)
- Existing template: `get-shit-done/templates/feature.md` (trace table structure)
- Completed plans: `.planning/phases/02-agent-framework/02-01-PLAN.md` (v1 task format example)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions (user-locked, authoritative for this phase)
- REQUIREMENTS.md and ROADMAP.md (project-level requirement definitions)

### Tertiary (LOW confidence)
- None -- all findings derived from existing codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing infrastructure
- Architecture: HIGH - patterns derived from existing codebase (verify.cjs, plan-phase.md, planner agent)
- Pitfalls: HIGH - identified from direct codebase inspection (template mismatch, agent size, context loss)

**Research date:** 2026-02-28
**Valid until:** Indefinite -- this phase operates on stable internal infrastructure
