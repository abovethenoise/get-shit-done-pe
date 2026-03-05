---
lens: new
secondary_lens: null
subject: requirements-refinement/refinement-artifact
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** requirements-refinement/refinement-artifact
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Finding ID Stability Is the Critical Design Risk

All gatherers that touch delta computation agree: if finding IDs are not stable across runs, the delta feature is useless. Landscape-scan assigns sequential IDs per run (FINDING-001, FINDING-002...) with no persistence mechanism. Without stable IDs, every run shows 100% churn (all "resolved" + all "added"), defeating the user's primary goal of "see what changed."

The spec's explicit `FINDING-{id}` identity model is correct in principle but has no enforcement mechanism. Content-derived hashing is an anti-pattern (SonarQube learned this). The ID scheme must be deterministic or assigned-and-persisted.

[Sources: Domain Truth, User Intent, Tech Constraints, Edge Cases, Prior Art]

### Snapshot-Diff-Render Is the Correct Architecture

The Terraform plan pattern maps directly: snapshot state before scan, run scan, diff snapshot vs. current, render DELTA.md. The three-category taxonomy (added/removed/changed) is mathematically exhaustive for keyed entity sets. Implementation is ~50-80 lines of set operations on `Map` objects -- no external dependencies needed.

Existing codebase precedent: `state-snapshot` command already parses markdown into structured data for comparison.

[Sources: Domain Truth, Prior Art, Tech Constraints]

### Semantic Diff, Not Textual Diff

Delta computation must operate on entity identity (finding IDs, capability-pair keys, dependency tuples), not on raw text lines. Textual diff produces noise on formatting changes and misses semantic equivalence when rows are reordered. The spec's TC-02 constraint is well-grounded.

[Sources: Domain Truth, Prior Art, Tech Constraints]

### Zero Runtime Dependencies -- Build Everything In-House

No external diff libraries. The diffing problem is fundamentally set intersection/difference on keyed records -- trivially implementable with JS built-in `Map`/`Set`. Adding a library for ~30 lines of set logic violates YAGNI and the project's zero-dep constraint.

[Sources: Tech Constraints, Prior Art, Existing System]

### Directory Convention at `.planning/refinement/`

Follows established `.planning/` convention. All consumers hard-code the same path. Convention-over-configuration eliminates path negotiation bugs. The directory is entirely greenfield -- no existing code reads from or writes to this path.

[Sources: Domain Truth, Existing System, User Intent]

### Markdown Tables for All Output (No Mermaid, No JSON)

Empirically validated: markdown tables achieve ~60.7% LLM comprehension accuracy, outperforming CSV. Mermaid is unreliable for LLM generation. Consistent with existing codebase conventions (verification tables, progress tables are all markdown).

[Sources: Domain Truth, Existing System, User Intent]

### First-Run Produces No DELTA.md

Delta requires two states. On first run, only one exists. A "100% added" DELTA.md adds no information beyond the full report. Skip it entirely. Every snapshot-comparison system handles cold-start this way.

[Sources: Domain Truth, User Intent, Edge Cases, Tech Constraints]

### CLI Routes Follow Established Patterns

`refinement-init` and `refinement-write` follow the exact pattern of `capability-create`/`feature-create`: add `case` entries to the flat switch in `gsd-tools.cjs`, create a new `lib/refinement.cjs` module with exported command functions, use `mkdirSync({ recursive: true })` + `writeFileSync`, terminate via `output()`.

[Sources: Existing System, Tech Constraints]

### Overwrite-on-Each-Run Is Correct

Since the goal is "what is true now," overwriting matrix.md, dependency-graph.md, and findings/ on each run avoids stale data. Delta captures what changed; artifacts capture what is. Stale finding files must be explicitly deleted (not just overwritten), since fewer findings in a new run would leave orphans.

[Sources: Domain Truth, Edge Cases, User Intent]

## Conflicts

### DELTA.md Naming Collision

**User Intent says:** Both refinement-artifact (FN-03) and change-application (FN-04) write `DELTA.md` to `.planning/refinement/`. These appear to have different content schemas -- one is a semantic diff of findings/matrix/graph, the other is an execution log of applied/failed/skipped mutations.

**Edge Cases says:** This is a critical design issue -- one will overwrite the other depending on execution order. Must rename one or merge them.

**Resolution:** These are clearly different artifacts with different purposes. Rename change-application's output (e.g., `EXECUTION-LOG.md` or `CHANGESET.md`). The planner must resolve this naming collision before implementation -- it is a spec-level bug, not an implementation decision. [Sources: User Intent, Edge Cases]

### Who Orchestrates the Write Sequence

**User Intent says:** It's ambiguous whether refinement-artifact copies artifacts from landscape-scan's `scan-output/` to `.planning/refinement/`, or whether the orchestrator handles this.

**Existing System says:** `refinement-write` must accept content as input (via `--content-file` arg) rather than generating it -- the CLI route is a writer, not a producer.

**Resolution:** The `refinement-write` route is a dumb file writer. The orchestrator (or the agent running the pipeline) is responsible for passing the right content to the right route. This is consistent with the centralized-writer pattern. [Sources: User Intent, Existing System]

### Refinement-Artifact Spans the Full Pipeline (Bookend Pattern)

**User Intent says:** The architecture spine shows refinement-artifact as a terminal step, but FN-01 (pre-scan snapshot) must run BEFORE the scan. This is a split-execution feature.

**Domain Truth says:** Snapshots must be immutable and complete at capture time -- FN-01 must run atomically before any writes begin.

**Resolution:** The planner must model refinement-artifact as a bookend: `refinement-init` (snapshot) runs at pipeline start, `refinement-write` + delta computation run at pipeline end. This is two entry points, not one sequential step. [Sources: User Intent, Domain Truth]

## Gaps

### Missing Dimensions

None -- all 6/6 gatherers succeeded.

### Low-Confidence Findings

- **Matrix and dependency graph format contracts are not formalized.** The exact markdown table format for matrix.md (header row, cell syntax like "DEPENDS_ON / HIGH") and dependency-graph.md (From/To/Relationship/Explicit columns) exist only as spec prose, not as schemas. A markdown table parser must be written from scratch, and its format assumptions become the de facto contract. [Source: Tech Constraints only]

- **Lock file for concurrent runs.** Edge Cases suggests a `.lock` file to prevent concurrent `refinement-init` races. However, this is a single-user CLI tool and the scenario is "rare" severity. Probably YAGNI unless proven otherwise. [Source: Edge Cases only]

- **Write atomicity.** The codebase uses bare `writeFileSync` everywhere with no temp-file-then-rename pattern. A killed process mid-write produces corrupted files. Edge Cases flags this but no other gatherer considers it urgent for a CLI tool. [Source: Edge Cases only]

### Unanswered Questions

1. **How will finding IDs be stabilized across runs?** Every gatherer flags this but none proposes a concrete mechanism. Options: content-hash-based (anti-pattern per Prior Art), persisted ID registry, or deterministic assignment from capability-pair + finding-type. The planner must decide.

2. **What happens when matrix dimensions change between runs?** Domain Truth flags that added/removed capabilities change the matrix shape. Delta must compare by capability-name keys, not positional indices. No gatherer proposes a specific implementation.

3. **Does the `scan-checkpoint` route need to exist before refinement-artifact can be built?** Tech Constraints says it is blocked. Existing System says it creates an ordering dependency. The alternative is implementing checkpoint logic as a shared utility (~20 lines).

## Constraints Discovered

Hard limits the planner MUST respect. Violating these leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Zero runtime dependencies (only Node.js builtins + bundled js-yaml) | Tech Constraints, Existing System | No external diff/markdown libraries allowed |
| CJS module format (.cjs extension, require/module.exports) | Tech Constraints, Existing System | No ESM imports |
| `output()` calls `process.exit(0)` -- single result per CLI invocation | Existing System, Tech Constraints | `refinement-init` and `refinement-write` must each be self-contained |
| Node.js >= 16.7.0 | Tech Constraints | All needed fs APIs available |
| CLI output >50KB auto-redirected to tmpfile via `@file:` protocol | Tech Constraints | Large deltas handled automatically, no extra work |
| No existing markdown table parser in codebase | Tech Constraints | Must build one from scratch for matrix/graph diffing |
| `scan-checkpoint` route does not exist yet | Tech Constraints, Existing System | Either build landscape-scan first or implement checkpoint as shared utility |
| Finding IDs must be stable across runs for delta to work | Domain Truth, User Intent, Edge Cases, Prior Art | Without this, delta feature is fundamentally broken |
| DELTA.md naming collision with change-application | User Intent, Edge Cases | Spec-level bug -- must be resolved before implementation |
| Markdown tables only (no Mermaid, no JSON artifacts) | Domain Truth, Existing System, User Intent | All output files must be pipe-delimited markdown |
| RECOMMENDATIONS.md is NOT written by this feature | User Intent, Existing System | coherence-report owns that content; this feature manages the directory |
| Orphaned findings must be cleaned up | Edge Cases, Domain Truth | `refinement-init` must clear findings/ before writing new scan output |
| `readdirSync` order is filesystem-dependent | Edge Cases | Must sort explicitly after reading finding files |

## Recommended Scope

### Build (In Scope)

- **`lib/refinement.cjs` module** with `cmdRefinementInit` and `cmdRefinementWrite` exports -- follows established one-module-per-domain pattern [Existing System, Tech Constraints]
- **`refinement-init` CLI route** -- creates `.planning/refinement/` directory structure, snapshots existing RECOMMENDATIONS.md and findings/ listing (or null on first run) [all gatherers agree on pattern]
- **`refinement-write` CLI route** -- writes a named artifact file to the refinement directory, accepts artifact type + content-file argument [Existing System, User Intent]
- **`parseMarkdownTable(content)` utility** -- returns array of row objects from pipe-delimited markdown tables; this becomes the format contract for matrix.md and dependency-graph.md [Tech Constraints]
- **`diffMaps(oldMap, newMap)` utility** -- set operations on keyed Maps producing `{added, removed, changed}` -- the core delta engine (~30 lines) [Prior Art, Domain Truth]
- **Snapshot functions** for findings, matrix, and dependency graph -- read markdown into keyed Maps [Prior Art, Tech Constraints]
- **DELTA.md renderer** -- generates human-scannable markdown from diff results, showing finding ID + what changed (concise diff pattern from Terraform) [Prior Art, User Intent]
- **Orphan cleanup** -- clear findings/ directory before writing new scan output to prevent stale files [Edge Cases]
- **Path sanitization** in `refinement-write` to prevent path traversal [Edge Cases]

### Skip (Out of Scope)

- **Historical archive / cumulative delta log** -- explicitly out of scope per EU-01; only current + previous delta [User Intent, Prior Art]
- **External diff libraries** -- YAGNI, violates zero-dep constraint [Prior Art, Tech Constraints]
- **Lock file for concurrent runs** -- single-user CLI tool, "rare" scenario, YAGNI [Edge Cases]
- **Write atomicity (temp-file-then-rename)** -- no existing pattern in codebase, low risk for CLI tool, not worth the complexity [Edge Cases]
- **Content-hash-based finding IDs** -- anti-pattern per SonarQube experience [Prior Art]
- **Mermaid diagrams or JSON output** -- explicitly excluded by spec [Domain Truth, User Intent]

### Investigate Further

- **Finding ID stability mechanism** -- the single highest-risk open question. Without a decision here, the delta feature cannot work correctly. Options to evaluate: (a) deterministic ID assignment from capability-pair + finding-type composite key, (b) persisted ID registry in `.planning/refinement/`, (c) accept sequential IDs and document the limitation. This is a cross-feature concern touching landscape-scan's ID assignment. [Domain Truth, User Intent, Prior Art, Edge Cases]
- **DELTA.md naming collision resolution** -- spec-level bug between refinement-artifact and change-application. Must be resolved before planning either feature. Recommend renaming change-application's artifact. [User Intent, Edge Cases]
- **`scan-checkpoint` build order** -- determine whether to (a) build landscape-scan first, (b) implement checkpoint as shared utility in `lib/refinement.cjs`, or (c) defer checkpoint functionality. Option (b) is ~20 lines and removes the dependency. [Tech Constraints, Existing System]
- **Matrix/dependency-graph table format contract** -- define the exact markdown format so the parser can be built with confidence. Currently exists only as prose in landscape-scan spec. [Tech Constraints]
