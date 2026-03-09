# Context Assembly Pattern

Load context in layers -- each layer adds specificity:

1. **Project**: Read `.planning/PROJECT.md` for goals, stack, constraints
2. **Target spec**:
   - Capability: Read `CAPABILITY.md` contract (Receives/Returns/Rules/Failure/Constraints)
   - Feature: Read `FEATURE.md` (Goal/Flow/Scope/composes[]), then load each composed capability's contract
3. **Prior work**: Read RESEARCH.md (if exists), existing plans + summaries in target directory
4. **State**: Read `.planning/STATE.md` for current progress, blockers, decisions

For features, also run `gsd-tools gate-check <feat> --raw` to verify all composed capabilities are ready.
