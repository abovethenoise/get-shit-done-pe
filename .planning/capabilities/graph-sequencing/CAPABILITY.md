---
type: capability
name: "graph-sequencing"
status: implemented
created: "2026-03-09"
---

# graph-sequencing

## Goal

Build and query a DAG from composes[] edges to determine execution order, blast radius, readiness, and wave-based parallelization.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/bin/lib/graph.cjs`
- **Queries:** sequence (topo sort), waves (parallel batches), downstream (blast radius), upstream (readiness), upstream-gaps (undeclared deps), coupling, stale
- **Cycle detection:** Reports cycles for user resolution
- **Consumers:** focus workflow, plan workflow, execute workflow, framing-pipeline
