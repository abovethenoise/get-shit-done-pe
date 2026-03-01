# R2: Removal Impact Research

**Researched:** 2026-02-28
**Scope:** 4 items marked for removal from GSD pipeline
**Both codebases:** `~/.claude/get-shit-done/` (installed) and `get-shit-done/` (project source)

---

## Summary

Four features are being removed: TDD execution pattern (`references/tdd.md`), Todo system (workflows + CLI), Health check (workflow + CLI), and Plan deviation rules (inline in executor files). Each has tentacles across workflows, agents, CLI code, templates, and slash commands. This document catalogs every reference so cleanup can be complete and safe.

**Key finding:** The deviation rules are NOT a separate file — they are inlined as `<deviation_rules>` blocks inside `gsd-executor.md` (agent) and `execute-plan.md` (workflow). There is no standalone `deviation-rules.md` to delete. Removal means excising the XML block from two files.

---

## Item 1: TDD Execution Pattern (`references/tdd.md`)

### A. Dead Reference List

#### INSTALLED (`~/.claude/get-shit-done/`)

| File | Line(s) | Reference Type |
|------|---------|----------------|
| `references/tdd.md` | entire file | THE FILE BEING REMOVED |
| `workflows/execute-plan.md` | 225 | `See /Users/philliphall/.claude/get-shit-done/references/tdd.md for structure.` |
| `workflows/execute-plan.md` | 213-226 | Entire `<tdd_plan_execution>` block referencing tdd.md |
| `workflows/execute-plan.md` | 138 | `if tdd="true" → TDD execution` |
| `workflows/execute-plan.md` | 247-248 | `test` and `refactor` commit types labeled as TDD |
| `workflows/execute-phase.md` | 116 | `@/Users/philliphall/.claude/get-shit-done/references/tdd.md` |
| `workflows/plan-phase.md` | 471 | `@/Users/philliphall/.claude/get-shit-done/references/tdd.md` |
| `workflows/discuss-phase.md` | 488 | `Include @file refs to ... tdd.md ...` in spawned Task instructions |
| `workflows/add-tests.md` | 2, 75, 79, 116, 170, 210-211, 339, 343 | "TDD classification", TDD section headers, TDD generation step |
| `templates/phase-prompt.md` | 128, 250, 265-273 | `type: tdd`, "TDD candidates", "TDD Plans" section, reference to tdd.md |
| `templates/planner-subagent-prompt.md` | 117 | "TDD detection...baked into the gsd-planner agent" |
| `templates/summary.md` | 75 | `_Note: TDD tasks may have multiple commits_` |
| `references/git-integration.md` | 75-76, 92-101 | `test` and `refactor` commit types labeled as TDD phases |
| `bin/gsd-tools.cjs` | 93 | `[--type execute|tdd]` in help text |
| `bin/gsd-tools.cjs` | 294 | `type: typeIdx !== -1 ? args[typeIdx + 1] : 'execute'` (TDD plan template fill) |
| `agents/gsd-planner.md` | 225-235, 447, 738-782, 1064 | TDD Detection section, `type: tdd` in plan schema, `<tdd_integration>` block |
| `agents/gsd-executor.md` | 85, 277-289, 308 | `tdd="true"` check, `<tdd_execution>` block, `test` commit type |
| `agents/gsd-plan-checker.md` | 125, 462 | `tdd` plan type in validation table, task type check |

#### PROJECT SOURCE (`get-shit-done/`)
Same files, same lines — project source mirrors installed. All references above exist identically in both trees (with `$HOME/.claude/` path form in project source).

Additionally:
| File | Line(s) | Reference Type |
|------|---------|----------------|
| `workflows/plan-phase.md` | 572 | `@~/.claude/get-shit-done/references/tdd.md` |
| `agents/gsd-planner.md` | 205-214 | Expanded TDD Detection with task-level `tdd="true"` pattern |
| `bin/gsd-tools.cjs` | 93 | Same `--type execute|tdd` |

### B. Dangling Imports / Spawns

| Location | Type | Details |
|----------|------|---------|
| `workflows/execute-phase.md` line 116 | `@file` reference in subagent spawn prompt | `@tdd.md` included in `<execution_context>` block for every plan executor |
| `workflows/plan-phase.md` line 471 / 572 | `@file` reference in subagent spawn prompt | `@tdd.md` included in planner spawn |
| `workflows/discuss-phase.md` line 488 / 559 | Instruction to spawned Task | "Include @file refs to ... tdd.md ..." explicitly listed in subagent instructions |
| `agents/gsd-executor.md` | Inline `<tdd_execution>` block | Executor has TDD execution logic baked in, triggered by `tdd="true"` attribute |
| `agents/gsd-planner.md` | Inline `<tdd_integration>` block | Planner has TDD plan creation logic baked in |

### C. Orphaned State Entries
None in `config.json` — no TDD config flags.
None in `STATE.md` template — TDD not tracked in state.

### D. Orphaned CLI Commands
| Command | Details |
|---------|---------|
| `gsd-tools template fill plan --type tdd` | `--type tdd` flag in `template fill plan` would produce a TDD plan template. If tdd.md removed, the template type becomes meaningless but won't crash (falls through to standard plan template). Low severity orphan. |

### E. Required Cleanup Actions

1. **Delete** `references/tdd.md` (both installed and project source)
2. **`workflows/execute-phase.md`** — Remove `@tdd.md` line from `<execution_context>` block (line 116 installed / 116 project)
3. **`workflows/plan-phase.md`** — Remove `@tdd.md` line from the execute-phase spawn prompt (line 471 installed / 572 project)
4. **`workflows/discuss-phase.md`** — Remove `tdd.md` from the `Include @file refs to ...` instruction list (line 488 installed / 559 project)
5. **`workflows/execute-plan.md`** — Remove entire `<tdd_plan_execution>` block (lines 213-226). Remove `if tdd="true" → TDD execution` clause from task execution step (line 138). Remove `test`/`refactor` TDD commit type rows from the commit type table (lines 247-248).
6. **`agents/gsd-executor.md`** — Remove `tdd="true"` check from execute_tasks step (line 85). Remove entire `<tdd_execution>` block (lines 277-289). Remove `test` commit type row from commit table (line 308).
7. **`agents/gsd-planner.md`** — Remove entire `## TDD Detection` section (lines 225-235 installed). Remove `tdd` from plan type schema row (line 447). Remove entire `<tdd_integration>` block (lines 738-782 installed). Remove TDD detection from "Apply..." instruction at end (line 1064).
8. **`agents/gsd-plan-checker.md`** — Remove `tdd` row from plan type validation table (line 125). Remove `tdd` from valid task type list (line 462).
9. **`templates/phase-prompt.md`** — Remove `tdd` from `type` field description (line 128). Remove "TDD candidates" bullet (line 250). Remove entire "## TDD Plans" section (lines 265-273).
10. **`templates/planner-subagent-prompt.md`** — Remove "TDD detection" from the note about baked-in methodology (line 117).
11. **`templates/summary.md`** — Remove TDD note about multiple commits (line 75).
12. **`references/git-integration.md`** — Remove `test` and `refactor` commit type entries labeled as TDD (lines 75-76, 92-101). These types may still be valid without TDD — assess whether to keep the types but remove the TDD labels.
13. **`workflows/add-tests.md`** — The "TDD classification" terminology is used throughout to mean "unit tests". Either rename the category from "TDD" to "Unit" throughout, or leave as-is if the TDD terminology in add-tests.md is considered benign (it doesn't reference tdd.md directly).
14. **`bin/gsd-tools.cjs`** — Remove `tdd` from `--type execute|tdd` in help text (line 93 both). The actual `type` argument parsing (line 294) has no TDD-specific handling beyond passing it through to template fill — assess if template fill for TDD type needs removal too.

---

## Item 2: Todo System

Files being removed: `workflows/add-todo.md`, `workflows/check-todos.md`, any todo template, CLI commands `list-todos`, `todo complete`, `init todos`.

### A. Dead Reference List

#### INSTALLED (`~/.claude/get-shit-done/`)

| File | Line(s) | Reference Type |
|------|---------|----------------|
| `workflows/add-todo.md` | entire file | WORKFLOW BEING REMOVED |
| `workflows/check-todos.md` | entire file | WORKFLOW BEING REMOVED |
| `workflows/help.md` | 235-259, 358-360, 468-471 | "Todo Management" section with both commands, directory structure, examples |
| `workflows/progress.md` | 82, 119-120 | `Count pending todos: use init todos or list-todos`, "## Pending Todos" section |
| `workflows/new-milestone.md` | 19 | `Read STATE.md (pending todos, blockers)` |
| `workflows/resume-project.md` | 48, 126-127, 191, 245, 276 | Pending Todos in resume context, check-todos suggestion, todo count |
| `workflows/pause-work.md` | 87 | `You can use init todos (which provides timestamps)` |
| `templates/state.md` | 57-61, 148-151 | "### Pending Todos" section in template, guidance about todo count in Accumulated Context |
| `bin/gsd-tools.cjs` | 23, 61-62, 123, 175, 356-357, 487-492, 536-537, 549 | `list-todos`, `todo complete`, `init todos` in help text and case handlers |
| `bin/lib/commands.cjs` | 44-77, 450-460, 538, 546 | `cmdListTodos()` function, `cmdTodoComplete()` function, exports |
| `bin/lib/init.cjs` | 445-498, 486-493, 706 | `cmdInitTodos()` function with full todo scanning logic, exports |

#### COMMANDS DIRECTORY (`~/.claude/commands/gsd/`)
| File | Line(s) | Reference Type |
|------|---------|----------------|
| `commands/gsd/add-todo.md` | entire file | SLASH COMMAND BEING REMOVED |
| `commands/gsd/check-todos.md` | entire file | SLASH COMMAND BEING REMOVED |

#### PROJECT SOURCE (`get-shit-done/`)
Same as installed. Additionally the project source `bin/gsd-tools.cjs` error message at line 574 includes `todos` in the `init` workflow list.

### B. Dangling Imports / Spawns

| Location | Details |
|----------|---------|
| `workflows/resume-project.md` line 245 | "Check todos → Read .planning/todos/pending/, present summary" — routable action in resume workflow |
| `workflows/resume-project.md` line 191 | "3. Check pending todos ([N] pending)" in user option list |
| `workflows/pause-work.md` line 87 | Suggests using `init todos` for timestamps — but `current-timestamp` is the actual command used, so this is a minor doc artifact |

### C. Orphaned State Entries

| File | Orphaned Field/Section | Notes |
|------|----------------------|-------|
| `templates/state.md` line 57-61 | `### Pending Todos` section in STATE.md template | Populated by add-todo, read by check-todos. Remove section from template. |
| `templates/state.md` line 148-151 | Guidance for "Pending Todos" in `<sections>` block | Must be removed with the section |
| All existing project `STATE.md` files | `### Pending Todos` section | If any projects have pending todos listed, that section becomes orphaned data — no tool will update or read it |

### D. Orphaned CLI Commands

| Command | Defined In | Status |
|---------|-----------|--------|
| `list-todos [area]` | `gsd-tools.cjs` → `commands.cjs:cmdListTodos` | Fully orphaned — no workflow calls it after removal |
| `todo complete <filename>` | `gsd-tools.cjs` → `commands.cjs:cmdTodoComplete` | Fully orphaned |
| `init todos [area]` | `gsd-tools.cjs` → `init.cjs:cmdInitTodos` | Fully orphaned |

Note: `init todos` was also used by `pause-work.md` line 87 as a timestamp source, but the actual timestamp code on line 89 uses `current-timestamp` directly. The mention is a secondary/optional note and can be removed.

### E. Required Cleanup Actions

1. **Delete** `workflows/add-todo.md` (both trees)
2. **Delete** `workflows/check-todos.md` (both trees)
3. **Delete** `commands/gsd/add-todo.md` (both trees)
4. **Delete** `commands/gsd/check-todos.md` (both trees)
5. **`workflows/help.md`** — Remove entire "### Todo Management" section (lines 235-259). Remove `todos/` from Planning Directory Structure tree (lines 358-360). Remove add-todo and check-todos from Examples section (lines 468-471).
6. **`workflows/progress.md`** — Remove `init todos or list-todos` from pending todo count step (line 82). Remove entire "## Pending Todos" section from report template (lines 119-120).
7. **`workflows/resume-project.md`** — Remove "Pending Todos" from resume context list (line 48). Remove `[N] pending todos — /gsd:check-todos to review` from resume output (lines 126-127). Remove "3. Check pending todos" from user options (line 191). Remove "Check todos" from action routing (line 245). Remove "Count pending todos" step (line 276).
8. **`workflows/new-milestone.md`** — Remove `pending todos` from the STATE.md read description (line 19). Reword to just "blockers".
9. **`workflows/pause-work.md`** — Remove the `init todos` mention from the timestamp guidance (line 87). Keep the `current-timestamp` command that follows.
10. **`templates/state.md`** — Remove `### Pending Todos` section from the template (lines 57-61). Remove the "Pending Todos" guidance from the `<sections>` block (lines 148-151).
11. **`bin/gsd-tools.cjs`** — Remove `list-todos` from help text (line 23) and from usage error message. Remove `Todos:` section help text (lines 61-62). Remove `init todos` from init section help text (line 123). Remove `case 'list-todos'` handler (lines 356-357). Remove `case 'todo'` handler block (lines 487-492). Remove `case 'todos'` in init switch (lines 536-537). Remove `todos` from the init workflow available list in error message (line 549 installed / 574 project).
12. **`bin/lib/commands.cjs`** — Remove `cmdListTodos()` function (lines 44-77). Remove `cmdTodoComplete()` function (lines 450-460). Remove from exports (lines 538, 546).
13. **`bin/lib/init.cjs`** — Remove `cmdInitTodos()` function (lines 445-498). Remove from exports (line 706 installed / 1266 project).

---

## Item 3: Health Check

Files being removed: `workflows/health.md`, `commands/gsd/health.md`.
CLI being removed: `validate health [--repair]` subcommand.

### A. Dead Reference List

#### INSTALLED (`~/.claude/get-shit-done/`)

| File | Line(s) | Reference Type |
|------|---------|----------------|
| `workflows/health.md` | entire file | WORKFLOW BEING REMOVED |
| `bin/gsd-tools.cjs` | 56, 472-474, 476 | `validate health [--repair]` in help text, `cmdValidateHealth` call, error message |
| `bin/lib/verify.cjs` | 2 (comment), 517-772 | `cmdValidateHealth()` function — entire health check + repair implementation |
| `bin/lib/verify.cjs` | 571, 594, 603, 615, 728 | Error/warning messages referencing `/gsd:health --repair` as fix instructions |

#### COMMANDS DIRECTORY (`~/.claude/commands/gsd/`)
| File | Line(s) | Reference Type |
|------|---------|----------------|
| `commands/gsd/health.md` | entire file | SLASH COMMAND BEING REMOVED |

#### PROJECT SOURCE (`get-shit-done/`)
Identical references in project source equivalents.

#### AGENTS (`~/.claude/agents/` and `agents/`)
| File | Line(s) | Reference Type |
|------|---------|----------------|
| `agents/primary-collaborator.md` | 67 | Uses "health" in a general sense ("project health") — NOT a reference to the health check command. Not an orphan. |

### B. Dangling Imports / Spawns
None. The health workflow is only invoked directly by the user via `/gsd:health` slash command — it is not spawned by any other workflow.

### C. Orphaned State Entries
None in `config.json` — no health-related config keys.
None in `STATE.md` template — health status not tracked in state.

### D. Orphaned CLI Commands

| Command | Defined In | Status |
|---------|-----------|--------|
| `validate health [--repair]` | `gsd-tools.cjs` → `verify.cjs:cmdValidateHealth` | Fully orphaned after health workflow removal |

**Secondary orphan:** The fix-instruction strings in `verify.cjs` that say `"Run /gsd:health --repair ..."` would become broken references in the remaining validation code. These appear in error messages for `E004`, `W002`, `W003`, `E005`. After health removal, these need to be reworded to actionable manual instructions.

### E. Required Cleanup Actions

1. **Delete** `workflows/health.md` (both trees)
2. **Delete** `commands/gsd/health.md` (both trees)
3. **`bin/gsd-tools.cjs`** — Remove `validate health [--repair]` from help text (line 56). Remove `else if (subcommand === 'health')` branch and `cmdValidateHealth` call (lines 472-474). Update error message to remove `health` from available subcommands (line 476).
4. **`bin/lib/verify.cjs`** — Remove `cmdValidateHealth()` function entirely (lines 517-772). Remove from exports. Update file header comment (line 2) to remove "health validation".
5. **`bin/lib/verify.cjs`** — For remaining validation code that uses `/gsd:health --repair` as the fix instruction (lines 571, 594, 603, 615, 728): replace with actionable manual instructions such as "Regenerate STATE.md manually from template" or simply remove the `--repair` suggestion. These are error message strings only.
6. **No help.md changes needed** — `/gsd:health` is not listed in `help.md` (confirmed: no matches for "health" in help.md).

---

## Item 4: Plan Deviation Rules

**Critical finding:** There is NO standalone file for deviation rules. The rules exist as inline `<deviation_rules>` XML blocks embedded in:
- `agents/gsd-executor.md` (both installed and project)
- `workflows/execute-plan.md` (both installed and project)

There are also references to "deviation rules" by name throughout — but these are behavioral references, not file imports.

### A. Dead Reference List

#### IN THE BLOCKS BEING REMOVED

| File | Lines | Content |
|------|-------|---------|
| `agents/gsd-executor.md` (installed) | 101-172 | `<deviation_rules>` block: Rules 1-4, scope boundary, fix attempt limit |
| `agents/gsd-executor.md` (project) | 101-172 | Same block |
| `workflows/execute-plan.md` (installed) | 168-199 | `<deviation_rules>` block: condensed table form |
| `workflows/execute-plan.md` (project) | 168-199 | Same block |

#### REFERENCES TO DEVIATION RULES IN KEPT FILES

| File | Line(s) | Reference Type |
|------|---------|----------------|
| `workflows/execute-plan.md` | 69 | `follow deviation/auth rules` in Pattern A description |
| `workflows/execute-plan.md` | 102 | `Subagent route: ... track deviations` |
| `workflows/execute-plan.md` | 104 | `aggregate files/deviations/decisions` |
| `workflows/execute-plan.md` | 134 | `Deviations are normal — handle via rules below.` |
| `workflows/execute-plan.md` | 138 | `Implement with deviation rules + auth gates` |
| `workflows/execute-plan.md` | 142 | `5. Document deviations in Summary` |
| `workflows/execute-plan.md` | 201-211 | `<deviation_documentation>` block — documents how to record deviations in SUMMARY |
| `agents/gsd-executor.md` | 86 | `apply deviation rules as needed` |
| `agents/gsd-executor.md` | 96 | `document deviations` |
| `agents/gsd-executor.md` | 339-352 | Deviation documentation format in SUMMARY |
| `agents/gsd-executor.md` | 462 | `All deviations documented` checklist item |
| `templates/summary.md` | 84-110, 199-221, 245 | `## Deviations from Plan` section in SUMMARY template, example content, guidance |
| `templates/summary-complex.md` | 51-52 | `## Deviations from Plan (Auto-fixed)` section |
| `templates/summary-standard.md` | 43-45 | `## Decisions & Deviations` section |
| `templates/codebase/conventions.md` | 291 | "Note deviations" — general coding convention note, unrelated |
| `bin/lib/template.cjs` | 110 | `'## Decisions & Deviations'` in template section list |
| `agents/gsd-review-functional.md` | 23 | "Behavioral deviations are flagged" — review concept, unrelated |
| `agents/gsd-review-technical.md` | 23 | "deviations are explained" — review concept, unrelated |
| `agents/gsd-review-enduser.md` | 22 | "Deviations from spec are flagged" — review concept, unrelated |
| `get-shit-done/references/escalation-protocol.md` | 47 | "Minor deviation from plan" example — escalation concept, unrelated |

### B. Dangling Imports / Spawns
None. The deviation rules are inlined — no `@file` references or spawned workflows point to them.

### C. Orphaned State Entries
None in `config.json`.
The `## Deviations from Plan` section in SUMMARY templates is produced by the executor as part of plan execution. If deviation rules are removed, this section remains but will just always say "None" (or be removed from the template too). The template itself is not orphaned — the question is whether the section heading should be removed or kept for general unplanned-work documentation.

### D. Orphaned CLI Commands
None. No CLI commands implement or depend on deviation rules.

### E. Required Cleanup Actions

**The deviation rules are behavioral instructions to the LLM agent — removing them changes executor behavior, not file references.** The cleanup required is:

1. **`agents/gsd-executor.md`** — Remove the `<deviation_rules>` block (lines 101-172 in both trees). This removes Rules 1-4, scope boundary, and fix attempt limit.
2. **`workflows/execute-plan.md`** — Remove the `<deviation_rules>` block (lines 168-199 in both trees).
3. **`workflows/execute-plan.md`** — Update/remove references to "deviation rules" in the task execution flow:
   - Line 69: Remove `follow deviation/auth rules` clause from Pattern A description
   - Line 134: Remove `Deviations are normal — handle via rules below.` (the rules are gone)
   - Line 138: Remove `Implement with deviation rules + auth gates` clause
4. **`agents/gsd-executor.md`** — Update/remove "apply deviation rules as needed" from execute_tasks step (line 86).
5. **`workflows/execute-plan.md`** and **`agents/gsd-executor.md`** — Assess the `<deviation_documentation>` block and Summary deviation tracking:
   - If the INTENT is to stop ALL unplanned work handling: also remove `<deviation_documentation>`, remove deviation sections from SUMMARY template
   - If the INTENT is only to remove the RULES (the specific named Rules 1-4) but keep the concept of tracking unplanned changes: keep documentation blocks and SUMMARY sections, just remove the rule definitions
   - This is a product decision, not a mechanical cleanup
6. **`templates/summary.md`**, **`templates/summary-complex.md`**, **`templates/summary-standard.md`** — If deviation tracking concept is fully removed: remove all `## Deviations from Plan` sections.
7. **`bin/lib/template.cjs`** line 110 — If `## Decisions & Deviations` is removed from summary-standard: update the section list here.

**IMPORTANT AMBIGUITY:** "Plan deviation rules" being removed may mean:
- (A) Remove the formal Rules 1-4 taxonomy entirely, executor just uses judgment
- (B) Remove only the `<deviation_rules>` blocks, but deviation tracking/documentation remains
- (C) Remove everything — no unplanned work handling, no tracking

The references to "deviations" in review agents and escalation protocol are conceptually related but structurally independent. They do NOT require changes regardless of which interpretation is chosen.

---

## Summary Matrix

| Item | Files to Delete | Files to Edit | CLI Functions to Remove | State Fields Orphaned |
|------|----------------|---------------|------------------------|----------------------|
| TDD | `references/tdd.md` (×2) | 13 files (×2 trees) | `--type tdd` flag in template fill | None |
| Todo System | `workflows/add-todo.md`, `workflows/check-todos.md`, `commands/gsd/add-todo.md`, `commands/gsd/check-todos.md` (×2 trees each) | 6 workflow/template files + `gsd-tools.cjs` (×2 trees) | `list-todos`, `todo complete`, `init todos` (functions in commands.cjs + init.cjs) | `### Pending Todos` in STATE.md template |
| Health Check | `workflows/health.md`, `commands/gsd/health.md` (×2 trees each) | `gsd-tools.cjs` (×2), `verify.cjs` (×2) — fix strings | `validate health [--repair]` + `cmdValidateHealth()` | None in config/state |
| Deviation Rules | None (inline blocks) | `gsd-executor.md` (×2 trees), `execute-plan.md` (×2 trees) | None | Possibly SUMMARY template sections |

---

## Cross-Cutting Notes

### help.md Status
`/gsd:health` is **NOT** listed in `help.md` (confirmed no matches). No health cleanup needed in help.md.
`/gsd:add-todo` and `/gsd:check-todos` ARE listed in help.md with a full "Todo Management" section that must be removed.

### The "init todos" Timestamp Trick
`pause-work.md` line 87 says `You can use init todos (which provides timestamps)` as a side note before giving the direct `current-timestamp` command. This is documentation noise — the actual command is on line 89. Remove the `init todos` mention only.

### verify.cjs Fix Strings
The `cmdValidateHealth` function is the only user-facing function in verify.cjs. The other functions (`cmdValidateConsistency`, `cmdVerify`, etc.) remain. After removing `cmdValidateHealth`, the fix-instruction strings in remaining validation code that say "Run /gsd:health --repair" need to become plain text instructions since that command no longer exists.

### Deviation Rules vs Deviation Tracking
These are distinct concepts. The RULES define the auto-fix taxonomy (Rules 1-4). The TRACKING is the `## Deviations from Plan` section in SUMMARY.md. Removing the rules does not require removing the tracking — but you may want to remove the tracking too if the intent is a clean break.
