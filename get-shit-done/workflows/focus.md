<purpose>
Create a focus group -- a bundle of capabilities and features for a sprint/work session. Replaces milestones with lightweight sequencing. Includes dependency tracing (explicit from CAPABILITY.md + implicit from shared file paths via mgrep), overlap detection against existing active groups, and ROADMAP.md/STATE.md updates.
</purpose>

<process>

## 1. Initialize

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

Use AskUserQuestion:
- header: "Scope"
- question: "Which capabilities or features are in scope? List them in rough priority order. (Use names, slugs, or natural language -- I'll resolve them.)"

For each item the user lists:

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ITEM")
```

- **If resolved:** Add to `resolved_items[]` with type, capability_slug, feature_slug, full_path.
- **If ambiguous:** Present candidates inline, user picks.
- **If no_match:** Ask user: create new capability/feature, re-describe, or skip.

Build the final `resolved_items` list.

## 4. Dependency Trace

For each resolved item, trace dependencies to build the focus group's DAG.

### 4a. Explicit Dependencies (from metadata)

For each feature in scope:
- Read parent CAPABILITY.md Features table `Depends-On` column
- Read FEATURE.md frontmatter `depends_on` field (if present)
- Build edges: `feature_a -> depends_on -> [feature_b, feature_c]`

For each capability in scope:
- Expand to all its features
- Read inter-feature dependencies from CAPABILITY.md

### 4b. Implicit Dependencies (from code overlap)

For each feature in scope:
- Read FEATURE.md for TC-xx requirements mentioning file paths (Upstream/Downstream fields)
- Collect all referenced file paths per feature

Cross-reference: find file paths that appear in multiple features' requirements.

**If shared files found:**
- Surface to user: "Features {X} and {Y} both reference `{file}`. This suggests a dependency or shared concern."
- Use AskUserQuestion:
  - header: "Implicit Dependency"
  - question: "Should I add a dependency edge between these features?"
  - options: "Yes, {X} depends on {Y}", "Yes, {Y} depends on {X}", "No, they're independent"

### 4c. DAG Construction

Combine explicit + confirmed implicit edges into a directed acyclic graph.

**Cycle detection:**
If cycle found:
- Display: "Circular dependency detected: {cycle path}"
- Use AskUserQuestion: "Which dependency should be removed to break the cycle?"
- User picks; remove edge and re-validate.

**Topological sort into waves:**
- Wave 1: items with no dependencies (or all deps already complete/outside scope)
- Wave 2+: items whose in-scope deps are all in earlier waves

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

**If merge selected:** Modify existing focus group to include new items. Re-run dependency ordering for the merged group.

**If no overlap:** Proceed to ordering.

## 6. Priority Ordering

Present the final priority order based on:
1. User's original ordering from Q&A step 3
2. Adjusted by DAG constraints (if user put X before Y but X depends on Y, flag the conflict)

Display proposed order with wave groupings:

```
Proposed execution order:

Wave 1 (no dependencies):
  1. coaching/mistake-detection

Wave 2 (depends on Wave 1):
  2. coaching/grading -> depends: mistake-detection
  3. coaching/session-analysis -> depends: mistake-detection

Wave 3:
  4. coaching/session-summary -> depends: grading, session-analysis
```

Use AskUserQuestion:
- header: "Priority Order"
- question: "Does this order look right? You can reorder within waves (cross-wave reordering would break dependencies)."
- options: "Looks good", "I want to adjust"

If adjust: take user's new order, validate against DAG, re-present.

## 7. Write to ROADMAP.md

Add focus group section to ROADMAP.md:

```markdown
### Focus: {focus_group_name}
**Goal:** {focus_group_goal}
**Priority Order:**
1. {cap}/{feat} -> depends: none
2. {cap}/{feat} -> depends: {dep}
**Status:**
- [ ] {cap}/{feat} (not started)
- [ ] {cap}/{feat} (not started)
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
Dependencies: {explicit_count} explicit, {implicit_count} implicit

Next: Run `/gsd:plan {first_item}` to start planning the first item.
```

</process>

<success_criteria>
- [ ] Focus group name and goal captured via Q&A
- [ ] All scope items resolved via slug-resolve
- [ ] Explicit dependencies traced from CAPABILITY.md and FEATURE.md
- [ ] Implicit dependencies detected via shared file path analysis
- [ ] Cycles detected and resolved with user input
- [ ] Overlap with existing focus groups detected and resolved (merge/parallel/remove)
- [ ] Priority order respects DAG constraints
- [ ] ROADMAP.md updated with focus group section
- [ ] STATE.md updated with active focus reference
- [ ] Commit created with focus group changes
</success_criteria>
