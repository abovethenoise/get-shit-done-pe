---
phase: pipeline-execution/doc-writer-overhaul
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/gsd/doc.md
  - get-shit-done/workflows/review.md
autonomous: true
requirements: [EU-02, EU-03, FN-04, TC-02]

must_haves:
  truths:
    - "/gsd:doc resolves slugs and invokes doc.md workflow at feature level and capability level"
    - "Capability-level invocation iterates features with review/synthesis.md artifacts inline — not via capability-orchestrator.md"
    - "No-arg invocation reads STATE.md session continuity to infer target feature"
    - "LENS defaults to 'enhance' for standalone; inferred from RESEARCH.md frontmatter lens: field when available"
    - "review.md Step 12 auto-chain passes LENS to doc.md workflow"
    - "/gsd:doc output format is identical whether standalone or pipeline-chained"
  artifacts:
    - path: "commands/gsd/doc.md"
      provides: "Standalone /gsd:doc skill entry point with slug-resolve, feature/capability routing, LENS inference"
    - path: "get-shit-done/workflows/review.md"
      provides: "Step 12 fix: LENS propagated to doc.md auto-chain invocation"
  key_links:
    - from: "commands/gsd/doc.md"
      to: "get-shit-done/workflows/doc.md"
      via: "workflow invocation with CAPABILITY_SLUG, FEATURE_SLUG, LENS"
      pattern: "@{GSD_ROOT}/get-shit-done/workflows/doc.md"
    - from: "review.md Step 12"
      to: "doc.md"
      via: "Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS"
      pattern: "LENS must be explicitly passed — not omitted"
---

<objective>
Create the /gsd:doc standalone skill command at commands/gsd/doc.md. Fix review.md Step 12 auto-chain to pass LENS to doc.md.

Purpose: EU-02 requires /gsd:doc to work outside the pipeline. TC-02 specifies the slug-resolve -> route -> invoke pattern. The review.md Step 12 LENS omission is a hard constraint violation — explorers receive no emphasis context on the most common invocation path.

Output:
- commands/gsd/doc.md (new file)
- get-shit-done/workflows/review.md (Step 12 fix)
</objective>

<execution_context>
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/FEATURE.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/RESEARCH.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/review.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md

<interfaces>
<!-- Existing skill pattern: commands/gsd/review.md -> slug-resolve (--type feature) -> workflow invocation -->
<!-- Existing skill pattern: commands/gsd/plan.md -> slug-resolve (no type hint) -> feature or capability routing -->
<!-- /gsd:doc accepts: no arg, feature slug, or capability slug -->
<!-- gsd-tools slug-resolve: returns resolved, tier, type (feature|capability), capability_slug, feature_slug, full_path, candidates, reason -->
<!-- Capability-level gate: {feature_dir}/review/synthesis.md must exist -->
<!-- LENS inference chain: pipeline context -> RESEARCH.md frontmatter lens: field -> "enhance" default -->
<!-- review.md Step 12 current text: "Pass: CAPABILITY_SLUG, FEATURE_SLUG" -- missing LENS -->
<!-- STATE.md Session Continuity section contains "Stopped at:" and "Resume:" lines for no-arg inference -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create commands/gsd/doc.md skill with slug-resolve routing, LENS inference, and capability-level inline iteration</name>
  <reqs>EU-02, FN-04</reqs>
  <files>commands/gsd/doc.md</files>
  <action>
  Check if commands/gsd/doc.md exists. It does not exist — create it as a new file.

  Read commands/gsd/review.md and commands/gsd/plan.md to confirm the exact frontmatter and structural patterns to follow before writing.

  Create commands/gsd/doc.md with this content:

  ```markdown
  ---
  name: gsd:doc
  description: Generate documentation recommendations for a feature or capability
  argument-hint: "[<feature slug> | <capability slug>]"
  allowed-tools:
    - Read
    - Write
    - Bash
    - Glob
    - Grep
    - Task
  ---

  <objective>
  Generate documentation recommendations for a feature or capability. Supports standalone invocation (post-review, outside pipeline) and pipeline auto-chain. Routes by slug type — feature level runs doc for a single feature, capability level iterates all reviewed features.

  **Flow:** slug-resolve -> infer LENS -> route (feature | capability | no-arg) -> doc.md workflow
  </objective>

  <execution_context>
  @{GSD_ROOT}/get-shit-done/workflows/doc.md
  </execution_context>

  <context>
  **User reference:** $ARGUMENTS (optional -- feature slug, capability slug, or empty)

  Context resolved via `gsd-tools slug-resolve`. LENS inferred from context.
  </context>

  <process>

  ## 1. Resolve Slug

  **If $ARGUMENTS is non-empty:**

  ```bash
  RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
  ```

  Parse JSON result for: `resolved`, `type`, `capability_slug`, `feature_slug`, `candidates`, `reason`.

  **If $ARGUMENTS is empty:**
  Skip slug resolution. Go to Step 3 (no-arg path).

  ## 2. Handle Resolution Result

  **If resolved and type is "feature":**
  - Set CAPABILITY_SLUG and FEATURE_SLUG from resolution
  - Go to Step 4 (infer LENS) then Step 5 (feature-level invocation)

  **If resolved and type is "capability":**
  - Set CAPABILITY_SLUG from resolution
  - Go to Step 4 (infer LENS) then Step 6 (capability-level invocation)

  **If not resolved and reason is "ambiguous":**
  - Present candidates to user:
    "Multiple matches found for '$ARGUMENTS':"
    - List each candidate with type and full_path
  - Use AskUserQuestion to let user pick one
  - Re-resolve with the selected candidate

  **If not resolved and reason is "no_match":**
  - Inform user: "No capability or feature matches '$ARGUMENTS'. Check available features with `/gsd:status`."
  - Stop.

  ## 3. No-Arg Inference

  Read `.planning/STATE.md`. Look in the "Session Continuity" section for "Stopped at:" line.

  If "Stopped at:" references a feature (format: `{cap}/{feat} --`):
  - Extract capability_slug and feature_slug
  - Confirm with user via AskUserQuestion: "Inferred target: {cap}/{feat}. Proceed?" (Yes / Specify different target)
  - If Yes: go to Step 4 (infer LENS) then Step 5 (feature-level invocation)
  - If Specify: ask for slug, re-resolve via Step 1

  If "Stopped at:" does not reference a deterministic feature:
  - Use AskUserQuestion: "No recent feature detected. Provide a feature or capability slug to document:" (free text response)
  - Re-resolve via Step 1

  ## 4. Infer LENS

  LENS inference chain (stop at first match):

  1. **Pipeline context**: If LENS was passed as an input to this command (pipeline auto-chain from framing-pipeline), use it.
  2. **RESEARCH.md frontmatter**: Read `{feature_dir}/RESEARCH.md`. Check for `lens:` field in YAML frontmatter. Use its value if present and non-empty.
  3. **Default**: Use "enhance".

  Set LENS = result of inference.

  ## 5. Feature-Level Invocation

  ```
  @{GSD_ROOT}/get-shit-done/workflows/doc.md
  ```

  Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS

  ## 6. Capability-Level Invocation

  Read `{capability_dir}/CAPABILITY.md` features table to get all feature slugs for this capability.

  For each feature_slug in the features table:
  - Check if `{capability_dir}/features/{feature_slug}/review/synthesis.md` exists
  - If exists: include in run list
  - If not: skip (log: "Skipping {feature_slug} — no review artifacts")

  If run list is empty:
  - Inform user: "No reviewed features found in {capability_slug}. Run `/gsd:review {cap/feat}` first."
  - Stop.

  For each feature in run list (sequentially):
  ```
  @{GSD_ROOT}/get-shit-done/workflows/doc.md
  ```
  Pass: CAPABILITY_SLUG, FEATURE_SLUG={current feature}, LENS

  Display progress between features:
  ```
  GSD > DOCUMENTING: {capability_slug}/{feature_slug} ({N}/{total})
  ```

  </process>

  <success_criteria>
  - Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
  - Feature-level: doc.md invoked for single feature with LENS
  - Capability-level: doc.md invoked for each feature with review/synthesis.md, sequentially
  - No-arg: target inferred from STATE.md session continuity with user confirmation
  - LENS inferred from pipeline context -> RESEARCH.md frontmatter -> "enhance" default
  - Capability-level routing uses inline iteration (not capability-orchestrator.md)
  </success_criteria>
  ```
  </action>
  <verify>
    <automated>test -f /Users/philliphall/get-shit-done-pe/commands/gsd/doc.md && echo "EXISTS" || echo "MISSING"</automated>
    <automated>grep -n "slug-resolve\|LENS\|synthesis.md\|enhance" /Users/philliphall/get-shit-done-pe/commands/gsd/doc.md</automated>
    <automated>grep -n "capability-orchestrator" /Users/philliphall/get-shit-done-pe/commands/gsd/doc.md</automated>
  </verify>
  <done>
  - commands/gsd/doc.md exists
  - File contains slug-resolve call in Step 1
  - File contains LENS inference chain (pipeline context -> RESEARCH.md frontmatter -> "enhance") in Step 4
  - File contains capability-level iteration checking `review/synthesis.md` existence in Step 6
  - grep for "capability-orchestrator" returns 0 matches (inline iteration used, not orchestrator)
  - File contains "Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS" in Step 5 and Step 6
  </done>
</task>

<task type="auto">
  <name>Fix review.md Step 12 auto-chain to pass LENS to doc.md workflow invocation</name>
  <reqs>FN-04, TC-02</reqs>
  <files>get-shit-done/workflows/review.md</files>
  <action>
  Read get-shit-done/workflows/review.md in full before editing.

  Locate Step 12 (Auto-Advance). Find the lines that auto-invoke the doc workflow:

  Current text (in the "If 0 blocker/major findings remaining" and "If deferred findings but no blockers" branches):
  ```
  - Auto-invoke doc workflow: `@{GSD_ROOT}/get-shit-done/workflows/doc.md`
  - Pass: CAPABILITY_SLUG, FEATURE_SLUG
  ```

  Change both instances to:
  ```
  - Auto-invoke doc workflow: `@{GSD_ROOT}/get-shit-done/workflows/doc.md`
  - Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS
  ```

  This applies to ALL auto-advance branches in Step 12 that invoke doc.md (there are two: the clean branch and the deferred-but-no-blockers branch).

  Do not change any other part of review.md.
  </action>
  <verify>
    <automated>grep -n "Pass: CAPABILITY_SLUG, FEATURE_SLUG" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md</automated>
    <automated>grep -n "Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md</automated>
  </verify>
  <done>
  - grep for "Pass: CAPABILITY_SLUG, FEATURE_SLUG$" (without LENS) returns 0 matches in review.md
  - grep for "Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS" returns 2 matches (one per auto-advance branch)
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. Skill file exists and is well-formed:
   - `test -f commands/gsd/doc.md` succeeds
   - `grep -n "slug-resolve" commands/gsd/doc.md` returns 1 match (Step 1)
   - `grep -n "synthesis.md" commands/gsd/doc.md` returns 1 match (capability-level gate in Step 6)
   - `grep -n "enhance" commands/gsd/doc.md` returns at least 1 match (LENS default in Step 4)
   - `grep -n "capability-orchestrator" commands/gsd/doc.md` returns 0 matches

2. review.md LENS fix:
   - `grep -c "Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS" get-shit-done/workflows/review.md` returns 2
   - `grep -c "Pass: CAPABILITY_SLUG, FEATURE_SLUG$" get-shit-done/workflows/review.md` returns 0

3. Pattern consistency: `diff <(grep "Pass:" commands/gsd/review.md) <(grep "Pass:" get-shit-done/workflows/review.md)` — review.md skill and review.md workflow now consistent on LENS.
</verification>

<success_criteria>
- /gsd:doc skill exists at commands/gsd/doc.md (EU-02, FN-04, TC-02)
- Skill handles feature slug, capability slug, and no-arg invocation paths (FN-04, TC-02)
- LENS inference chain implemented: pipeline context -> RESEARCH.md frontmatter -> "enhance" (EU-03, FN-04)
- Capability-level iteration uses inline loop checking review/synthesis.md gate, not capability-orchestrator.md (TC-02)
- review.md Step 12 all auto-advance branches pass LENS to doc.md (EU-03, TC-02)
- Output format is doc.md-driven (identical standalone vs pipeline-chained, per EU-02 AC)
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/02-SUMMARY.md`
</output>
