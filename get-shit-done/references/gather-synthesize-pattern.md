# Gather-Synthesize Pattern

Spawn 6 research gatherers in parallel, each investigating a different lens. Pass `target_type` (capability|feature) so each gatherer orients correctly.

## Gatherer Orientation by Type

| Gatherer | Capability Focus | Feature Focus |
|----------|-----------------|---------------|
| edge-cases | Failure behavior, atomic boundaries | User-facing failure states |
| tech-constraints | Hard limits, libs, what not to touch | Scope boundary (what caps exist vs need building) |
| prior-art | Existing primitives that solve this | Existing features that compose similarly |
| domain-truth | Contract rules, invariants | Flow logic, orchestration |
| existing-system | Upstream outputs needed, downstream consumers | Handoff contracts between composed capabilities |
| user-intent | What this primitive must do | What the user experiences |

## Synthesizer Output by Type

- **Capability**: Contract Consensus, Failure Modes, Constraints, Gaps
- **Feature**: Flow Consensus, Scope Validation, Dependency Check (are all composes[] contracted?), Gaps

## Spawn Pattern

For each gatherer:
1. Spawn agent with target context + type orientation
2. Agent writes findings to `research/{gatherer-name}-findings.md`
3. On failure after 2 retries: log skip, continue with remaining gatherers

After all gatherers complete, spawn synthesizer to merge findings into RESEARCH.md.
