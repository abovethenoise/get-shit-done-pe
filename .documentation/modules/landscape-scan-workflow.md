---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: landscape-scan.md

## Purpose: [derived]

Drive the full landscape scan pipeline: discover capabilities, enumerate pairs, analyze each pair sequentially for coherence issues, consolidate findings into root causes, and assemble three-layer output (matrix, finding cards, dependency graph). Located at `get-shit-done/workflows/landscape-scan.md`.

Entry point for the requirements-refinement pipeline. Produces artifacts consumed by coherence-report (next stage).

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** None (operates on `.planning/capabilities/` in the current project)
- **CLI commands invoked:**
  - `gsd-tools scan-discover` — returns capabilities[] with full artifacts and gap findings
  - `gsd-tools scan-pairs` — returns ordered pair list with tier classification
  - `gsd-tools scan-checkpoint --action {read|write|list}` — checkpoint management for resumability
- **Steps:**
  1. Init directories (mkdir refinement/{findings,pairs})
  2. Discover (scan-discover, write GAP findings)
  3. Enumerate pairs (scan-pairs, scan-checkpoint list, filter completed)
  4. Sequential pair analysis (per-pair sub-agent via Task())
  5. Consolidation (group symptoms into root causes)
  6. Output assembly (matrix.md, dependency-graph.md, summary.md)
- **Sub-agent delegation:** Per-pair analysis uses `templates/gsd-scan-pair.md` template (not `agents/`), spawned via Task() with `subagent_type="gsd-executor"`. Template placeholders: `{{CAPABILITY_A}}`, `{{CAPABILITY_B}}`, `{{PRIOR_FINDINGS}}`.
- **Three-layer output:**
  - Layer 1: Relationship matrix (capability x capability grid)
  - Layer 2: Individual finding cards (FINDING-{NNN}.md files)
  - Layer 3: Dependency graph (explicit + implicit + gap)
- **Outputs:** `.planning/refinement/` directory with matrix.md, summary.md, dependency-graph.md, findings/, pairs/

## Depends-on: [derived]

- `gsd-tools.cjs` — CLI tool for scan-discover, scan-pairs, scan-checkpoint routes
- `bin/lib/scan.cjs` — Implementation of the three scan CLI commands
- `templates/gsd-scan-pair.md` — Per-pair analysis agent template
- `bin/lib/core.cjs` — Shared helpers (output, error, safeReadFile)

## Constraints: [authored]

- Pairs analyzed sequentially to allow prior-findings context injection (prevents duplicate detection).
- Checkpoint written after each pair completion for resumability.
- Malformed agent output logged and skipped, not used to halt the scan.
- Finding IDs are sequential from the highest existing FINDING-{NNN} + 1.
- Prior findings context capped at ~100KB (HIGH severity + most recent 20).
