---
name: gsd:sequence
description: Build dependency graph and generate SEQUENCE.md with execution order
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

<objective>
Build the project dependency graph from composes[] edges and write SEQUENCE.md showing what can execute now, what's blocked, critical path, and parallel branches.

No arguments required.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/sequence.md
</execution_context>

<context>
Operates on `.planning/capabilities/` and `.planning/features/` frontmatter. Writes `.planning/SEQUENCE.md`.
</context>

<process>
Execute the sequence workflow:

```
@{GSD_ROOT}/get-shit-done/workflows/sequence.md
```
</process>

<success_criteria>
- SEQUENCE.md written with executable/blocked/branches/coordinate/critical-path/orphans
- Commit created
</success_criteria>
