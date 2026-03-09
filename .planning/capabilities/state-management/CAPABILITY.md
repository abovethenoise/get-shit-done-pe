---
type: capability
name: "state-management"
status: implemented
created: "2026-03-09"
---

# state-management

## Goal

Maintain project state across sessions via STATE.md, ROADMAP.md, and focus group tracking — enabling instant context restoration and progress visibility.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/bin/lib/state.cjs`, `get-shit-done/workflows/focus.md`, `get-shit-done/workflows/resume-work.md`, `get-shit-done/workflows/progress.md`
- **STATE.md:** Short-term memory (<100 lines), read first in every workflow
- **ROADMAP.md:** Focus group tracker with dependency ordering
- **Session resumption:** STATE.md + CONTINUE-HERE.md + statusline
- **Focus groups:** Bundle capabilities/features for sprints with graph-aware ordering
