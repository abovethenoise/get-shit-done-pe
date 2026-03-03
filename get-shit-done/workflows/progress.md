<purpose>
Check project progress across capabilities and features, summarize recent work, and route to the next action based on feature pipeline state.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-progress)
```

Parse JSON for: `project_exists`, `roadmap_exists`, `state_exists`, `capabilities`, `active_features`, `focus_groups`, `state_path`, `roadmap_path`, `project_path`, `config_path`.

If `project_exists` is false: suggest `/gsd:new`. Exit.
If missing STATE.md: suggest `/gsd:new`.
If missing ROADMAP.md but PROJECT.md exists: between focus groups -> Route F.
</step>

<step name="load_context">
Use structured extraction:
```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state-snapshot)
```
</step>

<step name="gather_recent_work">
Find 2-3 most recent SUMMARY.md files across feature directories:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract <path> --fields one_liner
```
</step>

<step name="report">
```bash
PROGRESS_BAR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

```
# [Project Name]

**Progress:** {PROGRESS_BAR}
**Profile:** [quality/balanced/budget]

## Capability / Feature Tree

| Capability | Feature | Stage | Plans | Status |
|------------|---------|-------|-------|--------|
| {cap_slug} | {feat_slug} | execute | 3/5 | In progress |
| {cap_slug} | {feat_slug} | review | 2/2 | Ready for review |

**For in-progress plans (PLAN without SUMMARY):**
Scan git log for task-level commits:
```bash
git log --oneline --grep="\[task [0-9]*/[0-9]*\]" --grep="{cap_slug}/{feat_slug}" --all-match --since="30 days ago" | wc -l
```

Display in Status column as: "In progress (3/5 tasks committed)" instead of just "In progress".

## Focus Groups

| Group | Features | Status |
|-------|----------|--------|
| {group_name} | {feat1}, {feat2} | {active/planned/complete} |

## Recent Work

- [{cap}/{feat}]: {one-liner from summary-extract}
- [{cap}/{feat}]: {one-liner}

## Key Decisions

- {from STATE.md decisions}

## Blockers/Concerns

- {from STATE.md blockers}

## What's Next

{Next action based on feature pipeline state}
```
</step>

<step name="route">
**Dependency readiness check (before routing):**

1. Read active focus group from STATE.md (if exists)
2. Read dependency edges from ROADMAP.md focus group section (the `-> depends:` entries)
3. For the candidate "next" feature (the one that would be routed to):
   - Walk dependency edges
   - For each dependency: check if that feature has a SUMMARY.md (complete) or is in the same/earlier wave
   - If any dependency is incomplete → override route with warning:

```
⚠️ Dependency not ready: {next-feature} depends on {dep-feature} which is {dep-status}.

Suggested action: Complete {dep-feature} first.
  `/gsd:execute {dep-cap}/{dep-feature}`
```

4. If all dependencies satisfied → proceed with normal routing below

Determine next action from feature pipeline state:

| Condition | Route |
|-----------|-------|
| Feature has PLANs without SUMMARYs | **A: Execute** -- `/gsd:execute {cap/feat}` |
| Feature complete, not reviewed | **B: Review** -- `/gsd:review {cap/feat}` |
| Feature needs planning | **C: Plan** -- `/gsd:plan {cap/feat}` or `/gsd:new` |
| All features in focus group complete | **D: Focus group done** -- suggest next focus group |
| All capabilities complete | **E: Milestone complete** -- archive and next |
| Between focus groups | **F: Start next** -- `/gsd:new` |

Present route with `/clear` first suggestion for fresh context.

For Route A:
```
## Next Up

**Execute Feature: {cap}/{feat}** -- {objective from next PLAN}

`/gsd:execute {cap/feat}`

<sub>/clear first for fresh context window</sub>
```

For Route C (check CONTEXT.md first):
```
## Next Up

**Feature: {cap}/{feat}** -- {goal}

`/gsd:new` or `/gsd:enhance` -- enter via framing command

<sub>/clear first for fresh context window</sub>

Also: `/gsd:discuss` -- gather context first
```
</step>

</process>

<success_criteria>
- Rich context provided (recent work, decisions, issues)
- Capability/feature tree with pipeline stages displayed
- Focus group status shown
- Smart routing based on feature pipeline state
- User knows exactly where project stands and what's next
</success_criteria>
