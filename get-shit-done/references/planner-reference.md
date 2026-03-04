# Planner Reference

Detailed procedures, schemas, templates, and examples for the gsd-planner agent. Loaded by the orchestrator as @reference context at spawn time.

---

## PLAN.md Frontmatter Schema

```yaml
---
phase: XX-name                 # Phase identifier
plan: NN                       # Plan number within phase
type: execute                  # Always "execute"
wave: N                        # Execution wave number
depends_on: []                 # Plan IDs this plan requires
files_modified: []             # Files this plan touches
autonomous: true               # false if checkpoints present
requirements: []               # FEATURE.md REQ IDs (EU/FN/TC)
user_setup: []                 # Human-required setup (omit if empty)

must_haves:
  truths: []                   # Observable outcomes (user perspective)
  artifacts: []                # Required files with path + provides
  key_links: []                # Critical wiring between artifacts
---
```

### Frontmatter Field Reference

| Field | Required | Purpose |
|-------|----------|---------|
| `phase` | Yes | Phase identifier (e.g., `01-foundation`) |
| `plan` | Yes | Plan number within phase |
| `type` | Yes | `execute` |
| `wave` | Yes | Execution wave (1 = no deps, 2+ = after prior waves) |
| `depends_on` | Yes | Plan IDs this plan requires completed first |
| `files_modified` | Yes | Files this plan creates or modifies (enables parallel conflict detection) |
| `autonomous` | Yes | `true` if no checkpoints, `false` if any checkpoint task present |
| `requirements` | Yes | EU/FN/TC REQ IDs from FEATURE.md that this plan addresses |
| `user_setup` | No | Human-required setup items (API keys, accounts) |
| `must_haves` | Yes | Goal-backward verification criteria |

---

## Task Anatomy (v2)

Every task has five required fields:

**`<name>`** -- What the task does. Good: "Create frontmatter validation for v2 task schema". Bad: "Validation stuff".

**`<reqs>`** -- Requirement IDs this task addresses. Every task references at least one REQ. Prevents orphan work and scope creep.

**`<files>`** -- Exact file paths to create or modify. Prevents wrong file, wrong location.

**`<action>`** -- Specific implementation steps. Good: concrete file operations. Bad: "implement auth".

**`<done>`** -- Observable exit condition. Good: "gsd plan-validate returns 0 errors". Bad: "it works".

**`<verify>`** -- Automated verification command and/or manual check.

### Cross-Layer Constraint

A task references either EU-layer or TC-layer REQs, not both. Bridge through FN if needed. Project-level IDs (PLAN-xx, REQS-xx) are exempt.

Rationale: EU verified via UI/integration, TC verified against code. Mixing creates two verification methods for one artifact.

### Task Types

| Type | Use For | Autonomy |
|------|---------|----------|
| `auto` | Everything Claude can do independently | Fully autonomous |
| `checkpoint:human-verify` | Visual/functional verification | Pauses for user |
| `checkpoint:decision` | Implementation choices | Pauses for user |
| `checkpoint:human-action` | Truly unavoidable manual steps (rare) | Pauses for user |

Automation-first: if Claude can do it via CLI/API, Claude does it. Checkpoints verify after automation, not replace it.

### Task Sizing

Each task: 15-60 minutes Claude execution time.

| Duration | Action |
|----------|--------|
| < 15 min | Too small -- combine with related task |
| 15-60 min | Right size |
| > 60 min | Too large -- split |

One atomic commit per task. If a task requires more than one commit, split it.

---

## PLAN.md Template

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N
depends_on: []
files_modified: []
autonomous: true
requirements: []
must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
[What this plan accomplishes]

Purpose: [Why this matters]
Output: [Artifacts created]
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key types and contracts the executor needs -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task name</name>
  <reqs>REQ-01, REQ-02</reqs>
  <files>path/to/file.ts</files>
  <action>
  Specific implementation steps.
  </action>
  <verify>
    <automated>command to verify</automated>
  </verify>
  <done>Observable exit condition</done>
</task>

</tasks>

<verification>
[Overall phase checks]
</verification>

<success_criteria>
[Measurable completion]
</success_criteria>

<output>
After completion, create `{feature_dir}/{nn}-SUMMARY.md`
</output>
```

---

## Goal-Backward Methodology

Forward planning asks "what should we build?" and produces tasks. Goal-backward asks "what must be TRUE for the goal to be achieved?" and produces requirements tasks must satisfy.

### Process

**Step 0: Extract Requirement IDs.** Read FEATURE.md EU/FN/TC requirements. Distribute IDs across plans -- each plan's `requirements` field lists the IDs its tasks address. Every requirement ID appears in at least one plan.

**Step 1: State the Goal.** Take the feature goal from FEATURE.md. Outcome-shaped, not task-shaped.

**Step 2: Derive Observable Truths.** "What must be TRUE for this goal to be achieved?" List 3-7 truths from the user's perspective.

**Step 3: Derive Required Artifacts.** For each truth: "What must EXIST for this to be true?" Each artifact = a specific file.

**Step 4: Derive Required Wiring.** For each artifact: "What must be CONNECTED for this to function?"

**Step 5: Identify Key Links.** "Where is this most likely to break?" Critical connections where breakage causes cascading failures.

### must_haves Output Format

```yaml
must_haves:
  truths:
    - "User can see existing messages"
    - "Messages persist across refresh"
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "Message list rendering"
    - path: "src/app/api/chat/route.ts"
      provides: "Message CRUD operations"
  key_links:
    - from: "src/components/Chat.tsx"
      to: "/api/chat"
      via: "fetch in useEffect"
      pattern: "fetch.*api/chat"
```

---

## Dependency Graph and Wave Assignment

### Per-task dependency recording

For each task, record:
- `needs`: What must exist before this runs
- `creates`: What this produces
- `has_checkpoint`: Requires user interaction?

### Wave assignment algorithm

```
waves = {}
for each plan in plan_order:
  if plan.depends_on is empty:
    plan.wave = 1
  else:
    plan.wave = max(waves[dep] for dep in plan.depends_on) + 1
  waves[plan.id] = plan.wave
```

### Vertical slices preferred

Vertical slices (feature = model + API + UI per plan) run in parallel. Horizontal layers (all models, then all APIs) are sequential. Prefer vertical unless shared foundation requires horizontal (auth before protected features, infrastructure setup).

### File ownership for parallel execution

Plans in the same wave have exclusive file ownership -- no overlapping files_modified.

---

## Context Budget Rules

Plans complete within ~50% context. Each plan: 2-3 tasks maximum.

| Task Complexity | Tasks/Plan | Context/Task | Total |
|-----------------|------------|--------------|-------|
| Simple (CRUD, config) | 3 | ~10-15% | ~30-45% |
| Complex (auth, payments) | 2 | ~20-30% | ~40-50% |
| Very complex (migrations) | 1-2 | ~30-40% | ~30-50% |

### Split Signals

Split when: more than 3 tasks, multiple subsystems, any task with >5 file modifications, checkpoint + implementation in same plan.

---

## Self-Critique Protocol

After producing all PLAN.md files, run two critique rounds before returning.

### Round 1 -- Fix Silently

For each requirement ID in FEATURE.md:
- Is there a task with this REQ in its `<reqs>`? If no, add a task.

For each task in every plan:
- Does every REQ in `<reqs>` exist in FEATURE.md? If no, remove the reference.
- Does `<files>` specify exact file paths? If no, fix it.
- Does `<done>` state an observable exit condition? If no, rewrite it.

Apply all fixes. Do not surface Round 1 fixes mid-task; capture them in the `### Round 1 Fixes` return section for user presentation.

### Round 2 -- Surface Issues

Re-scan after Round 1 fixes. For remaining issues, create findings:

```javascript
{ category: "coverage_gap|assumption|ambiguity", description, suggestion, reqs_affected }
```

### Hard Stop

After Round 2, return plan files + findings list. Do not attempt Round 3.

---

## Discovery Levels

**Level 0 -- Skip**: Pure internal work, existing patterns only. All work follows established codebase patterns.

**Level 1 -- Quick Verification**: Single known library, confirming syntax/version. Context7 resolve + query, no DISCOVERY.md.

**Level 2 -- Standard Research**: Choosing between 2-3 options, new external integration. Route to discovery workflow.

**Level 3 -- Deep Dive**: Architectural decision with long-term impact. Full research with DISCOVERY.md.

---

## Quality Degradation Curve

| Context Usage | Quality | Claude's State |
|---------------|---------|----------------|
| 0-30% | PEAK | Thorough, comprehensive |
| 30-50% | GOOD | Confident, solid work |
| 50-70% | DEGRADING | Efficiency mode begins |
| 70%+ | POOR | Rushed, minimal |

---

## Solo Developer + Claude Workflow

Planning for ONE person (the user) and ONE implementer (Claude). No teams, stakeholders, ceremonies, coordination overhead. User = visionary/product owner, Claude = builder. Estimate effort in Claude execution time, not human dev time.

---

## Checkpoint Task Templates

### checkpoint:human-verify (90% of checkpoints)

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What Claude automated]</what-built>
  <how-to-verify>[Exact steps to test]</how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>
```

### checkpoint:decision (9% of checkpoints)

```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <options>
    <option id="option-a">
      <name>[Name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
  </options>
  <resume-signal>Select: option-a, option-b, or ...</resume-signal>
</task>
```

### checkpoint:human-action (1% -- rare)

Only for: email verification links, SMS 2FA codes, manual account approvals, credit card 3D Secure flows.

---

## Gap Closure Mode

Triggered by `--gaps` flag. Creates plans from VERIFICATION.md gaps.

1. Load VERIFICATION.md and parse `gaps:` YAML
2. Load existing SUMMARYs for context
3. Group gaps by artifact/concern
4. Create gap closure tasks with `gap_closure: true` frontmatter
5. Each task traces to affected REQ IDs

---

## Revision Mode

Triggered when orchestrator provides `<revision_context>` with checker issues. Targeted updates, not fresh planning.

| Dimension | Revision Strategy |
|-----------|-------------------|
| requirement_coverage | Add task(s) for missing requirement |
| task_completeness | Add missing elements to existing task |
| dependency_correctness | Fix depends_on, recompute waves |
| scope_sanity | Split into multiple plans |
| must_haves_derivation | Derive and add must_haves to frontmatter |

---

## Context Section Rules

Only include prior plan SUMMARY references if genuinely needed. Independent plans need no prior SUMMARY references.

Interface context: embed key types in `<interfaces>` block when plans depend on existing code or create interfaces consumed by other plans.

---

## Structured Return Formats

### Planning Complete

```markdown
## PLANNING COMPLETE

**Phase:** {phase-name}
**Plans:** {N} plan(s) in {M} wave(s)

### Wave Structure
| Wave | Plans | Autonomous |
|------|-------|------------|

### Plans Created
| Plan | Objective | Tasks | Files |
|------|-----------|-------|-------|

### Justification

**Ordering rationale:** {why waves/tasks are sequenced this way — cite dependency edges and REQ IDs}
**Approach rationale:** {why this approach vs alternatives — cite RESEARCH.md findings and project constraints}
**KISS rationale:** {why this is the simplest approach that satisfies requirements — cite specific trade-offs rejected}

### Round 1 Fixes

{If fixes applied, one entry per fix:}
- **Context:** {what was wrong before the fix}
  **Decision:** {what changed}
  **Consequence:** {REQ IDs affected, downstream impact}

{If no fixes:}
No Round 1 fixes applied.

### Findings
{findings from Round 2, or "None -- all issues resolved in Round 1"}

### Next Steps
Execute: `/gsd:execute {cap/feat}`
```

All Justification and Round 1 Fixes claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check.

### Gap Closure Plans Created

```markdown
## GAP CLOSURE PLANS CREATED

**Phase:** {phase-name}
**Closing:** {N} gaps from {VERIFICATION|UAT}.md

### Plans
| Plan | Gaps Addressed | Files |
|------|----------------|-------|
```
