---
type: capability
name: "hook-system"
status: implemented
created: "2026-03-09"
---

# hook-system

## Goal

Integrate with Claude Code's hook extension points to provide real-time context monitoring, status display, auto-updates, and safety guards.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `hooks/gsd-statusline.js`, `hooks/gsd-context-monitor.js`, `hooks/gsd-auto-update.js`, `hooks/gsd-askuserquestion-guard.js`
- **Statusline:** Model name, task, directory, context usage (color-coded bar)
- **Context monitor:** WARNING at ≤35% remaining, CRITICAL at ≤25%, debounced (5 tool uses)
- **Auto-update:** npm registry check, 24h throttle, silent background install
- **AskUserQuestion guard:** Detects empty responses (GH #29547 bug), injects recovery diagnostic
