---
phase: requirements-refinement/change-application
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/change-application.md
autonomous: true
requirements:
  - FN-01
  - FN-02
  - FN-04
  - FN-05
  - TC-01
  - TC-02
must_haves:
  truths:
    - "Workflow parses CHANGESET.md via changeset-parse CLI route and filters to actionable entries (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE)"
    - "Entries are sorted into safe execution order: create caps -> create features -> move -> modify metadata -> reinstate -> defer -> kill features -> kill caps"
    - "7 mutation handlers exist: create-capability (CLI), create-feature (CLI), move-feature (copy-verify-delete), modify-metadata (direct edit), reinstate (status reset + artifact cleanup), defer (status set), kill (status set)"
    - "CLI route mutations invoke gsd-tools via Bash subprocess (not in-process) with idempotency pre-check"
    - "Direct edit mutations use Read/Edit tools (never sed/awk) and are flagged UNVALIDATED"
    - "EXECUTION-LOG.md is written incrementally after each mutation (WAL pattern) to .planning/refinement/EXECUTION-LOG.md"
    - "Reinstate clears research/, RESEARCH.md, *-PLAN.md, *-SUMMARY.md but preserves FEATURE.md EU/FN/TC sections"
    - "REJECT and RESEARCH_NEEDED entries are logged in EXECUTION-LOG.md but not executed"
  artifacts:
    - path: "get-shit-done/workflows/change-application.md"
      provides: "Change application workflow with sequencer, 7 mutation handlers, and EXECUTION-LOG.md output"
  key_links:
    - from: "get-shit-done/workflows/change-application.md"
      to: "get-shit-done/bin/gsd-tools.cjs"
      via: "Bash calls to changeset-parse, capability-create, feature-create"
      pattern: "gsd-tools.cjs (changeset-parse|capability-create|feature-create)"
    - from: "get-shit-done/workflows/change-application.md"
      to: ".planning/refinement/CHANGESET.md"
      via: "Input consumed via changeset-parse route"
      pattern: "CHANGESET\\.md"
    - from: "get-shit-done/workflows/change-application.md"
      to: ".planning/refinement/EXECUTION-LOG.md"
      via: "Direct Write tool after each mutation"
      pattern: "EXECUTION-LOG\\.md"
---

<objective>
Create the change-application workflow with the sequencer state machine, all 7 mutation handlers, and incremental EXECUTION-LOG.md output.

Purpose: This workflow consumes the confirmed CHANGESET.md from refinement-qa and applies mutations to capability/feature files. It is the "do" step of the refinement pipeline -- everything before it was analysis and discussion, everything after it is reporting.
Output: get-shit-done/workflows/change-application.md
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/change-application/FEATURE.md
@.planning/capabilities/requirements-refinement/features/change-application/RESEARCH.md

<interfaces>
<!-- changeset-parse output format (from refinement-qa Plan 01) -->
JSON output from `node gsd-tools.cjs changeset-parse --raw`:
{
  "meta": { "date": "...", "source": "...", "total": N, "counts": {...} },
  "entries": [
    { "id": "CS-01", "topic": "...", "type": "ACCEPT", "source": "FINDING-003", "capabilities": [...], "action": "...", "reasoning": "..." }
  ]
}
6 entry types: ACCEPT | MODIFY | REJECT | RESEARCH_NEEDED | ASSUMPTION_OVERRIDE | USER_INITIATED
Actionable types: ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE
Non-actionable types: REJECT, RESEARCH_NEEDED (log only)

<!-- CLI route invocation pattern -->
CLI routes call process.exit -- must invoke as subprocess via Bash:
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create --name {slug} --raw
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create --capability {cap} --name {feat} --raw
Both error on duplicate (process.exit(1)) -- must pre-check existence before calling.

<!-- Available CLI routes for mutations -->
Only 2 of 7 mutation types have CLI routes:
  - capability-create: creates capability dir + CAPABILITY.md
  - feature-create: creates feature dir + FEATURE.md stub
Remaining 5 (move, modify-metadata, reinstate, defer, kill) = direct file edits with UNVALIDATED flag.

<!-- Capability/feature file layout -->
.planning/capabilities/{cap-slug}/
  CAPABILITY.md          # frontmatter: type, name, status, created
  features/{feat-slug}/
    FEATURE.md           # frontmatter: type, capability, status, created
    RESEARCH.md          # research synthesis (cleared on reinstate)
    research/            # raw research (cleared on reinstate)
    *-PLAN.md            # execution plans (cleared on reinstate)
    *-SUMMARY.md         # plan summaries (cleared on reinstate)

<!-- EXECUTION-LOG.md naming -->
IMPORTANT: Output file is EXECUTION-LOG.md, NOT DELTA.md.
DELTA.md is owned by refinement-artifact for semantic diffs.
FEATURE.md spec says "DELTA.md" but this was superseded by naming collision resolution.

<!-- EXECUTION-LOG.md format (from FEATURE.md TC-02, adapted with name change) -->
Path: .planning/refinement/EXECUTION-LOG.md
Overwritten per run (not append-only).

<!-- Move-feature pattern -->
Move = copy-verify-delete (never delete-then-create):
1. cp -r source_dir target_dir via Bash
2. Update frontmatter `capability` field in target FEATURE.md
3. Verify target exists and has correct content
4. rm -rf source_dir via Bash
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create change-application workflow with sequencer and mutation handlers</name>
  <reqs>FN-01, FN-02, FN-05, TC-01</reqs>
  <files>get-shit-done/workflows/change-application.md</files>
  <action>
  Create `get-shit-done/workflows/change-application.md` as a Claude Code workflow (.md file). This runs in orchestrator context (AskUserQuestion available for failure handling -- added in Plan 02).

  **Workflow structure:**

  ```
  <purpose>
  Apply confirmed changes from CHANGESET.md to capability and feature files. Executes mutations in safe topological order, writes EXECUTION-LOG.md incrementally, and halts on failure for user decision.
  </purpose>

  <required_reading>
  @{GSD_ROOT}/get-shit-done/references/ui-brand.md
  </required_reading>

  <inputs>
  No explicit inputs -- reads .planning/refinement/CHANGESET.md via changeset-parse.
  </inputs>
  ```

  **Step 1: Parse and classify change set (FN-01)**

  - Run `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw` via Bash
  - If command fails: abort with "CHANGESET.md not found or invalid. Run refinement-qa first."
  - Parse JSON output
  - Split entries into two lists:
    - `actionable`: entries where type is ACCEPT, MODIFY, USER_INITIATED, or ASSUMPTION_OVERRIDE
    - `logged_only`: entries where type is REJECT or RESEARCH_NEEDED
  - Log: "{N} actionable entries, {M} logged-only entries"

  **Step 2: Classify mutation types from action text (FN-02)**

  For each actionable entry, classify the `action` free-text field into one of 7 mutation types. This classification uses the LLM's text understanding (the runtime IS an LLM).

  Classification rules (check in order):
  1. **create-capability** -- action mentions creating/adding a new capability. Keywords: "create capability", "add capability", "new capability"
  2. **create-feature** -- action mentions creating/adding a new feature under a capability. Keywords: "create feature", "add feature", "new feature"
  3. **move-feature** -- action mentions moving/relocating a feature from one capability to another. Keywords: "move feature", "relocate", "transfer from ... to"
  4. **modify-metadata** -- action mentions changing status, description, dependencies, name, or other fields. Keywords: "update", "change", "rename", "set", "adjust"
  5. **reinstate** -- action mentions reinstating, restoring, or un-killing/un-deferring a feature. Keywords: "reinstate", "restore", "reactivate", "un-defer", "un-kill"
  6. **defer** -- action mentions deferring a feature. Keywords: "defer", "postpone", "delay"
  7. **kill** -- action mentions killing/removing/dropping a feature or capability. Keywords: "kill", "remove", "drop", "eliminate", "delete"

  If an action does not map to any known type: mark the entry as FAILED with reason "Unknown mutation type: could not classify action text" and log a warning. Do NOT halt for unclassifiable entries -- they become FAILED entries in the log.

  For each classified entry, also extract the target from the action text:
  - For create-capability: the capability slug
  - For create-feature: the capability slug + feature slug
  - For move-feature: source capability, feature slug, target capability
  - For modify-metadata: target entity path + field + new value
  - For reinstate: target feature path
  - For defer: target feature path + reasoning
  - For kill: target entity path (feature or capability) + reasoning

  **Step 3: Sort into safe execution order (FN-01)**

  Sort the classified entries into topological execution order:
  1. Create capabilities
  2. Create feature stubs
  3. Move features between capabilities
  4. Modify metadata (rename, update description, adjust dependencies)
  5. Reinstate features (killed/deferred -> exploring)
  6. Defer features
  7. Kill features
  8. Kill capabilities

  Within each category, maintain the original CHANGESET.md ordering.

  **Step 4: Pre-execution validation (RESEARCH.md recommendation)**

  Before executing any mutations, run a validation pass:
  - For create-capability: check if `.planning/capabilities/{slug}/` already exists. If yes: mark as APPLIED (idempotent skip) with note "Already exists -- skipped"
  - For create-feature: check if `.planning/capabilities/{cap}/features/{feat}/` already exists. If yes: mark as APPLIED (idempotent skip)
  - For move-feature: check source exists AND target capability dir exists (or is in the create set). If source missing: mark FAILED "Source feature not found"
  - For modify-metadata, defer, kill: check target file exists. If missing: mark FAILED "Target not found"
  - For reinstate: check target feature exists. If missing: mark FAILED "Feature not found"

  Log validation results: "{N} entries passed validation, {M} pre-failed, {K} idempotent skips"

  **Step 5: Execute mutations sequentially (FN-02)**

  Initialize state: all entries start as PENDING (except pre-failed/pre-skipped from Step 4).

  For each PENDING entry, in safe execution order:

  **create-capability (CLI route):**
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create --name {slug} --raw
  ```
  - On success (exit 0): mark APPLIED
  - On failure (exit 1): mark FAILED with stderr as error message, proceed to failure handler

  **create-feature (CLI route):**
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create --capability {cap} --name {feat} --raw
  ```
  - Same success/failure handling as create-capability

  **move-feature (direct edit, UNVALIDATED):**
  1. Copy source directory to target: `cp -r .planning/capabilities/{source_cap}/features/{feat}/ .planning/capabilities/{target_cap}/features/{feat}/`
  2. Read target FEATURE.md, update `capability` frontmatter field to target capability slug
  3. Verify target directory exists and FEATURE.md is readable
  4. Delete source: `rm -rf .planning/capabilities/{source_cap}/features/{feat}/`
  5. Mark APPLIED + UNVALIDATED

  **modify-metadata (direct edit, UNVALIDATED):**
  1. Read the target file (CAPABILITY.md or FEATURE.md)
  2. Identify the field to change from the action text (status, description, dependencies, etc.)
  3. Edit the field value using the Edit tool
  4. Mark APPLIED + UNVALIDATED

  **reinstate (direct edit, UNVALIDATED -- FN-05):**
  1. Read target FEATURE.md
  2. Set frontmatter `status` to `exploring`
  3. Remove any `killed_reason`, `deferred_reason`, or similar fields from frontmatter
  4. Write updated FEATURE.md via Edit tool
  5. Clear downstream artifacts that may conflict:
     - Delete `research/` directory if it exists: `rm -rf .planning/capabilities/{cap}/features/{feat}/research/`
     - Delete `RESEARCH.md` if it exists
     - Delete all `*-PLAN.md` files: find and delete each
     - Delete all `*-SUMMARY.md` files: find and delete each
  6. Preserve: FEATURE.md (especially EU/FN/TC sections), BRIEF.md if it exists
  7. Mark APPLIED + UNVALIDATED

  **defer (direct edit, UNVALIDATED):**
  1. Read target FEATURE.md
  2. Set frontmatter `status` to `deferred`
  3. Add reasoning from the changeset entry to the file (as a comment or field)
  4. Write via Edit tool
  5. Mark APPLIED + UNVALIDATED

  **kill (direct edit, UNVALIDATED):**
  1. Read target file (FEATURE.md or CAPABILITY.md)
  2. Set frontmatter `status` to `killed`
  3. Add reasoning from the changeset entry
  4. Write via Edit tool
  5. Mark APPLIED + UNVALIDATED

  After each mutation (success or failure): write EXECUTION-LOG.md (see Task 2 for format).

  **Failure handling placeholder (completed in Plan 02):**
  On any mutation failure: halt execution. Plan 02 adds the AskUserQuestion-based user decision flow (fix-and-resume, skip-and-continue, abort). For this plan, a simple halt + error print is sufficient as a placeholder.
  </action>
  <verify>
    <automated>test -f get-shit-done/workflows/change-application.md && grep -q "changeset-parse" get-shit-done/workflows/change-application.md && grep -q "capability-create" get-shit-done/workflows/change-application.md && grep -q "feature-create" get-shit-done/workflows/change-application.md && grep -q "UNVALIDATED" get-shit-done/workflows/change-application.md && grep -q "reinstate" get-shit-done/workflows/change-application.md && grep -q "cp -r" get-shit-done/workflows/change-application.md && echo "OK"</automated>
  </verify>
  <done>change-application.md exists with: changeset-parse consumption, 7 mutation handlers (2 CLI + 5 direct edit), safe execution ordering, pre-execution validation with idempotency checks, UNVALIDATED flagging for direct edits, reinstate artifact cleanup (research/, RESEARCH.md, *-PLAN.md, *-SUMMARY.md), move-feature copy-verify-delete pattern</done>
</task>

<task type="auto">
  <name>Add EXECUTION-LOG.md incremental write logic to the workflow</name>
  <reqs>FN-04, TC-02</reqs>
  <files>get-shit-done/workflows/change-application.md</files>
  <action>
  Add the EXECUTION-LOG.md output logic to the workflow created in Task 1. This is the incremental write (WAL pattern) that updates after each mutation.

  **EXECUTION-LOG.md format (TC-02):**

  The workflow must maintain an in-memory state of all entries and rewrite EXECUTION-LOG.md after each mutation completes. Use the Write tool (direct file write, no dependency on refinement-write route).

  Path: `.planning/refinement/EXECUTION-LOG.md`

  **Template:**

  ```markdown
  ---
  date: {YYYY-MM-DD}
  changeset: .planning/refinement/CHANGESET.md
  applied: {count}
  failed: {count}
  skipped: {count}
  pending: {count}
  ---

  # Execution Log

  ## Summary

  | Result | Count |
  |--------|-------|
  | APPLIED | {N} |
  | FAILED | {M} |
  | SKIPPED | {K} |
  | PENDING | {P} |

  ## Entries

  ### {CS-ID}: {topic}
  Result: APPLIED
  {if UNVALIDATED: "Flag: UNVALIDATED (direct edit, no CLI route)"}

  ### {CS-ID}: {topic}
  Result: FAILED
  Error: {error message}

  ### {CS-ID}: {topic}
  Result: SKIPPED
  Reason: {skip reason}

  ### {CS-ID}: {topic}
  Result: PENDING

  ## Logged Only

  ### {CS-ID}: {topic}
  Type: REJECT
  Reasoning: {user's rejection reasoning}

  ### {CS-ID}: {topic}
  Type: RESEARCH_NEEDED
  Reasoning: {research question}
  ```

  **Write logic in the workflow:**

  1. After Step 1 (parse), initialize all actionable entries as PENDING and all non-actionable entries as logged-only
  2. Write initial EXECUTION-LOG.md with all entries PENDING and logged-only entries listed
  3. After each mutation completes (success or failure), update the entry's status and rewrite the full EXECUTION-LOG.md
  4. On abort: remaining entries stay PENDING in the final write
  5. Ensure `.planning/refinement/` directory exists before first write (create if needed)

  **Incremental write instruction for the workflow:**

  Add a reusable instruction block in the workflow that says:
  ```
  After EVERY mutation (whether it succeeds or fails), rebuild and write EXECUTION-LOG.md:
  1. Count results: applied, failed, skipped, pending
  2. Render frontmatter with date, changeset path, and result counts
  3. Render Summary table
  4. Render each actionable entry with its current status
  5. Render logged-only section with REJECT and RESEARCH_NEEDED entries
  6. Write to .planning/refinement/EXECUTION-LOG.md using the Write tool
  ```

  **Completion step:**

  At the end of the workflow (after all mutations or after abort), add a completion section:
  ```
  GSD > CHANGE APPLICATION COMPLETE

  | Result | Count |
  |--------|-------|
  | APPLIED | {N} |
  | FAILED | {M} |
  | SKIPPED | {K} |
  | PENDING | {P} |

  Execution log: .planning/refinement/EXECUTION-LOG.md

  {if any UNVALIDATED: "Note: {U} entries applied via direct edit (UNVALIDATED). These bypass CLI validation."}

  Next: Run refinement-artifact to generate the refinement report.
  ```
  </action>
  <verify>
    <automated>grep -q "EXECUTION-LOG.md" get-shit-done/workflows/change-application.md && grep -q "PENDING" get-shit-done/workflows/change-application.md && grep -q "Logged Only" get-shit-done/workflows/change-application.md && grep -q "UNVALIDATED" get-shit-done/workflows/change-application.md && echo "OK"</automated>
  </verify>
  <done>EXECUTION-LOG.md write logic integrated into the workflow: initial write with all PENDING, incremental update after each mutation, frontmatter with result counts, entry sections with status/error/flags, logged-only section for REJECT/RESEARCH_NEEDED, completion summary with UNVALIDATED count</done>
</task>

</tasks>

<verification>
1. Workflow reads CHANGESET.md via changeset-parse CLI route (FN-01)
2. Entries filtered to actionable vs logged-only (FN-01)
3. Action text classified into 7 mutation types (FN-02)
4. Entries sorted in safe topological order: creates -> moves -> metadata -> reinstate -> defer -> kills (FN-01)
5. Pre-execution validation catches duplicates and missing targets (RESEARCH.md)
6. create-capability and create-feature use CLI subprocess (TC-01)
7. 5 remaining mutations use Read/Edit tools with UNVALIDATED flag (TC-01)
8. Reinstate clears research/, RESEARCH.md, *-PLAN.md, *-SUMMARY.md (FN-05)
9. Move-feature uses copy-verify-delete pattern (RESEARCH.md)
10. EXECUTION-LOG.md written incrementally after each mutation (FN-04, TC-02)
11. EXECUTION-LOG.md has correct format: frontmatter, summary, entries, logged-only (TC-02)
12. Non-actionable entries appear in logged-only section (FN-04)
</verification>

<success_criteria>
- Workflow parses CHANGESET.md and classifies mutations from free-text action field
- Safe execution order enforced (creates before moves before kills)
- 2 CLI routes + 5 direct edit handlers implemented
- Idempotency pre-check prevents duplicate create failures
- EXECUTION-LOG.md (not DELTA.md) written incrementally with WAL pattern
- Reinstate artifact cleanup is thorough but preserves FEATURE.md content
- Move-feature is copy-verify-delete (never delete-first)
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/change-application/01-SUMMARY.md`
</output>
