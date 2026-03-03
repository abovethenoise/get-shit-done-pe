---
type: discovery-brief
capability: "install-and-deploy"
primary_lens: "refactor"
secondary_lens: "enhance"
completion: "mvu_met"
created: "2026-03-03"
---

# Discovery Brief: install-and-deploy

## Problem Statement

install-and-deploy needs to become a publishable npm package (`get-shit-done-pe`) with a clear update command and visible install feedback so the author can share it and non-technical users can install/maintain it without touching the codebase.

## Context

### Existing State

bin/install.js handles token replacement, artifact copying, hook registration, and settings.json wiring for global GSD deploy.

### Relevant Modules

- `bin/install.js` — monolithic install script
- `hooks/` — gsd-context-monitor.js, gsd-statusline.js, gsd-askuserquestion-guard.js
- `scripts/validate-install.js` — post-install validation
- `.planning/capabilities/install-and-deploy/CAPABILITY.md`

### Prior Exploration

Capability file at `.planning/capabilities/install-and-deploy/CAPABILITY.md` — goal, invariants, architecture spine documented.

## Specification

### Current Design

827-line monolithic Node.js script (bin/install.js). Originated from upstream GSD Claude plugin; completely rewritten when migrating from milestone/phase to capability/feature model. Sections (in order): arg parsing, banner, help, utility functions, global/local path resolution, settings.json read/write, hook registration, token replacement ({GSD_ROOT}), artifact copy, uninstall, post-install validation. All logic lives in one flat file — no modules, no separation of concerns.

### Target Design

**Pressure points captured:**
1. Hard to know if install worked — unclear feedback/validation for non-technical users
2. Sharing with others requires easy install + update experience
3. Want `@latest`-style update: run one command, get newest version automatically

User preference: simplest approach with greatest chance of success. Engineering decisions delegated to implementer.

Distribution model: Publish fork to npm. Others install once via `npx your-package-name --global` and always get latest on update.

Target experience:
- Install once: `npx get-shit-done-pe` (always installs @latest by default — no flag needed)
- `npx get-shit-done-pe` = always gets newest version from npm, deploys to ~/.claude
- Feedback: clear per-step ✅/❌ output during install so user knows it worked
- get-shit-done-pe install COMPLETELY replaces get-shit-done-cc — auto-uninstalls cc, overwrites all artifacts, takes over hook registrations
- Invariants: idempotent, clean uninstall, {GSD_ROOT} token replacement preserved

### Migration Risk

1. **package.json rename** — `get-shit-done-cc` → `get-shit-done-pe`: name, author, description, repository URLs all need updating
2. **Auto-uninstall upstream** — install.js must detect if `get-shit-done-cc` is globally installed and remove it (`npm uninstall -g get-shit-done-cc`)
3. **hooks/dist build** — `prepublishOnly: npm run build:hooks` must run before publish; esbuild dependency already present
4. **Only one current user (author)** — no migration burden, can break freely during transition

### Behavioral Invariants

1. Idempotent — running install twice leaves identical state (no duplicate hooks, no duplicate files)
2. Clean uninstall — `--uninstall` removes all GSD files and hook registrations, leaves nothing behind
3. {GSD_ROOT} token replacement — all .md files with `{GSD_ROOT}` must still resolve to correct paths at install time
4. Mutual exclusion — `get-shit-done-pe` and `get-shit-done-cc` cannot coexist; installing one removes the other

## Unknowns

### Assumptions

### Open Questions

- npm package name: `get-shit-done-pe` (user confirmed). package.json currently says `get-shit-done-cc` pointing to upstream TÂCHES repo — needs update.
- `--update` implementation: thin wrapper around `npm install -g get-shit-done-pe@latest` + re-run deploy
- hooks/dist build step exists (prepublishOnly: build:hooks) — must be part of publish workflow

## Scope Boundary

### In

- Rename package: `get-shit-done-cc` → `get-shit-done-pe` in package.json (name, author, description, repo URLs)
- `npx get-shit-done-pe` always installs @latest (default behavior, no explicit --update flag needed)
- Add clear per-step feedback during install: ✅/❌ for each phase (copy, hooks, token replace, validate)
- get-shit-done-pe install COMPLETELY replaces get-shit-done-cc: auto-uninstall cc package, overwrite all ~/.claude artifacts, take over all hook registrations
- Update behavioral invariants: idempotent, clean uninstall, token replacement

### Out

- Structural refactor of install.js internals (function extraction) — not worth the risk for current scope
- Publishing to npm (that's an action the author takes, not a code change)
- Multi-config or enterprise install scenarios

### Follow-ups

- README update with install instructions for `get-shit-done-pe`
- GitHub Actions for auto-publish on release (future)
