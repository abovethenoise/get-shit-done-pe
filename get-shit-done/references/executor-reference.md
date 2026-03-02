# Executor Reference

Detailed deviation handling rules, commit protocol, state update procedures, and boundary cases for the gsd-executor agent. Loaded by the orchestrator as @reference context at spawn time.

---

## Execution Flow

### 1. Load Project State

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature "${CAP_SLUG}" "${FEAT_SLUG}")
```

Extract: `executor_model`, `commit_docs`, `feature_dir`, `plans`, `incomplete_plans`.

Read STATE.md for position, decisions, blockers.

### 2. Load Plan

Parse PLAN.md: frontmatter (phase, plan, type, autonomous, wave, depends_on), objective, context (@-references), tasks with types, verification/success criteria, output spec.

If plan references CONTEXT.md: honor user's vision throughout execution.

### 3. Record Start Time

```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```

### 4. Determine Execution Pattern

- **Pattern A**: Fully autonomous (no checkpoints) -- execute all tasks, create SUMMARY, commit
- **Pattern B**: Has checkpoints -- execute until checkpoint, STOP, return structured message
- **Pattern C**: Continuation -- verify previous commits, resume from specified task

### 5. Execute Tasks

For each auto task: execute, handle issues inline, run verification, confirm done criteria, commit, track hash.

For checkpoint tasks: STOP immediately, return structured checkpoint message.

After all tasks: run overall verification, confirm success criteria, document deviations.

---

## Deviation Handling Rules

### Rule 1: Auto-fix bugs

**Trigger:** Code does not work as intended (broken behavior, errors, incorrect output).

Examples: wrong queries, logic errors, type errors, null pointer exceptions, broken validation, race conditions.

Fix inline, add/update tests if applicable, verify fix, continue task. Track as deviation.

### Rule 2: Auto-add missing critical functionality

**Trigger:** Code missing essential features for correctness, security, or basic operation.

Examples: missing error handling, no input validation, missing null checks, no auth on protected routes, missing DB indexes.

Critical = required for correct/secure/performant operation. These are correctness requirements, not features.

### Rule 3: Auto-fix blocking issues

**Trigger:** Something prevents completing current task.

Examples: missing dependency, wrong types, broken imports, missing env var, DB connection error, build config error, circular dependency.

### Rule 4: Ask about architectural changes

**Trigger:** Fix requires significant structural modification.

Examples: new DB table (not column), major schema changes, new service layer, switching libraries, changing auth approach, breaking API changes.

**Action:** STOP. Return checkpoint with: what found, proposed change, why needed, impact, alternatives. User decision required.

### Rule Priority

1. Rule 4 applies: STOP (architectural decision)
2. Rules 1-3 apply: Fix automatically
3. Genuinely unsure: Rule 4 (ask)

### Scope Boundary

Only auto-fix issues directly caused by the current task's changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope.

Log out-of-scope discoveries to `deferred-items.md` in the phase directory.

### Fix Attempt Limit

After 3 auto-fix attempts on a single task:
- Stop fixing, document remaining issues in SUMMARY.md under "Deferred Issues"
- Continue to the next task (or return checkpoint if blocked)

---

## Authentication Gates

Auth errors during auto tasks are gates, not failures.

**Indicators:** "Not authenticated", "Unauthorized", "401", "403", "Please run {tool} login", "Set {ENV_VAR}"

**Protocol:**
1. Recognize it as an auth gate
2. STOP current task
3. Return checkpoint with type `human-action`
4. Provide exact auth steps
5. Specify verification command

Document auth gates as normal flow in SUMMARY, not deviations.

---

## Task Commit Protocol

After each task completes (verification passed, done criteria met):

**1. Check modified files:** `git status --short`

**2. Stage files individually** (never `git add .` or `git add -A`):
```bash
git add src/api/auth.ts
git add src/types/user.ts
```

**3. Commit types:**

| Type | When |
|------|------|
| `feat` | New feature, endpoint, component |
| `fix` | Bug fix, error correction |
| `test` | Test-only changes |
| `refactor` | Code cleanup, no behavior change |
| `chore` | Config, tooling, dependencies |

**4. Commit:**
```bash
git commit -m "{type}({feature}-{plan}): {concise task description}

- {key change 1}
- {key change 2}
"
```

**5. Record hash:** `TASK_COMMIT=$(git rev-parse --short HEAD)`

---

## Auto Mode Detection

```bash
AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

When auto mode is active:
- `checkpoint:human-verify`: Auto-approve, log, continue
- `checkpoint:decision`: Auto-select first option, log, continue
- `checkpoint:human-action`: STOP normally (auth gates cannot be automated)

---

## Checkpoint Return Format

```markdown
## CHECKPOINT REACHED

**Type:** [human-verify | decision | human-action]
**Plan:** {feature}-{plan}
**Progress:** {completed}/{total} tasks complete

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|

### Current Task
**Task {N}:** [task name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]

### Checkpoint Details
[Type-specific content]

### Awaiting
[What user needs to do/provide]
```

---

## Continuation Handling

When spawned as continuation agent (`<completed_tasks>` in prompt):

1. Verify previous commits exist: `git log --oneline -5`
2. Do not redo completed tasks
3. Start from resume point
4. Handle based on checkpoint type
5. If another checkpoint hit: return with ALL completed tasks (previous + new)

---

## SUMMARY.md Creation

Use the Write tool to create files. Use the summary template from `@{GSD_ROOT}/get-shit-done/templates/summary.md`.

**Frontmatter:** phase, plan, subsystem, tags, dependency graph (requires/provides/affects), tech-stack (added/patterns), key-files (created/modified), decisions, metrics (duration, completed date).

**One-liner must be substantive.** Good: "JWT auth with refresh rotation using jose library". Bad: "Authentication implemented".

**Deviation documentation:**
```markdown
## Deviations from Plan

### Auto-fixed Issues
**1. [Rule N - Type] Description**
- **Found during:** Task N
- **Issue:** [description]
- **Fix:** [what was done]
- **Files modified:** [files]
- **Commit:** [hash]
```

Or: "None - plan executed exactly as written."

---

## Self-Check Protocol

After writing SUMMARY.md, verify claims:

```bash
# Check created files exist
[ -f "path/to/file" ] && echo "FOUND" || echo "MISSING"

# Check commits exist
git log --oneline --all | grep -q "{hash}" && echo "FOUND" || echo "MISSING"
```

Append: `## Self-Check: PASSED` or `## Self-Check: FAILED` with missing items.

Do not proceed to state updates if self-check fails.

---

## State Updates

```bash
# Advance plan counter
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state advance-plan

# Recalculate progress bar
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update-progress

# Record execution metrics
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-metric \
  --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
  --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"

# Add decisions
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state add-decision \
  --phase "${PHASE}" --summary "${decision}"

# Update session info
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Completed ${PHASE}-${PLAN}-PLAN.md"

# Update ROADMAP.md progress
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap update-plan-progress "${PHASE_NUMBER}"

# Mark requirements complete
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" requirements mark-complete ${REQ_IDS}
```

---

## Final Commit

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({feature}-{plan}): complete [plan-name] plan" \
  --files .planning/capabilities/{cap}/{feat}/{feature}-{plan}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md
```

Separate from per-task commits -- captures execution results only.

---

## Completion Format

```markdown
## PLAN COMPLETE

**Plan:** {feature}-{plan}
**Tasks:** {completed}/{total}
**SUMMARY:** {path to SUMMARY.md}

**Commits:**
- {hash}: {message}

**Duration:** {time}
```

---

## Analysis Paralysis Guard

If you make 5+ consecutive Read/Grep/Glob calls without any Edit/Write/Bash action:

STOP. State in one sentence why you have not written anything yet. Then either:
1. Write code (you have enough context), or
2. Report "blocked" with the specific missing information.
