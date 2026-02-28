# GSD Repo Concepts Inventory

**Researcher:** Researcher A (GSD Repo Concepts)
**Date:** 2026-02-28
**Source:** `~/.claude/get-shit-done/` (v1.21.1)
**Scope:** All workflows, references, templates, CLI commands

---

## Overview

GSD (Get Shit Done) v2, version **1.21.1**, is a Claude Code workflow framework. It lives at `~/.claude/get-shit-done/` and provides orchestrated planning, execution, and verification workflows for software projects.

**Directory structure:**

```
~/.claude/get-shit-done/
├── VERSION                    # 1.21.1
├── bin/
│   └── gsd-tools.cjs         # Central CLI utility (~2000+ lines)
├── workflows/                 # 37 workflow definition files
├── references/                # 13 reference/pattern files
└── templates/                 # 24+ artifact templates
```

**NOT in this directory:** Agent definitions (`gsd-planner`, `gsd-executor`, etc.) live at `~/.claude/agents/gsd-*.md`, not inside the get-shit-done package.

---

## CLI Commands (`bin/gsd-tools.cjs`)

### Top-Level Commands

| Command | Purpose |
|---------|---------|
| `state <subcommand>` | Read/write STATE.md project state |
| `resolve-model <agent> [profile]` | Resolve model name for agent+profile combination |
| `find-phase <phase>` | Find phase directory, return JSON with plans/summaries |
| `commit <message> --files <...>` | Commit planning artifacts (respects commit_docs config) |
| `verify-summary <phase> <plan>` | Verify SUMMARY.md exists and has required fields |
| `template <name>` | Output template content by name |
| `frontmatter <file> <field>` | Extract YAML frontmatter field from file |
| `verify <type> <path>` | Verify artifact existence and validity |
| `generate-slug <text>` | Generate URL-safe slug from text |
| `current-timestamp` | ISO 8601 timestamp |
| `list-todos` | List pending todos from .planning/todos/pending/ |
| `verify-path-exists <path>` | Check if path exists (boolean output) |
| `config-ensure-section` | Create .planning/config.json with defaults if missing |
| `config-set <key> <value>` | Set config value (dot-path notation) |
| `config-get <key>` | Get config value |
| `history-digest <phase>` | Summarize agent-history.json for a phase |
| `phases` | List all phases from ROADMAP.md |
| `roadmap <subcommand>` | ROADMAP.md operations |
| `requirements <subcommand>` | REQUIREMENTS.md operations |
| `phase <subcommand>` | Phase-level operations |
| `milestone <subcommand>` | Milestone-level operations |
| `validate <type> <path>` | Validate artifact structure |
| `progress` | Project progress summary |
| `todo <subcommand>` | Todo operations |
| `scaffold <type>` | Scaffold artifact structure |
| `init <context> [phase]` | Compound init for workflow contexts |
| `phase-plan-index <phase>` | Wave grouping for parallel execution |
| `state-snapshot` | Compact STATE.md snapshot |
| `summary-extract <phase>` | Extract summary metadata from phase |
| `websearch <query>` | Web search via Brave API (if configured) |

### `state` Subcommands

| Subcommand | Purpose |
|------------|---------|
| `state json` | Read full STATE.md as JSON |
| `state update <field> <value>` | Update specific STATE.md field |
| `state get <field>` | Get specific STATE.md field |
| `state patch <json>` | Patch multiple fields at once |
| `state advance-plan` | Increment current plan counter |
| `state record-metric <name> <value>` | Record performance metric |
| `state update-progress <bar> <pct>` | Update progress bar and percentage |
| `state add-decision <text>` | Append decision to accumulated context |
| `state add-blocker <text>` | Append blocker to accumulated context |
| `state resolve-blocker <id>` | Mark blocker as resolved |
| `state record-session <data>` | Log session continuity data |

### `init` Compound Contexts

| Context | Extracts |
|---------|---------|
| `init execute-phase <phase>` | phase_dir, phase_number, plans, wave_groups, model routing, commit_docs |
| `init plan-phase <phase>` | phase_dir, phase_number, requirements, model routing |
| `init new-project` | needs_codebase_map, model routing, config |
| `init new-milestone` | milestone number, continuation phase, model routing |
| `init quick` | model routing, commit_docs |
| `init resume` | current_phase, last_session, pending_plans |
| `init verify-work <phase>` | phase_dir, has_verification, planner_model, checker_model |
| `init phase-op <phase>` | phase_dir, padded_phase, phase_number, commit_docs |
| `init todos` | pending_todos, todo_list |
| `init milestone-op` | milestone state, archival paths |
| `init map-codebase` | output_dir, model routing |
| `init progress` | current state, roadmap summary |

### Global Flags

| Flag | Purpose |
|------|---------|
| `--cwd <path>` | Override working directory |
| `--raw` | Return plain scalar value instead of JSON |
| `--files <...>` | File list for commit command |
| `--amend` | Amend previous commit instead of creating new |

---

## Workflows

### Core Pipeline Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `new-project.md` | `/gsd:new-project` | Initialize new project: questioning → research → requirements → roadmap | 4 parallel researchers, synthesizer, roadmapper; supports `--auto` flag from PRD; brownfield detection; global defaults from `~/.gsd/defaults.json` |
| `discuss-phase.md` | `/gsd:discuss-phase <N>` | Extract implementation decisions before planning | Creates CONTEXT.md with locked decisions / Claude's discretion / deferred ideas; scope guardrail (HOW not WHAT); `--auto` flag persists auto_advance |
| `research-phase.md` | `/gsd:research-phase <N>` | Standalone phase domain research | Spawns gsd-phase-researcher; outputs RESEARCH.md; returns RESEARCH COMPLETE / CHECKPOINT REACHED / RESEARCH INCONCLUSIVE |
| `plan-phase.md` | `/gsd:plan-phase <N>` | Research → Plan → Verify pipeline | Max 3 revision iterations; Nyquist validation creates VALIDATION.md; supports `--gaps`, `--skip-research`, `--research`, `--prd <file>` flags; spawns researcher + planner + checker |
| `execute-phase.md` | `/gsd:execute-phase <N>` | Wave-based parallel plan execution | Orchestrator keeps 10-15% context; subagents get fresh 200k; handles checkpoints; auto-mode bypasses human-verify/decision; spawns gsd-verifier; handles decimal phases; git branching |
| `verify-work.md` | `/gsd:verify-work [N]` | UAT: conversational testing with persistent state | One test at a time; severity inferred from language; batched writes; UAT.md survives /clear; on issues: spawns diagnose-issues then gap closure |
| `transition.md` | (internal) | Mark phase complete, advance project state | Route A (more phases) or Route B (milestone complete); evolves PROJECT.md; atomic ROADMAP.md + STATE.md updates |

### Phase Management Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `add-phase.md` | `/gsd:add-phase <name>` | Append new integer phase to roadmap end | Adds to ROADMAP.md, creates phase directory |
| `insert-phase.md` | `/gsd:insert-phase <N> <name>` | Insert decimal phase (e.g., 6.1) between integers | Uses `phase next-decimal` CLI; marks as INSERTED; closes parent UAT |
| `remove-phase.md` | `/gsd:remove-phase <N>` | Remove phase and renumber all subsequent | Safety check for in-progress/completed phases; renumbers directories and ROADMAP.md |
| `list-phase-assumptions.md` | `/gsd:list-phase-assumptions <N>` | Show Claude's planned approach before planning | Reads ROADMAP.md + REQUIREMENTS.md; no files created |

### Milestone Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `new-milestone.md` | `/gsd:new-milestone` | Initialize next milestone (brownfield equivalent of new-project) | Continues phase numbering; 4 parallel milestone-aware researchers; persists research choice |
| `complete-milestone.md` | `/gsd:complete-milestone` | Archive milestone and prepare for next | 3-source requirement cross-reference; CLI archival; git tag creation; RETROSPECTIVE.md update; branch merge handling |
| `audit-milestone.md` | `/gsd:audit-milestone` | Cross-reference requirements vs implementation | 3 sources: VERIFICATION frontmatter + SUMMARY frontmatter + REQUIREMENTS traceability; produces MILESTONE-AUDIT.md |
| `plan-milestone-gaps.md` | `/gsd:plan-milestone-gaps` | Create gap-closure phases from MILESTONE-AUDIT.md | Reads MILESTONE-AUDIT.md; creates numbered gap-closure phase entries |

### Quick / Ad-hoc Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `quick.md` | `/gsd:quick <task>` | Ad-hoc tasks with GSD guarantees | Stored in `.planning/quick/`; does NOT update ROADMAP.md; `--full` flag adds plan-checker + verifier; STATE.md "Quick Tasks Completed" table |
| `add-todo.md` | `/gsd:add-todo <idea>` | Capture idea as structured todo | Creates file in `.planning/todos/pending/`; structured YAML format |
| `check-todos.md` | `/gsd:check-todos` | List, select, and route todos | Lists pending todos; routes to action (execute, discuss, defer, delete) |
| `add-tests.md` | `/gsd:add-tests <N>` | Generate unit/E2E tests for completed phase | Classifies files: TDD / E2E / Skip; uses existing test framework |

### Project Utility Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `progress.md` | `/gsd:progress` | Show project progress | Uses `roadmap analyze` + `state-snapshot`; routes A (execute) / B (plan) / C (phase complete) / D (milestone done) / E (UAT gaps) / F (between milestones) |
| `resume-project.md` | `/gsd:resume` | Restore project context | Detects interrupted agents, .continue-here files, incomplete plans; STATE.md reconstruction if missing |
| `map-codebase.md` | `/gsd:map-codebase` | Generate codebase documentation | 4 parallel gsd-codebase-mapper agents (tech, arch, quality, concerns); produces 7 docs in `.planning/codebase/`; security scan before commit |
| `health.md` | `/gsd:health` | Validate .planning/ integrity | Checks artifact presence, frontmatter validity; `--repair` flag attempts fixes |
| `cleanup.md` | `/gsd:cleanup` | Archive phase dirs to milestones | Archives to `.planning/milestones/vX.Y-phases/` |
| `pause-work.md` | `/gsd:pause` | Create handoff file | Creates `.continue-here.md` with current state |
| `discovery-phase.md` | (internal, from plan-phase) | Domain research at 3 depth levels | L1: Quick Verify (2-5min, no file); L2: Standard (15-30min, DISCOVERY.md); L3: Deep Dive (1hr+, DISCOVERY.md) |

### Execution Support Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `execute-plan.md` | (spawned by execute-phase) | Individual plan execution | Pattern A (autonomous/subagent), B (segmented/checkpoints), C (main context); 4 deviation rules; TDD cycle; atomic commits; creates SUMMARY.md |
| `diagnose-issues.md` | (spawned by verify-work) | Root-cause diagnosis of UAT gaps | Spawns parallel debug agents per gap; updates UAT.md with root causes |

### Configuration / Management Workflows

| Workflow | Command | Purpose | Key Behaviors |
|---------|---------|---------|---------------|
| `settings.md` | `/gsd:settings` | Interactive 7-setting config | Model, research, plan_check, verifier, auto_advance, nyquist, branching; option to save as `~/.gsd/defaults.json` |
| `set-profile.md` | `/gsd:set-profile <profile>` | Quick model profile switch | Validates quality/balanced/budget; updates config.json; shows model table |
| `update.md` | `/gsd:update` | Check npm for updates | Version compare; changelog preview; user confirmation; clean install; cache clear |
| `help.md` | `/gsd:help` | Complete command reference | Inline output, no files created |

---

## References

| File | Purpose | Key Contents |
|------|---------|--------------|
| `model-profiles.md` | Full model routing table | quality/balanced/budget per agent; opus agents return `"inherit"` not `"opus"` to avoid org policy conflicts; planner=opus in quality+balanced; executor=sonnet in balanced |
| `model-profile-resolution.md` | How to resolve model at runtime | grep config.json pattern; default="balanced"; references model-profiles.md table |
| `checkpoints.md` | Checkpoint types and automation rules | 3 types: human-verify (90%), decision (9%), human-action (1%); auto-mode bypass rules; CLI automation reference table; anti-patterns (never ask user to run CLI/start server) |
| `planning-config.md` | .planning/config.json schema | commit_docs, search_gitignored, git branching strategy; phase/milestone branch templates; merge strategies |
| `tdd.md` | TDD plan execution pattern | RED-GREEN-REFACTOR cycle; ~40% context per TDD plan; one feature per plan rule; 2-3 atomic commits per TDD plan; framework detection |
| `questioning.md` | Questioning philosophy and AskUserQuestion design | Thinking partner not interviewer; context checklist (what/why/who/done); max 12-char headers, 2-4 options |
| `git-integration.md` | Git commit patterns | Per-task commits (not per-plan); commit types: feat/fix/test/refactor/perf/chore/docs/wip; format: `{type}({phase}-{plan}): {desc}`; planning docs committed only on plan completion |
| `continuation-format.md` | Standard "Next Up" block format | Always show identifier+name+description; command in backticks; always include /clear explanation; "Also available" (not "Other options"); `---` separators |
| `decimal-phase-calculation.md` | Decimal phase insertion math | `phase next-decimal <N>` CLI command; handles gaps in sequence; directory naming pattern |
| `git-planning-commit.md` | Committing planning artifacts | Always use `gsd-tools.cjs commit`; handles commit_docs + gitignore automatically; commit message patterns per command |
| `phase-argument-parsing.md` | Phase number normalization | `find-phase` CLI handles validation; zero-pad to 2 digits; preserve decimal suffixes; `roadmap get-phase` for validation |
| `ui-brand.md` | Visual output patterns | Stage banners (`GSD ► STAGE`); checkpoint boxes (62-char width); status symbols (✓✗◆○⚡⚠); progress bars; spawning indicators; Next Up block; error boxes; anti-patterns |
| `verification-patterns.md` | How to verify real vs stub implementations | 4 levels: exists/substantive/wired/functional; stub detection patterns; per-type checklists (React, API routes, schemas, hooks, env); wiring verification patterns; automated verification script pattern |

---

## Templates

### Core Artifact Templates

| Template | Output Artifact | Purpose |
|---------|----------------|---------|
| `state.md` | `.planning/STATE.md` | Living project memory; <100 lines; read first in every workflow; sections: Project Reference, Current Position, Performance Metrics, Accumulated Context, Session Continuity |
| `roadmap.md` | `.planning/ROADMAP.md` | Phase/plan hierarchy; integer + decimal phases; phase details with success criteria; progress table; milestone-grouped variant for post-v1.0 |
| `requirements.md` | `.planning/REQUIREMENTS.md` | REQ-ID requirement tracking; traceability links; completion status |
| `project.md` | `.planning/PROJECT.md` | Living project context; decisions log; constraints; architecture overview |
| `retrospective.md` | `.planning/RETROSPECTIVE.md` | Lessons learned; updated after each milestone |
| `summary.md` | `{phase}-{plan}-SUMMARY.md` | Plan completion documentation; YAML frontmatter with dependency graph (requires/provides/affects); accomplishments; commits; deviations; next phase readiness |
| `summary-minimal.md` | `{phase}-{plan}-SUMMARY.md` | Minimal variant for simple plans |
| `summary-standard.md` | `{phase}-{plan}-SUMMARY.md` | Standard variant (most common) |
| `summary-complex.md` | `{phase}-{plan}-SUMMARY.md` | Complex variant with full deviation tracking |
| `context.md` | `{phase_num}-CONTEXT.md` | Phase implementation decisions from discuss-phase; locked decisions / Claude's discretion / deferred ideas |
| `research.md` | `{phase_num}-RESEARCH.md` | Ecosystem research before planning; standard stack, patterns, pitfalls, code examples, confidence levels |
| `VALIDATION.md` | `{phase_num}-VALIDATION.md` | Nyquist validation: test framework, requirement→test map, sampling rates, Wave 0 gaps |
| `UAT.md` | `{phase_num}-UAT.md` | UAT session tracking; test list; pass/issue/skip results; YAML-structured gaps for gap closure |
| `verification-report.md` | `{phase_num}-VERIFICATION.md` | Post-execution verification results; must-haves checklist |
| `user-setup.md` | `{phase}-USER-SETUP.md` | Human-required config (env vars, external dashboards); emitted when executor can't automate setup |

### Execution / Planning Templates

| Template | Purpose |
|---------|---------|
| `phase-prompt.md` | Phase planning prompt structure passed to gsd-planner |
| `planner-subagent-prompt.md` | Template for spawning gsd-planner with phase context |
| `debug-subagent-prompt.md` | Template for spawning gsd-debugger with problem context |
| `DEBUG.md` | Active debug session tracking in `.planning/debug/[slug].md` |
| `continue-here.md` | Handoff file template for `.continue-here.md` (pause-work output) |
| `discovery.md` | DISCOVERY.md template for L2/L3 discovery-phase output |
| `config.json` | Default `.planning/config.json` (all workflow settings with defaults) |

### Milestone Templates

| Template | Purpose |
|---------|---------|
| `milestone.md` | Entry added to `.planning/MILESTONES.md` on milestone completion |
| `milestone-archive.md` | Archive file created in `.planning/milestones/` |

### Codebase Templates (`templates/codebase/`)

| Template | Output in `.planning/codebase/` |
|---------|--------------------------------|
| `stack.md` | Technology stack inventory |
| `architecture.md` | System architecture overview |
| `structure.md` | Project structure documentation |
| `conventions.md` | Code patterns and conventions |
| `integrations.md` | External service integrations |
| `testing.md` | Test strategy and coverage |
| `concerns.md` | Technical debt and security concerns |

### Research Project Templates (`templates/research-project/`)

| Template | Purpose |
|---------|---------|
| `STACK.md` | Stack research output (spawned by new-project researcher) |
| `FEATURES.md` | Features research output |
| `ARCHITECTURE.md` | Architecture research output |
| `PITFALLS.md` | Pitfalls research output |
| `SUMMARY.md` | Research synthesis output (spawned by gsd-research-synthesizer) |

---

## Key Concepts and Patterns

### Wave-Based Parallel Execution

Plans within a phase are grouped into waves by dependency. Plans in the same wave execute in parallel (separate subagents, fresh 200k context each). Plans in different waves execute sequentially.

```
Wave 1: [01-01, 01-02]  → parallel
Wave 2: [01-03]          → sequential (depends on wave 1)
```

The orchestrator (execute-phase) keeps 10-15% of its context for coordination; all real work happens in subagents.

### Model Profile System

Three profiles (quality / balanced / budget) route different agents to different models:

| Agent | Quality | Balanced | Budget |
|-------|---------|---------|--------|
| gsd-planner | inherit (opus) | inherit (opus) | sonnet |
| gsd-executor | sonnet | sonnet | sonnet |
| gsd-verifier | sonnet | haiku | haiku |
| gsd-phase-researcher | sonnet | sonnet | haiku |
| gsd-codebase-mapper | haiku | haiku | haiku |

Opus agents return `"inherit"` (not `"opus"`) to avoid org policy conflicts. Resolved at runtime via config.json grep.

### Checkpoint Types

| Type | Frequency | Auto-mode behavior | Use case |
|------|----------|-------------------|---------|
| `human-verify` | ~90% | Auto-approve | "Does this look right?" |
| `decision` | ~9% | Auto-select first option | "Choose A or B" |
| `human-action` | ~1% | Still stops | "Please configure X in dashboard" |

### Plan Deviation Rules

Execute-plan agents can deviate from plans under 4 rules:

| Rule | Category | Condition | Action |
|------|---------|----------|--------|
| 1 | Bug auto-fix | Bug found in existing code | Fix and continue |
| 2 | Missing Critical | Critical piece not in plan | Add it, document |
| 3 | Blocking | Can't proceed without fix | Fix, document |
| 4 | Architectural | Fundamental approach problem | STOP, ask user |

### Artifact Hierarchy

```
.planning/
├── PROJECT.md          # Decisions, constraints, architecture (read every session)
├── STATE.md            # Current position + accumulated context (<100 lines)
├── ROADMAP.md          # Phase/plan hierarchy with success criteria
├── REQUIREMENTS.md     # REQ-ID requirements with traceability
├── MILESTONES.md       # Milestone completion log
├── RETROSPECTIVE.md    # Lessons learned
├── todos/pending/      # Ideas captured via /gsd:add-todo
├── quick/              # Ad-hoc task artifacts
├── debug/              # Debug session tracking
├── codebase/           # 7 codebase map docs
└── phases/
    └── XX-name/
        ├── {N}-CONTEXT.md      # Phase decisions (discuss-phase output)
        ├── {N}-RESEARCH.md     # Domain research (plan-phase input)
        ├── {N}-VALIDATION.md   # Test coverage plan (nyquist)
        ├── {N}-NN-PLAN.md      # Individual plan files
        ├── {N}-NN-SUMMARY.md   # Plan completion docs
        ├── {N}-VERIFICATION.md # Post-execution verification
        ├── {N}-UAT.md          # User acceptance testing
        └── {N}-USER-SETUP.md   # Human config instructions
```

### TDD Plan Pattern

For plans of type `tdd`:
1. **RED:** Write failing tests first, commit (`test: RED`)
2. **GREEN:** Minimal implementation to pass tests, commit (`feat: GREEN`)
3. **REFACTOR:** Clean up while keeping tests green, commit (`refactor: clean up`)

Context budget: ~40% per TDD plan. One feature per TDD plan (never multi-feature).

### Summary Frontmatter Dependency Graph

SUMMARY.md files use YAML frontmatter with dependency graph fields:

```yaml
requires:
  - phase: 01-foundation
    provides: JWT auth middleware
provides:
  - User profile endpoints
affects: [payments, notifications]
```

This enables `plan-phase` to automatically select relevant prior context by traversing the dependency graph — cheap to scan (~25 lines of frontmatter vs full file).

### Config.json Settings

Default values and all recognized settings:

```json
{
  "mode": "interactive",           // yolo | interactive
  "depth": "standard",             // quick | standard | comprehensive
  "model_profile": "balanced",     // quality | balanced | budget
  "workflow": {
    "research": true,              // spawn researcher during plan-phase
    "plan_check": true,            // spawn plan checker during plan-phase
    "verifier": true,              // spawn verifier during execute-phase
    "auto_advance": false,         // chain stages via Task()
    "nyquist_validation": false    // research test coverage during planning
  },
  "planning": {
    "commit_docs": true,           // commit .planning/ artifacts to git
    "search_gitignored": false
  },
  "parallelization": {
    "enabled": true,
    "plan_level": true,
    "task_level": false,
    "skip_checkpoints": true,
    "max_concurrent_agents": 3,
    "min_plans_for_parallel": 2
  },
  "gates": {
    "confirm_project": true,
    "confirm_phases": true,
    "confirm_roadmap": true,
    "confirm_breakdown": true,
    "confirm_plan": true,
    "execute_next_plan": true,
    "issues_review": true,
    "confirm_transition": true
  },
  "safety": {
    "always_confirm_destructive": true,
    "always_confirm_external_services": true
  },
  "git": {
    "branching_strategy": "none"   // none | phase | milestone
  }
}
```

---

## Agents Referenced (Not Stored Here)

These agents are referenced by workflows but live at `~/.claude/agents/gsd-*.md`:

| Agent | Spawned By | Role |
|-------|-----------|------|
| `gsd-planner` | plan-phase, verify-work (gap closure) | Creates PLAN.md files from requirements + research |
| `gsd-plan-checker` | plan-phase, verify-work | Verifies plans meet phase goals (max 3 revision iterations) |
| `gsd-phase-researcher` | plan-phase, research-phase | Domain research → RESEARCH.md |
| `gsd-executor` (gsd-plan-executor) | execute-phase | Executes individual plans (via execute-plan workflow) |
| `gsd-verifier` | execute-phase | Post-execution verification → VERIFICATION.md |
| `gsd-project-researcher` | new-project | 4 parallel: Stack / Features / Architecture / Pitfalls |
| `gsd-research-synthesizer` | new-project | Synthesizes 4 research docs → SUMMARY.md |
| `gsd-roadmapper` | new-project | Creates ROADMAP.md from requirements + research |
| `gsd-codebase-mapper` | map-codebase | 4 parallel: tech / arch / quality / concerns |
| `gsd-debugger` | diagnose-issues | Per-UAT-gap root cause diagnosis |

---

## Key Anti-Patterns Documented in GSD

From the references, these are explicitly called out as wrong:

| Anti-pattern | Why Wrong | Correct Pattern |
|-------------|----------|-----------------|
| Ask user to start dev server | Violates automation-first | Claude starts server before checkpoint |
| Ask user to run CLI commands | Violates automation-first | Claude runs CLI; user visits URLs only |
| Varying checkpoint box widths | UI inconsistency | Always 62-char width |
| Mixing banner styles | UI inconsistency | Always `━━━ GSD ► STAGE ━━━` |
| Random emoji (🚀✨) | Off-brand | Only documented symbols: ✓✗◆○⚡⚠🎉 |
| Fenced code blocks for commands | Nesting ambiguity in templates | Inline backticks only |
| "Other options" language | Sounds like afterthought | "Also available:" |
| Missing /clear explanation | Users skip /clear | Always include `<sub>/clear first → fresh context</sub>` |
| Definitive negative claims without official verification | Research trap | Check current docs; distinguish "didn't find" from "doesn't exist" |
| Committing planning docs mid-plan | Premature | Commit SUMMARY+STATE+ROADMAP only on plan completion |

---

*Exhaustive inventory of `~/.claude/get-shit-done/` v1.21.1. Agent definitions excluded (live at `~/.claude/agents/gsd-*.md`).*
