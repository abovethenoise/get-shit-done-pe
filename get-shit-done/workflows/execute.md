<purpose>
Execute all plans for a capability or feature using wave-based parallel execution. Orchestrator coordinates — each subagent loads full execute-plan context.
</purpose>

<inputs>
**TARGET_SLUG** -- Capability or feature slug
**TARGET_TYPE** -- "capability" or "feature"
</inputs>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
</required_reading>

<process>

<step name="initialize" priority="first">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "$TARGET_SLUG")
```

Parse: `commit_docs`, `parallelization`, `feature_found`, `feature_dir`, `feature_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`.

Determine target directory:
- Feature: `.planning/features/${TARGET_SLUG}`
- Capability: `.planning/capabilities/${TARGET_SLUG}`

**If not found:** Error.
**If no plans:** Error.
</step>

<step name="discover_and_group_plans">
```bash
ls "${target_dir}"/*-PLAN.md 2>/dev/null | sort
```

Read frontmatter per plan: `wave`, `depends_on`, `autonomous`, objective. Group by wave. Skip plans with matching SUMMARY.

```
## Execution Plan

**${TARGET_TYPE}: ${TARGET_SLUG}** -- {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
```
</step>

<step name="execute_waves">
Execute waves sequentially. Within wave: parallel if enabled, sequential if not.

**Per wave:**

1. **Describe what's being built** from plan objectives.

2. **Spawn executor agents** (paths only — executors read files themselves):
   ```
   Task(
     subagent_type="gsd-executor",
     prompt="
       <objective>Execute plan {N} of ${TARGET_TYPE} ${TARGET_SLUG}.</objective>
       <execution_context>
       @{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
       @{GSD_ROOT}/get-shit-done/templates/summary.md
       @{GSD_ROOT}/get-shit-done/references/checkpoints.md
       @{GSD_ROOT}/get-shit-done/references/executor-reference.md
       </execution_context>
       <files_to_read>
       - {target_dir}/{plan_file} (Plan)
       - .planning/STATE.md (State)
       - .planning/config.json (Config, if exists)
       - ./CLAUDE.md (Project instructions, if exists)
       </files_to_read>
       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created
       - [ ] STATE.md updated
       </success_criteria>"
   )
   ```

3. **Wait for wave completion.**

4. **Spot-check:** Verify key files exist, git log has commits, no Self-Check: FAILED markers.

5. **Handle failures:** classifyHandoffIfNeeded bug → spot-check → if pass, treat as success. Real failures → report, ask user.
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction. Agent runs until checkpoint → returns state → present to user → spawn continuation agent with explicit state → repeat until complete.
</step>

<step name="aggregate_results">
```markdown
## ${TARGET_TYPE}: ${TARGET_SLUG} Execution Complete

**Waves:** {N} | **Plans:** {M}/{total} complete

| Wave | Plans | Status |
|------|-------|--------|

### Plan Details
[one-liner per plan from SUMMARY.md]

### Issues Encountered
[Aggregate from SUMMARYs, or "None"]
```
</step>

<step name="verify_goal">
```
Task(
  prompt="Verify ${TARGET_TYPE} ${TARGET_SLUG}.
Target directory: {target_dir}
Goal: {goal from spec}
Check must_haves against actual codebase.
Create VERIFICATION.md.
<execution_context>
@{GSD_ROOT}/get-shit-done/references/verifier-reference.md
</execution_context>",
  subagent_type="gsd-verifier"
)
```

| Status | Action |
|--------|--------|
| `passed` | → update status |
| `human_needed` | Present items for human testing |
| `gaps_found` | Present gap summary, offer gap-closure planning |
</step>

<step name="update_status">
Update spec frontmatter `status: complete` with completion date.

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${TARGET_SLUG}): complete execution" --files ${target_dir}/*.md .planning/STATE.md
```
</step>

<step name="offer_next">
```
## EXECUTION COMPLETE

${TARGET_TYPE}: ${TARGET_SLUG}
Plans: ${completed}/${total}
Verification: {Passed | Gaps Found}
```

If running under pipeline orchestration: pipeline handles chaining. Standalone: suggest `/gsd:review` or `/gsd:doc`.
</step>

</process>

<failure_handling>
- classifyHandoffIfNeeded: Claude Code bug. Spot-check → if pass, treat as success.
- Agent fails mid-plan: Missing SUMMARY → report, ask user.
- Dependency chain breaks: Wave 1 fails → user chooses attempt or skip Wave 2.
- All agents in wave fail: Stop for investigation.
</failure_handling>

<resumption>
Re-run → discover_plans finds completed SUMMARYs → skips → resumes from first incomplete plan.
</resumption>
