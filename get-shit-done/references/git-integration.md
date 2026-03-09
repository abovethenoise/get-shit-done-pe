<overview>
Git integration for the system.
</overview>

<core_principle>

**Commit outcomes, not process.**

The git log should read like a changelog of what shipped, not a diary of planning activity.
</core_principle>

<commit_points>

| Event                   | Commit? | Why                                              |
| ----------------------- | ------- | ------------------------------------------------ |
| PROJECT.md + ROADMAP created | YES     | Project initialization                      |
| PLAN.md created         | NO      | Intermediate - commit with plan completion       |
| RESEARCH.md created     | NO      | Intermediate                                     |
| DISCOVERY.md created    | NO      | Intermediate                                     |
| **Task completed**      | YES     | Atomic unit of work (1 commit per task)         |
| **Plan completed**      | YES     | Metadata commit (SUMMARY + STATE)               |
| Handoff created         | YES     | WIP state preserved                              |

</commit_points>

<git_check>

```bash
[ -d .git ] && echo "GIT_EXISTS" || echo "NO_GIT"
```

If NO_GIT: Run `git init` silently. GSD projects always get their own repo.
</git_check>

<commit_formats>

<format name="initialization">
## Project Initialization

```
docs: initialize [project-name]

[One-liner from PROJECT.md]
```

What to commit:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize [project-name]" --files .planning/
```

</format>

<format name="task-completion">
## Task Completion (During Plan Execution)

Each task gets its own commit immediately after completion.

```
{type}({cap}/{feat}): {task-name}

- [Key change 1]
- [Key change 2]
- [Key change 3]
```

**Commit types:**
- `feat` - New feature/functionality
- `fix` - Bug fix
- `test` - Test-only
- `refactor` - Code cleanup
- `perf` - Performance improvement
- `chore` - Dependencies, config, tooling

**Examples:**

```bash
# Standard task
git add src/api/auth.ts src/types/user.ts
git commit -m "feat(auth/registration): create user registration endpoint

- POST /auth/register validates email and password
- Checks for duplicate users
- Returns JWT token on success
"
```

</format>

<format name="plan-completion">
## Plan Completion (After All Tasks Done)

After all tasks committed, one final metadata commit captures plan completion.

```
docs({cap}/{feat}): complete [plan-name] plan

Tasks completed: [N]/[N]
- [Task 1 name]
- [Task 2 name]
- [Task 3 name]

SUMMARY: .planning/capabilities/{cap}/features/{feat}/{plan}-SUMMARY.md
```

What to commit:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({cap}/{feat}): complete [plan-name] plan" --files .planning/capabilities/{cap}/features/{feat}/{plan}-PLAN.md .planning/capabilities/{cap}/features/{feat}/{plan}-SUMMARY.md .planning/STATE.md
```

**Note:** Code files NOT included - already committed per-task.

</format>

<format name="handoff">
## Handoff (WIP)

```
wip: [feature-name] paused at task [X]/[Y]

Current: [task name]
[If blocked:] Blocked: [reason]
```

What to commit:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "wip: [feature-name] paused at task [X]/[Y]" --files .planning/
```

</format>
</commit_formats>

<example_log>

**Old approach (per-plan commits):**
```
a7f2d1 feat(checkout): Stripe payments with webhook verification
3e9c4b feat(products): catalog with search, filters, and pagination
8a1b2c feat(auth): JWT with refresh rotation using jose
5c3d7e feat(foundation): Next.js 15 + Prisma + Tailwind scaffold
2f4a8d docs: initialize ecommerce-app
```

**New approach (per-task commits):**
```
# Checkout feature
1a2b3c docs(commerce/checkout): complete checkout flow plan
4d5e6f feat(commerce/checkout): add webhook signature verification
7g8h9i feat(commerce/checkout): implement payment session creation
0j1k2l feat(commerce/checkout): create checkout page component

# Products feature
3m4n5o docs(commerce/products): complete product listing plan
6p7q8r feat(commerce/products): add pagination controls
9s0t1u feat(commerce/products): implement search and filters
2v3w4x feat(commerce/products): create product catalog schema

# Auth feature
5y6z7a docs(auth/tokens): complete token refresh plan
8b9c0d feat(auth/tokens): implement refresh token rotation
1e2f3g test(auth/tokens): add failing test for token refresh
4h5i6j docs(auth/setup): complete JWT setup plan
7k8l9m feat(auth/setup): add JWT generation and validation
0n1o2p chore(auth/setup): install jose library

# Foundation feature
3q4r5s docs(infra/foundation): complete scaffold plan
6t7u8v feat(infra/foundation): configure Tailwind and globals
9w0x1y feat(infra/foundation): set up Prisma with database
2z3a4b feat(infra/foundation): create Next.js 15 project

# Initialization
5c6d7e docs: initialize ecommerce-app
```

Each plan produces 2-4 commits (tasks + metadata). Clear, granular, bisectable.

</example_log>

<anti_patterns>

**Still don't commit (intermediate artifacts):**
- PLAN.md creation (commit with plan completion)
- RESEARCH.md (intermediate)
- DISCOVERY.md (intermediate)
- Minor planning tweaks
- "Fixed typo in planning doc"

**Do commit (outcomes):**
- Each task completion (feat/fix/test/refactor)
- Plan completion metadata (docs)
- Project initialization (docs)

**Key principle:** Commit working code and shipped outcomes, not planning process.

</anti_patterns>

<commit_strategy_rationale>

## Why Per-Task Commits?

**Context engineering for AI:**
- Git history becomes primary context source for future Claude sessions
- `git log --grep="{cap}/{feat}"` shows all work for a feature
- `git diff <hash>^..<hash>` shows exact changes per task
- Less reliance on parsing SUMMARY.md = more context for actual work

**Failure recovery:**
- Task 1 committed ✅, Task 2 failed ❌
- Claude in next session: sees task 1 complete, can retry task 2
- Can `git reset --hard` to last successful task

**Debugging:**
- `git bisect` finds exact failing task, not just failing plan
- `git blame` traces line to specific task context
- Each commit is independently revertable

**Observability:**
- Solo developer + Claude workflow benefits from granular attribution
- Atomic commits are git best practice
- "Commit noise" irrelevant when consumer is Claude, not humans

</commit_strategy_rationale>
