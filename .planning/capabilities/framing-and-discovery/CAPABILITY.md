---
type: capability
name: framing-and-discovery
status: complete
created: "2026-03-03"
---

# Framing & Discovery

## Goal

Four discovery lenses (debug/new/enhance/refactor) run structured Q&A, fill MVU slots, and hand off a Discovery Brief to the pipeline.

## Why

Users arrive with fuzzy intentions. Framing converts "I want to fix this" into a scoped, typed requirement set before any code is planned.

## Invariants

1. Every framing session produces a Discovery Brief before pipeline entry.
2. Lens pivot (mid-session lens switch) must zero out the Specification section.
3. AskUserQuestion is the only allowed interaction mechanism — no plain-text questions.

## Boundaries

### Owns
- framing-discovery.md, framing-pipeline.md, discuss-capability.md, discuss-feature.md, framings/{lens}/anchor-questions.md

### Does Not Touch
- Research/plan/execute (pipeline-execution owns that)

## Architecture Spine

```
/gsd:{lens}
  → framing-discovery.md (Q&A loop, MVU slots)
  → Discovery Brief written
  → framing-pipeline.md (LENS + brief injected into pipeline)
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| askuserquestion-warmup-fix | P1 | session-context | planning |
| post-qa-routing-fix | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-02 | Discovery Brief as handoff artifact | Need to carry framing context through pipeline | Adds one artifact per session |
