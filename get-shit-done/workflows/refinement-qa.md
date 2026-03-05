<purpose>
Walk the user through every coherence finding from RECOMMENDATIONS.md, collect resolutions via AskUserQuestion, and write CHANGESET.md for change-application consumption.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
No explicit inputs — reads from .planning/refinement/ directory.
</inputs>

<process>

<step name="load_and_parse_agenda">
Read `.planning/refinement/RECOMMENDATIONS.md`.

If file does not exist: abort with "RECOMMENDATIONS.md not found. Run coherence-report first."

Parse the Q&A Agenda table from the final section:

1. Find the `## Q&A Agenda` heading
2. Parse the markdown table below it (inline pipe-splitting):
   - Find header row (first row with `|`), extract column names
   - Skip separator row (contains `---`)
   - Parse data rows into objects: `{ num, category, topic, resolution, confidence }`
3. Parse Contradictions section (`## Contradictions`):
   - Parse the table: Conflict, Recommendation A, Recommendation B, Nature
   - Build a contradiction-pair map: for each row, record which agenda items are paired
4. Load supporting context:
   - Read all `.planning/refinement/findings/FINDING-*.md` into a map keyed by finding ID
   - Read `.planning/refinement/matrix.md` (if exists)
   - Read `.planning/refinement/dependency-graph.md` (if exists)

Log: "Loaded {N} agenda items ({D} decisions, {I} informational, {A} auto-resolve)"
</step>

<step name="zero_findings_check">
If agenda has 0 items OR exactly 1 informational item with "clean bill of health" topic:

```
-------------------------------------------------------
 GSD > REFINEMENT Q&A
-------------------------------------------------------

No findings to discuss. Project coherence looks good.
```

Skip to open-ended phase with empty resolutions list.
</step>

<step name="structured_qa">

```
-------------------------------------------------------
 GSD > REFINEMENT Q&A
-------------------------------------------------------

Walking through {N} agenda items. For each, you can accept, flag for research, or reject/modify.
```

**Reorder for contradiction adjacency:**

Before walking items, reorder the agenda:
- Start with the priority ordering from RECOMMENDATIONS.md (the # column)
- For each contradiction pair: if the two items are separated by more than 2 positions, move the later item to immediately follow the earlier item
- Log any reordering: "Moved item {N} adjacent to {M} (contradiction pair)"

**Batch auto-resolvable items:**

If there are auto-resolve category items, present them as a batch FIRST:
- Print table of all auto-resolve items: # | Topic | Recommended Resolution
- AskUserQuestion:
  - header: "QA Auto"
  - question: "These {N} items have clear resolutions. Accept all, or review individually?"
  - options: ["Accept all", "Review individually"]
- If "Accept all": record all as ACCEPT entries
- If "Review individually": add back to the main walk-through

**Walk decision and informational items:**

Initialize: resolutions = [], counter = 0, checkpoint_counter = 0

For each remaining item:

counter++, checkpoint_counter++

Present the item via AskUserQuestion:
- header: "QA {counter}/{total}" (max 12 chars)
- question:
  ```
  **[{category}] {topic}**

  Recommendation: {resolution}
  Confidence: {confidence}
  {if contradiction pair: "\n⚠ This contradicts item #{paired_num}: {paired_topic}. Resolve both consistently."}
  ```
- options: ["Accept", "Research needed", "Reject/Modify"]

**Empty response guard:**
- If response is empty/null: retry the SAME AskUserQuestion once
- If still empty: ask conversationally for their choice
- NEVER auto-advance on empty response

**If "Accept":**
- Record: { id: "CS-{counter}", topic, type: "ACCEPT", source_finding, capabilities, action: recommendation text, reasoning: "Accepted as recommended" }

**If "Research needed":**
- Follow-up AskUserQuestion:
  - header: "QA Detail"
  - question: "What context or question should be investigated?"
  - options: ["Done entering text"]
- Capture the user's conversational text preceding option selection
- Record: { type: "RESEARCH_NEEDED", action: "Research: " + user_text, reasoning: user_text }

**If "Reject/Modify":**
- Follow-up AskUserQuestion:
  - header: "QA Detail"
  - question: "Provide your reasoning or modified action:"
  - options: ["Reject entirely", "Modified action entered"]
- If "Reject entirely": type = "REJECT", action = "No action"
- If "Modified action entered": type = "MODIFY", action = captured text
- Record entry with user's reasoning

**If user asks a deeper question:**
- Look up the finding card for the current item
- Present: type, severity, affected capabilities, full summary, root cause
- Cross-reference with matrix.md and dependency-graph.md
- Re-present the same AskUserQuestion

**Checkpoint write (every 7 items):**
- Write current resolutions to CHANGESET.md via changeset-write with --checkpoint flag:
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file {temp_json} --checkpoint
  ```
- Reset checkpoint_counter = 0
- Log: "Checkpoint saved ({resolved}/{total} items resolved)"
</step>

<step name="open_ended_phase">
Print: "All structured items resolved. You can now raise additional concerns or revisit decisions."

Enter exit loop (GSD Q&A pattern):

AskUserQuestion:
- header: "QA Open"
- question: "Does this look good, or is there anything else to discuss?\n\nYou can:\n- Raise a new concern\n- Override an assumption (mark a finding as by-design)\n- Revisit a previous decision\n- Confirm done"
- options: ["Looks good - finalize", "I have something to add"]

**If "Looks good - finalize":** proceed to final write.

**If "I have something to add":**
- Prompt conversationally: "What would you like to add or change?"
- Determine entry type from user's response:
  - New concern not in report: type = USER_INITIATED
    - Ask: "What capabilities does this affect?"
    - Ask: "What action should be taken?"
    - Record with source = "user-initiated"
  - Override assumption: type = ASSUMPTION_OVERRIDE
    - Ask: "Which finding is this about?"
    - Ask: "Why is this by-design?"
    - Record with source = finding ID
  - Revisit previous decision:
    - Show the previous resolution
    - Re-present with AskUserQuestion (same 3 options)
    - Replace the previous entry
- Return to exit loop
</step>

<step name="write_final_changeset">
Assemble final changeset JSON from all resolutions.

Write via changeset-write WITHOUT --checkpoint flag (status: complete):
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file {temp_json}
```

If changeset-write fails: fall back to direct Write tool. Log warning.

Clean up temp files.
</step>

<step name="completion">
```
-------------------------------------------------------
 GSD > REFINEMENT Q&A COMPLETE
-------------------------------------------------------

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
</step>

</process>

<success_criteria>
- Every agenda item from RECOMMENDATIONS.md presented (no skipping)
- 3 resolution options per item with two-step text capture
- Contradiction pairs presented adjacently
- Auto-resolve items batched for efficiency
- Open phase supports USER_INITIATED and ASSUMPTION_OVERRIDE
- CHANGESET.md produced via changeset-write
- Empty response guarded (never auto-advance)
- Periodic checkpoint writes (every 7 items)
</success_criteria>
