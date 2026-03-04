---
phase: research-overhaul
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/review.md
autonomous: true
requirements: [FN-06, TC-05]
must_haves:
  truths:
    - "review.md Steps 4 and 6 contain explicit Task() blocks — 4 for reviewers, 1 for synthesizer"
    - "review.md retains @gather-synthesize.md in required_reading as category-3 context reference"
    - "review.md Step 9 (re-review loop) uses the same Task() pattern for affected reviewers"
    - "All 5 Task() blocks use correct subagent_type values matching registered agent types"
  artifacts:
    - path: "get-shit-done/workflows/review.md"
      provides: "Rewritten Steps 4, 6, and 9 with explicit Task() spawns for reviewers and synthesizer"
  key_links:
    - from: "review.md Step 4 reviewer Task() blocks"
      to: "feature_dir/review/{dimension}-trace.md"
      via: "4 parallel Task() calls, each writing to a trace file"
      pattern: "Same Task() structure as plan.md Step 5 gatherers"
    - from: "review.md Step 6 synthesizer Task()"
      to: "feature_dir/review/synthesis.md"
      via: "Single Task() call after all reviewers complete"
      pattern: "Synthesizer reads all trace files + manifest, writes synthesis"
---

<objective>
Rewrite review.md to replace the ambiguous @gather-synthesize.md delegation with explicit Task() blocks for 4 reviewers + 1 synthesizer, matching the pattern established in plan.md Step 5 and framing-pipeline.md Stage 1.

Purpose: review.md has the same anti-pattern as the research callers — it describes spawning with prose ("Spawn ALL 4 simultaneously") instead of explicit Task() pseudo-code. The model can shortcut this the same way it shortcuts research delegation. The fix is the same: explicit Task() blocks with prompt, subagent_type, model, and description. The @gather-synthesize.md in required_reading is correct (category 3 — pattern reference) and stays.

Output: Modified get-shit-done/workflows/review.md with explicit Task() blocks in Steps 4, 6, and 9.
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/RESEARCH.md

<interfaces>
<!-- Task() block pattern (established in plan.md Step 5) -->
Task(
  prompt="First, read {agent_path} for your role.\n\n<subject>{subject}</subject>\n\n{context_payload}\n\n<task_context>{dimension-specific instructions}\nWrite to: {output_path}</task_context>",
  subagent_type="{agent_slug}",
  model="sonnet",
  description="{description}"
)

<!-- Reviewer agent slugs and output paths (from review.md Step 4) -->
gsd-review-enduser       -> agents/gsd-review-enduser.md       -> review/enduser-trace.md
gsd-review-functional    -> agents/gsd-review-functional.md    -> review/functional-trace.md
gsd-review-technical     -> agents/gsd-review-technical.md     -> review/technical-trace.md
gsd-universal-quality-reviewer -> agents/gsd-review-quality.md -> review/quality-trace.md

<!-- Synthesizer -->
gsd-review-synthesizer   -> agents/gsd-review-synthesizer.md   -> review/synthesis.md

<!-- Note: quality reviewer subagent_type differs from file name -->
<!-- subagent_type: gsd-universal-quality-reviewer -->
<!-- agent file: agents/gsd-review-quality.md -->

<!-- Current review.md required_reading (line 6-8) — the anti-pattern: -->
<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<!-- Current review.md Step 4 (lines 46-56) — ambiguous prose: -->
Define gatherers:
- agents/gsd-review-enduser.md -> {feature_dir}/review/enduser-trace.md
- agents/gsd-review-functional.md -> {feature_dir}/review/functional-trace.md
- agents/gsd-review-technical.md -> {feature_dir}/review/technical-trace.md
- agents/gsd-review-quality.md -> {feature_dir}/review/quality-trace.md
Per reviewer prompt: read agent file, subject, context payload, dimension name, feature artifacts list, requirement IDs, output path.
Spawn ALL 4 simultaneously. Wait for all to complete.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add explicit Task() blocks to review.md Steps 4, 6, and 9</name>
  <reqs>FN-06, TC-05</reqs>
  <files>get-shit-done/workflows/review.md</files>
  <action>
  Read review.md in full first. Then make these targeted edits:

  **required_reading block (lines 6-8):**
  Keep as-is. The @gather-synthesize.md reference is category 3 (context reference) — the model reads it to understand the pattern. This is correct usage.

  **Step 4 "Spawn 4 Reviewers in Parallel" (lines 46-56):**
  Replace the current prose with explicit Task() blocks. Keep the section header. Replace everything from "Define gatherers:" through "Wait for all to complete." with:

  ```markdown
  Assemble context payload (read each path, embed content):
  ```
  <core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
  <capability_context>{contents of CAPABILITY.md}</capability_context>
  <feature_context>{contents of FEATURE.md with EU/FN/TC requirements}</feature_context>
  <review_context>
  Lens: {LENS}
  Anchor questions: {GSD_ROOT}/get-shit-done/framings/{LENS}/anchor-questions.md
  Feature artifacts: {artifact list from Step 3}
  Requirement IDs: {EU-xx, FN-xx, TC-xx from FEATURE.md}
  </review_context>
  ```

  Spawn all 4 reviewers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-review-enduser.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: End-User\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/enduser-trace.md</task_context>",
    subagent_type="gsd-review-enduser",
    model="sonnet",
    description="Review End-User for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-review-functional.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Functional\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/functional-trace.md</task_context>",
    subagent_type="gsd-review-functional",
    model="sonnet",
    description="Review Functional for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-review-technical.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Technical\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/technical-trace.md</task_context>",
    subagent_type="gsd-review-technical",
    model="sonnet",
    description="Review Technical for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-review-quality.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Quality\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/quality-trace.md</task_context>",
    subagent_type="gsd-universal-quality-reviewer",
    model="sonnet",
    description="Review Quality for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  Wait for ALL 4 reviewers to complete.
  ```

  **Step 6 "Synthesize" (lines 67-69):**
  Replace the current prose with an explicit Task() block:

  ```markdown
  ## 6. Synthesize

  Build reviewer manifest listing each dimension and its status (success | failed).

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-review-synthesizer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Review phase complete. Consolidate the following reviewer trace reports.\n\nReviewer outputs:\n- End-User: {feature_dir}/review/enduser-trace.md [{status}]\n- Functional: {feature_dir}/review/functional-trace.md [{status}]\n- Technical: {feature_dir}/review/technical-trace.md [{status}]\n- Quality: {feature_dir}/review/quality-trace.md [{status}]\n\nConflict priority: end-user > functional > technical > quality\n\nWrite your synthesis to: {feature_dir}/review/synthesis.md\n\nIf any reviewer has status \"failed\", document the gap — do not fabricate findings for missing dimensions.</task_context>",
    subagent_type="gsd-review-synthesizer",
    model="inherit",
    description="Synthesize Review for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  If synthesis output missing: error.
  ```

  **Step 9 "Re-Review Loop" (lines 90-94):**
  Update the re-spawn description to reference the Task() pattern:

  ```markdown
  ## 9. Re-Review Loop

  Check `re_review_cycle < max_re_review_cycles` (2).

  If accepted findings AND cycles remaining: re-spawn only affected reviewers using the same Task() blocks from Step 4 (same prompt structure, same subagent_types). Always re-run synthesizer via Step 6 Task() block after affected reviewers complete. Present any new/changed findings (same Q&A). If max reached: surface remaining for manual resolution.
  ```

  Do not modify Steps 1-3, 7-8, 10-12. Those handle initialization, artifact location, finding presentation, decision logging, completion, and auto-advance — all unrelated to the spawn pattern fix.
  </action>
  <verify>
    <automated>grep -c "Task(" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md</automated>
  </verify>
  <done>
  - review.md Step 4 contains "Task(" at least 4 times (4 reviewers)
  - review.md Step 6 contains "Task(" at least 1 time (synthesizer)
  - review.md Step 6 synthesizer uses subagent_type="gsd-review-synthesizer" and model="inherit"
  - review.md Step 4 quality reviewer uses subagent_type="gsd-universal-quality-reviewer" (not "gsd-review-quality")
  - review.md Step 9 references "same Task() blocks from Step 4"
  </done>
</task>

</tasks>

<verification>
After task completes:
1. grep -c "Task(" get-shit-done/workflows/review.md -- should return >= 5 (4 reviewers + 1 synthesizer)
2. grep -n "gather-synthesize" get-shit-done/workflows/review.md -- only in required_reading (category 3, correct)
3. grep -n "gsd-universal-quality-reviewer" get-shit-done/workflows/review.md -- present in Step 4 quality reviewer Task()
4. grep -n "gsd-review-synthesizer" get-shit-done/workflows/review.md -- present in Step 6
5. grep -n "model=\"inherit\"" get-shit-done/workflows/review.md -- synthesizer uses inherit (judge role)
6. Spot-check: Steps 7-12 (Q&A, decisions, completion, auto-advance) are unchanged
</verification>

<success_criteria>
- review.md @gather-synthesize.md in required_reading retained (category 3 — context reference, correct usage)
- review.md Step 4 has 4 explicit reviewer Task() blocks with correct subagent_types
- review.md Step 6 has 1 explicit synthesizer Task() block
- All reviewer Task() blocks use model="sonnet" (executor role)
- Synthesizer Task() block uses model="inherit" (judge role)
- Quality reviewer uses subagent_type="gsd-universal-quality-reviewer" (matches registration, not file name)
- Re-review loop (Step 9) references the same Task() pattern
- Steps 1-3, 7-8, 10-12 are untouched
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/research-overhaul/04-SUMMARY.md`
</output>
