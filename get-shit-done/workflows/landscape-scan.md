<purpose>
Drive the full landscape scan pipeline: discover capabilities, enumerate pairs, analyze each pair sequentially for coherence issues, consolidate findings, and assemble three-layer output.
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<inputs>
- `SCOPED_CAPS` (optional) — comma-separated capability slugs from the invoking refine command's scope resolution. When set, only these capabilities are scanned. When null/absent, operates on all capabilities.
</inputs>

<process>

<step name="init_directories">
Ensure the refinement output directory structure exists:

```bash
mkdir -p .planning/refinement/findings .planning/refinement/pairs
```
</step>

<step name="discover">
Run discovery to get all capabilities with their full contents:

```bash
DISCOVER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" scan-discover)
```

Handle @file: prefix for large output:
```bash
if [[ "$DISCOVER" == @file:* ]]; then
  DISCOVER=$(cat "${DISCOVER#@file:}")
fi
```

Parse the JSON result. Extract `capabilities` array and `gap_findings` array.

**If `SCOPED_CAPS` is set:**
- Expand scope to include adjacent capabilities via downstream traversal:
  ```bash
  for each cap in SCOPED_CAPS:
    DOWNSTREAM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query downstream "$CAP_SLUG")
  ```
  For each downstream feature: read its composes[] to find capabilities NOT already
  in SCOPED_CAPS. Add those to an `ADJACENT_CAPS` set.
  Merge: `EFFECTIVE_SCOPE = SCOPED_CAPS ∪ ADJACENT_CAPS`
  Log: "Scope expanded: {N} direct + {M} adjacent = {total} effective"

  Purpose: if cap:checkout-flow composes cap:payment-gateway, and payment-gateway
  has consumers with incomplete specs, the scan needs to see that gap.
  Without scope expansion, indirect gaps surface during execution instead of refinement.
- Filter `capabilities` to only slugs present in EFFECTIVE_SCOPE
- Log: "Scope filter applied: {N} of {total} capabilities in scope"
- Load SEQUENCE.md orphan data as additional gap_findings (orphan caps within scope)

If `gap_findings` is non-empty:
- Initialize a finding counter from the highest existing FINDING-{NNN}.md + 1 (default 1)
- For each gap finding:
  - Assign a sequential FINDING-{NNN} ID
  - Write to `.planning/refinement/findings/FINDING-{NNN}.md` with frontmatter + summary + recommendation
  - Log: "GAP: {slug} — no CAPABILITY.md"
</step>

<step name="enumerate_pairs">
Get ordered pair list and check for completed pairs:

```bash
PAIRS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" scan-pairs)
COMPLETED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" scan-checkpoint --action list)
```

Parse both JSON results.

Filter out pairs where `{a}__{b}` appears in the completed_pairs list.

**If `SCOPED_CAPS` is set:**
- Filter pairs to only those where both capabilities are in SCOPED_CAPS

Initialize the finding ID counter from the highest existing FINDING-{NNN}.md in `.planning/refinement/findings/` + 1.

Log: "{N} pairs total, {M} already complete, {P} remaining"

If 0 remaining: skip to consolidation.
</step>

<step name="sequential_pair_analysis">
For each remaining pair (A, B):

1. Extract capability A and B contents from the discovery output (match by slug).

2. Build prior findings context:
   - Load all existing FINDING-*.md files from `.planning/refinement/findings/`
   - Extract each finding's frontmatter (id, type, severity) + first paragraph of Summary
   - If total prior context exceeds ~100KB: include only HIGH severity findings + most recent 20

3. Read the agent template:
   ```bash
   cat "$HOME/.claude/get-shit-done/templates/gsd-scan-pair.md"
   ```

4. Spawn agent (Task tool, subagent_type="gsd-executor") with:
   - The template content with `{{CAPABILITY_A}}` replaced by cap A's full artifacts
   - `{{CAPABILITY_B}}` replaced by cap B's full artifacts
   - `{{PRIOR_FINDINGS}}` replaced by prior findings summaries (or "None — this is the first pair analyzed." if empty)

5. Parse agent output:
   - If output contains `NO_FINDINGS`: log "Pair {i}/{total}: {A} x {B} -> 0 findings" and continue
   - Otherwise: extract finding card blocks (split on `---` frontmatter delimiters)
   - For each finding card:
     - Assign sequential ID: FINDING-{NNN} (replace FINDING-XXX placeholder)
     - Write to `.planning/refinement/findings/FINDING-{NNN}.md`
     - Increment counter

6. If agent returns malformed output (no finding cards and no NO_FINDINGS token):
   - Log warning: "Pair {A} x {B}: malformed output, skipping"
   - Continue (don't halt scan)

7. Write checkpoint:
   ```bash
   node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" scan-checkpoint --pair "{A}__{B}" --action write
   ```

8. Log progress: "Pair {i}/{total}: {A} x {B} -> {N} findings"
</step>

<step name="consolidation">
Load all finding cards from `.planning/refinement/findings/`.

If zero findings total: note "No findings detected across all pairs" and skip to output assembly.

If findings exist, run a consolidation pass:

Analyze all finding cards together and identify root causes:
- Group N symptoms into M root causes (M <= N)
- Symptoms sharing a common underlying issue get the same ROOT-{NNN} ID
- For each root cause: assign ROOT-{NNN}, list the symptom FINDING IDs, write a root cause summary

Update each grouped finding card file to add `root_cause: ROOT-{NNN}` to its frontmatter.

Findings that are standalone (not part of a group) keep `root_cause: null`.
</step>

<step name="output_assembly">
Produce three-layer output:

**Layer 1 — Relationship Matrix (matrix.md):**

Build a capability x capability grid as a markdown table.

| | cap-a | cap-b | cap-c |
|---|---|---|---|
| cap-a | -- | DEPENDS_ON (HIGH) | NONE |
| cap-b | DEPENDS_ON (HIGH) | -- | OVERLAP (MEDIUM) |
| cap-c | NONE | OVERLAP (MEDIUM) | -- |

Each cell: relationship type from findings + confidence. If multiple findings for a pair, use the highest severity relationship. Diagonal: `--`.

Write to `.planning/refinement/matrix.md`.

**Layer 2 — Finding Cards:**

Already written as individual files during pair analysis.

In `.planning/refinement/summary.md`, list all findings sorted by severity (HIGH first), then type:

| ID | Type | Severity | Confidence | Caps | Root Cause | Summary |
|---|---|---|---|---|---|---|

Group root causes with their symptoms.

**Layer 3 — Dependency Graph (dependency-graph.md):**

Extract three types of dependencies:
- **Explicit:** From CAPABILITY.md `Dependencies` tables (direction, capability, what)
- **Implicit:** DEPENDS_ON findings discovered during analysis
- **Gap:** GAP findings where a dependency should exist but doesn't

Format as a markdown table:

| From | To | Type | Evidence |
|---|---|---|---|
| auth | database | explicit | CAPABILITY.md Dependencies table |
| payments | auth | implicit | FINDING-007: undocumented auth dependency |
| reporting | analytics | gap | FINDING-012: no spec exists for this relationship |

Write to `.planning/refinement/dependency-graph.md`.

**Summary (summary.md):**

```markdown
# Landscape Scan Summary

- **Date:** {ISO date}
- **Capabilities:** {count}
- **Pairs analyzed:** {count}
- **Tier:** {tier}
- **Findings:** {total count}

## Finding Distribution

| Type | HIGH | MEDIUM | LOW | Total |
|---|---|---|---|---|
| CONFLICT | N | N | N | N |
| GAP | N | N | N | N |
| ... | | | | |

## Root Causes

| ID | Symptoms | Summary |
|---|---|---|
| ROOT-001 | FINDING-003, FINDING-007 | Missing auth contract across 3 capabilities |

## All Findings

[sorted table as described above]

## References

- Matrix: `.planning/refinement/matrix.md`
- Dependency Graph: `.planning/refinement/dependency-graph.md`
- Individual findings: `.planning/refinement/findings/`
```

Write to `.planning/refinement/summary.md`.
</step>

<step name="completion">
Print scan summary:

```
-------------------------------------------------------
 GSD > LANDSCAPE SCAN COMPLETE
-------------------------------------------------------

Capabilities: {count}
Pairs analyzed: {total}
Findings: {total} ({HIGH} HIGH, {MEDIUM} MEDIUM, {LOW} LOW)
Root causes: {count}

HIGH severity findings:
  - FINDING-001: {summary}
  - FINDING-003: {summary}

Full results: .planning/refinement/summary.md

Next: Run coherence-report to generate recommendations from these findings.
```
</step>

</process>

<success_criteria>
- All capability pairs analyzed sequentially (or resumed from checkpoint)
- Finding cards written to .planning/refinement/findings/
- Consolidation groups symptoms into root causes
- Three-layer output: matrix.md, dependency-graph.md, summary.md
- Checkpoint markers written per completed pair
- Malformed agent output handled gracefully (skip, don't halt)
</success_criteria>
