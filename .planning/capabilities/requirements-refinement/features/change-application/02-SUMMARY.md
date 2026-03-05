---
plan: 02
subsystem: workflows
tags: [failure-handling, askuserquestion, ux, progress]

requires:
  - plan: 01
    provides: change-application.md base workflow
provides:
  - AskUserQuestion failure handling (fix/skip/abort)
  - Stage banners and per-mutation progress logging
affects: []

key-files:
  created: []
  modified: [get-shit-done/workflows/change-application.md]

key-decisions:
  - "Git-rebase-style failure handling: fix-and-resume retries same entry"
  - "Abort preserves applied changes (no rollback)"

requirements-completed: [EU-01, EU-02, FN-03]

duration: 0min
completed: 2026-03-05
---

# Plan Summary: Failure Handling & UX

**AskUserQuestion failure flow (fix/skip/abort) with stage banners and progress logging integrated into change-application**

## Task Commits

1. **Task 1: Failure handling + UX** - `b9b9733` (feat, combined with Plan 01)

## Unplanned Changes
Combined Plans 01 and 02 into single workflow file (both tasks modify same file, cleaner as one pass).

---
*Completed: 2026-03-05*
