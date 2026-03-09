<purpose>
Execute a single plan (PLAN.md) and create outcome summary (SUMMARY.md).
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/git-integration.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
@{GSD_ROOT}/get-shit-done/references/executor-reference.md
</required_reading>

<inputs>
**TARGET_SLUG** -- Capability or feature slug
**TARGET_TYPE** -- "capability" or "feature"
</inputs>

<process>

<step name="init_context" priority="first">
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "$TARGET_SLUG")
```

Extract: `commit_docs`, `feature_dir`, `feature_slug`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.

Determine target directory:
- Feature: `.planning/features/${TARGET_SLUG}`
- Capability: `.planning/capabilities/${TARGET_SLUG}`

If `.planning/` missing: error.
</step>

<step name="identify_plan">
Find first PLAN without matching SUMMARY (match by ID prefix, e.g., 01-PLAN.md → 01-SUMMARY.md).

**If `resume_from_task` provided:** Skip completed tasks, verify via git log, begin from specified task.
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="parse_segments">
```bash
grep -n "type=\"checkpoint" ${target_dir}/{plan_file}
```

| Checkpoints | Pattern | Execution |
|-------------|---------|-----------|
| None | A (autonomous) | Single subagent: full plan + SUMMARY + commit |
| Verify-only | B (segmented) | Segments between checkpoints |
| Decision | C (main) | Execute in main context |

**Pattern A:** spawn Task(subagent_type="gsd-executor") → track → wait → report.
**Pattern B:** Auto segments via subagent, checkpoints in main. After all: aggregate, SUMMARY, commit.
**Pattern C:** Execute in main using standard flow.
</step>

<step name="init_agent_tracking">
```bash
if [ ! -f .planning/agent-history.json ]; then
  echo '{"version":"1.0","max_entries":50,"entries":[]}' > .planning/agent-history.json
fi
rm -f .planning/current-agent-id.txt
```
Run for Pattern A/B before spawning. Pattern C: skip.
</step>

<step name="load_prompt">
```bash
cat ${target_dir}/{plan_file}
```
This IS the execution instructions. Follow exactly.

**If DESIGN.md exists at `.planning/DESIGN.md`:** Apply design constraints throughout.
**If plan contains `<interfaces>` block:** Use pre-extracted types directly.
</step>

<step name="previous_plan_check">
Check previous SUMMARY for unresolved issues. If found: "Proceed anyway" | "Address first" | "Review previous".
</step>

<step name="execute">
1. Read @context files from prompt
2. Per task:
   - `type="auto"`: Implement, verify done criteria, commit per task_commit, track hash.
   - `type="checkpoint:*"`: STOP → checkpoint_protocol → wait → continue.
3. Run `<verification>` checks
4. Confirm `<success_criteria>` met
5. Document unplanned changes
</step>

<step name="auth_gates">
Auth errors are expected interaction points, not failures.

**Protocol:** Recognize → STOP → create checkpoint:human-action with exact auth steps → wait → verify → retry → continue.

In Summary: document under "Authentication Gates", not deviations.
</step>

<step name="unplanned_work">
**Auto-fix:** Bugs, missing deps, blockers — fix and continue. Document in summary.
**Stop and ask:** Architectural issues that change approach.
**Scope:** Only fix issues directly related to current task. Log unrelated to `deferred-items.md`.
**Limit:** >2 auto-fixes on single task → pause and assess.
</step>

<step name="task_commit">
After each task (verified, done criteria met), commit immediately.

1. `git status --short`
2. Stage individually (NEVER `git add .`)
3. Commit: `{type}(${TARGET_SLUG}): [task {N}/{total}] {description}`
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
On `type="checkpoint:*"`: automate everything possible first.

Display: `CHECKPOINT: [Type]` → Progress → type-specific content → `YOUR ACTION: [signal]`

| Type | Resume signal |
|------|---------------|
| human-verify (90%) | "approved" or describe issues |
| decision (9%) | "Select: option-id" |
| human-action (1%) | "done" |
</step>

<step name="create_summary">
Create `{plan_id}-SUMMARY.md` at `${target_dir}/`. Use `{GSD_ROOT}/get-shit-done/templates/summary.md`.

**Frontmatter:** target slug, plan, subsystem, tags, requires/provides/affects, tech-stack, key-files, key-decisions, duration, completed date.

One-liner SUBSTANTIVE: "JWT auth with refresh rotation using jose library" not "Authentication implemented".
</step>

<step name="update_state">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state advance-plan
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update-progress
```
</step>

<step name="git_commit_metadata">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${TARGET_SLUG}): complete [plan-name] plan" --files ${target_dir}/{plan_id}-SUMMARY.md .planning/STATE.md
```
</step>

<step name="update_codebase_map">
If .planning/codebase/ doesn't exist: skip.
Check git diff for structural changes. Update STRUCTURE.md, STACK.md, CONVENTIONS.md, INTEGRATIONS.md as needed. Skip code-only changes. Amend metadata commit.
</step>

<step name="offer_next">
| Condition | Route |
|-----------|-------|
| summaries < plans | Find next PLAN without SUMMARY. Continue or stop. |
| summaries = plans | Show completion, suggest review or next target. |

All routes: `/clear` first for fresh context.
</step>

</process>

<success_criteria>
- All tasks from PLAN.md completed
- All verifications pass
- SUMMARY.md created with substantive content
- STATE.md updated
- If codebase map exists: updated or skipped appropriately
</success_criteria>
