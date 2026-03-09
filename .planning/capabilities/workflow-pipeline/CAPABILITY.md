---
type: capability
name: "workflow-pipeline"
status: implemented
created: "2026-03-09"
---

# workflow-pipeline

## Goal

Orchestrate the full lifecycle pipeline: discover → plan → execute → review → doc, with capability-scope DAG fan-out and feature-scope linear execution.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/workflows/framing-pipeline.md`, `get-shit-done/workflows/framing-discovery.md`, `get-shit-done/workflows/plan.md`, `get-shit-done/workflows/execute-plan.md`, `get-shit-done/workflows/review.md`, `get-shit-done/workflows/doc.md`
- **Four framing lenses:** new (architect), enhance (editor), refactor (surgeon), debug (detective)
- **Capability scope:** DAG wave orchestration across all features
- **Feature scope:** Linear pipeline
- **Escalation:** 3-tier (minor/moderate/major), max 1 backward reset per run
