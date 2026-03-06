---
phase: pipeline-execution/scope-fluid-pipeline
plan: 03
type: execute
wave: 2
depends_on: [01]
files_modified:
  - commands/gsd/review.md
  - get-shit-done/workflows/review.md
  - get-shit-done/workflows/doc.md
  - get-shit-done/workflows/execute.md
  - get-shit-done/workflows/framing-pipeline.md
autonomous: true
requirements: [FN-01, FN-02, FN-03, FN-08, TC-05, EU-01, EU-02]
must_haves:
  truths:
    - "/gsd:review accepts both capability and feature scope"
    - "review.md and doc.md process scope-fluid artifact lists (single-feature or multi-feature)"
    - "Execute auto-chains to review when running under pipeline control"
    - "Review auto-chains to doc when no blockers found"
    - "Human gates exist only at review findings Q&A and doc approval Q&A"
    - "Remediation loop: accepted findings -> planner -> remediation PLAN -> executor -> re-review (max 2 cycles)"
    - "Context exhaustion fallback presents next command to user"
  artifacts:
    - path: "commands/gsd/review.md"
      provides: "Scope-fluid review command (accepts capability or feature)"
    - path: "get-shit-done/workflows/review.md"
      provides: "Review workflow that processes execution-scope artifact lists"
    - path: "get-shit-done/workflows/execute.md"
      provides: "Execute workflow with clean return for pipeline auto-chain"
    - path: "get-shit-done/workflows/framing-pipeline.md"
      provides: "Auto-chain wiring and remediation loop"
  key_links:
    - from: "get-shit-done/workflows/framing-pipeline.md"
      to: "get-shit-done/workflows/execute.md"
      via: "Auto-chain: execute completion returns to pipeline"
      pattern: "execute.*complete\|return.*pipeline"
    - from: "get-shit-done/workflows/framing-pipeline.md"
      to: "get-shit-done/workflows/review.md"
      via: "Auto-chain: review invoked after execute returns"
      pattern: "review.*auto.*chain\|Stage.*Review"
    - from: "get-shit-done/workflows/review.md"
      to: "get-shit-done/workflows/doc.md"
      via: "Auto-chain: doc invoked after clean review"
      pattern: "doc.*auto.*chain\|Stage.*Doc"
---

<objective>
Wire scope-fluid review/doc, auto-chain execution, and remediation loop. Review and doc accept capability scope. Execute returns cleanly for pipeline auto-chain. Remediation loop handles accepted findings.

Purpose: Make the pipeline flow automatically from execute through doc with human gates only at judgment points.
Output: Updated review command, review/doc/execute workflows, framing-pipeline auto-chain wiring.
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
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/01-SUMMARY.md

<interfaces>
review.md current inputs: CAPABILITY_SLUG, FEATURE_SLUG, feature_dir
  - 4 reviewers (enduser, functional, technical, quality) spawn with artifact list
  - 1 synthesizer consolidates
  - Already scope-agnostic per research -- agents process whatever artifact list provided

doc.md current inputs: similar to review
  - 5 explorers + 1 synthesizer
  - Already scope-agnostic

execute.md current behavior (the gap):
  - "The workflow ends. The user decides next steps." (line 201)
  - When running under pipeline, should return cleanly instead of terminating
  - Research consensus: this is a design gap, not a bug

commands/gsd/review.md current constraint:
  - Line 34: slug-resolve with "--type feature" forces feature scope
  - doc.md already handles both scopes (line 37: no --type flag)

Auto-chain model (from FEATURE.md FN-08):
  plan -> execute (automatic)
  execute -> review (automatic, fix the gap)
  review (no blockers) -> doc (automatic)
  Human gates: review findings Q&A, doc approval Q&A
  Context exhaustion: present next command for user to run in fresh context

Remediation loop (from FEATURE.md FN-03):
  Accepted findings -> existing planner -> remediation PLAN.md
  Executed via existing executor
  Re-review at execution scope (max 2 cycles)
  Uses existing planning and execution patterns
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Scope-fluid review command and review/doc workflow artifact handling</name>
  <reqs>FN-01, FN-02, TC-05</reqs>
  <files>commands/gsd/review.md, get-shit-done/workflows/review.md, get-shit-done/workflows/doc.md</files>
  <action>
  1. **commands/gsd/review.md**: Remove `--type feature` from slug-resolve call (line 34). Change:
     ```
     RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS" --type feature)
     ```
     to:
     ```
     RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
     ```
     Add capability-scope handling block that matches the existing pattern in commands/gsd/doc.md:
     - If `type` is "capability": iterate all feature directories within the capability, collect SUMMARY.md and FEATURE.md paths from features that have been executed (SUMMARY.md present)
     - Pass the full artifact list to review.md workflow

  2. **get-shit-done/workflows/review.md**: Update the artifact collection step to handle both scopes:
     - If FEATURE_SLUG is provided (feature scope): collect artifacts from single feature directory (existing behavior)
     - If FEATURE_SLUG is null/empty (capability scope): scan all feature directories under the capability, collect SUMMARY.md + FEATURE.md from each feature that has SUMMARY.md present
     - Pass combined artifact list to all 4 reviewers
     - Update review synthesizer to note scope in output (capability-level or feature-level)
     - Add code-review ground truth framing: spec (FEATURE.md requirements) is ground truth for code review
     - Add cross-scope detection to quality reviewer context: cross-scope state conflicts, interface contract violations, conflicting assumptions, spec coverage gaps

  3. **get-shit-done/workflows/doc.md**: Same scope-fluid artifact handling:
     - If capability scope: collect code artifacts across all features in capability
     - Doc review ground truth: code (what was actually built) is ground truth
     - Doc aggregator framing: terminology inconsistency, orphaned docs, update priority order
  </action>
  <verify>
    <automated>grep -v "type feature" commands/gsd/review.md | grep -q "slug-resolve"</automated>
    <automated>grep -q "capability.*scope\|SCOPE\|capability_slug" get-shit-done/workflows/review.md</automated>
  </verify>
  <done>review command accepts both scopes. review.md and doc.md handle multi-feature artifact lists for capability scope. Ground truth framing added (spec for review, code for doc).</done>
</task>

<task type="auto">
  <name>Auto-chain wiring and remediation loop in execute.md and framing-pipeline.md</name>
  <reqs>FN-03, FN-08, EU-01, EU-02</reqs>
  <files>get-shit-done/workflows/execute.md, get-shit-done/workflows/framing-pipeline.md</files>
  <action>
  1. **execute.md -- clean return for pipeline auto-chain**:
     - In the `offer_next` step (lines 187-201), replace "The workflow ends. The user decides next steps." with:
       ```
       The workflow returns. If running under pipeline orchestration (framing-pipeline.md),
       the pipeline handles next-stage chaining. If running standalone (/gsd:execute),
       present next steps to user.
       ```
     - The standalone vs pipeline distinction: when execute.md is invoked by framing-pipeline.md, framing-pipeline owns the auto-chain. When invoked by commands/gsd/execute.md directly, the command file presents next steps. This requires NO code change to execute.md itself -- the framing-pipeline handles chaining by invoking review.md after execute.md returns. Execute.md just needs to NOT present "user decides" language that confuses the pipeline.
     - Remove the terminal "The workflow ends" language. Replace with completion output that works for both contexts.

  2. **framing-pipeline.md -- auto-chain wiring**:
     - In Stage 2 (Execute, formerly Stage 4): After execute.md completes, explicitly chain to Stage 3 (Review) WITHOUT user intervention. Add:
       ```
       After execute.md returns:
       - Check escalation signals
       - If clean: proceed directly to Stage 3 (Review) -- NO user gate here
       ```
     - In Stage 3 (Review): After review completes:
       - If no blockers: proceed directly to Stage 4 (Doc) -- NO user gate
       - If blockers found: human gate at review findings Q&A
     - Between Stage 3 and Stage 4: Add remediation loop (FN-03):
       ```
       REMEDIATION_COUNTER = 0
       After review Q&A, if user accepts findings for remediation:
         1. Feed accepted findings to planner (existing planning pattern)
         2. Planner produces remediation PLAN.md(s)
         3. Execute remediation plans via existing executor
         4. Increment REMEDIATION_COUNTER
         5. Re-review at execution scope
         6. If REMEDIATION_COUNTER >= 2: stop remediation loop, proceed to doc
         7. Else: repeat from Q&A
       ```
     - Add context exhaustion fallback to each stage transition:
       ```
       If context window is degraded (many stages already run):
         Present next command for user to run in fresh context:
         "Continue with: /gsd:review {cap/feat}" or "/gsd:doc {cap/feat}"
         Exit pipeline cleanly.
       ```

  3. **Human gates** -- ensure gates exist ONLY at:
     - Review findings Q&A (within review.md, already exists)
     - Doc approval Q&A (within doc.md, already exists)
     - NOT at plan->execute transition
     - NOT at execute->review transition
     - NOT at review->doc transition (when clean)
  </action>
  <verify>
    <automated>grep -q "remediation\|REMEDIATION" get-shit-done/workflows/framing-pipeline.md</automated>
    <automated>grep -q "auto.*chain\|proceed.*directly\|NO.*user.*gate\|without.*user.*intervention" get-shit-done/workflows/framing-pipeline.md</automated>
    <automated>grep -v "The workflow ends\. The user decides" get-shit-done/workflows/execute.md > /dev/null</automated>
  </verify>
  <done>Execute returns cleanly for pipeline chaining. framing-pipeline auto-chains execute->review->doc. Remediation loop with max 2 cycles. Context exhaustion presents next command. Human gates only at review Q&A and doc approval.</done>
</task>

</tasks>

<verification>
1. commands/gsd/review.md no longer forces `--type feature`
2. review.md and doc.md handle both capability and feature artifact lists
3. execute.md doesn't terminate with "user decides" -- returns cleanly
4. framing-pipeline.md auto-chains execute->review->doc
5. Remediation loop capped at 2 cycles
6. Human gates only at review findings Q&A and doc approval Q&A
7. Context exhaustion fallback presents concrete next command
</verification>

<success_criteria>
- Scope-fluid: review and doc match whatever was executed
- Auto-chain: execute -> review -> doc flows automatically
- Remediation: accepted findings -> plan -> execute -> re-review (max 2 cycles)
- Human gates: only at judgment points
- Graceful degradation on context exhaustion
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/03-SUMMARY.md`
</output>
