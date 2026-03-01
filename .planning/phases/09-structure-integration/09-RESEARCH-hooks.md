# Phase 9 Research: Hooks Audit

**Researched:** 2026-03-01
**Scope:** INTG-02 -- Audit context-monitor + statusline hooks for v2 effectiveness
**Confidence:** HIGH (direct source code analysis)

## gsd-statusline.js Analysis

**File:** `hooks/gsd-statusline.js` (97 lines)
**Hook type:** StatusLine (renders the bottom bar in Claude Code)

### What It Does

Reads JSON from stdin (Claude Code provides session metadata), renders a statusline showing: model name, current task (from todos), directory name, and context usage bar.

### STATE.md Fields Read

**None.** The statusline hook does NOT read STATE.md at all. It reads:

| Data Source | What It Reads | Lines |
|-------------|---------------|-------|
| stdin JSON | `data.model.display_name` | 16 |
| stdin JSON | `data.workspace.current_dir` | 17 |
| stdin JSON | `data.session_id` | 18 |
| stdin JSON | `data.context_window.remaining_percentage` | 19 |
| File system | `~/.claude/todos/{session}-agent-*.json` | 66-83 |

### File Paths Constructed

| Path | Purpose | Line |
|------|---------|------|
| `/tmp/claude-ctx-{session}.json` | Bridge file for context-monitor | 34 |
| `~/.claude/todos/` | Todo file discovery | 66 |

### Output

Writes to stdout: `model | task | dirname context_bar` (or `model | dirname context_bar` if no task).

### Stale References

**None found.** This hook is model-agnostic -- it has zero references to phases, milestones, STATE.md, capabilities, features, or any GSD-specific concepts. It's purely a context-window visualizer.

**Verdict: No changes needed for v2.**

---

## gsd-context-monitor.js Analysis

**File:** `hooks/gsd-context-monitor.js` (123 lines)
**Hook type:** PostToolUse (runs after every tool invocation)

### What It Does

Reads context metrics from the bridge file written by statusline, and injects agent-facing warnings when context usage is high. Two thresholds: WARNING (35% remaining) and CRITICAL (25% remaining).

### STATE.md Fields Read

**None.** The context-monitor does NOT read STATE.md. It reads:

| Data Source | What It Reads | Lines |
|-------------|---------------|-------|
| stdin JSON | `data.session_id` | 35 |
| Bridge file | `metrics.remaining_percentage` | 57 |
| Bridge file | `metrics.used_pct` | 58 |
| Bridge file | `metrics.timestamp` | 53 |
| Debounce file | `warnData.callsSinceWarn`, `warnData.lastLevel` | 72-73 |

### File Paths Constructed

| Path | Purpose | Line |
|------|---------|------|
| `/tmp/claude-ctx-{session}.json` | Read bridge metrics from statusline | 42 |
| `/tmp/claude-ctx-{session}-warned.json` | Debounce state persistence | 66 |

### Output

When thresholds hit, writes JSON to stdout with `hookSpecificOutput.additionalContext` containing the warning message.

### Stale References Found

| Line | Reference | Status | Issue |
|------|-----------|--------|-------|
| 103 | `/gsd:pause-work` | STALE | Workflow `pause-work.md` was deleted in Phase 8. Command file still exists but is a dead chain (flagged for Phase 10). |
| 107 | `/gsd:pause-work` | STALE | Same -- the CRITICAL message also references this dead command. |

The warning messages say:
- CRITICAL (L101-103): `"If using GSD, run /gsd:pause-work to save execution state."`
- WARNING (L105-107): `"If using GSD, consider /gsd:pause-work to save state."`

**Verdict: Two stale `/gsd:pause-work` references need updating. No STATE.md coupling exists.**

---

## STATE.md Field Mapping

### Key Finding

**Neither hook reads STATE.md.** The hooks are purely context-window tools. They have zero coupling to the phase/capability/feature model.

### Current STATE.md Structure (for completeness)

**YAML Frontmatter fields:**
| Field | Current Value |
|-------|---------------|
| `gsd_state_version` | 1.0 |
| `milestone` | v2.0 |
| `milestone_name` | milestone |
| `status` | unknown |
| `last_updated` | timestamp |
| `progress.total_phases` | 8 |
| `progress.completed_phases` | 8 |
| `progress.total_plans` | 27 |
| `progress.completed_plans` | 27 |

**Markdown body fields** (read/written by `state.cjs`):
| Field | Read By |
|-------|---------|
| `**Current Phase:**` | state.cjs (snapshot, frontmatter sync) |
| `**Current Phase Name:**` | state.cjs (snapshot, frontmatter sync) |
| `**Total Phases:**` | state.cjs (snapshot, frontmatter sync) |
| `**Current Plan:**` | state.cjs (advance-plan, snapshot) |
| `**Total Plans in Phase:**` | state.cjs (advance-plan, snapshot) |
| `**Status:**` | state.cjs (advance-plan, snapshot, frontmatter sync) |
| `**Progress:**` | state.cjs (update-progress, snapshot) |
| `**Last Activity:**` | state.cjs (advance-plan, snapshot) |
| `**Current capability:**` | state.cjs (frontmatter sync only) |
| `**Current feature:**` | state.cjs (frontmatter sync only) |
| `**Paused At:**` | state.cjs (snapshot, frontmatter sync) |
| `**Last Date:**` | state.cjs (record-session) |
| `**Stopped At:**` | state.cjs (record-session, frontmatter sync) |
| `**Resume File:**` | state.cjs (record-session) |

### v2 Field Mapping (from CONTEXT.md)

Per CONTEXT.md: "STATE.md tracks: active capability, active feature, current plan within feature, decisions from discovery, blockers, last agent summary, pipeline position"

| Current Field | v2 Equivalent | Hook Impact |
|---------------|---------------|-------------|
| `Current Phase` | `active capability` | None -- hooks don't read this |
| `Current Phase Name` | (merged into active capability) | None |
| `Total Phases` | (removed -- capabilities aren't numbered) | None |
| `Current Plan` | `current plan` (within feature) | None |
| `Total Plans in Phase` | (scoped to feature) | None |
| `milestone` | (removed or rethought) | None |
| `Status` | `pipeline position` | None |
| `Decisions` section | `decisions` (from discovery) | None |
| `Blockers` section | `blockers` | None |
| (new) | `active feature` | None |
| (new) | `last agent summary` | None |

**Impact on hooks: ZERO.** The v2 STATE.md field renames do not affect either hook because neither hook reads STATE.md.

---

## Stale References Found

| File | Line | Stale Reference | Fix Needed |
|------|------|-----------------|------------|
| `hooks/gsd-context-monitor.js` | 103 | `/gsd:pause-work` in CRITICAL message | Replace with v2 equivalent or generic instruction |
| `hooks/gsd-context-monitor.js` | 107 | `/gsd:pause-work` in WARNING message | Replace with v2 equivalent or generic instruction |

### Fix Options for `/gsd:pause-work`

1. **Replace with generic instruction** (recommended): "Save state to STATE.md and inform the user." -- This is model-agnostic and doesn't depend on any specific command existing.
2. **Replace with v2 command**: Only if a v2 session-save command is defined (none exists yet).
3. **Remove the GSD-specific line entirely**: The core message ("STOP new work immediately" / "Begin wrapping up") is sufficient without a command reference.

**Recommendation:** Option 1 -- replace with generic. The hook's job is to warn the agent about context limits, not route to specific GSD commands. A generic "update STATE.md with current progress and inform the user" is more resilient.

---

## Hook Registration

### How Hooks Are Loaded

Hooks are registered in Claude Code's `~/.claude/settings.json` by `bin/install.js` during `npm install -g`.

**Current global registration** (from `~/.claude/settings.json`):

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{ "type": "command", "command": "node \"/Users/philliphall/.claude/hooks/gsd-check-update.js\"" }]
    }],
    "PostToolUse": [{
      "hooks": [{ "type": "command", "command": "node \"/Users/philliphall/.claude/hooks/gsd-context-monitor.js\"" }]
    }]
  },
  "statusLine": {
    "type": "command",
    "command": "node \"/Users/philliphall/.claude/hooks/gsd-statusline.js\""
  }
}
```

### Registration Stale References

| Registration | Status | Issue |
|-------------|--------|-------|
| `SessionStart` -> `gsd-check-update.js` | STALE | Source deleted in Phase 8 (CLN-06). Installed copy still exists at `~/.claude/hooks/`. `install.js` still wires it (lines 2041-2042, 2067-2068). |
| `PostToolUse` -> `gsd-context-monitor.js` | OK | Source exists, registration valid. |
| `statusLine` -> `gsd-statusline.js` | OK | Source exists, registration valid. |

### install.js Stale References

`bin/install.js` still configures `gsd-check-update.js` as a SessionStart hook:

| Line | Code | Issue |
|------|------|-------|
| 2041-2042 | `buildHookCommand(targetDir, 'gsd-check-update.js')` | Wires deleted hook |
| 2067-2068 | `entry.hooks.some(h => h.command.includes('gsd-check-update'))` | Checks for deleted hook |
| 2072-2079 | `settings.hooks.SessionStart.push(...)` | Registers deleted hook |

**Note:** Per Phase 8 decision (08-04): "Refs to gsd-check-update in bin/install.js ... left for install/build phase cleanup." This is deferred to Phase 12 (INST-05). Phase 9 should NOT fix install.js.

---

## Open Questions

1. **What replaces `/gsd:pause-work` in the context-monitor messages?**
   - The workflow was deleted. The command file still exists but is a dead chain.
   - Phase 9 should update the hook messages now (hooks are in-scope per INTG-02).
   - Recommendation: Use generic language that doesn't depend on any specific command.

2. **Should Phase 9 remove `gsd-check-update.js` from the installed `~/.claude/hooks/`?**
   - Source was deleted in Phase 8 (CLN-06). install.js cleanup deferred to Phase 12.
   - Phase 9 scope is "verify + fix stale refs only" -- this is an install.js concern, not a hooks concern.
   - **Answer: No.** Leave for Phase 12 per existing decisions.

3. **Does `docs/context-monitor.md` need updating too?**
   - It also references `/gsd:pause-work` (lines 22, 59).
   - Per CONTEXT.md: "Prose, comments, and examples deferred to Phase 10."
   - **Answer: No.** Docs update is Phase 10 scope (CLN-05).

---

## Summary of Required Changes

| Change | Scope | LOE |
|--------|-------|-----|
| Update CRITICAL message in context-monitor.js (L101-103) | Phase 9 | Trivial (string edit) |
| Update WARNING message in context-monitor.js (L105-107) | Phase 9 | Trivial (string edit) |
| No changes to statusline.js | -- | -- |
| No changes for STATE.md field renames | -- | Hooks don't read STATE.md |
| install.js gsd-check-update wiring | Phase 12 (deferred) | -- |
| docs/context-monitor.md references | Phase 10 (deferred) | -- |

**Bottom line:** The hooks audit is smaller than expected. Neither hook reads STATE.md, so the v2 field renames have zero impact on hooks. The only actionable fix is two stale `/gsd:pause-work` string references in context-monitor.js.
