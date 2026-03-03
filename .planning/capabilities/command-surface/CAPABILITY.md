---
type: capability
name: command-surface
status: complete
created: "2026-03-03"
---

# Command Surface

## Goal

13 slash commands give users a clean, predictable entry point into every GSD workflow.

## Why

Commands are the user-facing contract. If the command names are wrong, descriptions confusing, or routing broken, nothing else matters.

## Invariants

1. Every command must fire without error after install.
2. Every command must route to exactly one workflow.

## Boundaries

### Owns
- commands/gsd/*.md files, frontmatter schemas, argument routing, @{GSD_ROOT} references

### Does Not Touch
- Workflow logic (framing-and-discovery, pipeline-execution own that)

## Architecture Spine

```
/gsd:command
  → commands/gsd/{name}.md (frontmatter + @refs)
  → resolves {GSD_ROOT} tokens
  → invokes workflow
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| post-qa-next-steps-fix | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-02 | Keep focus + progress beyond 11-command spec | Both proved useful in practice | Spec says 11; reality is 13 |
