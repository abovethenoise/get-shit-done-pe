# Phase 13: Findings

**Date:** 2026-03-02
**Scenarios completed:** 13/13

## Summary
- Total findings: 26
- Fixed inline: 2 (T1, F1)
- Deferred to Phase 14+: 23 (F2-F24)
- Ignored: 1 (F25 -- positive observation)
- From targeted sweep: 1

## Findings

### From Scenarios

| # | Scenario | Type | Description | Status | Triage |
|---|----------|------|-------------|--------|--------|
| F1 | S01 | bug | `init project` route does not exist -- correct route is `init new-project`. Plan references wrong route name. | NOTED | fix (plan doc is historical -- no code change needed) |
| F2 | S01 | bug | `capability-create` CLI route does not exist. No CRUD routes for capabilities/features in gsd-tools.cjs. Capabilities/features must be created via mkdir + file write. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F3 | S01 | bug | `feature-create` CLI route does not exist. Same as F2 -- no feature CRUD in CLI. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F4 | S01 | bug | `capability-list` and `feature-list` CLI routes do not exist. No listing routes for capabilities/features. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F5 | S01 | bug | `slug-resolve` CLI route does not exist. Returns `Error: Unknown command: slug-resolve`. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F6 | S01 | friction | v2 workflow files referenced in plan context do not exist: `init-project.md`, `discuss-capability.md`, `discuss-feature.md`, `framing-pipeline.md`, `plan.md`, `execute.md`. Actual workflow names retained from v1: `new-project.md`, `discuss-phase.md`, `plan-phase.md`, `execute-phase.md`, `execute-plan.md`. | DEFERRED | fix (rename files) -- requires dedicated phase (Phase 14+) |
| F7 | S01 | friction | `research-workflow.md` does not exist. No standalone research workflow file found. | DEFERRED | fix (rename files) -- requires dedicated phase (Phase 14+) |
| F8 | S02 | bug | `plan-phase.md` workflow calls `init plan-phase` (v1 phase route), not `init plan-feature` (v2 feature route). Feature pipeline is not wired. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F9 | S02 | bug | `discuss-feature.md` workflow does not exist. No separate feature discussion flow. | DEFERRED | fix (rename files) -- requires dedicated phase (Phase 14+) |
| F10 | S02 | bug | No workflow file calls `init plan-feature`, `init execute-feature`, or `init feature-op`. These v2 init routes are orphaned. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F11 | S02 | friction | Single-feature pipeline entry requires manual directory creation and has no workflow path to planning without going through the phase model. | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F12 | S10 | bug | Focus group system (command, workflow, CLI routes) does not exist on disk despite 12-04 summary claiming creation (commits ca46912, 6a85c36) | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F13 | S10 | bug | STATE.md and ROADMAP.md not created during init -- B2 fix (12-03) described steps 3g/3h/4g/4h but `init new-project` does not create them | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F14 | S10 | friction | Roadmap template uses milestone/phase model, not focus group model (12-04 decision not reflected in templates) | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F15 | S10 | friction | STATE.md "Current focus" is a text label for current phase name, not a structured focus tracking system | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F16 | S10 | friction | progress.md and resume-project.md have no focus group awareness -- route only on phase/plan counts | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F17 | S11 | bug | /gsd:focus command does not exist -- users cannot set focus | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F18 | S11 | bug | focus.md workflow does not exist -- no backend for focus creation/management | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F19 | S11 | friction | No workflow reads or uses "Current focus" from STATE.md for routing or filtering decisions | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F20 | S11 | friction | No mechanism to scope progress/resume to a specific feature or capability -- all phase-level only | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F21 | S12 | bug | Cannot test conflicting focus -- focus system does not exist (blocked by F12, F17, F18) | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F22 | S12 | friction | "Current focus" text field is ignored by all workflows -- changing it has no system effect | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F23 | S13 | bug | Parallel focus not supported -- no multi-focus tracking in STATE.md or any workflow | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F24 | S13 | friction | Execution model is strictly sequential (one phase, one plan) -- no parallel feature execution support | DEFERRED | fix -- requires dedicated phase (Phase 14+) |
| F25 | S13 | pass | Feature directories are properly isolated at filesystem level -- foundation for parallel work exists | NOTED | ignore (positive observation) |

### From Targeted Sweep

| # | Pattern | Location | Description | Status | Triage |
|---|---------|----------|-------------|--------|--------|
| T1 | `gsd:new-project` | bin/install.js:635 | Install success message references `/gsd:new-project` -- should be `/gsd:new` | FIXED | fix (applied inline) |

**Sweep patterns with zero hits in deployed code (commands/, agents/, workflows/, references/, templates/, bin/):**
- `gsd:new-project` in commands/agents/workflows/refs/templates: 0 hits (fixed in commit 2f9ad5a)
- `gsd:discuss-phase`: 0 hits (fixed in Phase 9)
- `gsd:verify-work`: 0 hits (fixed; UAT.md deleted; VALIDATION.md cleaned)
- `plan-phase` in workflow logic: 0 functional hits (only in executor-reference.md as CLI route name `init execute-phase` -- functional per 10-08 decision)
- `review-phase` / `doc-phase`: only tombstone error messages in gsd-tools.cjs (intentional)
- `init progress`: 0 hits in deployed code (route deleted in Phase 12)
- `.planning/phases/`: 2 hits in example/template paths (gather-synthesize.md, executor-reference.md) -- acceptable, v1 phase model still active
- `milestone_branch_template` / `phase_branch_template`: 0 hits in deployed code
- `gsd-codebase-mapper`: 0 hits in deployed code
- `gsd-check-update`: only in install.js cleanup logic (correct -- removing old hooks)
- `PRD`: 0 hits in workflows

**Phase 11 re-verification:**
- F1-F3 (`/gsd:new-project` in init.md, init-project.md, plan.md): VERIFIED FIXED (commit 2f9ad5a)
- F4 (`/gsd:discuss-phase` in research.md template): VERIFIED FIXED (commit 2f9ad5a)
- F5 (other friction): No remaining friction items in deployed code
- C1 (`/gsd:verify-work` in UAT.md): VERIFIED FIXED (template deleted in Phase 12)
- C2 (`/gsd:verify-work` in VALIDATION.md): VERIFIED FIXED (reference removed)
- C3-C4: No remaining cosmetic items in deployed code

## Triage Results

**Triage completed: 2026-03-02**

| Group | Findings | Decision | Action |
|-------|----------|----------|--------|
| A | F2-F5 (missing CRUD routes) | fix | Deferred to Phase 14+ |
| B | F1 (wrong route name in plan) | fix | Noted -- plan doc is historical |
| C | F6, F7, F9 (v2 workflow filenames) | fix (rename files) | Deferred to Phase 14+ |
| D | F8, F10, F11 (v2 pipeline not wired) | fix | Deferred to Phase 14+ |
| E | F12-F24 (focus group system) | fix | Deferred to Phase 14+ |
| F | F25 (positive observation) | ignore | No action needed |
| G | T1 (dead command in install.js) | fix | Fixed inline |

**Final state:** 2 fixed inline, 23 deferred to Phase 14+, 1 ignored. No OPEN fix items remain.
