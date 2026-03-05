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
| EU-01 | - | - | - | - | done | draft |
| EU-02 | - | - | - | - | done | draft |
| FN-01 | - | - | - | - | done | draft |
| TC-01 | - | - | - | - | done | draft |

## End-User Requirements

### EU-01: Apply confirmed changes to project artifacts

**Story:** As a GSD user, I want the confirmed change set from refinement Q&A to be executed against my capability and feature files, so that coherence findings become real project changes without manual file editing.

**Acceptance Criteria:**

- [ ] All ACCEPT, MODIFY, USER_INITIATED, and ASSUMPTION_OVERRIDE entries from CHANGESET.md are applied
- [ ] REJECT and RESEARCH_NEEDED entries are logged but not executed
- [ ] Creates use CLI routes (capability-create, feature-create); everything else uses direct markdown edits
- [ ] Output is EXECUTION-LOG.md consumed by refinement-artifact

**Out of Scope:**

- Generating the change set (refinement-qa's job)
- Writing the refinement report (refinement-artifact's job)
- Re-running the coherence scan after changes

### EU-02: Graceful failure handling with user control

**Story:** As a GSD user, I want execution to halt on failure and show me what succeeded, what failed, and what's pending, so that I can decide how to proceed rather than having partial changes applied silently.

**Acceptance Criteria:**

- [ ] On failure, execution halts immediately
- [ ] User sees: applied entries, failed entry (with reason), pending entries
- [ ] User chooses: fix and resume, skip and continue, or abort
- [ ] Final state written to EXECUTION-LOG.md

**Out of Scope:**

- Automatic retry or self-healing of failed mutations

## Functional Requirements

### FN-01: Parse, apply, and log changes

**Receives:** `.planning/refinement/CHANGESET.md` (written by refinement-qa).

**Returns:** EXECUTION-LOG.md with per-entry results.

**Behavior:**

- Parse CHANGESET.md via `gsd-tools changeset-parse` CLI route (returns JSON)
- Filter to actionable entries: ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE
- For each actionable entry, read the action text and apply:
  - If action says create capability → `gsd-tools capability-create {slug}`
  - If action says create feature → `gsd-tools feature-create {cap} {feat}`
  - Everything else → direct markdown edit (Read + Edit tools)
- On failure → halt and AskUserQuestion with fix/skip/abort options
- After all entries processed (or aborted), write EXECUTION-LOG.md with results
- Non-actionable entries (REJECT, RESEARCH_NEEDED) listed in logged-only section

## Technical Specs

### TC-01: Workflow-based execution

**Intent:** Simple workflow that reads changeset, applies changes, logs results.

**Upstream:** CHANGESET.md from refinement-qa. gsd-tools CLI routes for creates.

**Downstream:** EXECUTION-LOG.md consumed by refinement-artifact.

**Constraints:**

- Implemented as workflow file: `workflows/change-application.md`
- CLI routes for creates (positional args): `capability-create <slug>`, `feature-create <cap> <slug>`
- Direct file edits use Read/Edit tools (not Bash sed/awk)
- Single EXECUTION-LOG.md write at end (not incremental WAL)
- No mutation type classification — action text is interpreted directly
- No topological sort — changeset ordering from refinement-qa handles creates-first naturally
- No idempotency pre-checks — if a create target exists, CLI route handles it

## Decisions

- 2026-03-05: CLI routes for creates, direct edits for everything else — simplest correct approach.
- 2026-03-05: Halt on failure with user choice (fix+resume, skip+continue, abort) — no silent partial application.
- 2026-03-05: EXECUTION-LOG.md (not DELTA.md) — clearer name for what the artifact contains.
- 2026-03-05: REJECT and RESEARCH_NEEDED entries logged but not executed.
- 2026-03-05: No mutation classification, topological sort, or idempotency pre-checks — unnecessary complexity for the actual use case.
