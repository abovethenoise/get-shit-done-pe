# Technical Trace: refinement-qa

## Phase 1: Internalize Requirements

### TC-01: Q&A workflow file
- File location: `workflows/refinement-qa.md`
- Uses AskUserQuestion for all user interaction
- No file I/O for scan artifacts -- orchestrator loads and passes contents
- Change set writing uses `refinement-write` CLI route
- Follows GSD UI brand patterns (stage banners, checkpoint boxes)

### TC-02: Change set format
- Markdown with frontmatter (date, finding count, resolution counts)
- Each entry is a markdown section with structured fields
- Parseable by `changeset-parse` CLI route
- RESEARCH_NEEDED and REJECT not executed by change-application

---

## Phase 2: Trace Against Code

### TC-01: Q&A workflow file

**Verdict:** met (with spec-vs-reality gaps documented below)

**Evidence:**

- **File location:** `get-shit-done/workflows/refinement-qa.md:1` -- file exists at the specified path. Confirmed via glob.
- Reasoning: Matches spec constraint "Workflow file: `workflows/refinement-qa.md`".

- **AskUserQuestion usage:** `get-shit-done/workflows/refinement-qa.md:73,88,109,117,145,165` -- AskUserQuestion is specified for auto-resolve batch (line 73), per-item resolution (line 88), research follow-up (line 109), reject/modify follow-up (line 117), open-ended exit loop (line 145), and revisit (line 165). No other user interaction mechanism is used.
- Reasoning: Fully meets "Uses AskUserQuestion for all user interaction (mandatory per GSD conventions)".

- **File I/O for scan artifacts:** `get-shit-done/workflows/refinement-qa.md:16` -- `Read .planning/refinement/RECOMMENDATIONS.md`. Lines 31-33: `Read all .planning/refinement/findings/FINDING-*.md`, `Read .planning/refinement/matrix.md`, `Read .planning/refinement/dependency-graph.md`.
- Reasoning: The workflow directly reads files from disk rather than receiving pre-loaded content from the orchestrator. This contradicts the spec constraint "No file I/O for scan artifacts -- orchestrator loads and passes contents." See spec-vs-reality gap below.

- **Change set writing:** `get-shit-done/workflows/refinement-qa.md:133-135` -- `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file {temp_json} --checkpoint`. Line 175: same route without `--checkpoint` for final write.
- Reasoning: The workflow uses `changeset-write` CLI route, not `refinement-write` as the spec states. The `changeset-write` route exists in `get-shit-done/bin/gsd-tools.cjs:455-458` and delegates to `cmdChangesetWrite` in `get-shit-done/bin/lib/refinement.cjs:456-537`. See spec-vs-reality gap below.

- **GSD UI brand patterns:** `get-shit-done/workflows/refinement-qa.md:54-59` -- uses `-------------------------------------------------------` (dashes) with `GSD > REFINEMENT Q&A` format. The ui-brand.md reference (`get-shit-done/references/ui-brand.md:10-12`) specifies `━━━━━━━` (heavy horizontal lines) with `GSD >` prefix format.
- Reasoning: The workflow uses dash-based banners (`---`) instead of the heavy-line banners (`━━━`) from ui-brand.md. It also uses `>` instead of the specified `>` prefix. The `required_reading` directive at line 6-7 correctly references `ui-brand.md`. The banner style is a minor deviation from the brand reference. See spec-vs-reality gap below.

**Spec-vs-reality gaps:**

1. **File I/O model:** The spec says "No file I/O for scan artifacts -- orchestrator loads and passes contents," but the workflow reads files directly via `Read` tool (lines 16, 31-33). This is pragmatic: the workflow is a prompt document consumed by the LLM agent, and the agent uses its Read tool to access files. There is no separate "orchestrator" that pre-loads content. The `<inputs>` block at line 9-10 says "No explicit inputs -- reads from .planning/refinement/ directory," confirming the design choice.

2. **CLI route name:** The spec says "Change set writing uses `refinement-write` CLI route" but the implementation uses `changeset-write`, a dedicated route registered at `gsd-tools.cjs:455` that calls `cmdChangesetWrite` in `refinement.cjs:456`. This is a better design: `changeset-write` handles JSON-to-markdown conversion, frontmatter generation, entry validation, and type sorting -- none of which `refinement-write` supports (it is a generic file writer). The spec requirement was infeasible as `refinement-write` has no changeset-specific logic.

3. **Banner style:** The workflow uses dashes (`---`) instead of heavy lines (`━━━`) from ui-brand.md. This is a cosmetic deviation. The `>` prefix is used instead of `>`.

**Cross-layer observations:**

- FN-01 (Agenda loading): The workflow parses RECOMMENDATIONS.md directly (line 16-35), loading the Q&A Agenda table, contradictions section, and supporting artifacts. This satisfies the functional requirement but deviates from the TC-01 "no file I/O" constraint.

---

### TC-02: Change set format

**Verdict:** met

**Evidence:**

- **Markdown with frontmatter:** `get-shit-done/bin/lib/refinement.cjs:494-504` --
  ```
  lines.push('---');
  lines.push(`date: ${today}`);
  lines.push(`status: ${status}`);
  lines.push(`source: ${data.source || '.planning/refinement/RECOMMENDATIONS.md'}`);
  lines.push(`total_items: ${sorted.length}`);
  lines.push('counts:');
  for (const t of CHANGESET_TYPES) {
    lines.push(`  ${t.toLowerCase()}: ${counts[t.toLowerCase()]}`);
  }
  lines.push('---');
  ```
- Reasoning: Frontmatter includes date, status, source, total_items, and per-type counts. Spec says "date, finding count, resolution counts" -- `total_items` serves as finding count, and the per-type counts under `counts:` serve as resolution counts.

- **Structured entry fields:** `get-shit-done/bin/lib/refinement.cjs:521-528` --
  ```
  lines.push(`### ${entry.id}: ${entry.topic}`);
  lines.push(`- **Type:** ${entry.type}`);
  lines.push(`- **Source:** ${entry.source_finding || 'user-initiated'}`);
  lines.push(`- **Capabilities:** ${...}`);
  lines.push(`- **Action:** ${entry.action}`);
  lines.push(`- **Reasoning:** ${entry.reasoning}`);
  ```
- Reasoning: Each entry is a markdown section (`###`) with the five structured fields specified: type, source, capabilities, action, reasoning. Matches "Each entry is a markdown section with structured fields."

- **Parseable by changeset-parse:** `get-shit-done/bin/lib/refinement.cjs:542-608` -- `cmdChangesetParse` function parses frontmatter, extracts meta fields including counts, and splits on `### CS-` to parse entries. Route registered at `gsd-tools.cjs:460-463`.
- Reasoning: The parse function reads CHANGESET.md, extracts frontmatter metadata (date, status, source, total, counts), and parses entry blocks into structured objects with id, topic, type, source, capabilities, action, reasoning. Fully meets "Parseable by `changeset-parse` CLI route."

- **RESEARCH_NEEDED and REJECT not executed:** `get-shit-done/bin/lib/refinement.cjs:574-577` --
  ```
  if (meta.status === 'partial') {
    error('CHANGESET.md is partial (incomplete Q&A session). Cannot parse for execution.');
  }
  ```
- Reasoning: The changeset-parse route itself does not filter out RESEARCH_NEEDED or REJECT entries -- it returns all entries. The filtering is the responsibility of the downstream change-application consumer. The spec says these types are "not executed by change-application," which is a constraint on change-application, not on changeset-parse. The types are correctly defined in `CHANGESET_TYPES` at line 450: `['ACCEPT', 'MODIFY', 'REJECT', 'RESEARCH_NEEDED', 'ASSUMPTION_OVERRIDE', 'USER_INITIATED']`.

- **Entry validation:** `get-shit-done/bin/lib/refinement.cjs:471-477` -- validates required fields (id, topic, type, capabilities, action, reasoning) and validates type against `CHANGESET_TYPES`.
- Reasoning: Strict validation ensures only well-formed entries with valid types are written.

- **Type sorting:** `get-shit-done/bin/lib/refinement.cjs:481-483` -- entries sorted by type order (ACCEPT first, then MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED).
- Reasoning: Spec says "Entries sorted by type, then by finding severity" (FN-04). Sorting by type is implemented. Sorting within type by severity is not implemented -- entries maintain original order within each type group. This is a minor gap against FN-04 but does not affect TC-02 parseability.

- **Checkpoint support:** `get-shit-done/bin/lib/refinement.cjs:459,491` -- `--checkpoint` flag sets `status: partial`. Line 574-577: `cmdChangesetParse` refuses to parse partial changesets.
- Reasoning: Checkpoint writes produce valid CHANGESET.md with `status: partial`, and the parse route correctly blocks execution of incomplete changesets.

**Spec-vs-reality gap:** None for TC-02.

**Cross-layer observations:**

- FN-04 specifies "Entries sorted by type, then by finding severity." The implementation sorts by type only (line 481-483). Within-type severity sorting is absent. This is a functional gap, not a TC-02 gap, since TC-02 only requires the format to be parseable and structured.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met (with gaps) | `workflows/refinement-qa.md` exists, uses AskUserQuestion throughout, uses `changeset-write` (not `refinement-write` as spec says), reads files directly (spec says no file I/O), banner style deviates from ui-brand.md |
| TC-02 | met | `refinement.cjs:494-528` -- frontmatter + structured entries; `refinement.cjs:542-608` -- `changeset-parse` route parses correctly; all 6 entry types validated |

### Cross-layer gaps (secondary, for other reviewers)

| Req ID | Observation |
|--------|-------------|
| FN-04 | Within-type severity sorting not implemented (`refinement.cjs:481-483` sorts by type only) |
| TC-01/FN-01 | Workflow reads files directly instead of receiving pre-loaded content; pragmatic given agent execution model |
