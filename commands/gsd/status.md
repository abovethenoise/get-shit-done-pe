---
name: gsd:status
description: Show capability/feature progress dashboard with optional detail view
argument-hint: "[capability or feature slug]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

<objective>
Display the project's capability/feature progress as a structured dashboard. With no arguments, shows the full tree. With a slug argument, shows detail for a specific capability or feature.

**No arguments:** Full overview -- all capabilities with feature counts, completion percentages, and active focus groups.
**With slug:** Detail view for a specific capability (features list with status) or feature (requirements counts, plan status).
</objective>

<context>
**User reference:** $ARGUMENTS (optional -- capability or feature slug for detail view)

Data sourced from `gsd-tools init feature-progress` (full overview) and `gsd-tools slug-resolve` (detail view).
</context>

<process>
## 1. Determine Mode

**If $ARGUMENTS is empty or not provided:** Full overview mode.
**If $ARGUMENTS provided:** Detail mode.

## 2. Full Overview Mode

```bash
PROGRESS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-progress)
```

Parse JSON for capabilities and features. Read STATE.md for active focus groups.

Display dashboard:

```
-------------------------------------------------------
 GSD > PROJECT STATUS
-------------------------------------------------------

## Capabilities

| Capability       | Features | Complete | Status      |
|------------------|----------|----------|-------------|
| coaching         | 3        | 33%      | in-progress |
| mistake-grading  | 2        | 0%       | exploring   |

## Active Focus Groups

### Coaching Foundation
Goal: Surface mistakes and grade decisions for a single user session.
- [x] coaching/mistake-detection (complete)
- [ ] coaching/grading (in progress)
- [ ] coaching/session-summary (not started)
```

Read ROADMAP.md to extract active focus group sections and display their status checklists.

## 3. Detail Mode

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```

**If resolved to capability:**
```bash
STATUS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-status "$CAPABILITY_SLUG")
```

Display:
- Capability name, status
- Feature list with per-feature: name, status, requirement counts (EU/FN/TC), plan count, summary count

**If resolved to feature:**
```bash
STATUS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-status "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Display:
- Feature name, status, parent capability
- Requirement counts per layer (EU, FN, TC)
- Plans and summaries in feature directory
- Discovery brief status

**If not resolved:**
- If ambiguous: present candidates, ask user to be more specific
- If no match: "No capability or feature matches '$ARGUMENTS'. Run `/gsd:status` with no arguments to see all."

</process>

<success_criteria>
- Full overview shows all capabilities with feature counts and completion
- Active focus groups displayed from ROADMAP.md
- Detail view resolves slug via 3-tier resolution
- Per-capability detail shows feature breakdown
- Per-feature detail shows requirement counts and pipeline status
</success_criteria>
