# Phase 12: Dead Code & Terminology Audit

**Researched:** 2026-03-01
**Scope:** Full sweep of v1 artifacts remaining in the GSD codebase before Phase 13 E2E testing
**Codebase root:** `~/.claude/get-shit-done/` and `~/.claude/agents/`, `~/.claude/commands/gsd/`

---

## Summary

The GSD codebase has two parallel systems coexisting: the v2 capability/feature model (target state) and the v1 phase/milestone model (legacy). Phase 12's final cleanup task is to remove all v1 artifacts that are now dead weight. This document catalogs every piece.

**The picture:** All 29 v1 CLI routes were deleted in Phase 10 (see STATE.md [10-04] decision). However:
- The v1 workflow `.md` files still exist and are still deployed by install.js
- The v1 init handlers (`cmdInitExecutePhase`, `cmdInitPlanPhase`, etc.) still exist in `init.cjs` and are still routed in `gsd-tools.cjs`
- The v1 agents (`gsd-planner`, `gsd-executor`, `gsd-phase-researcher`, `gsd-verifier`, `gsd-roadmapper`, `gsd-codebase-mapper`) still reference phase/milestone terminology throughout
- The v1 state/config model has fields (`phase_branch_template`, `milestone_branch_template`, `total_phases`, `current_phase`) with no v2 equivalents yet
- Several lib modules (`phase.cjs`, `milestone.cjs`, partial `verify.cjs`, partial `roadmap.cjs`) implement phase-model logic that becomes dead once v1 workflows are removed

The bootstrap trap (noted in STATE.md) means we can't simply delete all v1 code while running on v1 — but Phase 12's intent is a "pure v2, drop v1" clean break for the plan/execute/review/doc pipeline. This document distinguishes between items that must be deleted and items that require adaptation.

---

## 1. V1 Terminology Inventory

Format: `file` | `line` | `term` | `classification` | `action`

### 1.1 Init Compound Commands (gsd-tools.cjs router — lines 511-565)

These routes call v1 init functions. The v2 init routes (`plan-feature`, `execute-feature`, `feature-op`, `feature-progress`) were added in Phase 9 but the v1 ones were never removed:

| Route | Line | Classification | Action |
|-------|------|---------------|--------|
| `init execute-phase` | 512-513 | Dead — calls v1-only `cmdInitExecutePhase` | DELETE |
| `init plan-phase` | 515-516 | Dead — calls v1-only `cmdInitPlanPhase` | DELETE |
| `init new-milestone` | 521-522 | Dead — calls v1-only `cmdInitNewMilestone` | DELETE |
| `init verify-work` | 530-531 | Dead — calls v1-only `cmdInitVerifyWork` | DELETE |
| `init milestone-op` | 539-540 | Dead — calls v1-only `cmdInitMilestoneOp` | DELETE |
| `init phase-op` | 533-534 | Used by gsd-phase-researcher agent (v1 agent still active) | KEEP until agent rewritten |
| `init progress` | 545-546 | Used by v1 progress workflow | DELETE with progress.md workflow |
| `init new-project` | 518-519 | Still used by v2 init flow | KEEP |
| `init resume` | 523-524 | Still used by resume workflow | KEEP |
| `init quick` | 525-526 | Still used by quick workflow | KEEP |
| `init todos` | 537-538 | Still used by add-todo/check-todos | KEEP |
| `init map-codebase` | 541-542 | Still used by map-codebase workflow | KEEP |

**Error message on line 562 also lists dead routes:** `execute-phase, plan-phase, new-milestone, verify-work, phase-op` — these must be removed from the fallback error string too.

### 1.2 gsd-tools.cjs — Other v1 Route Sections

| Route/Section | Lines | Classification | Action |
|---------------|-------|---------------|--------|
| `phase` command block (next-decimal, add, insert, remove, complete) | 427-444 | Dead — phase CRUD is v1 only | DELETE entire `case 'phase':` block |
| `milestone` command block (complete) | 446-466 | Dead — milestone lifecycle is v1 | DELETE entire `case 'milestone':` block |
| `phases` command block (list) | 386-401 | Dead — phase list is v1 | DELETE entire `case 'phases':` block |
| `roadmap` command block | 403-415 | PARTIAL — `get-phase` used by v1 agents, `analyze`/`update-plan-progress` used by v1 execute | DELETE after agents rewritten |
| `phase-plan-index` | 567-569 | Dead — used only by execute-phase workflow | DELETE |
| `validate consistency` | 469-471 | Dead — validates phase numbering consistency (v1) | DELETE `consistency` subcommand |
| `validate health` | 472-474 | KEEP — validates .planning/ health, may still be useful | KEEP |
| `scaffold context/uat/verification/phase-dir` | 497-507 | Dead — scaffolds v1 phase artifacts | DELETE |
| `template fill` (summary/plan/verification) | 278-301 | Dead — fills v1 PLAN/SUMMARY/VERIFICATION templates | DELETE |
| `template select` | 280-281 | Dead | DELETE |
| `verify phase-completeness` | 327-328 | Dead — checks v1 phase has all plan+summary pairs | DELETE |
| Header comment lines 33-96 | 33-96 | Documents dead commands | UPDATE to v2 commands only |

### 1.3 init.cjs — Dead Functions

| Function | Lines | Classification | Action |
|----------|-------|---------------|--------|
| `cmdInitExecutePhase` | 10-81 | Dead — no live callers after route deleted | DELETE |
| `cmdInitPlanPhase` | 83-160 | Dead — references `gsd-phase-researcher`, `init plan-phase` | DELETE |
| `cmdInitNewMilestone` | 221-251 | Dead — no v2 equivalent needed | DELETE |
| `cmdInitVerifyWork` | 335-362 | Dead — verify-work command was deleted Phase 10 | DELETE |
| `cmdInitMilestoneOp` | 504-563 | Dead — no v2 equivalent | DELETE |
| `cmdInitProgress` | 599-695 | Dead — uses v1 `phases/` directory scan only | DELETE or REPLACE with v2 `cmdInitFeatureProgress` |
| `cmdInitMapCodebase` | 565-597 | KEEP — map-codebase workflow still exists | KEEP |
| `cmdInitPhaseOp` | 364-443 | KEEP until gsd-phase-researcher rewritten | KEEP (then DELETE) |
| v1 exports in `module.exports` comment | 976 | Comment says "v1 phase functions (frozen -- bootstrap trap)" | UPDATE when deleted |

**Estimated lines:** ~480 lines deletable from init.cjs

### 1.4 phase.cjs — All Functions

The entire `phase.cjs` module is v1-only. No v2 command or workflow calls any function in this module after the phase routes are deleted:

| Function | Lines | Classification | Action |
|----------|-------|---------------|--------|
| `cmdPhasesList` | 11-85 | Dead — `case 'phases': list` being deleted | DELETE |
| `cmdPhaseNextDecimal` | 87-150 | Dead — decimal phase math is v1 | DELETE |
| `cmdFindPhase` | 152-194 | Dead — wraps `findPhaseInternal`, used only by v1 routes | DELETE |
| `cmdPhasePlanIndex` | 196-302 | Dead — used only by `execute-phase` workflow | DELETE |
| `cmdPhaseAdd` | 304-358 | Dead — `add-phase` command was deleted Phase 10 | DELETE |
| `cmdPhaseInsert` | 360-439 | Dead — `insert-phase` command was deleted Phase 10 | DELETE |
| `cmdPhaseRemove` | 441-692 | Dead — `remove-phase` command was deleted Phase 10 | DELETE |
| `cmdPhaseComplete` | 694-860 | Dead — `phase complete` is v1 | DELETE |

**Estimated lines:** ~870 lines — entire `phase.cjs` can be deleted. The internal helpers it uses (`normalizePhaseName`, `comparePhaseNum`, etc.) live in `core.cjs` and are used by other modules, so they stay.

**CAVEAT:** `cmdFindPhase` is exported and called by the `find-phase` router case (line 255-258 in gsd-tools.cjs). The `find-phase` CLI command itself is still referenced in the gsd-phase-researcher agent. So: delete `phase.cjs` only after the agent is rewritten.

### 1.5 milestone.cjs — Dead Function

| Function | Lines | Classification | Action |
|----------|-------|---------------|--------|
| `cmdMilestoneComplete` | 78-262 | Dead — `milestone complete` route being deleted | DELETE |
| `cmdRequirementsMarkComplete` | 11-76 | KEEP — used by `requirements mark-complete` route which survives | KEEP |

**Estimated lines:** ~185 lines deletable from milestone.cjs (cmdMilestoneComplete function body)

### 1.6 verify.cjs — Partial Dead Code

| Function | Lines | Classification | Action |
|----------|-------|---------------|--------|
| `cmdVerifyPhaseCompleteness` | 168-213 | Dead — `verify phase-completeness` route being deleted | DELETE |
| `cmdValidateConsistency` | 397-~516 | Dead — validates phase numbering, v1 only | DELETE |
| `cmdValidateHealth` | 517-~650 | KEEP — general .planning/ health check | KEEP |
| `cmdVerifyPlanStructure` | ~101-166 | KEEP — checks PLAN.md structure, used by v2 plans too | KEEP |
| `cmdVerifyReferences`, `cmdVerifyCommits`, `cmdVerifyArtifacts`, `cmdVerifyKeyLinks` | various | KEEP — general purpose | KEEP |

**Estimated lines:** ~150 lines deletable from verify.cjs

### 1.7 roadmap.cjs — Partial Dead Code

`roadmap.cjs` contains `cmdRoadmapGetPhase`, `cmdRoadmapAnalyze`, `cmdRoadmapUpdatePlanProgress`. After checking callers:
- `cmdRoadmapGetPhase` is called by `gsd-verifier.md` agent and `gsd-plan-checker.md` agent
- `cmdRoadmapUpdatePlanProgress` is called by `gsd-executor.md` agent
- `cmdRoadmapAnalyze` is only called by v1 workflows

Once agents are rewritten for v2, the roadmap module can be further trimmed. For now: mark as "ADAPT" rather than DELETE.

### 1.8 state.cjs — v1 Fields in buildStateFrontmatter

`buildStateFrontmatter()` (lines 553-671) builds YAML frontmatter for STATE.md. It includes both v1 and v2 fields:

**v1 fields to remove:**
- `current_phase` (line 647)
- `current_phase_name` (line 648)
- `current_plan` (line 649)
- `total_phases` / `completed_phases` progress tracking (lines 592-613) — scans `.planning/phases/`
- `progress.total_phases`, `progress.completed_phases` (lines 663-664)

**v2 fields to keep:**
- `active_capability`, `active_feature`, `pipeline_position`, `last_agent_summary`

**cmdStateAdvancePlan** (lines 168-199) — references `Total Plans in Phase` and `Current Plan` v1 STATE.md fields. Dead once v1 workflows are gone.

**cmdStateRecordMetric** (lines 201-233) — writes `Phase X P{plan}` format rows. v1 pattern.

Both of these functions can be deleted once v1 workflows are gone. Estimated ~65 lines.

### 1.9 core.cjs — Mixed

**Keep (still used by v2):**
- `normalizePhaseName` — used by phase.cjs (until deleted), also by v2 tools that reference phase directories during bootstrap
- `comparePhaseNum`, `searchPhaseInDir`, `findPhaseInternal`, `getArchivedPhaseDirs` — all referenced by phase.cjs and v1 init funcs

**Remove after phase.cjs is deleted:**
- `normalizePhaseName` (line 162)
- `comparePhaseNum` (line 171)
- `searchPhaseInDir` (line 199)
- `findPhaseInternal` (line 244) — after gsd-phase-researcher is rewritten
- `getArchivedPhaseDirs` (line 281)
- `getRoadmapPhaseInternal` (line 318) — after agents are rewritten
- `getMilestoneInfo` (line 386) — after milestone.cjs `cmdMilestoneComplete` is deleted (still used by init functions)

**v1 config fields in loadConfig defaults (lines 73-75):**
- `phase_branch_template: 'gsd/phase-{phase}-{slug}'`
- `milestone_branch_template: 'gsd/{milestone}-{slug}'`

These map to config.json keys that no v2 workflow uses. Remove from defaults and loadConfig return object.

**MODEL_PROFILES (lines 18-30):**
- `gsd-phase-researcher` entry (line 22) — keep until agent is renamed/removed
- All others: keep (used by v2 agents)

---

## 2. Dead CLI Routes (init commands)

These routes exist in the `case 'init':` block of `gsd-tools.cjs` and call dead handler functions:

| Route | Handler | Called By | Action |
|-------|---------|-----------|--------|
| `init execute-phase` | `cmdInitExecutePhase` | `execute-phase.md` workflow (dead) | DELETE route + handler |
| `init plan-phase` | `cmdInitPlanPhase` | `plan-phase.md` workflow (dead) | DELETE route + handler |
| `init new-milestone` | `cmdInitNewMilestone` | `new-milestone.md` workflow (dead) | DELETE route + handler |
| `init verify-work` | `cmdInitVerifyWork` | `verify-work.md` command (deleted Phase 10) | DELETE route + handler |
| `init milestone-op` | `cmdInitMilestoneOp` | `audit-milestone.md`, `complete-milestone.md` workflows (dead) | DELETE route + handler |
| `init progress` | `cmdInitProgress` | `progress.md` workflow (v1 phase scan) | DELETE route + handler |

**Top-level dead routes in gsd-tools.cjs:**
| Route | Lines | Handler | Action |
|-------|-------|---------|--------|
| `case 'phase':` | 427-444 | All of phase.cjs | DELETE |
| `case 'milestone':` | 446-466 | `cmdMilestoneComplete` | DELETE |
| `case 'phases':` | 386-401 | `cmdPhasesList` | DELETE |
| `case 'phase-plan-index':` | 567-569 | `cmdPhasePlanIndex` | DELETE |
| `validate consistency` subcommand | 469-471 | `cmdValidateConsistency` | DELETE subcommand |
| `scaffold context` | 497-507 | `cmdScaffold` for phase artifacts | Audit what cmdScaffold does |
| `template fill` / `template select` | 278-301 | `cmdTemplateFill`, `cmdTemplateSelect` | DELETE both |
| `verify phase-completeness` | 327-328 | `cmdVerifyPhaseCompleteness` | DELETE subcommand |

---

## 3. Dead Lib Functions

| Module | Function | Reason Dead | Estimated Lines | Action |
|--------|----------|-------------|-----------------|--------|
| init.cjs | `cmdInitExecutePhase` | No live callers after route delete | ~71 | DELETE |
| init.cjs | `cmdInitPlanPhase` | No live callers after route delete | ~77 | DELETE |
| init.cjs | `cmdInitNewMilestone` | No live callers | ~30 | DELETE |
| init.cjs | `cmdInitVerifyWork` | verify-work deleted Phase 10 | ~28 | DELETE |
| init.cjs | `cmdInitMilestoneOp` | audit-milestone/complete-milestone dead | ~59 | DELETE |
| init.cjs | `cmdInitProgress` | progress.md uses v1 phases/ scan | ~96 | DELETE |
| phase.cjs | ENTIRE FILE (8 functions) | All routes deleted | ~870 | DELETE FILE |
| milestone.cjs | `cmdMilestoneComplete` | milestone route deleted | ~185 | DELETE |
| verify.cjs | `cmdVerifyPhaseCompleteness` | verify phase-completeness route deleted | ~46 | DELETE |
| verify.cjs | `cmdValidateConsistency` | validate consistency route deleted | ~120 | DELETE |
| state.cjs | `cmdStateAdvancePlan` | References v1 STATE fields | ~32 | DELETE |
| state.cjs | `cmdStateRecordMetric` | Writes v1 Phase X P{plan} format | ~33 | DELETE |
| state.cjs | `buildStateFrontmatter` (partial) | v1 field extraction | ~30 lines to cut | ADAPT |
| core.cjs | `normalizePhaseName` | Used only by phase.cjs (after deletion) | ~8 | DELETE AFTER |
| core.cjs | `comparePhaseNum` | Same | ~27 | DELETE AFTER |
| core.cjs | `searchPhaseInDir` | Same | ~43 | DELETE AFTER |
| core.cjs | `findPhaseInternal` | Used by v1 init funcs + phase.cjs | ~35 | DELETE AFTER |
| core.cjs | `getArchivedPhaseDirs` | v1 milestone archive traversal | ~33 | DELETE AFTER |
| core.cjs | `getRoadmapPhaseInternal` | Used by v1 init funcs and agents | ~32 | DELETE AFTER agents rewritten |
| core.cjs | `getMilestoneInfo` | Used by v1 init funcs and milestone.cjs | ~22 | DELETE AFTER |

**"DELETE AFTER" = delete after dependent callers are removed first**

---

## 4. Dead Workflows

All of these still exist in `~/.claude/get-shit-done/workflows/` and need to be deleted:

| File | Reason Dead | Lines (approx) |
|------|-------------|----------------|
| `plan-phase.md` | v1 phase planning workflow | ~500 |
| `execute-phase.md` | v1 phase execution workflow | ~450 |
| `discuss-phase.md` | v1 phase discussion workflow | ~480 |
| `verify-phase.md` | v1 phase verification | ~200 |
| `research-phase.md` | v1 phase research, replaced by framing-pipeline research | ~80 |
| `new-milestone.md` | v1 milestone lifecycle | ~350 |
| `complete-milestone.md` | v1 milestone completion | ~600 |
| `audit-milestone.md` | v1 milestone audit | ~200 |
| `plan-milestone-gaps.md` | v1 gap closure | ~150 |
| `add-phase.md` | v1 phase CRUD | ~100 |
| `insert-phase.md` | v1 phase CRUD | ~100 |
| `remove-phase.md` | v1 phase CRUD | ~80 |
| `discovery-phase.md` | v1 phase discovery | ~150 |
| `list-phase-assumptions.md` | v1 phase assumption listing | ~200 |
| `diagnose-issues.md` | References plan-phase --gaps (v1) | ~220 |
| `verify-work.md` | Deleted command Phase 10, workflow file remains | ~300 |
| `pause-work.md` | Deleted command Phase 10, workflow file remains | ~150 |
| `transition.md` | v1 phase transition logic | ~500 |
| `execute-plan.md` | v1 wraps execute-phase for single plan | ~150 |
| `settings.md` | References plan-phase/execute-phase extensively | ADAPT (keep but update) |
| `progress.md` | References v1 phase progress, needs v2 rewrite | ADAPT |
| `help.md` | References all v1 commands | ADAPT (v2 command list) |
| `add-tests.md` | References plan-phase for TDD | ADAPT |
| `update.md` | References reapply-patches (deleted hook) | ADAPT |

**Workflows confirmed surviving (no v1-specific content or already adapted in Phase 10):**
- `health.md` — general health check
- `cleanup.md` — general cleanup
- `map-codebase.md` — still valid
- `add-todo.md`, `check-todos.md` — todo system
- `quick.md` — quick task workflow
- `resume-project.md` — uses generic STATE.md language (fixed Phase 9)
- `new-project.md` — uses v2 brownfield detection
- `set-profile.md` — model profile setting

---

## 5. Dead Commands (slash commands in ~/.claude/commands/gsd/)

These were deleted in Phase 10 from the commands directory but need verification. Additionally, some command files still exist with v1 content:

| File | Status | Action |
|------|--------|--------|
| `add-phase.md` | Present but command deleted Phase 10 | VERIFY DELETED or DELETE |
| `audit-milestone.md` | Present | DELETE (dead workflow) |
| `complete-milestone.md` | Present | DELETE (dead workflow) |
| `discuss-phase.md` | Present | DELETE (dead workflow) |
| `execute-phase.md` | Present | DELETE (dead workflow) |
| `insert-phase.md` | Present | DELETE |
| `list-phase-assumptions.md` | Present | DELETE |
| `new-milestone.md` | Present | DELETE |
| `plan-milestone-gaps.md` | Present | DELETE |
| `plan-phase.md` | Present | DELETE |
| `remove-phase.md` | Present | DELETE |
| `research-phase.md` | Present | DELETE |
| `verify-phase.md` | Present | DELETE |
| `verify-work.md` | Present | DELETE |
| `pause-work.md` | Present | DELETE |
| `reapply-patches.md` | Present | DELETE (hook removed Phase 8) |
| `new-project.md.bak` | Bak file | DELETE |
| `join-discord.md` | Present | KEEP (marketing) |
| `resume-work.md` | Present (v2 name) | KEEP |
| `debug.md` | Present (v2) | KEEP |

---

## 6. Orphaned Templates

Templates in `~/.claude/get-shit-done/templates/` that serve only the v1 model:

| Template | v1 Purpose | Action |
|----------|-----------|--------|
| `milestone-archive.md` | Milestone archive format | DELETE |
| `milestone.md` | MILESTONES.md entry format | DELETE |
| `phase-prompt.md` | Phase planning prompt template | DELETE |
| `discovery.md` | Phase discovery output | DELETE |
| `planner-subagent-prompt.md` | References `phase_number` | DELETE or ADAPT |
| `debug-subagent-prompt.md` | May still be v2-useful | AUDIT |
| `roadmap.md` | Phase-based roadmap template | REPLACE with v2 focus-group format |
| `state.md` | Phase-based STATE.md template | REPLACE with v2 capability/feature format |
| `verification-report.md` | Deleted Phase 10 (per STATE.md) | CONFIRM DELETED |
| `UAT.md` | References plan-phase --gaps | ADAPT |
| `summary-complex.md`, `summary-standard.md`, `summary-minimal.md` | v1 SUMMARY.md variants | AUDIT — still used? |
| `summary.md` | v1 SUMMARY.md base template | AUDIT — still used? |
| `research.md` | References plan-phase | ADAPT |
| `retrospective.md` | Milestone retrospective | DELETE or ADAPT |
| `continue-here.md` | Session continuation — v2-compatible | KEEP |
| `context.md` | Phase context template (v1) | REPLACE with capability/feature context |
| `requirements.md` | Requirements template | AUDIT — Phase 10 updated it |
| `project.md` | References "after Phase 2" / "after v1.0 milestone" | ADAPT |

---

## 7. Orphaned References

Reference docs in `~/.claude/get-shit-done/references/` that describe the v1 model:

| Reference | v1 Content | Action |
|-----------|-----------|--------|
| `planning-config.md` | Describes `phase_branch_template`, `milestone_branch_template`, `branching_strategy: phase/milestone`, `complete-milestone` workflow, `auto_advance` | REWRITE for v2 config shape |
| `git-planning-commit.md` | Lists `new-milestone`, `plan-phase`, `execute-phase` commit conventions | REWRITE for v2 workflows |
| `continuation-format.md` | Line 172: references `/gsd:new-milestone` | ADAPT |
| `questioning.md` | References `plan-phase` and `execute-phase` | ADAPT |
| `model-profiles.md` | Lists `gsd-phase-researcher` as agent type | ADAPT |
| `ui-brand.md` | Line 67: "Phase/milestone level" display | ADAPT |
| `phase-argument-parsing.md` | Entire doc describes v1 phase argument parsing | DELETE |
| `decimal-phase-calculation.md` | Entire doc describes v1 decimal phase numbering | DELETE |
| `checkpoints.md` | References `workflow.auto_advance` config (deleted from v2 config) | ADAPT |
| `tdd.md` | May reference phase-based TDD | AUDIT |
| `verification-patterns.md` | References phase verification | AUDIT |
| `git-integration.md` | May reference phase branching | AUDIT |
| `model-profile-resolution.md` | Lists `gsd-phase-researcher` | ADAPT |

---

## 8. v1 STATE.md Fields

The current STATE.md template (`~/.claude/get-shit-done/templates/state.md`) and the actual `buildStateFrontmatter()` function produce these v1 frontmatter fields:

| Field | Location | v1 or v2? | Action |
|-------|----------|-----------|--------|
| `gsd_state_version: 1.0` | frontmatter | Both — but v1 naming | UPDATE to 2.0 |
| `milestone` | frontmatter | v1 — reads ROADMAP.md `## vX.Y` heading | REMOVE |
| `milestone_name` | frontmatter | v1 | REMOVE |
| `current_phase` | frontmatter | v1 | REMOVE |
| `current_phase_name` | frontmatter | v1 | REMOVE |
| `current_plan` | frontmatter | v1 | REMOVE |
| `status` | frontmatter | Both — but normalize logic tied to v1 states | ADAPT |
| `progress.total_phases` | frontmatter | v1 — phases/ scan | REMOVE |
| `progress.completed_phases` | frontmatter | v1 — phases/ scan | REMOVE |
| `progress.total_plans` | frontmatter | Both — scans phases/ AND capabilities/ | ADAPT (v2 only) |
| `progress.completed_plans` | frontmatter | Both — scans phases/ AND capabilities/ | ADAPT (v2 only) |
| `active_capability` | frontmatter | v2 | KEEP |
| `active_feature` | frontmatter | v2 | KEEP |
| `pipeline_position` | frontmatter | v2 | KEEP |
| `last_agent_summary` | frontmatter | v2 | KEEP |

**v1 STATE.md body fields (template):**
- `Phase: [X] of [Y]` — REMOVE, replace with `Capability:` / `Feature:`
- `Plan: [A] of [B] in current phase` — REMOVE
- `By Phase:` table in Performance Metrics — REMOVE, replace with capability/feature table
- `Current focus: [Current phase name]` — REPLACE with `Current focus: [capability/feature]`

**v2 fields needed in STATE.md that don't exist yet:**
- `Active focus group` (per CONTEXT.md decisions on STATE.md tracking)
- `Active capability` + `Active feature` (already partially there)
- `Current plan` within feature scope

---

## 9. Config v1 Remnants

### In core.cjs `loadConfig` defaults (lines 73-75):
```javascript
phase_branch_template: 'gsd/phase-{phase}-{slug}',
milestone_branch_template: 'gsd/{milestone}-{slug}',
```
These fields are returned by `loadConfig()` and consumed by:
- `cmdInitExecutePhase` (being deleted)
- `cmdInitMilestoneOp` (being deleted)

After those deletions, no live code reads `phase_branch_template` or `milestone_branch_template`. Remove from defaults and return object.

### In config.cjs `cmdConfigEnsureSection` defaults (lines 46-61):
```javascript
phase_branch_template: 'gsd/phase-{phase}-{slug}',
milestone_branch_template: 'gsd/{milestone}-{slug}',
```
Same as above — these get written to new user config.json files. Remove.

### In `~/.claude/get-shit-done/templates/config.json`:
```json
"confirm_phases": true,
"confirm_transition": true,
"auto_advance": false
```
- `confirm_phases` — v1 phase confirmation gate
- `confirm_transition` — v1 phase transition gate (used in transition.md)
- `auto_advance` — v1 auto-advance through plan→execute→verify (explicitly not in v2)

All three should be removed from the shipped config template.

### The template config.json structure itself is v1:
The current shipped `templates/config.json` uses a flat v1 structure. The `config.cjs` runtime code handles both old flat format and newer nested format (e.g., `workflow.research` vs. top-level `research`). After v2 transition, ship a v2-shaped config with capability/feature-appropriate keys.

---

## 10. Agent v1 Remnants

### gsd-phase-researcher.md (ENTIRE FILE — to be replaced)
- Line 2-3: name/description says "phase researcher", spawned by `/gsd:plan-phase`
- Entire execution flow uses `init phase-op` and references phase directories
- **Action:** REPLACE with new feature-researcher agent for v2 framing pipeline

### gsd-planner.md (HEAVY ADAPTATION NEEDED)
- Line 3: description says "phase plans" spawned by `/gsd:plan-phase`
- Line 12-14: mentions plan-phase orchestrator three times
- Line 142: "suggest `/gsd:research-phase` before plan-phase"
- Lines 379, 437, 445-446, 456: all reference `phase` frontmatter fields in PLAN.md format
- Line 557: "Read ROADMAP.md `**Requirements:**` line for this phase"
- Lines 831, 855, 903, 922-923, 942, 945: all reference `init plan-phase`, phase dirs
- **Action:** REWRITE to use `init plan-feature` and capability/feature directory model

### gsd-executor.md (HEAVY ADAPTATION NEEDED)
- Line 3: description says "Spawned by execute-phase orchestrator"
- Line 11: references `/gsd:execute-phase`
- Line 40: `init execute-phase`
- Lines 163, 240, 282-286, 314, 325, 331, 389, 395, 404, 433, 443: all use phase/plan terminology
- **Action:** REWRITE to use `init execute-feature` and feature directory paths

### gsd-verifier.md (HEAVY ADAPTATION NEEDED)
- Entire agent verifies phases, not features
- Line 3: "phase verifier"
- Lines 75, 112, 123, 260, 278, 282, 340, 370, 374, 455, 464, 475, 496: phase refs throughout
- References `VERIFICATION.md` in phase dirs
- **Action:** REWRITE for feature-level verification against FEATURE.md requirements

### gsd-plan-checker.md (MODERATE ADAPTATION)
- Line 371: `init plan-phase` init context extraction
- Line 379: `roadmap get-phase` call
- **Action:** ADAPT to use `init plan-feature` and FEATURE.md requirements instead of ROADMAP.md

### gsd-roadmapper.md (FULL REPLACEMENT)
- Entire agent creates phase-based roadmaps
- Lines 9, 15, 21-24, 30, 36, 54, 64, 69, 73-74, 80, 82-83, 87, 91, 94, 99: all describe phase/milestone roadmap structure
- **Action:** REPLACE with v2 roadmapper that creates focus-group based ROADMAP.md

### gsd-codebase-mapper.md (MINOR ADAPTATION)
- Lines 26, 37, 51: references `/gsd:plan-phase`, `/gsd:execute-phase`
- **Action:** UPDATE references to v2 framing commands

### Agents that are clean (no significant v1 refs):
- `gsd-debugger.md` — framing-based, no phase refs
- `gsd-project-researcher.md` — capability-focused, clean
- `gsd-research-synthesizer.md` — general purpose, clean
- `gsd-integration-checker.md` — checks @file refs, general purpose

---

## 11. Build Artifact v1 Remnants

### install.js
| Item | Line | Action |
|------|------|--------|
| `gsd-phase-researcher` workspace-write permission (line 22) | After agent is renamed/deleted | UPDATE |
| `gsd-check-update.js` still in hooks list (line 1338) | Hook was removed Phase 8 | REMOVE from install hooks list |
| `CHANGELOG.md` copy (lines 1954-1962) | Per INST-06, changelog/version metadata to be removed | DELETE |
| `VERSION` file write (lines 1966-1969) | Per INST-06 | DELETE |
| `gsd-local-patches/` system (lines 1669-1816) | Per INST-06, patch backup removed | DELETE entire patch backup section |
| Multi-runtime support: Codex/Gemini/OpenCode (lines 40-113) | Per INST-05, strip to Claude Code only | DELETE all non-Claude runtime code |
| `reapply-patches` command reference (line 1804-1808) | Deleted command | DELETE |

### package.json
| Item | Action |
|------|--------|
| `"codex"`, `"gemini"`, `"codex-cli"`, `"gemini-cli"` in keywords | REMOVE |
| `"description"` still says "Claude Code, OpenCode, Gemini and Codex" | UPDATE |
| `"test"` script references `run-tests.cjs` — Phase 11 result was 19 PASS, 2 WARN | AUDIT tests for v1 deps |

### scripts/run-tests.cjs
- Per STATE.md [Phase 08]: "14 live test files remain" — need audit to check which tests cover deleted code

### hooks/ directory
- `gsd-check-update.js` — removed from Phase 8 but may still exist in hooks/dist
- Verify: `ls ~/.claude/get-shit-done/hooks/dist/`

---

## 12. Total Estimated Lines to Delete

| Category | Estimated Lines |
|----------|----------------|
| gsd-tools.cjs dead router cases + header | ~150 |
| init.cjs dead functions (6 functions) | ~480 |
| phase.cjs (entire file) | ~870 |
| milestone.cjs dead function | ~185 |
| verify.cjs dead functions (2) | ~170 |
| state.cjs dead functions + field adaptations | ~65 |
| core.cjs dead helpers (deferred) | ~200 |
| Dead workflow files (19 files) | ~4,600 |
| Dead command files (17 files) | ~500 |
| Dead/adapt templates (10 files) | ~600 |
| Dead/adapt references (9 files) | ~400 |
| Dead agents (2 files) + adapt (4 files) | ~2,000 |
| install.js cleanup (INST-05/06) | ~300 |
| **Total** | **~10,520 lines** |

This is a large sweep. The code deletions (~1,900 lines in lib/) are surgical. The workflow/agent deletions (~7,100 lines) are bulk file operations.

---

## 13. Deletion Dependency Order

Some items can't be deleted until their dependencies are resolved:

```
PHASE 1 (safe to delete now — no live callers):
  - Dead workflow .md files (19 files)
  - Dead command .md files (17 files)
  - Dead templates (10 files)
  - Dead references (9 files)

PHASE 2 (delete after workflows are gone):
  - init.cjs: cmdInitExecutePhase, cmdInitPlanPhase, cmdInitNewMilestone,
              cmdInitVerifyWork, cmdInitMilestoneOp, cmdInitProgress
  - milestone.cjs: cmdMilestoneComplete
  - verify.cjs: cmdVerifyPhaseCompleteness, cmdValidateConsistency
  - state.cjs: cmdStateAdvancePlan, cmdStateRecordMetric
  - gsd-tools.cjs: remove dead router cases for phase/milestone/phases/phase-plan-index/
                   validate-consistency/template/verify-phase-completeness

PHASE 3 (delete after agents are rewritten):
  - phase.cjs: entire file (depends on find-phase route still used by agent)
  - core.cjs: normalizePhaseName, comparePhaseNum, searchPhaseInDir,
              findPhaseInternal, getArchivedPhaseDirs, getRoadmapPhaseInternal,
              getMilestoneInfo
  - core.cjs config: phase_branch_template, milestone_branch_template fields
  - init.cjs: cmdInitPhaseOp (still used by gsd-phase-researcher)

PHASE 4 (config + STATE changes — after agents produce v2 STATE.md):
  - STATE.md frontmatter v1 fields
  - templates/state.md: rewrite for capability/feature model
  - templates/config.json: remove v1 gates, add v2 shape
  - config.cjs + core.cjs: remove phase/milestone branch templates from defaults
```

---

## 14. Key Risk Items

1. **Bootstrap trap (STATE.md warning):** "V1 files must stay frozen during v2 construction." This research is for the cleanup AFTER v2 pipelines are wired. Do not delete v1 lib code before the v2 pipeline is verified working end-to-end (Phase 13 E2E test gates this).

2. **gsd-phase-researcher agent is still active:** This agent is spawned by the current `plan-phase` workflow that is STILL the primary planning workflow until Phase 12 rewires it. Do not delete `phase.cjs`, `cmdInitPhaseOp`, or the `init phase-op` route until the new `framing-pipeline.md` agent orchestration is complete and tested.

3. **STATE.md frontmatter:** The `state json` command is used by `gsd-context-monitor.js` hook. The hook reads `milestone`, `current_phase`, and `status` fields. When those fields are removed, the hook must be updated simultaneously.

4. **run-tests.cjs:** Some test files likely test deleted phase/milestone functions. After Phase 2 deletions, the test suite will need to be audited for orphaned test files.

5. **install.js multi-runtime cleanup (INST-05):** Removing Codex/Gemini/OpenCode adapters is a significant refactor (~300-400 lines of install.js). This is a separate INST task, not just terminology cleanup.

---

*Research complete. This document feeds the Phase 12 final cleanup planning sub-task.*
