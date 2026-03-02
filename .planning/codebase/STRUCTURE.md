# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```
get-shit-done-pe/                  # Package root (npm: get-shit-done-cc)
├── bin/
│   └── install.js                 # npm install entry point (copies files to AI runtime dirs)
├── commands/
│   └── gsd/                       # Slash command definitions (32 .md files)
│       ├── execute-phase.md       # /gsd:execute-phase
│       ├── plan-phase.md          # /gsd:plan-phase
│       ├── new-project.md         # /gsd:new-project
│       ├── map-codebase.md        # /gsd:map-codebase
│       └── ...                    # All other /gsd: commands
├── agents/                        # AI subagent persona definitions (11 .md files)
│   ├── gsd-planner.md
│   ├── gsd-executor.md
│   ├── gsd-verifier.md
│   ├── gsd-debugger.md
│   ├── gsd-codebase-mapper.md
│   ├── gsd-plan-checker.md
│   ├── gsd-integration-checker.md
│   ├── gsd-roadmapper.md
│   ├── gsd-phase-researcher.md
│   ├── gsd-project-researcher.md
│   └── gsd-research-synthesizer.md
├── get-shit-done/                 # Core framework (installed to ~/.claude/get-shit-done/)
│   ├── bin/
│   │   ├── gsd-tools.cjs          # CLI utility entry point (node gsd-tools.cjs <cmd>)
│   │   └── lib/                   # CLI module library
│   │       ├── core.cjs           # Shared utils, MODEL_PROFILES, loadConfig, git helpers
│   │       ├── state.cjs          # STATE.md read/write/update
│   │       ├── phase.cjs          # Phase CRUD, plan listing, lifecycle
│   │       ├── roadmap.cjs        # ROADMAP.md parsing and updates
│   │       ├── milestone.cjs      # Milestone archive and completion
│   │       ├── init.cjs           # Compound init commands (init execute-phase, etc.)
│   │       ├── commands.cjs       # Standalone utility commands (slug, timestamp, todos)
│   │       ├── config.cjs         # Config-related operations
│   │       ├── frontmatter.cjs    # YAML frontmatter CRUD for .md files
│   │       ├── template.cjs       # Template scaffolding operations
│   │       └── verify.cjs         # Verification suite commands
│   ├── workflows/                 # Step-by-step operational procedures (33 .md files)
│   │   ├── execute-phase.md       # Wave-based parallel plan execution
│   │   ├── execute-plan.md        # Single plan execution with checkpoint routing
│   │   ├── plan-phase.md          # Research → plan → verify loop
│   │   ├── new-project.md         # Project initialization flow
│   │   ├── verify-work.md         # UAT session management
│   │   ├── complete-milestone.md  # Milestone archival and branch merging
│   │   └── ...                    # All other workflow procedures
│   ├── templates/                 # Canonical planning document formats
│   │   ├── project.md             # PROJECT.md format
│   │   ├── roadmap.md             # ROADMAP.md format
│   │   ├── state.md               # STATE.md format
│   │   ├── phase-prompt.md        # PLAN.md format (the core execution artifact)
│   │   ├── summary.md             # SUMMARY.md format
│   │   ├── milestone.md           # MILESTONES.md format
│   │   ├── context.md             # CONTEXT.md format
│   │   ├── requirements.md        # REQUIREMENTS.md format
│   │   ├── config.json            # Default config.json structure
│   │   ├── codebase/              # Codebase map document templates (7 .md files)
│   │   └── research-project/      # Research project document templates
│   └── references/                # Shared behavioral specs and rules
│       ├── model-profiles.md      # Agent → model tier mapping
│       ├── planning-config.md     # config.json schema and behavior
│       ├── checkpoints.md         # Checkpoint type definitions and patterns
│       ├── verification-patterns.md # How to detect stubs vs real implementations
│       ├── git-integration.md     # Commit format and timing rules
│       ├── ui-brand.md            # UI output formatting (banners, colors)
│       ├── questioning.md         # Deep questioning methodology
│       ├── tdd.md                 # TDD patterns reference
│       ├── continuation-format.md # Context handoff format
│       ├── decimal-phase-calculation.md
│       ├── model-profile-resolution.md
│       └── phase-argument-parsing.md
├── hooks/                         # Claude Code hooks (JS, compiled to hooks/dist/)
│   ├── gsd-check-update.js        # Update checker hook
│   ├── gsd-context-monitor.js     # Context window monitor
│   └── gsd-statusline.js          # Status line display hook
├── scripts/
│   ├── build-hooks.js             # esbuild hook compilation script
│   └── run-tests.cjs              # Test runner script
├── tests/                         # Test suite (15 .test.cjs files + helpers)
│   ├── core.test.cjs
│   ├── state.test.cjs
│   ├── phase.test.cjs
│   ├── roadmap.test.cjs
│   ├── milestone.test.cjs
│   ├── commands.test.cjs
│   ├── init.test.cjs
│   ├── frontmatter.test.cjs
│   ├── frontmatter-cli.test.cjs
│   ├── verify.test.cjs
│   ├── config.test.cjs
│   ├── dispatcher.test.cjs
│   ├── codex-config.test.cjs
│   ├── verify-health.test.cjs
│   └── helpers.cjs                # Shared test utilities
├── docs/
│   ├── USER-GUIDE.md              # End-user guide
│   └── context-monitor.md         # Context monitor docs
├── assets/                        # Static assets (icons, images for docs)
├── .github/
│   ├── workflows/                 # CI/CD (GitHub Actions)
│   └── ISSUE_TEMPLATE/
├── package.json                   # npm package manifest (name: get-shit-done-cc, v1.22.0)
├── README.md
└── CHANGELOG.md
```

## Directory Purposes

**`commands/gsd/`:**
- Purpose: User-facing slash commands, one file per command
- Contains: Markdown with YAML frontmatter (`name`, `description`, `argument-hint`, `agent`, `allowed-tools`) followed by XML `<objective>`, `<execution_context>`, `<context>`, `<process>` sections
- Key files: `execute-phase.md`, `plan-phase.md`, `new-project.md`, `map-codebase.md`, `verify-work.md`, `debug.md`
- Install destination: `~/.claude/commands/gsd/` (Claude Code), `~/.gemini/commands/gsd/` (Gemini CLI), etc.

**`agents/`:**
- Purpose: AI subagent persona definitions — each agent is a specialist role spawned via Task tool
- Contains: Markdown with YAML frontmatter (`name`, `description`, `tools`, `color`) and detailed role/behavioral instruction sections
- Key files: `gsd-planner.md` (42KB, largest — most complex behavior), `gsd-executor.md` (18KB), `gsd-debugger.md` (37KB)
- Install destination: `~/.claude/agents/` and equivalents

**`get-shit-done/bin/lib/`:**
- Purpose: All stateful CLI operations — the only code layer in the framework
- Contains: Node.js CJS modules, no external dependencies, pure stdlib
- Module responsibilities:
  - `core.cjs`: Constants (MODEL_PROFILES), `loadConfig`, git helpers, phase normalization, shared utilities
  - `state.cjs`: STATE.md CRUD
  - `phase.cjs`: Phase directory management, plan/summary inventory
  - `roadmap.cjs`: ROADMAP.md parsing (phase sections, progress tables)
  - `init.cjs`: Compound bootstrap commands returning full context JSON (`init execute-phase`, `init plan-phase`, `init new-project`)
  - `frontmatter.cjs`: YAML frontmatter parse/merge/validate for all .md files
  - `verify.cjs`: Verification suite (stub detection, wiring checks, health validation)

**`get-shit-done/workflows/`:**
- Purpose: Process definitions loaded into AI context at command runtime — not executed as code
- Contains: Markdown documents with XML process steps, bash command snippets, conditional logic described in natural language
- Pattern: Each workflow maps 1:1 to a command; `<step name="...">` blocks with numbered substeps; `<if mode="...">` for conditional paths

**`get-shit-done/templates/`:**
- Purpose: Source of truth for what planning documents look like
- Contains: Template files agents copy from when creating new planning artifacts
- Critical: `phase-prompt.md` defines PLAN.md format (the central execution artifact); `config.json` defines all configurable defaults

**`get-shit-done/references/`:**
- Purpose: Shared rules injected into agent/workflow context via `@` file references
- Contains: Authoritative behavioral specs — not templates, not workflows, but rules
- Usage: Commands declare `<execution_context>` blocks with `@~/.claude/get-shit-done/references/ui-brand.md` etc.

**`tests/`:**
- Purpose: Unit and integration tests for the CLI utility layer only (not commands/workflows/agents — those are markdown)
- Contains: CJS test files mirroring `get-shit-done/bin/lib/` module names; `helpers.cjs` for shared test utilities
- Coverage target: 70% lines on `get-shit-done/bin/lib/*.cjs`

**`.planning/` (per-project, not in this repo):**
- Purpose: Runtime project state — created in the user's project directory when GSD is used
- Structure:
  ```
  .planning/
  ├── config.json          # Project workflow preferences
  ├── PROJECT.md           # Living project context
  ├── ROADMAP.md           # Phase structure + progress
  ├── STATE.md             # Project memory (current phase, velocity, decisions)
  ├── REQUIREMENTS.md      # Scoped requirements with IDs (REQ-01, etc.)
  ├── phases/
  │   └── 01-name/         # One dir per phase (zero-padded)
  │       ├── 01-CONTEXT.md      # User decisions from discuss-phase
  │       ├── 01-RESEARCH.md     # Domain research
  │       ├── 01-01-PLAN.md      # Executable plan prompt
  │       ├── 01-01-SUMMARY.md   # Completion record
  │       └── 01-UAT.md          # UAT session state
  ├── todos/
  │   ├── pending/         # Open todo items
  │   └── completed/       # Resolved todos
  ├── research/            # Project-level research (vs phase-level)
  ├── codebase/            # Map documents from /gsd:map-codebase
  │   ├── ARCHITECTURE.md
  │   ├── STRUCTURE.md
  │   ├── STACK.md
  │   ├── INTEGRATIONS.md
  │   ├── CONVENTIONS.md
  │   ├── TESTING.md
  │   └── CONCERNS.md
  └── milestones/          # Archived phase dirs after milestone completion
  ```

## Key File Locations

**Entry Points:**
- `bin/install.js`: npm package entry point — run via `npx get-shit-done-cc`
- `get-shit-done/bin/gsd-tools.cjs`: CLI utility — all file operations go through here
- `commands/gsd/new-project.md`: GSD workflow start — initializes a project
- `commands/gsd/execute-phase.md`: Core execution command

**Configuration:**
- `get-shit-done/templates/config.json`: Default config schema with all options
- `get-shit-done/references/planning-config.md`: Configuration documentation and behavior spec
- `.planning/config.json` (per-project): Runtime project configuration

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: MODEL_PROFILES table, `loadConfig`, git utilities, phase normalization
- `get-shit-done/bin/lib/init.cjs`: `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitNewProject` — bootstrap commands that return full JSON context to workflows
- `get-shit-done/bin/lib/state.cjs`: STATE.md operations
- `get-shit-done/bin/lib/phase.cjs`: Phase CRUD and plan inventory

**Testing:**
- `tests/*.test.cjs`: All tests, co-located in flat `tests/` directory
- `tests/helpers.cjs`: Shared test utilities (temp dir setup, fixture helpers)
- `scripts/run-tests.cjs`: Test runner
- `package.json` scripts: `test`, `test:coverage`

## Naming Conventions

**Files:**
- Commands: `kebab-case.md` matching the slash command name (e.g., `execute-phase.md` → `/gsd:execute-phase`)
- Agents: `gsd-<role>.md` prefix (e.g., `gsd-planner.md`, `gsd-executor.md`)
- Workflows: `kebab-case.md` matching the command they serve
- Library modules: `<domain>.cjs` (e.g., `state.cjs`, `phase.cjs`, `roadmap.cjs`)
- Tests: `<domain>.test.cjs` matching the module they test
- Planning artifacts: `<phase>-<plan>-PLAN.md`, `<phase>-<plan>-SUMMARY.md` (e.g., `01-02-PLAN.md`)

**Directories:**
- Phase directories: `<padded-integer>-<slug>/` (e.g., `01-auth/`, `03-payments/`)
- Decimal phases: `<integer>.<decimal>-<slug>/` (e.g., `02.1-hotfix/`)

**Identifiers:**
- Phase numbers: Integer or decimal (`1`, `2`, `2.1`) — normalized to zero-padded (`01`, `02`, `02.1`) for directory names
- Plan IDs: `<phase>-<plan>` zero-padded (e.g., `01-02`)
- Requirements: `REQ-NN` format in REQUIREMENTS.md and ROADMAP.md

## Where to Add New Code

**New slash command:**
- Primary file: `commands/gsd/<new-command>.md`
- If it needs a workflow: `get-shit-done/workflows/<new-command>.md`
- If it needs a new agent: `agents/gsd-<role>.md`
- Add to MODEL_PROFILES table in: `get-shit-done/bin/lib/core.cjs`
- Reference in: `get-shit-done/references/model-profiles.md`

**New gsd-tools CLI operation:**
- Implementation: Add function to appropriate module in `get-shit-done/bin/lib/`
  - State operations → `state.cjs`
  - Phase operations → `phase.cjs`
  - Roadmap operations → `roadmap.cjs`
  - Bootstrap/init operations → `init.cjs`
  - Standalone utilities → `commands.cjs`
  - Verification → `verify.cjs`
- Dispatch: Register in `get-shit-done/bin/gsd-tools.cjs` dispatcher section
- Tests: Add test cases to corresponding `tests/<module>.test.cjs`
- Docs: Update top-of-file command reference comment in `gsd-tools.cjs`

**New planning document template:**
- Template: `get-shit-done/templates/<name>.md`
- Scaffold command: Add `scaffold <type>` case to `get-shit-done/bin/lib/template.cjs`

**New reference document:**
- File: `get-shit-done/references/<name>.md`
- Usage: Add `@~/.claude/get-shit-done/references/<name>.md` to relevant command `<execution_context>` blocks

## Special Directories

**`hooks/`:**
- Purpose: Claude Code hook scripts (PostToolUse, etc.) — provide status line and update checks
- Generated: `hooks/dist/` is compiled output from esbuild
- Committed: `dist/` is committed (pre-built for npm publish); source `.js` files also committed

**`.github/`:**
- Purpose: CI/CD workflows and issue templates
- Generated: No
- Committed: Yes

**`get-shit-done/` (within the package):**
- Purpose: The framework's runtime assets — copied verbatim to `~/.claude/get-shit-done/` on install
- Generated: No (authored)
- Committed: Yes — this entire directory ships with the npm package

---

*Structure analysis: 2026-02-28*
