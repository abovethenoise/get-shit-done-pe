# Plan Checker Reference

Detailed dimension definitions, scoring rubrics, examples, and issue formats for the gsd-plan-checker agent. Loaded by the orchestrator as @reference context at spawn time.

---

## Verification Process

### Step 1: Load Context

Follow the [Context Assembly Pattern](context-assembly.md) to load target spec and state.

Determine target type:
- **Capability**: Load CAPABILITY.md contract (Receives/Returns/Rules/Failure/Constraints)
- **Feature**: Load FEATURE.md (Goal/Flow/Scope/composes[]), then load each composed capability's contract

### Step 2: Load All Plans

```bash
for plan in "$TARGET_DIR"/*-PLAN.md; do
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

## Dimension 1: Contract/Flow Coverage

**Question:** Does every contract section (capability) or flow step (feature) have task(s) addressing it?

### Capability Check

1. Extract contract sections from CAPABILITY.md: Receives, Returns, Rules, Failure Behavior, Constraints
2. Verify each section is addressed by at least one task's `<reqs>`
3. Flag sections with no coverage

**Automatic FAIL if:** Any contract section has zero covering tasks.

### Feature Check

1. Run `gsd-tools gate-check <feat> --raw` -- FAIL if any composed capability is unverified
2. Extract flow steps from FEATURE.md
3. Verify each flow step is addressed by at least one task
4. Flag steps with no coverage

**Automatic FAIL if:** Gate check fails OR any flow step has zero covering tasks.

### Scope Bleed Detection

| Plan Type | Red Flag | Meaning |
|-----------|----------|---------|
| Capability | Task mentions UX, user flow, or UI | Capability plan doing feature work |
| Feature | Task implements new logic (not wiring) | Feature plan doing capability work |

**Red flags:**
- Multiple sections/steps share one vague task
- Section/step partially covered

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

---

## Dimension 3: Dependency Correctness

**Question:** Are plan dependencies valid and acyclic?

**Dependency rules:**
- `depends_on: []` = Wave 1
- `depends_on: ["01"]` = Wave 2 minimum
- Wave number = max(deps) + 1

**Red flags:**
- Referencing non-existent plan
- Circular dependency (A -> B -> A)
- Wave assignment inconsistent with dependencies

---

## Dimension 4: Key Links Planned

**Question:** Are artifacts wired together, not just created in isolation?

**Process:**
1. Identify artifacts in `must_haves.artifacts`
2. Check that `must_haves.key_links` connects them
3. Verify tasks actually implement the wiring

---

## Dimension 5: Scope Sanity

**Question:** Will plans complete within context budget?

**Thresholds:**

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks/plan | 2-3 | 4 | 5+ |
| Files/plan | 5-8 | 10 | 15+ |
| Total context | ~50% | ~70% | 80%+ |

---

## Dimension 6: Verification Derivation

**Question:** Do must_haves trace back to the capability contract or feature goal?

**Process:**
1. Check each plan has `must_haves` in frontmatter
2. Verify truths are user-observable (not implementation details)
3. Verify artifacts support the truths
4. Verify key_links connect artifacts to functionality

**Red flags:**
- Missing `must_haves` entirely
- Implementation-focused truths ("bcrypt installed" instead of "passwords are secure")
- Artifacts that do not map to truths

---

## Dimension 7: Context Compliance

**Only checked when CONTEXT.md exists.**

**Question:** Do plans honor user decisions from /gsd:discuss-capability or /gsd:discuss-feature?

**Process:**
1. Parse CONTEXT.md sections: Decisions, Claude's Discretion, Deferred Ideas
2. For each locked Decision, find implementing task(s)
3. Verify no tasks implement Deferred Ideas
4. Verify Discretion areas are handled

**Red flags:**
- Locked decision has no implementing task
- Task contradicts a locked decision
- Task implements something from Deferred Ideas

---

## Issue Format

```yaml
issue:
  plan: "01"                       # Which plan (null if phase-level)
  dimension: "contract_coverage"   # Which dimension failed
  severity: "blocker"              # blocker | warning | info
  description: "..."
  task: 2                          # Task number if applicable
  fix_hint: "..."
```

### Severity Levels

**blocker** -- fix before execution:
- Missing contract section or flow step coverage
- Gate check failure (unverified composed capability)
- Missing required task fields
- Circular dependencies
- Scope > 5 tasks per plan
- Scope bleed detected

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

**Target:** {capability or feature name}
**Plans verified:** {N}
**Status:** All checks passed

### Coverage Summary
| Contract Section / Flow Step | Plans | Status |
|------------------------------|-------|--------|

### Plan Summary
| Plan | Tasks | Files | Wave | Status |
|------|-------|-------|------|--------|

Plans verified. Run `/gsd:execute {cap/feat}` to proceed.
```

### ISSUES FOUND

```markdown
## ISSUES FOUND

**Target:** {capability or feature name}
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
