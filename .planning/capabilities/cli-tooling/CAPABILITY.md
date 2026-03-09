---
type: capability
name: "cli-tooling"
status: implemented
created: "2026-03-09"
---

# cli-tooling

## Goal

Provide the gsd-tools CLI for state operations, CRUD, graph queries, frontmatter manipulation, git commits, and slug resolution — the programmatic backbone for all workflows.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/*.cjs` (10 modules)
- **50+ subcommands:** state, commit, capability-*, feature-*, graph-query, frontmatter, init, slug-resolve, scan-*, refinement-*
- **Output protocol:** JSON to stdout, errors to stderr, large payloads (>50KB) to tmpfile with @file: prefix
- **Dependencies:** js-yaml (YAML parsing), argparse (transitive)
