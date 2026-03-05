# Functional Trace Report: refinement-qa

**Date:** 2026-03-05
**Artifacts reviewed:**
- `get-shit-done/workflows/refinement-qa.md` (workflow spec / prompt)
- `get-shit-done/bin/lib/refinement.cjs` (tooling library)
- `get-shit-done/bin/gsd-tools.cjs` (CLI dispatch)

---

## Phase 1: Internalize Requirements

| Req ID | Behavior Specification |
|--------|------------------------|
| FN-01 | Load RECOMMENDATIONS.md, parse Q&A Agenda table and Contradictions table, load finding cards/matrix/dependency-graph |
| FN-02 | Structured Q&A: walk items in priority order; 3 options (Accept/Research/Reject-Modify); follow-up captures; contradiction adjacency reordering; auto-resolve batching; empty response guard; checkpoint every 7 items |
| FN-03 | Open-ended phase: USER_INITIATED new concerns, ASSUMPTION_OVERRIDE, revisit decisions, exit loop pattern |
| FN-04 | CHANGESET.md via changeset-write; 6 entry types; summary counts at top |
| TC-01 | Workflow file uses AskUserQuestion |
| TC-02 | Change set format: markdown+frontmatter, changeset-parse compatible |

EU-01 and EU-02 are not FN-layer requirements; they are noted but not traced here.

---

## Phase 2: Trace Against Code

### FN-01: Agenda loading

**Verdict:** met

**Evidence:**
- `workflows/refinement-qa.md:16-35` -- Step `load_and_parse_agenda` specifies: read RECOMMENDATIONS.md; parse Q&A Agenda table via pipe-splitting; parse Contradictions table; load FINDING-*.md files, matrix.md, dependency-graph.md.
- `workflows/refinement-qa.md:18` -- `"If file does not exist: abort with 'RECOMMENDATIONS.md not found. Run coherence-report first.'"` -- abort guard present.
- `refinement.cjs:15-58` -- `parseMarkdownTable()` implements the inline pipe-splitting parser: finds header row, skips separator, parses data rows into objects. This is the utility the workflow instructs Claude to use (or Claude can inline-parse per the workflow's inline instructions).
- `refinement.cjs:88-125` -- `snapshotFindings()` reads FINDING-*.md files into a map keyed by finding ID, extracting frontmatter fields (type, severity, recommendation, summary).
- `refinement.cjs:130-142` -- `snapshotTable()` reads matrix.md and dependency-graph.md.
- Reasoning: The workflow prompt contains explicit instructions for every sub-behavior. The tooling library provides the parsing utilities. The workflow is a prompt (not executable code), so the contract is met by the instructions being complete and the tools being available.

**Cross-layer observations:** The workflow is a meta-prompt -- actual execution depends on Claude following the instructions. The tooling library supports the data loading but does not enforce the full parse sequence itself. This is by design for a prompt-orchestration framework.

---

### FN-02: Structured Q&A phase

**Verdict:** met

**Evidence:**

**Priority-order walk:**
- `workflows/refinement-qa.md:84-87` -- `"For each remaining item: counter++, checkpoint_counter++. Present the item via AskUserQuestion"` -- items walked sequentially.

**3 options:**
- `workflows/refinement-qa.md:98` -- `options: ["Accept", "Research needed", "Reject/Modify"]`

**Research needed follow-up:**
- `workflows/refinement-qa.md:108-114` -- Follow-up AskUserQuestion with `options: ["Done entering text"]`, captures user's conversational text, records as `RESEARCH_NEEDED`.

**Reject/Modify follow-up:**
- `workflows/refinement-qa.md:117-123` -- Follow-up AskUserQuestion with `options: ["Reject entirely", "Modified action entered"]`, branches to REJECT or MODIFY type.

**Contradiction adjacency reordering:**
- `workflows/refinement-qa.md:64-67` -- `"For each contradiction pair: if the two items are separated by more than 2 positions, move the later item to immediately follow the earlier item"` -- reordering specified with logging.

**Auto-resolve batching:**
- `workflows/refinement-qa.md:69-79` -- Auto-resolve items presented as batch first, with Accept all / Review individually options.

**Empty response guard:**
- `workflows/refinement-qa.md:100-103` -- `"If response is empty/null: retry the SAME AskUserQuestion once. If still empty: ask conversationally for their choice. NEVER auto-advance on empty response."`

**Checkpoint every 7 items:**
- `workflows/refinement-qa.md:132-137` -- `"Write current resolutions to CHANGESET.md via changeset-write with --checkpoint flag"`, reset checkpoint_counter, log message. The trigger is `checkpoint_counter` incremented per item, but the workflow does not explicitly state `if checkpoint_counter >= 7` or `if checkpoint_counter % 7 === 0`.
- `workflows/refinement-qa.md:132` -- The step heading says "Checkpoint write (every 7 items)" but the body only says "checkpoint_counter++" without an explicit conditional. The intent is clear from the heading but the instruction body lacks the explicit trigger condition `if checkpoint_counter === 7`.
- Reasoning: This is a minor gap in instruction precision. The heading "every 7 items" communicates the intent, but since Claude follows instructions literally, the missing conditional could cause inconsistent checkpoint frequency. However, the heading + success_criteria line 214 (`"Periodic checkpoint writes (every 7 items)"`) together make the intent unambiguous. Verdict: met (the behavioral contract is specified, even if the instruction could be more explicit).

---

### FN-03: Open-ended phase

**Verdict:** met

**Evidence:**

**USER_INITIATED:**
- `workflows/refinement-qa.md:155-158` -- `"New concern not in report: type = USER_INITIATED"`, asks for capabilities and action, records with `source = "user-initiated"`.

**ASSUMPTION_OVERRIDE:**
- `workflows/refinement-qa.md:159-162` -- `"Override assumption: type = ASSUMPTION_OVERRIDE"`, asks which finding and why by-design, records with `source = finding ID`.

**Revisit previous decisions:**
- `workflows/refinement-qa.md:163-166` -- Shows previous resolution, re-presents with same 3 options, replaces previous entry.

**Exit loop:**
- `workflows/refinement-qa.md:144-148` -- `"Does this look good, or is there anything else to discuss?"` with options `["Looks good - finalize", "I have something to add"]`. Returns to exit loop after each addition.

---

### FN-04: Change set output

**Verdict:** met

**Evidence:**

**CHANGESET.md via changeset-write:**
- `workflows/refinement-qa.md:172-176` -- Final write via `changeset-write --content-file {temp_json}` without --checkpoint (status: complete).
- `workflows/refinement-qa.md:178` -- Fallback: `"If changeset-write fails: fall back to direct Write tool. Log warning."`
- `refinement.cjs:456-537` -- `cmdChangesetWrite()` implements the write. Reads JSON, validates entries, sorts by type order, writes markdown with frontmatter.

**6 entry types:**
- `refinement.cjs:450` -- `const CHANGESET_TYPES = ['ACCEPT', 'MODIFY', 'REJECT', 'RESEARCH_NEEDED', 'ASSUMPTION_OVERRIDE', 'USER_INITIATED']` -- all 6 types defined.
- `refinement.cjs:475-476` -- Validation enforces entries must use one of these types.

**Summary counts at top:**
- `refinement.cjs:508-516` -- Summary table rendered with `| Type | Count |` for each of the 6 types.
- `workflows/refinement-qa.md:189-197` -- Completion step also prints summary counts to user.

---

### TC-01: Workflow file using AskUserQuestion

**Verdict:** met

**Evidence:**
- `workflows/refinement-qa.md:73,88,101,109,117,129,145,165` -- AskUserQuestion is used throughout the workflow for: auto-resolve batching, item presentation, empty response retry, research follow-up, reject/modify follow-up, deeper question re-present, open-ended exit loop, and revisit decisions.
- Reasoning: The workflow is a prompt file (not executable code), and it specifies AskUserQuestion as the interaction mechanism at every decision point. This matches TC-01.

**Cross-layer observations:** The `header` field on AskUserQuestion calls must be max 12 characters per `get-shit-done/references/questioning.md:110`. The workflow specifies `header: "QA {counter}/{total}" (max 12 chars)` at line 89. For large agendas (e.g., 100+ items), `"QA 100/100"` is 10 chars -- within limit. Headers "QA Auto", "QA Detail", "QA Open" are all under 12. All compliant.

---

### TC-02: Change set format (markdown+frontmatter, changeset-parse compatible)

**Verdict:** met

**Evidence:**

**Markdown + frontmatter:**
- `refinement.cjs:494-504` -- Frontmatter block with `date`, `status`, `source`, `total_items`, `counts` fields.

**changeset-parse compatible:**
- `refinement.cjs:542-608` -- `cmdChangesetParse()` parses the exact format produced by `cmdChangesetWrite()`:
  - Frontmatter parsed at line 548-572
  - Entry blocks split on `### CS-` at line 581
  - Fields extracted: Type, Source, Capabilities, Action, Reasoning at lines 590-594
- `refinement.cjs:575-577` -- Partial status guard: `"if meta.status === 'partial': error(...)"` -- checkpoint writes cannot be parsed for execution.

**Round-trip integrity:**
- Write produces entries as `### {entry.id}: {entry.topic}` (line 522). Parse splits on `### CS-` (line 581) and expects `^(\d+):\s*(.+)` (line 584). This means entries MUST use `CS-N` format IDs for parse to work.
- The workflow specifies `id: "CS-{counter}"` at line 106, which matches.

**Cross-layer observations:** The `cmdChangesetParse` split pattern `^### CS-` (line 581) is tightly coupled to the ID format. If the workflow were to produce IDs like `CS-auto-1` for auto-resolved items, the parse regex `^(\d+)` would fail. Current workflow spec uses sequential numeric IDs only, so this is compatible.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `workflows/refinement-qa.md:16-35` -- complete load/parse instructions; `refinement.cjs:15-142` -- supporting utilities |
| FN-02 | met | `workflows/refinement-qa.md:52-137` -- all sub-behaviors specified (3 options, follow-ups, adjacency, batching, empty guard, checkpoints) |
| FN-03 | met | `workflows/refinement-qa.md:140-167` -- USER_INITIATED, ASSUMPTION_OVERRIDE, revisit, exit loop all specified |
| FN-04 | met | `refinement.cjs:450-537` -- changeset-write with 6 types, summary counts, frontmatter |
| TC-01 | met | `workflows/refinement-qa.md` -- AskUserQuestion used at all 8+ decision points |
| TC-02 | met | `refinement.cjs:456-537` write + `refinement.cjs:542-608` parse -- round-trip compatible format |
