<purpose>
Execute a feature plan (PLAN.md) and create the outcome summary (SUMMARY.md).
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for planning behavior settings.
@{GSD_ROOT}/get-shit-done/references/git-integration.md
</required_reading>

<inputs>
**CAPABILITY_SLUG** -- The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** -- The feature being executed (e.g., "mistake-detection")
</inputs>

<process>

<step name="init_context" priority="first">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Extract: `executor_model`, `commit_docs`, `feature_dir`, `feature_slug`, `capability_slug`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.

If `.planning/` missing: error.
</step>

<step name="identify_plan">
Find first PLAN without matching SUMMARY (match by ID prefix, e.g., 01-PLAN.md -> 01-SUMMARY.md).

**If `resume_from_task` parameter provided:**
- Skip tasks 1 through (resume_from_task - 1)
- Display: "Resuming from task {resume_from_task} of {total}. Tasks 1-{resume_from_task-1} already committed."
- Verify skipped tasks have corresponding git commits (sanity check):
  ```bash
  git log --oneline --grep="\[task [0-9]*/[0-9]*\]" --grep="${CAPABILITY_SLUG}/${FEATURE_SLUG}" --all-match | head -20
  ```
- Begin execution from the specified task

<if mode="yolo">Auto-approve: `Execute {plan_file} [Plan X of Y for Feature ${FEATURE_SLUG}]` -> parse_segments.</if>
<if mode="interactive">Present plan identification, wait for confirmation.</if>
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="parse_segments">
```bash
grep -n "type=\"checkpoint" ${feature_dir}/{plan_file}
```

| Checkpoints | Pattern | Execution |
|-------------|---------|-----------|
| None | A (autonomous) | Single subagent: full plan + SUMMARY + commit |
| Verify-only | B (segmented) | Segments between checkpoints. Subagent for auto, main for decisions |
| Decision | C (main) | Execute entirely in main context |

**Pattern A:** init_agent_tracking -> spawn Task(subagent_type="gsd-executor", model=executor_model) -> track -> wait -> report.
**Pattern B:** Execute segment-by-segment. Auto segments via subagent (tasks only, no SUMMARY). Checkpoints in main. After all: aggregate, SUMMARY, commit.
**Pattern C:** Execute in main using standard flow (step name="execute").
</step>

<step name="init_agent_tracking">
```bash
if [ ! -f .planning/agent-history.json ]; then
  echo '{"version":"1.0","max_entries":50,"entries":[]}' > .planning/agent-history.json
fi
rm -f .planning/current-agent-id.txt
```

On spawn: write agent_id to `current-agent-id.txt`, append to agent-history.json. On completion: status -> "completed", delete current-agent-id.txt. Prune: if entries > max_entries, remove oldest "completed".

Run for Pattern A/B before spawning. Pattern C: skip.
</step>

<step name="segment_execution">
Pattern B only. Per segment: subagent for auto tasks (no SUMMARY/commit), main for checkpoints. After ALL segments: aggregate -> SUMMARY -> commit -> self-check (key-files exist, git commits present, append Self-Check status).

**classifyHandoffIfNeeded bug:** If segment agent reports "failed" with this error, run spot-checks; if pass, treat as successful.
</step>

<step name="load_prompt">
```bash
cat ${feature_dir}/{plan_file}
```
This IS the execution instructions. Follow exactly. If plan references CONTEXT.md: honor user's vision throughout.

**If DESIGN.md exists at `.planning/DESIGN.md`:** Read and apply design constraints throughout execution. Follow color system, typography, component patterns, and anti-patterns defined in the design guide.

**If plan contains `<interfaces>` block:** Use pre-extracted type definitions directly -- do NOT re-read source files.
</step>

<step name="previous_plan_check">
Check previous SUMMARY for unresolved "Issues Encountered" or blockers. If found: ask "Proceed anyway" | "Address first" | "Review previous".
</step>

<step name="execute">
1. Read @context files from prompt
2. Per task:
   - `type="auto"`: Implement, handle auth gates, handle unexpected issues per deviation rules. Verify done criteria. Commit per task_commit. Track hash.
   - `type="checkpoint:*"`: STOP -> checkpoint_protocol -> wait -> continue after confirmation.
3. Run `<verification>` checks
4. Confirm `<success_criteria>` met
5. Document unplanned changes in Summary
</step>

<step name="auth_gates">
Auth errors during execution are NOT failures -- they're expected interaction points.

**Indicators:** "Not authenticated", "Unauthorized", 401/403, "Please run {tool} login", "Set {ENV_VAR}"

**Protocol:** Recognize -> STOP -> create dynamic checkpoint:human-action with exact auth steps -> wait -> verify credentials -> retry -> continue.

In Summary: document under "Authentication Gates", not deviations.
</step>

<step name="unplanned_work">
**Auto-fix:** Bugs, missing dependencies, blockers -- fix and continue. Document in summary.
**Stop and ask:** Architectural issues that change fundamental approach -- STOP, return checkpoint.
**Scope:** Only fix issues directly related to current task. Log unrelated discoveries to `deferred-items.md`.
**Limit:** More than 2 auto-fixes on a single task -- pause and assess.

Summary MUST include unplanned changes section (or "None - plan executed exactly as written").
</step>

<step name="task_commit">
After each task (verification passed, done criteria met), commit immediately.

1. `git status --short`
2. Stage individually (NEVER `git add .`)
3. Commit: `{type}({CAPABILITY_SLUG}/{FEATURE_SLUG}): [task {N}/{total}] {description}` with bullet points
4. Record: `TASK_COMMIT=$(git rev-parse --short HEAD)`

| Type | When |
|------|------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `test` | Test-only |
| `refactor` | No behavior change |
| `chore` | Config/deps |
</step>

<step name="checkpoint_protocol">
On `type="checkpoint:*"`: automate everything possible first. Checkpoints are for verification/decisions only.

Display: `CHECKPOINT: [Type]` -> Progress {X}/{Y} -> type-specific content -> `YOUR ACTION: [signal]`

| Type | Resume signal |
|------|---------------|
| human-verify (90%) | "approved" or describe issues |
| decision (9%) | "Select: option-id" |
| human-action (1%) | "done" |

When spawned via Task: return structured state (completed tasks table, current task, checkpoint details, awaiting). Orchestrator parses and spawns fresh continuation.
</step>

<step name="record_completion_time">
```bash
PLAN_END_EPOCH=$(date +%s)
DURATION_SEC=$(( PLAN_END_EPOCH - PLAN_START_EPOCH ))
DURATION_MIN=$(( DURATION_SEC / 60 ))
```
</step>

<step name="create_summary">
Create `{plan_id}-SUMMARY.md` at `${feature_dir}/`. Use `{GSD_ROOT}/get-shit-done/templates/summary.md`.

**Frontmatter:** feature (cap/feat), plan, subsystem, tags, requires/provides/affects, tech-stack, key-files, key-decisions, requirements-completed (copy from PLAN.md frontmatter), duration, completed date.

One-liner SUBSTANTIVE: "JWT auth with refresh rotation using jose library" not "Authentication implemented".

Next: more plans -> "Ready for {next-plan}" | last -> "Feature complete, ready for review".
</step>

<step name="update_state">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state advance-plan
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update-progress
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-metric \
  --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
  --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"

# Decisions (use file inputs for shell-safe text)
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state add-decision \
  --phase "${PHASE}" --summary-file "${DECISION_TEXT_FILE}" --rationale-file "${RATIONALE_FILE}"

# Session
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Completed ${CAPABILITY_SLUG}/${FEATURE_SLUG} plan ${PLAN}"
```
</step>

<step name="update_roadmap">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap update-plan-progress "${PHASE}"
```
</step>

<step name="update_requirements">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" requirements mark-complete ${REQ_IDS}
```
Extract from plan frontmatter `requirements:` field. Skip if none.
</step>

<step name="git_commit_metadata">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): complete [plan-name] plan" --files ${feature_dir}/{plan_id}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
```
</step>

<step name="update_codebase_map">
If .planning/codebase/ doesn't exist: skip.

Check git diff for structural changes (new src/ dir, deps, file patterns, API clients, config, renames). Update only STRUCTURE.md, STACK.md, CONVENTIONS.md, INTEGRATIONS.md as needed. Skip code-only/bugfix/content changes. Amend metadata commit.
</step>

<step name="offer_next">
If `USER_SETUP_CREATED=true`: display setup requirements at TOP.

| Condition | Route |
|-----------|-------|
| summaries < plans | Find next PLAN without SUMMARY. Yolo: auto-continue. Interactive: show next plan. STOP. |
| summaries = plans | Show completion, suggest review workflow or next feature. |

All routes: `/clear` first for fresh context.
</step>

</process>

<success_criteria>
- All tasks from PLAN.md completed
- All verifications pass
- USER-SETUP.md generated if user_setup in frontmatter
- SUMMARY.md created with substantive content
- STATE.md updated (position, decisions, issues, session)
- If codebase map exists: map updated (or skipped if no structural changes)
</success_criteria>
