# Phase 13: Findings

**Date:** 2026-03-02
**Scenarios completed:** 2/13

## Summary
- Total findings: 11
- Fixed inline: 0
- Open for triage: 11
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

### From Targeted Sweep

| # | Pattern | Location | Description | Status | Triage |
|---|---------|----------|-------------|--------|--------|
| *(none yet -- sweep in Plan 06)* | | | | | |

## Triage Results
*(After human Q&A pass)*
