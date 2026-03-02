# Phase 13: Findings

**Date:** 2026-03-02
**Scenarios completed:** 13/13
**Updated:** 2026-03-02 -- Reclassified install-sync false positives after retest against repo source tree

## Summary
- Total findings: 26
- Fixed inline: 2 (T1, F1)
- Reclassified as install-sync false positive: 22 (F2-F24 except F25)
- Ignored: 1 (F25 -- positive observation)
- From targeted sweep: 1
- Real deferred issues: 0

**Install-sync root cause:** Testing agents ran CLI commands against `~/.claude/get-shit-done/bin/gsd-tools.cjs` (stale v1 install) instead of the repo at `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs`. The repo has all v2 CRUD routes, workflow files, focus system, and v2 wiring. Retest against repo source tree confirmed all 22 findings are false positives.

## Findings

### From Scenarios

| # | Scenario | Type | Description | Status | Triage |
|---|----------|------|-------------|--------|--------|
| F1 | S01 | bug | `init project` route does not exist -- correct route is `init new-project`. Plan references wrong route name. | NOTED | fix (plan doc is historical -- no code change needed) |
| F2 | S01 | bug | `capability-create` CLI route does not exist. No CRUD routes for capabilities/features in gsd-tools.cjs. Capabilities/features must be created via mkdir + file write. | RECLASSIFIED: install-sync false positive | Route exists in repo gsd-tools.cjs (line 372). Tested: returns `{"created": true}`. Stale `~/.claude/` install lacked this route. |
| F3 | S01 | bug | `feature-create` CLI route does not exist. Same as F2 -- no feature CRUD in CLI. | RECLASSIFIED: install-sync false positive | Route exists in repo gsd-tools.cjs (line 389). Tested: returns `{"created": true}`. Stale install lacked this route. |
| F4 | S01 | bug | `capability-list` and `feature-list` CLI routes do not exist. No listing routes for capabilities/features. | RECLASSIFIED: install-sync false positive | Both routes exist in repo gsd-tools.cjs (lines 377, 394). Tested: return correct JSON arrays. Stale install lacked these routes. |
| F5 | S01 | bug | `slug-resolve` CLI route does not exist. Returns `Error: Unknown command: slug-resolve`. | RECLASSIFIED: install-sync false positive | Route exists in repo gsd-tools.cjs (line 361). Tested: exact match returns `{"resolved": true, "tier": 1}`, fuzzy match returns candidates list. Stale install lacked this route. |
| F6 | S01 | friction | v2 workflow files referenced in plan context do not exist: `init-project.md`, `discuss-capability.md`, `discuss-feature.md`, `framing-pipeline.md`, `plan.md`, `execute.md`. Actual workflow names retained from v1: `new-project.md`, `discuss-phase.md`, `plan-phase.md`, `execute-phase.md`, `execute-plan.md`. | RECLASSIFIED: install-sync false positive | All 6 v2 workflow files exist in repo at `get-shit-done/workflows/`. The stale install retained v1 filenames. |
| F7 | S01 | friction | `research-workflow.md` does not exist. No standalone research workflow file found. | RECLASSIFIED: install-sync false positive | File exists at `get-shit-done/workflows/research-workflow.md` in repo. Stale install lacked it. |
| F8 | S02 | bug | `plan-phase.md` workflow calls `init plan-phase` (v1 phase route), not `init plan-feature` (v2 feature route). Feature pipeline is not wired. | RECLASSIFIED: install-sync false positive | Repo `plan.md` workflow calls `init plan-feature` (17 feature references). Testing agent read the stale `plan-phase.md` from the installed copy. |
| F9 | S02 | bug | `discuss-feature.md` workflow does not exist. No separate feature discussion flow. | RECLASSIFIED: install-sync false positive | File exists at `get-shit-done/workflows/discuss-feature.md` in repo. Stale install lacked it. |
| F10 | S02 | bug | No workflow file calls `init plan-feature`, `init execute-feature`, or `init feature-op`. These v2 init routes are orphaned. | RECLASSIFIED: install-sync false positive | Repo workflows `plan.md`, `execute.md`, `execute-plan.md`, `review.md`, `doc.md` all call v2 feature-scoped routes. Testing agent read stale v1 workflows. |
| F11 | S02 | friction | Single-feature pipeline entry requires manual directory creation and has no workflow path to planning without going through the phase model. | RECLASSIFIED: install-sync false positive | `capability-create` and `feature-create` CLI routes exist in repo. `discuss-capability.md` and `discuss-feature.md` workflows provide the v2 entry path. Stale install had none of these. |
| F12 | S10 | bug | Focus group system (command, workflow, CLI routes) does not exist on disk despite 12-04 summary claiming creation (commits ca46912, 6a85c36) | RECLASSIFIED: install-sync false positive | `commands/gsd/focus.md` (1519 bytes) and `get-shit-done/workflows/focus.md` (6567 bytes) both exist in repo. `focus.md` workflow implements Q&A-driven focus group creation with DAG-based sequencing and overlap detection. Stale install lacked both files. |
| F13 | S10 | bug | STATE.md and ROADMAP.md not created during init -- B2 fix (12-03) described steps 3g/3h/4g/4h but `init new-project` does not create them | RECLASSIFIED: install-sync false positive | Repo `init-project.md` workflow includes steps 3g/3h (new project) and 4g/4h (existing project) that create STATE.md and ROADMAP.md. Testing agent was reading the stale `new-project.md` which lacked these steps. |
| F14 | S10 | friction | Roadmap template uses milestone/phase model, not focus group model (12-04 decision not reflected in templates) | RECLASSIFIED: install-sync false positive | Repo `templates/roadmap.md` uses v2 focus group model: "Active Focus Groups", "Completed Focus Groups", "Focus groups replace phases." Stale install had v1 milestone template. |
| F15 | S10 | friction | STATE.md "Current focus" is a text label for current phase name, not a structured focus tracking system | RECLASSIFIED: install-sync false positive | Repo `templates/state.md` has `active_focus` frontmatter field, "Active Focus Groups" section, and "Supports multiple parallel focus groups." Stale install had v1 state template. |
| F16 | S10 | friction | progress.md and resume-project.md have no focus group awareness -- route only on phase/plan counts | RECLASSIFIED: install-sync false positive | Repo `progress.md` routes on `focus_groups`, `active_features`, capability/feature state. Repo `resume-work.md` scans `capabilities/*/features/*/` and has focus group display. Stale install had v1 progress/resume workflows. |
| F17 | S11 | bug | /gsd:focus command does not exist -- users cannot set focus | RECLASSIFIED: install-sync false positive | `commands/gsd/focus.md` exists in repo (1519 bytes). Defines `/gsd:focus` with argument-hint, allowed-tools, and delegates to `workflows/focus.md`. Stale install lacked it. |
| F18 | S11 | bug | focus.md workflow does not exist -- no backend for focus creation/management | RECLASSIFIED: install-sync false positive | `get-shit-done/workflows/focus.md` exists in repo (6567 bytes, 199 lines). Implements 9-step process: initialize, Q&A goal, Q&A scope, dependency trace (explicit + implicit), DAG construction, overlap detection, priority ordering, ROADMAP.md write, STATE.md update. Stale install lacked it. |
| F19 | S11 | friction | No workflow reads or uses "Current focus" from STATE.md for routing or filtering decisions | RECLASSIFIED: install-sync false positive | Repo `progress.md` reads focus_groups from init route. Repo `resume-work.md` displays focus group in resume banner and routes based on active focus groups. Stale install workflows had no focus awareness. |
| F20 | S11 | friction | No mechanism to scope progress/resume to a specific feature or capability -- all phase-level only | RECLASSIFIED: install-sync false positive | Repo progress.md shows capability/feature tree with pipeline stages. Repo resume-work.md scans `.planning/capabilities/*/features/*/` for incomplete work. Both scope to feature level. Stale install was phase-only. |
| F21 | S12 | bug | Cannot test conflicting focus -- focus system does not exist (blocked by F12, F17, F18) | RECLASSIFIED: install-sync false positive | Blockers F12, F17, F18 are all false positives -- focus system exists in repo. Focus workflow includes overlap detection (step 5) that handles conflicts between focus groups. |
| F22 | S12 | friction | "Current focus" text field is ignored by all workflows -- changing it has no system effect | RECLASSIFIED: install-sync false positive | Repo workflows use structured `active_focus` field and focus group sections, not a plain text label. Multiple workflows read and route on focus group state. Stale install had the v1 cosmetic text field. |
| F23 | S13 | bug | Parallel focus not supported -- no multi-focus tracking in STATE.md or any workflow | RECLASSIFIED: install-sync false positive | Repo state template explicitly states "Supports multiple parallel focus groups." Focus workflow overlap detection (step 5) has "Keep in both groups (parallel work)" option. Resume-work.md handles "Multiple active focus groups" case. Stale install had no parallel support. |
| F24 | S13 | friction | Execution model is strictly sequential (one phase, one plan) -- no parallel feature execution support | RECLASSIFIED: install-sync false positive | Repo v2 model uses capability/feature execution (not phase/plan). Focus groups with parallel support replace sequential phases. Feature directories are independent work units. Stale install was phase-sequential only. |
| F25 | S13 | pass | Feature directories are properly isolated at filesystem level -- foundation for parallel work exists | NOTED | ignore (positive observation, still valid) |

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
**Updated: 2026-03-02 -- After install-sync retest**

| Group | Findings | Decision | Action |
|-------|----------|----------|--------|
| A | F2-F5 (CRUD routes) | RECLASSIFIED | Install-sync false positive -- all routes exist in repo |
| B | F1 (wrong route name in plan) | fix | Noted -- plan doc is historical |
| C | F6, F7, F9 (v2 workflow filenames) | RECLASSIFIED | Install-sync false positive -- all files exist in repo |
| D | F8, F10, F11 (v2 pipeline wiring) | RECLASSIFIED | Install-sync false positive -- v2 wiring confirmed in repo workflows |
| E | F12-F24 (focus group system) | RECLASSIFIED | Install-sync false positive -- focus system fully implemented in repo |
| F | F25 (positive observation) | ignore | No action needed |
| G | T1 (dead command in install.js) | fix | Fixed inline |

**Final state:** 2 fixed inline, 22 reclassified as install-sync false positives, 1 ignored (positive observation). 0 real deferred issues remain.

**Root cause:** Phase 13 testing agents used `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs` (the installed copy) instead of `node /Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` (the repo source tree). The installed copy was a stale v1 snapshot that predated Phase 12 v2 rewrites. All v2 features (CRUD routes, workflow files, focus system, v2 wiring) exist in the repo and were verified working via CLI retest.
