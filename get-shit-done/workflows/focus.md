<purpose>
Create a focus group -- a bundle of capabilities and features for a sprint/work session. Uses SEQUENCE.md for structural ordering via composes[] edges. mgrep runs as a gap detector — shared file paths with no corresponding composes[] overlap surface as signals for possible undeclared capabilities, not as dependency edges. Includes overlap detection against existing active groups and ROADMAP.md/STATE.md updates.
</purpose>

<process>

## 1. Initialize

Check SEQUENCE.md staleness:

```bash
STALE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query sequence-stale)
```

Parse JSON. If `stale` is true: invoke the sequence workflow inline:

```
@{GSD_ROOT}/get-shit-done/workflows/sequence.md
```

Load SEQUENCE.md content. Also load project context:

```bash
PROGRESS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-progress)
```

Parse JSON for: all capabilities with features and statuses.

Read ROADMAP.md to extract existing active focus groups.

## 2. Q&A: Goal

Use AskUserQuestion:
- header: "Focus Group"
- question: "What is the goal of this sprint/focus? Give it a name and one-sentence goal."

Capture: `focus_group_name`, `focus_group_goal`.

**If FOCUS_GROUP_NAME was passed from the invoking command:** Use it as the name, only ask for goal.

Validate: name does not collide with existing focus groups in ROADMAP.md.

## 3. Q&A: Scope

Before asking, show the user sequence context from SEQUENCE.md:
- Executable features: {N} ready now
- Blocked features: {N} waiting on capability verification
- Orphans: {N} caps not composed, {N} features with empty composes[]

Use AskUserQuestion:
- header: "Scope"
- question: "Which capabilities or features are in scope? List them in rough priority order. (Use names, slugs, or natural language -- I'll resolve them.)"

For each item the user lists:

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ITEM")
```

- **If resolved:** Add to `resolved_items[]` with type, capability_slug, feature_slug, full_path.
- **If ambiguous:** Use AskUserQuestion to present top candidates:
  - header: "Which one?"
  - question: "'{ITEM}' matched multiple items. Which did you mean?"
  - options: [top 3 candidates by match quality]
- **If no_match:** Ask user: create new capability/feature, re-describe, or skip.

**If user names a blocked feature:** Show critical path from SEQUENCE.md, offer to include the blocking capabilities' prerequisites in scope.

Build the final `resolved_items` list.

## 4. Dependency Ordering

Query the graph for wave ordering of the scoped features:

```bash
WAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query waves --scope "$FEATURE_CSV")
```

Parse JSON for `wave_1`, `blocked`, `coordinate_flags`.

- Wave 1: features whose composed caps are all verified
- Blocked: features with unverified caps (list blockers)
- Coordinate flags: features in wave 1 sharing a composed cap

For each capability in scope:
- Expand to features that compose it (search `.planning/features/*/FEATURE.md` for composes[] containing this cap)

## 4b. mgrep Gap Scan

Run mgrep against the Context sections of all in-scope features to detect shared file paths:

For each pair of in-scope features:
- Check if their Context sections reference overlapping file paths
- Cross-reference against `composes[]` overlap:
  - **Shared paths explained by shared composes[]:** Both features compose at least one common capability. No signal — skip.
  - **Shared paths NOT explained by any composes[] overlap:** Surface as "possible undeclared capability"

For each unexplained signal:
- Use AskUserQuestion:
  - header: "Undeclared Capability Signal"
  - question: "Features '{feat_a}' and '{feat_b}' both reference {shared_path} but share no composed capabilities. This may indicate an undeclared capability."
  - options:
    - "Create a new capability" → route to `/gsd:discuss-capability`
    - "Add to an existing capability's scope"
    - "Ignore"

Track count of signals found as `undeclared_cap_signals`. Display only when > 0.

## 5. Overlap Detection

Read existing active focus groups from ROADMAP.md. For each existing group, extract its feature set.

Compare new focus group's feature set against existing groups.

**If overlap found:**

For each overlapping item:
- Use AskUserQuestion:
  - header: "Overlap Detected"
  - question: "Feature '{X}' is already in focus group '{existing_name}'. What should I do?"
  - options:
    - "Merge into '{existing_name}' (add new items, reprioritize)"
    - "Keep in both groups (parallel work)"
    - "Remove from new group"
- Apply user's choice per overlapping item.

**If merge selected:** Modify existing focus group to include new items. Re-query waves for the merged group.

**If no overlap:** Proceed to ordering.

## 6. Priority Ordering + Readiness

Present the final priority order based on:
1. Wave ordering from graph query
2. User's original ordering from Q&A step 3 (for within-wave ordering)

Display proposed order with wave groupings.

**Wave readiness validation:**

For each feature in wave 1:
- Run `gate-check` to validate composed capabilities are ready:
  ```bash
  GATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" gate-check "$FEAT_SLUG")
  ```
- Confirm FEATURE.md exists with Goal/Flow/composes[] sections populated
- If not discussed: flag as gap

**If gate-check fails for a feature:**
Use AskUserQuestion:
- header: "Blocked Feature"
- question: "Feature '{feat}' gate-check failed: {blockers}. What should I do?"
- options:
  - "Add blocking capability to focus scope"
  - "Include anyway (I'll address blockers manually)"
  - "Remove from focus group"
  - "Run /gsd:refine to address blockers"

**If user selects "Run /gsd:refine":**
1. Write ROADMAP.md and STATE.md first (steps 7-8) so refine can read active-focus
2. Invoke `/gsd:refine`
3. After refine returns, resume at step 9 (commit) — ROADMAP.md/STATE.md already written

Surface all gaps before writing to ROADMAP.md.

Use AskUserQuestion:
- header: "Priority Order"
- question: "Does this order look right? You can reorder within waves (cross-wave reordering would break dependencies)."
- options: "Looks good", "I want to adjust"

If adjust: take user's new order, validate against wave constraints, re-present.

## 7. Write to ROADMAP.md

Add focus group section to ROADMAP.md:

```markdown
### Focus: {focus_group_name}
**Goal:** {focus_group_goal}
**Priority Order:**
1. {feat} -> depends: none
2. {feat} -> depends: {dep}
**Status:**
- [ ] {feat} (not started)
- [ ] {feat} (not started)
```

Write updated ROADMAP.md.

## 8. Update STATE.md

Update STATE.md to reference the new active focus group:
- If first focus group: add `## Active Focus Groups` section
- Add entry for new focus group with name and current item

## 9. Commit

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: create focus group '${FOCUS_GROUP_NAME}'" --files .planning/ROADMAP.md .planning/STATE.md
```

Display completion:

```
-------------------------------------------------------
 GSD > FOCUS GROUP CREATED
-------------------------------------------------------

Name: {focus_group_name}
Goal: {focus_group_goal}
Items: {count} ({wave_count} waves)
Dependencies: {dep_count} from composes[]
{if undeclared_cap_signals > 0: "Undeclared capability signals: {undeclared_cap_signals}"}

Next: Run `/gsd:plan {first_item}` to start planning the first item.
```

</process>

<success_criteria>
- [ ] Focus group name and goal captured via Q&A
- [ ] All scope items resolved via slug-resolve
- [ ] Sequence context shown before scope Q&A (executable/blocked counts)
- [ ] Wave ordering from graph-query waves replaces inline DAG construction
- [ ] mgrep gap scan complete — undeclared capability signals surfaced (if any)
- [ ] Gate-check routes blocked items with user choice
- [ ] Overlap with existing focus groups detected and resolved (merge/parallel/remove)
- [ ] Priority order respects wave constraints
- [ ] ROADMAP.md updated with focus group section
- [ ] STATE.md updated with active focus reference
- [ ] Commit created with focus group changes
</success_criteria>
