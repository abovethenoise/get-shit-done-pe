<purpose>
Initialize a project through auto-detected flow. Handles both new (greenfield) and existing (brownfield) projects through a single entry point. Produces PROJECT.md + capability map + documentation tier seed regardless of mode.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@{GSD_ROOT}/get-shit-done/references/doc-tiers.md
</required_reading>

<question_protocol>
MANDATORY: Every question to the user MUST go through the AskUserQuestion tool.
NEVER output a question as plain text expecting a response.
NEVER generate or assume the user's answer — wait for AskUserQuestion to return.

NEVER narrate between tool calls. No filler text like:
- "The user selected X. Let me..."
- "Good, let me now..."
- "Let me load/check/ask..."
Go DIRECTLY from one tool call to the next. If you need to provide context,
embed it in the next AskUserQuestion's question field, not as separate text output.
The only allowed text output is stage banners.

After EVERY AskUserQuestion call, IMMEDIATELY write results to the incremental state file
before asking the next question.

Within each stage, use a round loop:
1. Call AskUserQuestion (1-4 questions informed by what's unknown)
2. Write answers to init-state.json (tool call, not text output)
4. Assess internally (no text output): do I have enough for this stage's output?
   - YES → AskUserQuestion: "I think I have what I need for [stage]. Anything else?"
     - User says done → proceed to next stage
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps
</question_protocol>

<design_qa_protocol>
Use the round loop from `<question_protocol>`. Probe design decisions aligned to the template sections.

**Round 1 — Purpose & context:**
- What personality should this project have? (Professional, playful, technical, friendly, etc.)
- What is the primary user environment? (Desktop browser, mobile, terminal, API consumer, etc.)
- Any existing brand guidelines, design system, or reference apps?

**Round 2 — UI projects (skip for non-UI):**
- Visual direction: mood/tone, reference sites, color palette
- Layout & hierarchy: what's most important, shell structure, spacing philosophy
- Key components: cards, tables, data displays, interaction patterns
- Voice: UI copy personality, example phrases or CTAs
- State philosophy: transition feel, feedback level, validation approach
- What should it NEVER look like? (Anti-patterns)

**Round 2 — Non-UI projects (skip for UI):**
- API voice: error message style, response structure philosophy
- Output formatting: JSON structure, logging conventions, CLI output style
- DX priorities: documentation style, tooling preferences, onboarding experience

**If user declines to specify any area:**
- Make assumptions based on project type + tech stack
- Document assumptions explicitly as defaults in DESIGN.md
- Mark assumed sections with "(Default — assumed from {reasoning})"

Done threshold: enough design context to write a structured DESIGN.md using `templates/design-style.md`.
</design_qa_protocol>

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

Use the round loop from `<question_protocol>`. Target areas:
- What they're building and why
- What excited them about this idea
- Who is the target user
- What does success look like
- What's already decided vs open

Done threshold: clear enough to explain the project to a stranger in 2-3 sentences.

**Incremental write -- persist after every round:**

Write `.planning/init-state.json`:
```json
{
  "mode": "new",
  "completed_sections": ["goals"],
  "goals_summary": "[captured goals]",
  "timestamp": "[ISO timestamp]"
}
```

### 3b. Capabilities Q&A

Display stage banner:
```
GSD > INIT > NEW PROJECT > CAPABILITIES
```

Use the round loop from `<question_protocol>`. Present capabilities inferred from goals context, then refine via rounds.

First round: Use AskUserQuestion to present inferred capabilities:
- header: "Capabilities"
- question: "Based on our conversation, I see these potential capabilities:\n\n[numbered list of inferred capabilities with one-line descriptions]\n\nDoes this look right?"
- options:
  - "Looks good" -- Proceed with this list
  - "I want to adjust" -- Add, remove, or reorder capabilities

If "I want to adjust": continue round loop targeting specific changes, then re-present.

Done threshold: confirmed capability list that the user is satisfied with.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities"]`.

### 3c. Deep Q&A -- Tech Stack Opinions

Display stage banner:
```
GSD > INIT > NEW PROJECT > TECH STACK
```

Use the round loop from `<question_protocol>`. First round:

Use AskUserQuestion:
- header: "Stack"
- question: "Do you have strong preferences on tech stack, or should I recommend based on your goals?"
- options:
  - "I have preferences" -- Let me tell you what I want to use
  - "Recommend for me" -- Suggest based on the project goals
  - "Mix" -- I have some preferences, open on others

If "I have preferences" or "Mix": continue rounds targeting specific choices (language, framework, database, deployment).
If "Recommend for me": Note that recommendations will come after understanding the full picture.

Done threshold: stack decisions captured or explicitly deferred to later.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack"]`.

### 3d. Deep Q&A -- Architecture and Constraints

Display stage banner:
```
GSD > INIT > NEW PROJECT > ARCHITECTURE
```

Use the round loop from `<question_protocol>`. Target areas:
- Scale expectations (users, data volume)
- Performance constraints
- Budget/timeline constraints
- Integration requirements (APIs, services)
- Deployment target (cloud, self-hosted, edge)

Done threshold: enough constraints captured to inform architecture section of PROJECT.md.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture"]`.

### 3d.5. Design & Styling Q&A

Display stage banner:
```
GSD > INIT > NEW PROJECT > DESIGN & STYLE
```

Follow `<design_qa_protocol>`.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style"]`.

### 3e. Write PROJECT.md

When enough context is gathered (goals + capabilities + tech stack + architecture + design understood):

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

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style", "project_md"]`.

**Write DESIGN.md:**

Synthesize design & style Q&A results into `.planning/DESIGN.md` using the template from `templates/design-style.md`.

- Fill sections from Q&A answers
- Mark assumed/defaulted sections explicitly
- For non-UI projects: collapse visual sections, expand API/DX sections

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize design guide" --files .planning/DESIGN.md
```

### 3e.5. Write Capability Map

Derive capabilities from the confirmed list (from step 3b). For each capability:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create "[capability-name]"
```

This creates `.planning/capabilities/{slug}/CAPABILITY.md` with the standard template.

Update each CAPABILITY.md with exploration notes from the Q&A.

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style", "project_md", "capability_map"]`.

### 3f. Seed Documentation Tiers

Seed the documentation tier structure (see `references/doc-tiers.md` for the full tier registry):

**Tier 1 — Update CLAUDE.md router:**
- Create or update root `CLAUDE.md` with project identity, tech stack summary, and pointers to `.docs/` and `.claude/`
- Keep under 200 lines — router only

**Tier 3 — Create `.docs/` knowledge base:**
```bash
mkdir -p .docs
```
- `architecture.md` — high-level architecture from Q&A
- `domain-vocabulary.md` — domain concepts from Q&A (includes domain-to-code mapping; empty for new projects)
- `brand.md` — voice, tone, design direction from Q&A

**Tier 5 — Create memory ledger:**
- `.claude/memory-ledger.md` — empty with format header (solved gotchas accumulate during development)

Write initial content based on what was gathered. For new projects, most files will be stubs with intent captured.

No `decisions/` directory — architectural decisions go into `.docs/architecture.md`, code-level decisions are Tier 4 inline comments.

```bash
mkdir -p .docs .claude
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: seed documentation tiers" --files .docs/architecture.md .docs/domain-vocabulary.md .docs/brand.md .claude/memory-ledger.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style", "project_md", "capability_map", "doc_tiers"]`.

### 3g. Write ROADMAP.md

Display stage banner:
```
GSD > INIT > NEW PROJECT > ROADMAP
```

Write `.planning/ROADMAP.md` using the v2 roadmap template (`templates/roadmap.md`).

For new projects:
- Include Overview section with project name from PROJECT.md
- Empty Active Focus Groups section (no active focus yet -- user hasn't run /gsd:focus)
- Empty Completed Focus Groups section

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize roadmap" --files .planning/ROADMAP.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style", "project_md", "capability_map", "doc_tiers", "roadmap_md"]`.

### 3h. Write STATE.md

Display stage banner:
```
GSD > INIT > NEW PROJECT > STATE
```

Write `.planning/STATE.md` using the v2 state template (`templates/state.md`).

- Empty Active Focus Groups (no active work yet)
- Project reference points to PROJECT.md
- Core value from PROJECT.md
- Session continuity: "Project initialized"

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize state" --files .planning/STATE.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["goals", "capabilities", "tech_stack", "architecture", "design_style", "project_md", "capability_map", "doc_tiers", "roadmap_md", "state_md"]`.

**Proceed to Step 5 (Completion).**

---

## 4. Existing-Project Flow

### 4a. Phase 1 -- Automated Scan (Parallel)

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > SCANNING
```

Use the gather-synthesize pattern (@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md) for parallel codebase analysis.

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

Present a consolidated text summary of ALL scan findings organized by section:

1. **Tech Stack** -- languages, frameworks, dependencies, versions
2. **Architecture** -- directory layout, module boundaries, patterns
3. **Data Models** -- schemas, types, data flow
4. **Entry Points** -- CLI commands, API routes, UI entry, event handlers
5. **External Dependencies** -- services, APIs, integrations
6. **Patterns and Conventions** -- code style, architecture patterns

Then use a single AskUserQuestion:
- header: "Scan Results"
- question: "[consolidated summary above]\n\nAnything wrong or missing?"
- options:
  - "Looks accurate" -- Proceed to gap fill
  - "Some corrections needed" -- Let me flag specific issues
  - "Major issues" -- Significant findings are wrong

If "Looks accurate": proceed directly to gap fill.
If "Some corrections needed" or "Major issues": use round loop from `<question_protocol>` to drill into flagged sections only. Done threshold: user confirms corrections are captured.

**Targeted intent questions** -- after validation, ask 2-3 questions about WHY things are structured this way (via AskUserQuestion round loop):
- "What drove the choice of [framework]?"
- "Is [pattern] intentional or inherited?"
- "What's the history behind [architectural decision]?"

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation"]`.

### 4c. Phase 3 -- Gap Fill

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > GAP FILL
```

Use the round loop from `<question_protocol>`. Target areas:

1. **Domain context** -- "What domain is this? What are the key business concepts?"
2. **Known tech debt** -- "What's broken or fragile that I should know about?"
3. **Intent gaps** -- "For the low-confidence areas flagged earlier: [list them]"
4. **Project direction** -- "What are you trying to accomplish next? What's the goal for this session?"

Done threshold: domain context, known issues, and project direction captured.

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill"]`.

### 4c.5. Design & Styling Q&A (Brownfield)

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > DESIGN & STYLE
```

Follow `<design_qa_protocol>`. Additionally: reference existing patterns detected during codebase scan. Mark sections where existing patterns were detected vs user preferences.

Write answers into `.planning/DESIGN.md` using the template from `templates/design-style.md`.

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style"]`.

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

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style", "project_md"]`.

### 4e. Write Capability Map

Derive capabilities from the validated scan:
- Each major module/feature area becomes a capability
- Status is set based on current state (e.g., "complete" for working features, "in-progress" for partial implementations)

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create "[capability-name]"
```

Update each CAPABILITY.md with validated scan findings.

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style", "project_md", "capability_map"]`.

### 4f. Seed Documentation Tiers

Seed the documentation tier structure (see `references/doc-tiers.md` for the full tier registry), populated from scan + validation:

**Tier 1 — Update CLAUDE.md router:**
- Create or update root `CLAUDE.md` with project identity, tech stack summary, and pointers to `.docs/` and `.claude/`
- Keep under 200 lines — router only

**Tier 3 — Create `.docs/` knowledge base:**
```bash
mkdir -p .docs
```
- `architecture.md` — validated architecture from scan Phase 1+2
- `domain-vocabulary.md` — domain context from gap fill Phase 3 (includes domain-to-code mapping from scan)
- `brand.md` — voice, tone, design direction from design Q&A

**Tier 5 — Create memory ledger:**
- `.claude/memory-ledger.md` — empty with format header

No `decisions/` directory — architectural decisions go into `.docs/architecture.md`, code-level decisions are Tier 4 inline comments.

```bash
mkdir -p .docs .claude
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: seed documentation tiers from codebase scan" --files .docs/architecture.md .docs/domain-vocabulary.md .docs/brand.md .claude/memory-ledger.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style", "project_md", "capability_map", "doc_tiers"]`.

### 4f.5. Scaffold Tier 2 Rules

After the capability map (4e) and tier seeding (4f), scaffold directory-scoped CLAUDE.md files for detected code directories.

1. **Detect code directories** from the validated scan (e.g., `src/`, `src-tauri/`, `server/`, `lib/`)
2. **For each directory:** scan for framework conventions (Svelte, Rust, Python, etc.) from the scan findings
3. **Propose scoped CLAUDE.md content** per directory — framework-specific rules, naming conventions, testing patterns

Use AskUserQuestion:
- header: "Tier 2 Rules"
- question: "Based on the scan, I'd like to create scoped CLAUDE.md files for these directories:\n\n[list each directory with proposed rule summary]\n\nApprove, adjust, or skip?"
- options:
  - "Approve all" — Create all proposed files
  - "Let me adjust" — Modify the proposals
  - "Skip" — Skip Tier 2 scaffolding for now

4. **Create confirmed `{subdir}/CLAUDE.md` files** with the approved content

### 4g. Write ROADMAP.md

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > ROADMAP
```

Write `.planning/ROADMAP.md` using the v2 roadmap template (`templates/roadmap.md`).

For brownfield projects:
- Include Overview section with project name and current state from PROJECT.md
- Pre-populate one focus group from inferred capabilities (user can refine via /gsd:focus later)

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize roadmap from codebase scan" --files .planning/ROADMAP.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style", "project_md", "capability_map", "doc_tiers", "roadmap_md"]`.

### 4h. Write STATE.md

Display stage banner:
```
GSD > INIT > EXISTING PROJECT > STATE
```

Write `.planning/STATE.md` using the v2 state template (`templates/state.md`).

- Empty Active Focus Groups (no active work started yet)
- Project reference points to PROJECT.md
- Core value from PROJECT.md
- Session continuity: "Project initialized"

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize state" --files .planning/STATE.md
```

**Incremental write -- update init-state.json** with `completed_sections: ["scan", "validation", "gap_fill", "design_style", "project_md", "capability_map", "doc_tiers", "roadmap_md", "state_md"]`.

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
| Roadmap            | .planning/ROADMAP.md              |
| State              | .planning/STATE.md                |
| Architecture       | .docs/architecture.md             |
| Domain Vocabulary  | .docs/domain-vocabulary.md        |
| Brand              | .docs/brand.md                    |
| Memory Ledger      | .claude/memory-ledger.md          |

Project initialized with [N] capabilities and [M] feature stubs.

Next step:
- Run /gsd:discuss-capability <name> to flesh out a capability stub
  (this creates feature stubs within the capability)

Later, once you have features:
- Run /gsd:discuss-feature <cap/feat> to detail a specific feature
- Run /gsd:focus to create a focus group and prioritize what to build

(The capabilities above are stubs -- discuss them to discover features before planning.)
```

</process>

<key_constraints>
- Auto-detection uses filesystem evidence only: .planning/ existence + code file presence
- New-project flow is conversational Q&A using AskUserQuestion exclusively (see question_protocol)
- Existing-project flow uses gather-synthesize for parallel scan (6 dimensions)
- Validation sections are independent -- confirming stack does not depend on confirming architecture
- Incremental writes: each section is persisted to init-state.json immediately after completion
- Partial-run detection: re-running /init checks init-state.json and offers resume
- No interactive stdin from gsd-tools -- all user interaction via AskUserQuestion in the workflow
- Both flows produce the same outputs: PROJECT.md + capability map + documentation tier seed (.docs/, .claude/memory-ledger.md)
</key_constraints>

<success_criteria>
- [ ] Auto-detection correctly identifies new/existing/ambiguous
- [ ] New-project flow captures goals, tech stack opinions, architecture, constraints
- [ ] New-project flow writes PROJECT.md, capability map, documentation tier seed (.docs/, .claude/memory-ledger.md)
- [ ] Existing-project flow runs parallel scan via gather-synthesize
- [ ] Existing-project validation uses independent sections
- [ ] Existing-project gap fill captures domain context and tech debt
- [ ] Incremental writes persist state after each section
- [ ] Partial-run detection works on re-run
- [ ] Both flows create STATE.md and ROADMAP.md
- [ ] Both flows produce identical output artifact set
- [ ] Brownfield flow scaffolds Tier 2 rules for detected code directories
</success_criteria>
