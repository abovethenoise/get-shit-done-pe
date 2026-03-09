---
type: feature
composes: []
status: planning
created: "{date}"
---

# {feature}

## Goal

{One verifiable sentence: what the user gets when this is done.}

## Flow

{Ordered sequence of capability invocations. Use numbered steps for happy path, indented bullets for branches/failures.}

1. {capability-a}: {what it does in this context}
2. {capability-b}: {what it does with output from step 1}
   - On failure: {what happens}
3. {capability-c}: {final step}

## Scope

### In

- {Only these capabilities, only this orchestration.}

### Out

- {No new implementation logic. No changes to capability internals.}

## User-Facing Failures

| Composed Capability | Failure Mode | User Sees |
|---------------------|-------------|-----------|
| {capability} | {what goes wrong} | {what user experiences} |

## Context

{What flows between composed capabilities — the handoff contracts.}

| From | To | Data | Format |
|------|----|------|--------|
| {cap-a} | {cap-b} | {what's passed} | {shape/type} |

## Decisions

{Notes, open questions, and decisions made during feature development.}
