# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary:**
- JavaScript (CommonJS) — All runtime library code in `get-shit-done/bin/lib/*.cjs` and `get-shit-done/bin/gsd-tools.cjs`
- JavaScript (ESM/Script) — Installer and hooks in `bin/install.js`, `hooks/*.js`, `scripts/*.js`

**Secondary:**
- Markdown — Primary artifact format; commands, workflows, agents, templates, and all planning files are `.md`

## Runtime

**Environment:**
- Node.js >= 16.7.0 (declared in `package.json` `engines`)
- Tested against Node 18, 20, 22 via CI matrix (see `.github/workflows/test.yml`)
- Recommended: Node 20+ (c8 coverage tool requires ^20 or >=22)

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- None — zero runtime dependencies. The library is pure Node.js stdlib only (`fs`, `path`, `os`, `child_process`, `readline`, `crypto`).

**Testing:**
- Node built-in `node:test` runner — used via `scripts/run-tests.cjs`; no Jest/Vitest/Mocha installed
- `c8` ^11.0.0 (dev) — V8 coverage reporting, requires Node 20+

**Build/Dev:**
- `esbuild` ^0.24.0 (dev) — listed as devDependency but hooks are currently copied (not bundled); used by `scripts/build-hooks.js` which does a plain file copy, not a bundle step

## Key Dependencies

**Critical:**
- None at runtime — the package ships with zero `dependencies` (only `devDependencies`). All functionality uses Node.js built-ins.

**Infrastructure:**
- `c8` ^11.0.0 — Coverage gating: `--check-coverage --lines 70` enforced in `npm run test:coverage`
- `esbuild` ^0.24.0 — Build tooling; hooks are copied to `hooks/dist/` at `prepublishOnly`

## Configuration

**Project-level:**
- `.planning/config.json` — Per-project GSD config (created by `gsd-tools.cjs config-ensure-section`)
- Key settings: `model_profile`, `commit_docs`, `branching_strategy`, `parallelization`, `brave_search`, `workflow.*`
- Defaults sourced from hardcoded values, optionally overridden by `~/.gsd/defaults.json`

**User-level (global):**
- `~/.gsd/defaults.json` — Optional user-level config overrides applied at project init
- `~/.gsd/brave_api_key` — Brave Search API key file (alternative to env var)

**Environment Variables:**
- `BRAVE_API_KEY` — Enables web search via Brave Search API (optional)

**Build:**
- `scripts/build-hooks.js` — Copies `hooks/*.js` → `hooks/dist/` at publish time
- `scripts/run-tests.cjs` — Custom test runner (no config file; runs `.cjs` test files directly)

## Platform Requirements

**Development:**
- Node.js >= 16.7.0
- npm (for install)
- Git (required at runtime: GSD uses `git` CLI via `child_process.execSync`)
- `rg` (ripgrep) — Used by Claude Code agents for codebase search; not required by the JS library itself

**Production:**
- Installed globally via `npm install -g get-shit-done-cc`, or locally per project
- Supports: Claude Code (`.claude/`), OpenCode (`.config/opencode/` or `.opencode/`), Gemini CLI (`.gemini/`), OpenAI Codex (`.codex/`)
- Target runtime for commands/agents: the AI coding tool's context (not a server; no daemon)

## Module System

- Library files use CommonJS (`require`/`module.exports`), extension `.cjs`
- Hook and installer files use plain Node.js scripts (`#!/usr/bin/env node`), extension `.js`
- No TypeScript, no transpilation of source files; esbuild is present but hooks are shipped as plain JS

## Versioning

- Package version tracked in `package.json` (`1.22.0` as of analysis)
- Update checks done at session start by `hooks/gsd-check-update.js`, which calls `npm view get-shit-done-cc version` in a detached background process and caches result to `~/.claude/cache/gsd-update-check.json`

---

*Stack analysis: 2026-02-28*
