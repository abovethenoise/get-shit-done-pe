---
type: capability
name: "installation-distribution"
status: implemented
created: "2026-03-09"
---

# installation-distribution

## Goal

Install, configure, validate, and uninstall GSD-PE via npm — copying files, registering hooks, writing CLAUDE.md blocks, and verifying integrity.

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `bin/install.js`, `scripts/validate-install.js`
- **Modes:** `--global` (default ~/.claude/), `--local` (./.claude/), `--config-dir <path>`, `--uninstall`
- **Actions:** File copy with path replacement ({GSD_ROOT}/ → actual), hook registration in settings.json, CLAUDE.md block with delimiters
- **Validation:** Post-install token check, file integrity, command discovery
- **npm:** Published as `get-shit-done-pe`, binary entry `bin/install.js`
