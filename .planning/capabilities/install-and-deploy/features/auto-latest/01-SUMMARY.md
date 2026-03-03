---
phase: auto-latest
plan: "01"
subsystem: hooks, install
tags: [auto-update, session-start, npm-registry, background-update]
dependency_graph:
  hooks/gsd-auto-update.js: new
  bin/install.js: modified
key_files:
  - hooks/gsd-auto-update.js
  - bin/install.js
decisions:
  - "Simple string inequality for version comparison (no semver library)"
  - "Cache currentVersion written by install.js since hook can't resolve ../package.json at runtime"
  - "Epoch timestamp on fresh install forces immediate first check"
  - "gsd-check-update orphan cleanup added to both orphanedHookPatterns array and inline SessionStart filter"
metrics:
  lines_added: ~219
  files_created: 1
  files_modified: 1
  runtime_deps_added: 0
---

# 01-SUMMARY: auto-latest

Silent auto-update hook that checks npm once per 24h and spawns background `npm install -g` when a newer version exists.

## Task Table

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| create-auto-update-hook | done | `66bcbcc` | New SessionStart hook at hooks/gsd-auto-update.js |
| wire-hook-in-install | done | `e20a3aa` | 5 changes to install.js: command var, registration, cache init, uninstall, orphan cleanup |

## Key Files

| File | Role |
|------|------|
| `hooks/gsd-auto-update.js` | SessionStart hook: stdin drain, cache read, 24h throttle, https.get registry check, spawn+detach+unref background update |
| `bin/install.js` | Registers hook with .some() idempotency guard, initializes version cache, removes on uninstall, cleans up gsd-check-update orphan |

## Architecture

```
Session Start
  --> Claude Code pipes JSON to stdin
  --> gsd-auto-update.js drains stdin
  --> Reads ~/.claude/get-shit-done/.update-check
  --> If lastCheck < 24h: exit 0 (throttled)
  --> https.get registry.npmjs.org/get-shit-done-pe/latest (5s timeout)
  --> If latestVersion === currentVersion: update timestamp, exit 0
  --> If newer: update timestamp, spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {detached:true}), child.unref(), exit 0
  --> Any error at any step: exit 0 (silent)
```

## Deviations

- **External install.js changes**: The file was modified by another process during execution (added CLAUDE.md delimiter management). All auto-latest changes were preserved and committed together with the external changes.
- **gsd-check-update already in orphanedHookPatterns**: The external modification had already added `gsd-check-update` to the `orphanedHookPatterns` array (line 228). The plan's inline SessionStart filter was still added for defense-in-depth.

## Requirements Coverage

| REQ | Covered By |
|-----|-----------|
| EU-01 | Both tasks: auto-update behavior end-to-end |
| FN-01 | hooks/gsd-auto-update.js: https.get version check |
| FN-02 | hooks/gsd-auto-update.js: spawn+detach+unref background install |
| FN-03 | hooks/gsd-auto-update.js: 24h throttle via .update-check cache |
| TC-01 | bin/install.js: SessionStart hook registration |
