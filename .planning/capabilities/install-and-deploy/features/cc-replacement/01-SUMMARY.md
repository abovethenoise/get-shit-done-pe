---
phase: install-and-deploy
plan: "01"
subsystem: installer
tags: [cc-replacement, cleanup, claude-md, idempotent]
dependency_graph:
  depends_on:
    - install-and-deploy/package-identity/01-PLAN.md
  blocks: []
key_files:
  - bin/install.js
decisions:
  - "Used npm uninstall -g (not upstream npx) per RESEARCH.md — upstream has $HOME cwd bug"
  - "ccWarnings stored at module level for future install-feedback feature to surface"
  - "writeClaudeMd placed inside the settings.json try/catch block in install() — shares error path"
metrics:
  lines_added: ~140
  functions_added: 4
  files_modified: 1
---

# Summary: cc-replacement

Pre-install cc-detection and cleanup phase added to `bin/install.js` — installing get-shit-done-pe now fully replaces any prior get-shit-done-cc installation, including upstream package removal, remnant file scan, orphan hook cleanup, and delimiter-managed CLAUDE.md writes.

## Task Table

| Task | Description | Status | Commit |
|------|-------------|--------|--------|
| T1 | replaceCc() — upstream uninstall + remnant scan | done | `e946826` |
| T2 | CLAUDE.md delimiter management | done | `cd40b87` |

## What Was Built

### T1: replaceCc() function
- `replaceCc(configDir)` added after `cleanupOrphanedHooks`, called at top of `install()` before artifact copy
- Detects cc via `npm list -g get-shit-done-cc --depth=0` (try/catch)
- Uninstalls via `npm uninstall -g get-shit-done-cc` (try/catch, best-effort)
- Remnant scan (unconditional): removes `gsd:*` commands, `gsd-*` agents, `get-shit-done/` dir, `hooks/dist/`
- `gsd-check-update` added to `cleanupOrphanedHooks()` orphanedHookPatterns
- Module-level `ccWarnings` array accumulates warnings for future surfacing

### T2: CLAUDE.md delimiter management
- Constants: `CLAUDE_MD_START = '<!-- GSD-PE:START -->'`, `CLAUDE_MD_END = '<!-- GSD-PE:END -->'`
- `writeClaudeMd(configDir, peContent)`: creates new file, replaces existing delimited block, or appends
- `stripClaudeMd(configDir)`: surgically strips delimited block on uninstall; warns (no-modify) if delimiters absent
- Wired into `install()` (writes pe attribution block) and `uninstall()` (strips or warns)

## Deviations

None. Plan followed exactly.
