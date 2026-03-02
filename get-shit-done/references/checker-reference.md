# Plan Checker Reference

Detailed dimension definitions, scoring rubrics, examples, and issue formats for the gsd-plan-checker agent. Loaded by the orchestrator as @reference context at spawn time.

---

## Verification Process

### Step 1: Load Context

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
```

Extract: `phase_dir`, `phase_number`, `has_plans`, `plan_count`.

Load FEATURE.md for requirements, CONTEXT.md for user decisions, ROADMAP.md for phase goal.

### Step 2: Load All Plans

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  PLAN_STRUCTURE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify plan-structure "$plan")
done
```

Parse JSON result: `{ valid, errors, warnings, task_count, tasks: [{name, hasFiles, hasAction, hasVerify, hasDone}], frontmatter_fields }`

### Step 3: Parse must_haves

```bash
MUST_HAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" frontmatter get "$PLAN_PATH" --field must_haves)
```

Returns JSON: `{ truths: [...], artifacts: [...], key_links: [...] }`

---

## Dimension 1: Requirement Coverage

**Question:** Does every FEATURE.md EU/FN/TC requirement have task(s) addressing it?

**Process:**
1. Extract feature goal and EU/FN/TC requirement IDs from FEATURE.md
2. Verify each requirement ID appears in at least one plan's `requirements` frontmatter
3. For each requirement, find covering task(s) and verify the task action addresses it
4. Flag requirements with no coverage

**Automatic FAIL if:** Any requirement ID is absent from all plans' `requirements` fields.

**Red flags:**
- Requirement has zero tasks
- Multiple requirements share one vague task
- Requirement partially covered (login exists but logout does not)

**Example issue:**
```yaml
issue:
  dimension: requirement_coverage
  severity: blocker
  description: "FN-02 (logout) has no covering task"
  plan: "01"
  fix_hint: "Add task for logout endpoint in plan 01 or new plan"
```

---

## Dimension 2: Task Completeness

**Question:** Does every auto task have Files + Action + Verify + Done?

**Required by task type:**

| Type | Files | Action | Verify | Done |
|------|-------|--------|--------|------|
| `auto` | Required | Required | Required | Required |
| `checkpoint:*` | N/A | N/A | N/A | N/A |

**Red flags:**
- Missing `<verify>` -- completion unverifiable
- Missing `<done>` -- no acceptance criteria
- Vague `<action>` -- "implement auth" instead of specific steps
- Empty `<files>` -- unclear what gets created

**Example issue:**
```yaml
issue:
  dimension: task_completeness
  severity: blocker
  description: "Task 2 missing <verify> element"
  plan: "01"
  task: 2
  fix_hint: "Add verification command for build output"
```

---

## Dimension 3: Dependency Correctness

**Question:** Are plan dependencies valid and acyclic?

**Process:**
1. Parse `depends_on` from each plan frontmatter
2. Build dependency graph
3. Check for cycles, missing references, future references

**Dependency rules:**
- `depends_on: []` = Wave 1
- `depends_on: ["01"]` = Wave 2 minimum
- Wave number = max(deps) + 1

**Red flags:**
- Referencing non-existent plan
- Circular dependency (A -> B -> A)
- Wave assignment inconsistent with dependencies

**Example issue:**
```yaml
issue:
  dimension: dependency_correctness
  severity: blocker
  description: "Circular dependency between plans 02 and 03"
  plans: ["02", "03"]
  fix_hint: "Plan 02 depends on 03, but 03 depends on 02"
```

---

## Dimension 4: Key Links Planned

**Question:** Are artifacts wired together, not just created in isolation?

**Process:**
1. Identify artifacts in `must_haves.artifacts`
2. Check that `must_haves.key_links` connects them
3. Verify tasks actually implement the wiring

**Wiring patterns to check:**
```
Component -> API: Does action mention fetch/axios call?
API -> Database: Does action mention Prisma/query?
Form -> Handler: Does action mention onSubmit implementation?
State -> Render: Does action mention displaying state?
```

**Example issue:**
```yaml
issue:
  dimension: key_links_planned
  severity: warning
  description: "Chat.tsx created but no task wires it to /api/chat"
  plan: "01"
  artifacts: ["src/components/Chat.tsx", "src/app/api/chat/route.ts"]
  fix_hint: "Add fetch call in Chat.tsx action or create wiring task"
```

---

## Dimension 5: Scope Sanity

**Question:** Will plans complete within context budget?

**Thresholds:**

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks/plan | 2-3 | 4 | 5+ |
| Files/plan | 5-8 | 10 | 15+ |
| Total context | ~50% | ~70% | 80%+ |

**Example issue:**
```yaml
issue:
  dimension: scope_sanity
  severity: blocker
  description: "Plan 01 has 5 tasks with 12 files - exceeds context budget"
  plan: "01"
  metrics:
    tasks: 5
    files: 12
    estimated_context: "~80%"
  fix_hint: "Split into: 01 (schema + API), 02 (middleware + lib), 03 (UI components)"
```

---

## Dimension 6: Verification Derivation

**Question:** Do must_haves trace back to feature goal?

**Process:**
1. Check each plan has `must_haves` in frontmatter
2. Verify truths are user-observable (not implementation details)
3. Verify artifacts support the truths
4. Verify key_links connect artifacts to functionality

**Red flags:**
- Missing `must_haves` entirely
- Implementation-focused truths ("bcrypt installed" instead of "passwords are secure")
- Artifacts that do not map to truths
- Missing key_links for critical wiring

---

## Dimension 7: Context Compliance

**Only checked when CONTEXT.md exists.**

**Question:** Do plans honor user decisions from /gsd:discuss-capability?

**Process:**
1. Parse CONTEXT.md sections: Decisions, Claude's Discretion, Deferred Ideas
2. For each locked Decision, find implementing task(s)
3. Verify no tasks implement Deferred Ideas
4. Verify Discretion areas are handled

**Red flags:**
- Locked decision has no implementing task
- Task contradicts a locked decision
- Task implements something from Deferred Ideas

**Example -- contradiction:**
```yaml
issue:
  dimension: context_compliance
  severity: blocker
  description: "Plan contradicts locked decision: user specified 'card layout' but Task 2 implements 'table layout'"
  plan: "01"
  task: 2
  fix_hint: "Change Task 2 to implement card-based layout per user decision"
```

**Example -- scope creep:**
```yaml
issue:
  dimension: context_compliance
  severity: blocker
  description: "Plan includes deferred idea: 'search functionality' was explicitly deferred"
  plan: "02"
  task: 1
  fix_hint: "Remove search task - belongs in future phase per user decision"
```

---

## Issue Format

```yaml
issue:
  plan: "01"                       # Which plan (null if phase-level)
  dimension: "task_completeness"   # Which dimension failed
  severity: "blocker"              # blocker | warning | info
  description: "..."
  task: 2                          # Task number if applicable
  fix_hint: "..."
```

### Severity Levels

**blocker** -- fix before execution:
- Missing requirement coverage
- Missing required task fields
- Circular dependencies
- Scope > 5 tasks per plan

**warning** -- should fix, execution may work:
- Scope 4 tasks (borderline)
- Implementation-focused truths
- Minor wiring missing

**info** -- suggestions for improvement:
- Better parallelization possible
- Could improve verification specificity

---

## Structured Return Formats

### VERIFICATION PASSED

```markdown
## VERIFICATION PASSED

**Phase:** {phase-name}
**Plans verified:** {N}
**Status:** All checks passed

### Coverage Summary
| Requirement | Plans | Status |
|-------------|-------|--------|

### Plan Summary
| Plan | Tasks | Files | Wave | Status |
|------|-------|-------|------|--------|

Plans verified. Run `/gsd:execute {phase}` to proceed.
```

### ISSUES FOUND

```markdown
## ISSUES FOUND

**Phase:** {phase-name}
**Plans checked:** {N}
**Issues:** {X} blocker(s), {Y} warning(s), {Z} info

### Blockers (must fix)
**1. [{dimension}] {description}**
- Plan: {plan}
- Task: {task if applicable}
- Fix: {fix_hint}

### Warnings (should fix)
**1. [{dimension}] {description}**
- Plan: {plan}
- Fix: {fix_hint}

### Structured Issues
(YAML issues list)

### Recommendation
{N} blocker(s) require revision. Returning to planner with feedback.
```

---

## Verification Principles

- Plans describe intent. You verify they deliver.
- Check plan files, not codebase. Code verification is the verifier's job.
- Static plan analysis only -- do not run the application.
- Read action, verify, done fields. Well-named tasks can be empty.
- Scope limits are quality protection. 5+ tasks/plan degrades executor output.
