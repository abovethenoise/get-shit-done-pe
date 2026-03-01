<purpose>
Initialize a project through auto-detected flow. Handles both new (greenfield) and existing (brownfield) projects through a single entry point. Produces PROJECT.md + capability map + .documentation/ seed regardless of mode.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup and Auto-Detection

**MANDATORY FIRST STEP -- Execute detection before ANY user interaction:**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init project)
```

Parse JSON for: `detected_mode` (new/existing/ambiguous), `planning_exists`, `code_exists`, `partial_run` (object with section completion state), `project_context` (if existing).

**Check for partial run:**

If `partial_run.has_partial` is true -- a previous /init was interrupted mid-flow.

Use AskUserQuestion:
- header: "Resume?"
- question: "A previous /init was interrupted. Sections completed: [list from partial_run.completed_sections]. Resume from where you left off?"
- options:
  - "Resume" -- Continue from the next incomplete section
  - "Start fresh" -- Wipe partial state and restart

**If "Resume":** Skip to the first incomplete section (determined by `partial_run.next_section`).
**If "Start fresh":** Continue as if no partial run exists. Overwrite existing files.

## 2. Mode Resolution

**If `detected_mode` is "new":** Proceed to Step 3 (New-Project Flow).

**If `detected_mode` is "existing":** Proceed to Step 4 (Existing-Project Flow).

**If `detected_mode` is "ambiguous":**

Use AskUserQuestion:
- header: "Project Type"
- question: "I found some project artifacts but the picture is unclear. Is this a new project or an existing codebase you want to map?"
- options:
  - "New project" -- Start from scratch with deep questioning
  - "Existing project" -- Scan and map what's here

**If "New project":** Proceed to Step 3.
**If "Existing project":** Proceed to Step 4.

---

## 3. New-Project Flow

### 3a. Deep Q&A -- Goals

Display stage banner:
```
GSD > INIT > NEW PROJECT > GOALS
```

Ask inline (freeform, NOT AskUserQuestion):

"What are you building and why? What problem does this solve?"

Wait for response. Follow threads naturally:
- What excited them about this idea
- Who is the target user
- What does success look like
- What's already decided vs open

**Incremental write -- persist immediately:**

Write `.planning/init-state.json`:
```json
{
  "mode": "new",
  "completed_sections": ["goals"],
  "goals_summary": "[captured goals]",
  "timestamp": "[ISO timestamp]"
}
```

### 3b. Deep Q&A -- Tech Stack Opinions

Display stage banner:
```
GSD > INIT > NEW PROJECT > TECH STACK
```

Use AskUserQuestion to probe opinions:
- header: "Stack"
- question: "Do you have strong preferences on tech stack, or should I recommend based on your goals?"
- options:
  - "I have preferences" -- Let me tell you what I want to use
  - "Recommend for me" -- Suggest based on the project goals
  - "Mix" -- I have some preferences, open on others

If "I have preferences" or "Mix": Ask follow-up about specific choices (language, framework, database, deployment).
If "Recommend for me": Note that recommendations will come after understanding the full picture.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "tech_stack"]`.

### 3c. Deep Q&A -- Architecture and Constraints

Display stage banner:
```
GSD > INIT > NEW PROJECT > ARCHITECTURE
```

Ask about:
- Scale expectations (users, data volume)
- Performance constraints
- Budget/timeline constraints
- Integration requirements (APIs, services)
- Deployment target (cloud, self-hosted, edge)

Use AskUserQuestion for structured choices where appropriate, freeform for open exploration.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "tech_stack", "architecture"]`.

### 3d. Write PROJECT.md

When enough context is gathered (goals + opinions + constraints + architecture understood):

Display stage banner:
```
GSD > INIT > NEW PROJECT > WRITING PROJECT
```

Synthesize all context into `.planning/PROJECT.md` using the template from `templates/project.md`.

Include:
- Core value (the ONE thing that must work)
- Tech stack (chosen or to-be-decided)
- Architecture approach
- Constraints and boundaries
- Key decisions made during Q&A

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize project" --files .planning/PROJECT.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "tech_stack", "architecture", "project_md"]`.

### 3e. Write Capability Map

Derive capabilities from the Q&A context. For each capability:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create "[capability-name]"
```

This creates `.planning/capabilities/{slug}/CAPABILITY.md` with the standard template.

Update each CAPABILITY.md with exploration notes from the Q&A.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "tech_stack", "architecture", "project_md", "capability_map"]`.

### 3f. Seed .documentation/

Create the documentation structure:

```
.documentation/
  architecture.md      <- High-level architecture from Q&A
  domain.md            <- Domain concepts from Q&A
  mapping.md           <- Domain concept -> code location (empty for new projects)
  capabilities/        <- Mirrors .planning/capabilities/ for published docs
  decisions/           <- ADRs (seed with decisions from Q&A)
```

Write initial content based on what was gathered. For new projects, most files will be stubs with intent captured.

```bash
mkdir -p .documentation/capabilities .documentation/decisions
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: seed documentation structure" --files .documentation/architecture.md .documentation/domain.md .documentation/mapping.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "tech_stack", "architecture", "project_md", "capability_map", "documentation"]`.

**Proceed to Step 5 (Completion).**

---

## 4. Existing-Project Flow

### 4a. Phase 1 -- Automated Scan (Parallel)

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > SCANNING
```

Use the gather-synthesize pattern (@~/.claude/get-shit-done/workflows/gather-synthesize.md) for parallel codebase analysis.

**Gatherer dimensions:**

| Dimension | Focus | Output |
|-----------|-------|--------|
| Structure | Directory layout, module boundaries, entry points | File tree analysis |
| Stack | Languages, frameworks, dependencies, versions | Tech stack inventory |
| Data Models | Schemas, types, data flow | Data model map |
| Patterns | Architecture patterns, conventions, code style | Pattern inventory |
| Entry Points | CLI commands, API routes, UI entry, event handlers | Entry point catalog |
| Dependencies | External services, APIs, integrations | Dependency graph |

Spawn 6 scan agents in parallel. Each reads the codebase and produces a structured analysis of its dimension.

After all complete, synthesize into a System Understanding Draft:

Write `.planning/init-scan-draft.md` with the consolidated findings.

**Incremental write -- update init-state.json:**
```json
{
  "mode": "existing",
  "completed_sections": ["scan"],
  "timestamp": "[ISO timestamp]"
}
```

### 4b. Phase 2 -- User Validation (Independent Sections)

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > VALIDATION
```

Present the scan results as independent sections. Each section can be confirmed, corrected, or flagged independently. Confirming one section does NOT depend on confirming another.

**Section order (each independent):**

1. **Tech Stack** -- "Here's what I found. Correct?"
2. **Architecture** -- "Here's how the code is structured. Accurate?"
3. **Data Models** -- "Here are the key data structures. Right?"
4. **Entry Points** -- "These are the main entry points. Missing any?"
5. **External Dependencies** -- "These are the integrations. Complete?"
6. **Patterns and Conventions** -- "These patterns seem established. Agree?"

For each section, use AskUserQuestion:
- header: "[Section]" (max 12 chars)
- question: "[Summary of findings for this section]\n\nIs this accurate?"
- options:
  - "Correct" -- Confirmed as-is
  - "Needs correction" -- Let me fix some details
  - "Low confidence" -- I'm not sure either, flag for later

Flag low-confidence areas for gap fill in Phase 3.

**Targeted intent questions** -- after validation, ask 2-3 questions about WHY things are structured this way:
- "What drove the choice of [framework]?"
- "Is [pattern] intentional or inherited?"
- "What's the history behind [architectural decision]?"

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation"]`.

### 4c. Phase 3 -- Gap Fill

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > GAP FILL
```

Address what the scan couldn't determine:

1. **Domain context** -- "What domain is this? What are the key business concepts?"
2. **Known tech debt** -- "What's broken or fragile that I should know about?"
3. **Intent gaps** -- "For the low-confidence areas flagged earlier: [list them]"
4. **Project direction** -- "What are you trying to accomplish next? What's the goal for this session?"

Use mix of AskUserQuestion (for structured choices) and freeform (for open exploration).

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill"]`.

### 4d. Write PROJECT.md

Synthesize all three phases into `.planning/PROJECT.md`:

- Validated scan findings become the system description
- User corrections override scan results
- Gap fill answers provide domain context and direction
- Tech debt becomes the initial issues list

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize project from existing codebase" --files .planning/PROJECT.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "project_md"]`.

### 4e. Write Capability Map

Derive capabilities from the validated scan:
- Each major module/feature area becomes a capability
- Status is set based on current state (e.g., "complete" for working features, "in-progress" for partial implementations)

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create "[capability-name]"
```

Update each CAPABILITY.md with validated scan findings.

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "project_md", "capability_map"]`.

### 4f. Seed .documentation/

Create the documentation structure populated from scan + validation:

```
.documentation/
  architecture.md      <- Validated architecture from scan Phase 1+2
  domain.md            <- Domain context from gap fill Phase 3
  mapping.md           <- Domain concept -> code location from scan
  capabilities/        <- Per-capability docs from validated findings
  decisions/           <- Known decisions (from intent questions)
```

```bash
mkdir -p .documentation/capabilities .documentation/decisions
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: seed documentation from codebase scan" --files .documentation/architecture.md .documentation/domain.md .documentation/mapping.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "project_md", "capability_map", "documentation"]`.

**Proceed to Step 5 (Completion).**

---

## 5. Completion

Clean up init state file:

```bash
rm -f .planning/init-state.json
rm -f .planning/init-scan-draft.md
```

Present completion summary:

```
GSD > PROJECT INITIALIZED

[Project Name]

Mode: [New / Existing]

| Artifact           | Location                          |
|--------------------|-----------------------------------|
| Project            | .planning/PROJECT.md              |
| Capabilities       | .planning/capabilities/           |
| Architecture       | .documentation/architecture.md    |
| Domain             | .documentation/domain.md          |
| Mapping            | .documentation/mapping.md         |
| Decisions          | .documentation/decisions/         |

[N] capabilities mapped

Next: Run /gsd:new to set up requirements and roadmap
      (or /gsd:discuss-capability to explore a specific capability first)
```

</process>

<key_constraints>
- Auto-detection uses filesystem evidence only: .planning/ existence + code file presence
- New-project flow is conversational Q&A using AskUserQuestion and freeform inline questions
- Existing-project flow uses gather-synthesize for parallel scan (6 dimensions)
- Validation sections are independent -- confirming stack does not depend on confirming architecture
- Incremental writes: each section is persisted to init-state.json immediately after completion
- Partial-run detection: re-running /init checks init-state.json and offers resume
- No interactive stdin from gsd-tools -- all user interaction via AskUserQuestion in the workflow
- Both flows produce the same outputs: PROJECT.md + capability map + .documentation/ seed
</key_constraints>

<success_criteria>
- [ ] Auto-detection correctly identifies new/existing/ambiguous
- [ ] New-project flow captures goals, tech stack opinions, architecture, constraints
- [ ] New-project flow writes PROJECT.md, capability map, .documentation/ seed
- [ ] Existing-project flow runs parallel scan via gather-synthesize
- [ ] Existing-project validation uses independent sections
- [ ] Existing-project gap fill captures domain context and tech debt
- [ ] Incremental writes persist state after each section
- [ ] Partial-run detection works on re-run
- [ ] Both flows produce identical output artifact set
</success_criteria>
