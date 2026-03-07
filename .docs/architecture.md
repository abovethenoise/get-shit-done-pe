# Architecture Notes

## Delegation Topology

Workflows form a two-tier delegation hierarchy:

```
Tier 2 (orchestrators)          Tier 1 (direct delegators)
┌──────────────────────┐        ┌──────────────────────┐
│ framing-pipeline.md  │───────>│ plan.md              │
│ init-project.md      │───────>│ execute.md           │
└──────────────────────┘        │ execute-plan.md      │
  No Task() calls               │ review.md            │
  Include delegation.md         │ doc.md               │
  so they understand             │ landscape-scan.md    │
  child workflow                 │ coherence-report.md  │
  constraints                   └──────────────────────┘
                                  Task() calls directly
                                  Include delegation.md
                                  for spawning rules
```

Both tiers include `delegation.md` in required_reading, but for different reasons. Tier 1 needs it for direct subagent spawning rules. Tier 2 needs it to understand delegation constraints of the workflows they invoke. Do not remove delegation.md from Tier 2 workflows just because they don't call Task() directly.

## Intentional Required-Reading Redundancy

Workflows that use `gather-synthesize.md` (doc.md, review.md) also include `delegation.md` directly in their own required_reading. This is intentional — `gather-synthesize.md` defers to `delegation.md` for operational details, but calling workflows should not depend on transitive required_reading resolution. If someone removes the "redundant" delegation.md from doc.md or review.md, the direct dependency would be lost.
