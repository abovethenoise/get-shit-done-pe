# Phase 9 Research: Pipeline Handoffs

**Researched:** 2026-03-01
**Domain:** Pipeline orchestration mechanics -- handoff contracts between stages
**Confidence:** HIGH (all findings from direct source reading)

## Summary

The GSD pipeline is a 7-stage chain: framing-discovery -> framing-pipeline (which runs: research -> requirements -> plan -> execute -> review -> reflect/docs). Two entry models exist: (1) the framing-pipeline model invoked by /debug, /new, /enhance, /refactor, and (2) the standalone phase-based model invoked by /plan-phase, /execute-phase, /review-phase, /doc-phase. Both share the same agents but with different orchestration.

Handoffs between stages are artifact-mediated: each stage writes files to disk, the next stage reads them via paths provided by the orchestrator. No content is passed directly between agents -- only file paths. The orchestrator (workflow .md file) stays lean at ~10-15% context; subagents get fresh 200k windows.

The 10 pipeline invariants are all implemented but scattered across multiple files with no single reference document. Six are implemented in workflow .md files, three in gsd-tools.cjs CLI commands, and one (requirement ID chain) spans both workflows and CLI validation.

## Current Pipeline Flow

```
ENTRY POINTS                    PIPELINE STAGES

/debug  ---|                   framing-        framing-pipeline.md
/new    ---|-> framing-     -> pipeline   -> [research -> requirements ->
/enhance---|   discovery.md    (6 stages)      plan -> execute -> review ->
/refactor--|                                   reflect/docs]

STANDALONE (phase-based)

/plan-phase -----> plan-phase.md [research? -> plan -> verify -> done]
                        |
                        v (auto-advance or manual)
/execute-phase --> execute-phase.md [waves -> verify -> roadmap]
                        |
                        v (manual)
/review-phase ---> review-phase.md [4 reviewers -> synthesize -> Q&A]
                        |
                        v (manual)
/doc-phase ------> doc-phase.md [doc-writer -> Q&A review -> commit]
```

## Plan -> Execute Handoff

### Current Mechanics

**Trigger:** plan-phase.md step 14 (auto-advance) or manual `/gsd:execute-phase`

**Artifacts produced by plan-phase:**
- `{phase_dir}/{padded}-{nn}-PLAN.md` -- one per plan, with frontmatter (wave, depends_on, files_modified, autonomous, requirements, must_haves)
- `{phase_dir}/{padded}-RESEARCH.md` -- consumed by planner, available to executor
- `{phase_dir}/{padded}-CONTEXT.md` -- user decisions, passed through to all stages
- `{phase_dir}/{padded}-VALIDATION.md` -- if Nyquist enabled

**Artifacts expected by execute-phase:**
- PLAN.md files (discovered via `phase-plan-index` CLI command)
- STATE.md (current position, decisions)
- config.json (parallelization, branching_strategy, models)
- CLAUDE.md (project instructions)

**Auto-advance logic (plan-phase.md step 14):**
1. Check `--auto` flag OR `workflow.auto_advance` config
2. If enabled: spawn execute-phase as Task subagent with `--auto --no-transition` flags
3. Execute-phase runs, returns `## PHASE COMPLETE` or failure
4. Plan-phase displays result

**Manual flow:**
- Plan-phase displays "Next: /gsd:execute-phase {X}" with `/clear` suggestion
- User manually invokes in fresh context window

### Key Design: Fresh Context Per Executor

Execute-phase.md spawns each plan executor as a Task with `subagent_type="gsd-executor"`. The executor prompt contains `<files_to_read>` with paths only -- the executor reads files itself in its fresh 200k context window. The orchestrator never passes file content.

## Execute -> Review Handoff

### Current Mechanics (via framing-pipeline)

In the framing-pipeline model (framing-pipeline.md stage 5-6):
- Execute completes -> escalation check -> if clean, proceed to review-phase
- Review receives 3 inputs: requirements + lens metadata + brief
- This is automatic within the framing-pipeline orchestrator

### Current Mechanics (standalone)

In the standalone model, execute-phase does NOT auto-invoke review-phase. The flow is:

1. execute-phase.md `verify_phase_goal` step spawns gsd-verifier -> creates VERIFICATION.md
2. If verification passes -> `update_roadmap` -> transition.md -> offer next phase
3. Review is a separate manual invocation: `/gsd:review-phase`

**Artifacts produced by execute-phase:**
- `{phase_dir}/{padded}-{nn}-SUMMARY.md` -- per plan, with frontmatter (requires/provides/affects, key-files, key-decisions, requirements-completed)
- `{phase_dir}/{padded}-VERIFICATION.md` -- phase goal verification
- Updated STATE.md, ROADMAP.md, REQUIREMENTS.md
- Git commits per task (atomic)

**Artifacts expected by review-phase:**
- SUMMARY.md files (to locate key files created/modified)
- Core context (PROJECT.md, STATE.md, ROADMAP.md)
- Capability/feature context if applicable
- Framing context if applicable

### Gap: No Direct Handoff

The standalone model has no auto-advance from execute to review. The framing-pipeline model handles this internally. After CONTEXT.md decisions specify "Execute -> Review: execution complete + verification passes -> 4 parallel reviewers auto-spawn", this only exists in framing-pipeline.md, not in the standalone execute-phase.md.

## Review -> Documentation Handoff

### Current Mechanics (via framing-pipeline)

framing-pipeline.md stage 6-7:
- Review passes -> stage 6 (Reflect) invokes doc-phase.md
- doc-phase reads review artifacts: `{phase_dir}/review/synthesis.md`

### Current Mechanics (standalone)

Manual: user runs `/gsd:doc-phase {X}` after review.

**Artifacts produced by review-phase:**
- `{phase_dir}/review/enduser-trace.md`
- `{phase_dir}/review/functional-trace.md`
- `{phase_dir}/review/technical-trace.md`
- `{phase_dir}/review/quality-trace.md`
- `{phase_dir}/review/synthesis.md`
- `{phase_dir}/review/review-decisions.md`

**Artifacts expected by doc-phase:**
- SUMMARY.md files (key files to document)
- Review synthesis (if available)
- Gate docs (.documentation/gate/)
- Core + capability + feature context

## Agent Expects/Produces Audit

### Agents WITH formal reads/writes frontmatter

| Agent | Has `reads`? | Has `writes`? | Format |
|-------|-------------|---------------|--------|
| gsd-doc-writer | YES | YES | `reads: [executed-code, review-synthesis, ...]` / `writes: [module-docs, flow-docs, doc-report]` |
| gsd-research-domain | YES | YES | `reads: [core-context, capability-context, ...]` / `writes: [research-output]` |
| gsd-research-edges | YES | YES | same pattern |
| gsd-research-intent | YES | YES | same pattern |
| gsd-research-prior-art | YES | YES | same pattern |
| gsd-research-system | YES | YES | same pattern |
| gsd-research-tech | YES | YES | same pattern |
| gsd-review-enduser | YES | YES | `reads: [core-context, feature-context, requirement-layer-eu, executed-code]` / `writes: [review-trace-report]` |
| gsd-review-functional | YES | YES | same pattern with requirement-layer-fn |
| gsd-review-quality | YES | YES | `reads: [core-context, feature-context, executed-code]` / `writes: [review-trace-report]` |
| gsd-review-synthesizer | YES | YES | `reads: [review-trace-reports, core-context, feature-context]` / `writes: [review-synthesis]` |
| gsd-review-technical | YES | YES | same pattern with requirement-layer-tc |

### Agents WITHOUT formal reads/writes frontmatter

| Agent | Has `<files_to_read>` pattern? | What it reads (implicit) | What it writes (implicit) |
|-------|-------------------------------|-------------------------|--------------------------|
| gsd-executor | YES (in prompt) | PLAN.md, STATE.md, config.json, CLAUDE.md | Per-task commits, SUMMARY.md, STATE.md updates |
| gsd-phase-researcher | YES (in prompt) | CONTEXT.md, REQUIREMENTS.md, STATE.md | RESEARCH.md |
| gsd-plan-checker | YES (in prompt) | PLAN.md files, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md, RESEARCH.md | Structured return (no file) |
| gsd-planner | YES (in prompt) | STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md, RESEARCH.md | PLAN.md files |
| gsd-verifier | YES (in prompt) | PLAN.md, SUMMARY.md, ROADMAP.md, REQUIREMENTS.md | VERIFICATION.md |

### Assessment

The 6 research gatherers and 5 review agents have formal `reads`/`writes` frontmatter -- these were built during v2 phases. The 5 "original" pipeline agents (executor, researcher, plan-checker, planner, verifier) lack this formal declaration -- their I/O is implicit in the workflow prompts that spawn them. The CONTEXT.md decision to add `expects`/`produces` sections to ALL agents means the 5 originals need updating.

## 10 Pipeline Invariants: Implementation Map

| # | Invariant | Where Implemented | File(s) | v2 Impact |
|---|-----------|------------------|---------|-----------|
| 1 | Fresh context per executor | execute-phase.md `execute_waves` step -- spawns Task per plan | `get-shit-done/workflows/execute-phase.md:99-136` | NONE -- Task() mechanism is model-agnostic |
| 2 | Wave dependency analysis | execute-phase.md `discover_and_group_plans` step via `phase-plan-index` CLI | `get-shit-done/workflows/execute-phase.md:50-72`, `gsd-tools.cjs:552` | LOW -- phase-plan-index reads PLAN frontmatter `wave` field, needs path update for capability/feature dirs |
| 3 | Plan-checker verification loop | plan-phase.md steps 10-12 (spawn checker, handle return, revision loop max 3) | `get-shit-done/workflows/plan-phase.md:435-534` | NONE -- checker is spawned with paths, agnostic to dir model |
| 4 | Atomic commits per task | execute-plan.md `task_commit` section + gsd-executor agent | `get-shit-done/workflows/execute-plan.md:194-228`, `agents/gsd-executor.md` | NONE -- git commit format `{type}({phase}-{plan}): desc` may need naming update |
| 5 | Context loading via paths not content | All workflow .md files use `<files_to_read>` with paths; execute-phase passes paths to Task prompts | Throughout all workflows | NONE -- pattern is path-based, paths just need to resolve |
| 6 | State progression via CLI | gsd-tools.cjs `state` command (advance-plan, update-progress, record-metric, add-decision, add-blocker, record-session) | `gsd-tools.cjs:180-260` | MEDIUM -- state commands reference "phase" / "plan" concepts; v2 uses capability/feature |
| 7 | Session handoff | STATE.md `Session Continuity` section + SUMMARY.md frontmatter; transition.md updates session | `get-shit-done/workflows/transition.md:316-334`, `get-shit-done/templates/state.md:67` | MEDIUM -- STATE.md field names change for capability/feature model |
| 8 | Requirement ID chain | plan-phase.md step 9.7 (plan-validate CLI), execute-plan.md `update_requirements`, planner frontmatter `requirements` field | `gsd-tools.cjs:582` (plan-validate), `get-shit-done/workflows/execute-plan.md:354-359` | LOW -- REQ ID scheme (EU/FN/TC) is namespace-agnostic |
| 9 | Summary frontmatter | execute-plan.md `create_summary` step uses summary.md template | `get-shit-done/workflows/execute-plan.md:284-296`, `get-shit-done/templates/summary.md` | LOW -- summary template references "phase" field, needs rename |
| 10 | Spot-check on executor output | execute-phase.md `execute_waves` step 4 -- verify files exist, check git log, check Self-Check marker | `get-shit-done/workflows/execute-phase.md:141-148` | NONE -- checks are file/git based, not model-dependent |

### v2 Impact Summary

- **No impact (5):** Invariants 1, 3, 4, 5, 10 -- these use generic mechanisms (Task spawning, git, file paths)
- **Low impact (3):** Invariants 2, 8, 9 -- need path/field updates but not behavioral changes
- **Medium impact (2):** Invariants 6, 7 -- gsd-tools.cjs state commands and STATE.md fields need v2 vocabulary

## .continue-here Assessment

### What It Is

A `.continue-here.md` file is a session handoff artifact created by `/gsd:pause-work` (commands/gsd/pause-work.md). It captures: current phase/task, completed work, remaining work, decisions made, blockers, mental context, and next action.

### Where Created

- **pause-work.md** (command) -- explicit user action to pause and create handoff

### Where Consumed

- **resume-work.md** (workflow) -- checks for `.continue-here*.md` files as resumption signal
- **transition.md** (workflow) -- deletes stale `.continue-here*.md` files when phase completes

### Redundancy Analysis

| Information | .continue-here | STATE.md | SUMMARY.md |
|-------------|---------------|----------|------------|
| Current position | YES (phase, task number) | YES (current phase, plan, status) | NO |
| Completed work | YES (task list) | NO (only current position) | YES (per-plan) |
| Remaining work | YES (task list) | NO | NO |
| Decisions made | YES | YES (accumulated context) | YES (key-decisions) |
| Blockers | YES | YES (blockers section) | YES (issues encountered) |
| Mental context / "vibe" | YES (unique) | NO | NO |
| Next action | YES (unique) | NO | NO |
| Session timing | YES (last_updated) | YES (last session) | YES (completed timestamp) |

**Verdict:** .continue-here provides two unique values STATE.md and SUMMARY.md don't: (1) "mental context" -- the reasoning/thinking state at pause time, and (2) "next action" -- the exact first step to take on resume. These are genuinely useful for mid-task interruption recovery.

However, STATE.md `Session Continuity` section + SUMMARY.md cover the same ground for inter-plan handoffs (not mid-task). The .continue-here file is only uniquely valuable for MID-TASK pauses where a plan is partially executed.

**Recommendation:** This falls to the deferred evaluation per CONTEXT.md. The data supports: keep for mid-task pause recovery, but it's a low-frequency use case. Decision can defer to Phase 10.

## Framing Pipeline vs Standalone Model

A key structural observation: the framing-pipeline.md provides automatic stage sequencing (research -> requirements -> plan -> execute -> review -> reflect), while the standalone workflows (plan-phase.md, execute-phase.md, review-phase.md, doc-phase.md) require manual invocation between stages.

The CONTEXT.md decisions describe the pipeline handoffs in framing-pipeline terms: "Execute -> Review: execution complete + verification passes -> 4 parallel reviewers auto-spawn." This automatic chaining exists ONLY in framing-pipeline.md. The standalone model requires the user to invoke each stage manually (or use auto-advance for plan->execute only).

### Implication for v2

The framing-pipeline IS the v2 pipeline model. The standalone phase commands are the v1 model that will need evaluation per CONTEXT.md: "For surviving pipeline commands (plan-phase.md, execute-phase.md, research-phase.md): evaluate each -- flag as standalone, merge into v2 feature workflow, or delete."

## Research Gatherer Wiring Status

The 6 research gatherers (domain, edges, intent, prior-art, system, tech) exist as agent definitions but are NOT wired into any surviving command chain. Here's the gap:

```
CURRENT STATE:
  /plan-phase -> spawns gsd-phase-researcher (single agent) -> RESEARCH.md
  /debug,/new,/enhance,/refactor -> framing-discovery -> framing-pipeline
    -> stage 1 invokes research-phase.md -> spawns gsd-phase-researcher (single agent)

DESIGNED STATE (per CONTEXT.md):
  6 gatherers REPLACE gsd-phase-researcher entirely
  NEW standalone research workflow (not inline in framing-pipeline)
  framing-pipeline -> research workflow -> 6 gatherers + synthesizer -> RESEARCH.md
```

The gather-synthesize.md pattern exists and works (used by review-phase). The 6 gatherers have agent definitions. What's missing is the orchestration workflow that invokes them.

## Open Questions

1. **Commit format under v2:** Currently `{type}({phase}-{plan}): desc`. What replaces `{phase}-{plan}` in capability/feature model? Likely `{capability}-{feature}` or similar, but no decision recorded.

2. **phase-plan-index under v2:** This CLI command discovers plans by phase directory. Under v2 with capability/feature directories, it needs path awareness update. Scope question: is this Phase 9 (gsd-tools.cjs path resolution update) or Phase 10 (CLN-03 gsd-tools audit)?

3. **Standalone commands fate:** CONTEXT.md says "evaluate each -- flag as standalone, merge into v2 feature workflow, or delete." This evaluation hasn't happened yet. It's a Phase 9 deliverable but may need its own plan.

4. **Research synthesizer agent:** The 6 gatherers exist, gather-synthesize.md pattern exists, but is there a research synthesizer agent? The review-phase has gsd-review-synthesizer. Need to check if a research synthesizer exists or needs creation.

## Sources

All findings from direct file reading in the repository:
- `get-shit-done/workflows/plan-phase.md` -- plan orchestration
- `get-shit-done/workflows/execute-phase.md` -- execute orchestration
- `get-shit-done/workflows/execute-plan.md` -- single plan execution
- `get-shit-done/workflows/review-phase.md` -- review orchestration
- `get-shit-done/workflows/doc-phase.md` -- documentation orchestration
- `get-shit-done/workflows/framing-pipeline.md` -- v2 pipeline chain
- `get-shit-done/workflows/framing-discovery.md` -- discovery entry point
- `get-shit-done/workflows/research-phase.md` -- standalone research
- `get-shit-done/workflows/transition.md` -- phase transition
- `get-shit-done/workflows/gather-synthesize.md` -- parallel gather pattern
- `get-shit-done/templates/continue-here.md` -- pause handoff template
- `agents/*.md` -- all 17 agent definitions
- `hooks/gsd-context-monitor.js` -- context warning hook
- `hooks/gsd-statusline.js` -- statusline hook
- `get-shit-done/bin/gsd-tools.cjs` -- CLI state management
- `.planning/phases/09-structure-integration/09-CONTEXT.md` -- user decisions
- `.planning/REQUIREMENTS.md` -- requirement IDs
