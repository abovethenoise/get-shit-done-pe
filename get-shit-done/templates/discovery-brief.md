---
type: discovery-brief
capability: "{capability}"
primary_lens: "{lens}"
secondary_lens: ""
completion: ""
created: "{date}"
---

# Discovery Brief: {capability}

## Problem Statement

{One sentence. If you cannot write one sentence, discovery is not done.}

## Context

### Existing State

{What exists today. Skip for /new.}

### Relevant Modules

{References to .documentation files, capability files, or code modules.}

### Prior Exploration

{Link to discuss-capability or discuss-feature notes if they exist.}

## Specification

<!-- Lens-specific section. Use the variant matching primary_lens. -->

<!-- debug variant -->
<!--
### Symptom

{What the user observes. Observable behavior, not interpretation.}

### Reproduction Path

{Steps to reproduce. Environment, inputs, sequence.}

### Hypothesis

{At least one falsifiable hypothesis about root cause.}

### Evidence

{What evidence supports or refutes each hypothesis.}
-->

<!-- new variant -->
<!--
### Capability Definition

{What this capability does. Boundary between this and not-this.}

### Boundaries

{What is in scope and what is explicitly out.}

### Constraints

{Hard limits: technical, business, timeline, dependencies.}

### Success Criteria

{What done looks like. Observable, testable outcomes.}
-->

<!-- enhance variant -->
<!--
### Current Behavior

{What the system does today. Concrete, not aspirational.}

### Desired Behavior

{What the system should do after this work.}

### Delta

{The specific change between current and desired. The seam.}

### Invariants

{What must NOT change. Behavioral contracts that survive the enhancement.}
-->

<!-- refactor variant -->
<!--
### Current Design

{How the system is structured today. Load-bearing walls identified.}

### Target Design

{How the system should be structured after. Migration destination.}

### Migration Risk

{What breaks during transition. Data migration, API contracts, downstream consumers.}

### Behavioral Invariants

{External behavior that must be identical before and after. The contract.}
-->

## Unknowns

### Assumptions

{Things treated as true but unverified. Each should be falsifiable.}

### Open Questions

{Things that could not be resolved during discovery. Tracked for downstream stages.}

## Scope Boundary

### In

{What this work covers.}

### Out

{What is explicitly deferred. Not forgotten -- deliberately excluded.}

### Follow-ups

{Ideas surfaced during discovery, tracked for later. Not in scope for this run.}
