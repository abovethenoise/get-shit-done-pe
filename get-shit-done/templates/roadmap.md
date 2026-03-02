# Roadmap Template

Template for `.planning/ROADMAP.md` -- the project's focus group tracker.

---

## File Template

```markdown
# Roadmap: {project_name}

## Overview

{project_overview}

## Active Focus Groups

{empty on init for new projects, pre-populated for brownfield}

## Completed Focus Groups

{empty}
```

## Focus Group Format

Each active focus group follows this pattern:

```markdown
### Focus: {group-name}

**Goal:** {What this sprint delivers -- one sentence}

**Priority Order:**
1. {cap}/{feat} -> depends: none
2. {cap}/{feat} -> depends: {cap}/{feat-above}
3. {cap}/{feat} -> depends: {cap}/{feat-above}

**Status:**
- [x] {cap}/{feat} (complete)
- [ ] {cap}/{feat} (in progress)
- [ ] {cap}/{feat} (not started)
```

Completed focus groups collapse to a simple checklist:

```markdown
### Focus: {completed-group} (done {date})

**Goal:** {what it delivered}

**Items:**
- [x] {cap}/{feat}
- [x] {cap}/{feat}
```

<guidelines>

**Focus groups replace phases.** There are no phase numbers, no phase-level success criteria, no requirement mappings in the roadmap. Those live in FEATURE.md.

**Per-item dependency lines** (`-> depends:`) replace phase-level `**Depends on**`. Each feature knows what it needs.

**No plan lists.** Plan progression is tracked in the feature directory and visible via `/gsd:progress`.

**No progress table.** The `/gsd:progress` command renders this dynamically from disk state.

**Priority order matters.** Items within a focus group are listed in execution order. Dependencies flow downward (item N depends on items above it).

**Creation:**
- New projects: empty Active Focus Groups (user hasn't run /gsd:focus yet)
- Brownfield projects: one pre-populated focus group from inferred capabilities

**Updates:**
- `/gsd:focus` creates and modifies focus groups
- Execute workflow checks off completed items
- Completed groups move from Active to Completed section

</guidelines>

<status_values>
Focus group items use checkbox status:
- `[ ]` -- not started
- `[ ]` -- in progress (annotated)
- `[x]` -- complete

Focus groups as a whole:
- Active (in Active Focus Groups section)
- Complete (moved to Completed Focus Groups section with date)
</status_values>
