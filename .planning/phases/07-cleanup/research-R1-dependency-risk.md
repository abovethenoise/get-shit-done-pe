# R1: Dependency Risk Research — 4 Removal Items

**Researched:** 2026-02-28
**Scope:** TDD execution pattern, Todo system, Health check, Plan deviation rules

---

## Item 1: TDD Execution Pattern

**Files targeted:** `references/tdd.md`, `type="tdd"` plan format, `tdd="true"` task attribute, RED-GREEN-REFACTOR terminology

### All References Found

| File | Line | Exact Text | Dependency Type |
|------|------|------------|-----------------|
| `workflows/execute-plan.md` | 138 | `` `type="auto"`: if `tdd="true"` → TDD execution. Implement with deviation rules + auth gates.`` | **Hard** — conditional branch in task execution logic |
| `workflows/execute-plan.md` | 213–226 | Full `<tdd_plan_execution>` section: RED-GREEN-REFACTOR instructions, reference to `tdd.md` | **Hard** — executor reads this to run TDD tasks |
| `workflows/execute-plan.md` | 247–248 | Commit type table rows: `test` (TDD RED), `refactor` (TDD REFACTOR) | Soft — documents TDD-specific commit types |
| `workflows/execute-phase.md` | 116 | `@/Users/philliphall/.claude/get-shit-done/references/tdd.md` in `<execution_context>` block passed to executor agents | **Hard** — tdd.md loaded into every executor agent spawn |
| `workflows/plan-phase.md` | 471 | `@/Users/philliphall/.claude/get-shit-done/references/tdd.md` in auto-advance execute-phase Task spawn | **Hard** — loaded into orchestrator when auto-advancing |
| `workflows/discuss-phase.md` | 488 | `Include @file refs to execute-phase.md, checkpoints.md, tdd.md` in step 14 auto-advance instructions | **Hard** — named explicitly in auto-advance chain instruction |
| `agents/gsd-executor.md` | 85 | `Check for tdd="true" → follow TDD execution flow` | **Hard** — executor branches here |
| `agents/gsd-executor.md` | 277–289 | Full `<tdd_execution>` section: RED/GREEN/REFACTOR steps | **Hard** — executor's own TDD logic |
| `agents/gsd-executor.md` | 308 | Commit type table: `test — Test-only changes (TDD RED)` | Soft |
| `agents/gsd-planner.md` | 225, 228, 231, 235, 447, 738–782, 1064 | TDD Detection section, `type: tdd` plan format, TDD plan structure template, context budget for TDD, TDD detection in planning step | **Hard** — planner decides whether to create TDD plans and how to structure them |
| `agents/gsd-plan-checker.md` | 125 | `tdd` task type row in required fields table: `\| tdd \| Required \| Behavior + Implementation \| Test commands \| Expected outcomes \|` | **Hard** — checker validates `tdd` task type; unknown type would be flagged |
| `agents/gsd-plan-checker.md` | 462 | `valid task type (auto, checkpoint:*, tdd)` | **Hard** — `tdd` is an allowed task type; removal makes any existing TDD plan fail checker |
| `templates/phase-prompt.md` | 128, 250, 265–273 | `type` field docs referencing `tdd`, TDD candidates section, TDD Plans section with reference to `tdd.md` | Hard — planner subagent prompt template teaches TDD |
| `templates/summary.md` | 75 | `_Note: TDD tasks may have multiple commits (test → feat → refactor)_` | Soft — documentation only |
| `templates/summary.md` | 92 | `[Rule X - Category]` — formatting depends on deviation rules (see Item 4) | Soft |
| `workflows/add-tests.md` | 2, 75, 79, 116, 170, 210–211, 339, 343 | `add-tests.md` classifies files into TDD/E2E/Skip categories, plans RED-GREEN-REFACTOR test generation, has dedicated `execute_tdd_generation` step | **Hard** — `add-tests.md` workflow is built on TDD taxonomy; KEEP or removal interacts here |
| `project agents/gsd-executor.md` | 85, 287–299 | Same as global executor — project copy has identical TDD references | **Hard** (project copy mirrors global) |
| `project agents/gsd-planner.md` | 205–214, 427, 547–585, 706 | Same as global planner — TDD detection, type:tdd format, tdd_integration block | **Hard** (project copy mirrors global) |
| `project agents/gsd-plan-checker.md` | 125, 464 | Same as global plan-checker — tdd type allowed | **Hard** (project copy mirrors global) |

### Breaking Paths

1. **Executor receives plan with `tdd="true"` task** — `execute-plan.md` line 138 branches to TDD execution. If `tdd.md` is removed and the `<tdd_plan_execution>` block in `execute-plan.md` is also removed, the executor hits an empty branch. Task silently executes as standard `type="auto"` without RED-GREEN-REFACTOR. Not an error — behavior degrades silently.

2. **Planner creates `type: tdd` plan** — If TDD planner logic is removed from `gsd-planner.md` but `type: tdd` remains a valid value in `gsd-plan-checker.md`, checkers pass plans that executors can't handle. Inconsistency between agents.

3. **Plan-checker encounters existing `type: tdd` plan** — If checker's allowed type list (`auto, checkpoint:*, tdd`) is updated to remove `tdd`, any existing TDD plans in already-created phases fail checker validation as `blocker` severity. Existing plans break.

4. **`execute-phase.md` spawns executor with `tdd.md` in `<execution_context>`** — If `tdd.md` file is deleted but the `@` reference remains, executor spawn generates a file-not-found error. This is a hard break at runtime.

5. **`add-tests.md` workflow** — This is a KEPT workflow. It classifies files into "TDD (unit tests)" vs E2E/Skip categories and has a `execute_tdd_generation` step. It uses TDD terminology independently of `references/tdd.md`. Removing TDD from the main pipeline does not break `add-tests.md` since it doesn't `@`-reference `tdd.md` directly, but conceptual coupling is HIGH.

### Risk Level: **HIGH**

TDD is deeply woven into the planner-executor-checker triad. Removal requires coordinated changes to at minimum 8 files. Four specific file references to `tdd.md` will cause load errors if the file is deleted before references are cleaned. `add-tests.md` uses TDD taxonomy independently and is unaffected by pipeline TDD removal.

---

## Item 2: Todo System

**Files targeted:** `add-todo.md`, `check-todos.md`, `.planning/todos/` directory, `init todos`, `list-todos`, `todo complete` commands

### All References Found

| File | Line | Exact Text | Dependency Type |
|------|------|------------|-----------------|
| `bin/gsd-tools.cjs` | 23 | `*   list-todos [area]  Count and enumerate pending todos` (docs header) | Soft — CLI docs |
| `bin/gsd-tools.cjs` | 62 | `*   todo complete <filename>  Move todo from pending to completed` | Soft — CLI docs |
| `bin/gsd-tools.cjs` | 123 | `*   init todos [area]  All context for todo workflows` | Soft — CLI docs |
| `bin/gsd-tools.cjs` | 175 | `list-todos` in usage error string | Soft — error message |
| `bin/gsd-tools.cjs` | 356–358 | `case 'list-todos': { commands.cmdListTodos(cwd, args[1], raw); break; }` | **Hard** — CLI command dispatched |
| `bin/gsd-tools.cjs` | 487–494 | `case 'todo': { if (subcommand === 'complete') { commands.cmdTodoComplete... } }` | **Hard** — CLI command dispatched |
| `bin/gsd-tools.cjs` | 536–538 | `case 'todos': init.cmdInitTodos(cwd, args[2], raw); break;` | **Hard** — init workflow dispatched |
| `bin/gsd-tools.cjs` | 549 | `todos` listed in error message for unknown init workflows | Soft |
| `bin/lib/init.cjs` | 445–498 | Full `cmdInitTodos` function — reads `.planning/todos/pending/`, returns `todo_count, todos, pending_dir, todos_dir_exists` | **Hard** — full implementation exists and is called |
| `workflows/add-todo.md` | all | Entire file — todo creation workflow | **Hard** (being removed) |
| `workflows/check-todos.md` | all | Entire file — todo review workflow | **Hard** (being removed) |
| `workflows/progress.md` | 82 | `Count pending todos: use \`init todos\` or \`list-todos\`` | **Hard** — progress step calls `init todos` |
| `workflows/progress.md` | 120 | `- [count] pending — /gsd:check-todos to review` (in report template) | Soft — display reference, but data comes from init todos |
| `templates/state.md` | 57–59 | `### Pending Todos\n\n[From .planning/todos/pending/ — ideas captured during sessions]` | Soft — STATE.md template section |
| `templates/state.md` | 148–151 | `**Pending Todos:** Ideas captured via /gsd:add-todo` + display format | Soft — documentation in template |
| `commands/gsd/add-todo.md` | all | Slash command entry point for `/gsd:add-todo` | **Hard** (being removed) |
| `commands/gsd/check-todos.md` | all | Slash command entry point for `/gsd:check-todos` | **Hard** (being removed) |
| `agents/gsd-roadmapper.md` | 341 | `Accumulated Context (decisions, todos, blockers)` | Soft — mentions todos as part of STATE.md structure description |
| `agents/gsd-planner.md` | 1029 | `**From STATE.md:** Decisions → constrain approach. Pending todos → candidates.` | Soft — planner reads STATE.md and considers todos as planning input |

### Breaking Paths

1. **`workflows/progress.md` calls `init todos`** — Line 82: `Count pending todos: use \`init todos\` or \`list-todos\``. If `cmdInitTodos` is removed from gsd-tools, `progress.md` fails when it tries to count todos. This is the most significant kept-workflow break.

2. **STATE.md has `### Pending Todos` section** — All existing STATE.md files in projects will have this section. The template references `/gsd:add-todo` and `/gsd:check-todos`. After removal, the section becomes an orphaned reference. No runtime break — just dead documentation.

3. **`gsd-planner.md` references pending todos** — Planner reads STATE.md and considers `Pending todos → candidates`. If STATE.md still has a `### Pending Todos` section (from existing projects), planner silently reads it. No break — soft data source.

4. **`gsd-tools.cjs` has `list-todos`, `todo complete`, `init todos` commands** — These remain callable. If removed from gsd-tools, any stale workflow or script calling them gets a "Unknown command" error. If left in gsd-tools as orphaned code, no break.

### Risk Level: **MEDIUM**

One hard dependency in a KEPT workflow: `progress.md` calls `init todos`. All other references are soft (STATE.md template sections, planner reading STATE.md). The `progress.md` break requires either: (a) removing the todo-count step from `progress.md`, or (b) keeping `cmdInitTodos` in gsd-tools as a stub that returns `{todo_count: 0, todos: []}`. The CLI commands themselves (`list-todos`, `todo complete`) are isolated to their own dispatch cases and don't affect other commands.

---

## Item 3: Health Check

**Files targeted:** `workflows/health.md`, `/gsd:health` command, `validate health` in gsd-tools

### All References Found

| File | Line | Exact Text | Dependency Type |
|------|------|------------|-----------------|
| `bin/gsd-tools.cjs` | 56 | `*   validate health [--repair]  Check .planning/ integrity, optionally repair` (docs header) | Soft |
| `bin/gsd-tools.cjs` | 472–475 | `} else if (subcommand === 'health') { const repairFlag = args.includes('--repair'); verify.cmdValidateHealth(cwd, { repair: repairFlag }, raw); }` | **Hard** — CLI command dispatched to `verify.cmdValidateHealth` |
| `bin/gsd-tools.cjs` | 476 | `error('Unknown validate subcommand. Available: consistency, health');` | Soft — error string |
| `bin/lib/verify.cjs` | (inferred) | `cmdValidateHealth` function — validates .planning/ directory structure | **Hard** — full implementation |
| `workflows/health.md` | all | Entire file — calls `gsd-tools validate health [--repair]`, formats output | **Hard** (being removed) |
| `commands/gsd/health.md` | all | Slash command entry point for `/gsd:health` | **Hard** (being removed) |
| `agents/primary-collaborator.md` | 67 | `Plans contain zero steps that don't directly serve the current requirement or long-term project health.` | **None** — different meaning of "health", not GSD health check |

### Breaking Paths

1. **No KEPT workflow references `/gsd:health` or `validate health`** — The health check is a standalone diagnostic tool. No other workflow in the KEEP list calls it. Removal is clean from a dependency standpoint.

2. **`gsd-tools.cjs` `validate` command still dispatches to `health`** — If `cmdValidateHealth` in `lib/verify.cjs` is removed but the `case 'validate':` dispatch is not updated, calling `gsd-tools validate health` produces a JavaScript error (function undefined). However, since no KEPT workflow calls this, it is only a latent risk.

3. **`validate consistency` shares the `validate` dispatch block** — The `case 'validate':` block handles both `consistency` and `health`. Removing `health` from this block while keeping `consistency` is a simple `else if` removal. No coupling risk.

### Risk Level: **LOW**

Health check is a standalone diagnostic. Zero KEPT workflows call it. Removal only requires deleting `health.md`, `commands/gsd/health.md`, and removing the `health` branch from `gsd-tools validate` dispatch. No domino effects.

---

## Item 4: Plan Deviation Rules

**Files targeted:** Four numbered rules (Bug, Missing Critical, Blocking, Architectural) and their documentation in executor

### All References Found

| File | Line | Exact Text | Dependency Type |
|------|------|------------|-----------------|
| `workflows/execute-plan.md` | 69 | `follow deviation/auth rules` in Pattern A subagent spawn prompt | **Hard** — instruction to executor |
| `workflows/execute-plan.md` | 102 | `track deviations` in Pattern B segment execution prompt | **Hard** — instruction to executor |
| `workflows/execute-plan.md` | 104 | `aggregate files/deviations/decisions` in Pattern B completion | **Hard** — orchestrator aggregates deviations |
| `workflows/execute-plan.md` | 138 | `Implement with deviation rules + auth gates` in task execution step | **Hard** — executor applies rules during task execution |
| `workflows/execute-plan.md` | 142 | `5. Document deviations in Summary` | **Hard** — required SUMMARY.md step |
| `workflows/execute-plan.md` | 164 | `Document as normal flow under "## Authentication Gates", not as deviations` | Soft — cross-reference to deviation concept |
| `workflows/execute-plan.md` | 168–199 | Full `<deviation_rules>` block — Rules 1–4 table, Rule 4 format, priority, edge cases | **Hard** — source of truth for rules in execute-plan |
| `workflows/execute-plan.md` | 201–211 | Full `<deviation_documentation>` block — SUMMARY must include deviations section, per-deviation format with `[Rule N - Category]` tagging | **Hard** — SUMMARY format depends on deviation rules |
| `workflows/execute-phase.md` | 157 | `{Notable deviations, if any}` in Wave Complete report template | Soft — display field, empty if no deviations |
| `agents/gsd-executor.md` | 3 | `description: Executes GSD plans with atomic commits, deviation handling, checkpoint protocols` | Soft — frontmatter description |
| `agents/gsd-executor.md` | 9 | `handling deviations automatically` in role description | Soft |
| `agents/gsd-executor.md` | 85–86 | `Execute task, apply deviation rules as needed` + `3. After all tasks: document deviations` | **Hard** — executor's core logic |
| `agents/gsd-executor.md` | 96 | `3. After all tasks: run overall verification, confirm success criteria, document deviations` | **Hard** |
| `agents/gsd-executor.md` | 101–172 | Full `<deviation_rules>` block — Rules 1–4 with full descriptions, scope boundary, fix attempt limit | **Hard** — executor's own copy of the rules |
| `agents/gsd-executor.md` | 196 | `not as deviations` (auth gates doc) | Soft |
| `agents/gsd-executor.md` | 213 | `ADD ONE (deviation Rule 3)` in checkpoint_protocol step — tells executor to apply Rule 3 when server startup is missing before human-verify | **Hard** — cross-reference to Rule 3 by number |
| `agents/gsd-executor.md` | 339–354 | `<summary_creation>` deviation documentation block — `[Rule 1 - Bug] Fixed case-sensitive email uniqueness` example, `"None - plan executed exactly as written."` | **Hard** — SUMMARY template depends on deviation framing |
| `agents/gsd-executor.md` | 472 | `- [ ] All deviations documented` in success_criteria | Hard |
| `templates/summary.md` | 84, 86–104 | `## Deviations from Plan` section, `[Rule X - Category] Brief description`, `**Total deviations:** [N] auto-fixed ([breakdown by rule])` | **Hard** — SUMMARY.md template format uses `[Rule N - Category]` tags |
| `templates/summary.md` | 110 | Explanatory note: `"Deviations from Plan" documents unplanned work that was handled automatically via deviation rules.` | Soft |
| `templates/summary.md` | 221 | Example: `**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)` | Soft |
| `templates/summary.md` | 245 | `Use "None - followed plan as specified" if no deviations` | Soft |
| `templates/summary-standard.md` | 45 | `[Minor deviations if any, or "None"]` | Soft |
| `templates/summary-complex.md` | 52 | `[Detailed auto-fix records per GSD deviation rules]` | Soft |
| `project agents/gsd-executor.md` | 3, 9, 85–86, 96, 101–172, 196, 213, 339–354, 472 | All same as global executor | **Hard** (project copy mirrors global) |

### Breaking Paths

1. **`execute-plan.md` Pattern A spawn says "follow deviation/auth rules"** — If deviation rules are removed from `execute-plan.md` but the Pattern A prompt still says "follow deviation/auth rules", the spawned executor has no rules to follow. Executor will either improvise or do nothing with unplanned work. This is a behavioral break, not a crash.

2. **`execute-plan.md` aggregation step mentions "deviations"** — Pattern B aggregates `files/deviations/decisions`. If the concept is removed, this field in the aggregation is undefined. The SUMMARY.md creation step still expects a `## Deviations from Plan` section per `templates/summary.md`. Summary creation will produce an empty or malformed section.

3. **`gsd-executor.md` checkpoint_protocol references "deviation Rule 3"** (line 213): `ADD ONE (deviation Rule 3)`. This is an inline instruction telling the executor to auto-fix missing server startup. If Rule 3 is removed, this instruction becomes a dangling reference. The executor may not auto-add the server start, causing human-verify checkpoints to have no running server.

4. **SUMMARY.md template uses `[Rule N - Category]` format** — `templates/summary.md` has `**1. [Rule X - Category] Brief description**` in its deviations section. If rules are removed, existing SUMMARY.md files have orphaned format references. New summaries would need a different format. All previously generated summaries remain valid — no retroactive break.

5. **Deviation rules ARE the executor's unplanned-work logic** — Removing the four rules doesn't just remove documentation. It removes the executor's entire decision framework for handling bugs, missing critical functionality, blockers, and architectural surprises encountered during execution. Without rules, the executor has no defined behavior for the highly common case of discovering unplanned work.

### Risk Level: **HIGH**

Deviation rules are the executor's core unplanned-work protocol. They are not cosmetic. Every plan execution that encounters any issue (which is most executions) uses these rules to decide whether to auto-fix or stop. Removing them without replacement leaves a behavioral void. The `Rule 3` cross-reference in `checkpoint_protocol` is the most specific hard dependency — it instructs a precise action by rule number. Summary templates also embed the `[Rule N - Category]` tagging format.

**Important distinction:** The task says "4 rules for when executors go off-plan" as if it's removing a numbered ruleset. But what's being removed is the entire deviation-handling framework. If the intent is to simplify the rules (e.g., collapse Rules 1–3 into "auto-fix unexpected issues" and keep Rule 4 as "ask about architectural changes"), that is a modification, not a removal. Pure removal leaves executors with no guidance for unplanned discoveries.

---

## Summary Risk Matrix

| Item | Risk Level | KEPT Workflows Affected | Breaking Paths | Minimum Cleanup |
|------|-----------|------------------------|----------------|-----------------|
| TDD execution pattern | HIGH | `execute-phase.md`, `plan-phase.md`, `discuss-phase.md`, `add-tests.md` | 4 `@tdd.md` references cause load errors if file deleted; executor branches silently degrade; checker allows type that executor can't handle | Must: remove 4 `@tdd.md` @-refs, update task type list in checker, remove planner TDD detection block, remove executor `<tdd_execution>` block |
| Todo system | MEDIUM | `progress.md` (1 hard dependency) | `progress.md` calls `init todos` — fails if CLI command removed | Must: remove or stub `init todos` call in `progress.md` line 82; remove progress report todo display line 120 |
| Health check | LOW | None | None — zero KEPT workflows call it | Clean: delete 3 files, remove `health` branch from `gsd-tools validate` dispatch |
| Deviation rules | HIGH | `execute-plan.md`, `execute-phase.md`, executor agent | Executor has no unplanned-work framework; `Rule 3` cross-reference in checkpoint_protocol is a dangling behavioral instruction; SUMMARY format uses rule tagging | Must: replace rules with simplified handling or define new framework; update checkpoint_protocol Rule 3 reference; update SUMMARY template deviation format |

---

## Observations for Planner

**TDD and Deviation Rules are coupled.** `execute-plan.md` line 138 reads: `if tdd="true" → TDD execution. Implement with deviation rules + auth gates.` Both are invoked together. Removing one while keeping the other creates a half-functional reference.

**The `add-tests.md` workflow uses TDD independently.** It classifies files into TDD/E2E/Skip and generates tests using RED-GREEN conventions. It does not `@`-reference `references/tdd.md` and is not broken by removing the TDD execution pattern from the planning pipeline. These are separate uses of the TDD concept.

**Deviation rules removal requires a replacement decision, not just deletion.** Executors will encounter bugs, missing dependencies, and blocking issues in every non-trivial execution. Removing the four rules without specifying what replaces them produces undefined behavior. The planner should determine: are we removing the numbered rule taxonomy only (replacing with prose guidance), or removing the concept of auto-fixing unplanned work entirely?

**Health check removal is cleanest.** No KEPT workflows depend on it. It is a standalone diagnostic. Zero domino effects.

**Todo system removal is mostly cosmetic except `progress.md`.** One surgical edit to `progress.md` (remove lines 82 and 120) plus stub or removal of `cmdInitTodos` in gsd-tools resolves the only hard dependency.
