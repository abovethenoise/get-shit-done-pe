# Research C: Project File Inventory

**Researcher:** C — Project File Inventory
**Date:** 2026-02-28
**Scope:** All files affecting the planning/development system; cross-reference mapping; orphan and conflict detection

---

## 1. The Two-Version Reality

The project exists in two states simultaneously:

```
PROJECT ROOT (v2 / in-development)          INSTALLED (v1 / deployed to user)
/Users/philliphall/get-shit-done-pe/        ~/.claude/
  agents/                23 agents            agents/         11 agents + 1 alien
  commands/gsd/          39 commands          commands/gsd/   31 commands
  get-shit-done/
    bin/gsd-tools.cjs    655 lines            get-shit-done/
    bin/lib/             15 .cjs files          bin/gsd-tools.cjs  588 lines
    workflows/           44 workflows           bin/lib/       12 .cjs files
    templates/           28 files               workflows/     29 workflows
    references/          15 files               templates/     26 files
    framings/            4 dirs                 references/    13 files
                                              VERSION:         1.21.1
  VERSION (in pkg.json): 1.22.0
```

**Key fact:** The installed version (1.21.1) is what actually runs when users invoke `/gsd:` commands. The project root contains the development version (1.22.0) that has not yet been published. Every new file in the project root is "in-development" and does NOT exist in the user's environment.

---

## 2. Full .planning/ Directory Tree

```
.planning/
├── config.json                          # mode=interactive, depth=standard, parallelization=true, commit_docs=true, model_profile=quality
├── PROJECT.md                           # Project goals and constraints
├── REQUIREMENTS.md                      # Top-level requirements
├── ROADMAP.md                           # Phase structure
├── STATE.md                             # Current execution state
├── codebase/                            # Codebase documentation (7 files)
│   ├── ARCHITECTURE.md
│   ├── CONCERNS.md
│   ├── CONVENTIONS.md
│   ├── INTEGRATIONS.md
│   ├── STACK.md
│   ├── STRUCTURE.md
│   └── TESTING.md
├── research/                            # Pre-phase project research (5 files)
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── PITFALLS.md
│   ├── STACK.md
│   └── SUMMARY.md
└── phases/
    ├── 01-foundation/                   # COMPLETE: 104K
    │   ├── 01-CONTEXT.md, 01-RESEARCH.md, 01-VERIFICATION.md
    │   └── 01-01-PLAN.md, 01-01-SUMMARY.md, ... (3 wave pairs)
    ├── 02-agent-framework/              # COMPLETE: 268K
    │   ├── 02-CONTEXT.md, 02-RESEARCH.md, 02-VERIFICATION.md
    │   ├── 02-01 through 02-03 PLAN+SUMMARY pairs
    │   └── research/                   # 6 sub-research files
    ├── 03-planning-pipeline/            # PARTIAL: 84K (no VERIFICATION)
    │   ├── 03-CONTEXT.md, 03-RESEARCH.md, 03-VERIFICATION.md
    │   └── 03-01, 03-02 PLAN+SUMMARY pairs
    ├── 04-review-layer/                 # COMPLETE: 200K
    │   ├── 04-CONTEXT.md, 04-RESEARCH.md, 04-VERIFICATION.md
    │   ├── 04-01 through 04-03 PLAN+SUMMARY pairs
    │   └── research/                   # 6 sub-research files
    ├── 05-documentation/                # COMPLETE: 212K
    │   ├── 05-CONTEXT.md, 05-RESEARCH.md, 05-VERIFICATION.md
    │   ├── 05-01 through 05-03 PLAN+SUMMARY pairs
    │   └── research/                   # 6 sub-research files
    ├── 06-workflows-and-commands/       # COMPLETE: 300K
    │   ├── 06-CONTEXT.md, 06-RESEARCH.md (no VERIFICATION)
    │   ├── 06-01 through 06-05 PLAN+SUMMARY pairs
    │   └── research/                   # 6 sub-research files
    └── 07-cleanup/                      # IN PROGRESS: 8K
        └── 07-CONTEXT.md
```

---

## 3. Agent Definitions

### 3a. ~/.claude/agents/ (Installed — what users actually run)

| File | Size | Referenced By | Status |
|------|------|---------------|--------|
| gsd-codebase-mapper.md | 16K | map-codebase.md workflow | Active |
| gsd-debugger.md | 40K | debug.md command (directly, no workflow) | Active |
| gsd-executor.md | 20K | execute-phase.md, execute-plan.md, quick.md | Active |
| gsd-integration-checker.md | 16K | audit-milestone.md | Active |
| gsd-phase-researcher.md | 20K | research-phase.md, plan-phase.md | Active |
| gsd-plan-checker.md | 24K | plan-phase.md, quick.md, verify-work.md | Active |
| gsd-planner.md | **44K** | plan-phase.md, quick.md, verify-work.md | Active (DIVERGED from project — 44K vs 28K) |
| gsd-project-researcher.md | 16K | new-milestone.md | Active |
| gsd-research-synthesizer.md | 8K | new-milestone.md, new-project.md | Active |
| gsd-roadmapper.md | 20K | new-milestone.md, new-project.md | Active |
| gsd-verifier.md | 20K | execute-phase.md, quick.md | Active |
| **primary-collaborator.md** | 16K | **Nobody — not in any workflow** | **ALIEN: project-specific user agent, not GSD** |

### 3b. project/agents/ (In-Development — NOT yet installed)

**Shared with installed (11 files, but sizes differ for gsd-planner.md):**
All 11 GSD agents above exist in project root, most matching installed sizes.
Exception: `gsd-planner.md` is 28K in project vs 44K installed — the installed version contains MORE content.

**Project-only agents (12 files — v2 additions, not yet installed):**

| File | Size | Referenced By (in project workflows) | Status |
|------|------|---------------------------------------|--------|
| gsd-doc-writer.md | 8K | doc-phase.md workflow (project-only) | New — not deployed |
| gsd-research-domain.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-research-edges.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-research-intent.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-research-prior-art.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-research-synthesizer.md | 8K | **Nothing currently** | New — orphan candidate |
| gsd-research-system.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-research-tech.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-review-enduser.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-review-functional.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-review-quality.md | 4K | **Nothing currently** | New — orphan candidate |
| gsd-review-synthesizer.md | 8K | **Nothing currently** | New — orphan candidate |
| gsd-review-technical.md | 4K | **Nothing currently** | New — orphan candidate |

**Note:** The 12 project-only research/review agents are intended for the gather-synthesize pattern used by `review-phase.md` and the research pipeline. They appear orphaned because the gather-synthesize workflow passes agent paths dynamically (via `gsd-tools init`), not by hardcoded `"agent-name"` references. They ARE referenced — just indirectly through the init system.

---

## 4. Commands (Slash Commands)

### 4a. Installed ~/.claude/commands/gsd/ — 31 files

All 31 installed commands have corresponding workflows in `~/.claude/get-shit-done/workflows/` with the same name. These are the stable v1 commands.

### 4b. Project commands/gsd/ — 39 files

**Commands in project that are NOT in installed (8 new v2 commands):**

| Command | Workflow It Calls | Workflow Exists Installed? | Status |
|---------|------------------|---------------------------|--------|
| discuss-capability.md | workflows/discuss-capability.md | NO | New — not deployed |
| discuss-feature.md | workflows/discuss-feature.md | NO | New — not deployed |
| doc-phase.md | workflows/doc-phase.md | NO | New — not deployed |
| enhance.md | workflows/framing-discovery.md | NO | New — not deployed |
| init.md | workflows/init-project.md | NO | New — not deployed |
| new.md | workflows/framing-discovery.md | NO | New — not deployed |
| refactor.md | workflows/framing-discovery.md | NO | New — not deployed |
| review-phase.md | workflows/review-phase.md | NO | New — not deployed |

**Commands with quirks:**
- `new-project.md.bak` — backup file in both project and installed; stale artifact
- `research-phase.md` — exists in project (189 lines) but has NO matching workflow file; the command itself IS the workflow (self-contained)

### 4c. Installed commands with no project counterpart

None — all 31 installed commands have project counterparts.

### 4d. Installed commands without matching workflow (orphaned routing)

| Command | Situation |
|---------|-----------|
| debug.md | No `debug.md` workflow — the installed debug.md likely directly invokes `gsd-debugger` |
| join-discord.md | No workflow — standalone utility |
| reapply-patches.md | No workflow — standalone utility |
| resume-work.md | Routes to `resume-project.md` workflow (name mismatch — command is resume-work, workflow is resume-project) |

---

## 5. Workflows

### 5a. Installed ~/.claude/get-shit-done/workflows/ — 29 files

### 5b. Project get-shit-done/workflows/ — 44 files

**Workflows in project but NOT installed (15 new v2 workflows):**

| Workflow | Called By | Purpose |
|----------|-----------|---------|
| discuss-capability.md | discuss-capability command | Capability discussion |
| discuss-feature.md | discuss-feature command | Feature discussion |
| doc-phase.md | doc-phase command | Documentation pipeline |
| framing-discovery.md | enhance/new/debug/refactor commands | Lens-aware discovery |
| framing-pipeline.md | framing-discovery.md | 6-stage post-discovery pipeline |
| gather-synthesize.md | review-phase, init-project, framing-pipeline | Parallel agent pattern |
| init-project.md | init command | Project initialization v2 |
| review-phase.md | review-phase command | Code review pipeline |

**Workflows installed but NOT in project:**

None — all installed workflows exist in project. The project is a strict superset.

**Workflows installed without matching slash command (6 workflow-only files):**

| Workflow | How It's Reached |
|----------|------------------|
| diagnose-issues.md | Called by transition.md workflow internally |
| discovery-phase.md | Legacy — may be superseded by framing-discovery |
| execute-plan.md | Called by execute-phase.md workflow internally |
| resume-project.md | Called by `resume-work.md` command (name mismatch) |
| transition.md | No command — internal use |
| verify-phase.md | No command — called by verify-work.md internally |

---

## 6. CLI (gsd-tools.cjs)

### Version comparison

| Location | Version | Lines | Status |
|----------|---------|-------|--------|
| `~/.claude/get-shit-done/bin/gsd-tools.cjs` | 1.21.1 | 588 | Installed (deployed) |
| `project/get-shit-done/bin/gsd-tools.cjs` | 1.22.0 | 655 | Development |

### New commands in project v2 (not in installed v1)

| New CLI Command | Purpose | Used By |
|-----------------|---------|---------|
| `capability-create` | Create capability | `init` workflow |
| `capability-list` | List capabilities | `init` workflow |
| `capability-status` | Check capability state | capability commands |
| `discuss-capability` | Capability discussion init | discuss-capability workflow |
| `discuss-feature` | Feature discussion init | discuss-feature workflow |
| `doc-phase` | Doc pipeline init | doc-phase workflow |
| `feature-create` | Create feature within capability | feature commands |
| `feature-list` | List features | feature commands |
| `feature-status` | Feature state | feature commands |
| `framing-discovery` | Framing/lens discovery init | framing-discovery workflow |
| `plan-validate` | Validate plan REQ traceability | plan-phase workflow (new behavior) |
| `project` | Project-level operations | init workflow |
| `review-phase` | Review pipeline init | review-phase workflow |

### New lib/*.cjs files in project (not in installed)

| File | Purpose | Used By |
|------|---------|---------|
| `capability.cjs` | Capability lifecycle (create/list/status) | capability-create/list/status commands |
| `feature.cjs` | Feature lifecycle | feature-create/list/status commands |
| `plan-validate.cjs` | Deterministic REQ traceability validation | plan-validate command |

### gsd-tools commands by usage frequency (workflows + agents combined)

| Command | Times Referenced | Primary Users |
|---------|-----------------|---------------|
| `commit` | 33 | Almost every workflow (post-step commits) |
| `init` | 25 | Every major workflow (context assembly) |
| `state` | 8 | State reading/writing workflows |
| `roadmap` | 14 | Navigation, phase lookup |
| `verify` | 8 | Verifier agent, verify-work workflow |
| `phase` | 6 | Phase-specific operations |
| `config-set` | 5 | Settings, profile configuration |
| `config-get` | 4 | Settings reads |
| `summary-extract` | 4 | Summary extraction after tasks |
| `phases` | 3 | Phase listing |
| `validate` | 2 | Plan validation |
| `state-snapshot` | 2 | Pause/resume |
| `progress` | 2 | Progress reporting |
| `find-phase` | 2 | Phase lookup |
| `resolve-model` | 3 | Model profile resolution |
| `websearch` | 2 | Research agent (Brave API) |
| `frontmatter` | 3 | YAML frontmatter ops |
| `history-digest` | 1 | Context compression |

---

## 7. References and Templates

### New reference files in project (not in installed)

| File | Purpose | Referenced By |
|------|---------|---------------|
| `references/escalation-protocol.md` | Escalation rules for stuck agents | framing-pipeline.md |
| `references/framing-lenses.md` | Lens behavioral spec (debug/new/enhance/refactor) | framing-pipeline.md, framing-discovery.md |

### New template files in project (not in installed)

| File | Purpose | Used By |
|------|---------|---------|
| `templates/capability.md` | Capability document template | capability-create command |
| `templates/discovery-brief.md` | Discovery brief template | framing-discovery workflow |
| `templates/docs.md` | Documentation template | doc-phase workflow |
| `templates/feature.md` | Feature document template | feature-create command |
| `templates/review.md` | Review output template | review-phase workflow |

### New framing structure in project (not in installed at all)

```
get-shit-done/framings/
├── debug/
│   ├── .gitkeep
│   └── anchor-questions.md       # Debug-specific discovery questions
├── enhance/
│   ├── .gitkeep
│   └── anchor-questions.md       # Enhancement-specific questions
├── new/
│   ├── .gitkeep
│   └── anchor-questions.md       # New capability questions
└── refactor/
    ├── .gitkeep
    └── anchor-questions.md       # Refactor-specific questions
```

---

## 8. Cross-Reference Map

### Command → Workflow → Agent chain (installed v1)

```
/gsd:command          → workflow              → agents
─────────────────────────────────────────────────────────────────
execute-phase         → execute-phase.md      → gsd-executor, gsd-verifier
plan-phase            → plan-phase.md         → gsd-plan-checker (+ gsd-phase-researcher via research-phase)
research-phase        → (self-contained)      → gsd-phase-researcher
verify-work           → verify-work.md        → gsd-planner, gsd-plan-checker
quick                 → quick.md              → gsd-planner, gsd-plan-checker, gsd-executor, gsd-verifier
map-codebase          → map-codebase.md       → gsd-codebase-mapper (x5)
new-project           → new-project.md        → gsd-research-synthesizer, gsd-roadmapper
new-milestone         → new-milestone.md      → gsd-project-researcher, gsd-research-synthesizer, gsd-roadmapper
audit-milestone       → audit-milestone.md    → gsd-integration-checker
discuss-phase         → discuss-phase.md      → (no agents — interactive Q&A only)
debug                 → (self-contained)      → gsd-debugger
```

### Command → Workflow → Agent chain (project v2, new additions)

```
/gsd:command          → workflow(s)                        → agents (dynamic via init)
────────────────────────────────────────────────────────────────────────────────────────
review-phase          → review-phase.md                   → gsd-review-{functional,technical,
                          → gather-synthesize.md              enduser,quality} + gsd-review-synthesizer
doc-phase             → doc-phase.md                      → gsd-doc-writer
init                  → init-project.md                   → (via gather-synthesize pattern)
                          → gather-synthesize.md
new/debug/enhance/    → framing-discovery.md              → (no agents, interactive)
refactor                 → framing-pipeline.md
                            → research-phase.md + plan-phase.md
                            + execute-phase.md + review-phase.md + doc-phase.md
discuss-capability    → discuss-capability.md             → (no agents, interactive Q&A)
discuss-feature       → discuss-feature.md                → (no agents, interactive Q&A)
```

### Workflow → Workflow internal calls

```
execute-phase.md     → calls execute-plan.md (internally)
verify-work.md       → calls verify-phase.md (internally)
transition.md        → calls diagnose-issues.md (internally)
transition.md        → calls update.md (internally)
framing-discovery.md → calls framing-pipeline.md (after brief)
framing-pipeline.md  → calls research-phase, plan-phase, execute-phase, review-phase, doc-phase
```

---

## 9. Orphan Candidates

Files with no confirmed inbound references:

### Definite orphans

| File | Location | Reason |
|------|----------|--------|
| `primary-collaborator.md` | ~/.claude/agents/ | Project-specific user agent for poker app. Not part of GSD. Not referenced by any GSD workflow. |
| `new-project.md.bak` | commands/gsd/ (both) | Backup artifact from editing. |
| `discovery-phase.md` | workflows/ (both) | No slash command, not called by other workflows. May be superseded by framing-discovery.md. |

### Probable orphans (pending gather-synthesize usage verification)

The following 12 project-only agents appear unreferenced because `gather-synthesize.md` passes agent paths dynamically via the `gsd-tools init` command (not via hardcoded `"agent-name"` strings). They ARE the intended gatherer/synthesizer implementations for the review and research pipelines. Whether they are wired up correctly in `gsd-tools.cjs` needs verification:

- `gsd-research-domain.md`, `gsd-research-edges.md`, `gsd-research-intent.md`
- `gsd-research-prior-art.md`, `gsd-research-system.md`, `gsd-research-tech.md`
- `gsd-review-enduser.md`, `gsd-review-functional.md`, `gsd-review-quality.md`
- `gsd-review-synthesizer.md`, `gsd-review-technical.md`
- `gsd-research-synthesizer.md` (project version — separate from installed version)

---

## 10. Conflict Candidates (Duplicate Concepts)

### v1 vs v2 divergences

| Concept | v1 (Installed) | v2 (Project) | Divergence |
|---------|---------------|--------------|------------|
| **Planner agent** | gsd-planner.md (44K, 1275 lines) | gsd-planner.md (28K, 867 lines) | Installed is LARGER — has accumulated patches. Project version has v2 schema (REQ traceability, self-critique). These are meaningfully different. |
| **Project init** | new-project.md workflow | init-project.md workflow + init.md command | Two separate project initialization paths coexist |
| **Research pipeline** | Single gsd-phase-researcher agent | 6-gatherer + synthesizer pattern via gather-synthesize | v2 is a complete redesign of research |
| **Code review** | No dedicated review workflow | review-phase.md + 4 reviewer agents | v2 adds review layer entirely |
| **Discovery** | discuss-phase.md (single interactive) | framing-discovery.md (lens-aware) | v2 adds lens taxonomy on top |
| **Resume** | resume-work.md command → resume-project.md workflow | Same | Name mismatch between command and workflow |

### Path reference conflicts

All new v2 commands and workflows hardcode `~/.claude/get-shit-done/...` paths. Since these files don't exist in `~/.claude/get-shit-done/` yet (they're project-only), any user running these commands from the installed version would hit broken `@` references. They only work correctly if the user has the project locally AND the workflow files have been deployed. This is the critical deploy gap.

---

## 11. Configuration Files

| File | Location | Purpose | Contents |
|------|----------|---------|---------|
| `.planning/config.json` | Project root | GSD project config | mode=interactive, depth=standard, parallelization=true, commit_docs=true, model_profile=quality |
| `.claude/settings.local.json` | Project root | Claude Code project permissions | Allows npm info/pack/rm |
| `~/.claude/settings.json` | Global | Global Claude Code permissions | Extensive allow list (Read, Glob, Grep, Bash subsets, git read, gh read) |
| `~/.claude/gsd-file-manifest.json` | Global | GSD update integrity hashes | SHA256 of every installed file at version 1.21.1 |
| `~/.claude/gsd-local-patches/` | Global | Backup of pre-update gsd-tools.cjs | Backed up 2026-02-25 from v1.20.5 |
| `package.json` | Project root | npm package definition | Declares `files: [bin, commands, get-shit-done, agents, hooks/dist, scripts]` |

### What package.json includes in published package

```
files:
  bin/          → install.js only
  commands/     → all slash commands (including new v2 ones)
  get-shit-done/ → bin/, workflows/, templates/, references/, framings/
  agents/       → all agent definitions (including new v2 ones)
  hooks/dist/   → compiled hook files (not source)
  scripts/      → run-tests.cjs, build-hooks.js
```

**Not included in package:** `.planning/`, `.documentation/`, `tests/`, `docs/`, `assets/`, hooks source.

---

## 12. Other Notable Structures

### .documentation/ (project-specific output directory)

```
.documentation/
└── gate/
    ├── constraints.md    # Engineering constraints (no-implicit-state, no-unnecessary-deps, etc.)
    ├── glossary.md       # Term definitions
    └── state.md          # State documentation template
```

This is the output directory for `doc-phase`. The gate/ subdirectory is a template structure for gate-doc artifacts. Currently contains placeholder/template files.

### hooks/ (deployed to users via hooks/dist/)

```
hooks/
├── gsd-check-update.js      # SessionStart hook — checks for GSD updates
├── gsd-context-monitor.js   # PostToolUse hook — injects context warnings
└── gsd-statusline.js        # StatusBar hook — shows context usage
```

These hooks are compiled by `scripts/build-hooks.js` into `hooks/dist/` before publish. The installed versions are in `~/.claude/hooks/` (not examined here — out of scope).

### tests/ (project dev only — not installed)

```
tests/
├── capability.test.cjs      # Tests for capability.cjs (new v2)
├── codex-config.test.cjs
├── commands.test.cjs        # Tests for gsd-tools commands
├── config.test.cjs
├── core.test.cjs
├── dispatcher.test.cjs
├── feature.test.cjs         # Tests for feature.cjs (new v2)
├── frontmatter.test.cjs
├── frontmatter-cli.test.cjs
├── helpers.cjs
├── init.test.cjs
├── milestone.test.cjs
├── phase.test.cjs
├── roadmap.test.cjs
├── state.test.cjs
├── verify-health.test.cjs
└── verify.test.cjs
```

---

## 13. Summary: What the Cleanup Phase Is Actually Dealing With

### The core problem

There are two generations of GSD coexisting in this repo:

```
v1 (stable, installed, what users run today)
├── 29 workflows
├── 11 GSD agents
├── 31 commands
└── gsd-tools with 43 commands

v2 (in-development, not deployed, project-only additions)
├── +15 new workflows (framing system, review, doc, gather-synthesize)
├── +12 new agents (research gatherers, review reviewers, doc-writer)
├── +8 new commands (lens-based entry points, doc-phase, review-phase)
└── +13 new CLI commands (capability, feature, framing, plan-validate)
```

### Key conflicts requiring decisions

1. **gsd-planner.md divergence** — Installed is 44K (1275 lines), project is 28K (867 lines). These are not the same file. Which wins? The installed version has accumulated behavior that may not be in the project version.

2. **Two project-init paths** — `new-project.md` (v1) and `init-project.md` (v2) both create new projects. Do they coexist or is one deprecated?

3. **Research pipeline redesign** — The 6-gatherer pattern (v2) is a complete replacement of the single `gsd-phase-researcher` agent (v1). But v1 is what workflows currently call. Migration path unclear.

4. **primary-collaborator.md** — A project-specific user agent (poker app) installed globally in `~/.claude/agents/`. Not GSD. Should not be in any GSD file list.

5. **discovery-phase.md** — Exists in installed but has no command and is not called by anything. Looks superseded by `framing-discovery.md`. Candidate for removal.

6. **The deploy gap** — New v2 commands hardcode `~/.claude/get-shit-done/` paths that don't exist there yet. Running any v2 command from the installed version produces broken `@` references.
