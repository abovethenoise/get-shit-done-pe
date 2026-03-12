---
name: gsd:refine
description: Run project-level coherence audit — scan all capabilities, synthesize findings, Q&A, apply changes, generate report
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Run the requirements-refinement pipeline: scan capabilities for coherence issues, synthesize findings into recommendations, walk the user through Q&A, apply confirmed changes, and generate the refinement report with delta.

When a focus group is active, scopes to its capabilities. Otherwise operates project-wide.

**Pipeline:** scope-resolution → refinement-init → landscape-scan → coherence-report → refinement-qa → change-application → refinement-report + delta
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/landscape-scan.md
@{GSD_ROOT}/get-shit-done/workflows/coherence-report.md
@{GSD_ROOT}/get-shit-done/workflows/refinement-qa.md
@{GSD_ROOT}/get-shit-done/workflows/change-application.md
</execution_context>

<context>
**User reference:** $ARGUMENTS (optional — ignored, scope determined by active focus group)

Operates on `.planning/capabilities/` and writes to `.planning/refinement/`.
When focus-scoped: only capabilities composed by the focus group's features are scanned.
</context>

<process>

## 1. Pre-flight Check

Verify the project has capabilities to scan:

```bash
CAPS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list --raw)
```

Parse JSON result. If `capabilities` array is empty:
- Inform user: "No capabilities found. Run `/gsd:discuss-capability` to create capabilities first."
- Stop.

Log: "Found {N} capabilities. Starting refinement pipeline."

## 1b. Scope Resolution

```bash
FOCUS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state get active-focus)
```

Parse JSON result.

**If `active_focus` is not null:**
- Extract the focus group's feature list
- For each feature, read its `composes[]` from frontmatter
- Build `SCOPED_CAPS` = union of all composed capability slugs
- Log: "Focus-scoped refinement: {N} capabilities from focus group '{name}'"
- Pass `SCOPED_CAPS` to landscape-scan (set as environment context)

**If `active_focus` is null:**
- Use AskUserQuestion:
  - header: "Refinement Scope"
  - question: "No active focus group found. How should I scope this refinement?"
  - options:
    - "Project-wide (scan all capabilities)"
    - "Run /gsd:focus first to set a focus group"
- If user picks focus first: stop and suggest `/gsd:focus`
- If project-wide: proceed without scope filter (`SCOPED_CAPS` = null)

## 2. Initialize Refinement Directory

```bash
SNAPSHOT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" refinement-init --raw)
```

Parse JSON. Store the snapshot for delta computation in Step 7.

If `.planning/refinement/` already has artifacts from a prior run, refinement-init snapshots them before clearing findings. Log: "Snapshot captured from prior run — delta will be computed at end."

## 3. Landscape Scan

```
@{GSD_ROOT}/get-shit-done/workflows/landscape-scan.md
```

This discovers all capabilities, enumerates pairs, runs sequential pair analysis, consolidates findings into root causes, and produces the three-layer output (matrix.md, findings/, dependency-graph.md, summary.md).

On completion, the workflow prints a scan summary. Proceed to next stage.

## 4. Coherence Report

```
@{GSD_ROOT}/get-shit-done/workflows/coherence-report.md
```

This loads scan artifacts + project context, spawns the coherence synthesizer agent, and writes RECOMMENDATIONS.md with root causes, goal alignment, resolution sequence, contradictions, and Q&A agenda.

On completion, the workflow prints a report summary. Proceed to next stage.

## 5. Refinement Q&A

```
@{GSD_ROOT}/get-shit-done/workflows/refinement-qa.md
```

This walks the user through every agenda item from RECOMMENDATIONS.md. For each item: accept, research needed, or reject/modify. Supports auto-resolve batching, contradiction adjacency, and open-ended follow-up. Writes CHANGESET.md.

On completion, the workflow prints resolution counts. Proceed to next stage.

## 6. Change Application

Check if CHANGESET.md has any actionable entries before proceeding:

```bash
CHANGESET=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw)
```

Parse result. If no actionable entries (all REJECT or RESEARCH_NEEDED):
- Log: "No actionable changes — skipping change application."
- Skip to Step 7.

Otherwise:

```
@{GSD_ROOT}/get-shit-done/workflows/change-application.md
```

This parses CHANGESET.md, applies confirmed changes (creates via CLI, edits via Read+Edit), handles failures with fix/skip/abort, and writes EXECUTION-LOG.md.

## 7. Refinement Report + Delta

Write the snapshot from Step 2 to a temp file, then compute delta:

```bash
# Write snapshot to temp file
echo '{snapshot_json}' > /tmp/gsd-refinement-snapshot.json

# Compute delta against current state
DELTA=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" refinement-delta --snapshot-file /tmp/gsd-refinement-snapshot.json --raw)
```

Parse result:
- If `delta: false` and `reason: "first_run"`: log "First refinement run — no delta to compute."
- If delta exists: DELTA.md has been written to `.planning/refinement/DELTA.md`

Clean up temp file.

## 8. Completion

```
-------------------------------------------------------
 GSD > REFINEMENT COMPLETE
-------------------------------------------------------

Capabilities scanned: {N}
Findings: {total} ({HIGH} HIGH, {MEDIUM} MEDIUM, {LOW} LOW)
Changes applied: {applied} | Skipped: {skipped} | Rejected: {rejected}
{if delta: "Delta from prior run: .planning/refinement/DELTA.md"}

Artifacts:
  .planning/refinement/RECOMMENDATIONS.md
  .planning/refinement/CHANGESET.md
  .planning/refinement/EXECUTION-LOG.md
  .planning/refinement/matrix.md
  .planning/refinement/dependency-graph.md
  .planning/refinement/findings/

Next: Review changes with `/gsd:status`, or run `/gsd:refine` again after addressing RESEARCH_NEEDED items.
{if active focus group detected from STATE.md:
  "Focus group '{name}' is ready for planning: `/gsd:plan {focus-slug}`"}
```

</process>

<success_criteria>
- Pre-flight confirms capabilities exist before scanning
- refinement-init snapshots prior state and clears stale findings
- All 4 workflow stages execute in sequence: scan → report → Q&A → apply
- Changeset with no actionable entries skips change-application gracefully
- Delta computed from pre-scan snapshot vs post-scan state
- Completion summary shows counts from all stages
</success_criteria>
