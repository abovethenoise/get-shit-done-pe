<purpose>
Check project progress across capabilities and features, summarize recent work, and route to the next action based on focus groups and feature pipeline state.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-progress)
```

Parse JSON for: `project_exists`, `roadmap_exists`, `state_exists`, `capabilities`, `active_features`, `state_path`, `roadmap_path`, `project_path`, `config_path`.

If `project_exists` is false: suggest `/gsd:new`. Exit.
If missing STATE.md: suggest `/gsd:new`.
If missing ROADMAP.md but PROJECT.md exists: no focus groups available -- skip to Tier 2.
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
```
</step>

<step name="route">
Route using 3-tier priority. Start at Tier 1; fall through when the tier has no actionable result.

**Artifact-based pipeline state detection (used by all tiers):**

For each feature directory under `.planning/features/{feat}/`:
- Has FEATURE.md but no `*-PLAN.md` files -> **needs planning** -> `/gsd:plan {feat}`
- Has `*-PLAN.md` files without matching `*-SUMMARY.md` -> **needs execution** -> `/gsd:execute {feat}`
- Has `*-SUMMARY.md` files but no `review/` directory -> **needs review** -> `/gsd:review {feat}`
- Has `review/` directory but no `doc-report.md` -> **needs doc** -> `/gsd:doc {feat}`
- Has `doc-report.md` -> **complete**

---

**Tier 1 -- Focus Group Routing (primary)**

Parse ROADMAP.md directly for focus groups. Do NOT use `focus_groups` from init (dead code -- never populated).

1. Read ROADMAP.md and identify any focus group sections with feature lists
2. For each active focus group: identify its features and determine pipeline state using artifact detection above
3. Check dependency edges (`-> depends:` entries in ROADMAP.md focus group section):
   - For the candidate next feature, walk its dependency edges
   - If any dependency is incomplete, warn and redirect:
     ```
     Warning: {next-feature} depends on {dep-feature} which is {dep-status}.
     Suggested: Complete {dep-feature} first.
       `/gsd:execute {dep-cap}/{dep-feature}`
     ```
   - If all dependencies satisfied, proceed with routing
4. Detect parallel-safe work: features in different focus groups, or independent features within the same group (no dependency edges between them)
5. If multiple parallel-safe paths exist: present all options and use AskUserQuestion to ask which to advance
6. If single clear next step: present concrete command

If no focus groups found in ROADMAP.md, fall through to Tier 2.

---

**Tier 2 -- Recent Work Continuation (fallback)**

When no focus groups exist:

1. Read STATE.md Session Continuity section
2. Identify last active capability/feature from "Stopped at" and "Resume" fields
3. Determine its pipeline state using artifact detection above
4. Present concrete command to continue

If STATE.md has no session continuity or the referenced feature is complete, fall through to Tier 3.

---

**Tier 3 -- State Scan (final fallback)**

When neither focus groups nor session continuity provide a next step:

1. Scan all feature directories under `.planning/features/`
2. For each, determine pipeline state using artifact detection above
3. Collect all features with incomplete pipeline stages
4. Present prioritized list with concrete commands (execution > review > planning order)

If no incomplete features found, report project complete.

---

**Anti-pattern guards:**
- NEVER suggest "add feature" or "discuss features" when a feature has FEATURE.md with Goal/Flow/composes[] but no PLANs -- the next step is `/gsd:plan`, not more discussion
- NEVER suggest `/gsd:new` when existing features need execution
- Always present the most progressing action: execute > review > plan > discuss

---

**Output format:**

Single next step:
```
## What's Next

**[Focus Group: {name}]** (if applicable)

{cap}/{feat} is ready for {stage}.

`/gsd:{command} {cap/feat}`

<sub>/clear first for fresh context window</sub>
```

Multiple parallel-safe paths:
```
## What's Next

Multiple paths available (parallel-safe):

1. {cap}/{feat1} -- ready for {stage1}
   `/gsd:{command1} {cap/feat1}`

2. {cap}/{feat2} -- ready for {stage2}
   `/gsd:{command2} {cap/feat2}`

Which would you like to advance?
```
</step>

</process>

<success_criteria>
- Rich context provided (recent work, decisions, issues)
- Capability/feature tree with pipeline stages displayed
- Focus group status shown
- 3-tier routing: focus groups -> recent work -> state scan
- Parallel-safe work detected and presented with user choice
- Concrete `/gsd:*` commands in all routing outputs
- Never suggests "add feature" when planning/execution is the next step
- User knows exactly where project stands and what's next
</success_criteria>
