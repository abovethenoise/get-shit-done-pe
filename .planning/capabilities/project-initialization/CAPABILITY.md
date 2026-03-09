---
type: capability
name: "project-initialization"
status: implemented
created: "2026-03-09"
---

# project-initialization

## Goal

Auto-detect project type (new/existing/ambiguous) and produce PROJECT.md + capability map + documentation tier seed through guided Q&A or parallel codebase scan.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/workflows/init-project.md`, `get-shit-done/bin/lib/init.cjs`
- **Flow:** Auto-detect → mode resolve → Q&A or scan → write PROJECT.md → capability map → doc tiers → ROADMAP.md → STATE.md
- **Two paths:** New (deep Q&A) vs Existing (6-agent parallel scan → validate → gap fill)
- **Incremental state:** `init-state.json` for partial-run resumption
