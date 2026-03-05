# Review Decisions: change-application

## Summary

| Finding | Severity | Decision |
|---------|----------|----------|
| 1. CLI invocation syntax bug | blocker | Accept (fix + standardize) |
| 2. DELTA.md vs EXECUTION-LOG.md naming | major | Accept (update FEATURE.md) |
| 3. Stale example title in TC-02 | minor | Accept |
| 4. Reinstate partial-deletion risk | minor | Dismiss |
| 5. Fix-and-resume unbounded retry | minor | **Escalated** |
| 6. EU-01 scope narrower than FN-01 | minor | Not presented (superseded) |
| 7. delta-parse route not implemented | minor | Not presented (superseded) |

## Escalated Concern: Over-Engineering

User identified that the entire change-application feature violates KISS/YAGNI. The feature applies changes to markdown documentation files (CAPABILITY.md, FEATURE.md) — this does not warrant:
- 7 classified mutation types with a topological execution engine
- WAL execution log pattern
- Idempotency pre-checks
- 3-option failure handler with recursive retry
- 9 requirements

User direction: "Once it gets the direction of what documentation to update and what changes to apply, it should just do it. There's so little risk in needing to have anything more engineered."

**Action needed:** Fundamental simplification of this feature — both FEATURE.md requirements and workflow implementation.
