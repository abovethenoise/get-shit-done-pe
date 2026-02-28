---
name: gsd:init
description: Initialize a project -- auto-detects new or existing codebase and runs the appropriate setup flow
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Auto-detection:**
- No code + no .planning/ = new project (deep Q&A flow)
- Code exists + no .planning/ = existing project (scan + validate + gap fill)
- Ambiguous signals = ask one question to disambiguate

**Partial run detection:**
- If .planning/init-state.json exists, a previous /init was interrupted
- Offers resume from last completed section
</context>

<objective>
Initialize a project through auto-detected flow. Handles both new (greenfield) and existing (brownfield) projects through a single entry point.

**Creates:**
- `.planning/PROJECT.md` -- project context and goals
- `.planning/capabilities/` -- capability map
- `.documentation/architecture.md` -- code/system architecture
- `.documentation/domain.md` -- domain concepts
- `.documentation/mapping.md` -- domain-to-code links
- `.documentation/decisions/` -- architectural decision records

**After this command:** Run `/gsd:new-project` to set up requirements, research, and roadmap.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/init-project.md
@~/.claude/get-shit-done/workflows/gather-synthesize.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/templates/project.md
</execution_context>

<process>
Execute the init-project workflow from @~/.claude/get-shit-done/workflows/init-project.md end-to-end.
Preserve all workflow gates (auto-detection, validation, incremental writes, commits).
</process>
