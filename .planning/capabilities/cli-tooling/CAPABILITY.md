---
type: capability
name: cli-tooling
status: complete
created: "2026-03-03"
---

# CLI Tooling

## Goal

gsd-tools.cjs provides all file I/O, state mutation, git operations, and artifact CRUD that workflows need — zero runtime dependencies.

## Why

Workflows are markdown prompts; they can't manipulate files directly. gsd-tools is the execution arm. If it breaks, nothing works.

## Invariants

1. Zero runtime dependencies — stdlib + vendored js-yaml only.
2. All STATE.md mutations route through state.cjs — no direct writes.
3. 70% line coverage gate enforced on all lib modules.

## Boundaries

### Owns
- gsd-tools.cjs dispatcher, lib/*.cjs (13 modules), vendored deps, tests/

### Does Not Touch
- The markdown prompt layer (commands, workflows, agents)

## Architecture Spine

```
workflow calls: node gsd-tools.cjs {route} {args}
  → dispatcher routes to lib module
  → lib module: reads/writes .planning/ files
  → git operations via child_process.execSync
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| (stable — no active features) | — | — | complete |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-01 | 3-tier slug resolution (exact→fuzzy→fall-through) | Users won't type exact slugs | Small fuzzy match overhead |
| 2026-03-01 | Vendored js-yaml committed to git | Reproducibility, offline capability | Larger repo size |
