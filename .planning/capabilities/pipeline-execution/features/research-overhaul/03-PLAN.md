---
phase: research-overhaul
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/capability-orchestrator.md
  - get-shit-done/workflows/framing-discovery.md
  - get-shit-done/workflows/review.md
  - get-shit-done/workflows/execute.md
  - get-shit-done/workflows/doc.md
  - .planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md
autonomous: true
requirements: [FN-05, TC-04]
must_haves:
  truths:
    - "Every @{GSD_ROOT}/workflows/*.md reference across all workflow files is enumerated and classified"
    - "Zero category-1 instances exist after classification (plan.md and framing-pipeline.md are fixed in Plans 01/02; this plan confirms no others exist)"
    - "Category-2 and category-3 instances are documented in FEATURE.md Decisions section with disposition"
  artifacts:
    - path: ".planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md"
      provides: "Decisions section updated with @workflow.md audit results: full enumeration, classification, and disposition for every instance found"
  key_links:
    - from: "audit enumeration"
      to: "FEATURE.md Decisions section"
      via: "Classification table with category, file, line, pattern, disposition"
      pattern: "Category 1 = parallel agent spawn (fix); Category 2 = sequential handoff (document); Category 3 = context reference inside Task() (correct)"
---

<objective>
Audit all workflows/*.md files for @{GSD_ROOT}/workflows/*.md delegation instances. Classify each as category 1 (parallel agent spawn bug), category 2 (sequential workflow handoff), or category 3 (context reference inside Task() prompt). Document all findings in FEATURE.md Decisions section. Confirm no category-1 instances exist beyond those fixed in Plans 01 and 02.

Purpose: FN-05 requires enumeration and classification of the full anti-pattern surface area. Plans 01 and 02 fix the known category-1 instances. This plan verifies no others were missed and documents the non-bug instances for future evaluation.

Output: Updated FEATURE.md Decisions section with audit classification table. No workflow file modifications unless an unknown category-1 instance is discovered (handled inline if found).
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/RESEARCH.md

<interfaces>
<!-- Classification criteria (TC-04): -->
Category 1 (parallel agent spawn = bug):
  - The calling context needs multiple agents spawned simultaneously
  - Current pattern delegates to another workflow that handles spawning
  - Fix: inline Task() blocks
  - Known instances: plan.md Step 5 (fixed in Plan 01), framing-pipeline.md Stage 1 (fixed in Plan 02)

Category 2 (sequential handoff):
  - The calling context hands off to another workflow for the next pipeline phase
  - Model reads the referenced workflow inline and continues
  - Risk: lower than category 1 (no parallel spawning needed), but model could still shortcut
  - Known instances: framing-pipeline stages 3-6, capability-orchestrator, framing-discovery -> framing-pipeline

Category 3 (context reference):
  - The @ reference appears inside a Task() prompt or as required_reading
  - This is correct — agent needs to read the file
  - Known instances: execute.md (@ inside Task() prompts), required_reading blocks

<!-- Grep command to find all instances: -->
grep -rn "@{GSD_ROOT}/get-shit-done/workflows/" get-shit-done/workflows/
grep -rn "@.*workflows/.*\.md" get-shit-done/workflows/

<!-- Files to audit (all workflows): -->
get-shit-done/workflows/capability-orchestrator.md
get-shit-done/workflows/framing-discovery.md
get-shit-done/workflows/framing-pipeline.md  (after Plan 02: Stage 1 fixed, stages 3-6 remain)
get-shit-done/workflows/plan.md              (after Plan 01: Step 5 fixed)
get-shit-done/workflows/execute.md
get-shit-done/workflows/review.md
get-shit-done/workflows/doc.md
get-shit-done/workflows/research-workflow.md (invariant -- read to classify its @gather-synthesize ref)
get-shit-done/workflows/gather-synthesize.md (invariant)
get-shit-done/workflows/execute-plan.md
get-shit-done/workflows/progress.md
get-shit-done/workflows/resume-work.md
get-shit-done/workflows/init-project.md
get-shit-done/workflows/discuss-capability.md
get-shit-done/workflows/discuss-feature.md
get-shit-done/workflows/focus.md
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Grep all workflows for @workflow.md references and classify each instance</name>
  <reqs>FN-05, TC-04</reqs>
  <files>.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md</files>
  <action>
  **Step 1: Enumerate all instances.**

  Run grep across all workflow files:
  ```bash
  grep -rn "@.*workflows/.*\.md\|@{GSD_ROOT}/get-shit-done/workflows" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/
  ```

  Also check for bare @workflow patterns without the full path:
  ```bash
  grep -rn "^@\|^\`\`\`\n@\|Invoke @\| @{" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/
  ```

  Record every match: file, line number, the full @reference, surrounding context (2 lines before and after).

  **Step 2: Classify each instance.**

  For each match, read the surrounding context to determine:

  - Is this inside a `Task(prompt=...)` block or `required_reading` block? -> Category 3 (correct usage)
  - Is this a standalone delegation where the calling context needs parallel agents spawned? -> Category 1 (bug)
  - Is this a standalone delegation where the calling context is handing off to the next pipeline stage (sequential, single-context continuation)? -> Category 2 (sequential handoff, lower risk)

  Apply TC-04 classification criteria strictly. When uncertain, read the surrounding workflow section for intent.

  **Step 3: Verify Plan 01 and Plan 02 fixed all category-1 instances.**

  After classifying, confirm:
  - plan.md: no category-1 instances remain (Step 5 fixed by Plan 01)
  - framing-pipeline.md: no category-1 instances remain in Stage 1 (fixed by Plan 02)
  - If any NEW category-1 instance is found in another workflow file: fix it inline now using the same Task() block pattern. Document what was found and fixed.

  **Step 4: Write audit results to FEATURE.md Decisions section.**

  Open FEATURE.md and append to the existing Decisions section (do not replace existing decisions — add a new entry):

  ```markdown
  ## @workflow.md Audit Results (FN-05, TC-04)

  **Date:** {today}
  **Files scanned:** {count} workflow files
  **Total @workflow.md references found:** {total count}

  ### Classification Table

  | File | Line | Reference | Category | Disposition |
  |------|------|-----------|----------|-------------|
  | plan.md | {line} | @research-workflow.md | 1 — parallel spawn | FIXED by Plan 01 |
  | framing-pipeline.md | {line} | @research-workflow.md | 1 — parallel spawn | FIXED by Plan 02 |
  | framing-pipeline.md | {line} | @plan.md | 2 — sequential handoff | Document only. Stage 3 hands off to plan workflow. Model reads inline and continues. No parallel spawning needed. |
  | framing-pipeline.md | {line} | @execute.md | 2 — sequential handoff | Document only. Stage 4 sequential handoff. |
  | framing-pipeline.md | {line} | @review.md | 2 — sequential handoff | Document only. Stage 5 sequential handoff. |
  | framing-pipeline.md | {line} | @doc.md | 2 — sequential handoff | Document only. Stage 6 sequential handoff. |
  | capability-orchestrator.md | {line} | @framing-pipeline.md | 2 — sequential handoff | Document only. Orchestrator invokes framing-pipeline per feature in sequence. |
  | framing-discovery.md | {line} | @framing-pipeline.md | 2 — sequential handoff | Document only. Discovery hands off to pipeline after brief finalization. |
  | {any execute.md or review.md refs} | {line} | {ref} | 3 — context ref | Correct usage. @ref inside Task() prompt. No action. |
  | {additional rows for all other instances found} | | | | |

  ### Summary

  - Category 1 (bugs): {count} found, all fixed (Plan 01 + Plan 02{+ any inline fixes})
  - Category 2 (sequential handoffs): {count} instances. Documented. Lower risk — no parallel spawn needed. Evaluate for reliability separately if needed.
  - Category 3 (correct usage): {count} instances. No action.

  ### Follow-up Items

  - review.md uses same gather-synthesize delegation pattern as research (4 reviewers). Same category-1 risk if review.md delegates to gather-synthesize.md without explicit Task() blocks. Evaluate as separate feature.
  - Category-2 sequential handoffs: evaluate reliability of model inline-read behavior for framing-pipeline stages 3-6 in a separate feature if shortcutting is observed.
  ```

  Fill in actual line numbers, actual reference text, and actual counts from the grep results. The template rows above are examples based on RESEARCH.md findings — replace with actual grep output. Add rows for any instances not listed in the template.

  If any category-1 instances were found and fixed inline in Step 3, add those workflow files to the `files_modified` list in this plan's frontmatter (note: frontmatter is already written; document the inline fix in the SUMMARY.md).
  </action>
  <verify>
    <automated>grep -c "Category 1\|Category 2\|Category 3\|parallel spawn\|sequential handoff\|context ref" /Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md</automated>
  </verify>
  <done>
  - FEATURE.md Decisions section contains the @workflow.md audit classification table
  - Table has at least one row per instance found by grep (minimum: the known instances from RESEARCH.md)
  - Category 1 count is 0 remaining after Plans 01, 02, and any inline fixes (all category-1 bugs resolved)
  - Category 2 and 3 instances are documented with explicit disposition
  - grep of workflows/ for any unfixed "Invoke @" research delegation pattern returns zero matches
  </done>
</task>

</tasks>

<verification>
After task completes:
1. grep -rn "Invoke @.*research-workflow\|Invoke @.*gather-synthesize" get-shit-done/workflows/ -- zero matches (no remaining category-1 research delegation)
2. FEATURE.md Decisions section contains a table with "Category" column and at least 8 rows (known instances from RESEARCH.md)
3. grep -n "Category 1" .planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md -- all rows show "FIXED" disposition
4. Spot-check: read the rows for framing-pipeline.md stages 3-6 in the classification table -- should be Category 2 with "Document only" disposition
</verification>

<success_criteria>
- All @workflow.md references in all workflow files are enumerated (no unscanned files)
- Every instance is classified as category 1, 2, or 3 per TC-04 criteria
- Zero category-1 instances remain unfixed across the entire workflows/ directory
- Category-2 and category-3 instances are documented in FEATURE.md Decisions with explicit disposition
- review.md gather-synthesize delegation is called out as a follow-up item (out of scope for this feature)
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/research-overhaul/03-SUMMARY.md`
</output>
