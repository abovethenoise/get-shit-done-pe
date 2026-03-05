---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: refinement-qa.md

## Purpose: [derived]

Interactive workflow that walks the user through every Q&A agenda item from RECOMMENDATIONS.md, collects resolutions via AskUserQuestion, and writes CHANGESET.md for change-application consumption. Located at `get-shit-done/workflows/refinement-qa.md`.

Third stage of the requirements-refinement pipeline. Consumes coherence-report output, produces changeset consumed by change-application.

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** None (reads from `.planning/refinement/` directory)
- **CLI commands invoked:**
  - `gsd-tools changeset-write --content-file {tmp} [--checkpoint]` -- write CHANGESET.md (checkpoint or final)
- **Steps:**
  1. Load and parse Q&A Agenda table + Contradictions table from RECOMMENDATIONS.md
  2. Zero-findings check (skip to open-ended if no agenda items)
  3. Structured Q&A walk:
     - Reorder for contradiction adjacency
     - Batch auto-resolve items (AskUserQuestion: accept all or review individually)
     - Per-item AskUserQuestion: Accept / Research needed / Reject-Modify
     - Follow-up prompts for Research needed and Reject/Modify
     - Checkpoint write every 7 items (changeset-write --checkpoint)
  4. Open-ended phase (exit loop: finalize or add more)
  5. Write final CHANGESET.md (changeset-write without --checkpoint)
- **Resolution types:** ACCEPT, MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED
- **Outputs:** `.planning/refinement/CHANGESET.md`

## Depends-on: [derived]

- `gsd-tools.cjs` -- CLI tool for changeset-write route
- `bin/lib/refinement.cjs` -- Implementation of cmdChangesetWrite
- `.planning/refinement/RECOMMENDATIONS.md` -- input from coherence-report stage
- `.planning/refinement/findings/FINDING-*.md` -- drill-down context for user questions
- `references/ui-brand.md` -- required reading for UI styling

## Constraints: [authored]

- Every agenda item must be presented; no skipping.
- 3 resolution options per item with two-step text capture for Research and Reject/Modify.
- Contradiction pairs presented adjacently (reordered if separated by >2 positions).
- Empty response guard: retry AskUserQuestion once, then conversational fallback. Never auto-advance.
- Checkpoint writes produce `status: partial` CHANGESET.md. No resume logic exists -- re-run overwrites.
- changeset-parse refuses partial status, preventing change-application on incomplete data.
