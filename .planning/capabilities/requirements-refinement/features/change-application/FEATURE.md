---
type: feature
capability: "requirements-refinement"
status: specified
created: "2026-03-05"
---

# change-application

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| EU-02 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| FN-04 | - | - | - | - | - | draft |
| FN-05 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Apply confirmed changes to project artifacts

**Story:** As a GSD user, I want the confirmed change set from refinement Q&A to be executed against my capability and feature files, so that coherence findings become real project changes without manual file editing.

**Acceptance Criteria:**

- [ ] All ACCEPT and MODIFY entries from CHANGESET.md are applied to the corresponding capability/feature files
- [ ] REJECT and RESEARCH_NEEDED entries are logged but not executed
- [ ] Each mutation uses a gsd-tools CLI route when one exists; falls back to direct markdown edit with UNVALIDATED flag when no route exists
- [ ] Changes are applied in a safe execution order (creates before moves before kills)
- [ ] Output is a DELTA.md execution log consumed by refinement-artifact

**Out of Scope:**

- Generating the change set (refinement-qa's job)
- Writing the refinement report (refinement-artifact's job)
- Re-running the coherence scan after changes

### EU-02: Graceful failure handling with user control

**Story:** As a GSD user, I want execution to halt on failure and show me what succeeded, what failed, and what's pending, so that I can decide how to proceed rather than having partial changes applied silently.

**Acceptance Criteria:**

- [ ] On failure, execution halts immediately
- [ ] User sees: applied entries (safe to keep), failed entry (with reason), pending entries (not yet attempted)
- [ ] User chooses: fix and resume, skip and continue, or abort
- [ ] Skipped entries are logged in DELTA.md with SKIPPED status

**Out of Scope:**

- Automatic retry or self-healing of failed mutations

## Functional Requirements

### FN-01: Change set parsing

**Receives:** Path to `.planning/refinement/CHANGESET.md` (written by refinement-qa).

**Returns:** Ordered list of executable change entries.

**Behavior:**

- Parse CHANGESET.md via `gsd-tools changeset-parse` CLI route (returns JSON)
- Filter to actionable entries: ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE
- Exclude non-actionable entries: REJECT (log only), RESEARCH_NEEDED (track for next run)
- Sort into safe execution order:
  1. Create capabilities
  2. Create feature stubs
  3. Move features between capabilities
  4. Modify metadata (rename, update description, adjust dependencies)
  5. Reinstate features (killed/deferred -> exploring)
  6. Defer features
  7. Kill features
  8. Kill capabilities

### FN-02: Mutation execution

**Receives:** Sorted list of actionable change entries.

**Returns:** Execution result per entry (APPLIED | FAILED | SKIPPED | PENDING).

**Behavior:**

- For each entry, determine the mutation type from the action field
- 7 mutation types supported:
  1. **Create capability** — new capability directory + CAPABILITY.md
  2. **Create feature** — new feature stub under existing capability
  3. **Move feature** — relocate feature directory from source to target capability
  4. **Modify metadata** — update status, description, dependencies, or other fields in cap/feature files
  5. **Reinstate feature** — set status to `exploring`, clear kill/defer reasoning, clear downstream artifacts (research, plans) that may conflict with new requirements
  6. **Defer feature** — set status to `deferred` with reasoning
  7. **Kill feature/capability** — set status to `killed` with reasoning
- Route selection per mutation:
  - Check if gsd-tools has a CLI route for this mutation type
  - If yes: execute via CLI (validated path)
  - If no: execute via direct markdown file edit, flag entry as UNVALIDATED in DELTA.md
- On success: record APPLIED in DELTA.md, proceed to next entry
- On failure: halt immediately, proceed to FN-03

### FN-03: Failure handling

**Receives:** Failed mutation entry + current execution state.

**Returns:** User decision on how to proceed.

**Behavior:**

- Report to user via AskUserQuestion:
  - Applied entries (completed successfully, safe to keep)
  - Failed entry with error reason
  - Pending entries (not yet attempted)
- User options:
  1. **Fix and resume** — user fixes the issue externally, execution resumes from the failed entry
  2. **Skip and continue** — mark failed entry as SKIPPED, proceed with remaining entries
  3. **Abort** — stop execution, mark all remaining entries as PENDING
- Write current state to DELTA.md regardless of choice

### FN-04: DELTA.md output

**Receives:** Complete execution results (all entries processed or execution aborted).

**Returns:** Written DELTA.md artifact at `.planning/refinement/DELTA.md`.

**Behavior:**

- Each entry contains:
  - Change ID (from CHANGESET.md)
  - Result: APPLIED | FAILED | SKIPPED | PENDING
  - Error message (if FAILED)
  - UNVALIDATED flag (if direct edit was used instead of CLI route)
- Summary at top: counts by result (X applied, Y failed, Z skipped, W pending)
- Non-actionable entries (REJECT, RESEARCH_NEEDED) listed separately as logged-only

### FN-05: Reinstate mutation specifics

**Receives:** Reinstate entry targeting a killed or deferred feature.

**Returns:** Feature reset to exploring state.

**Behavior:**

- Set feature status to `exploring`
- Clear kill/defer reasoning from the feature file
- Clear downstream artifacts that may conflict with new requirements:
  - Research artifacts (if any)
  - Plan artifacts (if any)
- Keep the feature's EU/FN/TC sections if they exist (they'll be re-evaluated during discuss-feature)
- If feature was killed, remove from any killed-features tracking

## Technical Specs

### TC-01: Execution engine

**Intent:** Orchestrate mutation execution with CLI-first routing and fallback to direct edits.

**Upstream:** CHANGESET.md from refinement-qa. gsd-tools CLI routes from cli-tooling.

**Downstream:** DELTA.md consumed by refinement-artifact. Updated cap/feature files consumed by all GSD workflows.

**Constraints:**

- Implemented as a workflow file (part of the refinement orchestration)
- Uses gsd-tools CLI routes where available (create-capability, create-feature, etc.)
- Direct file edits use Read/Edit tools (not Bash sed/awk)
- UNVALIDATED flags in DELTA.md serve as backlog items for future CLI route coverage
- Must not corrupt existing file content on partial failure — each mutation is atomic at the file level

### TC-02: DELTA.md format

**Intent:** Simple execution log that refinement-artifact can consume to build the refinement report.

**Upstream:** Execution results from this feature.

**Downstream:** refinement-artifact reads DELTA.md to populate the "Changes Applied" section of REFINEMENT-REPORT.md.

**Constraints:**

- Markdown with frontmatter (date, changeset source, result counts)
- Written to `.planning/refinement/DELTA.md`
- Parseable by gsd-tools if needed (new CLI route: `delta-parse`)
- Overwritten on each refinement run (not append-only — refinement-artifact handles history)

**Example:**

```
---
date: 2026-03-05
changeset: .planning/refinement/CHANGESET.md
applied: 5
failed: 1
skipped: 0
pending: 2
---

# Refinement Delta

## Summary

| Result | Count |
|--------|-------|
| APPLIED | 5 |
| FAILED | 1 |
| SKIPPED | 0 |
| PENDING | 2 |

## Entries

### CS-01: Create capability analytics-pipeline
Result: APPLIED

### CS-02: Create feature analytics-pipeline/data-ingestion
Result: APPLIED

### CS-03: Move feature drill-timing from practice to analytics-pipeline
Result: FAILED
Error: Target capability analytics-pipeline/features directory not found

### CS-04: Kill feature legacy-export
Result: PENDING

## Logged Only

### CS-07: Reject recommendation to merge capabilities X and Y
Type: REJECT
Reasoning: User considers these intentionally separate

### CS-08: Research needed for dependency cycle detection
Type: RESEARCH_NEEDED
```

## Decisions

- 2026-03-05: 7 mutation types: create cap, create feature, move feature, modify metadata, reinstate, defer, kill.
- 2026-03-05: CLI routes first, direct edits as fallback with UNVALIDATED flag — don't block on missing routes.
- 2026-03-05: Safe execution order: creates -> moves -> metadata -> reinstate -> defer -> kill features -> kill caps.
- 2026-03-05: Halt on failure with user choice (fix+resume, skip+continue, abort) — no silent partial application.
- 2026-03-05: DELTA.md is simple: change ID, result, error if failed. No before/after snapshots.
- 2026-03-05: Reinstate resets to exploring, clears kill/defer reasoning and downstream artifacts (research, plans).
- 2026-03-05: REJECT and RESEARCH_NEEDED entries logged but not executed.
