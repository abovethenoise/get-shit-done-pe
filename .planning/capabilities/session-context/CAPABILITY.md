---
type: capability
name: session-context
status: complete
created: "2026-03-03"
---

# Session Context

## Goal

Hooks and STATE.md keep the agent aware of context window usage and project position across sessions — without manual bookkeeping.

## Why

Claude's context window is finite and resets. Without session context, every session starts blind. The statusline and monitor prevent silent context exhaustion; STATE.md enables recovery after /clear.

## Invariants

1. Both hooks must silent-fail — they must never block tool execution or break the statusline.
2. STATE.md is the single recovery artifact — it must always reflect actual current position.

## Boundaries

### Owns
- hooks/gsd-statusline.js, hooks/gsd-context-monitor.js, resume-work.md workflow, STATE.md template, settings.json hook registration

### Does Not Touch
- State mutations (cli-tooling owns that via state.cjs)

## Architecture Spine

```
PostStatusline → gsd-statusline.js
  → writes /tmp/claude-ctx-{id}.json (bridge)
  → renders: model | task | dir | context bar

PostToolUse → gsd-context-monitor.js
  → reads bridge file
  → injects WARNING (≤35%) or CRITICAL (≤25%) into agent context
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| askuserquestion-session-warmup | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-02-28 | Hooks communicate via tmp bridge file | Decouples statusline from monitor | Stale metrics possible (60s timeout added) |
| 2026-02-28 | Drop update-check hook | Noise for personal tooling | No auto-update notification |
