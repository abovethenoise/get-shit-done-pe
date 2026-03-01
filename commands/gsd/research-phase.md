---
name: gsd:research-phase
description: Research how to implement a phase using 6 specialist gatherers (standalone - usually use /gsd:plan-phase instead)
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
  - Task
---

<objective>
Research how to implement a phase. Delegates to the research workflow which spawns 6 specialist gatherers (domain, system, intent, tech, edges, prior-art) in parallel via gather-synthesize, then consolidates via the research synthesizer.

**Note:** This is a standalone research command. For most workflows, use `/gsd:plan-phase` which integrates research automatically.

**Use this command when:**
- You want to research without planning yet
- You want to re-research after planning is complete
- You need to investigate before deciding if a phase is feasible

**Orchestrator role:** Parse phase, validate against roadmap, check existing research, delegate to research-workflow.md, present results.

**Why subagent:** Research burns context fast (WebSearch, Context7 queries, source verification). 6 parallel gatherers each get fresh 200k context. Main context stays lean for user interaction.
</objective>

<context>
Phase number: $ARGUMENTS (required)

Normalize phase input in step 1 before any directory lookups.
</context>

<process>

## 0. Initialize Context

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "$ARGUMENTS")
```

Extract from init JSON: `phase_dir`, `phase_number`, `phase_name`, `phase_found`, `commit_docs`, `has_research`, `state_path`, `requirements_path`, `context_path`, `research_path`.

## 1. Validate Phase

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}")
```

**If `found` is false:** Error and exit. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.

## 2. Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

**If exists:** Offer: 1) Update research, 2) View existing, 3) Skip. Wait for response.

**If doesn't exist:** Continue.

## 3. Delegate to Research Workflow

Invoke the research workflow:

```
@~/.claude/get-shit-done/workflows/research-workflow.md
```

Pass:
- `subject`: "Phase {phase_number}: {phase_name}"
- `context_paths`:
  - `project_path`: .planning/PROJECT.md
  - `state_path`: {state_path}
  - `roadmap_path`: .planning/ROADMAP.md
  - `requirements_path`: {requirements_path}
- `output_dir`: {phase_dir}
- `capability_path`: null (phase-scoped, not capability-scoped)
- `feature_path`: null (phase-scoped, not feature-scoped)
- `framing_context`: null (standalone invocation, no framing)

The research workflow handles:
1. Spawning 6 gatherers in parallel via gather-synthesize
2. Failure handling with one retry per failed gatherer
3. Consolidating via research synthesizer
4. Writing RESEARCH.md to {phase_dir}/RESEARCH.md

Wait for completion.

## 4. Handle Return

**`status: "complete"`:** Display summary, offer: Plan phase, Dig deeper, Review full, Done.

**`status: "partial"`:** Display summary with warning about failed gatherers, offer same options.

**`status: "failed"`:** Show what failed, offer: Add context, Retry, Manual.

</process>

<success_criteria>
- [ ] Phase validated against roadmap
- [ ] Existing research checked
- [ ] Research workflow invoked with correct parameters
- [ ] 6 gatherers spawned via gather-synthesize pattern
- [ ] RESEARCH.md produced by synthesizer
- [ ] User knows next steps
</success_criteria>
