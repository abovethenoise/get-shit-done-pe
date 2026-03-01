# Reference Doc Audit Findings

**Audited:** 2026-03-01
**Requirement:** CLN-05
**Scope:** All 16 files in `get-shit-done/references/`

---

## 1. Reference Docs Inventory

| # | File | Purpose | v2 Callers | v2 Accurate? | Verdict |
|---|------|---------|------------|--------------|---------|
| 1 | `pipeline-invariants.md` | 10 pipeline behaviors checklist | 0 direct @file refs, but actively used as modification checklist per CONTEXT.md | Mostly -- see spot-check | **Keep** |
| 2 | `questioning.md` | Q&A guide for project init discovery | `commands/gsd/init.md`, `get-shit-done/templates/codebase/structure.md` | Yes | **Keep** |
| 3 | `model-profiles.md` | Model assignment per agent/role | `get-shit-done/workflows/research-workflow.md` | Partial -- v1 table stale, v2 section needs update | **Keep + Update** |
| 4 | `model-profile-resolution.md` | How orchestrators resolve model | `get-shit-done/workflows/plan-phase.md` | Partial -- references v1 lookup table | **Keep + Update** |
| 5 | `ui-brand.md` | Visual patterns for GSD output | 13 callers across commands/workflows | Yes | **Keep** |
| 6 | `checkpoints.md` | Checkpoint types and automation reference | 5 callers: executor, execute-phase, execute-plan, plan-phase, phase-prompt template | Yes | **Keep** |
| 7 | `framing-lenses.md` | 4 discovery lens definitions | 7 callers: 4 framing commands, init.cjs, framing-discovery, framing-pipeline | Yes | **Keep** |
| 8 | `escalation-protocol.md` | 3-tier escalation for pipeline | 1 caller: `framing-pipeline.md` | Yes | **Keep** |
| 9 | `git-integration.md` | Git commit strategy and formats | 1 caller: `execute-plan.md` | Yes | **Keep** |
| 10 | `continuation-format.md` | "Next Up" block format after completions | 1 caller: `resume-work.md` | Partially -- uses v1 phase language throughout | **Keep + Update** |
| 11 | `verification-patterns.md` | Stub detection and wiring verification | 1 caller: `verify-phase.md` | Yes (framework-agnostic patterns) | **Keep** |
| 12 | `phase-argument-parsing.md` | Parse/normalize phase number args | 1 caller: `research-phase.md` | Yes (utility still used) | **Keep** |
| 13 | `planning-config.md` | config.json schema and behavior | 0 v2 callers | Content is accurate but unreferenced | **Delete** |
| 14 | `decimal-phase-calculation.md` | Calculate next decimal phase number | 0 v2 callers | v1 concept (decimal phases) | **Delete** |
| 15 | `git-planning-commit.md` | Commit planning artifacts via CLI | 0 v2 callers | Accurate but unreferenced; git-integration.md covers commit patterns | **Delete** |

**Total: 16 files. Keep: 12. Delete: 3. Update: 3 (model-profiles, model-profile-resolution, continuation-format).**

---

## 2. Docs to Delete

| File | Rationale |
|------|-----------|
| `planning-config.md` | Zero v2 callers. Config schema is documented in core.cjs `loadConfig()` defaults. Any workflow needing config reads it via CLI, not this reference. |
| `decimal-phase-calculation.md` | Zero v2 callers. Decimal phase insertion is a v1-only concept. v2 uses capability/feature structure, not numbered phases. |
| `git-planning-commit.md` | Zero v2 callers. The one caller that existed was removed. `git-integration.md` (actively referenced by execute-plan.md) covers all commit patterns. Redundant. |

---

## 3. Docs to Update

### 3a. model-profiles.md

**Current state:** Contains both a v1 per-agent profile table (10 agents x 3 profiles) and a v2 role-based section. The v1 table lists agents that no longer exist in v2 (gsd-roadmapper, gsd-codebase-mapper, gsd-debugger, gsd-integration-checker). The v2 section uses "Phase 3" / "Phase 4" / "Phase 5" language.

**Changes needed:**
- Remove or collapse the v1 `MODEL_PROFILES` table -- it only serves backward compat during bootstrap (which is done)
- Update "v2 Agent Assignments" table to drop phase references, use capability/feature language
- Align the 4-tier standard from CONTEXT.md: Main/orchestrator -> Opus, Research/execution -> Sonnet, Judge/review -> Opus (inherit), Quick tasks -> Haiku
- Remove references to agents that no longer exist (gsd-roadmapper, gsd-codebase-mapper, gsd-debugger, gsd-integration-checker)
- Update "Coexistence" section: v1 table removal is now safe (bootstrap complete)
- See Section 4 for detailed before/after

### 3b. model-profile-resolution.md

**Current state:** References the v1 lookup table and bash grep resolution. Points to model-profiles.md for the table.

**Changes needed:**
- Replace v1 bash-grep resolution pattern with v2 `resolveModelFromRole()` pattern
- Update the lookup description: v2 agents use `role_type` frontmatter, not per-agent table lookup
- Keep the pass-through note about `"inherit"` for Opus (still accurate)
- Update "Usage" section to describe v2 flow: read agent frontmatter -> check role_type -> map to model

### 3c. continuation-format.md

**Current state:** All examples use v1 phase language: `/gsd:execute-phase 2`, `/gsd:plan-phase 3`, "Phase 2: Authentication", milestone-level completions.

**Changes needed:**
- Update examples to use v2 capability/feature language
- Replace phase-specific commands with v2 equivalents
- Update "Pulling Context" section to reference capability/feature structure instead of ROADMAP.md phases
- Keep the core format structure (the `## Next Up` pattern is still valid)

---

## 4. Model Profile Update Spec

### 4a. model-profiles.md: Before/After

**BEFORE -- v1 Profile Table (lines 7-19):**
```
| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| gsd-planner | opus | opus | sonnet |
| gsd-roadmapper | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-project-researcher | opus | sonnet | haiku |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-debugger | opus | sonnet | sonnet |
| gsd-codebase-mapper | sonnet | haiku | haiku |
| gsd-verifier | sonnet | sonnet | haiku |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-integration-checker | sonnet | sonnet | haiku |
```

**AFTER -- Replace with v2 role-based mapping:**
```
## Model Assignment

v2 uses role-based resolution. Agents declare `role_type` in YAML frontmatter.

| Role | Model | Rationale |
|------|-------|-----------|
| **Main / Orchestrator** | Opus | Architecture decisions, goal decomposition, user interaction |
| **Research / Execution** | Sonnet | Follows explicit instructions, gathers information, implements plans |
| **Judge / Review** | Opus (inherit) | Validates, synthesizes, reviews -- needs full reasoning power |
| **Quick tasks, no logic** | Haiku | Read-only exploration, structured output extraction |
```

**BEFORE -- v2 Agent Assignments (lines 69-80):**
```
| Agent | Role Type | Model |
| 6x research gatherers | executor | Sonnet |
| Research synthesizer | judge | Opus |
| Planner (Phase 3) | executor | Sonnet |
| Plan validator (Phase 3) | judge | Opus |
| 4x reviewers (Phase 4) | judge | Opus |
| Review synthesizer (Phase 4) | judge | Opus |
| Documentation writer (Phase 5) | executor | Sonnet |
```

**AFTER -- Drop phase references:**
```
| Agent | Role Type | Model |
| 6x research gatherers | executor | Sonnet |
| Research synthesizer | judge | Opus (inherit) |
| Planner | executor | Sonnet |
| Plan validator | judge | Opus (inherit) |
| 4x specialist reviewers | judge | Opus (inherit) |
| Review synthesizer | judge | Opus (inherit) |
| Documentation writer | executor | Sonnet |
```

**BEFORE -- Coexistence section (line 87):**
```
v1 `MODEL_PROFILES` table remains for v1 agents. v2 agents use `role_type`. Both systems coexist during bootstrap. Phase 7 cleanup removes v1 table.
```

**AFTER:**
```
All agents use v2 `role_type` frontmatter for model resolution. The v1 per-agent lookup table in core.cjs is deprecated and will be removed.
```

**Sections to remove entirely:**
- "Profile Philosophy" (quality/balanced/budget) -- v2 doesn't use tiered profiles
- "Per-Agent Overrides" -- v2 uses role_type, not per-agent config
- "Switching Profiles" -- no longer applies
- "Design Rationale" per-agent Q&A -- replace with role-based rationale

**Sections to keep:**
- "Claude Code Constraint" about `inherit` vs `opus` -- still accurate and important
- "Resolution Priority" for `resolveModelFromRole()` -- still accurate

### 4b. core.cjs: Before/After

**BEFORE (lines 18-29):**
```javascript
const MODEL_PROFILES = {
  'gsd-planner':              { quality: 'opus', balanced: 'opus',   budget: 'sonnet' },
  'gsd-roadmapper':           { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'gsd-executor':             { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'gsd-project-researcher':   { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'gsd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'gsd-debugger':             { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'gsd-codebase-mapper':      { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
  'gsd-verifier':             { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'gsd-plan-checker':         { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'gsd-integration-checker':  { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
};
```

**AFTER:**
```javascript
// v1 MODEL_PROFILES table — deprecated. Kept as fallback for any v1 agents
// that lack role_type frontmatter. v2 agents use resolveModelFromRole().
const MODEL_PROFILES = {
  'gsd-planner':              { quality: 'opus', balanced: 'opus',   budget: 'sonnet' },
  'gsd-executor':             { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
};
```

**Rationale:** Keep only agents that might still be called via v1 path. Remove entries for deleted agents (gsd-roadmapper, gsd-codebase-mapper, gsd-debugger, gsd-integration-checker). The `resolveModelFromRole()` function (lines 377-404) is already correct and needs no changes -- it reads role_type from frontmatter and falls through to v1 table only when role_type is absent.

**ROLE_MODEL_MAP (lines 33-36):** No changes needed. Already correct:
```javascript
const ROLE_MODEL_MAP = {
  executor: 'sonnet',
  judge: 'inherit',
};
```

**resolveModelInternal (lines 360-375):** No changes needed. Already correctly maps opus -> inherit and falls back to sonnet for unknown agents.

**resolveModelFromRole (lines 377-404):** No changes needed. Already correctly implements the v2 resolution chain.

**Config fields to consider removing:**
- `model_profile` in loadConfig defaults -- the quality/balanced/budget concept is v1. However, removing it breaks backward compat for any project still using config.json with `model_profile`. **Recommendation: Keep as deprecated fallback, document in model-profiles.md that v2 ignores it.**

---

## 5. Pipeline Invariants Spot-Check

All "Where" field paths verified against filesystem:

| # | Invariant | Path | Exists? | Notes |
|---|-----------|------|---------|-------|
| 1 | Fresh Context Per Executor | `get-shit-done/workflows/execute-phase.md` | YES | |
| 1 | Fresh Context Per Executor | `get-shit-done/workflows/framing-pipeline.md` | YES | |
| 2 | Wave Dependency Analysis | `get-shit-done/workflows/execute-phase.md` | YES | |
| 2 | Wave Dependency Analysis | `get-shit-done/bin/gsd-tools.cjs` | YES | |
| 3 | Plan-Checker Verification | `get-shit-done/workflows/plan-phase.md` | YES | |
| 4 | Atomic Commits Per Task | `get-shit-done/workflows/execute-plan.md` | YES | |
| 4 | Atomic Commits Per Task | `agents/gsd-executor.md` | YES | |
| 5 | Context Loading Via Paths | All workflow `.md` files | YES | |
| 5 | Context Loading Via Paths | `get-shit-done/workflows/execute-phase.md` | YES | |
| 6 | State Progression Via CLI | `get-shit-done/bin/gsd-tools.cjs` | YES | |
| 6 | State Progression Via CLI | `get-shit-done/bin/lib/state.cjs` | YES | |
| 7 | Session Handoff | `get-shit-done/workflows/transition.md` | YES | |
| 7 | Session Handoff | `get-shit-done/templates/state.md` | YES | |
| 8 | Requirement ID Chain | `get-shit-done/workflows/plan-phase.md` | YES | |
| 8 | Requirement ID Chain | `get-shit-done/workflows/execute-plan.md` | YES | |
| 8 | Requirement ID Chain | `get-shit-done/bin/gsd-tools.cjs` | YES | |
| 9 | Summary Frontmatter | `get-shit-done/workflows/execute-plan.md` | YES | |
| 9 | Summary Frontmatter | `get-shit-done/templates/summary.md` | YES | |
| 10 | Spot-Check Executor | `get-shit-done/workflows/execute-phase.md` | YES | |
| 10 | Spot-Check Executor | `agents/gsd-executor.md` | YES | |

**Result: All 20 path references are valid. No stale paths found.**

**Content accuracy note:** The "Quick Reference" table at the bottom has a "v2 Impact" column that uses "Low (path update)" and "Medium (v2 fields)" -- these are contextual notes from when v2 was being designed. They are informational and not harmful, but could be cleaned up for clarity.

---

## 6. Risk Flags

| Risk | Impact | Recommendation |
|------|--------|----------------|
| **checkpoints.md not on CONTEXT.md keep list but has 5 active callers** | Would break executor, execute-phase, execute-plan, plan-phase, phase-prompt if deleted | Add to keep list. This is a clear omission in the CONTEXT.md keep list. |
| **framing-lenses.md not on keep list but has 7 active callers** | Would break all 4 framing commands plus framing-discovery and framing-pipeline | Add to keep list. Same omission. |
| **escalation-protocol.md not on keep list but has 1 active caller** | Would break framing-pipeline.md | Add to keep list. Single caller but critical pipeline component. |
| **git-integration.md not on keep list but has 1 active caller** | Would break execute-plan.md commit patterns | Add to keep list. |
| **continuation-format.md not on keep list but has 1 active caller** | Would break resume-work.md | Add to keep list, but update v1 language. |
| **verification-patterns.md not on keep list but has 1 active caller** | Would break verify-phase.md | Add to keep list. |
| **phase-argument-parsing.md not on keep list but has 1 active caller** | Would break research-phase.md | Add to keep list. |
| **core.cjs MODEL_PROFILES table references deleted agents** | Nonfunctional dead entries; no runtime error (just unused lookups) | Low risk. Clean up during model-profiles update pass. |
| **continuation-format.md uses v1 phase commands throughout** | Stale examples but functional format | Update examples to v2 capability/feature language. |

**Key finding:** The CONTEXT.md keep list (5 docs) significantly underestimates the actual number of actively-referenced docs. The full keep list should be **12 docs**, not 5. Only 3 docs have zero v2 callers and should be deleted.

---

*Audit completed: 2026-03-01*
*Requirement: CLN-05 (Holistic reference audit)*
