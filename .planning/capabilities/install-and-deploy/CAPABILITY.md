---
type: capability
name: install-and-deploy
status: complete
created: "2026-03-03"
---

# Install & Deploy

## Goal

`npm install -g get-shit-done-cc` deploys all GSD artifacts to `~/.claude/` and registers hooks — one command, fully operational.

## Why

Without a clean install, GSD is a dev-only tool. Non-technical users need to install it without understanding Node.js, path resolution, or hook registration.

## Invariants

1. Install must be idempotent — running it twice leaves identical state.
2. Uninstall must leave no orphaned files or hook registrations.

## Boundaries

### Owns
- bin/install.js logic, token replacement, hook registration, settings.json wiring, post-install validation

### Does Not Touch
- The artifacts being installed (commands, agents, workflows — those belong to other capabilities)

## Architecture Spine

```
npm install -g
  → bin/install.js
  → replace {GSD_ROOT}/ tokens in .md files
  → copy: commands/, agents/, get-shit-done/, hooks/
  → write: ~/.claude/package.json (CJS marker)
  → update: ~/.claude/settings.json (hook registrations)
  → run: scripts/validate-install.js
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| clearer-install-ux | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-02-28 | {GSD_ROOT} token replacement at install time | No hardcoded paths in source | Requires install.js to scan and replace all .md files |
| 2026-02-28 | Remove patch backup system | Overcomplication for personal tooling | Simpler installs, no rollback |
