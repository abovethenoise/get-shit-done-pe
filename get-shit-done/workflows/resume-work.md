<trigger>
Use when: starting a new session, user says "continue"/"what's next"/"resume", any operation when .planning/ exists, user returns after time away.
</trigger>

<purpose>
Instantly restore full project context so "Where were we?" has an immediate, complete answer.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/continuation-format.md
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init resume)
```

Parse: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`.

**If `state_exists`:** Proceed to load_state.
**If `state_exists` false but `roadmap_exists` or `project_exists`:** Offer to reconstruct STATE.md.
**If `planning_exists` false:** Route to /gsd:new.
</step>

<step name="load_state">
Read STATE.md and PROJECT.md. Extract: current position, progress bar, recent decisions, blockers, session continuity (where we left off).
</step>

<step name="check_incomplete_work">
Scan for incomplete work across capability/feature directories:

```bash
# Interrupted agents
if [ "$has_interrupted_agent" = "true" ]; then
  echo "Interrupted agent: $interrupted_agent_id"
fi

# Features with PLANs but missing SUMMARYs
for feat_dir in .planning/capabilities/*/features/*/; do
  for plan in "${feat_dir}"*-PLAN.md; do
    [ -f "$plan" ] || continue
    summary="${plan/PLAN/SUMMARY}"
    [ ! -f "$summary" ] && echo "Incomplete: $plan"
  done
done 2>/dev/null

# Continue-here files
ls .planning/capabilities/*/features/*/.continue-here*.md 2>/dev/null
```

Flag findings: mid-plan checkpoint, incomplete execution, interrupted agent.
</step>

<step name="present_status">
```
+--------------------------------------------------------------+
|  PROJECT STATUS                                               |
+--------------------------------------------------------------+
|  Building: [one-liner from PROJECT.md]                        |
|                                                               |
|  Active Feature: {cap}/{feat} - {pipeline stage}              |
|  Focus Group: {group_name}                                    |
|  Progress: [======----] XX%                                   |
|                                                               |
|  Last activity: [date] - [what happened]                      |
+--------------------------------------------------------------+

[If incomplete work:]
  Incomplete work detected:
    - {feature with missing SUMMARY}

[If interrupted agent:]
  Interrupted agent: {id} - {task description}

[If blockers:]
  Carried concerns:
    - {blocker}
```
</step>

<step name="determine_next_action">
Based on project state:

**Git-based task resume (when PLAN exists without SUMMARY):**

For each incomplete plan (PLAN without matching SUMMARY):
1. Extract plan ID from filename (e.g., `01-PLAN.md` → `01`)
2. Scan git log for commits matching the plan's task commit pattern:
   ```bash
   git log --oneline --grep="${CAPABILITY_SLUG}/${FEATURE_SLUG}" --since="7 days ago" | head -20
   ```
3. Count commits that match task patterns (feat, fix, refactor, test, chore with the cap/feat scope)
4. Read the PLAN.md to count total tasks
5. Determine last completed task from commit messages (look for `[task N/M]` pattern in commits)

Present resume context:
```
Plan {plan_id} for {cap}/{feat}: {completed_tasks}/{total_tasks} tasks committed.
Last commit: {last_commit_message} ({time_ago})

Resume from task {next_task}?
```

Use AskUserQuestion:
- header: "Resume"
- question: "Plan {plan_id}: {completed}/{total} tasks done. Resume from task {next}?"
- options:
  - "Resume from task {next}" — pass task offset to execute workflow
  - "Start plan fresh" — re-execute from task 1
  - "Skip this plan" — move to next incomplete plan or next action

| Condition | Primary | Option |
|-----------|---------|--------|
| Interrupted agent | Resume agent (Task resume) | Start fresh |
| Continue-here file | Resume from checkpoint | Start fresh on plan |
| PLAN without SUMMARY | Complete incomplete plan (use git-based resume above) | Abandon and move on |
| Feature fully planned, not executed | `/gsd:execute {cap/feat}` | Review plans first |
| Feature needs planning | `/gsd:new` or `/gsd:enhance` | `/gsd:discuss` first |
| Feature executed, not reviewed | `/gsd:review {cap/feat}` | Skip to next feature |
| Multiple active focus groups | Ask which to resume | Show all |

Determine pipeline stage from artifacts: PLAN without SUMMARY = suggest execute, all SUMMARYs without review = suggest review.
</step>

<step name="offer_options">
```
What would you like to do?

1. {Primary action}
2. Review current feature status
3. Something else
```

If resume detected, replace primary action with:
```
1. Resume {cap}/{feat} from task {N} — `/gsd:execute {cap/feat}` (with resume_from_task={N})
```

When offering planning, check CONTEXT.md first -- if missing, suggest discuss before planning.

Wait for user selection.
</step>

<step name="route_to_workflow">
Based on selection, present next step with `/clear` suggestion:

```
## Next Up

**{action description}**

{slash command}

<sub>/clear first for fresh context window</sub>
```
</step>

<step name="update_session">
Update STATE.md session continuity before proceeding:
```markdown
## Session Continuity
Last session: [now]
Stopped at: Session resumed, proceeding to [action]
```
</step>

</process>

<reconstruction>
If STATE.md missing but other artifacts exist:
1. Read PROJECT.md -> core value, description
2. Read ROADMAP.md -> capabilities, features, current position
3. Scan *-SUMMARY.md files -> decisions, concerns
4. Check for continue-here files -> session continuity

Reconstruct and write STATE.md, then proceed normally.
</reconstruction>

<quick_resume>
If user says "continue" or "go": load state silently, determine primary action, execute immediately without presenting options.
</quick_resume>

<success_criteria>
- STATE.md loaded (or reconstructed)
- Incomplete work detected and flagged
- Clear status presented
- Contextual next actions offered (v2 framing commands)
- Session continuity updated
</success_criteria>
