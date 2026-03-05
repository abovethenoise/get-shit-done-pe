---
phase: requirements-refinement/change-application
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - get-shit-done/workflows/change-application.md
autonomous: true
requirements:
  - EU-01
  - EU-02
  - FN-03
must_haves:
  truths:
    - "On mutation failure, execution halts immediately and user sees applied/failed/pending breakdown"
    - "User chooses from 3 options via AskUserQuestion: fix and resume, skip and continue, or abort"
    - "Fix-and-resume retries the failed entry (not the next entry)"
    - "Skip-and-continue marks the failed entry as SKIPPED and proceeds to next PENDING entry"
    - "Abort marks all remaining entries as PENDING and writes final EXECUTION-LOG.md"
    - "Skipped entries are logged in EXECUTION-LOG.md with SKIPPED status and reason"
    - "Stage banner and progress logging give the user visibility into what is happening"
    - "Completion summary shows all result counts and points to EXECUTION-LOG.md"
  artifacts:
    - path: "get-shit-done/workflows/change-application.md"
      provides: "Failure handling with AskUserQuestion user decision flow integrated into sequencer"
  key_links:
    - from: "get-shit-done/workflows/change-application.md"
      to: "AskUserQuestion"
      via: "Halt-on-failure decision prompt with 3 options"
      pattern: "AskUserQuestion"
---

<objective>
Add failure handling and user-facing experience to the change-application workflow.

Purpose: Replace the placeholder halt-on-failure from Plan 01 with the full git-rebase-style user decision flow (fix and resume, skip and continue, abort). Add stage banners, progress logging, and human-readable completion output.
Output: Updated get-shit-done/workflows/change-application.md with complete failure handling.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/change-application/FEATURE.md
@.planning/capabilities/requirements-refinement/features/change-application/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/change-application/01-SUMMARY.md

<interfaces>
<!-- AskUserQuestion constraints (from refinement-qa RESEARCH.md) -->
- header: max 12 characters
- 2-4 options
- Available in orchestrator context (not inside Task subagents)
- Empty response: retry once, then conversational fallback

<!-- Git rebase sequencer model (from RESEARCH.md consensus) -->
3 failure options map 1:1 to git rebase:
  fix-and-resume = git rebase --continue
  skip-and-continue = git rebase --skip
  abort = git rebase --abort (but no rollback -- applied changes persist)

<!-- UI brand patterns -->
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
Stage banners, progress logging format

<!-- EXECUTION-LOG.md path (from Plan 01) -->
.planning/refinement/EXECUTION-LOG.md
Written after each mutation (WAL pattern from Plan 01)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add failure handling with AskUserQuestion decision flow and user experience</name>
  <reqs>EU-01, EU-02, FN-03</reqs>
  <files>get-shit-done/workflows/change-application.md</files>
  <action>
  Read the workflow created in Plan 01 and enhance it with complete failure handling and user experience.

  **1. Add stage banner at workflow start (EU-01):**

  At the beginning of the workflow (after changeset parsing), add:
  ```
  Print stage banner: GSD > CHANGE APPLICATION

  Print summary:
  "Applying {N} changes from CHANGESET.md ({M} logged-only entries excluded)."
  "Execution order: {count by type} creates, {count} moves, {count} metadata, {count} reinstates, {count} defers, {count} kills"
  ```

  **2. Add per-mutation progress logging (EU-01):**

  Before each mutation, print:
  ```
  "[{i}/{total}] {mutation_type}: {CS-ID} — {topic}"
  ```

  After each successful mutation, print:
  ```
  "  -> APPLIED{if UNVALIDATED: ' (UNVALIDATED)'}"
  ```

  **3. Replace failure placeholder with AskUserQuestion flow (FN-03, EU-02):**

  When any mutation fails, replace the placeholder halt with:

  **Step A: Report current state**

  Print a clear breakdown:
  ```
  MUTATION FAILED

  Failed: {CS-ID} — {topic}
  Error: {error message}

  Applied so far: {list of CS-IDs that succeeded}
  Pending: {list of CS-IDs not yet attempted}
  ```

  **Step B: Ask user for decision**

  AskUserQuestion:
  - header: "CA Fail"  (6 chars, within 12-char limit)
  - question: "{CS-ID} failed: {error_message}\n\nApplied: {applied_count} | Pending: {pending_count}\n\nHow would you like to proceed?"
  - options: ["Fix and resume", "Skip and continue", "Abort"]

  **Handle empty response (AskUserQuestion bug guard):**
  - If response is empty/null/undefined: retry the SAME AskUserQuestion once
  - If still empty: print "Please type your choice: fix, skip, or abort" and read from conversational text

  **Step C: Process the decision**

  **If "Fix and resume":**
  - Print: "Fix the issue externally, then confirm when ready."
  - Wait for user confirmation (conversational -- e.g., user says "done" or "fixed")
  - Retry the SAME failed entry (do not advance to next)
  - If retry succeeds: mark APPLIED, continue to next entry
  - If retry fails again: return to Step A (recursive -- user can fix again, skip, or abort)

  **If "Skip and continue":**
  - Mark the failed entry as SKIPPED with reason from the error
  - Update EXECUTION-LOG.md (incremental write from Plan 01)
  - Print: "Skipped {CS-ID}. Continuing with remaining entries."
  - Continue to next PENDING entry

  **If "Abort":**
  - Mark all remaining PENDING entries as PENDING (they stay PENDING)
  - Update EXECUTION-LOG.md with final state
  - Print: "Aborted. {applied_count} changes applied, {pending_count} entries remain pending."
  - Print: "Applied changes persist. Review EXECUTION-LOG.md for details."
  - Skip to completion summary (do not process any more entries)

  **4. Enhance completion summary (EU-01):**

  Update the completion section from Plan 01 to include more user-friendly output:

  ```
  GSD > CHANGE APPLICATION COMPLETE

  | Result | Count |
  |--------|-------|
  | APPLIED | {N} |
  | FAILED | {M} |
  | SKIPPED | {K} |
  | PENDING | {P} |

  Execution log: .planning/refinement/EXECUTION-LOG.md

  {if any FAILED or SKIPPED: list each with CS-ID and reason}
  {if any UNVALIDATED: "Note: {U} entries applied via direct edit (UNVALIDATED). These bypass CLI validation."}
  {if all APPLIED: "All changes applied successfully."}

  Next: Run refinement-artifact to generate the refinement report.
  ```

  **5. Edge case: all entries pre-failed in validation (EU-01):**

  If the pre-execution validation (Plan 01 Step 4) marks ALL entries as FAILED or idempotent-skip:
  - Skip the execution loop entirely
  - Write EXECUTION-LOG.md with all results
  - Print completion summary noting no mutations were needed/possible
  </action>
  <verify>
    <automated>grep -q "AskUserQuestion" get-shit-done/workflows/change-application.md && grep -q "Fix and resume" get-shit-done/workflows/change-application.md && grep -q "Skip and continue" get-shit-done/workflows/change-application.md && grep -q "Abort" get-shit-done/workflows/change-application.md && grep -q "CA Fail" get-shit-done/workflows/change-application.md && grep -q "CHANGE APPLICATION" get-shit-done/workflows/change-application.md && echo "OK"</automated>
  </verify>
  <done>Failure handling integrated: AskUserQuestion with 3 options (fix-and-resume retries same entry, skip-and-continue marks SKIPPED, abort preserves PENDING), empty response guard, stage banner, per-mutation progress logging, enhanced completion summary with failed/skipped details</done>
</task>

</tasks>

<verification>
1. AskUserQuestion presents 3 options on failure: Fix and resume, Skip and continue, Abort (FN-03)
2. Fix-and-resume retries the failed entry after user fixes externally (FN-03)
3. Skip marks entry SKIPPED in EXECUTION-LOG.md (EU-02, FN-03)
4. Abort stops processing but applied changes persist (EU-02)
5. Stage banner prints at workflow start (EU-01)
6. Per-mutation progress shows [i/total] format (EU-01)
7. Completion summary shows all result counts (EU-01)
8. Empty AskUserQuestion response handled with retry (RESEARCH.md)
9. All-pre-failed edge case handled gracefully (EU-01)
</verification>

<success_criteria>
- Failure halts execution and presents 3 options via AskUserQuestion
- Fix-and-resume retries the same entry (not the next one)
- Skip logs SKIPPED status with reason
- Abort preserves remaining entries as PENDING (no rollback)
- User has visibility at every step (banner, progress, completion summary)
- Applied changes are permanent regardless of user choice
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/change-application/02-SUMMARY.md`
</output>
