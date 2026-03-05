---
type: feature
capability: "requirements-refinement"
status: specified
created: "2026-03-05"
---

# refinement-qa

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| EU-02 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| FN-04 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Guided refinement discussion

**Story:** As a GSD user, I want to walk through every coherence finding with Claude to accept, reject, modify, or flag for research, so that all cross-capability issues are deliberately resolved before changes are applied.

**Acceptance Criteria:**

- [ ] Every item in the Q&A agenda from RECOMMENDATIONS.md is presented for discussion (no severity-based skipping)
- [ ] Each item offers 3 resolution options: accept, research needed (with text input), reject/modify (with reasoning)
- [ ] User can ask deeper questions about any finding during discussion
- [ ] After structured items, open-ended phase allows user-initiated concerns and changes
- [ ] Exit follows existing GSD Q&A pattern: "Does this look good or anything else?" loop
- [ ] Output is a confirmed change set consumed by change-application

**Out of Scope:**

- Applying changes to files (change-application's job)
- Generating the recommendations (coherence-report's job)
- Running the scan (landscape-scan's job)

### EU-02: User-initiated changes during Q&A

**Story:** As a GSD user, I want to propose changes not in the report (new concerns, assumption overrides, design decisions), so that my project knowledge gets captured alongside the automated findings.

**Acceptance Criteria:**

- [ ] User can raise new concerns not found by the scan
- [ ] User can override assumptions (mark a finding as intentional/by-design with reasoning)
- [ ] User-initiated items produce change set entries with the same structure as report-driven items
- [ ] All user-provided reasoning is persisted in the change set

**Out of Scope:**

- User running additional scans mid-Q&A (would need to restart the pipeline)

## Functional Requirements

### FN-01: Agenda loading

**Receives:** Trigger from refinement orchestrator after coherence-report completes.

**Returns:** Loaded Q&A agenda from RECOMMENDATIONS.md.

**Behavior:**

- Read `.planning/refinement/RECOMMENDATIONS.md`
- Parse the Q&A agenda section (final section of RECOMMENDATIONS.md)
- Load agenda items with their categories: decision items, informational items, auto-resolvable items
- Load supporting context: finding cards from `findings/`, matrix from `matrix.md`, dependency graph from `dependency-graph.md`
- All items are discussed regardless of severity — no filtering or skipping

### FN-02: Structured Q&A phase

**Receives:** Loaded agenda items in priority order (from resolution sequence in RECOMMENDATIONS.md).

**Returns:** Resolution for each agenda item.

**Behavior:**

- Walk through every agenda item in priority order
- For each item, present via AskUserQuestion:
  - Finding summary + affected capabilities + recommendation
  - 3 resolution options:
    1. **Accept** — recommendation goes to change set as-is
    2. **Research needed** — user provides context/question text; item flagged for investigation
    3. **Reject/Modify** — user provides reasoning; either kills recommendation or adjusts it
- After user resolves an item, record the resolution in the change set
- Claude can provide deeper context when asked (explain the finding, show related findings, reference source docs)
- Contradictions (from RECOMMENDATIONS.md contradictions section) are presented as paired items — user resolves which direction to take

### FN-03: Open-ended phase

**Receives:** Completed structured phase (all agenda items resolved).

**Returns:** Additional change set entries from user-initiated discussion.

**Behavior:**

- After all structured items processed, enter open phase
- User can:
  - Ask questions about any finding for deeper context
  - Propose new changes not in the report (USER_INITIATED entries)
  - Override assumptions on any finding (ASSUMPTION_OVERRIDE entries with reasoning)
  - Revisit a structured decision and change their resolution
- Each user-initiated action produces a change set entry
- Exit signal: "Does this look good or is there anything else to discuss?" — user confirms done or continues
- Loop until user confirms done (follows existing GSD Q&A patterns)

### FN-04: Change set output

**Receives:** All resolutions from structured + open phases.

**Returns:** Written change set artifact consumed by change-application.

**Behavior:**

- Change set written to `.planning/refinement/CHANGESET.md`
- Each entry contains:
  - Entry type: ACCEPT | MODIFY | REJECT | RESEARCH_NEEDED | ASSUMPTION_OVERRIDE | USER_INITIATED
  - Source: finding ID (if from report) or "user-initiated" (if from open phase)
  - Affected capabilities (from finding card or user-specified)
  - Action: what to do (from recommendation or user input)
  - Reasoning: user's reasoning (for reject/modify/override) or recommendation text (for accept)
- Entries sorted by type, then by finding severity
- Summary at top: counts by type (X accepted, Y rejected, Z deferred to research, etc.)

## Technical Specs

### TC-01: Q&A workflow file

**Intent:** Workflow orchestrates the Q&A conversation using AskUserQuestion, following existing GSD patterns.

**Upstream:** RECOMMENDATIONS.md from coherence-report. Supporting artifacts from landscape-scan.

**Downstream:** CHANGESET.md consumed by change-application.

**Constraints:**

- Workflow file: `workflows/refinement-qa.md` (or embedded in the main refinement workflow)
- Uses AskUserQuestion for all user interaction (mandatory per GSD conventions)
- No file I/O for scan artifacts — orchestrator loads and passes contents
- Change set writing uses `changeset-write` CLI route from refinement
- Follows GSD UI brand patterns (stage banners, checkpoint boxes)

### TC-02: Change set format

**Intent:** Machine-readable change set that change-application can parse and execute.

**Upstream:** Q&A resolutions from this feature.

**Downstream:** change-application reads CHANGESET.md and executes each entry.

**Constraints:**

- Markdown with frontmatter (date, finding count, resolution counts)
- Each entry is a markdown section with structured fields (type, source, capabilities, action, reasoning)
- Parseable by gsd-tools.cjs (new CLI route: `changeset-parse` — reads CHANGESET.md, returns JSON)
- RESEARCH_NEEDED items are not executed by change-application — they're tracked for the next refinement run
- REJECT items are logged but not executed (deliberate no-action)

## Decisions

- 2026-03-05: All items discussed regardless of severity — thorough refinement, no shortcuts.
- 2026-03-05: 3 resolution options per item (accept, research needed, reject/modify) — simpler than 4+ options.
- 2026-03-05: User-initiated items produce full change set entries (not just notes).
- 2026-03-05: ASSUMPTION_OVERRIDE is a distinct entry type — user explicitly marks findings as by-design.
- 2026-03-05: Change set written to CHANGESET.md — machine-parseable for change-application.
- 2026-03-05: Exit follows existing GSD Q&A pattern ("Does this look good?" loop).
