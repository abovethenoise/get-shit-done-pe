---
type: capability
name: pipeline-execution
status: complete
created: "2026-03-03"
---

# Pipeline Execution

## Goal

Research → plan → execute → review → document pipeline that turns a feature spec into verified, documented code with full requirement traceability.

## Why

Without the pipeline, GSD is just a note-taking system. The pipeline is the value — structured, parallel, verifiable execution.

## Invariants

1. Every task in PLAN.md traces to specific REQ IDs.
2. Every review traces back up to requirements.
3. PLAN.md is immutable once created.
4. State mutations go through gsd-tools CLI only.

## Boundaries

### Owns
- research-workflow, gather-synthesize, plan, execute, execute-plan, review, doc, capability-orchestrator workflows; all 17 agents; references: planner, executor, checker, verifier, pipeline-invariants

### Does Not Touch
- Discovery (framing-and-discovery), CLI internals (cli-tooling)

## Architecture Spine

```
Discovery Brief
  → research-workflow (6 parallel gatherers → synthesizer)
  → plan (gsd-planner → plan-checker → user Q&A → PLAN.md)
  → execute (gsd-executor, wave-based parallel tasks → SUMMARY.md)
  → review (4 parallel reviewers → synthesizer → verdict)
  → doc (gsd-doc-writer → .documentation/)
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| scope-fluid-pipeline | P0 | — | complete |
| plan-presentation | P1 | scope-fluid-pipeline | complete |
| research-overhaul | — | — | complete |
| doc-writer-overhaul | — | — | complete |
| scope-aware-routing | — | — | complete |
| slug-fuzzy-matching | P2 | — | complete |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-02 | Capability orchestrator reuses framing-pipeline per feature | No custom pipeline per capability | Consistent behavior, less code |
| 2026-03-02 | Mid-pipeline entry points work without prior stages | Users jump in at plan/execute/review | Requires FEATURE.md as minimum |
