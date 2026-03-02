# State Template

Template for `.planning/STATE.md` -- the project's living memory.

---

## File Template

```markdown
---
gsd_state_version: 2.0
active_focus: null
status: unknown
last_updated: "{date}"
progress:
  capabilities: 0
  features: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated {date})
**Core value:** {core_value}

## Active Focus Groups

{empty on init -- populated by /gsd:focus}

## Key Decisions

{empty on init}

## Blockers

{none}

## Session Continuity

Last session: {date}
Last action: Project initialized
Resume: Run /gsd:discuss-capability <cap> to begin
```

<purpose>

STATE.md is the project's short-term memory spanning all capabilities, features, and sessions.

**Problem it solves:** Information is captured in summaries, issues, and decisions but not systematically consumed. Sessions start without context.

**Solution:** A single, small file that's:
- Read first in every workflow
- Updated after every significant action
- Contains digest of accumulated context
- Enables instant session restoration

</purpose>

<lifecycle>

**Creation:** During /gsd:init (steps 3h/4h)
- Reference PROJECT.md (read it for current context)
- Initialize empty focus groups and decisions
- Set session continuity to "Project initialized"

**Reading:** First step of every workflow
- progress: Present status to user
- plan: Inform planning decisions
- execute: Know current position
- focus: Know what's active

**Writing:** After every significant action
- execute: After SUMMARY.md created
  - Update active focus group state
  - Note new decisions
  - Add blockers/concerns
- focus: After focus group created/updated
  - Update Active Focus Groups section
  - Set active_focus in frontmatter

</lifecycle>

<sections>

### Project Reference
Points to PROJECT.md for full context. Includes:
- Core value (the ONE thing that matters)
- Last update date (triggers re-read if stale)

Claude reads PROJECT.md directly for requirements, constraints, and decisions.

### Active Focus Groups
Where we are right now. Each focus group tracks:
- Goal (what the sprint delivers)
- Active capability/feature being worked
- Current plan path
- Status (in progress / blocked / complete)

Supports multiple parallel focus groups.

Format per focus group:
```
### Focus: {group-name}
**Goal:** {one sentence}
**Active capability:** {cap-slug} / {feat-slug}
**Current plan:** {path to active PLAN.md or "none"}
**Status:** {In progress / Blocked / Complete}
```

### Key Decisions
3-5 recent decisions affecting active work. Scoped to active focus groups.
- {cap/feat}: {decision summary}

Full decision log lives in PROJECT.md.

### Blockers
Active blockers only. Cleared when addressed.
- {cap/feat}: {blocker description}

### Session Continuity
Enables instant resumption:
- When was last session
- What was last completed
- What to do next (points to focus group or capability)

</sections>

<size_constraint>

Keep STATE.md under 100 lines.

It's a DIGEST, not an archive. If accumulated context grows too large:
- Keep only 3-5 recent decisions (full log in PROJECT.md)
- Keep only active blockers, remove resolved ones
- Max 2 decisions per focus group in the section

The goal is "read once, know where we are" -- if it's too long, that fails.

</size_constraint>
