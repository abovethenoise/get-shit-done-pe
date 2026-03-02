<purpose>
Execute all plans for a feature using wave-based parallel execution. Orchestrator stays lean -- delegates plan execution to subagents.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans -> analyze deps -> group waves -> spawn agents -> handle checkpoints -> collect results.
</core_principle>

<inputs>
**CAPABILITY_SLUG** — The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** — The feature to execute (e.g., "mistake-detection")

These come from framing-pipeline context or from direct user invocation via /gsd:execute.
</inputs>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<process>

<step name="initialize" priority="first">
Load all context in one call:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `feature_found`, `feature_dir`, `feature_slug`, `capability_slug`, `capability_dir`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`.

**If `feature_found` is false:** Error — feature directory not found.
**If `plan_count` is 0:** Error — no plans found for feature.
**If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.

When `parallelization` is false, plans within a wave execute sequentially.
</step>

<step name="validate_feature">
From init JSON: `feature_dir`, `plan_count`, `incomplete_count`.

Report: "Found {plan_count} plans in {feature_dir} ({incomplete_count} incomplete)"
</step>

<step name="discover_and_group_plans">
Scan the feature directory for plans and group by wave:

```bash
ls "${feature_dir}"/*-PLAN.md 2>/dev/null | sort
```

For each plan file, read its frontmatter to extract `wave`, `depends_on`, `autonomous`, objective, `files_modified`, task count. Group plans by wave number.

**Filtering:** Skip plans where a matching SUMMARY exists. If all filtered: "No matching incomplete plans" -> exit.

Report:
```
## Execution Plan

**Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}** — {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01, 02 | {from plan objectives, 3-8 words} |
| 2 | 03 | ... |
```
</step>

<step name="execute_waves">
Execute each wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>`. Extract what's being built and why.

   ```
   ---
   ## Wave {N}

   **{Plan ID}: {Plan Name}**
   {2-3 sentences: what this builds, technical approach, why it matters}

   Spawning {count} agent(s)...
   ---
   ```

   - Bad: "Executing terrain generation plan"
   - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."

2. **Spawn executor agents:**

   Pass paths only — executors read files themselves with their fresh 200k context.
   This keeps orchestrator context lean (~10-15%).

   ```
   Task(
     subagent_type="gsd-executor",
     model="{executor_model}",
     prompt="
       <objective>
       Execute plan {plan_number} of feature {CAPABILITY_SLUG}/{FEATURE_SLUG}.
       Commit each task atomically. Create SUMMARY.md. Update STATE.md.
       </objective>

       <execution_context>
       @~/.claude/get-shit-done/workflows/execute-plan.md
       @~/.claude/get-shit-done/templates/summary.md
       @~/.claude/get-shit-done/references/checkpoints.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - {feature_dir}/{plan_file} (Plan)
       - .planning/STATE.md (State)
       - .planning/config.json (Config, if exists)
       - ./CLAUDE.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
       - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
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

4. **Report completion — spot-check claims first:**

   For each SUMMARY.md:
   - Verify first 2 files from `key-files.created` exist on disk
   - Check `git log --oneline --all --grep="${CAPABILITY_SLUG}/${FEATURE_SLUG}"` returns >=1 commit
   - Check for `## Self-Check: FAILED` marker

   If ANY spot-check fails: report which plan failed, route to failure handler — ask "Retry plan?" or "Continue with remaining waves?"

   If pass:
   ```
   ---
   ## Wave {N} Complete

   **{Plan ID}: {Plan Name}**
   {What was built — from SUMMARY.md}
   {Notable deviations, if any}

   {If more waves: what this enables for next wave}
   ---
   ```

   - Bad: "Wave 2 complete. Proceeding to Wave 3."
   - Good: "Terrain system complete — 3 biome types, height-based texturing, physics collision meshes. Vehicle physics (Wave 3) can now reference ground surfaces."

5. **Handle failures:**

   **Known Claude Code bug (classifyHandoffIfNeeded):** If an agent reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a GSD or agent issue. The error fires in the completion handler AFTER all tool calls finish. In this case: run the same spot-checks as step 4 (SUMMARY.md exists, git commits present, no Self-Check: FAILED). If spot-checks PASS -> treat as **successful**. If spot-checks FAIL -> treat as real failure below.

   For real failures: report which plan failed -> ask "Continue?" or "Stop?" -> if continue, dependent plans may also fail. If stop, partial completion report.

6. **Execute checkpoint plans between waves** — see `<checkpoint_handling>`.

7. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

**Standard flow:**

1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint task or auth gate -> returns structured state
3. Agent return includes: completed tasks table, current task + blocker, checkpoint type/details, what's awaited
4. **Present to user:**
   ```
   ## Checkpoint: [Type]

   **Plan:** {plan_id} {Plan Name}
   **Progress:** 2/3 tasks complete

   [Checkpoint Details from agent return]
   [Awaiting section from agent return]
   ```
5. User responds: "approved"/"done" | issue description | decision selection
6. **Spawn continuation agent (NOT resume)** using continuation-prompt.md template:
   - `{completed_tasks_table}`: From checkpoint return
   - `{resume_task_number}` + `{resume_task_name}`: Current task
   - `{user_response}`: What user provided
   - `{resume_instructions}`: Based on checkpoint type
7. Continuation agent verifies previous commits, continues from resume point
8. Repeat until plan completes or user stops

**Why fresh agent, not resume:** Resume relies on internal serialization that breaks with parallel tool calls. Fresh agents with explicit state are more reliable.

**Checkpoints in parallel waves:** Agent pauses and returns while other parallel agents may complete. Present checkpoint, spawn continuation, wait for all before next wave.
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
Cross-reference requirement IDs from PLAN frontmatter against FEATURE.md — every ID MUST be accounted for.
Create VERIFICATION.md.",
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

Read status:
```bash
grep "^status:" "${feature_dir}"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Action |
|--------|--------|
| `passed` | -> update_feature_status |
| `human_needed` | Present items for human testing, get approval or feedback |
| `gaps_found` | Present gap summary, offer gap-closure planning |

**If human_needed:**
```
## Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG} — Human Verification Required

All automated checks passed. {N} items need human testing:

{From VERIFICATION.md human_verification section}

"approved" -> continue | Report issues -> gap closure
```

**If gaps_found:**
```
## Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG} — Gaps Found

**Score:** {N}/{M} must-haves verified
**Report:** {feature_dir}/VERIFICATION.md

### What's Missing
{Gap summaries from VERIFICATION.md}

---
## Next Up

Address gaps and re-verify.

<sub>`/clear` first for fresh context window</sub>

Also: `cat {feature_dir}/VERIFICATION.md` — full report
```
</step>

<step name="update_feature_status">
**Mark feature complete and update tracking:**

Update FEATURE.md frontmatter `status: complete` with completion date.

Count plans vs summaries in feature directory to confirm all complete:
```bash
PLAN_COUNT=$(ls "${feature_dir}"/*-PLAN.md 2>/dev/null | wc -l)
SUMMARY_COUNT=$(ls "${feature_dir}"/*-SUMMARY.md 2>/dev/null | wc -l)
```

Update STATE.md active feature to reflect completion.

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): complete execution" --files ${feature_dir}/FEATURE.md .planning/STATE.md ${feature_dir}/*-VERIFICATION.md
```
</step>

<step name="offer_next">

**Exception:** If `gaps_found`, the `verify_feature_goal` step already presents the gap-closure path. No additional routing needed.

After verification passes and feature status is updated, return completion status to parent:

```
## EXECUTION COMPLETE

Feature: ${CAPABILITY_SLUG}/${FEATURE_SLUG}
Plans: ${completed_count}/${total_count}
Verification: {Passed | Gaps Found}

[Include aggregate_results output]
```

The workflow ends. The user decides next steps (review, documentation, or next feature).
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context. Subagents: fresh 200k each. No polling (Task blocks). No context bleed.
</context_efficiency>

<failure_handling>
- **classifyHandoffIfNeeded false failure:** Agent reports "failed" but error is `classifyHandoffIfNeeded is not defined` -> Claude Code bug, not GSD. Spot-check (SUMMARY exists, commits present) -> if pass, treat as success
- **Agent fails mid-plan:** Missing SUMMARY.md -> report, ask user how to proceed
- **Dependency chain breaks:** Wave 1 fails -> Wave 2 dependents likely fail -> user chooses attempt or skip
- **All agents in wave fail:** Systemic issue -> stop, report for investigation
- **Checkpoint unresolvable:** "Skip this plan?" or "Abort execution?" -> record partial progress in STATE.md
</failure_handling>

<resumption>
Re-run the execute workflow -> discover_plans finds completed SUMMARYs -> skips them -> resumes from first incomplete plan -> continues wave execution.

STATE.md tracks: last completed plan, current wave, pending checkpoints.
</resumption>
