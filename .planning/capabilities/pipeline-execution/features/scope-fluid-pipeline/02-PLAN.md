---
phase: pipeline-execution/scope-fluid-pipeline
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/progress.md
autonomous: true
requirements: [FN-07, EU-03]
must_haves:
  truths:
    - "Progress reads active focus groups from ROADMAP.md and routes accordingly"
    - "Progress falls back to recent work continuation, then state scan when no focus groups"
    - "Progress presents concrete /gsd:* commands as next steps"
    - "Progress asks user when multiple parallel-safe paths exist"
    - "Progress never suggests 'add feature' when planning/execution is the next step"
  artifacts:
    - path: "get-shit-done/workflows/progress.md"
      provides: "Focus-aware routing with 3-tier fallback (focus groups -> recent work -> state scan)"
  key_links:
    - from: "get-shit-done/workflows/progress.md"
      to: ".planning/ROADMAP.md"
      via: "Focus group parsing"
      pattern: "ROADMAP"
    - from: "get-shit-done/workflows/progress.md"
      to: ".planning/STATE.md"
      via: "Session continuity and recent work"
      pattern: "STATE"
---

<objective>
Rewrite progress workflow with focus-aware routing: read active focus groups from ROADMAP.md, detect parallel-safe work, present concrete commands, and fall back gracefully when no focus groups exist.

Purpose: Progress currently guesses next actions from feature state with no focus group awareness. The rewrite makes it the intelligent routing layer it should be.
Output: Rewritten progress.md with 3-tier routing logic.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/FEATURE.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/RESEARCH.md

<interfaces>
Current progress.md init route:
  node gsd-tools.cjs init feature-progress
  Returns: project_exists, roadmap_exists, state_exists, capabilities, active_features, focus_groups, paths

Current routing table (to be replaced):
  PLANs without SUMMARYs -> Execute
  Feature complete, not reviewed -> Review
  Feature needs planning -> Plan
  All features in focus group complete -> Focus group done
  All capabilities complete -> Milestone complete
  Between focus groups -> Start next

ROADMAP.md focus group format:
  Focus groups listed in ROADMAP.md with feature lists and dependency edges
  STATE.md has "Current focus" as cosmetic text label (not managed by workflow)

Research gap (RESEARCH.md Low-Confidence):
  focus_groups from init is dead code -- never provided
  active_focus in STATE.md is singular, not array
  Parse ROADMAP.md directly instead of relying on init route
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Rewrite progress.md with focus-aware 3-tier routing</name>
  <reqs>FN-07, EU-03</reqs>
  <files>get-shit-done/workflows/progress.md</files>
  <action>
  Rewrite progress.md with the following routing logic:

  1. **Keep existing initialize and load_context steps** (CLI route calls for project state, roadmap, state snapshot). Keep existing report step (capability/feature tree, recent work, decisions, blockers).

  2. **Replace the route step entirely** with 3-tier focus-aware routing:

  **Tier 1 -- Focus Group Routing (primary):**
  - Parse ROADMAP.md directly for focus groups (do NOT rely on init `focus_groups` -- it's dead code per research findings)
  - For each active focus group: identify features and their pipeline state
  - Determine next actionable item per focus group using artifact-based detection:
    - Feature dirs with FEATURE.md but no PLANs -> needs planning -> `/gsd:plan {cap/feat}`
    - Feature dirs with PLANs but no SUMMARYs -> needs execution -> `/gsd:execute {cap/feat}`
    - Feature dirs with SUMMARYs but no review/ -> needs review -> `/gsd:review {cap/feat}`
    - Feature dirs with review/ but no doc-report.md -> needs doc -> `/gsd:doc {cap/feat}`
  - Detect parallel-safe work: features in different focus groups or independent within same group
  - If multiple parallel-safe paths: use AskUserQuestion to ask which to advance
  - If single clear next step: present concrete command

  **Tier 2 -- Recent Work Continuation (fallback when no focus groups):**
  - Read STATE.md Session Continuity section
  - Identify last active capability/feature
  - Determine its pipeline state using same artifact detection
  - Present concrete command to continue

  **Tier 3 -- State Scan (final fallback):**
  - Scan all capabilities/features under `.planning/capabilities/`
  - Find features with incomplete pipeline stages
  - Present prioritized list with concrete commands

  3. **Anti-pattern guards:**
  - NEVER suggest "add feature" or "discuss features" when a feature has FEATURE.md with requirements but no PLANs -- the next step is planning, not more discussion
  - NEVER suggest `/gsd:new` when existing features need execution
  - Always present the most progressing action (execute > plan > discuss)

  4. **Output format for routing:**
  ```
  ## What's Next

  **[Focus Group: {name}]** (if applicable)

  {cap}/{feat} is ready for {stage}.

  `/gsd:{command} {cap/feat}`

  <sub>/clear first for fresh context window</sub>
  ```

  If multiple parallel paths:
  ```
  ## What's Next

  Multiple paths available (parallel-safe):

  1. {cap}/{feat1} -- ready for {stage1}
     `/gsd:{command1} {cap/feat1}`

  2. {cap}/{feat2} -- ready for {stage2}
     `/gsd:{command2} {cap/feat2}`

  Which would you like to advance?
  ```

  5. **Dependency readiness check**: Keep the existing dependency check logic but use ROADMAP.md focus group dependency edges instead of inline DAG parsing. If a dependency is incomplete, warn and suggest completing it first.
  </action>
  <verify>
    <automated>grep -q "focus.*group\|ROADMAP" get-shit-done/workflows/progress.md</automated>
    <automated>grep -q "parallel.*safe\|ambiguous\|AskUser" get-shit-done/workflows/progress.md</automated>
    <automated>grep -c "add feature\|discuss features" get-shit-done/workflows/progress.md | xargs test 0 -eq || grep -q "NEVER.*add feature" get-shit-done/workflows/progress.md</automated>
  </verify>
  <done>progress.md has 3-tier routing (focus groups -> recent work -> state scan), detects parallel-safe work, presents concrete commands, and never suggests "add feature" when execution is the next step.</done>
</task>

</tasks>

<verification>
1. Progress reads ROADMAP.md focus groups directly (not dead init code)
2. 3-tier fallback: focus groups -> recent work -> state scan
3. Parallel-safe work detected and presented with user choice
4. Concrete `/gsd:*` commands in all routing outputs
5. Anti-pattern guards prevent unhelpful suggestions
</verification>

<success_criteria>
- Focus-aware routing replaces guess-based routing
- Artifact-based pipeline state detection (SUMMARY presence, review/ presence, etc.)
- User always gets a concrete next command
- Ambiguous paths prompt user choice instead of guessing
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/02-SUMMARY.md`
</output>
