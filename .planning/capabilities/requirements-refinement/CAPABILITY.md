---
type: capability
name: "Requirements Refinement"
status: complete
created: "2026-03-05"
---

# requirements-refinement

## Goal

Project-level coherence audit that scans all capabilities/features, identifies gaps/overlaps/misalignments, and refines them through guided Q&A.

## Why

After brainstorming capabilities and features in isolation (often in parallel), there's no mechanism to step back and assess how everything fits together. Individual discuss-capability sessions lack cross-project awareness. Without refinement, the project accumulates redundant features, missing dependencies, and misaligned scopes that only surface during implementation.

## Domain Model

| Entity | Description | Relationships |
|--------|-------------|---------------|
| Landscape Map | Snapshot of all caps/features with status, dependencies, alignment | Input to Coherence Report |
| Coherence Report | Recommendations, gaps, overlaps, ambiguities with justifications | Drives Refinement Q&A |
| Refinement Q&A | Guided discussion to resolve ambiguities and confirm/reject recommendations | Produces Change Set |
| Change Set | Confirmed changes to apply (create/kill/defer caps, restructure features) | Applied to cap/feature files |
| Refinement Artifact | Persistent REFINEMENT-REPORT.md tracking each refinement pass | Accumulates over runs |

## Invariants

1. Refinement is repeatable — can run at any point, not gated to a specific lifecycle stage.
2. All changes require user confirmation during Q&A — no silent modifications.
3. Manipulates the same artifacts as discuss-capability (capability files, feature stubs) but from project-level perspective.

## Boundaries

### Owns

- Cross-capability coherence assessment
- Project-level gap/overlap/misalignment detection
- Refinement report generation and persistence
- Guided Q&A for resolving cross-cutting ambiguities

### Consumes

- Capability files (.documentation/capabilities/*.md, .planning/capabilities/*/CAPABILITY.md)
- Feature stubs and their status
- Project goal/design context (ROADMAP.md, STATE.md)

### Does Not Touch

- Per-capability exploration (discuss-capability's domain)
- Sprint bundling / focus group creation (focus's domain)
- Per-feature implementation planning (pipeline's domain)

## Architecture Spine

```
All cap/feature files --> [landscape-scan] --> Landscape Map
                                                    |
                                              [coherence-report]
                                                    |
                                              Recommendations + Gaps + Overlaps
                                                    |
                                              [refinement-qa] (guided Q&A)
                                                    |
                                              Confirmed Change Set
                                                    |
                                              [change-application] --> Updated cap/feature files
                                                    |
                                              [refinement-artifact] --> REFINEMENT-REPORT.md
```

## Dependencies

| Direction | Capability | What | Notes |
|-----------|------------|------|-------|
| Consumes  | framing-and-discovery | Capability/feature file formats and conventions | Reads and writes same artifact types |
| Consumes  | cli-tooling | gsd-tools.cjs for capability/feature CRUD | Uses existing create/kill/defer commands |
| Consumes  | command-surface | Skill invocation pattern | New /gsd:refine command |

## Features

Features are listed in priority order. Higher priority features are listed first.

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| landscape-scan | P1 | none | exploring |
| coherence-report | P1 | landscape-scan | exploring |
| refinement-qa | P1 | coherence-report | exploring |
| change-application | P2 | refinement-qa | exploring |
| refinement-artifact | P2 | none | exploring |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-05 | Repeatable with persistent artifact | User wants to run refinement at any project stage, not just pre-focus | Adds complexity of tracking multiple passes vs. simpler one-shot design |
| 2026-03-05 | Changes applied after Q&A confirmation | User wants recommendations discussed before execution | Slower than auto-apply but safer for project-level changes |
