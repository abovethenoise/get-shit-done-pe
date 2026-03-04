---
phase: pipeline-execution/scope-aware-routing
plan: "01"
wave: 1
depends_on: []
files_modified:
  - commands/gsd/enhance.md
  - commands/gsd/debug.md
  - commands/gsd/refactor.md
autonomous: true
requirements:
  - EU-01
  - FN-01
  - FN-04
  - TC-01
must_haves:
  - enhance.md <process> block resolves slug first, branches capability -> capability-orchestrator (LENS=enhance), feature -> framing-discovery (current behavior)
  - debug.md <process> block resolves slug first, branches capability -> capability-orchestrator (LENS=debug), feature -> framing-discovery (current behavior)
  - refactor.md <process> block resolves slug first, branches capability -> capability-orchestrator (LENS=refactor), feature -> framing-discovery (current behavior)
  - Ambiguous resolution presents candidates via AskUserQuestion in all 3 commands
  - no_match in all 3 commands shows error + suggests /gsd:status (not create-new)
  - Existing feature-level framing-discovery invocation is preserved exactly as-is in the feature branch
---

# Plan 01: Routing branch for enhance, debug, refactor

## Objective

Add capability-vs-feature routing to the three non-new lens commands (enhance, debug, refactor). Each command currently passes everything to framing-discovery. This plan restructures each command's `<process>` block to resolve slug type first, then branch to capability-orchestrator (capability) or framing-discovery (feature). Pattern mirrors `/gsd:execute` exactly.

## Context

@/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/RESEARCH.md

## Tasks

<task name="update-enhance-routing">
  <files>
    commands/gsd/enhance.md
  </files>
  <action>
Restructure the `<process>` block in `commands/gsd/enhance.md`. Replace the single-step framing-discovery delegation with a 3-step routing pattern that mirrors `commands/gsd/execute.md`.

**New `<process>` block structure:**

```
## 1. Resolve Slug

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```

Parse JSON result for: `resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `full_path`, `candidates`, `reason`.

## 2. Handle Resolution Result

**If resolved and type is "feature":**
- Invoke framing-discovery.md with LENS=enhance and CAPABILITY_SLUG (derived from feature path)
- Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback)

**If resolved and type is "capability":**
- Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=enhance
- The orchestrator will fan out to all features in DAG wave order

**If not resolved and reason is "ambiguous":**
- Use AskUserQuestion:
  - header: "Multiple Matches"
  - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
  - options: list each candidate with type and full_path
- Re-resolve with the selected candidate

**If not resolved and reason is "no_match":**
- Display error: "No capability or feature matches '$ARGUMENTS'."
- Suggest: "Run /gsd:status to see available capabilities and features."
- Stop.

## 3. Workflow Invocation

For **feature-level:**
```
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
```
Pass: LENS=enhance, CAPABILITY_SLUG (from resolution)

For **capability-level:**
```
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
```
Pass: CAPABILITY_SLUG, LENS=enhance
```

Also add `capability-orchestrator.md` to the `<execution_context>` block alongside the existing `framing-discovery.md` reference.

Update `<success_criteria>` to include:
- Slug resolved via 3-tier resolution
- Correct routing: capability -> orchestrator, feature -> framing-discovery
- Ambiguous matches presented for user selection
- No-match handled with error + /gsd:status suggestion
  </action>
  <verify>
Read the updated `commands/gsd/enhance.md`. Confirm:
1. `<execution_context>` includes both `framing-discovery.md` and `capability-orchestrator.md`
2. `<process>` block has Steps 1, 2, 3
3. Step 1 runs `slug-resolve $ARGUMENTS`
4. Step 2 has all 4 branches: feature, capability, ambiguous, no_match
5. capability branch invokes capability-orchestrator with LENS=enhance
6. feature branch preserves framing-discovery delegation and all workflow gates
7. no_match branch errors and suggests /gsd:status (does NOT offer to create new)
8. Step 3 shows both workflow invocations with correct LENS
  </verify>
  <done>enhance.md <process> block is a 3-step routing pattern; capability branch invokes orchestrator with LENS=enhance; feature branch invokes framing-discovery as before; ambiguous + no_match branches present</done>
  <reqs>EU-01, FN-01, FN-04, TC-01</reqs>
</task>

<task name="update-debug-routing">
  <files>
    commands/gsd/debug.md
  </files>
  <action>
Apply the identical routing restructure to `commands/gsd/debug.md`. The only difference from enhance.md is LENS=debug everywhere.

Follow the exact same steps as the enhance.md task above:
1. Add `capability-orchestrator.md` to `<execution_context>`
2. Replace `<process>` with the 3-step routing pattern (Steps 1/2/3)
3. In Step 2 feature branch: invoke framing-discovery.md with LENS=debug, preserve all workflow gates
4. In Step 2 capability branch: invoke capability-orchestrator with CAPABILITY_SLUG and LENS=debug
5. In Step 2 no_match branch: error + suggest /gsd:status
6. In Step 3: show both invocations with LENS=debug
7. Update `<success_criteria>` to match enhance.md pattern
  </action>
  <verify>
Read the updated `commands/gsd/debug.md`. Confirm:
1. `<execution_context>` includes both `framing-discovery.md` and `capability-orchestrator.md`
2. `<process>` block has Steps 1, 2, 3
3. capability branch passes LENS=debug to orchestrator
4. feature branch preserves framing-discovery with LENS=debug and all workflow gates
5. no_match branch errors and suggests /gsd:status
  </verify>
  <done>debug.md <process> block restructured with 3-step routing; LENS=debug throughout; no capability-level logic existed before, now it does</done>
  <reqs>EU-01, FN-01, FN-04, TC-01</reqs>
</task>

<task name="update-refactor-routing">
  <files>
    commands/gsd/refactor.md
  </files>
  <action>
Apply the identical routing restructure to `commands/gsd/refactor.md`. The only difference from enhance.md is LENS=refactor everywhere.

Follow the exact same steps as the enhance.md task above:
1. Add `capability-orchestrator.md` to `<execution_context>`
2. Replace `<process>` with the 3-step routing pattern (Steps 1/2/3)
3. In Step 2 feature branch: invoke framing-discovery.md with LENS=refactor, preserve all workflow gates
4. In Step 2 capability branch: invoke capability-orchestrator with CAPABILITY_SLUG and LENS=refactor
5. In Step 2 no_match branch: error + suggest /gsd:status
6. In Step 3: show both invocations with LENS=refactor
7. Update `<success_criteria>` to match enhance.md pattern
  </action>
  <verify>
Read the updated `commands/gsd/refactor.md`. Confirm:
1. `<execution_context>` includes both `framing-discovery.md` and `capability-orchestrator.md`
2. `<process>` block has Steps 1, 2, 3
3. capability branch passes LENS=refactor to orchestrator
4. feature branch preserves framing-discovery with LENS=refactor and all workflow gates
5. no_match branch errors and suggests /gsd:status
  </verify>
  <done>refactor.md <process> block restructured with 3-step routing; LENS=refactor throughout</done>
  <reqs>EU-01, FN-01, FN-04, TC-01</reqs>
</task>

## Verification

After all 3 tasks complete, cross-check all 3 updated files against `commands/gsd/execute.md` as the reference implementation. Confirm:
- The routing structure is identical in shape to execute.md (3 steps, 4 branches in Step 2)
- Each command's LENS value is correct and consistent throughout its process block
- No framing-discovery invocation was removed (it becomes the feature-level branch)
- The `<objective>` block still references both capability and feature level as this command's scope

## Success Criteria

- [ ] enhance.md: capability branch routes to capability-orchestrator with LENS=enhance
- [ ] enhance.md: feature branch invokes framing-discovery (preserved from original)
- [ ] debug.md: capability branch routes to capability-orchestrator with LENS=debug
- [ ] debug.md: feature branch invokes framing-discovery (preserved from original)
- [ ] refactor.md: capability branch routes to capability-orchestrator with LENS=refactor
- [ ] refactor.md: feature branch invokes framing-discovery (preserved from original)
- [ ] All 3 commands: ambiguous resolution → AskUserQuestion with candidates
- [ ] All 3 commands: no_match → error message + /gsd:status suggestion (not create-new)
