# Phase 11: Friction Log

**Date:** 2026-03-01
**Scope:** Full v2 pipeline verification — @file scan, CLI smoke tests, E2E simulation

## Summary

- Total findings: 8
- Blockers: 0
- Friction: 4
- Cosmetic: 4

## Findings

### Blockers

None.

### Friction

| # | Finding | Source | Location | Impact | Recommendation |
|---|---------|--------|----------|--------|----------------|
| F1 | `/gsd:new-project` doesn't exist — should be `/gsd:new` | cross-ref + E2E | commands/gsd/init.md:34 | Users following init after-text hit nonexistent command | Fix now |
| F2 | `/gsd:new-project` ref in init-project.md workflow | cross-ref + E2E | get-shit-done/workflows/init-project.md:362 | Workflow output points to nonexistent command | Fix now |
| F3 | `/gsd:new-project` ref in plan.md error message | cross-ref + E2E | get-shit-done/workflows/plan.md:25 | Error message directs to nonexistent command | Fix now |
| F4 | `/gsd:discuss-phase` in research.md template | cross-ref | get-shit-done/templates/research.md:21 | Template references dead v1 command | Fix now |

### Cosmetic

| # | Finding | Source | Location | Impact | Recommendation |
|---|---------|--------|----------|--------|----------------|
| C1 | `/gsd:verify-work` ref in UAT template | cross-ref | get-shit-done/templates/UAT.md:139 | Template for UAT references dead command | Fix now |
| C2 | `/gsd:verify-work` ref in VALIDATION template | cross-ref | get-shit-done/templates/VALIDATION.md:32 | Template for validation references dead command | Fix now |
| C3 | CMD-01 lists 11 commands but only 9 exist — `plan` and `review` are pipeline-internal | cross-ref | REQUIREMENTS.md CMD-01 | Documentation count mismatch | Accept as-is |
| C4 | `feature-op` route accepts no args silently (returns nulls) instead of erroring | E2E | gsd-tools.cjs feature-op handler | Inconsistent with plan-feature/execute-feature validation | Defer to Phase 12 |

## Auto-Fixes Applied

None — Plan 01 found no renames needed. All 64 @file references resolve correctly.

## @file Reference Scan Summary

- 66 total refs scanned (64 real, 2 false positives)
- 64/64 resolved — **100% resolution rate**
- 0 auto-fixes needed
- 0 unresolved references

## CLI Smoke Test Summary

- 21 routes tested: 19 PASS, 2 WARN, 0 FAIL
- All 13 live init routes return exit 0 + valid JSON
- All 3 dead routes return graceful error messages
- All 5 atomic routes functional
- WARNs were routes needing positional args (clear error messages, not bugs)

## E2E Simulation Narrative

Ran full v2 pipeline on a synthetic todo-app project with one capability and one feature:

1. **New project detection** — clean. Empty dir → `detected_mode: "new"`.
2. **Scaffolding** — manual setup of STATE.md, ROADMAP.md, REQUIREMENTS.md, capabilities/. Simulates what `/gsd:init` produces.
3. **Framing discovery** — all lenses work (tested `new`). Anchor questions loaded, capability list populated, MVU slots present.
4. **Discuss flows** — both discuss-capability and discuss-feature return correct context with capability/feature trees.
5. **Plan + Execute** — init routes return correct planning/execution context. Model config propagates from config.json.
6. **Progress + Resume** — both functional. Progress returns v1-style phase data (empty) since v2 uses capabilities.

**Overall:** The CLI layer is solid. Every init route produces the JSON shape its consuming command expects. The only issues are text references to nonexistent commands in templates and workflow output text.

## Command Count Reconciliation

CMD-01 lists 11 commands: init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review.

9 command files exist in `commands/gsd/`. The 2 "missing" (`plan`, `review`) are pipeline-internal stages invoked by `framing-pipeline.md` — not user-facing commands. `status` was renamed to `progress`, `resume` to `resume-work`. The actual user-invokable count is 9.

## Recommendations Summary

| # | Action | Effort |
|---|--------|--------|
| F1-F3 | Replace `/gsd:new-project` → `/gsd:new` in 3 files | trivial |
| F4 | Replace `/gsd:discuss-phase` → `/gsd:discuss-capability` or `/gsd:discuss-feature` in research.md | trivial |
| C1-C2 | Remove or update `/gsd:verify-work` refs in UAT.md and VALIDATION.md | trivial |
| C3 | Accept — CMD-01 doc mismatch is cosmetic | none |
| C4 | Defer — feature-op null validation is minor CLI polish | Phase 12 |
