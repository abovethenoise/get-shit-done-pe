---
phase: requirements-refinement/refinement-qa
plan: 02
type: execute
wave: 2
depends_on:
  - "01"
files_modified:
  - get-shit-done/workflows/refinement-qa.md
autonomous: true
requirements:
  - EU-01
  - EU-02
  - FN-01
  - FN-02
  - FN-03
  - TC-01
must_haves:
  truths:
    - "Every Q&A agenda item from RECOMMENDATIONS.md is presented to the user (no severity-based skipping)"
    - "Each item offers 3 resolution options via AskUserQuestion: Accept, Research Needed, Reject/Modify"
    - "Non-accept options use a two-step pattern: select option, then capture reasoning text via follow-up"
    - "Auto-resolvable items are batched for group acknowledgment (not silently skipped)"
    - "Contradiction pairs from RECOMMENDATIONS.md are presented adjacently with cross-references"
    - "Open-ended phase supports USER_INITIATED and ASSUMPTION_OVERRIDE entries"
    - "Exit follows GSD Q&A pattern: 'Does this look good or is there anything else?' loop"
    - "CHANGESET.md is written via changeset-write CLI route"
    - "Empty AskUserQuestion responses trigger retry (never auto-advance)"
    - "Zero-findings path skips structured phase and goes direct to open phase"
    - "Periodic checkpoint writes (every 5-7 items) protect against session loss"
  artifacts:
    - path: "get-shit-done/workflows/refinement-qa.md"
      provides: "Standalone Q&A workflow: agenda loading, structured phase, open phase, changeset output"
  key_links:
    - from: "get-shit-done/workflows/refinement-qa.md"
      to: ".planning/refinement/RECOMMENDATIONS.md"
      via: "Reads and parses Q&A Agenda table from final section"
      pattern: "RECOMMENDATIONS\\.md"
    - from: "get-shit-done/workflows/refinement-qa.md"
      to: "get-shit-done/bin/gsd-tools.cjs"
      via: "Bash calls to changeset-write for CHANGESET.md output"
      pattern: "changeset-write"
    - from: "get-shit-done/workflows/refinement-qa.md"
      to: ".planning/refinement/CHANGESET.md"
      via: "Final output artifact consumed by change-application"
      pattern: "CHANGESET\\.md"
---

<objective>
Create the standalone refinement Q&A workflow that walks the user through every coherence finding, collects resolutions, and writes CHANGESET.md.

Purpose: This is the interactive heart of the refinement capability -- the conversation where the user decides the fate of every finding. It must handle long agendas without decision fatigue, survive session interruptions via checkpoints, and produce a machine-parseable change set.
Output: get-shit-done/workflows/refinement-qa.md
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md
@.planning/capabilities/requirements-refinement/features/refinement-qa/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/refinement-qa/01-SUMMARY.md

<interfaces>
<!-- RECOMMENDATIONS.md Q&A Agenda format (contract from coherence-report) -->
Final section of RECOMMENDATIONS.md:
## Q&A Agenda
| # | Category | Topic | Recommended Resolution | Confidence |
|---|----------|-------|----------------------|------------|
| 1 | decision | ... | ... | HIGH |
Categories: decision | informational | auto-resolve

<!-- Contradictions section format (from RECOMMENDATIONS.md) -->
## Contradictions
| Conflict | Recommendation A | Recommendation B | Nature |
|----------|-----------------|-----------------|--------|

<!-- CHANGESET.md write route (from Plan 01) -->
changeset-write --content-file <path> [--checkpoint]
Content file JSON: { source, entries: [{ id, topic, type, source_finding, capabilities, action, reasoning }] }
6 entry types: ACCEPT | MODIFY | REJECT | RESEARCH_NEEDED | ASSUMPTION_OVERRIDE | USER_INITIATED

<!-- AskUserQuestion constraints -->
- Header max 12 characters (use "QA {N}/{T}" format)
- 2-4 options ideal (we use 3)
- Cannot capture free text inline -- need two-step pattern
- Empty response bug: must retry, never auto-advance
- Only available in orchestrator context (NOT inside Task() subagents)

<!-- GSD Q&A exit pattern (from discuss-feature/discuss-capability) -->
"Does this look good or is there anything else to discuss?"
Loop until user confirms done.

<!-- Finding cards (for deeper context when user asks) -->
.planning/refinement/findings/FINDING-{NNN}.md
Fields: id, type, severity, confidence, affected_capabilities, summary, recommendation, root_cause

<!-- Supporting artifacts for context -->
.planning/refinement/matrix.md
.planning/refinement/dependency-graph.md

<!-- UI brand patterns -->
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
Stage banners, checkpoint boxes
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create refinement-qa.md standalone workflow</name>
  <reqs>EU-01, EU-02, FN-01, FN-02, FN-03, TC-01</reqs>
  <files>get-shit-done/workflows/refinement-qa.md</files>
  <action>
  Create `get-shit-done/workflows/refinement-qa.md` as a standalone Claude Code workflow (.md file). This workflow runs in orchestrator context (not as a Task subagent) so AskUserQuestion is available.

  Follow the plan.md finding-resolution loop pattern (steps 8.3-8.5) as the structural template.

  **Workflow structure:**

  ```
  <purpose>
  Walk the user through every coherence finding from RECOMMENDATIONS.md, collect resolutions via AskUserQuestion, and write CHANGESET.md for change-application consumption.
  </purpose>

  <required_reading>
  @{GSD_ROOT}/get-shit-done/references/ui-brand.md
  </required_reading>

  <inputs>
  No explicit inputs -- reads from .planning/refinement/ directory.
  </inputs>
  ```

  **Step 1: Load and parse agenda (FN-01)**

  - Read `.planning/refinement/RECOMMENDATIONS.md`
  - If file does not exist: abort with "RECOMMENDATIONS.md not found. Run coherence-report first."
  - Parse Q&A Agenda table from the FINAL section (## Q&A Agenda):
    - Find the `## Q&A Agenda` heading
    - Parse the markdown table below it using pipe-splitting (inline ~20 line parser, do NOT depend on parseMarkdownTable from refinement.cjs)
    - Extract columns: #, Category, Topic, Recommended Resolution, Confidence
    - Each row becomes an agenda item object: `{ num, category, topic, resolution, confidence }`
  - Parse Contradictions section (## Contradictions):
    - Find `## Contradictions` heading
    - Parse the table: Conflict, Recommendation A, Recommendation B, Nature
    - Build a contradiction-pair map: for each row, record which agenda items are paired
  - Load supporting context for "deeper questions":
    - Read all `.planning/refinement/findings/FINDING-*.md` into a map keyed by finding ID
    - Read `.planning/refinement/matrix.md` (if exists)
    - Read `.planning/refinement/dependency-graph.md` (if exists)
  - Count agenda items. Log: "Loaded {N} agenda items ({D} decisions, {I} informational, {A} auto-resolve)"

  **Step 1a: Zero-findings check**

  - If agenda has 0 items OR agenda has exactly 1 informational item with "clean bill of health" topic:
    - Print stage banner: `GSD > REFINEMENT Q&A`
    - Print: "No findings to discuss. Project coherence looks good."
    - Skip to Step 3 (open-ended phase) with empty resolutions list
  - Otherwise: proceed to Step 2

  **Step 2: Structured Q&A phase (FN-02)**

  Print stage banner: `GSD > REFINEMENT Q&A`
  Print: "Walking through {N} agenda items. For each, you can accept, flag for research, or reject/modify."

  **Step 2a: Reorder for contradiction adjacency**

  Before walking items, reorder the agenda:
  - Start with the priority ordering from RECOMMENDATIONS.md (the # column)
  - For each contradiction pair (from Contradictions table): if the two items are separated by more than 2 positions, move the later item to immediately follow the earlier item
  - This ensures contradiction partners are adjacent with explicit cross-reference
  - Log any reordering: "Moved item {N} adjacent to {M} (contradiction pair)"

  **Step 2b: Batch auto-resolvable items**

  Group consecutive auto-resolve category items into batches:
  - If there are auto-resolvable items, present them as a batch FIRST (before decision/informational items):
    - Print table of all auto-resolve items: # | Topic | Recommended Resolution
    - AskUserQuestion:
      - header: "QA Auto"
      - question: "These {N} items have clear resolutions. Accept all, or review individually?"
      - options: ["Accept all", "Review individually"]
    - If "Accept all": record all as ACCEPT entries
    - If "Review individually": add back to the main walk-through list in their original positions

  **Step 2c: Walk decision and informational items**

  Initialize: resolutions = [] (accumulates all resolved entries), counter = 0, checkpoint_counter = 0

  For each remaining agenda item (decision + informational, plus any auto-resolve items sent back for individual review):

  counter++
  checkpoint_counter++

  **Present the item:**
  - Build question text:
    ```
    **[{category}] {topic}**

    Recommendation: {resolution}
    Confidence: {confidence}
    {if contradiction pair: "\n-- This contradicts item #{paired_item_num}: {paired_topic}. Resolve both consistently."}
    ```

  - AskUserQuestion:
    - header: "QA {counter}/{total}" (max 12 chars -- safe for 2-digit counts)
    - question: the built question text above
    - options: ["Accept", "Research needed", "Reject/Modify"]

  **Handle empty response (AskUserQuestion bug guard):**
  - If response is empty/null/undefined: retry the SAME AskUserQuestion once
  - If still empty after retry: print "AskUserQuestion returned empty. Please type your choice: accept, research, or reject." and read from conversational text
  - NEVER auto-advance on empty response

  **Process the response:**

  **If "Accept":**
  - Record entry: { id: "CS-{counter}", topic, type: "ACCEPT", source_finding: derive from topic/finding cross-ref, capabilities: from finding card, action: recommendation text, reasoning: "Accepted as recommended" }

  **If "Research needed" (two-step text capture):**
  - Follow-up AskUserQuestion:
    - header: "QA Detail"
    - question: "What context or question should be investigated?\n\n(Type your research question/context below)"
    - options: ["Done entering text"]
  - Note: the user types their text in the chat BEFORE selecting "Done entering text". Capture the conversational text preceding the option selection.
  - If no text captured: prompt conversationally: "Please describe what needs research for this item."
  - Record entry: { id: "CS-{counter}", topic, type: "RESEARCH_NEEDED", source_finding, capabilities, action: "Research: " + user_text, reasoning: user_text }

  **If "Reject/Modify" (two-step text capture):**
  - Follow-up AskUserQuestion:
    - header: "QA Detail"
    - question: "Provide your reasoning or modified action:\n\n(Type your reasoning/modification below)"
    - options: ["Reject entirely", "Modified action entered"]
  - Capture conversational text.
  - If user selected "Reject entirely": type = "REJECT", action = "No action"
  - If user selected "Modified action entered": type = "MODIFY", action = captured text
  - Record entry with user's reasoning

  **If user asks a deeper question (detected by conversational text between AskUserQuestion calls):**
  - Look up the finding card for the current item (from findings/ map)
  - Present finding details: type, severity, affected capabilities, full summary, root cause
  - Cross-reference with matrix.md and dependency-graph.md if relevant
  - Then re-present the same AskUserQuestion for resolution

  **Checkpoint write (every 5-7 items):**
  - After every 7th resolution (checkpoint_counter >= 7):
    - Write current resolutions to CHANGESET.md via changeset-write with --checkpoint flag:
      ```bash
      # Write JSON to temp file, then call CLI
      echo '{json}' > /tmp/gsd-changeset-checkpoint.json
      node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file /tmp/gsd-changeset-checkpoint.json --checkpoint
      ```
    - Reset checkpoint_counter = 0
    - Log: "Checkpoint saved ({total_resolved}/{total_items} items resolved)"

  **Step 3: Open-ended phase (FN-03, EU-02)**

  Print: "All structured items resolved. You can now raise additional concerns or revisit decisions."

  Enter exit loop (GSD Q&A pattern):

  AskUserQuestion:
  - header: "QA Open"
  - question: "Does this look good, or is there anything else to discuss?\n\nYou can:\n- Raise a new concern\n- Override an assumption (mark a finding as by-design)\n- Revisit a previous decision\n- Confirm done"
  - options: ["Looks good - finalize", "I have something to add"]

  **If "Looks good - finalize":** proceed to Step 4.

  **If "I have something to add":**
  - Prompt conversationally: "What would you like to add or change?"
  - Based on user's response, determine the entry type:
    - If user raises a new concern not in the report: type = USER_INITIATED
      - Ask: "What capabilities does this affect?" (conversational)
      - Ask: "What action should be taken?" (conversational)
      - Record entry with source = "user-initiated"
    - If user wants to override an assumption: type = ASSUMPTION_OVERRIDE
      - Ask: "Which finding is this about?" (conversational, reference by topic or number)
      - Ask: "Why is this by-design?" (conversational)
      - Record entry with source = the finding ID, reasoning = user's explanation
    - If user wants to revisit a previous decision:
      - Show the previous resolution for that item
      - Re-present with AskUserQuestion (same 3 options)
      - Replace the previous entry in the resolutions list
  - Return to the exit loop AskUserQuestion

  **Step 4: Write final CHANGESET.md (FN-04)**

  - Assemble final changeset JSON from all resolutions
  - Write to temp file
  - Call changeset-write WITHOUT --checkpoint flag (status: complete):
    ```bash
    echo '{json}' > /tmp/gsd-changeset-final.json
    node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file /tmp/gsd-changeset-final.json
    ```
  - Verify write succeeded
  - Clean up temp files

  **Step 5: Completion summary**

  Print:
  ```
  GSD > REFINEMENT Q&A COMPLETE

  | Type | Count |
  |------|-------|
  | ACCEPT | N |
  | MODIFY | N |
  | REJECT | N |
  | RESEARCH_NEEDED | N |
  | ASSUMPTION_OVERRIDE | N |
  | USER_INITIATED | N |

  Change set: .planning/refinement/CHANGESET.md

  Next: Run change-application to execute confirmed changes.
  ```

  **Error handling:**
  - Missing RECOMMENDATIONS.md: abort with actionable message (Step 1)
  - Empty Q&A agenda table: treat as zero-findings path (Step 1a)
  - AskUserQuestion empty response: retry once, then conversational fallback (Step 2c)
  - changeset-write fails: fall back to direct Write tool to `.planning/refinement/CHANGESET.md` with the rendered markdown. Log warning.
  - Session abort (user closes): partial checkpoint exists on disk for awareness (but resume is out of scope per RESEARCH.md)
  </action>
  <verify>
    <automated>test -f get-shit-done/workflows/refinement-qa.md && grep -q "AskUserQuestion" get-shit-done/workflows/refinement-qa.md && grep -q "changeset-write" get-shit-done/workflows/refinement-qa.md && grep -q "RECOMMENDATIONS.md" get-shit-done/workflows/refinement-qa.md && grep -q "QA.*Auto" get-shit-done/workflows/refinement-qa.md && grep -q "contradiction" get-shit-done/workflows/refinement-qa.md && grep -q "checkpoint" get-shit-done/workflows/refinement-qa.md && grep -q "empty.*response\|empty.*retry" get-shit-done/workflows/refinement-qa.md && echo "OK"</automated>
  </verify>
  <done>refinement-qa.md workflow exists with: agenda loading from RECOMMENDATIONS.md Q&A Agenda table, zero-findings path, auto-resolve batch presentation, contradiction pair adjacency, per-item AskUserQuestion with 3 options (Accept/Research Needed/Reject-Modify), two-step text capture for non-accept, empty response retry guard, open-ended phase with USER_INITIATED and ASSUMPTION_OVERRIDE support, exit loop, periodic checkpoint writes, final CHANGESET.md write via changeset-write, completion summary</done>
</task>

</tasks>

<verification>
1. Workflow reads RECOMMENDATIONS.md and parses Q&A Agenda table (FN-01)
2. All agenda items are presented -- no severity-based skipping (EU-01)
3. Each item has 3 options: Accept, Research Needed, Reject/Modify (FN-02)
4. Two-step text capture for Research Needed and Reject/Modify (RESEARCH.md consensus)
5. Contradiction pairs presented adjacently with cross-reference (FN-02)
6. Auto-resolvable items batched for group acknowledgment (RESEARCH.md conflict resolution)
7. Open-ended phase supports USER_INITIATED and ASSUMPTION_OVERRIDE entries (FN-03, EU-02)
8. Exit follows GSD Q&A pattern (EU-01)
9. CHANGESET.md written via changeset-write route (TC-01, FN-04)
10. Empty AskUserQuestion response triggers retry (RESEARCH.md constraint)
11. Periodic checkpoint writes every 7 items (RESEARCH.md durability)
12. Zero-findings path skips structured phase (RESEARCH.md finding)
13. Standalone workflow file (not embedded in orchestrator) for context isolation (TC-01)
</verification>

<success_criteria>
- Every agenda item from RECOMMENDATIONS.md is presented (EU-01 -- no skipping)
- 3 resolution options per item with two-step text capture (FN-02)
- Contradiction pairs adjacent (FN-02)
- Auto-resolve items batched (decision fatigue mitigation)
- Open phase supports user-initiated changes and assumption overrides (EU-02, FN-03)
- CHANGESET.md produced with all 6 entry types (FN-04)
- Standalone workflow file at workflows/refinement-qa.md (TC-01)
- Empty response guarded (never auto-advance)
- Checkpoint writes protect against session loss
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/refinement-qa/02-SUMMARY.md`
</output>
