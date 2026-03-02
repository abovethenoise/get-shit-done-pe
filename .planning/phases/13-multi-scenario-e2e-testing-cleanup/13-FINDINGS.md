# Phase 13: Findings

**Date:** 2026-03-02
**Scenarios completed:** 11/13

## Summary
- Total findings: 25
- Fixed inline: 0
- Open for triage: 25
- From targeted sweep: 0

## Findings

### From Scenarios

| # | Scenario | Type | Description | Status | Triage |
|---|----------|------|-------------|--------|--------|
| F1 | S01 | bug | `init project` route does not exist -- correct route is `init new-project`. Plan references wrong route name. | OPEN | - |
| F2 | S01 | bug | `capability-create` CLI route does not exist. No CRUD routes for capabilities/features in gsd-tools.cjs. Capabilities/features must be created via mkdir + file write. | OPEN | - |
| F3 | S01 | bug | `feature-create` CLI route does not exist. Same as F2 -- no feature CRUD in CLI. | OPEN | - |
| F4 | S01 | bug | `capability-list` and `feature-list` CLI routes do not exist. No listing routes for capabilities/features. | OPEN | - |
| F5 | S01 | bug | `slug-resolve` CLI route does not exist. Returns `Error: Unknown command: slug-resolve`. | OPEN | - |
| F6 | S01 | friction | v2 workflow files referenced in plan context do not exist: `init-project.md`, `discuss-capability.md`, `discuss-feature.md`, `framing-pipeline.md`, `plan.md`, `execute.md`. Actual workflow names retained from v1: `new-project.md`, `discuss-phase.md`, `plan-phase.md`, `execute-phase.md`, `execute-plan.md`. | OPEN | - |
| F7 | S01 | friction | `research-workflow.md` does not exist. No standalone research workflow file found. | OPEN | - |
| F8 | S02 | bug | `plan-phase.md` workflow calls `init plan-phase` (v1 phase route), not `init plan-feature` (v2 feature route). Feature pipeline is not wired. | OPEN | - |
| F9 | S02 | bug | `discuss-feature.md` workflow does not exist. No separate feature discussion flow. | OPEN | - |
| F10 | S02 | bug | No workflow file calls `init plan-feature`, `init execute-feature`, or `init feature-op`. These v2 init routes are orphaned. | OPEN | - |
| F11 | S02 | friction | Single-feature pipeline entry requires manual directory creation and has no workflow path to planning without going through the phase model. | OPEN | - |
| F12 | S10 | bug | Focus group system (command, workflow, CLI routes) does not exist on disk despite 12-04 summary claiming creation (commits ca46912, 6a85c36) | OPEN | - |
| F13 | S10 | bug | STATE.md and ROADMAP.md not created during init -- B2 fix (12-03) described steps 3g/3h/4g/4h but `init new-project` does not create them | OPEN | - |
| F14 | S10 | friction | Roadmap template uses milestone/phase model, not focus group model (12-04 decision not reflected in templates) | OPEN | - |
| F15 | S10 | friction | STATE.md "Current focus" is a text label for current phase name, not a structured focus tracking system | OPEN | - |
| F16 | S10 | friction | progress.md and resume-project.md have no focus group awareness -- route only on phase/plan counts | OPEN | - |
| F17 | S11 | bug | /gsd:focus command does not exist -- users cannot set focus | OPEN | - |
| F18 | S11 | bug | focus.md workflow does not exist -- no backend for focus creation/management | OPEN | - |
| F19 | S11 | friction | No workflow reads or uses "Current focus" from STATE.md for routing or filtering decisions | OPEN | - |
| F20 | S11 | friction | No mechanism to scope progress/resume to a specific feature or capability -- all phase-level only | OPEN | - |
| F21 | S12 | bug | Cannot test conflicting focus -- focus system does not exist (blocked by F12, F17, F18) | OPEN | - |
| F22 | S12 | friction | "Current focus" text field is ignored by all workflows -- changing it has no system effect | OPEN | - |
| F23 | S13 | bug | Parallel focus not supported -- no multi-focus tracking in STATE.md or any workflow | OPEN | - |
| F24 | S13 | friction | Execution model is strictly sequential (one phase, one plan) -- no parallel feature execution support | OPEN | - |
| F25 | S13 | pass | Feature directories are properly isolated at filesystem level -- foundation for parallel work exists | OPEN | - |

### From Targeted Sweep

| # | Pattern | Location | Description | Status | Triage |
|---|---------|----------|-------------|--------|--------|
| *(none yet -- sweep in Plan 06)* | | | | | |

## Triage Results
*(After human Q&A pass)*
