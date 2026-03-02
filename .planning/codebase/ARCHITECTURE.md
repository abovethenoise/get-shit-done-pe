# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** Meta-prompting orchestration framework — markdown command files invoke workflows that spawn AI subagents, coordinated by a Node.js CLI utility.

**Key Characteristics:**
- Commands are markdown files with YAML frontmatter, not code
- Workflows are markdown instruction documents loaded into AI context at runtime
- All business logic for file/state/phase manipulation lives in `gsd-tools.cjs` (the CLI utility)
- Agents are separate persona prompts spawned via `Task` tool calls
- The executing AI (Claude Code, Gemini CLI, etc.) is the runtime — it interprets command/workflow/agent documents

## Layers

**Commands Layer:**
- Purpose: Entry point for user-invoked slash commands
- Location: `commands/gsd/` (installed to `~/.claude/commands/gsd/`, `~/.gemini/`, etc.)
- Contains: One `.md` file per slash command (e.g., `execute-phase.md`, `plan-phase.md`)
- Depends on: Workflows, references, gsd-tools CLI
- Used by: AI assistant (Claude Code, Gemini CLI, Codex) via slash command invocation

**Workflows Layer:**
- Purpose: Step-by-step operational procedures that orchestrators follow
- Location: `get-shit-done/workflows/` (installed to `~/.claude/get-shit-done/workflows/`)
- Contains: Detailed XML/markdown process documents — each workflow defines an ordered sequence of steps with shell commands, conditionals, and agent spawn instructions
- Depends on: gsd-tools CLI, agents, templates, references
- Used by: Commands (via `@` file references in `<execution_context>` blocks)

**Agents Layer:**
- Purpose: Specialist AI persona definitions that are spawned as subagents
- Location: `agents/` (installed to `~/.claude/agents/`)
- Contains: One `.md` per agent role: `gsd-planner.md`, `gsd-executor.md`, `gsd-verifier.md`, `gsd-debugger.md`, `gsd-codebase-mapper.md`, `gsd-phase-researcher.md`, `gsd-project-researcher.md`, `gsd-research-synthesizer.md`, `gsd-roadmapper.md`, `gsd-plan-checker.md`, `gsd-integration-checker.md`
- Depends on: gsd-tools CLI, templates, references
- Used by: Orchestrator workflows via Task tool calls

**CLI Utility Layer:**
- Purpose: Centralizes all file I/O, state mutation, config parsing, git operations, and phase management
- Location: `get-shit-done/bin/gsd-tools.cjs` (entry point), `get-shit-done/bin/lib/` (modules)
- Contains: Node.js CommonJS modules — commands are executed via `node gsd-tools.cjs <command> [args]`
- Depends on: Node.js stdlib (fs, path, child_process)
- Used by: Workflows and agents via Bash tool calls

**Templates Layer:**
- Purpose: Canonical document formats for all planning artifacts
- Location: `get-shit-done/templates/`
- Contains: Markdown templates for `project.md`, `roadmap.md`, `state.md`, `phase-prompt.md`, `summary.md`, `milestone.md`, `context.md`, and others; also `codebase/` sub-templates and `config.json`
- Depends on: Nothing
- Used by: Agents and workflows when creating new planning documents

**References Layer:**
- Purpose: Shared behavioral rules and patterns injected into agent context
- Location: `get-shit-done/references/`
- Contains: Authoritative markdown specs: `model-profiles.md`, `planning-config.md`, `checkpoints.md`, `verification-patterns.md`, `git-integration.md`, `ui-brand.md`, `questioning.md`, `tdd.md`, `continuation-format.md`
- Depends on: Nothing
- Used by: Commands (via `<execution_context>` blocks), workflows, agents

**Project Planning Layer (runtime, per-project):**
- Purpose: Persistent project state, stored in the user's project repo
- Location: `.planning/` (within each user's project directory)
- Contains: `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `config.json`, `REQUIREMENTS.md`, `phases/`, `todos/`, `research/`, `codebase/`
- Depends on: Nothing (plain markdown + JSON files)
- Used by: All layers at runtime

## Data Flow

**Project Initialization Flow:**

```
User: /gsd:new-project
  └─> commands/gsd/new-project.md
        └─> loads workflows/new-project.md into context
              └─> node gsd-tools.cjs init new-project
                    └─> returns JSON: researcher_model, roadmapper_model, etc.
              └─> [optional] spawns Task(gsd-project-researcher)
              └─> spawns Task(gsd-roadmapper)
              └─> writes .planning/PROJECT.md, ROADMAP.md, STATE.md, config.json
              └─> node gsd-tools.cjs commit "docs: initialize ..."
```

**Phase Planning Flow:**

```
User: /gsd:plan-phase 3
  └─> commands/gsd/plan-phase.md
        └─> loads workflows/plan-phase.md into context
              └─> node gsd-tools.cjs init plan-phase 3
                    └─> returns JSON: planner_model, phase_dir, has_research, etc.
              └─> [optional] spawns Task(gsd-phase-researcher)
              └─> spawns Task(gsd-planner)
                    └─> reads CONTEXT.md, ROADMAP.md, research
                    └─> writes .planning/phases/03-name/03-NN-PLAN.md files
              └─> spawns Task(gsd-plan-checker) — verification loop (max 3 iterations)
              └─> node gsd-tools.cjs commit "docs(03): add phase plans"
```

**Phase Execution Flow:**

```
User: /gsd:execute-phase 3
  └─> commands/gsd/execute-phase.md
        └─> loads workflows/execute-phase.md into context
              └─> node gsd-tools.cjs init execute-phase 3
                    └─> returns JSON: executor_model, plans, waves, branch_name, etc.
              └─> node gsd-tools.cjs phase-plan-index 3
                    └─> returns wave grouping of plans
              └─> For each wave (sequential), for each plan in wave (parallel):
                    └─> spawns Task(gsd-executor, model=executor_model)
                          └─> reads PLAN.md, follows execute-plan.md workflow
                          └─> writes code changes to project files
                          └─> writes .planning/phases/03-name/03-NN-SUMMARY.md
                          └─> node gsd-tools.cjs commit "feat: ..."
              └─> [optional] spawns Task(gsd-verifier) post-phase
              └─> node gsd-tools.cjs state update ...
```

**State Management:**
- All project state in `.planning/STATE.md` (markdown with `**field:**` pattern)
- `gsd-tools.cjs state load` reads config + state into JSON for workflows
- `gsd-tools.cjs state update <field> <value>` mutates STATE.md in place
- Frontmatter in PLAN.md and SUMMARY.md carries structured metadata (parsed by `frontmatter.cjs`)
- No database — everything is plain files

## Key Abstractions

**Phase:**
- Purpose: Unit of deliverable work, maps to a directory under `.planning/phases/`
- Examples: `.planning/phases/01-auth/`, `.planning/phases/03-payments/`
- Pattern: Zero-padded integer prefix (e.g., `03-`), supports decimal insertion (e.g., `02.1-hotfix`)

**Plan (PLAN.md):**
- Purpose: Executable instructions for a single AI execution agent — acts as a prompt, not a document
- Examples: `.planning/phases/01-auth/01-01-PLAN.md`, `.planning/phases/01-auth/01-02-PLAN.md`
- Pattern: YAML frontmatter with `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`, `must_haves`; XML `<objective>`, `<execution_context>`, `<context>`, `<tasks>` sections

**Wave:**
- Purpose: Parallelization grouping — plans in the same wave have no dependencies on each other and can execute concurrently
- Pattern: Integer field in PLAN.md frontmatter; assigned at plan time; orchestrator groups by wave before execution

**Summary (SUMMARY.md):**
- Purpose: Outcome record written by executor after plan completion; presence signals plan is done
- Examples: `.planning/phases/01-auth/01-01-SUMMARY.md`
- Pattern: YAML frontmatter with `provides`, `requires`, `tech-stack`, `key-files`, `key-decisions`, `requirements-completed`, `duration`

**Agent:**
- Purpose: Specialist AI persona spawned via Task tool; each handles one concern
- Pattern: Markdown file with YAML `name`, `description`, `tools`, `color` frontmatter followed by XML `<role>` and behavioral instruction sections
- Key agents: `gsd-planner` (architecture decisions), `gsd-executor` (implementation), `gsd-verifier` (validation), `gsd-plan-checker` (plan quality)

**Model Profile:**
- Purpose: Controls which Claude model tier each agent uses (quality/balanced/budget)
- Pattern: Config in `.planning/config.json` as `model_profile`; resolved at spawn time via `node gsd-tools.cjs resolve-model <agent-type>`; `inherit` returned for opus-tier to avoid version conflicts

## Entry Points

**Slash Commands:**
- Location: `commands/gsd/*.md` (installed)
- Triggers: User types `/gsd:<command>` in AI assistant interface
- Responsibilities: Load workflow via `@` reference, pass `$ARGUMENTS`, define allowed tools

**gsd-tools CLI:**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command>` from within workflows/agents via Bash tool
- Responsibilities: All stateful operations — state read/write, phase CRUD, roadmap parsing, git commits, model resolution, scaffolding

**Installer:**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc --claude` (or `--gemini`, `--opencode`, `--codex`)
- Responsibilities: Copies `commands/`, `agents/`, `get-shit-done/` to appropriate AI runtime config directory (`~/.claude/`, `~/.gemini/`, etc.); registers hooks; writes statusline helpers

## Error Handling

**Strategy:** Fail-fast with descriptive messages. All gsd-tools CLI commands exit with code 1 and write to stderr on error. Workflows check JSON output from init commands and branch on error conditions before proceeding.

**Patterns:**
- Init commands return `phase_found: false`, `planning_exists: false` etc. — workflows gate on these
- gsd-tools writes large payloads (>50KB) to temp files, returns `@file:/path` prefix so callers detect and read from disk
- `safeReadFile()` returns null instead of throwing — callers check for null
- Phase number normalization (`normalizePhaseName`) prevents directory lookup failures from format variations

## Cross-Cutting Concerns

**Logging:** No logging framework. Workflows output formatted markdown banners to user via AI response. gsd-tools writes errors to stderr only.

**Validation:** `gsd-tools validate consistency` and `validate health` check phase numbering, disk/roadmap sync, and `.planning/` integrity. Called by `health.md` workflow.

**Authentication:** No auth in the framework itself. User secrets (API keys for external services) are captured via checkpoint tasks and used by Claude within the session. `config.json` `safety.always_confirm_external_services: true` gates external API calls.

**Model Selection:** All agent spawns resolve model at call time via `resolve-model` — checks `model_overrides` first, then profile table, returns `inherit` for opus-tier agents.

**Parallelization:** Wave-based at plan level. Config `parallelization: true/false` controls whether plans within a wave execute concurrently (Task spawns) or sequentially. Task-level parallelization is a separate config flag (`task_level`).

---

*Architecture analysis: 2026-02-28*
