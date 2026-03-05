---
type: flow-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Flow: requirements-refinement/refinement-qa

## Trigger: [derived]

User invokes the refinement-qa workflow after coherence-report completes. Reads RECOMMENDATIONS.md from `.planning/refinement/`.

## Input: [derived]

- Implicit: `.planning/refinement/RECOMMENDATIONS.md` (required)
- Implicit: `.planning/refinement/findings/FINDING-*.md` (for drill-down context)
- Implicit: `.planning/refinement/matrix.md` (for cross-reference)
- Implicit: `.planning/refinement/dependency-graph.md` (for cross-reference)

## Steps: [derived]

```
1. load_and_parse_agenda   -> read RECOMMENDATIONS.md (abort if missing)
                           -> parse Q&A Agenda table (## Q&A Agenda heading)
                           -> parse Contradictions table (## Contradictions heading)
                           -> build contradiction-pair map
                           -> load supporting findings, matrix, dependency-graph
2. zero_findings_check     -> if 0 items or single "clean bill of health" item:
                              print "No findings to discuss", skip to open-ended phase
3. structured_qa           -> reorder agenda for contradiction adjacency
                           -> batch auto-resolve items first:
                              AskUserQuestion: "Accept all" or "Review individually"
                           -> walk decision + informational items sequentially:
                              AskUserQuestion per item: Accept / Research needed / Reject-Modify
                              empty response guard: retry once, then conversational fallback
                           -> checkpoint write every 7 items via changeset-write --checkpoint
4. open_ended_phase        -> exit loop via AskUserQuestion: "Looks good" or "I have something to add"
                           -> supports: new concern (USER_INITIATED),
                              override assumption (ASSUMPTION_OVERRIDE),
                              revisit previous decision (replace entry)
5. write_final_changeset   -> assemble all resolutions into JSON
                           -> gsd-tools changeset-write --content-file {tmp} (no --checkpoint = complete)
                           -> fallback: direct Write if CLI fails
```

### Resolution Types

| Type | Trigger | Action recorded |
|------|---------|-----------------|
| ACCEPT | User accepts recommendation | Recommendation text as-is |
| MODIFY | User provides modified action | User's modified text |
| REJECT | User rejects entirely | "No action" |
| RESEARCH_NEEDED | User flags for investigation | "Research: " + user context |
| ASSUMPTION_OVERRIDE | Open-ended: mark finding as by-design | Override reasoning |
| USER_INITIATED | Open-ended: new concern not in report | User-provided action |

### Checkpoint-Resume Note

Periodic checkpoint writes (every 7 items) produce a partial CHANGESET.md (`status: partial`). However, there is no resume logic -- if the workflow is interrupted and re-run, it starts from scratch and overwrites any partial CHANGESET.md. The `changeset-parse` command refuses to parse partial changesets, preventing change-application from executing on incomplete data.

## Output: [derived]

- `.planning/refinement/CHANGESET.md` -- all resolutions with frontmatter (`status: complete`), summary table, and per-entry details (id, topic, type, source, capabilities, action, reasoning)

## Side-effects: [derived]

- Writes checkpoint CHANGESET.md files during structured walk (overwritten by final write)
- Creates temporary JSON files for changeset-write (cleaned up after)
- Interactive: presents AskUserQuestion prompts requiring user input

## WHY: [authored]

**Contradiction adjacency reordering:** Items in a contradiction pair are moved adjacent so the user resolves them together with full context of the conflict. Without this, contradictory recommendations could be accepted independently.

**Auto-resolve batch before individual walk:** Items with category `auto-resolve` and HIGH confidence are batched to reduce user fatigue. The user can opt into individual review if they prefer.

**Empty response guard:** AskUserQuestion can return empty on edge cases. The workflow retries once then falls back to conversational prompting -- it never auto-advances, which would silently skip user input.
