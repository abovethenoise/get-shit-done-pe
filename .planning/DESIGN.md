# Design & Style Guide

## Purpose & Context

Context engineering and coding harness for Claude Code. Users are developers/product thinkers using AI-assisted workflows. Primary interaction: CLI slash commands in Claude Code conversations.

## Non-UI Project — DX Direction

### API Voice
- **Errors:** Direct, actionable. State what failed and what to do. No stack traces unless debugging.
- **Output:** JSON for machine consumption, structured markdown for human-facing summaries.
- **Logs:** Minimal. Surface problems, don't narrate success.

### Error Formats
- CLI errors: `Error: {what failed}` to stderr, exit 1
- Workflow errors: 3-tier escalation (minor=log, moderate=pause+surface, major=halt+recommend)
- Agent errors: Retry once, abort if >50% fail

### Output Style
- **Structured data:** JSON (gsd-tools output), YAML frontmatter (metadata)
- **Human summaries:** Tables, ASCII diagrams, flows — never prose dumps
- **Artifact summaries:** Flows/diagrams/tables, not "go read the file"
- **Verbosity:** Concise. If it can be one sentence, don't use three.

### DX Priorities
1. **Think in flows** — if X then Y, given A then B
2. **DRY/KISS/YAGNI** — no abstraction without justification, no complexity for complexity's sake
3. **Zero speculative output** — don't create files unless needed, don't add features unless asked
4. **Push back welcome** — surface problems and tradeoffs, don't hide them
5. **Traceability** — every plan task maps to a requirement, every decision has rationale

## Constraints

- No GUI components — CLI-only plugin
- Must work within Claude Code's hook/command/agent extension points
- Markdown is the primary format for both data and documentation
