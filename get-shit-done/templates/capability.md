---
type: capability
name: "{name}"
status: planning
created: "{date}"
---

# {capability}

## Goal

{One sentence: what this primitive does.}

## Contract

### Receives

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| {input} | {type} | {yes/no} | {description} |

### Returns

| Output | Type | Description |
|--------|------|-------------|
| {output} | {type} | {description} |

### Rules

1. {Invariant that can be violated = bug.}
2. {Another deterministic rule.}

### Sample Payload

```
{Concrete I/O example.}
```

## Failure Behavior

| Condition | Behavior | Propagates? |
|-----------|----------|-------------|
| {bad input} | {what happens} | {yes/no} |

## Atomic Boundaries

- {What succeeds or fails together as a unit.}

## Side Effects

- {What always fires: logging, events, state mutations.}

## Constraints

- {Hard limits: libs, patterns, performance, what not to touch.}

## Context

### Inputs From Other Capabilities

- {capability}: {what this receives}

### Outputs To Other Capabilities

- {capability}: {what this produces}

### Must Not Propagate

- {What stays encapsulated inside this capability.}

## Dependencies

| Direction | Capability | What | Notes |
|-----------|------------|------|-------|
| Produces  | {slug}     | {what this provides} | {notes} |
| Consumes  | {slug}     | {what this uses}     | {notes} |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| {date} | {decision} | {why this came up} | {what was considered, what was rejected} |
