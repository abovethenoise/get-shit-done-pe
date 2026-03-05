## User Intent Findings

### Primary Goal

Give the user a single, predictable place to see what the refinement pipeline found and what changed since last time, without re-reading the full report -- source: FEATURE.md EU-01, EU-02.

### Acceptance Criteria

- RECOMMENDATIONS.md exists at `.planning/refinement/RECOMMENDATIONS.md` after a refinement run -- pass: file exists and contains coherence synthesis content -- source: FEATURE.md EU-01 AC bullet 1
- DELTA.md exists at `.planning/refinement/DELTA.md` on second+ runs showing findings added/resolved/changed -- pass: DELTA.md present with correct diff categories -- source: FEATURE.md EU-01 AC bullet 2
- First run produces RECOMMENDATIONS.md with no DELTA.md -- pass: DELTA.md absent on first run -- source: FEATURE.md EU-01 AC bullet 4
- Supporting artifacts (matrix.md, dependency-graph.md, findings/FINDING-{id}.md, pairs/{A}-{B}.complete) written to `.planning/refinement/` -- pass: directory structure matches spec exactly -- source: FEATURE.md EU-02 AC bullet 1
- All output files are markdown with standard markdown tables (no Mermaid, no JSON) -- pass: zero non-markdown files in `.planning/refinement/`; zero Mermaid blocks; all tables are pipe-delimited markdown -- source: FEATURE.md EU-02 AC bullets 2-3
- Pre-scan snapshot captures current RECOMMENDATIONS.md and findings/ listing before scan begins (or null on first run) -- pass: FN-01 stores state that FN-03 can diff against -- source: FEATURE.md FN-01
- Report generation writes landscape-scan artifacts to `.planning/refinement/` (matrix, dependency graph, finding cards) and overwrites all files on each run -- pass: no stale artifacts from prior runs persist -- source: FEATURE.md FN-02
- Delta computation compares findings (added/resolved/changed), matrix (new/removed/changed relationships), and dependency graph (new/removed/promoted dependencies) -- pass: DELTA.md contains all three diff categories with before/after where applicable -- source: FEATURE.md FN-03
- Delta diffing is semantic (by finding ID and metadata), not textual -- pass: FINDING-001 with changed severity shows as "changed" not as "removed + added" -- source: FEATURE.md TC-02, Decisions
- `refinement-init` CLI route creates directory structure and snapshots existing state -- pass: route callable, creates `.planning/refinement/` with correct subdirectories -- source: FEATURE.md TC-01
- `refinement-write` CLI route writes a specific artifact file to the refinement directory -- pass: route accepts artifact type + content, writes to correct path -- source: FEATURE.md TC-01
- Checkpoint management reuses landscape-scan's `scan-checkpoint` route for the pairs/ directory -- pass: no new checkpoint route created; pairs/ checkpoints work via existing route -- source: FEATURE.md TC-01

### Implicit Requirements

- RECOMMENDATIONS.md is NOT written by this feature -- it is written by coherence-report. This feature manages the directory, writes other artifacts, and computes deltas. Misreading this boundary would cause duplicate or conflicting writes. -- source: FEATURE.md FN-02 bullet "RECOMMENDATIONS.md is written by coherence-report (not this feature)"
- The `.planning/refinement/` directory must be created idempotently -- if it already exists from a prior run, `refinement-init` must not fail or destroy existing content before the snapshot is taken. -- [First principles: snapshot requires reading existing state; directory creation that wipes content would destroy what needs to be snapshotted]
- Finding ID stability across runs is a prerequisite for meaningful deltas -- if landscape-scan assigns new IDs every run, all findings appear as "added" and all prior findings as "resolved." This feature assumes IDs are stable for unchanged findings. -- [First principles: FN-03 diffing by ID is meaningless without ID stability; TC-02 explicitly states "Finding identity is by ID (FINDING-001)"]
- DELTA.md must be human-scannable -- the entire point (EU-01 story) is "see what changed without reading the full report." A DELTA.md that requires cross-referencing other files to understand defeats the purpose. -- [First principles: the user story explicitly says "without reading the full report each time"]
- All file I/O goes through gsd-tools.cjs CLI routes, not through agents directly -- consistent with the architectural pattern across landscape-scan (TC-01) and coherence-report (TC-01). -- source: FEATURE.md TC-01, landscape-scan FEATURE.md TC-01
- No external dependencies -- pure Node.js. -- source: FEATURE.md TC-01

### Scope Boundaries

**In scope:**
- Directory structure creation and management (`.planning/refinement/`)
- Pre-scan snapshot of existing state
- Writing landscape-scan artifacts (matrix, dependency graph, finding cards) to the refinement directory
- Semantic delta computation between current and previous run
- DELTA.md generation
- Two new CLI routes: `refinement-init`, `refinement-write`

**Out of scope:**
- Writing RECOMMENDATIONS.md content (coherence-report's responsibility) -- source: FEATURE.md FN-02
- Historical archive of past reports -- only current state + delta from immediately prior run -- source: FEATURE.md EU-01 Out of Scope
- Merging deltas across multiple runs -- source: FEATURE.md EU-01 Out of Scope
- Alternative output formats (JSON, HTML) -- source: FEATURE.md EU-02 Out of Scope
- CHANGESET.md or execution delta (change-application's DELTA.md is a different artifact tracking execution results) -- source: change-application FEATURE.md FN-04

**Ambiguous:**
- DELTA.md naming collision: change-application also writes a DELTA.md to `.planning/refinement/` (see change-application FN-04, TC-02). refinement-artifact's FN-03 also writes DELTA.md to the same path. These appear to be the same file conceptually (change-application produces it, refinement-artifact consumes/extends it), but the specs describe different content schemas. Needs clarification on whether these are the same artifact or two distinct files.
- Finding ID stability: refinement-artifact assumes finding IDs persist across runs for the same underlying issue, but landscape-scan assigns IDs sequentially per run (FINDING-001, FINDING-002, etc. -- landscape-scan FN-03). There is no stated mechanism for ID persistence. Without it, delta computation degrades to textual comparison or becomes meaningless.
- Who orchestrates the write sequence: FN-02 says "Ensure all landscape-scan artifacts are written" but landscape-scan's own spec says its output goes to `scan-output/` (landscape-scan FN-02, FN-03). Is refinement-artifact responsible for moving/copying from `scan-output/` to `.planning/refinement/`, or does the orchestrator handle this?

### Risk: Misalignment

- The DELTA.md naming collision between refinement-artifact (FN-03) and change-application (FN-04) is the highest-risk ambiguity. Both features claim to write `.planning/refinement/DELTA.md` with different schemas. If not resolved, one feature's output will overwrite the other's. -- source: refinement-artifact FEATURE.md FN-03 vs. change-application FEATURE.md FN-04/TC-02
- Finding ID instability could make the delta feature appear broken on every run (100% churn -- all findings "resolved" and "added" each time). The user's primary goal is "see what changed," and false churn directly undermines that. -- source: landscape-scan FEATURE.md FN-03 (sequential IDs), refinement-artifact FEATURE.md TC-02 (identity by ID)
- The capability-level architecture spine shows refinement-artifact at the end of the pipeline, after change-application. But refinement-artifact's FN-01 (pre-scan snapshot) must run BEFORE the scan. This means refinement-artifact spans the full pipeline lifecycle (bookend pattern: snapshot at start, write at end), not just a terminal step. The plan must account for this split execution. -- source: CAPABILITY.md Architecture Spine, FEATURE.md FN-01 vs FN-02/FN-03
