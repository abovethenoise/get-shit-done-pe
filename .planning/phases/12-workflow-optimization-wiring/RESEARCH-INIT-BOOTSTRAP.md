# Research: Init & Bootstrap — Detect/Branch/Converge

**Researched:** 2026-03-01
**Lens:** Init flow, STATE.md v2, ROADMAP.md v2, bootstrap gaps
**Source:** Direct file reads of init-project.md, init.cjs, gsd-tools.cjs router, all templates

---

## Current Init Flow (Step-by-Step)

### Entry Point

Command: `/gsd:init` -> `commands/gsd/init.md`

`init.md` loads:
- `get-shit-done/workflows/init-project.md`
- `get-shit-done/workflows/gather-synthesize.md`
- `get-shit-done/references/questioning.md`
- `get-shit-done/templates/project.md`

### Step 1: Detection (`init project` CLI route)

```
gsd-tools.cjs init project
```

`cmdInitProject()` in `lib/init.cjs` detects:

```
code_exists = source files found (TS/JS/PY/GO/RS/SWIFT/JAVA/RB/PHP/C/CPP/CS) OR package file exists
planning_exists = .planning/ directory exists
project_exists = .planning/PROJECT.md exists
```

Detection logic:
```
!code_exists && !planning_exists  ->  detected_mode: "new"
 code_exists && !project_exists   ->  detected_mode: "existing"
 project_exists (partial run)     ->  detected_mode: partialRun.mode || "ambiguous"
 project_exists (no partial)      ->  detected_mode: "ambiguous"
 otherwise                        ->  detected_mode: "ambiguous"
```

Also checks `init-state.json` for partial run state and determines `next_section`.

### Step 2: Mode Resolution

- `ambiguous` -> AskUserQuestion: "New project" or "Existing project"
- `new` -> New-Project Flow
- `existing` -> Existing-Project Flow

### Step 3a: New-Project Flow (Steps 3a-3f)

```
3a. Goals Q&A          (freeform)
    -> write init-state.json {mode:"new", completed_sections:["goals"]}

3b. Tech Stack Q&A     (AskUserQuestion + freeform)
    -> update init-state.json + ["tech_stack"]

3c. Architecture Q&A   (AskUserQuestion + freeform)
    -> update init-state.json + ["architecture"]

3d. Write PROJECT.md
    -> mkdir -p .planning
    -> commit "docs: initialize project"
    -> update init-state.json + ["project_md"]

3e. Write Capability Map
    -> capability-create "[name]" (one per derived capability)
    -> update each CAPABILITY.md
    -> update init-state.json + ["capability_map"]

3f. Seed .documentation/
    -> mkdir .documentation/capabilities .documentation/decisions
    -> write architecture.md, domain.md, mapping.md
    -> commit "docs: seed documentation structure"
    -> update init-state.json + ["documentation"]
```

### Step 3b: Existing-Project Flow (Steps 4a-4f)

```
4a. Parallel Scan (gather-synthesize, 6 dimensions)
    -> Structure, Stack, Data Models, Patterns, Entry Points, Dependencies
    -> write .planning/init-scan-draft.md
    -> update init-state.json {mode:"existing", completed_sections:["scan"]}

4b. User Validation (6 independent sections)
    -> Each: Correct / Needs correction / Low confidence
    -> Intent questions (why choices were made)
    -> update init-state.json + ["validation"]

4c. Gap Fill
    -> Domain context, tech debt, low-confidence areas, project direction
    -> update init-state.json + ["gap_fill"]

4d. Write PROJECT.md
    -> mkdir -p .planning
    -> commit "docs: initialize project from existing codebase"
    -> update init-state.json + ["project_md"]

4e. Write Capability Map
    -> capability-create "[name]" per major module/feature area
    -> update init-state.json + ["capability_map"]

4f. Seed .documentation/
    -> mkdir .documentation/capabilities .documentation/decisions
    -> write architecture.md, domain.md, mapping.md
    -> commit "docs: seed documentation from codebase scan"
    -> update init-state.json + ["documentation"]
```

### Step 5: Completion

```
rm .planning/init-state.json
rm .planning/init-scan-draft.md
Print summary table
Print next step: "Run /gsd:new to set up requirements and roadmap"
```

---

## CLI Init Routes Inventory

All routes handled in `gsd-tools.cjs` case `'init'`:

| Route | Handler | Args | Purpose |
|-------|---------|------|---------|
| `init project` | `cmdInitProject` | none | Auto-detect mode, return detection state |
| `init resume` | `cmdInitResume` | none | Resume-work context (STATE/ROADMAP/PROJECT existence) |
| `init progress` | `cmdInitProgress` | none | Progress workflow context (phase-based, v1 model) |
| `init execute-phase <phase>` | `cmdInitExecutePhase` | phase | Execute-phase context (v1 model, phase-based) |
| `init framing-discovery <lens> [cap]` | `cmdInitFramingDiscovery` | lens, cap? | Framing entry — lens setup + capability resolution |
| `init discuss-capability` | `cmdInitDiscussCapability` | none | Capability list for discuss-capability workflow |
| `init discuss-feature` | `cmdInitDiscussFeature` | none | Capability+feature tree for discuss-feature workflow |
| `init plan-feature <cap> <feat>` | `cmdInitPlanFeature` | capSlug, featSlug | Plan workflow context for a specific feature |
| `init execute-feature <cap> <feat>` | `cmdInitExecuteFeature` | capSlug, featSlug | Execute workflow context for a specific feature |
| `init feature-op <cap> <feat> [op]` | `cmdInitFeatureOp` | capSlug, featSlug, op? | General feature operation context |
| `init feature-progress` | `cmdInitFeatureProgress` | none | Capability/feature progress (v2 model) |
| `init phase-op` | (error) | - | DELETED — v1 command |
| `init review-phase` | (error) | - | DELETED — v1 command |
| `init doc-phase` | (error) | - | DELETED — v1 command |

**Note on `init execute-phase`:** Still live. Uses v1 phase model (`findPhaseInternal`, `getRoadmapPhaseInternal`). Milestone/phase/plan-based. Not used by any surviving v2 command.

---

## Gap Analysis: New-Project Flow

### What Currently Happens
- PROJECT.md created
- `capability-create` called per capability (creates CAPABILITY.md stubs)
- `.documentation/` seeded (architecture.md, domain.md, mapping.md)
- `init-state.json` cleaned up

### What Is Missing Per CONTEXT.md

| Gap | Current | Required |
|-----|---------|----------|
| Capabilities Q&A | No — capabilities derived silently from Q&A context | Explicit Capabilities Q&A step: "all potential capabilities at high level" |
| STATE.md creation | **NOT created** during init | Created during init (B2 fix) |
| ROADMAP.md creation | **NOT created** during init | Created during init (B2 fix) |
| Focus group concept | Does not exist | ROADMAP.md bootstrapped with empty focus group scaffold |
| Completion message | "Run /gsd:new to set up requirements and roadmap" | No longer correct — roadmap IS created during init |
| `init-state.json` section list | `["goals","tech_stack","architecture","project_md","capability_map","documentation"]` | Needs `"state_md"` and `"roadmap_md"` sections added |

### Capability Q&A Gap (New-Project)

CONTEXT.md says: "New project flow: Project Q&A (goals, tech stack, architecture, brand/style) -> scaffolding -> Capabilities Q&A (all potential capabilities at high level) -> .planning/ with capabilities list"

Current workflow derives capabilities from Q&A context without an explicit capabilities discussion step. The init workflow needs an intermediate step 3e.0 before writing CAPABILITY.md files:

```
3e.0. Capabilities Q&A
      -> Present inferred capabilities from Q&A
      -> User confirms, adds, removes, reorders
      -> Then capability-create for confirmed list
```

---

## Gap Analysis: Brownfield (Existing-Project) Flow

### What Currently Happens
- 6-dimension parallel scan via gather-synthesize
- User validates 6 independent sections
- Gap fill (domain, debt, intent, direction)
- PROJECT.md written from scan findings
- Capabilities derived from validated scan
- `.documentation/` seeded from scan findings

### What Is Missing Per CONTEXT.md

| Gap | Current | Required |
|-----|---------|----------|
| Capabilities + features suggested from scan | Capabilities only (no features) | Scan must suggest both capabilities AND features |
| Abbreviated Q&A on scan findings | Current validation is 6 sections — close but called "validation" not "abbreviated Q&A" | Rename/refocus: confirm/correct findings + add goals/standards (not just tech sections) |
| User confirms capabilities + features | Missing — capabilities are just written | Explicit confirmation step for cap+feature map |
| Auto-generate `.documentation/` module+flow docs | Missing — only architecture/domain/mapping | Full capability flow/module docs generated from scan |
| User confirms documentation | Missing — docs written without confirmation | Show generated docs, user confirms before write |
| STATE.md creation | **NOT created** | Created during init (B2 fix) |
| ROADMAP.md creation | **NOT created** | Created during init (B2 fix) |
| Brownfield lens auto-select | Not present | `/gsd:init` on brownfield should note that "enhance" lens is the default for future work |

### Biggest Delta: Feature Discovery

The existing flow stops at capabilities. Brownfield needs:
1. Scan infers features within each capability (existing subsystems/entry points become features)
2. Suggest the feature map to user
3. User confirms/corrects
4. Feature stubs created (FEATURE.md per confirmed feature)
5. `.documentation/` extended with per-capability module docs and flow docs

This is net-new work — no existing code handles it.

### Biggest Delta: Doc Generation

Current brownfield doc seeding writes stub files. CONTEXT.md requires:
- Architecture docs from scan (current: done)
- Domain docs from gap fill (current: done)
- Mapping docs from scan (current: done)
- **Capability-specific module docs** (new: what the module owns, its domain model)
- **Capability-specific flow docs** (new: data flow through the capability)

These require a doc generation pass after the cap+feature map is confirmed.

---

## STATE.md v2 Format Proposal

### Current Format (template/state.md)

```markdown
# Project State

## Project Reference
See: .planning/PROJECT.md
Core value: [one-liner]
Current focus: [phase name]   <- v1 concept

## Current Position
Feature: X of Y
Plan: A of B
Status: [state]
Last activity: [date] — [what]
Progress: [bar]

## Performance Metrics
[velocity table]

## Accumulated Context
### Decisions
[list]
### Blockers/Concerns
[list]

## Session Continuity
Last session: [date]
Stopped at: [description]
Resume file: [path or "None"]
```

**Problems with current format:**
- "Current focus" is singular — can't handle multiple active focus groups
- No focus group tracking at all
- Performance metrics are phase-based (v1 model)
- No active capability / active feature per focus group
- No current plan path per focus group

### v2 Format (Proposed)

```markdown
# Project State

## Project Reference

See: .planning/PROJECT.md (updated [date])
**Core value:** [one-liner from PROJECT.md]

## Active Focus Groups

### Focus: [group-name]
**Goal:** [what this sprint delivers]
**Active capability:** [cap-slug] / [feat-slug]
**Current plan:** [path to active PLAN.md or "none"]
**Status:** [In progress / Blocked / Complete]

### Focus: [group-name-2]
**Goal:** [parallel workstream goal]
**Active capability:** [cap-slug] / [feat-slug]
**Current plan:** [path or "none"]
**Status:** [In progress]

## Key Decisions

[3-5 recent decisions affecting active work]
- [cap/feat]: [decision summary]

## Blockers

- [cap/feat]: [blocker description]

## Session Continuity

Last session: [YYYY-MM-DD]
Last action: [description of last completed thing]
Resume: pick up from [focus-group-name] -> [cap/feat]
```

**Key changes from v1:**
1. `## Active Focus Groups` replaces `## Current Position` — supports multiple parallel focus groups
2. Each focus group tracks its own active cap/feat + plan
3. `## Performance Metrics` section dropped — too noisy, phase-model specific
4. `## Key Decisions` replaces `## Accumulated Context / Decisions` — shorter, scoped to active work
5. `## Blockers` replaces `## Accumulated Context / Blockers/Concerns` — same content, flatter
6. Session continuity points to a focus group, not a phase/plan number

**Size constraint unchanged:** Under 100 lines. Multiple focus groups means more content; enforce max 2 decisions per focus group in the section.

---

## ROADMAP.md v2 Format Proposal

### Current Format (template/roadmap.md)

Phase-based: `Phase 1 -> Phase N`, each with goal, depends-on, requirements, success criteria (2-5 items), plan list. Heavy project management structure.

**Problems:**
- Phases are a v1 concept — v2 has capabilities/features
- Success criteria live in ROADMAP.md — CONTEXT.md says they should live in FEATURE.md
- Requirement mappings in ROADMAP.md — CONTEXT.md says these go in FEATURE.md
- No focus group concept
- No dependency line per item (only phase-level depends-on)

### v2 Format (Proposed)

Match the exact example from CONTEXT.md exactly, but document the full template:

```markdown
# Roadmap: [Project Name]

## Overview

[One paragraph: what the project is building, current state]

## Active Focus Groups

### Focus: [group-name]

**Goal:** [What this sprint delivers — one sentence]

**Priority Order:**
1. [cap]/[feat] -> depends: none
2. [cap]/[feat] -> depends: [cap]/[feat-above]
3. [cap]/[feat] -> depends: [cap]/[feat-above]

**Status:**
- [x] [cap]/[feat] (complete)
- [ ] [cap]/[feat] (in progress)
- [ ] [cap]/[feat] (not started)

---

### Focus: [group-name-2]

[... same pattern ...]

## Completed Focus Groups

### Focus: [completed-group] (done [date])

**Goal:** [what it delivered]

**Items:**
- [x] [cap]/[feat]
- [x] [cap]/[feat]
```

**Key changes from v1:**
1. `## Active Focus Groups` replaces `## Phases` and `## Phase Details`
2. Per-item dependency line (`-> depends:`) replaces phase-level `**Depends on**`
3. No success criteria (those live in FEATURE.md)
4. No requirement mappings (those live in FEATURE.md)
5. No plan lists (plan progression tracked in feature directory, visible via `/gsd:progress`)
6. Completed focus groups collapse to simple checklist — no phase detail preserved in ROADMAP.md
7. `## Progress` table dropped — `/gsd:progress` command renders this dynamically

---

## Convergence Checklist

Both new-project and brownfield flows MUST produce:

| Artifact | Path | New-Project | Brownfield |
|----------|------|-------------|------------|
| Project definition | `.planning/PROJECT.md` | From Q&A | From scan + validation |
| Capabilities | `.planning/capabilities/{cap}/CAPABILITY.md` | One per confirmed capability | One per validated module/area |
| Feature stubs | `.planning/capabilities/{cap}/features/{feat}/FEATURE.md` | NOT created (new projects have no features yet) | One per inferred feature from scan |
| Planning config | `.planning/config.json` | Already exists or copied from template | Same |
| State tracker | `.planning/STATE.md` | **MISSING — must add** | **MISSING — must add** |
| Roadmap | `.planning/ROADMAP.md` | **MISSING — must add** | **MISSING — must add** |
| Architecture doc | `.documentation/architecture.md` | Stub from Q&A | From scan |
| Domain doc | `.documentation/domain.md` | Stub from Q&A | From gap fill |
| Mapping doc | `.documentation/mapping.md` | Empty (no code yet) | From scan |
| Capability docs | `.documentation/capabilities/` | Empty directories | Module + flow docs per capability |
| Decision records | `.documentation/decisions/` | From Q&A decisions | From intent questions |

**Divergence between paths (by design):**
- New projects: FEATURE.md stubs NOT created (no features until `/gsd:new` runs)
- Brownfield: FEATURE.md stubs created from scan (features already exist in code)
- New projects: `.documentation/capabilities/` is empty stubs
- Brownfield: `.documentation/capabilities/` has module + flow docs (after user confirmation)

---

## Templates: Existing vs Needed

### Existing Templates

| Template | Path | v2-Ready? | Notes |
|----------|------|-----------|-------|
| `capability.md` | `templates/capability.md` | Partial | Has Domain Model, Invariants, Boundaries, Architecture Spine, Dependencies, Features table, Decisions. Does NOT have: priority order field, "what + why" framing per CONTEXT.md. |
| `feature.md` | `templates/feature.md` | YES | Has Trace Table, EU/FN/TC requirements, Decisions. Matches v2 spec. |
| `state.md` | `templates/state.md` | NO | v1 format. Phase-based Current Position, no focus groups, no active cap/feat. Needs full replacement. |
| `roadmap.md` | `templates/roadmap.md` | NO | v1 format. Phase + milestone structure. Needs full replacement. |
| `project.md` | `templates/project.md` | Unknown — not read | Need to verify it doesn't reference phases. |
| `discovery-brief.md` | `templates/discovery-brief.md` | Unknown | Used by framing-discovery workflow. |
| `context.md` | `templates/context.md` | Unknown | Used by framing workflow for CONTEXT.md output. |

### Templates Needed (New or Updated)

| Template | Status | What It Needs |
|----------|--------|---------------|
| `state.md` | **Rewrite** | v2 format: focus groups, active cap/feat, no performance metrics section |
| `roadmap.md` | **Rewrite** | v2 format: focus groups with ordered items + deps + status checkboxes |
| `capability.md` | **Update** | Add explicit "what + why" framing, add priority field for feature ordering |

No new template files needed — same 3 templates, 2 full rewrites + 1 update.

---

## STATE.md + ROADMAP.md: Where They Must Be Created

Currently, `init-project.md` Step 5 (Completion) does NOT write STATE.md or ROADMAP.md. The workflow ends with the documentation commit and cleanup.

**Where to insert (new-project flow):**

```
After 3f (documentation seeded):

3g. Write ROADMAP.md
    -> Write .planning/ROADMAP.md using v2 template
    -> Empty focus groups section (no focus yet — user hasn't run /gsd:new)
    -> Commit "docs: initialize roadmap"
    -> update init-state.json + ["roadmap_md"]

3h. Write STATE.md
    -> Write .planning/STATE.md using v2 template
    -> Empty focus groups (no active work yet)
    -> Project reference points to PROJECT.md
    -> Commit "docs: initialize state"
    -> update init-state.json + ["state_md"]
```

**Where to insert (brownfield flow):**

```
After 4f (documentation seeded):

4g. Write ROADMAP.md
    -> Write .planning/ROADMAP.md using v2 template
    -> Pre-populate one focus group from inferred capabilities (user can refine)
    -> Commit "docs: initialize roadmap from codebase scan"
    -> update init-state.json + ["roadmap_md"]

4h. Write STATE.md
    -> Write .planning/STATE.md using v2 template
    -> Empty focus groups (no active work started yet)
    -> Project reference points to PROJECT.md
    -> Commit "docs: initialize state"
    -> update init-state.json + ["state_md"]
```

**Section list update for `init.cjs`:**

`cmdInitProject()` must add `"roadmap_md"` and `"state_md"` to the section arrays:

```js
// Current
const allSections = stateData.mode === 'existing'
  ? ['scan', 'validation', 'gap_fill', 'project_md', 'capability_map', 'documentation']
  : ['goals', 'tech_stack', 'architecture', 'project_md', 'capability_map', 'documentation'];

// Required
const allSections = stateData.mode === 'existing'
  ? ['scan', 'validation', 'gap_fill', 'project_md', 'capability_map', 'documentation', 'roadmap_md', 'state_md']
  : ['goals', 'tech_stack', 'architecture', 'project_md', 'capability_map', 'documentation', 'roadmap_md', 'state_md'];
```

---

## Detection Logic: What Needs to Change

Current detection gap: if `project_exists` is true and no partial run, mode is `"ambiguous"`. This is correct for re-init (already initialized projects). But the detection should also handle:

- `project_exists && !state_exists` -> previously initialized but missing STATE.md -> treat as existing, reconstruct
- `project_exists && !roadmap_exists` -> same gap

These are edge cases. The `resume-work` workflow already handles STATE.md reconstruction. No change needed in `cmdInitProject()` detection logic for the primary flow.

The primary detection logic is correct as-is. Only the workflow (init-project.md) needs to add the STATE.md + ROADMAP.md creation steps.

---

## Completion Message Fix

Current completion message in Step 5:

```
Next: Run /gsd:new to set up requirements and roadmap
```

After this change, ROADMAP.md is created during init. The message should change to:

```
Next: Run /gsd:new to start planning your first capability
      (or /gsd:discuss-capability to explore a specific capability first)
```

---

## Summary: What Changes, What Stays

### init-project.md workflow changes
1. Add Capabilities Q&A step (3e.0) before writing capability files — explicit confirmation
2. Add ROADMAP.md creation step (3g/4g) after documentation
3. Add STATE.md creation step (3h/4h) after roadmap
4. Brownfield: add feature discovery step (4e.5) — scan infers features, user confirms
5. Brownfield: add capability+feature doc generation step (4f.5) — module + flow docs per cap
6. Brownfield: add doc confirmation step (4f.6) — show generated docs, user confirms before write
7. Update completion message (Step 5)

### init.cjs changes
1. `cmdInitProject()`: add `"roadmap_md"` and `"state_md"` to section arrays

### Template changes
1. `templates/state.md`: full rewrite to v2 format (focus groups)
2. `templates/roadmap.md`: full rewrite to v2 format (focus groups, no phase structure)
3. `templates/capability.md`: minor update (priority field, "what + why" framing)

### No changes needed
- CLI route names and signatures stay the same
- Detection logic (`cmdInitProject`) stays the same
- `capability-create` CLI route works correctly for init use
- `.documentation/` structure unchanged
- `gather-synthesize.md` pattern unchanged for brownfield scan
- Partial-run resume mechanism works as-is (just needs new section names)
