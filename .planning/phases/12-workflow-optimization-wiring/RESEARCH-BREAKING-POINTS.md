# Phase 12: Breaking Points Research

**Date:** 2026-03-01
**Lens:** Every v1 concept reference that breaks or lies in the v2 capability/feature model
**Method:** Exhaustive grep + file-by-file trace of all surviving code

---

## Executive Summary

The v2 CLI layer (capability, feature, init routes) is solid. The workflow layer still speaks v1. The breakage is a clean seam: everything downstream of framing-pipeline.md (plan.md, execute.md, execute-plan.md, review.md, doc.md) calls `init plan-phase`, `init execute-phase`, `init review-phase`, `init doc-phase` — routes that either don't exist (plan-phase deleted in Phase 10) or return dead-end error messages (review-phase, doc-phase). B1 is the primary blocker and it cascades to B2 (no state bootstrap) and B3 (no feature decomposition bridge).

Additionally: progress.md, resume-work.md, execute-plan.md, and a large surface of templates are hardwired to `.planning/phases/` path assumptions that will silently produce wrong paths in a v2 project.

---

## B1 Detailed Analysis: Pipeline Workflow v1 Init Route Calls

B1 is the terminal failure: the pipeline speaks v2 (capability slugs) but every downstream stage workflow calls v1 phase routes.

### plan.md — Line 18 (CRITICAL BREAK)

```
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-phase "$PHASE")
```

**What this expects:** `$PHASE` = an integer or decimal phase number (e.g., `"03"` or `"2.1"`)
**What framing-pipeline.md provides:** `CAPABILITY_SLUG` (e.g., `"task-management"`)
**CLI status:** `init plan-phase` was DELETED in Phase 10. The route no longer exists. gsd-tools.cjs line 83 says: `// init plan-phase: DELETED — v1 command removed in Phase 10`. The dispatcher falls through to the error catch.
**Cascade:** Everything that follows in plan.md — `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `phase_req_ids` — comes from this init call. Every variable is null/undefined. The workflow cannot proceed.

Additional phase-dependent calls in plan.md (all v1):
- Line 37: `mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"` — creates v1 phase directory
- Line 45: `PHASE_INFO=$(... roadmap get-phase "${PHASE}")` — queries v1 roadmap for phase
- Line 131: `commit "docs(${padded_phase}): generate context from PRD"` — v1 phase path in commit message
- Line 218: `commit-docs "docs(phase-${PHASE}): add validation strategy"` — v1 reference

### execute.md — Line 19 (CRITICAL BREAK)

```
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE_ARG}")
```

**What this expects:** `$PHASE_ARG` = phase number
**What framing-pipeline.md provides:** Invokes execute.md with `<framing_context>` containing BRIEF_PATH, LENS, CAPABILITY_SLUG — but no PHASE_ARG
**CLI status:** `init execute-phase` STILL EXISTS (line 10 in init.cjs, tests pass). But it requires a phase number and searches `.planning/phases/` directories. There is no phases/ directory in a v2 project.
**Cascade:** `phase_found: false`, `plan_count: 0` — execute.md immediately errors: "Error — phase directory not found" or "Error — no plans found in phase."

Additional v1 references in execute.md:
- Line 36: `"phase" or "milestone":` branching strategy logic — v1 branching concept
- Line 54: `phase-plan-index "${PHASE_NUMBER}"` — queries v1 phase plan index
- Line 258: `find-phase "${PARENT_PHASE}"` — v1 phase lookup for gap-closure
- Line 289: `commit "docs(phase-${PARENT_PHASE}):..."` commit to `.planning/phases/*` path
- Line 359: `phase complete "${PHASE_NUMBER}"` — v1 phase completion command
- Lines 363-369: Advances STATE.md to "next phase" — v1 state model

### review.md — Line 17 (DEAD ROUTE)

```
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init review-phase "${PHASE}" --raw)
```

**CLI status:** `init review-phase` returns error: "init review-phase has been removed. Use v2 framing commands instead." (gsd-tools.cjs line 349)
**Exit behavior:** Immediate error, non-zero exit. Workflow cannot initialize.

Additional v1 references in review.md:
- Line 20: Expects `phase_dir`, `phase_number`, `phase_name`, `phase_req_ids` from init — none returned
- Line 22: `if phase_found is false` check — will never be true, will error before
- Lines 83-418: All display, output, and path references use `{phase_dir}`, `{phase_number}`, `Phase {X}` labels

### doc.md — Line 16 (DEAD ROUTE)

```
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init doc-phase "${PHASE}" --raw)
```

**CLI status:** `init doc-phase` returns error: "init doc-phase has been removed. Use v2 framing commands instead." (gsd-tools.cjs line 352)
**Exit behavior:** Immediate error. Workflow cannot initialize.

Additional v1 references in doc.md:
- Line 19: Expects `phase_dir`, `phase_number`, `phase_name`, `summary_files` from init
- Lines 83-266: All phases references, `PHASE_DIR`, `phase_number`, `Phase {X}` labels

### execute-plan.md — Line 18 (INHERITS v1 BREAK)

```
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE}")
```

execute-plan.md is the subagent that execute.md spawns. It makes the same `init execute-phase` call. This will also fail against a v2 feature directory (no phases/ dir). Even if execute.md were fixed to call `init execute-feature`, execute-plan.md would also need updating.

Additional v1 path references in execute-plan.md:
- Line 29: `ls .planning/phases/XX-name/*-PLAN.md`
- Line 30: `ls .planning/phases/XX-name/*-SUMMARY.md`
- Line 58: `grep ... .planning/phases/XX-name/{phase}-{plan}-PLAN.md`
- Line 118: `cat .planning/phases/XX-name/{phase}-{plan}-PLAN.md`
- Line 285: `Create {phase}-{plan}-SUMMARY.md at .planning/phases/XX-name/`
- Line 366: `commit ... .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`
- Lines 389-390: `ls .planning/phases/[current-phase-dir]/*`

### framing-pipeline.md — Pass-through (SYMPTOM CARRIER)

framing-pipeline.md invokes plan.md (line ~150), execute.md (~185), review.md (~220), doc.md (~255) by calling:

```
@~/.claude/get-shit-done/workflows/plan.md
@~/.claude/get-shit-done/workflows/execute.md
@~/.claude/get-shit-done/workflows/review.md
@~/.claude/get-shit-done/workflows/doc.md
```

It passes `<framing_context>` blocks with `BRIEF_PATH`, `LENS`, `CAPABILITY_SLUG`. None of these contain a phase number. framing-pipeline.md itself is not broken — it's the downstream files that are broken because they expect `$PHASE` to exist.

---

## B2 Detailed Analysis: Missing STATE.md / ROADMAP.md Bootstrap

### The Gap

**init-project.md output artifacts (lines 343-364):**
```
| Project      | .planning/PROJECT.md
| Capabilities | .planning/capabilities/
| Architecture | .documentation/architecture.md
| Domain       | .documentation/domain.md
| Mapping      | .documentation/mapping.md
| Decisions    | .documentation/decisions/
```

STATE.md and ROADMAP.md are **not in this list**. init-project.md does not create them.

**After-text says:** "Run /gsd:new to set up requirements and roadmap" — this hints at next step but there is no command or workflow that creates STATE.md + ROADMAP.md as its output.

### Where These Were Created in v1

STATE.md and ROADMAP.md were created by `/gsd:new-milestone` (deleted in Phase 8). That command called `init new-milestone` which scaffolded both files. In v2 the command is gone, the workflow is gone, and no replacement exists.

### What Reads STATE.md Before It Exists

Every pipeline stage reads STATE.md as first step:
- execute-plan.md line 6: "Read STATE.md before any operation"
- execute-plan.md line 299: `Update STATE.md using gsd-tools`
- framing-pipeline.md line 86: passes `state_path: .planning/STATE.md` to research-workflow
- gather-synthesize.md line 34: `.planning/STATE.md — Current position, decisions, blockers`
- resume-work.md line 38: `cat .planning/STATE.md`
- progress.md line 30: `If missing STATE.md: suggest /gsd:new`

**Consequence of missing STATE.md:** Research workflow gets null state context (degrades gracefully). resume-work.md hits the "state_exists: false" branch and offers reconstruction but has no ROADMAP.md to reconstruct from. Progress workflow tells user to run `/gsd:new` — which is circular.

### What the v2 STATE.md Needs to Track

Per CONTEXT.md decisions (## State & roadmap model):

| v1 Field | v2 Replacement | Notes |
|----------|---------------|-------|
| `milestone: v2.0` | `active_focus: [focus-group-name]` | Focus group replaces milestone |
| `milestone_name: milestone` | (removed) | |
| `progress.total_phases` | `progress.capabilities` + `progress.features` | Per cap/feature, not phase count |
| `progress.completed_phases` | (per focus group completion) | |
| `progress.total_plans` / `completed_plans` | Stays (plan counting still relevant) | |
| `Current focus: Phase N` | `Active capability: <slug>` + `Active feature: <slug>` | |
| `Phase: N of M` in Current Position | `Capability: X` + `Feature: Y` | |
| Phase-based performance table | Feature-based performance table | |

### Frontmatter Schema in Current STATE.md

```yaml
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: unknown
last_updated: "..."
progress:
  total_phases: 14
  completed_phases: 11
  total_plans: 41
  completed_plans: 41
```

v2 needs:
```yaml
gsd_state_version: 2.0
active_focus: null          # focus group name or null
status: unknown
last_updated: "..."
progress:
  capabilities: 0
  features: 0
  total_plans: 0
  completed_plans: 0
```

The `milestone` and `milestone_name` fields will be read by `getMilestoneInfo()` in core.cjs which every init.cjs function calls. If these are removed, getMilestoneInfo returns fallback `{ version: 'v1.0', name: 'milestone' }` — harmless but semantically wrong.

---

## B3 Detailed Analysis: Capability → Feature Decomposition Gap

### The Bridge That Doesn't Exist

**framing-pipeline.md receives:** `CAPABILITY_SLUG`, `LENS`, `BRIEF_PATH`

**Stage 2 (Requirements) writes to:** `.planning/capabilities/{CAPABILITY_SLUG}/REQUIREMENTS.md`

**Stage 3 (Plan) invokes:** `plan.md` — which (once fixed to v2) would call `init plan-feature <cap> <feat>`. But `<feat>` doesn't exist yet. The requirements doc is capability-level. There are no feature directories.

**The missing step:** Something must decompose the capability-level REQUIREMENTS.md into individual FEATURE.md files under `.planning/capabilities/{slug}/features/`. Without this:
- `init plan-feature` errors: "capability slug and feature slug required" (init.cjs line 573)
- `findFeatureInternal()` returns `found: false`
- `feature_dir` is null in all v2 init routes

### What the v2 Design Expects (from CONTEXT.md)

```
CAPABILITY.md holds: what + why + feature list + priority order + cross-feature constraints
FEATURE.md holds: 3-layer requirements (EU-xx, FN-xx, TC-xx)
```

The pipeline stages operate at feature level. framing-pipeline.md currently has:
- `feature_path: null` passed to research (acceptable for capability-level research)
- No step that creates feature directories or FEATURE.md files from the REQUIREMENTS.md

### The Missing Workflow Step

Per CONTEXT.md decisions:
> `/gsd:new <cap>` creates CAPABILITY.md (stub)
> Discuss capability enhances CAPABILITY.md + creates initial FEATURE.md stubs
> Discuss feature enhances specific FEATURE.md in depth

The `discuss-capability.md` workflow is supposed to produce FEATURE.md stubs. But looking at what framing-pipeline.md receives after framing-discovery, the gap is clear: framing-discovery produces a BRIEF.md (capability level), and then framing-pipeline jumps to research → requirements → plan. There is no step where features get created under the capability.

**Resolution per CONTEXT.md:** After Stage 2 (requirements generation), requirements need to be decomposed into features. Either:
1. A new "feature decomposition" sub-step within Stage 2 that creates FEATURE.md files from requirements, OR
2. The capability orchestrator (described in CONTEXT.md) handles this: reads CAPABILITY.md, gets feature list, calls framing-pipeline per feature

The CONTEXT.md decision settles this:
> **Capability orchestrator:** Thin orchestrator reads CAPABILITY.md, gets prioritized feature list, calls framing-pipeline for each feature in order.
> **Pipeline passes feature only** (not cap + feature). Stages derive capability from feature's directory path.

So the v2 design intent is: framing-pipeline should receive a FEATURE_SLUG, not a CAPABILITY_SLUG. The capability orchestrator is a new component that doesn't exist yet.

---

## Complete "Phase" Reference Inventory

Scope: all surviving files (commands/, agents/, workflows/, references/, templates/, lib/, hooks/, bin/).
Categories: **FUNCTIONAL** (breaks or lies in v2), **DEAD** (can delete), **INTERNAL** (CLI route name, fine as identifier).

### commands/ directory

All command files (`debug.md`, `new.md`, `enhance.md`, `refactor.md`, `init.md`, `discuss-capability.md`, `discuss-feature.md`, `progress.md`, `resume-work.md`) — no phase references in their slim invocation text. These files just call gsd-tools.cjs and invoke workflows.
**Status:** CLEAN

### agents/ directory

No phase references in agent files (gsd-planner.md, gsd-executor.md, etc. — they are goal-driven, not phase-aware).
**Status:** CLEAN

### workflows/plan.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 18 | `init plan-phase "$PHASE"` | FUNCTIONAL (DELETED ROUTE) | Replace with `init plan-feature <cap> <feat>` |
| 21 | Parses `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `phase_req_ids` | FUNCTIONAL | Map to feature equivalents from v2 init |
| 25 | `If planning_exists is false: Error — run /gsd:new first` | FUNCTIONAL | Update to check capability/feature structure |
| 29 | `Extract phase number (integer or decimal)` | FUNCTIONAL | Replace with feature slug extraction |
| 33 | `If no phase number: Detect next unplanned phase` | FUNCTIONAL | Replace with feature slug resolution |
| 35 | `If phase_found is false: Validate phase exists in ROADMAP.md` | FUNCTIONAL | Replace with feature existence check |
| 37 | `mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"` | FUNCTIONAL | Replace with feature directory creation |
| 45 | `roadmap get-phase "${PHASE}"` | FUNCTIONAL | Replace with feature-level lookup |
| 125 | `*Phase: XX-name*` in CONTEXT.md template | FUNCTIONAL | Replace with capability/feature reference |
| 131 | `commit "docs(${padded_phase}): generate context from PRD"` | FUNCTIONAL | Update commit message pattern |
| 144 | `Using phase context from: ${context_path}` | FUNCTIONAL | Update display text |
| 152-156 | `/gsd:discuss-capability {X}` error routing (still valid — just update arg) | INTERNAL | Keep, verify arg format |
| 184 | `subject: "Phase {phase_number}: {phase_name}"` | FUNCTIONAL | Replace with feature name |
| 190-192 | `output_dir: {phase_dir}`, `capability_path: null (phase-scoped)` | FUNCTIONAL | Wire capability/feature paths |
| 215 | `Fill frontmatter: replace {N} with phase number` | FUNCTIONAL | Replace with feature-scope data |
| 218 | `commit-docs "docs(phase-${PHASE}): add validation strategy"` | FUNCTIONAL | Update commit scope |
| 260 | `GSD RESEARCHING PHASE {X}` banner | FUNCTIONAL | Replace with feature name |
| 270 | `**Phase:** {phase_number}` in planner prompt | FUNCTIONAL | Replace with feature |
| 277 | `context from /gsd:discuss-capability` label | INTERNAL | Fine (command still exists) |
| 284 | `phase requirement IDs` | FUNCTIONAL | Replace with feature requirement IDs |
| 298-303 | Quality gate checks mention "phase directory" | FUNCTIONAL | Update terminology |
| 312 | `description="Plan Phase {phase}"` | FUNCTIONAL | Replace with feature |
| 432, 481 | `**Phase:** {phase_number}` in checker/revision prompts | FUNCTIONAL | Replace with feature |
| 546-570 | Auto-advance spawns execute.md with `PHASE=${PHASE}` | FUNCTIONAL | Replace with feature args |
| 557 | `ARGUMENTS='${PHASE} --auto'` | FUNCTIONAL | Replace with feature slug args |
| 575-583 | `PHASE ${PHASE} COMPLETE` banner | FUNCTIONAL | Replace with feature label |
| 602 | `PHASE {X} PLANNED` banner | FUNCTIONAL | Replace with feature |
| 628 | `cat .planning/phases/{phase-dir}/*-PLAN.md` | FUNCTIONAL | Replace with feature path |

### workflows/execute.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 19 | `init execute-phase "${PHASE_ARG}"` | FUNCTIONAL | Replace with `init execute-feature <cap> <feat>` |
| 22 | Parses `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `phase_req_ids` | FUNCTIONAL | Map to feature equivalents |
| 24-25 | `phase_found is false` / `plan_count is 0` errors | FUNCTIONAL | Update to feature checks |
| 36 | `"phase" or "milestone"` branching strategy | FUNCTIONAL | Remove "phase" strategy (keep "milestone" for git) |
| 45, 47 | `phase_dir`, `plan_count`, `incomplete_count` from init | FUNCTIONAL | Map to feature equivalents |
| 54 | `phase-plan-index "${PHASE_NUMBER}"` | FUNCTIONAL | Replace with feature plan index |
| 108 | `Execute plan {plan_number} of phase {phase_number}-{phase_name}` | FUNCTIONAL | Replace with feature name |
| 244-258 | Gap-closure decimal phase logic (`$PHASE_NUMBER == *.*`) | FUNCTIONAL | Replace with feature-level gap closure |
| 258 | `find-phase "${PARENT_PHASE}"` | FUNCTIONAL | Replace or remove |
| 289 | `commit ... .planning/phases/*${PARENT_PHASE}*/` | FUNCTIONAL | Replace with feature path |
| 298-302 | `Verify phase {phase_number} goal achievement. Phase directory: {phase_dir}` | FUNCTIONAL | Replace with feature |
| 337, 349 | `{phase_dir}/{phase_num}-VERIFICATION.md` | FUNCTIONAL | Replace with feature path |
| 356-372 | `phase complete "${PHASE_NUMBER}"` + all roadmap/state updates | FUNCTIONAL | Replace with feature completion route |
| 385-390 | Completion summary references "phase_number", "phase_name" | FUNCTIONAL | Replace with feature |

### workflows/review.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 17 | `init review-phase "${PHASE}" --raw` | FUNCTIONAL (DEAD ROUTE) | Replace with `init feature-op <cap> <feat> review` |
| 19-22 | Parses phase-specific fields, `phase_found is false` error | FUNCTIONAL | Map to feature equivalents |
| 83, 95-104, 113, 174, 205, 246, 337, 375-418 | All `{phase_dir}`, `{phase_number}`, `Phase {X}` references | FUNCTIONAL | Replace with feature slugs/paths |

### workflows/doc.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 16 | `init doc-phase "${PHASE}" --raw` | FUNCTIONAL (DEAD ROUTE) | Replace with `init feature-op <cap> <feat> doc` |
| 19-21 | Parses phase-specific fields | FUNCTIONAL | Map to feature equivalents |
| 83, 95, 129, 239, 251, 266 | All `Phase {X}`, `{phase_dir}`, `{phase_number}` | FUNCTIONAL | Replace with feature references |

### workflows/execute-plan.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 18 | `init execute-phase "${PHASE}"` | FUNCTIONAL | Replace with `init execute-feature` |
| 21 | Parses `phase_dir`, `phase_number` etc | FUNCTIONAL | Map to feature equivalents |
| 29-30, 58, 118, 278, 285, 366, 389-390 | `.planning/phases/XX-name/` path patterns | FUNCTIONAL | Replace with feature directory paths |
| 36 | `PHASE=$(echo "$PLAN_PATH" \| grep -oE ...)` | FUNCTIONAL | Phase number regex, replace with feature slug |
| 41 | `Execute {phase}-{plan}-PLAN.md [Plan X of Y for Phase Z]` | FUNCTIONAL | Replace with feature-scoped naming |
| 106 | `git log --grep="{phase}-{plan}"` | FUNCTIONAL | Update commit grep pattern |
| 220, 310, 322, 334, 347, 366, 374 | Various `{phase}`, `${PHASE}` interpolations | FUNCTIONAL | Replace throughout |
| 396-397 | Phase complete / milestone complete routing table | FUNCTIONAL | Replace with feature/capability completion |

### workflows/progress.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 30 | `If missing STATE.md: suggest /gsd:new` | FUNCTIONAL | Update routing |
| 34 | `milestone was completed and archived — Route F` | FUNCTIONAL | Replace milestone route with focus-group concept |
| 58-61 | `Goal and dependencies per phase`, `Plan and summary counts per phase`, `Current and next phase identification` | FUNCTIONAL | Replace with capability/feature model |
| 106-107 | `Phase [N] of [total]`, `Plan [M] of [phase-total]` | FUNCTIONAL | Replace with feature-based |
| 121 | `Next phase/plan objective from roadmap analyze` | FUNCTIONAL | Replace with focus group / feature next step |
| 129-147 | `ls .planning/phases/[current-phase-dir]/` commands | FUNCTIONAL | Replace with `.planning/capabilities/` paths |
| 174, 176 | `{phase}-{plan}: [Plan Name]`, `/gsd:execute {phase}` | FUNCTIONAL | Replace with feature slug |
| 187 | `{phase_num}-CONTEXT.md exists in phase directory` | FUNCTIONAL | Replace with feature directory check |
| 249-264 | Milestone status routing (steps 3, routes C and D) | FUNCTIONAL | Replace with focus group completion logic |
| 270, 279 | `ROADMAP.md to get next phase name` | FUNCTIONAL | Replace with focus group / capability next |
| 308, 319-334 | `milestone status`, `MILESTONES.md`, `next milestone` | FUNCTIONAL | Replace with focus group transitions |
| 346 | `offer milestone completion` | FUNCTIONAL | Replace |

### workflows/resume-work.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 29 | `state_exists is false but roadmap_exists or project_exists` | FUNCTIONAL | Update; ROADMAP.md is now v2-style |
| 38, 42 | `cat .planning/STATE.md`, extract from STATE.md | FUNCTIONAL | Update field names (phase → feature) |
| 65, 68 | `ls .planning/phases/*/.continue-here*.md`, `for plan in .planning/phases/` | FUNCTIONAL | Replace with capabilities path |
| 151-191 | Phase-based routing (phase in progress, phase ready to plan, etc.) | FUNCTIONAL | Replace with feature-based routing |
| 194 | `ls .planning/phases/XX-name/*-CONTEXT.md` | FUNCTIONAL | Replace with feature dir |
| 211, 213 | `{phase}-{plan}:`, `/gsd:execute {phase}` | FUNCTIONAL | Replace |
| 225 | `Phase [N]: [Name] — [Goal from ROADMAP.md]` | FUNCTIONAL | Replace with feature |
| 267 | `Read ROADMAP.md -> Determine phases, find current position` | FUNCTIONAL | Replace with capability/feature scan |

### workflows/gather-synthesize.md

| Line | Reference | Category | Action Needed |
|------|-----------|----------|---------------|
| 11 | `output_path — e.g., .planning/phases/XX-name/research/domain-truth.md` | FUNCTIONAL | Update example path |
| 19 | `phase name (e.g., "capability: user-auth", "feature: password-reset")` | INTERNAL | Already includes v2 examples — mostly fine |
| 34-35 | `.planning/STATE.md — Current position`, `.planning/ROADMAP.md — Phase structure` | FUNCTIONAL | Labels still valid (paths correct), but "phase structure" → "focus group structure" |
| 130 | `## GATHER PHASE FAILED` | INTERNAL | Pipeline stage label, fine to keep |
| 159 | `Gather phase complete.` | INTERNAL | Pipeline stage label, fine to keep |

### references/

| File | Line | Reference | Category | Action |
|------|------|-----------|----------|--------|
| `git-integration.md` | 108, 114 | `.planning/phases/XX-name/` commit patterns | FUNCTIONAL | Update to feature dir path pattern |
| `ui-brand.md` | 20, 23, 24, 67 | `PLANNING PHASE {N}`, `PHASE {N} COMPLETE`, `MILESTONE COMPLETE`, `Phase/milestone level:` | FUNCTIONAL | Update banners to use feature/capability names |
| `model-profiles.md` | (no phase refs) | CLEAN | — |
| `pipeline-invariants.md` | (no phase refs) | CLEAN | — |
| `framing-lenses.md` | (no phase refs) | CLEAN | — |
| `checkpoints.md` | (no phase refs) | CLEAN | — |
| `escalation-protocol.md` | (no phase refs) | CLEAN | — |
| `continuation-format.md` | (no phase refs) | CLEAN | — |
| `questioning.md` | (no phase refs) | CLEAN | — |

### templates/

| File | Breaking References | Category | Action |
|------|---------------------|----------|--------|
| `phase-prompt.md` | Lines 6, 8, 115, 125, 234-235, 342, 374-375, 412 — all `.planning/phases/XX-name/{phase}-{plan}-*` paths | FUNCTIONAL | This template is for v1 PLAN.md files. Needs v2 replacement or complete rewrite for feature-scoped plans |
| `planner-subagent-prompt.md` | Lines 25, 28, 31-32, 101-102 — all `.planning/phases/{phase_dir}/` paths | FUNCTIONAL | Entire file is a v1 template. Needs v2 rewrite. |
| `context.md` | Lines 3, 293 — `.planning/phases/XX-name/{phase_num}-CONTEXT.md` | FUNCTIONAL | Update path template to feature dir |
| `research.md` | Lines 3, 550 — `.planning/phases/XX-name/{phase_num}-RESEARCH.md` | FUNCTIONAL | Update path template to feature dir |
| `summary.md` | Lines 3, 109 — `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md` | FUNCTIONAL | Update path template |
| `user-setup.md` | Lines 3, 64, 309 — `.planning/phases/XX-name/{phase}-USER-SETUP.md` | FUNCTIONAL | Update path template |
| `discovery.md` | Lines 3, 73 — `.planning/phases/XX-name/DISCOVERY.md` | FUNCTIONAL | Update path template |
| `continue-here.md` | Line 3 — `.planning/phases/XX-name/.continue-here.md` | FUNCTIONAL | Update path template |
| `UAT.md` | Line 3 — `.planning/phases/XX-name/{phase_num}-UAT.md` | FUNCTIONAL | Update path template |
| `docs.md` | (no phase refs) | CLEAN | — |
| `review.md` | (no phase refs) | CLEAN | — |
| `feature.md` | (no phase refs) | CLEAN | — |
| `capability.md` | (no phase refs) | CLEAN | — |
| `roadmap.md` | Lines 17-201 — entire v1 roadmap format with Phase structure | FUNCTIONAL | Needs v2 format (focus groups, capability/feature list) |
| `state.md` | Lines 17, 35, 37, 99, 102, 114, 133 — phase-based `Current focus`, `By Phase` table, `Update position (phase, plan)` | FUNCTIONAL | Needs v2 field updates (feature tracking, focus group) |
| `requirements.md` | Lines 15, 37 — `current milestone`, `future milestone` | FUNCTIONAL | Replace with capability/feature scope |
| `project.md` | Lines 88, 122, 133, 138, 179 — phase/milestone mentions | FUNCTIONAL | Some tolerable (historical refs), Current focus update needed |
| `codebase/*.md` | Lines `Useful for phase planning when:` (in all 7 files) | DEAD | Vestigial section label — update to generic "when to use" |
| `config.json` | (no phase refs) | CLEAN | — |
| `VALIDATION.md` | Lines 53, 63 — "phase requirements" terminology | FUNCTIONAL | Update to "feature requirements" |
| `debug-subagent-prompt.md` | (no phase refs) | CLEAN | — |
| `discovery-brief.md` | (no phase refs) | CLEAN | — |

---

## Complete "Milestone" Reference Inventory

| File | Lines | Reference | Category | Action |
|------|-------|-----------|----------|--------|
| `workflows/execute.md` | 36 | `"phase" or "milestone"` branching strategy | FUNCTIONAL | Keep "milestone" git strategy concept (still valid for git branching), remove "phase" |
| `workflows/execute-plan.md` | 397 | `C: Milestone done — suggest /gsd:progress for milestone review` | FUNCTIONAL | Replace with capability/focus-group completion routing |
| `workflows/progress.md` | 249-264, 308-334 | Entire milestone routing logic (routes D, F) | FUNCTIONAL | Replace with focus group model |
| `templates/roadmap.md` | 15-202 | Entire v1 roadmap format including milestone section format | FUNCTIONAL | Replace with v2 focus-group format (see CONTEXT.md) |
| `templates/state.md` | Throughout | References to milestone in lifecycle description | FUNCTIONAL | Update lifecycle to feature/focus-group model |
| `templates/requirements.md` | 15, 37 | "current milestone", "future milestone" | FUNCTIONAL | Replace with capability scope |
| `templates/project.md` | 122, 138 | "v1.0 milestone" format, "After each milestone:" | FUNCTIONAL | Update to capability-based workflow |
| `references/ui-brand.md` | 24, 67 | `MILESTONE COMPLETE 🎉`, `Phase/milestone level:` | FUNCTIONAL | Replace with focus group / capability completion banner |
| `bin/lib/init.cjs` | 59-68, 96-97, 103, 655-686, 788-855 | `getMilestoneInfo()` calls, `milestone_version`, `milestone_name`, `milestone_slug` in init output | FUNCTIONAL | v2 init routes (plan-feature, execute-feature) still call getMilestoneInfo for branching. Need focus group concept or drop milestone from v2 routes |
| `bin/lib/core.cjs` | 257, 308, 439, 442 | `getMilestoneInfo()`, `milestone` in result, fallback `{ version: 'v1.0', name: 'milestone' }` | FUNCTIONAL | getMilestoneInfo reads STATE.md frontmatter `milestone:` field. If removed from STATE.md, returns fallback. Branching strategy `milestone` still works via config; core just needs correct data |
| `bin/lib/commands.cjs` | 115, 153, 170-171 | `getMilestoneInfo`, progress output includes milestone | FUNCTIONAL | Update progress display to show focus groups |
| `bin/lib/config.cjs` | 52 | `milestone_branch_template: 'gsd/{milestone}-{slug}'` | INTERNAL | Config option kept for git branching — valid to keep as git branch naming |
| `bin/lib/roadmap.cjs` | 174 | `Extract milestone info` | FUNCTIONAL | Roadmap parser reads milestone headings. v2 ROADMAP.md uses focus group headings instead |
| `bin/lib/state.cjs` | 548-616 | Reads/writes `milestone` field in STATE.md frontmatter | FUNCTIONAL | Update to `active_focus` field |
| `bin/lib/milestone.cjs` | (entire file) | v1 milestone archive/complete functions | DEAD | No v2 commands call this. `gsd-tools.cjs` still routes to `milestone complete`. Can remove or defer. |
| `bin/gsd-tools.cjs` | 93, 310 | `const milestone = require('./lib/milestone.cjs')`, `milestone.cmdRequirementsMarkComplete()` | DEAD | Only live call is `requirements mark-complete` which uses milestone.cjs for something unrelated. Audit whether cmdRequirementsMarkComplete is needed |
| `docs/USER-GUIDE.md` | 53-72, 168-191, 233, 265-284, 319-362, 436-476 | Extensive v1 milestone lifecycle docs | DEAD | Entire USER-GUIDE.md describes v1 commands. Needs full rewrite for v2. Defer to Phase 14 (install/deploy) |
| `README.md` | 341-352, 441-501, 582-591 | Milestone lifecycle commands, git strategy docs | DEAD | README describes v1. Needs rewrite. Defer to Phase 14 |
| `.planning/STATE.md` (project meta) | 3-4, 21 | `milestone: v2.0`, `milestone_name: milestone`, "milestone v2.0" in Current focus | FUNCTIONAL (this project's state) | This is the project's own STATE.md, not a template. Update after v2 is wired. |
| `tests/milestone.test.cjs` | (all) | Tests for v1 milestone.cjs functions | DEAD/INTERNAL | Tests still test real code. If milestone.cjs is removed, tests go with it. If kept for now, tests stay. |

---

## Template v1 Assumptions List

The following templates embed v1 model assumptions that will produce wrong output or fail when used by a v2 project:

### 1. `templates/phase-prompt.md` (HIGHEST PRIORITY — planner uses this)
**Assumption:** Plans live at `.planning/phases/XX-name/{phase}-{plan}-PLAN.md`
**v2 reality:** Plans live at `.planning/capabilities/<cap>/features/<feat>/{plan}-PLAN.md`
**Breaking:** Planner (gsd-planner.md) reads this template to understand PLAN.md format. The naming convention section, example paths, and after-completion instructions all reference the phases/ directory.
**Action:** Rewrite for v2 feature-scoped naming.

### 2. `templates/planner-subagent-prompt.md` (HIGH PRIORITY — planner spawning)
**Assumption:** All `@file` refs use `.planning/phases/{phase_dir}/` paths
**v2 reality:** Files are at `.planning/capabilities/<cap>/features/<feat>/`
**Breaking:** 8 file references will fail resolution.
**Action:** Rewrite for v2 feature directory.

### 3. `templates/context.md`
**Assumption:** `File lives in phase directory: .planning/phases/XX-name/{phase_num}-CONTEXT.md`
**v2 reality:** Lives in feature dir at `.planning/capabilities/<cap>/features/<feat>/CONTEXT.md`
**Action:** Update path description.

### 4. `templates/research.md`
**Assumption:** `File lives in phase directory: .planning/phases/XX-name/{phase_num}-RESEARCH.md`
**v2 reality:** Lives in capability or feature dir
**Action:** Update path description.

### 5. `templates/roadmap.md`
**Assumption:** Entire Phase-based roadmap format (Phase 1, Phase 2... with success criteria, plans, progress table)
**v2 reality:** Focus group format (see CONTEXT.md example ROADMAP format)
**Action:** Complete rewrite with v2 focus group template.

### 6. `templates/state.md`
**Assumption:** `Current Position` tracks Phase X of Y, By Phase performance table, phase-based lifecycle
**v2 reality:** Tracks Active capability + feature, focus group, feature-level velocity
**Action:** Rewrite Current Position and Performance Metrics sections, update lifecycle docs.

### 7. `templates/summary.md`, `templates/user-setup.md`, `templates/discovery.md`, `templates/continue-here.md`, `templates/UAT.md`
**Assumption:** All reference `.planning/phases/XX-name/` in their header comment
**v2 reality:** Feature dir paths
**Action:** Update header path description only — content is largely fine.

### 8. `templates/requirements.md`
**Assumption:** "Requirements for current milestone", "Deferred to future milestone"
**v2 reality:** Scoped to capability
**Action:** Update scope language.

---

## STATE.md v1 → v2 Field Mapping

### Frontmatter

| v1 Field | v1 Value (current) | v2 Field | v2 Value | Notes |
|----------|-------------------|----------|----------|-------|
| `gsd_state_version` | `1.0` | `gsd_state_version` | `2.0` | Bump version |
| `milestone` | `v2.0` | `active_focus` | `null` or `"focus-group-name"` | Focus group replaces milestone as session anchor |
| `milestone_name` | `milestone` | (remove) | — | No v2 equivalent |
| `status` | `unknown` | `status` | `unknown` | Keep |
| `last_updated` | timestamp | `last_updated` | timestamp | Keep |
| `progress.total_phases` | `14` | (remove) | — | No phases in v2 |
| `progress.completed_phases` | `11` | (remove) | — | |
| `progress.total_plans` | `41` | `progress.total_plans` | int | Keep — plans still exist |
| `progress.completed_plans` | `41` | `progress.completed_plans` | int | Keep |

### Body Sections

| v1 Section | v1 Content | v2 Equivalent | Notes |
|------------|-----------|---------------|-------|
| `## Project Reference > Current focus` | `Phase 12 -- Workflow Optimization & Wiring (milestone v2.0)` | Active capability slug + feature slug | Single line changes |
| `## Current Position > Phase: N of M` | `Phase: 12 of 14` | `Capability: <slug>` + `Feature: <slug>` | Replace phase-based position |
| `## Current Position > Plan: 0 of TBD` | Plan counter | Keep — still valid | |
| `## Current Position > Status` | `Not started` | Keep | |
| `## Current Position > Progress bar` | `[=====-----] 79% (11/14 phases)` | Per-feature progress or focus group progress | Calculation changes |
| `## Performance Metrics > By Phase table` | Phase | Feature table | Replace Phase col with Feature col |
| `## Accumulated Context > Decisions` | Phase-refs like `[09-01]:` | Feature-refs like `[coaching/mistake-detection]:` | Update format |
| `## Session Continuity > Resume file` | Phase context path | Feature context path | Update path format |

### What `state.cjs` Reads/Writes (from init.cjs)

`state.cjs` writes `milestone` to frontmatter (line 616). This is read by `getMilestoneInfo()` in core.cjs for branching strategy. In v2 the branching is still valid (you can branch per milestone/focus group). The field name should change to `active_focus` but that requires updating:
- `state.cjs` write logic (line 616)
- `core.cjs` `getMilestoneInfo()` function to read `active_focus` instead of `milestone`
- All init functions that call `getMilestoneInfo()` and return `milestone_version`/`milestone_name`

---

## Init Route Gap Analysis

### What exists in gsd-tools.cjs for v2

```
init plan-feature <cap> <feat>     → cmdInitPlanFeature() ✓ EXISTS
init execute-feature <cap> <feat>  → cmdInitExecuteFeature() ✓ EXISTS
init feature-op <cap> <feat> <op>  → cmdInitFeatureOp() ✓ EXISTS
init feature-progress              → cmdInitFeatureProgress() ✓ EXISTS
```

### What `init plan-feature` returns vs what plan.md expects

| plan.md expects from v1 | init plan-feature returns | Gap |
|------------------------|--------------------------|-----|
| `phase_found` | `feature_found` | Rename |
| `phase_dir` | `feature_dir` | Rename |
| `phase_number` | (absent) | DROP |
| `phase_name` | (absent) | Replace with feature_slug |
| `phase_slug` | `feature_slug` | Rename |
| `padded_phase` | (absent) | DROP — not needed for feature dirs |
| `phase_req_ids` | (absent — init plan-feature doesn't parse req IDs) | GAP: needs to read from FEATURE.md |
| `researcher_model` | `researcher_model` ✓ | |
| `planner_model` | `planner_model` ✓ | |
| `checker_model` | `checker_model` ✓ | |
| `research_enabled` | `research_enabled` ✓ | |
| `plan_checker_enabled` | `plan_checker_enabled` ✓ | |
| `has_research` | `has_research` ✓ | |
| `has_context` | `has_context` ✓ | |
| `has_plans` | `has_plans` ✓ | |
| `plan_count` | `plan_count` ✓ | |
| `planning_exists` | `planning_exists` ✓ | |
| `roadmap_exists` | `roadmap_exists` ✓ | |
| `state_path` | `state_path` ✓ | |
| `roadmap_path` | `roadmap_path` ✓ | |
| `requirements_path` | `requirements_path` ✓ (but .planning/REQUIREMENTS.md — should be FEATURE.md path) | PARTIAL GAP |

### What `init execute-feature` returns vs what execute.md expects

| execute.md expects from v1 | init execute-feature returns | Gap |
|---------------------------|------------------------------|-----|
| `phase_found` | `feature_found` | Rename |
| `phase_dir` | `feature_dir` | Rename |
| `phase_number`, `phase_name`, `phase_slug` | (absent) | DROP / replace |
| `phase_req_ids` | (absent) | GAP: not extracted |
| `plans`, `incomplete_plans`, `plan_count`, `incomplete_count` | `plans`, `incomplete_plans`, `plan_count`, `incomplete_count` ✓ | |
| `state_exists`, `roadmap_exists` | `state_exists`, `roadmap_exists` ✓ | |
| `branching_strategy`, `branch_name` | (absent — branching removed from execute-feature) | GAP: branching per feature not designed |
| `parallelization` | `parallelization` ✓ | |
| `executor_model`, `verifier_model` | `executor_model`, `verifier_model` ✓ | |
| `phase-plan-index` route needed | (no feature-plan-index exists) | GAP: `phase-plan-index` needs feature equivalent |

---

## Open Gaps Not Covered by Existing Routes

1. **`phase-plan-index` has no feature equivalent.** execute.md calls `phase-plan-index "${PHASE_NUMBER}"` to get wave groupings for parallel execution. There is no `feature-plan-index` route. Plan index for features needs to be added to gsd-tools.cjs.

2. **`roadmap get-phase` has no feature equivalent.** plan.md calls this to get phase name, goal, dependencies. For features these come from FEATURE.md, not ROADMAP.md.

3. **`phase complete` has no feature equivalent.** execute.md calls `phase complete "${PHASE_NUMBER}"` to mark completion and advance state. For features, completion updates FEATURE.md status and STATE.md active feature.

4. **`roadmap update-plan-progress` is phase-scoped.** execute-plan.md calls this. Needs feature-scoped equivalent or update to work with feature paths.

5. **`plan-validate` uses REQUIREMENTS.md path.** plan.md passes `${REQUIREMENTS_PATH}` or `${FEATURE_PATH}` to plan-validate. The feature path routing exists in plan.md (line 252) but needs verification against actual `plan-validate` behavior.

6. **Capability orchestrator doesn't exist.** CONTEXT.md describes a thin orchestrator that reads CAPABILITY.md, gets feature list, calls framing-pipeline per feature. No file implements this.

7. **`init review-feature` and `init doc-feature` don't exist.** review.md and doc.md need v2 init routes. Currently only plan-feature, execute-feature, feature-op exist. review and doc would likely use feature-op with different ops, or need dedicated init functions.

---

## Summary: What Needs to Be Built vs. Fixed

### Rewrite (broken, must replace)
1. `plan.md` — full v2 rewrite, call `init plan-feature`, use feature paths throughout
2. `execute.md` — full v2 rewrite, call `init execute-feature`, remove phase gap-closure logic
3. `review.md` — full v2 rewrite, new init route for review context
4. `doc.md` — full v2 rewrite, new init route for doc context
5. `execute-plan.md` — update all `.planning/phases/` path references to feature paths
6. `progress.md` — rewrite routing logic for focus groups / capabilities / features
7. `resume-work.md` — rewrite position detection for feature model

### New (missing, must create)
1. `init-project.md` output: create STATE.md + ROADMAP.md at end of init (B2 fix)
2. Capability orchestrator workflow: reads CAPABILITY.md features list, calls framing-pipeline per feature
3. `feature-plan-index` CLI route (execute.md needs wave grouping per feature)
4. `feature complete` CLI route (execute.md needs feature completion handler)
5. `init review-feature` or `feature-op review` handler expansion
6. `init doc-feature` or `feature-op doc` handler expansion
7. v2 ROADMAP.md template (focus group format)
8. v2 STATE.md template (capability/feature tracking)

### Update (v1 terminology, not broken but wrong)
1. `templates/phase-prompt.md` → v2 PLAN.md template with feature paths
2. `templates/planner-subagent-prompt.md` → v2 paths
3. `templates/context.md`, `research.md`, `summary.md`, `UAT.md`, `discovery.md`, `continue-here.md`, `user-setup.md` → path headers only
4. `templates/requirements.md` → scope language
5. `references/git-integration.md` → path examples
6. `references/ui-brand.md` → banner text
7. `templates/codebase/*.md` → "Useful for phase planning when:" label (7 files, cosmetic)

### Defer (docs, README, tests — not blocking pipeline)
1. `docs/USER-GUIDE.md` — full v1, defer to Phase 14
2. `README.md` — full v1, defer to Phase 14
3. `tests/milestone.test.cjs` — if milestone.cjs survives, tests stay
4. `.planning/STATE.md` (project's own state) — update after v2 wiring complete

---

*Research complete. Planner can now create PLAN.md files.*
