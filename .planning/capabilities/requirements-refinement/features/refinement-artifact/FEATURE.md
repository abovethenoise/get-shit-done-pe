---
type: feature
capability: "requirements-refinement"
status: specified
created: "2026-03-05"
---

# refinement-artifact

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| EU-02 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Persistent refinement report

**Story:** As a GSD user, I want each refinement run to produce a current-state report with a delta from the previous run, so that I can see what changed between passes without reading the full report each time.

**Acceptance Criteria:**

- [ ] REPORT.md contains current-state summary with links to supporting artifacts
- [ ] DELTA.md shows findings added/resolved/changed since last run
- [ ] Supporting artifacts (matrix.md, dependency-graph.md, findings/) are written to `.planning/refinement/`
- [ ] First run produces REPORT.md with no DELTA.md (no previous state to diff)

**Out of Scope:**

- Historical archive of all past reports (only current + delta from previous)
- Merging deltas across multiple runs (each delta is relative to the immediately prior run only)

### EU-02: Scan artifact directory structure

**Story:** As a GSD user, I want all refinement scan outputs organized in a predictable directory structure, so that agents and tools can locate and parse them reliably.

**Acceptance Criteria:**

- [ ] Directory structure matches:
  ```
  .planning/refinement/
  ├─ REPORT.md
  ├─ DELTA.md
  ├─ matrix.md
  ├─ dependency-graph.md
  ├─ findings/FINDING-{id}.md
  └─ pairs/{A}-{B}.complete
  ```
- [ ] All files are markdown (no Mermaid, no JSON)
- [ ] All tables are standard markdown tables (agent-parseable, diffable)

**Out of Scope:**

- Alternative output formats (JSON export, HTML rendering)

## Functional Requirements

### FN-01: Pre-scan snapshot

**Receives:** Trigger from refinement orchestrator before scan begins.

**Returns:** Snapshot of current REPORT.md contents (or null if first run).

**Behavior:**

- If `.planning/refinement/REPORT.md` exists, read and store its contents in memory for delta computation after scan completes
- If no REPORT.md exists (first run), store null — delta computation will be skipped
- Also snapshot the current findings/ directory listing (finding IDs and their summaries) for delta diffing

### FN-02: Report generation

**Receives:** Aggregated scan output from landscape-scan (matrix, finding cards, dependency graph) + Q&A results from refinement-qa + applied changes from change-application.

**Returns:** Rewritten REPORT.md + supporting artifact files.

**Behavior:**

- REPORT.md structure:
  - Frontmatter: date, run number, capability count, finding count, change count
  - Summary: high-level stats (findings by severity, relationship types distribution)
  - Links to supporting artifacts (matrix.md, dependency-graph.md, findings/)
  - Changes applied this run (from change-application output)
- matrix.md: capability × capability relationship matrix as markdown table
- dependency-graph.md: markdown table with columns: From, To, Relationship, Explicit (yes/implicit/gap)
- findings/FINDING-{id}.md: individual finding cards (preserved from landscape-scan output)
- Overwrite all files (current state, not cumulative)

### FN-03: Delta computation

**Receives:** Pre-scan snapshot + newly written REPORT.md and findings/.

**Returns:** DELTA.md written to `.planning/refinement/`.

**Behavior:**

- Compare previous findings list to current findings list:
  - **Added:** findings in current but not in previous (new issues detected)
  - **Resolved:** findings in previous but not in current (issues no longer detected)
  - **Changed:** findings with same ID but different severity, type, or recommendation
- Compare previous matrix to current matrix:
  - New relationships, removed relationships, changed relationship types
- Compare previous dependency graph to current:
  - New dependencies, removed dependencies, implicit→explicit promotions
- If first run (no previous snapshot): skip DELTA.md creation entirely
- DELTA.md format: markdown sections for each diff category with before/after where applicable

## Technical Specs

### TC-01: Directory management CLI routes

**Intent:** Keep file I/O in gsd-tools.cjs. Orchestrator and agents don't manage directory structure directly.

**Upstream:** Refinement orchestrator triggers directory setup before scan.

**Downstream:** All other refinement features write to this directory structure.

**Constraints:**

- New CLI route: `refinement-init` — creates `.planning/refinement/` directory structure, snapshots existing state if present
- New CLI route: `refinement-write` — writes a specific artifact file (REPORT.md, DELTA.md, matrix.md, dependency-graph.md) to the refinement directory
- Checkpoint management reuses landscape-scan's `scan-checkpoint` route (pairs/ directory)
- No external dependencies

### TC-02: Delta diffing logic

**Intent:** Compute meaningful diffs between refinement runs without external diff tools.

**Upstream:** Pre-scan snapshot (FN-01) + post-scan artifacts (FN-02).

**Downstream:** DELTA.md consumed by user and by future refinement runs for trend awareness.

**Constraints:**

- Diff is semantic, not textual — compare finding IDs and metadata, not raw text
- Finding identity is by ID (FINDING-001) — if a finding keeps its ID across runs, it's the "same" finding (may have changed severity/details)
- Matrix diff compares cell values (relationship type + confidence per pair)
- Dependency graph diff compares rows (from/to/type/explicit tuples)
- All diff output is markdown tables (consistent with the rest of the artifact format)

## Decisions

- 2026-03-05: Single current-state file (REPORT.md) rewritten each run, not cumulative. DELTA.md tracks changes from immediately prior run only.
- 2026-03-05: No Mermaid — all artifacts are markdown tables for agent-parseability and diffability.
- 2026-03-05: Directory lives at `.planning/refinement/` (project-level, alongside capabilities/).
- 2026-03-05: Delta is semantic (compare finding IDs/metadata), not textual (no raw text diff).
