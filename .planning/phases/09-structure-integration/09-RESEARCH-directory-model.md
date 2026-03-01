# Phase 9 Research: Directory Model

**Researched:** 2026-03-01
**Scope:** DIR-01, DIR-02, DIR-03 (directory structure changes)
**Confidence:** HIGH -- based on direct source code reading

## Current State

### What `init.cjs` currently provides

`init.cjs` does NOT scaffold directories directly. It is a **detection and context-gathering** module. Each `cmdInit*` function reads the filesystem and returns JSON describing what exists. The actual directory creation happens in:

1. **`init-project.md` workflow** (slash command `/gsd:init`) -- creates directories via inline `mkdir -p` and `gsd-tools.cjs` commands
2. **`capability.cjs`** (`capability-create`) -- creates `.planning/capabilities/{slug}/features/`
3. **`feature.cjs`** (`feature-create`) -- creates `.planning/capabilities/{slug}/features/{feat-slug}/`
4. **`template.cjs`** (`cmdTemplateFill`) -- creates capability/feature dirs as side effect of fill
5. **`config.cjs`** (`cmdConfigEnsureSection`) -- creates `.planning/` dir
6. **`commands.cjs`** (`cmdScaffold` phase-dir) -- creates `.planning/phases/{NN-name}/`
7. **`phase.cjs`** (`cmdPhaseAdd`, `cmdPhaseInsert`) -- creates `.planning/phases/{NN-name}/`

### Current directory tree scaffolded by `/gsd:init`

Via `init-project.md` workflow:

```
.planning/
  PROJECT.md                    <- Written by workflow
  init-state.json               <- Temporary, deleted on completion
  init-scan-draft.md            <- Temporary (existing-project mode only)
  capabilities/
    {slug}/
      CAPABILITY.md             <- Created by capability-create CLI
      features/                 <- Created by capability-create CLI
.documentation/
  architecture.md               <- Written by workflow
  domain.md                     <- Written by workflow
  mapping.md                    <- Written by workflow
  capabilities/                 <- mkdir -p in workflow
  decisions/                    <- mkdir -p in workflow
```

**NOT created by /init (created later by other commands):**
- `.planning/config.json` -- created by `config-ensure-section` or manually
- `.planning/STATE.md` -- created by other workflows
- `.planning/REQUIREMENTS.md` -- created by `/gsd:new-project`
- `.planning/ROADMAP.md` -- created by `/gsd:new-project`
- `.planning/phases/` -- created by phase commands (v1 model)
- `.planning/codebase/` -- created by `/gsd:map-codebase`

### What `cmdInitProject` detects (the JSON output)

```javascript
{
  detected_mode,        // 'new' | 'existing' | 'ambiguous'
  planning_exists,      // bool
  code_exists,          // bool
  project_exists,       // bool (.planning/PROJECT.md)
  partial_run,          // { has_partial, completed_sections, next_section, mode }
  project_context,      // first 2000 chars of PROJECT.md if exists
  commit_docs,          // from config
  has_git,              // bool
}
```

## v2 Target State

Based on CONTEXT.md decisions + Phase 1 research (01-RESEARCH.md):

### Target directory tree for new projects

```
.planning/
  PROJECT.md
  STATE.md                      <- v2 fields (see below)
  REQUIREMENTS.md
  config.json
  capabilities/                 <- NO phases/ directory
    {slug}/
      CAPABILITY.md
      RESEARCH.md
      PLAN.md
      features/
        {slug}/
          FEATURE.md
          RESEARCH.md
          PLAN.md
          REVIEW.md
          DECISIONS.md
  codebase/                     <- Optional, brownfield only
.documentation/
  architecture.md
  domain.md
  mapping.md
  capabilities/                 <- Mirrors .planning/capabilities/
  decisions/                    <- ADRs
```

Key change: **No `phases/` directory** for new projects (DIR-01).

### `.documentation/` structure (DIR-02)

Already defined in `init-project.md` workflow and confirmed by CONTEXT.md:

```
.documentation/
  architecture.md               <- Already created by /init
  domain.md                     <- Already created by /init
  mapping.md                    <- Already created by /init
  capabilities/                 <- Already created by /init
  decisions/                    <- Already created by /init
```

**Finding:** `.documentation/` is already scaffolded correctly by the init-project workflow. DIR-02 is functionally complete in the workflow -- but `cmdInitProject` in init.cjs doesn't check for `.documentation/` existence. The `cmdInitDiscussCapability` function DOES check for `.documentation/capabilities/` though.

## Gap Analysis

### 1. `init.cjs` changes needed

**Functions that reference `phases/` directory (must gain capability/feature awareness):**

| Function | Current behavior | Change needed |
|----------|-----------------|---------------|
| `cmdInitExecutePhase` | Calls `findPhaseInternal` (phases/ only) | Needs equivalent for capability/feature work units |
| `cmdInitPlanPhase` | Calls `findPhaseInternal`, looks for CONTEXT/RESEARCH in phase dir | Needs to find these in capability/feature dirs |
| `cmdInitPhaseOp` | Generic phase operation, same pattern | Needs capability/feature equivalent |
| `cmdInitMilestoneOp` | Counts phases in `phases/` dir | Needs to count capabilities/features instead |
| `cmdInitProgress` | Iterates `phases/` dir for status | Needs to iterate capabilities/features |
| `cmdInitReviewPhase` | Looks for capabilities in `.planning/capabilities/` -- already v2 aware! | Already partially migrated |
| `cmdInitDocPhase` | Looks for capabilities in `.planning/capabilities/` -- already v2 aware! | Already partially migrated |
| `cmdInitNewProject` | References `.planning/codebase` -- no phases | No change needed |
| `cmdInitProject` | Detection only, no phase references | No change needed |
| `cmdInitFramingDiscovery` | Already uses capability resolution | No change needed |
| `cmdInitDiscussCapability` | Already v2 model | No change needed |
| `cmdInitDiscussFeature` | Already v2 model | No change needed |
| `cmdInitQuick` | Uses `.planning/quick/` -- independent | No change needed |
| `cmdInitResume` | Reads STATE.md only | Needs STATE.md field updates |
| `cmdInitVerifyWork` | Calls `findPhaseInternal` | Needs capability/feature equivalent |
| `cmdInitNewMilestone` | References roadmap + milestone | TBD -- milestone model may change |

**Key observation:** 6 functions are already v2-aware (review, doc, framing, discuss-cap, discuss-feat, project). 7 functions need migration from phase-based to capability/feature-based logic.

### 2. `gsd-tools.cjs` path resolution changes

**Phase-based commands in CLI router that need evaluation:**

| CLI command | Current module | Phase 9 action |
|-------------|---------------|----------------|
| `find-phase` | phase.cjs | Keep for backward compat during build, mark deprecated |
| `phase next-decimal` | phase.cjs | Likely remove (v1 only) |
| `phase add` | phase.cjs | Likely remove (v1 only) |
| `phase insert` | phase.cjs | Likely remove (v1 only) |
| `phase remove` | phase.cjs | Likely remove (v1 only) |
| `phase complete` | phase.cjs | Likely remove (v1 only) |
| `phases list` | phase.cjs | Likely remove (v1 only) |
| `phase-plan-index` | phase.cjs | Evaluate -- may need capability/feature equivalent |
| `roadmap get-phase` | roadmap.cjs | Evaluate -- roadmap format may change |
| `roadmap analyze` | roadmap.cjs | Evaluate -- depends on phases/ |
| `roadmap update-plan-progress` | roadmap.cjs | Evaluate -- depends on phases/ |
| `milestone complete` | milestone.cjs | Evaluate -- milestone model unclear for v2 |
| `scaffold phase-dir` | commands.cjs | Remove or replace with capability/feature scaffold |
| `scaffold context` | commands.cjs | Evaluate -- CONTEXT.md still used in v2? |
| `init execute-phase` | init.cjs | Needs capability/feature variant |
| `init plan-phase` | init.cjs | Needs capability/feature variant |
| `init phase-op` | init.cjs | Needs capability/feature variant |
| `init milestone-op` | init.cjs | Evaluate |
| `init verify-work` | init.cjs | Needs capability/feature variant |
| `init progress` | init.cjs | Needs capability/feature variant |

**Already v2 (no changes):**

| CLI command | Module |
|-------------|--------|
| `capability-create` | capability.cjs |
| `capability-list` | capability.cjs |
| `capability-status` | capability.cjs |
| `feature-create` | feature.cjs |
| `feature-list` | feature.cjs |
| `feature-status` | feature.cjs |
| `init project` | init.cjs |
| `init framing-discovery` | init.cjs |
| `init discuss-capability` | init.cjs |
| `init discuss-feature` | init.cjs |
| `init review-phase` | init.cjs (already looks in capabilities/) |
| `init doc-phase` | init.cjs (already looks in capabilities/) |

### 3. `core.cjs` changes needed

| Function | Status | Change |
|----------|--------|--------|
| `findPhaseInternal` | v1 only | Keep but mark deprecated; used by surviving v1 code during build |
| `searchPhaseInDir` | v1 only | Same |
| `findCapabilityInternal` | v2 ready | Already exists and works |
| `findFeatureInternal` | v2 ready | Already exists and works |
| `getRoadmapPhaseInternal` | v1 only | Evaluate -- depends on ROADMAP.md format |
| `getMilestoneInfo` | v1 only | Evaluate -- depends on ROADMAP.md format |

### 4. `state.cjs` changes needed

`buildStateFrontmatter()` already extracts `current_capability` and `current_feature` from STATE.md body. But `cmdStateUpdateProgress()` counts from `phases/` directory -- needs capability/feature counting.

`cmdStateAdvancePlan()` uses `Current Plan` and `Total Plans in Phase` fields -- needs v2 equivalent.

`cmdStateSnapshot()` extracts phase-centric fields -- needs capability/feature equivalents.

## STATE.md Field Changes

### Current fields (from actual STATE.md)

**Frontmatter (YAML):**
```yaml
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T12:37:43.237Z"
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 27
  completed_plans: 27
```

**Body fields (extracted by `buildStateFrontmatter`):**
- `Current Phase` / `Current Phase Name` / `Total Phases`
- `Current Plan` / `Total Plans in Phase`
- `Status`
- `Progress`
- `Last Activity`
- `Stopped At` / `Paused At`
- `Current capability` -- already exists in extraction logic!
- `Current feature` -- already exists in extraction logic!

### v2 Target fields (from CONTEXT.md)

STATE.md should track:
1. **Active capability** -- already partially supported (`Current capability`)
2. **Active feature** -- already partially supported (`Current feature`)
3. **Current plan within feature** -- replaces `Current Plan` / `Total Plans in Phase`
4. **Decisions from discovery** -- `Decisions` section already exists
5. **Blockers** -- `Blockers/Concerns` section already exists
6. **Last agent summary** -- NEW field
7. **Pipeline position** -- NEW field (which stage: research/plan/execute/review/doc)

### Mapping: Current -> v2

| Current field | v2 field | Action |
|--------------|----------|--------|
| `Current Phase` | Remove | Replace with capability/feature |
| `Current Phase Name` | Remove | Replace with capability/feature |
| `Total Phases` | Remove | Not meaningful in v2 |
| `Current Plan` | `Current plan` | Keep concept, scope to feature |
| `Total Plans in Phase` | `Total plans in feature` | Rename |
| `Status` | `Status` | Keep, update valid values |
| `Progress` | `Progress` | Recalculate from capabilities/features |
| `Last Activity` | `Last activity` | Keep |
| `Stopped At` | `Stopped at` | Keep |
| `Paused At` | `Paused at` | Keep |
| `Current capability` | `Active capability` | Rename for consistency |
| `Current feature` | `Active feature` | Rename for consistency |
| (new) | `Last agent summary` | Add |
| (new) | `Pipeline position` | Add (research/plan/execute/review/doc) |
| `milestone` | Evaluate | May keep for versioning |

### `buildStateFrontmatter()` impact

This function already extracts `currentCapability` and `currentFeature`. Changes needed:
- Remove phase-related extractions
- Add `Last agent summary` and `Pipeline position` extraction
- Update progress calculation to iterate capabilities/features instead of phases/
- Update frontmatter output structure

## gsd-tools.cjs Path Resolution

### Current phase-based resolution flow

```
User provides phase number (e.g., "9")
  -> normalizePhaseName("9") -> "09"
  -> searchPhaseInDir(".planning/phases", "09")
  -> Finds "09-structure-integration" directory
  -> Returns { directory, phase_number, plans[], summaries[], ... }
```

### What needs capability/feature awareness

The v2 resolution flow for plan/execute/review operations:

```
User provides capability slug + optional feature slug
  -> findCapabilityInternal(cwd, capSlug)
  -> findFeatureInternal(cwd, capSlug, featSlug)
  -> Returns { directory, slug, capability_path/feature_path }
```

**This already works.** The `findCapabilityInternal` and `findFeatureInternal` functions in core.cjs are complete and used by capability.cjs, feature.cjs, and init.cjs.

**What's missing:** The init functions that drive plan/execute/review workflows (`cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitPhaseOp`) don't have capability/feature equivalents. They need new `cmdInitExecuteFeature`, `cmdInitPlanFeature`, `cmdInitFeatureOp` (or equivalent) functions that:

1. Resolve capability + feature via existing core.cjs helpers
2. Find CONTEXT.md, RESEARCH.md, PLAN.md in the feature directory
3. Count plans/summaries in the feature directory
4. Return the same shape of JSON that workflows expect

### Files that hardcode `.planning/phases/` path

Beyond init.cjs (covered above), these files reference the phases directory:

| File | Usage | Phase 9 action |
|------|-------|----------------|
| `state.cjs` `cmdStateUpdateProgress` | Counts plans in phases/ | Update to count in capabilities/ |
| `state.cjs` `buildStateFrontmatter` | Same counting logic | Update |
| `commands.cjs` `cmdHistoryDigest` | Aggregates summaries from phases/ | Update or deprecate |
| `commands.cjs` `cmdScaffold` phase-dir | Creates phase directories | Remove or replace |
| `phase.cjs` (entire module) | All phase CRUD operations | Mark deprecated, keep for build |
| `roadmap.cjs` (entire module) | Roadmap-phase sync | Evaluate for v2 |
| `verify.cjs` `cmdValidateConsistency` | Checks phase numbering | Update for v2 |
| `milestone.cjs` | Archives phases | Evaluate for v2 |

## Open Questions

1. **Roadmap model in v2:** ROADMAP.md currently organizes work by phases. In v2 with capabilities/features, does the roadmap still exist? If so, what does it look like? The CONTEXT.md doesn't address this directly.

2. **Milestone model in v2:** `getMilestoneInfo` reads ROADMAP.md. If roadmap changes or goes away, how are milestones tracked? The CONTEXT.md mentions session handoff but not milestone lifecycle.

3. **Phase CLI commands -- remove or keep?** CONTEXT.md says "evaluate each -- flag as standalone, merge into v2 feature workflow, or delete." The planner needs to make individual decisions for: `phase add`, `phase remove`, `phase complete`, `phase insert`, `phase next-decimal`, `phases list`, `phase-plan-index`. CLN-03 in Phase 10 covers the full gsd-tools audit, but DIR-03 says "all v2 path references use capability/feature model" which implies phase commands should at minimum be flagged.

4. **Bootstrap trap:** The project is currently running on v1 (phases). Changing init.cjs to not create phases/ would break the ability to plan/execute remaining phases (10-12). The planner must sequence this carefully -- likely new v2 functions added alongside existing v1 functions, with v1 removal deferred.

5. **`init execute-phase` vs `init execute-feature`:** Should this be a new function or a modification of the existing one? Given the bootstrap trap, likely needs to be a new parallel function.

6. **Feature directory artifact names:** Phase 1 research shows `FEATURE.md, RESEARCH.md, PLAN.md, REVIEW.md, DECISIONS.md` in feature dirs. But current `findFeatureInternal` only checks for `FEATURE.md`. The init functions for plan/execute need to also detect RESEARCH.md, PLAN.md, etc. -- same pattern as `cmdInitPlanPhase` does for phase dirs.

---

*Phase: 09-structure-integration*
*Research completed: 2026-03-01*
