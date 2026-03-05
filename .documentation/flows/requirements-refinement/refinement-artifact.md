---
type: flow-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Flow: requirements-refinement/refinement-artifact

## Trigger: [derived]

The refinement artifact lifecycle is driven by CLI commands invoked at different stages of the requirements-refinement pipeline. Not a single workflow file -- these are utility operations called by other workflows.

## Input: [derived]

- `refinement-init`: no explicit input (reads existing `.planning/refinement/` state)
- `refinement-report`: `--matrix-file`, `--dependency-graph-file`, `--findings-dir` flags pointing to temp content
- `refinement-delta`: `--snapshot-file` pointing to JSON snapshot from init

## Steps: [derived]

```
Lifecycle across the pipeline:

1. refinement-init (before landscape-scan)
   -> mkdir .planning/refinement/{findings,pairs}
   -> snapshot existing state:
      - RECOMMENDATIONS.md content
      - findings -> Map keyed by FINDING-{NNN} (extracts severity, type, summary, recommendation)
      - matrix.md -> Map keyed by first two columns
      - dependency-graph.md -> Map keyed by From|To
   -> clear existing findings (delete FINDING-*.md to prevent orphans)
   -> return snapshot as JSON (Maps serialized as [key, value] arrays)

2. landscape-scan writes artifacts
   -> refinement-write --type finding (per finding)
   -> refinement-write --type checkpoint (per pair)

3. refinement-report (after landscape-scan consolidation)
   -> write matrix.md from --matrix-file
   -> write dependency-graph.md from --dependency-graph-file
   -> copy findings from --findings-dir (clears destination first)

4. refinement-delta (after report, before coherence-report)
   -> load snapshot JSON from --snapshot-file
   -> first-run check: if snapshot has null recommendations AND 0 findings -> skip delta
   -> read current state (findings, matrix, dependency-graph)
   -> compute diffs via diffMaps() for each artifact type
   -> render DELTA.md with Added/Resolved/Changed tables per section
   -> return diff counts
```

### Snapshot-Then-Clear Pattern

`refinement-init` snapshots existing state THEN clears findings. This ensures:
- The delta can compare old vs new after the scan completes
- Orphan findings from a previous run don't contaminate the new scan
- The snapshot is a point-in-time capture, not affected by subsequent writes

### First-Run Skip

On first run, the snapshot contains null recommendations and zero findings. `refinement-delta` detects this and returns `{ delta: false, reason: 'first_run' }` without writing DELTA.md -- there is nothing to compare against.

## Output: [derived]

- `refinement-init`: JSON snapshot (consumed by refinement-delta later)
- `refinement-report`: writes matrix.md, dependency-graph.md, findings/ to `.planning/refinement/`
- `refinement-delta`: `.planning/refinement/DELTA.md` with three sections (Findings, Matrix Changes, Dependency Graph Changes)

## Side-effects: [derived]

- `refinement-init` deletes existing FINDING-*.md files from `.planning/refinement/findings/`
- `refinement-report` clears and re-copies findings directory
- `refinement-delta` writes DELTA.md (overwrites if exists)

## WHY: [authored]

**Snapshot-then-clear, not diff-on-write:** Taking a snapshot at init time and diffing at delta time decouples the scan from delta computation. The scan writes freely without tracking changes -- the delta is computed after the fact from the snapshot baseline.

**First-run skip avoids meaningless delta:** A delta comparing "nothing" to "something" would be all additions with zero analytical value. Skipping produces a cleaner user experience.
