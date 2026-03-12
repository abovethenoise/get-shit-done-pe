<purpose>
Focus-level planning workflow. Plans all items in a focus group with cross-cutting research and per-item plans in wave order. Single approval gate. Not a wrapper that calls plan.md N times — self-contained with shared research context.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
@{GSD_ROOT}/get-shit-done/references/escalation-protocol.md
</required_reading>

<inputs>
- `FOCUS_SLUG`: Focus group slug (resolves to `.planning/focus/{slug}/FOCUS.md`)
</inputs>

<process>

## 1. Initialize

Read `.planning/focus/${FOCUS_SLUG}/FOCUS.md`. Extract frontmatter: `name`, `goal`, `scope[]`, `current_wave`, `status`.

Run focus-waves for live wave plan:

```bash
SCOPE_CSV=$(echo "${SCOPE_ARRAY}" | paste -sd,)
WAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query focus-waves --scope "$SCOPE_CSV")
```

Parse JSON for `waves[]`.

Display banner:
```
-------------------------------------------------------
 GSD > FOCUS PLANNING
-------------------------------------------------------

Focus: {name}
Goal: {goal}
Items: {count} across {wave_count} waves
```

## 2. Load Context

Read:
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- All specs in scope: for each item in scope[], read CAPABILITY.md or FEATURE.md

## 3. User Focus

AskUserQuestion:
- header: "Planning Focus"
- question: "What should I optimize for across this focus group?"
- options: "Simplicity", "Correctness", "Speed", "Custom (describe)"

If custom: capture free-text response.

## 4. Cross-Cutting Research

6 research gatherers see ALL specs in scope simultaneously. Research targets:
- Shared contracts between capabilities in scope
- Coordination points (caps composed by multiple features)
- Integration boundaries (where scope items interact)
- Sequencing risks (items that may conflict or need careful ordering)
- Shared patterns (reusable approaches across items)
- Edge cases at scope boundaries

Delegation: 6 gatherers (parallel) → 1 synthesizer

Each gatherer receives:
- All CAPABILITY.md and FEATURE.md in scope
- PROJECT.md context
- Focus group goal
- User focus preference from Step 3

Synthesizer consolidates → writes `.planning/focus/${FOCUS_SLUG}/RESEARCH.md`

## 5. Per-Item Planning (Wave Order)

For each wave, for each item in the wave (sequential):

1. Determine item type (capability or feature) and read its spec
2. Planner receives:
   - Item spec (CAPABILITY.md or FEATURE.md)
   - `.planning/focus/${FOCUS_SLUG}/RESEARCH.md` (cross-cutting research)
   - Plans from prior-wave items (for dependency context)
   - User focus preference
3. Planner writes PLAN.md at the item's standard path:
   - Capabilities: `.planning/capabilities/{slug}/PLAN.md`
   - Features: `.planning/features/{slug}/{NN}-PLAN.md`
4. Planner flags items needing deeper research with `needs_deeper_research: true` marker

## 6. Validate

Run plan-validate.cjs for each plan:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify artifacts "$PLAN_PATH"
```

Surface coverage gaps across all plans.

## 7. Post-Planning Recommendations

Collect items where the planner flagged ambiguity, insufficient research, or complex coordination — especially items on the critical path (wave 1, or items blocking later waves).

Err on the side of caution: if any ambiguity exists on a critical path item, recommend deeper research.

Present as "Recommended Deeper Dives":

AskUserQuestion:
- header: "Post-Planning Recommendations"
- question: "{N} items flagged for potential deeper research:\n\n{list with reasons}\n\nThese are recommendations, not blockers."
- options: "Accept recommendations (research these items)", "Skip all", "Custom selection"

If accepted: note which items need `/gsd:plan {item}` with full research after focus planning completes.

## 7b. Coherence Gate

If RESEARCH.md contains cross-cutting coherence findings (conflicting contracts, incompatible schemas across capabilities, structural misalignment affecting multiple items):

**Stop the workflow. Do not write partial plans.**

```
-------------------------------------------------------
 GSD > FOCUS PLANNING HALTED — REFINEMENT NEEDED
-------------------------------------------------------

Cross-cutting coherence issues found:
  - {finding_1}
  - {finding_2}

These affect multiple items in scope and will produce unreliable plans.
Run refinement to resolve, then return to planning.

Next: `/gsd:refine`
  Then: `/gsd:plan {FOCUS_SLUG}`
```

Exit. RESEARCH.md is preserved for reference but plans are not written. When the user returns after refine, step 4 regenerates RESEARCH.md against the post-refine state.

## 8. Approval

Present full wave plan with per-item plan summaries:

```
## Focus Plan Summary

### Wave 1
- {slug} ({type}): {plan one-liner}
- {slug} ({type}): {plan one-liner}

### Wave 2
- {slug} ({type}): {plan one-liner}

### Research Highlights
- {key finding from RESEARCH.md}

### Flagged Items
- {item}: {reason for deeper research recommendation}
```

AskUserQuestion:
- header: "Approve Focus Plan"
- question: "Review the plan above. All {count} items planned across {wave_count} waves."
- options: "Approve", "Edit (specify changes)", "Abort"

If edit: apply changes, re-validate, re-present.
If abort: exit without updating state.

## 9. Update State

Update FOCUS.md frontmatter:
```yaml
current_wave: 1
status: planned
```

Update STATE.md: record active focus group and planning completion.

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: plan focus group '${FOCUS_NAME}'" --files .planning/focus/${FOCUS_SLUG}/FOCUS.md .planning/focus/${FOCUS_SLUG}/RESEARCH.md .planning/STATE.md
```

Display:
```
-------------------------------------------------------
 GSD > FOCUS PLANNING COMPLETE
-------------------------------------------------------

Focus: {name}
Items planned: {count}
Waves: {wave_count}
Flagged for deeper research: {flagged_count}

Next: `/gsd:execute {FOCUS_SLUG}`
```

</process>

<success_criteria>
- [ ] FOCUS.md read and wave plan computed via focus-waves
- [ ] Cross-cutting research covers all specs in scope (RESEARCH.md written)
- [ ] Per-item plans written in wave order with cross-cutting context
- [ ] Plans validated via plan-validate.cjs
- [ ] Post-planning recommendations surface ambiguous/critical items
- [ ] Single approval gate for all plans
- [ ] FOCUS.md updated to current_wave: 1, status: planned
- [ ] STATE.md updated with active focus
</success_criteria>
