<purpose>
Execute all plans for a feature using wave-based parallel execution. Orchestrator coordinates, not executes -- each subagent loads the full execute-plan context.
</purpose>

<inputs>
**CAPABILITY_SLUG** -- The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** -- The feature to execute (e.g., "mistake-detection")
</inputs>

<required_reading>
Read STATE.md before any operation to load project context.
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<process>

<step name="initialize" priority="first">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `feature_found`, `feature_dir`, `feature_slug`, `capability_slug`, `capability_dir`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`.

**If `feature_found` is false:** Error -- feature directory not found.
**If `plan_count` is 0:** Error -- no plans found for feature.
**If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.

When `parallelization` is false, plans within a wave execute sequentially.
</step>

<step name="discover_and_group_plans">
Scan the feature directory for plans, group by wave:

```bash
ls "${feature_dir}"/*-PLAN.md 2>/dev/null | sort
```

For each plan, read frontmatter: `wave`, `depends_on`, `autonomous`, objective, `files_modified`, task count. Group by wave. Skip plans with matching SUMMARY.

Report: "Found {plan_count} plans in {feature_dir} ({incomplete_count} incomplete)"

```
## Execution Plan

**Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}** -- {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01, 02 | {from plan objectives, 3-8 words} |
| 2 | 03 | ... |
```
</step>

<step name="execute_waves">
Execute each wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.

**For each wave:**

1. **Describe what's being built (BEFORE spawning).** Read each plan's `<objective>`. Extract what's being built and why. Good: "Procedural terrain generator using Perlin noise -- creates height maps, biome zones, and collision meshes."

2. **Spawn executor agents** (paths only -- executors read files themselves with fresh 200k context):

   ```
   Task(
     subagent_type="gsd-executor",
     prompt="
       <objective>
       Execute plan {plan_number} of feature {CAPABILITY_SLUG}/{FEATURE_SLUG}.
       Commit each task atomically. Create SUMMARY.md. Update STATE.md.
       </objective>

       <execution_context>
       @{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
       @{GSD_ROOT}/get-shit-done/templates/summary.md
       @{GSD_ROOT}/get-shit-done/references/checkpoints.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - {feature_dir}/{plan_file} (Plan)
       - .planning/STATE.md (State)
       - .planning/config.json (Config, if exists)
       - ./CLAUDE.md (Project instructions, if exists)
       - .claude/skills/ or .agents/skills/ (Project skills, if either exists)
       </files_to_read>

       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created in feature directory
       - [ ] STATE.md updated with position and decisions
       </success_criteria>
     "
   )
   ```

3. **Wait for all agents in wave to complete.**

4. **Spot-check claims before reporting:**
   - Verify first 2 files from `key-files.created` exist on disk
   - Check `git log --oneline --all --grep="${CAPABILITY_SLUG}/${FEATURE_SLUG}"` returns >=1 commit
   - Check for `## Self-Check: FAILED` marker

   If ANY spot-check fails: report which plan failed, ask "Retry plan?" or "Continue with remaining waves?"

   If pass: report what was built from SUMMARY.md, note deviations, explain what this enables for next wave.

5. **Handle failures:**
   - **classifyHandoffIfNeeded bug:** If agent reports "failed" with `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug. Run spot-checks -- if PASS, treat as successful.
   - For real failures: report which plan failed, ask "Continue?" or "Stop?"

6. **Execute checkpoint plans between waves** -- see `<checkpoint_handling>`.

7. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint -> returns structured state (completed tasks table, current task + blocker, checkpoint type, what's awaited)
3. Present checkpoint to user
4. User responds: "approved"/"done" | issue description | decision selection
5. Spawn continuation agent (NOT resume -- fresh agents with explicit state are more reliable) using continuation-prompt.md template
6. Continuation agent verifies previous commits, continues from resume point
7. Repeat until plan completes or user stops

Checkpoints in parallel waves: agent pauses while other parallel agents may complete. Present checkpoint, spawn continuation, wait for all before next wave.
</step>

<step name="aggregate_results">
After all waves:

```markdown
## Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG} Execution Complete

**Waves:** {N} | **Plans:** {M}/{total} complete

| Wave | Plans | Status |
|------|-------|--------|
| 1 | plan-01, plan-02 | Complete |
| CP | plan-03 | Verified |
| 2 | plan-04 | Complete |

### Plan Details
1. **01**: [one-liner from SUMMARY.md]
2. **02**: [one-liner from SUMMARY.md]

### Issues Encountered
[Aggregate from SUMMARYs, or "None"]
```
</step>

<step name="verify_feature_goal">
Verify feature achieved its GOAL, not just completed tasks.

```
Task(
  prompt="Verify feature goal achievement.
Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}
Feature directory: {feature_dir}
Feature goal: {goal from FEATURE.md}
Feature requirement IDs: {feature_req_ids from FEATURE.md}
Check must_haves against actual codebase.
Cross-reference requirement IDs from PLAN frontmatter against FEATURE.md.
Create VERIFICATION.md.",
  subagent_type="gsd-verifier"
)
```

| Status | Action |
|--------|--------|
| `passed` | -> update_feature_status |
| `human_needed` | Present items for human testing, get approval or feedback |
| `gaps_found` | Present gap summary, offer gap-closure planning |
</step>

<step name="update_feature_status">
Update FEATURE.md frontmatter `status: complete` with completion date. Count plans vs summaries to confirm all complete. Update STATE.md.

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): complete execution" --files ${feature_dir}/FEATURE.md .planning/STATE.md ${feature_dir}/*-VERIFICATION.md
```
</step>

<step name="offer_next">
If `gaps_found`, the verify step already presents gap-closure path -- no routing needed.

After verification passes:
```
## EXECUTION COMPLETE

Feature: ${CAPABILITY_SLUG}/${FEATURE_SLUG}
Plans: ${completed_count}/${total_count}
Verification: {Passed | Gaps Found}

[Include aggregate_results output]
```

The workflow returns. If running under pipeline orchestration (framing-pipeline.md), the pipeline handles next-stage chaining automatically. If running standalone (via /gsd:execute), present next steps to user:
- "Continue with: `/gsd:review {cap/feat}`" if review is next
- "Continue with: `/gsd:doc {cap/feat}`" if review already done
</step>

</process>

<failure_handling>
- **classifyHandoffIfNeeded false failure:** Claude Code bug, not GSD. Spot-check -> if pass, treat as success
- **Agent fails mid-plan:** Missing SUMMARY.md -> report, ask user how to proceed
- **Dependency chain breaks:** Wave 1 fails -> Wave 2 dependents likely fail -> user chooses attempt or skip
- **All agents in wave fail:** Systemic issue -> stop, report for investigation
- **Checkpoint unresolvable:** "Skip this plan?" or "Abort execution?" -> record partial progress in STATE.md
</failure_handling>

<resumption>
Re-run execute workflow -> discover_plans finds completed SUMMARYs -> skips them -> resumes from first incomplete plan -> continues wave execution. STATE.md tracks: last completed plan, current wave, pending checkpoints.
</resumption>
