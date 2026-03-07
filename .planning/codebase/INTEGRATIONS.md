# External Integrations

**Analysis Date:** 2026-02-28

## APIs & External Services

**Web Search:**
- Brave Search API — Optional; used by `gsd-tools.cjs websearch` command to augment research agents
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - SDK/Client: Node.js native `fetch` (no SDK)
  - Auth: `BRAVE_API_KEY` env var, or `~/.gsd/brave_api_key` file
  - Behavior: If key absent, silently returns `{ available: false }` and agents fall back to built-in WebSearch tool
  - Config toggle: `brave_search: true/false` in `.planning/config.json`
  - Implementation: `get-shit-done/bin/lib/commands.cjs` lines 320-380

**NPM Registry:**
- Used only for update checks at session start
  - Command: `npm view get-shit-done-cc version` (spawned via `execSync`)
  - Cache: `~/.claude/cache/gsd-update-check.json` (TTL-based, checked once per session)
  - Implementation: `hooks/gsd-check-update.js`

## Data Storage

**Databases:**
- None — no database dependencies of any kind.

**File Storage:**
- Local filesystem only
  - Planning artifacts: `.planning/` directory in project root
  - Key files: `.planning/config.json`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
  - Phase artifacts: `.planning/phases/{phase-dir}/PLAN.md`, `SUMMARY.md`, `RESEARCH.md`, etc.
  - Milestone archives: `.planning/milestones/v{X.Y}-phases/`
  - Codebase analysis: `.planning/codebase/*.md`
  - Todos: `.planning/todos/pending/`, `.planning/todos/completed/`

**Caching:**
- Temporary files in `os.tmpdir()`:
  - `gsd-{timestamp}.json` — Large payload relay (when JSON > 50KB, written to tmp and path returned)
  - `claude-ctx-{session_id}.json` — Context window metrics bridge between statusline and context-monitor hooks
  - `gsd-update-check.json` in `~/.claude/cache/` — Update check result cache

## Authentication & Identity

**Auth Provider:**
- None — no user authentication system.
- Model-level auth is delegated entirely to the AI runtime (Claude Code, OpenCode, Gemini CLI, Codex). GSD does not manage API keys for AI models.

## AI Runtime Integrations

GSD is installed into one or more AI coding tool config directories. The installer (`bin/install.js`) handles each:

**Claude Code:**
- Install target: `~/.claude/` (global) or `.claude/` (local/project)
- Installs: `commands/gsd/*.md` → `{dir}/commands/gsd/`, agents → `{dir}/agents/`, hooks → `{dir}/hooks/`
- Hook types used: `SessionStart` (update check, statusline), `PostToolUse` (context monitor)
- Agent sandbox permissions defined in `bin/install.js`: most agents get `workspace-write`; `gsd-plan-checker` and `gsd-integration-checker` get `read-only`

**OpenCode:**
- Install target: `~/.config/opencode/` (global, XDG spec) or `.opencode/` (local)
- Respects `OPENCODE_CONFIG_DIR` > `XDG_CONFIG_HOME/opencode` > `~/.config/opencode`

**Gemini CLI:**
- Install target: `~/.gemini/` (global) or `.gemini/` (local)

**OpenAI Codex:**
- Install target: `~/.codex/` (global) or `.codex/` (local)
- Sandbox permissions configured in Codex `config.toml` via installer

## Model Resolution

GSD does not directly call any AI model API. Model resolution uses the `model` field in agent YAML frontmatter. Claude Code reads this natively at spawn time. Values: `sonnet`, `opus`, `haiku`. See `get-shit-done/references/delegation.md` for routing conventions.

## Monitoring & Observability

**Error Tracking:**
- None — no external error tracking service.

**Logs:**
- All output to `process.stdout` (JSON) or `process.stderr` (error strings)
- No log files; consumers parse stdout JSON directly
- Context monitor writes warnings as `additionalContext` injected into agent conversation (no external sink)

## CI/CD & Deployment

**Hosting:**
- npm registry — package published as `get-shit-done-cc`

**CI Pipeline:**
- GitHub Actions — `.github/workflows/test.yml`
  - Triggers: push/PR to `main`, manual dispatch
  - Matrix: `[ubuntu-latest, macos-latest, windows-latest]` x `[18, 20, 22]`
  - Steps: `npm ci` → run tests (with coverage on Node 20+)
- GitHub Actions — `.github/workflows/auto-label-issues.yml` (issue labeling automation)

**Publish:**
- `prepublishOnly` script: runs `build:hooks` (copies hooks to `hooks/dist/`)
- Published files declared in `package.json` `files`: `bin`, `commands`, `get-shit-done`, `agents`, `hooks/dist`, `scripts`

## Webhooks & Callbacks

**Incoming:**
- None — GSD is a CLI tool with no server component.

**Outgoing:**
- None — no webhook dispatching.

## Environment Configuration

**Required for core functionality:**
- Node.js >= 16.7.0
- Git CLI available in PATH

**Optional integrations:**
- `BRAVE_API_KEY` — enables `websearch` command; without it, research agents use AI built-in search
- `~/.gsd/brave_api_key` — alternative to env var for Brave key
- `~/.gsd/defaults.json` — user-level config defaults applied to new projects

**Secrets location:**
- No secrets stored by GSD itself
- AI model credentials managed entirely by the AI runtime (Claude Code, OpenCode, etc.)
- Brave API key: env var or `~/.gsd/brave_api_key` (plain text file, not committed)

---

*Integration audit: 2026-02-28*
