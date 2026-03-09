---
type: capability
name: "multi-agent-orchestration"
status: implemented
created: "2026-03-09"
---

# multi-agent-orchestration

## Goal

Spawn, route, and coordinate specialized agents using flat delegation patterns (gather-synthesize N→1, single 1→1) with model-appropriate routing.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/workflows/gather-synthesize.md`, `get-shit-done/references/delegation.md`
- **22 agents:** 6 researchers, 1 planner, 1 executor, 1 verifier, 4 reviewers, 3 doc agents, 3 synthesizers, 1 plan-checker, 1 coherence-synthesizer, 1 quality reviewer
- **Model routing:** Opus for judgment/synthesis/planning, Sonnet for execution/gathering
- **Constraint:** Flat only — no nested spawning. Pass file paths, not content.
