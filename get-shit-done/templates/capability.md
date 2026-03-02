---
type: capability
name: "{name}"
status: planning
created: "{date}"
---

# {capability}

## Goal

{One sentence: what this capability delivers to the user.}

## Why

{Why this capability matters. What problem it solves. What happens without it. 2-3 sentences max.}

## Domain Model

| Entity | Description | Relationships |
|--------|-------------|---------------|
| {entity} | {description} | {relationships} |

## Invariants

1. {Rule that applies across ALL features in this capability.}
2. {Another invariant.}

## Boundaries

### Owns

- {What this capability is solely responsible for.}

### Consumes

- {What this capability reads/uses from other capabilities.}

### Does Not Touch

- {What this capability explicitly avoids, even if related.}

## Architecture Spine

{Data flow, layer ownership, where logic lives. Use ASCII diagrams where helpful.}

```
{input} --> [{layer}] --> [{layer}] --> {output}
```

## Dependencies

| Direction | Capability | What | Notes |
|-----------|------------|------|-------|
| Produces  | {slug}     | {what this provides} | {notes} |
| Consumes  | {slug}     | {what this uses}     | {notes} |

## Features

Features are listed in priority order. Higher priority features are listed first.

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| {feature} | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| {date} | {decision} | {why this came up} | {what was considered, what was rejected} |
